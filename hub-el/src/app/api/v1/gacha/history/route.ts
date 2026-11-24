import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getGachaHistoryService } from "@/services/gacha.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const result = await getGachaHistoryService(userId, { page, limit });

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "HISTORY_FETCH_FAILED",
            message: result.message || "Không thể lấy lịch sử quay thẻ.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Lỗi API GET /api/v1/gacha/history:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi máy chủ nội bộ khi lấy lịch sử quay thẻ.",
        },
      },
      { status: 500 }
    );
  }
}

