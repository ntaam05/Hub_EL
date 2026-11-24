import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { respondFriendRequestService } from "@/services/friends.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const resolvedParams = await params;
    const friendshipId = Number(resolvedParams.id);

    if (!friendshipId || isNaN(friendshipId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST_ID",
            message: "ID lời mời kết bạn không hợp lệ.",
          },
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const accept = Boolean(body?.accept);

    const result = await respondFriendRequestService(friendshipId, accept, userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RESPOND_FAILED",
            message: result.error || "Không thể phản hồi lời mời kết bạn.",
          },
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    console.error("[API v1] POST /api/v1/friends/requests/[id]/respond error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi phản hồi lời mời kết bạn.",
        },
      },
      { status: 500 }
    );
  }
}
