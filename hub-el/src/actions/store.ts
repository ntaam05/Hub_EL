// src/actions/store.ts
"use server";
import { auth } from "@/lib/auth";
import { exchangeResourcesService } from "@/services/store.service";

export async function exchangeResources(type: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Chưa đăng nhập" };
    const res = await exchangeResourcesService(session.user.id, type);
    if (!res.success) {
      return { success: false, message: res.error || "Giao dịch thất bại" };
    }
    return {
      success: true,
      message: res.message || "Giao dịch thành công!",
      data: res.data,
    };
  } catch (error) {
    return { success: false, message: "Lỗi hệ thống" };
  }
}
