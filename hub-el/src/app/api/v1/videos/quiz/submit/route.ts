import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { saveQuizAttemptAction } from "@/actions/quiz/attempt";

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

// POST /api/v1/videos/quiz/submit
export async function POST(req: Request) {
  try {
    const { userId, errorResponse } = extractUserId(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { videoId, videoTitle, channelName, score, correctCount, totalQuizzes, questionsData } = body;

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_VIDEO_ID",
            message: "Thiếu trường videoId trong request body!",
          },
        },
        { status: 400 }
      );
    }

    const numericScore = typeof score === "number" ? score : 0;
    const numericCorrect = typeof correctCount === "number" ? correctCount : numericScore;
    const numericTotal = typeof totalQuizzes === "number" ? totalQuizzes : 0;

    const result = await saveQuizAttemptAction({
      userId: userId!,
      videoId,
      videoTitle: videoTitle || "Video Bài Giảng",
      channelName: channelName || "Kênh Ẩn Danh",
      score: numericScore,
      correctCount: numericCorrect,
      totalQuizzes: numericTotal,
      questionsData,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SAVE_QUIZ_FAILED",
            message: result.error || "Lỗi khi lưu kết quả bài thi vào cơ sở dữ liệu.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        earnedXP: result.earnedXP || 0,
        earnedCoins: result.earnedCoins || 0,
        score: numericScore,
        correctCount: numericCorrect,
        totalQuizzes: numericTotal,
      },
    });
  } catch (error: any) {
    console.error("POST /api/v1/videos/quiz/submit Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi hệ thống khi xử lý nộp bài quiz.",
        },
      },
      { status: 500 }
    );
  }
}

