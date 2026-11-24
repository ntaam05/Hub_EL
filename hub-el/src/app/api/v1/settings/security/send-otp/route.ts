// src/app/api/v1/settings/security/send-otp/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { sendSecurityOtpService } from "@/services/settings.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    // Lấy email chính chủ từ tài khoản đã xác thực bằng JWT
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

    const res = await sendSecurityOtpService(user.email);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi gửi mã OTP." },
      { status: 500 }
    );
  }
}
