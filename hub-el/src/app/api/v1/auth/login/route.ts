import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Vui lòng nhập đầy đủ Email và Mật khẩu!",
          },
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email hoặc mật khẩu không chính xác!",
          },
        },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email hoặc mật khẩu không chính xác!",
          },
        },
        { status: 401 }
      );
    }

    if (user.role === "BANNED" || user.role === "banned" || user.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_BANNED",
            message: "Tài khoản của bạn đã bị khóa bởi quản trị viên!",
          },
        },
        { status: 403 }
      );
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.fullName,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Sanitize user: omit password
    const { password: _, ...safeUser } = user;

    if ((global as any).__socketIo) {
      (global as any).__socketIo.to(user.id).emit("session_kicked", {
        source: "mobile",
        message: "Tài khoản của bạn vừa được đăng nhập trên ứng dụng Mobile. Vui lòng xác nhận để đăng xuất.",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/auth/login Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Đã có lỗi máy chủ xảy ra.",
        },
      },
      { status: 500 }
    );
  }
}

