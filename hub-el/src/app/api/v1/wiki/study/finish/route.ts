import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { finishWikiStudyService } from "@/services/wiki-study.service";

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

// POST /api/v1/wiki/study/finish
export async function POST(req: Request) {
  try {
    const { userId, errorResponse } = extractUserId(req);
    if (errorResponse) return errorResponse;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON_BODY",
            message: "Request body không phải định dạng JSON hợp lệ!",
          },
        },
        { status: 400 }
      );
    }

    const { sessionId, sessionToken, answers, cardId } = body || {};

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Thiếu sessionId hoặc mảng câu trả lời answers!",
          },
        },
        { status: 400 }
      );
    }

    const result = await finishWikiStudyService(userId!, {
      sessionId,
      sessionToken,
      answers,
      cardId: cardId ? Number(cardId) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("POST /api/v1/wiki/study/finish error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi hoàn tất bài học!",
        },
      },
      { status: 500 }
    );
  }
}

