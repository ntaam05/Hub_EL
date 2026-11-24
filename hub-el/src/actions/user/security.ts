// src/actions/user/security.ts
"use server";
import {
  getSecurityInfoService,
  sendSecurityOtpService,
  verifySecurityOtpService,
  changePasswordService,
  resetPasswordWithOtpService,
} from "@/services/settings.service";

export async function getSecurityInfoAction(userId: string) {
  return await getSecurityInfoService(userId);
}

export async function sendOtpAction(email: string) {
  return await sendSecurityOtpService(email);
}

export async function verifyOtpAction(email: string, code: string) {
  return await verifySecurityOtpService(email, code);
}

export async function changePasswordAction(
  userId: string,
  oldPass: string,
  newPass: string
) {
  return await changePasswordService(userId, oldPass, newPass);
}

export async function resetPasswordAction(
  email: string,
  code: string,
  newPass: string
) {
  return await resetPasswordWithOtpService(email, code, newPass);
}

export async function changeEmailAction(
  userId: string,
  newEmail: string,
  code: string
) {
  return { success: false, error: "Đổi email cần liên hệ ban quản trị để xác minh danh tính." };
}
