import { NextResponse } from "next/server";
import { resetPasswordAction } from "@/actions/auth/reset";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Vui lòng nhập đầy đủ Email, Mã OTP và Mật khẩu mới!",
          },
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Mật khẩu mới phải có ít nhất 6 ký tự!",
          },
        },
        { status: 400 }
      );
    }

    const result = await resetPasswordAction(email.trim().toLowerCase(), code.trim(), newPassword);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RESET_FAILED",
            message: result.error || "Mã xác nhận không đúng hoặc đã hết hạn!",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Đổi mật khẩu thành công!",
    });
  } catch (error: any) {
    console.error("API /api/v1/auth/verify-reset-password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi đặt lại mật khẩu.",
        },
      },
      { status: 500 }
    );
  }
}

