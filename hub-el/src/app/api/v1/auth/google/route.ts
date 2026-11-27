import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, image } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Thiếu thông tin xác thực Google Email!",
          },
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
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
    } else {
      // Tạo tài khoản mới cho Google User
      const safePrefix = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      const bulletproofUsername = `${safePrefix}_${Date.now()}`;

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || safePrefix,
          fullName: name,
          image: image || null,
          username: bulletproofUsername,
          emailVerified: new Date(),
          freeCoins: 100,
          aiTokens: 20,
        },
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.fullName,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

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
    console.error("API /api/v1/auth/google Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi xác thực Google.",
        },
      },
      { status: 500 }
    );
  }
}

