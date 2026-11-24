import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getWikiStudyCardService } from "@/services/wiki-study.service";

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

// GET /api/v1/wiki/cards/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, errorResponse } = extractUserId(req);
    if (errorResponse) return errorResponse;

    const resolvedParams = await params;
    const cardId = Number(resolvedParams.id);

    if (!cardId || isNaN(cardId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CARD_ID",
            message: "Mã thẻ bài (id) không hợp lệ!",
          },
        },
        { status: 400 }
      );
    }

    const result = await getWikiStudyCardService(userId!, cardId);

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
    console.error("GET /api/v1/wiki/cards/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi lấy dữ liệu thẻ!",
        },
      },
      { status: 500 }
    );
  }
}

