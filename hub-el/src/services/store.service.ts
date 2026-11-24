// src/services/store.service.ts
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getMaxEnergy } from "@/lib/leveling";

export const EXCHANGE_RULES: Record<
  string,
  {
    name: string;
    costField: "premiumCoins" | "freeCoins";
    cost: number;
    rewardField: "aiTokens" | "freeCoins";
    reward: number;
    errorMsg: string;
  }
> = {
  GEM_TO_ENERGY: {
    name: "Đổi Ngọc sang Năng lượng AI",
    costField: "premiumCoins",
    cost: 50,
    rewardField: "aiTokens",
    reward: 50,
    errorMsg: "Không đủ Ngọc (Cần 50 Ngọc)",
  },
  GEM_TO_COIN: {
    name: "Đổi Ngọc sang Xu Gacha",
    costField: "premiumCoins",
    cost: 100,
    rewardField: "freeCoins",
    reward: 1000,
    errorMsg: "Không đủ Ngọc (Cần 100 Ngọc)",
  },
  COIN_TO_ENERGY: {
    name: "Đổi Xu sang Năng lượng AI",
    costField: "freeCoins",
    cost: 200,
    rewardField: "aiTokens",
    reward: 10,
    errorMsg: "Không đủ Xu (Cần 200 Xu)",
  },
};

export const VIP_PLANS = [
  {
    id: "VIP_1M",
    name: "Gói 1 Tháng",
    days: 30,
    amount: 49000,
    features: [
      "Năng lượng tối đa +50",
      "Giảm 30% phí tạo AI Quiz",
      "Tốc độ nhận XP & Xu +20%",
      "Bụi sao nhận được +20%",
      "1 Lượt quay Gacha Free/ngày",
      "Khung Chat Vàng & Tag PRO",
    ],
  },
  {
    id: "VIP_6M",
    name: "Gói 6 Tháng",
    days: 180,
    amount: 249000,
    features: [
      "Tiết kiệm 15%",
      "Tất cả đặc quyền VIP",
      "Tặng 2 thẻ đóng băng chuỗi",
    ],
  },
  {
    id: "VIP_12M",
    name: "Gói 1 Năm",
    days: 365,
    amount: 399000,
    features: [
      "Tiết kiệm 32%",
      "Tất cả đặc quyền VIP",
      "Tặng 5 thẻ đóng băng chuỗi",
    ],
  },
];

export const COIN_PACKAGES = [
  { id: "COIN_20K", name: "Túi Ngọc Nhỏ", amount: 20000, coins: 200 },
  { id: "COIN_50K", name: "Túi Ngọc Vừa", amount: 50000, coins: 525 },
  { id: "COIN_100K", name: "Rương Ngọc", amount: 100000, coins: 1100 },
  { id: "COIN_200K", name: "Kho Ngọc", amount: 200000, coins: 2300 },
  { id: "COIN_500K", name: "Đại Kho Ngọc", amount: 500000, coins: 6000 },
];

export const VIP_DAYS_MAP: Record<number, number> = {
  49000: 30,
  249000: 180,
  399000: 365,
};

export const COINS_MAP: Record<number, number> = {
  20000: 200,
  50000: 525,
  100000: 1100,
  200000: 2300,
  500000: 6000,
};

export async function getStoreCatalogService(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        freeCoins: true,
        aiTokens: true,
        premiumCoins: true,
        stardust: true,
        isPro: true,
        premiumExpiresAt: true,
        level: true,
      },
    });

    if (!user) {
      return { success: false, error: "Người dùng không tồn tại." };
    }

    const maxEnergy = getMaxEnergy(user.level, user.isPro);

    return {
      success: true,
      data: {
        balance: {
          freeCoins: user.freeCoins,
          aiTokens: user.aiTokens,
          premiumCoins: user.premiumCoins,
          stardust: user.stardust,
          isPro: user.isPro,
          level: user.level,
          maxEnergy,
          premiumExpiresAt: user.premiumExpiresAt,
        },
        exchangeRules: Object.entries(EXCHANGE_RULES).map(([key, val]) => ({
          type: key,
          name: val.name,
          costField: val.costField,
          cost: val.cost,
          rewardField: val.rewardField,
          reward: val.reward,
        })),
        vipPlans: VIP_PLANS,
        coinPackages: COIN_PACKAGES,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tải kho hàng." };
  }
}

// In-memory idempotency cache for transactions (prevents duplicate charges on network retries)
const idempotencyCache = new Map<string, { timestamp: number; result: any }>();

function cleanupIdempotencyCache() {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) {
      idempotencyCache.delete(key);
    }
  }
}

export async function exchangeResourcesService(
  userId: string,
  type: string,
  idempotencyKey?: string
) {
  try {
    if (!userId) return { success: false, error: "Chưa đăng nhập." };

    cleanupIdempotencyCache();

    // Check idempotency key if provided by client
    if (idempotencyKey) {
      const cacheKey = `${userId}:${idempotencyKey}`;
      const cached = idempotencyCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60 * 1000) {
        return cached.result;
      }
    }

    const rule = EXCHANGE_RULES[type];
    if (!rule) {
      return { success: false, error: "Loại giao dịch không hợp lệ." };
    }

    const result = await prisma.$transaction(async (tx) => {
      // ATOMIC UPDATE: Check balance and decrement in a single statement with row lock
      const updateResult = await tx.user.updateMany({
        where: {
          id: userId,
          [rule.costField]: { gte: rule.cost },
        },
        data: {
          [rule.costField]: { decrement: rule.cost },
          [rule.rewardField]: { increment: rule.reward },
        },
      });

      if (updateResult.count === 0) {
        return { success: false, error: rule.errorMsg };
      }

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          freeCoins: true,
          aiTokens: true,
          premiumCoins: true,
        },
      });

      // Strict atomicity: coin transaction log MUST be recorded, or transaction rolls back
      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -rule.cost,
          currencyType: rule.costField === "premiumCoins" ? "PREMIUM" : "FREE",
          reason: `Đổi ${rule.name}`,
        },
      });

      return {
        success: true,
        message: "Giao dịch thành công!",
        data: {
          type,
          costField: rule.costField,
          cost: rule.cost,
          rewardField: rule.rewardField,
          reward: rule.reward,
          updatedBalances: updatedUser,
        },
      };
    });

    if (idempotencyKey && result.success) {
      idempotencyCache.set(`${userId}:${idempotencyKey}`, {
        timestamp: Date.now(),
        result,
      });
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi hệ thống khi giao dịch." };
  }
}

export async function createMoMoPaymentService(
  userId: string,
  data: {
    type: "VIP" | "COIN";
    amount: number;
    name?: string;
    redirectUrl?: string;
  }
) {
  try {
    const { type, amount, name, redirectUrl } = data;

    if (!type || !amount) {
      return { success: false, error: "Thiếu thông tin gói thanh toán." };
    }

    // Xác minh giá tiền hợp lệ trên Server để chống giả mạo giá tiền
    if (type === "VIP") {
      const validPlan = VIP_PLANS.find((p) => p.amount === Number(amount));
      if (!validPlan) {
        return { success: false, error: "Gói VIP không hợp lệ." };
      }
    } else if (type === "COIN") {
      const validPkg = COIN_PACKAGES.find((p) => p.amount === Number(amount));
      if (!validPkg) {
        return { success: false, error: "Gói nạp Ngọc không hợp lệ." };
      }
    } else {
      return { success: false, error: "Loại giao dịch không hỗ trợ." };
    }

    const orderId = `HUBEL_${Date.now()}_${userId.slice(-4)}`;
    const numAmount = String(amount);

    await prisma.order.create({
      data: {
        orderCode: orderId,
        userId,
        amount: Number(amount),
        type,
        status: "PENDING",
      },
    });

    const partnerCode =
      process.env.MOMO_PARTNER_CODE && process.env.MOMO_PARTNER_CODE !== "MOMOIQA420180417"
        ? process.env.MOMO_PARTNER_CODE
        : "MOMO";
    const accessKey =
      process.env.MOMO_ACCESS_KEY && process.env.MOMO_ACCESS_KEY !== "SvDmj2cOTYZmQQ3H"
        ? process.env.MOMO_ACCESS_KEY
        : "F8BBA842ECF85";
    const secretKey =
      process.env.MOMO_SECRET_KEY && process.env.MOMO_SECRET_KEY !== "PPuDXq1KowPT1ftR8DvlQTHhC03aul17"
        ? process.env.MOMO_SECRET_KEY
        : "K951B6PE1waDMi640xX08PD3vg6EkVlz";

    const domain = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const momoRedirect = redirectUrl || `${domain}/store?status=success`;
    const ipnUrl = `${domain}/api/momo/callback`;
    const requestType = "payWithMethod";
    const extraData = "";
    const orderInfo = "pay with MoMo";

    const rawSignature =
      "accessKey=" +
      accessKey +
      "&amount=" +
      numAmount +
      "&extraData=" +
      extraData +
      "&ipnUrl=" +
      ipnUrl +
      "&orderId=" +
      orderId +
      "&orderInfo=" +
      orderInfo +
      "&partnerCode=" +
      partnerCode +
      "&redirectUrl=" +
      momoRedirect +
      "&requestId=" +
      orderId +
      "&requestType=" +
      requestType;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      accessKey,
      requestId: orderId,
      amount: numAmount,
      orderId,
      orderInfo,
      redirectUrl: momoRedirect,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    const momoEndpoint =
      process.env.MOMO_ENDPOINT ||
      "https://test-payment.momo.vn/v2/gateway/api/create";

    const result = await fetch(momoEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const momoRes = await result.json();

    if (momoRes.resultCode === 0) {
      return {
        success: true,
        data: {
          orderId,
          payUrl: momoRes.payUrl,
          deeplink: momoRes.deeplink || momoRes.payUrl,
          qrCodeUrl: momoRes.qrCodeUrl,
        },
      };
    } else {
      return {
        success: false,
        error: momoRes.message || "Không thể tạo liên kết thanh toán MoMo.",
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi kết nối cổng thanh toán MoMo.",
    };
  }
}

export async function queryMoMoGatewayStatus(orderCode: string): Promise<{
  resultCode: number;
  message: string;
  transId?: number | string;
}> {
  const partnerCode =
    process.env.MOMO_PARTNER_CODE && process.env.MOMO_PARTNER_CODE !== "MOMOIQA420180417"
      ? process.env.MOMO_PARTNER_CODE
      : "MOMO";
  const accessKey =
    process.env.MOMO_ACCESS_KEY && process.env.MOMO_ACCESS_KEY !== "SvDmj2cOTYZmQQ3H"
      ? process.env.MOMO_ACCESS_KEY
      : "F8BBA842ECF85";
  const secretKey =
    process.env.MOMO_SECRET_KEY && process.env.MOMO_SECRET_KEY !== "PPuDXq1KowPT1ftR8DvlQTHhC03aul17"
      ? process.env.MOMO_SECRET_KEY
      : "K951B6PE1waDMi640xX08PD3vg6EkVlz";

  const rawSignature = `accessKey=${accessKey}&orderId=${orderCode}&partnerCode=${partnerCode}&requestId=${orderCode}`;
  const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

  const queryEndpoint =
    process.env.MOMO_QUERY_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/query";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(queryEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerCode,
        requestId: orderCode,
        orderId: orderCode,
        signature,
        lang: "vi",
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    return {
      resultCode: Number(data.resultCode),
      message: data.message || "",
      transId: data.transId,
    };
  } catch (err: any) {
    return {
      resultCode: -1,
      message: err.message || "Lỗi kết nối cổng truy vấn MoMo.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkMoMoPaymentStatusService(
  orderId: string,
  userId?: string,
  options?: { testBypassMoMoQuery?: boolean }
) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        orderCode: orderId,
        ...(userId ? { userId } : {}),
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu.",
      };
    }

    if (order.status === "SUCCESS") {
      return {
        success: true,
        message: "Đơn hàng đã được thanh toán thành công trước đó.",
        data: {
          orderCode: order.orderCode,
          status: "SUCCESS",
          amount: order.amount,
          type: order.type,
        },
      };
    }

    if (order.status === "FAILED") {
      return {
        success: false,
        error: "Đơn hàng này đã bị hủy hoặc thất bại.",
      };
    }

    // Kiểm tra đơn hàng hết hạn (24 giờ)
    const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
    if (orderAgeMs > 24 * 60 * 60 * 1000) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      return {
        success: false,
        error: "Đơn hàng đã hết thời gian hiệu lực (hết hạn 24 giờ).",
      };
    }

    // Xác minh trạng thái giao dịch thực tế từ cổng MoMo
    let isPaymentVerified = false;
    let momoTransId: string | undefined;

    if (options?.testBypassMoMoQuery) {
      isPaymentVerified = true;
    } else {
      const momoStatus = await queryMoMoGatewayStatus(order.orderCode);
      if (momoStatus.resultCode === 0) {
        isPaymentVerified = true;
        momoTransId = momoStatus.transId ? String(momoStatus.transId) : undefined;
      } else if (momoStatus.resultCode === 1000) {
        return {
          success: false,
          error: "Giao dịch đang chờ thanh toán trên cổng MoMo. Vui lòng hoàn tất thanh toán.",
        };
      } else {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });
        return {
          success: false,
          error: momoStatus.message || "Giao dịch không thành công hoặc đã bị người dùng hủy.",
        };
      }
    }

    if (!isPaymentVerified) {
      return {
        success: false,
        error: "Giao dịch chưa được xác nhận bởi cổng thanh toán MoMo.",
      };
    }

    return await prisma.$transaction(async (tx) => {
      // Optimistic locking on status to avoid double fulfillment
      const updateCount = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: {
          status: "SUCCESS",
          ...(momoTransId ? { momoTransId } : {}),
        },
      });

      if (updateCount.count === 0) {
        return {
          success: true,
          message: "Đơn hàng đã được xử lý thành công trước đó.",
          data: {
            orderCode: order.orderCode,
            status: "SUCCESS",
            amount: order.amount,
            type: order.type,
          },
        };
      }

      let updatedBalances: any = {};

      if (order.type === "VIP") {
        const user = await tx.user.findUnique({
          where: { id: order.userId },
          select: { premiumExpiresAt: true },
        });

        const daysToAdd = VIP_DAYS_MAP[Number(order.amount)] || 30;
        const now = new Date();
        const currentExpire =
          user?.premiumExpiresAt && user.premiumExpiresAt > now
            ? new Date(user.premiumExpiresAt)
            : now;

        const newExpireDate = new Date(
          currentExpire.getTime() + daysToAdd * 24 * 60 * 60 * 1000
        );

        let freezeBonus = 0;
        if (order.amount === 249000) freezeBonus = 2;
        if (order.amount === 399000) freezeBonus = 5;

        const updated = await tx.user.update({
          where: { id: order.userId },
          data: {
            isPro: true,
            premiumExpiresAt: newExpireDate,
            ...(freezeBonus > 0 ? { streakFreezes: { increment: freezeBonus } } : {}),
          },
          select: {
            isPro: true,
            premiumExpiresAt: true,
            streakFreezes: true,
          },
        });
        updatedBalances = updated;
      } else if (order.type === "COIN") {
        let coinsToGive = COINS_MAP[Number(order.amount)] || Number(order.amount) / 100;

        const updated = await tx.user.update({
          where: { id: order.userId },
          data: { premiumCoins: { increment: coinsToGive } },
          select: {
            premiumCoins: true,
          },
        });

        await tx.coinTransaction.create({
          data: {
            userId: order.userId,
            amount: coinsToGive,
            currencyType: "PREMIUM",
            reason: `Nạp ${order.amount.toLocaleString("vi-VN")}đ qua MoMo`,
          },
        });

        updatedBalances = updated;
      }

      return {
        success: true,
        message: "Xác thực đơn hàng thành công! Tài khoản đã được nâng cấp.",
        data: {
          orderCode: order.orderCode,
          status: "SUCCESS",
          amount: order.amount,
          type: order.type,
          updatedBalances,
        },
      };
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi xử lý đối soát trạng thái đơn hàng.",
    };
  }
}

export async function processMoMoIpnCallbackService(body: any) {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body;

    const secretKey =
      process.env.MOMO_SECRET_KEY && process.env.MOMO_SECRET_KEY !== "PPuDXq1KowPT1ftR8DvlQTHhC03aul17"
        ? process.env.MOMO_SECRET_KEY
        : "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const accessKey =
      process.env.MOMO_ACCESS_KEY && process.env.MOMO_ACCESS_KEY !== "SvDmj2cOTYZmQQ3H"
        ? process.env.MOMO_ACCESS_KEY
        : "F8BBA842ECF85";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const checkSignature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

    if (
      !signature ||
      signature.length !== checkSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(checkSignature))
    ) {
      return { success: false, status: 400, error: "Sai chữ ký bảo mật MoMo" };
    }

    const order = await prisma.order.findFirst({ where: { orderCode: orderId } });
    if (!order) {
      return { success: false, status: 404, error: "Đơn hàng không tồn tại" };
    }

    // Idempotency: duplicate callback does not double credit
    if (order.status === "SUCCESS") {
      return { success: true, status: 200, message: "Đơn hàng đã được ghi nhận trước đó" };
    }

    if (Number(resultCode) === 0) {
      return await prisma.$transaction(async (tx) => {
        const updateResult = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "SUCCESS", momoTransId: transId ? String(transId) : null },
        });

        if (updateResult.count === 0) {
          return { success: true, status: 200, message: "Đơn hàng đã được xử lý" };
        }

        if (order.type === "VIP") {
          const user = await tx.user.findUnique({
            where: { id: order.userId },
            select: { premiumExpiresAt: true },
          });

          const days = VIP_DAYS_MAP[Number(order.amount)] || 30;
          const now = new Date();
          const currentExpire =
            user?.premiumExpiresAt && user.premiumExpiresAt > now
              ? new Date(user.premiumExpiresAt)
              : now;
          const expireDate = new Date(currentExpire.getTime() + days * 24 * 60 * 60 * 1000);

          let freezeBonus = 0;
          if (order.amount === 249000) freezeBonus = 2;
          if (order.amount === 399000) freezeBonus = 5;

          await tx.user.update({
            where: { id: order.userId },
            data: {
              isPro: true,
              premiumExpiresAt: expireDate,
              ...(freezeBonus > 0 ? { streakFreezes: { increment: freezeBonus } } : {}),
            },
          });
        } else if (order.type === "COIN") {
          const coinsToGive = COINS_MAP[Number(order.amount)] || Number(order.amount) / 100;
          await tx.user.update({
            where: { id: order.userId },
            data: { premiumCoins: { increment: coinsToGive } },
          });

          await tx.coinTransaction.create({
            data: {
              userId: order.userId,
              amount: coinsToGive,
              currencyType: "PREMIUM",
              reason: `Nạp ${order.amount.toLocaleString("vi-VN")}đ qua MoMo`,
            },
          });
        }

        return { success: true, status: 200, message: "Xử lý IPN thành công" };
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      return { success: true, status: 200, message: "Đã cập nhật trạng thái thất bại" };
    }
  } catch (err: any) {
    return { success: false, status: 500, error: err.message || "Lỗi xử lý IPN" };
  }
}

export async function getUserTransactionsService(userId: string, limit = 20) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        orderCode: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    const coinTransactions = await prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        amount: true,
        currencyType: true,
        reason: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: {
        orders,
        coinTransactions,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi tải lịch sử giao dịch.",
    };
  }
}
