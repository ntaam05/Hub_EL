import { NextResponse } from "next/server";
import { sendResetPasswordCodeAction } from "@/actions/auth/reset";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Vui lòng nhập địa chỉ Email!",
          },
        },
        { status: 400 }
      );
    }

    const result = await sendResetPasswordCodeAction(email.trim().toLowerCase());

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: result.error || "Gửi mã thất bại. Vui lòng kiểm tra lại email!",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Mã xác nhận OTP đã được gửi vào email của bạn!",
    });
  } catch (error: any) {
    console.error("API /api/v1/auth/forgot-password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi gửi mã khôi phục mật khẩu.",
        },
      },
      { status: 500 }
    );
  }
}

