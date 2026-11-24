"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Lấy toàn bộ từ khóa
export async function getKeywordsAction() {
  try {
    const keywords = await prisma.filterKeyword.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: keywords };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Thêm từ khóa mới
export async function addKeywordAction(word: string, type: "BLACKLIST" | "WHITELIST") {
  try {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return { success: false, error: "Từ khóa không được để trống" };

    const exists = await prisma.filterKeyword.findUnique({ where: { word: cleanWord } });
    if (exists) return { success: false, error: "Từ khóa này đã tồn tại trong hệ thống!" };

    await prisma.filterKeyword.create({
      data: { word: cleanWord, type }
    });
    
    revalidatePath('/admin/keywords'); // Đổi lại đường dẫn admin của bạn nếu khác
    return { success: true, message: "Đã thêm từ khóa thành công" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Bật/Tắt trạng thái hoạt động của từ khóa
export async function toggleKeywordAction(id: number, currentStatus: boolean) {
  try {
    await prisma.filterKeyword.update({
      where: { id },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/admin/keywords');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Xóa vĩnh viễn từ khóa
export async function deleteKeywordAction(id: number) {
  try {
    await prisma.filterKeyword.delete({ where: { id } });
    revalidatePath('/admin/keywords');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}