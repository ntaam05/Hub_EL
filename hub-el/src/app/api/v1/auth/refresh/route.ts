import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Vui lòng cung cấp Refresh Token!",
          },
        },
        { status: 400 }
      );
    }

    let decoded: any;
    try {
      decoded = verifyToken(refreshToken);
      if (decoded.type !== "refresh") {
        throw new Error("NOT_REFRESH_TOKEN");
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REFRESH_TOKEN",
            message: "Refresh Token không hợp lệ hoặc đã hết hạn!",
          },
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "Tài khoản không tồn tại trong hệ thống!",
          },
        },
        { status: 404 }
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

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    return NextResponse.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/auth/refresh Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi làm mới token.",
        },
      },
      { status: 500 }
    );
  }
}

