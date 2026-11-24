"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. LẤY TẤT CẢ TAG SỞ THÍCH
export async function getInterestTagsAction() {
  try {
    const tags = await prisma.interestTag.findMany({
      orderBy: { name: "asc" }
    });
    return { success: true, data: tags };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. ADMIN THÊM SỞ THÍCH MỚI
export async function createInterestTagAction(name: string) {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) return { success: false, error: "Tên sở thích không được để trống" };

    await prisma.interestTag.create({
      data: { name: trimmedName }
    });

    revalidatePath("/admin/interests");
    return { success: true, message: "Đã thêm sở thích mới thành công!" };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Sở thích này đã tồn tại trên hệ thống!" };
    }
    return { success: false, error: error.message };
  }
}

// 3. ADMIN XÓA SỞ THÍCH
export async function deleteInterestTagAction(id: number) {
  try {
    await prisma.interestTag.delete({
      where: { id }
    });

    revalidatePath("/admin/interests");
    return { success: true, message: "Đã xóa sở thích thành công!" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
