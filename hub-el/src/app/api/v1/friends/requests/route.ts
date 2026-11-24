import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import {
  getPendingRequestsService,
  addFriendService,
} from "@/services/friends.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const result = await getPendingRequestsService(userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REQUESTS_FETCH_ERROR",
            message: result.error || "Lỗi khi lấy danh sách lời mời kết bạn.",
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
    console.error("[API v1] GET /api/v1/friends/requests error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi lấy danh sách lời mời.",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const body = await req.json().catch(() => null);
    const targetUserId = body?.targetUserId;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST_BODY",
            message: "Thiếu targetUserId hoặc không đúng định dạng.",
          },
        },
        { status: 400 }
      );
    }

    const result = await addFriendService(userId, targetUserId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ADD_FRIEND_FAILED",
            message: result.error || "Không thể gửi lời mời kết bạn.",
          },
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Đã gửi lời mời kết bạn!",
      data: result.data,
    });
  } catch (err: any) {
    console.error("[API v1] POST /api/v1/friends/requests error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi gửi lời mời kết bạn.",
        },
      },
      { status: 500 }
    );
  }
}
