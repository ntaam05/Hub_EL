// src/actions/wiki.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function getWikiCardDetail(cardId: number) {
  try {
    const card = await prisma.wikiCard.findUnique({
      where: { id: cardId }
    });

    if (!card) return { success: false, message: "Không tìm thấy thẻ bài." };
    
    return { success: true, data: card };
  } catch (error: any) {
    return { success: false, message: `Lỗi Server: ${error.message}` };
  }
}