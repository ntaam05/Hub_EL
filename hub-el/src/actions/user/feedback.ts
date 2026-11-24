// src/actions/user/feedback.ts
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { submitFeedbackService } from "@/services/settings.service";

// USER GỬI GÓP Ý
export async function submitFeedbackAction(data: {
  userId?: string;
  userName?: string;
  content: string;
}) {
  return await submitFeedbackService(data.userId || null, data.userName || null, data.content);
}

// ADMIN LẤY DANH SÁCH GÓP Ý
export async function getFeedbacksAction() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: feedbacks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ADMIN ĐÁNH DẤU LÀ "ĐÃ ĐỌC"
export async function markFeedbackReadAction(id: number) {
  try {
    await prisma.feedback.update({
      where: { id },
      data: { status: "READ" },
    });
    revalidatePath("/admin/feedback");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
