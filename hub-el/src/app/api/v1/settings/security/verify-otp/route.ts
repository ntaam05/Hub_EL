// src/app/api/v1/settings/security/verify-otp/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { verifySecurityOtpService } from "@/services/settings.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập mã OTP." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, error: "Tài khoản không tìm thấy email hợp lệ." },
        { status: 400 }
      );
    }

    const res = await verifySecurityOtpService(user.email, code);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xác thực mã OTP." },
      { status: 500 }
    );
  }
}
