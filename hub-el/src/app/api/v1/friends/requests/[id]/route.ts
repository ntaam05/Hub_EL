import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { cancelFriendRequestService } from "@/services/friends.service";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const friendshipId = Number(rawId);

    const result = await cancelFriendRequestService(
      isNaN(friendshipId) ? rawId : friendshipId,
      userId
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CANCEL_FAILED",
            message: result.error || "Không thể hủy lời mời kết bạn.",
          },
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Đã hủy lời mời kết bạn.",
    });
  } catch (err: any) {
    console.error("[API v1] DELETE /api/v1/friends/requests/[id] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi hủy lời mời kết bạn.",
        },
      },
      { status: 500 }
    );
  }
}
