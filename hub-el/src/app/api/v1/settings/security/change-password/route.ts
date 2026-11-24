// src/app/api/v1/settings/security/change-password/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { changePasswordService } from "@/services/settings.service";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập mật khẩu cũ và mật khẩu mới." },
        { status: 400 }
      );
    }

    const res = await changePasswordService(auth.userId, oldPassword, newPassword);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi đổi mật khẩu." },
      { status: 500 }
    );
  }
}

