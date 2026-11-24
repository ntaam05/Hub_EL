// src/lib/mail.ts
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { 
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS 
  },
});

export async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    await transporter.sendMail({
      from: `"Hub-EL" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    });
    return true;
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    return false;
  }
}