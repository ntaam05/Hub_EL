// src/actions/vocabulary.ts
"use server";
import { getUserVocabularyService } from "@/services/vocabulary.service";

export async function getUserVocabulary(userId: string) {
  try {
    const res = await getUserVocabularyService(userId, { limit: 1000 });
    if (!res.success || !res.data) {
      return { success: false, message: res.error || "Lỗi hệ thống khi tải từ vựng." };
    }
    return { success: true, data: res.data.items };
  } catch (error: any) {
    console.error("Lỗi lấy từ vựng action:", error);
    return { success: false, message: "Lỗi hệ thống khi tải từ vựng." };
  }
}
