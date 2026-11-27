import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { generateNextAdaptiveQuestionAction } from "@/actions/quiz/ai";

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

// POST /api/v1/videos/quiz/next
export async function POST(req: Request) {
  try {
    const { userId, errorResponse } = extractUserId(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { videoId, difficultyLevel = 2, previousQuestions = [] } = body;

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

    const result = await generateNextAdaptiveQuestionAction(
      userId!,
      videoId,
      Number(difficultyLevel) || 2,
      Array.isArray(previousQuestions) ? previousQuestions.map(String) : []
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NEXT_QUESTION_FAILED",
            message: result.error || "Không thể tạo câu hỏi tiếp theo.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        question: result.data,
        difficultyLevel: result.difficultyLevel,
      },
    });
  } catch (error: any) {
    console.error("POST /api/v1/videos/quiz/next Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi tạo câu hỏi tiếp theo.",
        },
      },
      { status: 500 }
    );
  }
}
