import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getSentRequestsService } from "@/services/friends.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const result = await getSentRequestsService(userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SENT_REQUESTS_FETCH_ERROR",
            message: result.error || "Lỗi khi lấy danh sách lời mời đã gửi.",
          },
        },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (err: any) {
    console.error("[API v1] GET /api/v1/friends/requests/sent error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi lấy danh sách lời mời đã gửi.",
        },
      },
      { status: 500 }
    );
  }
}
