// src/app/api/v1/store/momo/create/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createMoMoPaymentService } from "@/services/store.service";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { type, amount, name, redirectUrl } = body;

    const res = await createMoMoPaymentService(auth.userId, {
      type,
      amount,
      name,
      redirectUrl,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: res.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tạo thanh toán MoMo." },
      { status: 500 }
    );
  }
}

