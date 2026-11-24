// src/app/api/v1/store/momo/check-status/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { checkMoMoPaymentStatusService } from "@/services/store.service";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã đơn hàng (orderId)." },
        { status: 400 }
      );
    }

    const res = await checkMoMoPaymentStatusService(orderId, auth.userId);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi đối soát đơn hàng MoMo." },
      { status: 500 }
    );
  }
}

