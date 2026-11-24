"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail/mail";
import bcrypt from "bcryptjs"; // 🚨 Đã import thư viện bcryptjs

// 1. Tạo và Gửi mã OTP xác nhận về Email
export async function sendResetPasswordCodeAction(email: string) {
  try {
    // Kiểm tra xem email có tồn tại không
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, error: "Email không tồn tại trong hệ thống." };
    }

    // Sinh mã OTP 6 số ngẫu nhiên
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Mã có hiệu lực 15 phút

    // Xóa các mã cũ của email này (nếu có) để tránh trùng lặp
    await prisma.verificationCode.deleteMany({
      where: { email }
    });

    // Lưu mã mới vào DB
    await prisma.verificationCode.create({
      data: {
        email,
        code: otpCode,
        expiresAt
      }
    });

    // Gửi email
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb; margin-top: 0;">Khôi phục mật khẩu - Hub-EL</h2>
            <p>Xin chào <b>${user.name || 'bạn'}</b>,</p>
            <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác nhận dưới đây:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px;">${otpCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Mã này sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
    `;

    await sendEmail(email, "Mã khôi phục mật khẩu - Hub-EL", htmlContent);

    return { success: true, message: "Mã xác nhận đã được gửi đến email của bạn." };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống khi gửi mã." };
  }
}

// 2. Kiểm tra OTP trước khi cho phép nhập mật khẩu mới (BƯỚC BỔ SUNG)
export async function verifyResetCodeAction(email: string, code: string) {
  try {
    const verificationRecord = await prisma.verificationCode.findUnique({
      where: { email_code: { email, code } }
    });

    if (!verificationRecord) {
      return { success: false, error: "Mã xác nhận không hợp lệ hoặc không tồn tại." };
    }

    if (new Date() > verificationRecord.expiresAt) {
      return { success: false, error: "Mã xác nhận đã hết hạn." };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống khi kiểm tra mã xác nhận." };
  }
}

// 3. Xác nhận OTP và đặt lại mật khẩu mới (ĐÃ TÍCH HỢP BCRYPTJS)
export async function resetPasswordAction(email: string, code: string, newPassword: string) {
  try {
    const verificationRecord = await prisma.verificationCode.findUnique({
      where: { email_code: { email, code } }
    });

    if (!verificationRecord) {
      return { success: false, error: "Mã xác nhận không hợp lệ." };
    }

    if (new Date() > verificationRecord.expiresAt) {
      return { success: false, error: "Mã xác nhận đã hết hạn." };
    }

    // 🚨 Băm mật khẩu mới bằng bcryptjs với độ khó salt = 10
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Lưu mật khẩu đã băm vào Database
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Xóa bản ghi OTP sau khi đổi mật khẩu thành công
    await prisma.verificationCode.delete({
      where: { id: verificationRecord.id }
    });

    return { success: true, message: "Đổi mật khẩu thành công!" };
  } catch (error: any) {
    return { success: false, error: "Đổi mật khẩu thất bại." };
  }
}