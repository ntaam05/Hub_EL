// src/app/api/v1/settings/security/reset-password/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { resetPasswordWithOtpService } from "@/services/settings.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { code, newPassword } = body;

    if (!code || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã OTP hoặc mật khẩu mới." },
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

    const res = await resetPasswordWithOtpService(user.email, code, newPassword);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi đặt lại mật khẩu." },
      { status: 500 }
    );
  }
}
