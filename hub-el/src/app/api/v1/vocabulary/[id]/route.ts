// src/app/api/v1/vocabulary/[id]/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getVocabularyDetailService } from "@/services/vocabulary.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const vocabId = parseInt(id, 10);

    if (isNaN(vocabId)) {
      return NextResponse.json(
        { success: false, error: "ID từ vựng không hợp lệ." },
        { status: 400 }
      );
    }

    const res = await getVocabularyDetailService(auth.userId, vocabId);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: res.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tra cứu từ vựng." },
      { status: 500 }
    );
  }
}

