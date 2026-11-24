import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getGachaStatusService } from "@/services/gacha.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const result = await getGachaStatusService(userId);
    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: result.message || "Không thể lấy trạng thái Gacha.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Lỗi API GET /api/v1/gacha/status:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi máy chủ nội bộ khi lấy trạng thái Gacha.",
        },
      },
      { status: 500 }
    );
  }
}

