import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Business rule: Đưa bảng quy đổi ra ngoài global scope để RAM không phải khởi tạo lại object mỗi lần có request tới.
const VIP_DAYS_MAP: Record<number, number> = {
  49000: 30,
  249000: 180,
  399000: 365,
};

const COINS_MAP: Record<number, number> = {
  20000: 200,
  50000: 525,
  100000: 1100,
  200000: 2300,
  500000: 6000,
};

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    const order = await prisma.order.findFirst({
      where: { orderCode: orderId, status: 'PENDING' }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Đơn hàng không tồn tại hoặc đã xử lý" });
    }

    // Cảnh báo side effect: Gom chung việc đổi trạng thái đơn và cộng tài nguyên vào transaction. Nếu logic cộng lỗi, trạng thái đơn sẽ tự rollback về PENDING.
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'SUCCESS' }
      });

      if (order.type === 'VIP') {
        const user = await tx.user.findUnique({
          where: { id: order.userId },
          select: { premiumExpiresAt: true }
        });

        const daysToAdd = VIP_DAYS_MAP[Number(order.amount)] || 30;
        const now = new Date();
        
        // Logic: Tính toán cộng dồn hạn VIP. So sánh mốc hiện tại và hạn cũ, lấy mốc lớn hơn để cộng số ngày mua mới vào.
        const currentExpire = (user?.premiumExpiresAt && user.premiumExpiresAt > now) 
          ? new Date(user.premiumExpiresAt) 
          : now;
        
        const newExpireDate = new Date(currentExpire.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));

        await tx.user.update({
          where: { id: order.userId },
          data: { 
            isPro: true, 
            premiumExpiresAt: newExpireDate 
          }
        });
      } 
      else if (order.type === 'COIN') {
        const coinsToAdd = COINS_MAP[Number(order.amount)] || 0;

        if (coinsToAdd > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { 
              premiumCoins: { increment: coinsToAdd } 
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("LỖI CHECK STATUS:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}