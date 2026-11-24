// src/app/api/v1/vocabulary/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getUserVocabularyService } from "@/services/vocabulary.service";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const language = url.searchParams.get("language") || undefined;
    const sort = (url.searchParams.get("sort") as "asc" | "desc") || "asc";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const res = await getUserVocabularyService(auth.userId, {
      search,
      language,
      sort,
      page,
      limit,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: res.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ khi tải từ vựng." },
      { status: 500 }
    );
  }
}

