"use server";

import { prisma } from "@/lib/prisma";

export async function syncStudyTimeAction(userId: string, secondsWatched: number) {
  try {
    if (!userId || secondsWatched <= 0) return { success: false };

    // Cập nhật hoặc tạo mới thông kê tổng thời gian học (cộng dồn số giây)
    await prisma.user.update({
      where: { id: userId },
      data: {
        stats: {
          upsert: {
            update: { totalStudySeconds: { increment: secondsWatched } },
            create: { totalStudySeconds: secondsWatched }
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Lỗi đồng bộ thời gian học:", error);
    return { success: false };
  }
}