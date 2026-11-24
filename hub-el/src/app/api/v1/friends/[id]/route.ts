import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { removeFriendService } from "@/services/friends.service";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const resolvedParams = await params;
    const friendId = resolvedParams.id;

    if (!friendId || friendId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "ID bạn bè không hợp lệ.",
          },
        },
        { status: 400 }
      );
    }

    const result = await removeFriendService(userId, friendId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REMOVE_FRIEND_FAILED",
            message: result.error || "Không thể hủy kết bạn.",
          },
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Đã hủy kết bạn.",
    });
  } catch (err: any) {
    console.error("[API v1] DELETE /api/v1/friends/[id] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi hủy kết bạn.",
        },
      },
      { status: 500 }
    );
  }
}
