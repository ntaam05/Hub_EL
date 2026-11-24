"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mail/mail"; // 🚨 IMPORT HÀM GỬI MAIL MỚI

// 1. Hàm Gửi OTP
export async function sendRegisterOtpAction(email: string) {
  try {
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return { success: false, error: "Email này đã được sử dụng!" };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

    await prisma.verificationCode.create({
      data: { email, code: otp, expiresAt }
    });

    // 🚨 GỌI HÀM TỪ FILE MAIL.TS
    const emailSent = await sendEmail(
      email,
      "Mã xác thực đăng ký Hub-EL",
      `<h2>Mã xác thực của bạn là: <b style="color: blue;">${otp}</b></h2><p>Mã này sẽ hết hạn sau 5 phút.</p>`
    );

    if (!emailSent) return { success: false, error: "Không thể gửi email, vui lòng kiểm tra lại cấu hình Nodemailer!" };

    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống khi gửi mã!" };
  }
}

// 2. Hàm Xác minh OTP & Tạo tài khoản
export async function verifyOtpAndRegisterAction(data: { email: string, code: string, name: string, password: string }) {
  try {
    const validCode = await prisma.verificationCode.findFirst({
      where: { email: data.email, code: data.code, expiresAt: { gt: new Date() } }
    });

    if (!validCode) return { success: false, error: "Mã xác thực không đúng hoặc đã hết hạn!" };

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const safePrefix = data.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const bulletproofUsername = `${safePrefix}_${Date.now()}`;

    await prisma.user.create({
      data: { 
        email: data.email, 
        name: data.name, 
        password: hashedPassword,
        username: bulletproofUsername 
      }
    });

    await prisma.verificationCode.deleteMany({ where: { email: data.email } });
    return { success: true };
  } catch (error: any) {
    console.error("🔥 LỖI TẠO TÀI KHOẢN:", error);
    return { success: false, error: error.message || "Lỗi hệ thống khi tạo tài khoản!" };
  }
}

// 3. Hàm Lưu Sở thích sau khi tạo tài khoản thành công
export async function updateUserInterestsAction(email: string, interests: string[]) {
  try {
    await prisma.user.update({
      where: { email: email },
      data: { interests: JSON.stringify(interests) }
    });
    return { success: true };
  } catch (error: any) {
    console.error("🔥 LỖI LƯU SỞ THÍCH:", error);
    return { success: false, error: "Không thể lưu sở thích!" };
  }
}