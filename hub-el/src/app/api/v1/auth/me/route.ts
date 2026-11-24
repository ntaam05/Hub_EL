import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { syncUserStatus } from "@/lib/user-sync";
import { getMaxEnergy } from "@/lib/leveling";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Thiếu Bearer Token trong Authorization Header!",
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.message === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            message: err.message === "TOKEN_EXPIRED" ? "Phiên đăng nhập đã hết hạn!" : "Token xác thực không hợp lệ!",
          },
        },
        { status: 401 }
      );
    }

    // Đồng bộ trạng thái user (chuỗi streak đứt ngày hôm qua, năng lượng vượt trần)
    await syncUserStatus(decoded.id);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        stats: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "Không tìm thấy thông tin tài khoản người dùng!",
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

    const maxEnergy = getMaxEnergy(user.level, user.isPro);
    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...safeUser,
          maxEnergy,
        },
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/auth/me Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi lấy thông tin người dùng.",
        },
      },
      { status: 500 }
    );
  }
}

