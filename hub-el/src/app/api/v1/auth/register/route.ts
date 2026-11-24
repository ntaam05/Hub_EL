import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { sendEmail } from "@/lib/mail/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, code, action } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Vui lòng cung cấp địa chỉ Email!",
          },
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Kiểm tra Email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_EXISTS",
            message: "Email này đã được sử dụng trong hệ thống!",
          },
        },
        { status: 400 }
      );
    }

    // 2. Yêu cầu gửi OTP đăng ký
    if (action === "send_otp" || (!code && !password)) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

      // Xóa mã cũ
      await prisma.verificationCode.deleteMany({
        where: { email: normalizedEmail },
      });

      await prisma.verificationCode.create({
        data: {
          email: normalizedEmail,
          code: otp,
          expiresAt,
        },
      });

      // Gửi email
      await sendEmail(
        normalizedEmail,
        "Mã xác thực đăng ký Hub-EL",
        `<h2>Mã xác thực của bạn là: <b style="color: blue;">${otp}</b></h2><p>Mã này sẽ hết hạn sau 5 phút.</p>`
      );

      return NextResponse.json({
        success: true,
        message: "Mã OTP đã được gửi đến email của bạn.",
      });
    }

    // 3. Tiến hành Tạo tài khoản (Verify OTP nếu có, hoặc tạo trực tiếp)
    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Mật khẩu phải từ 6 ký tự trở lên!",
          },
        },
        { status: 400 }
      );
    }

    if (code) {
      const validCode = await prisma.verificationCode.findFirst({
        where: {
          email: normalizedEmail,
          code: code.trim(),
          expiresAt: { gt: new Date() },
        },
      });

      if (!validCode) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_OTP",
              message: "Mã xác thực OTP không đúng hoặc đã hết hạn!",
            },
          },
          { status: 400 }
        );
      }

      // Xóa OTP sau khi dùng
      await prisma.verificationCode.deleteMany({
        where: { email: normalizedEmail },
      });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 12);
    const safePrefix = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const bulletproofUsername = `${safePrefix}_${Date.now()}`;

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || safePrefix,
        fullName: name,
        password: hashedPassword,
        username: bulletproofUsername,
        freeCoins: 100, // Tặng 100 xu tân thủ
        aiTokens: 20,   // Tặng 20 năng lượng tân thủ
      },
    });

    const payload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const { password: _, ...safeUser } = newUser;

    return NextResponse.json({
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/auth/register Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Đã có lỗi máy chủ khi đăng ký tài khoản.",
        },
      },
      { status: 500 }
    );
  }
}

