// src/app/api/v1/vocabulary/context/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getVocabularyContextService } from "@/services/vocabulary.service";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(req.url);
    const cardIdStr = url.searchParams.get("cardId");
    const targetWord = url.searchParams.get("word") || url.searchParams.get("targetWord");

    if (!cardIdStr || !targetWord) {
      return NextResponse.json(
        { success: false, error: "Thiếu cardId hoặc từ mục tiêu (word)." },
        { status: 400 }
      );
    }

    const cardId = parseInt(cardIdStr, 10);
    const res = await getVocabularyContextService(auth.userId, cardId, targetWord);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: res.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tải ngữ cảnh từ vựng." },
      { status: 500 }
    );
  }
}

