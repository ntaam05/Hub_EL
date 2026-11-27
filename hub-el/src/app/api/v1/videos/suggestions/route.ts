import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getSearchSuggestionsAction } from "@/actions/video/video";

export async function GET(req: Request) {
  try {
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = verifyToken(authHeader.substring(7).trim());
        userId = decoded?.id;
      } catch {
        // Cho phép tiếp tục với gợi ý chung nếu token không hợp lệ
      }
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const result = await getSearchSuggestionsAction(userId, query);

    return NextResponse.json({
      success: true,
      data: {
        history: result.history || [],
        suggestions: result.suggestions || [],
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/videos/suggestions Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi lấy gợi ý tìm kiếm.",
        },
      },
      { status: 500 }
    );
  }
}
