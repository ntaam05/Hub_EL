import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getUserQuizHistoryAction } from "@/actions/quiz/attempt";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const res = await getUserQuizHistoryAction(auth.userId);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "Không thể tải lịch sử làm bài." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: res.data || [],
    });
  } catch (error: any) {
    console.error("API /api/v1/learning/quizzes/history error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ." },
      { status: 500 }
    );
  }
}

