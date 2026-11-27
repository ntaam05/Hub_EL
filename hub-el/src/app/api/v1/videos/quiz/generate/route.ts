import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { generateQuizFromVideoAction } from "@/actions/quiz/ai";

function extractUserId(req: Request): { userId: string | null; errorResponse: NextResponse | null } {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      userId: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Thiếu Bearer Token trong Authorization Header!",
          },
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded: any = verifyToken(token);
    return { userId: decoded.id, errorResponse: null };
  } catch (err: any) {
    return {
      userId: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: err.message === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            message: err.message === "TOKEN_EXPIRED" ? "Phiên đăng nhập đã hết hạn!" : "Token xác thực không hợp lệ!",
          },
        },
        { status: 401 }
      ),
    };
  }
}

// POST /api/v1/videos/quiz/generate
export async function POST(req: Request) {
  try {
    const { userId, errorResponse } = extractUserId(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { videoId, count = 5, mode } = body;

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_VIDEO_ID",
            message: "Thiếu trường videoId hợp lệ trong request body!",
          },
        },
        { status: 400 }
      );
    }

    const questionCount = Math.max(1, Math.min(20, Number(count) || 5));
    const isAdaptive = mode === "adaptive";

    const result = await generateQuizFromVideoAction(userId!, videoId, questionCount, isAdaptive);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "QUIZ_GENERATION_FAILED",
            message: result.error || "Không thể tạo bài tập AI từ video này.",
          },
        },
        { status: 400 }
      );
    }

    const questions = Array.isArray(result.data)
      ? result.data
      : (result.data as any)?.questions || [];

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        questionCount: questions.length,
        totalCount: result.totalCount ?? questionCount,
        difficultyLevel: result.difficultyLevel ?? 2,
        questions,
      },
    });
  } catch (error: any) {
    console.error("POST /api/v1/videos/quiz/generate Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi tạo bài tập AI.",
        },
      },
      { status: 500 }
    );
  }
}

