import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { blockUserService, unblockUserService } from "@/services/friends.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    if (!targetUserId || targetUserId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "ID người dùng cần chặn không hợp lệ.",
          },
        },
        { status: 400 }
      );
    }

    const result = await blockUserService(userId, targetUserId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BLOCK_FAILED",
            message: result.error || "Không thể chặn người dùng.",
          },
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Đã chặn người dùng.",
    });
  } catch (err: any) {
    console.error("[API v1] POST /api/v1/friends/[id]/block error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi chặn người dùng.",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    if (!targetUserId || targetUserId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "ID người dùng cần bỏ chặn không hợp lệ.",
          },
        },
        { status: 400 }
      );
    }

    const result = await unblockUserService(userId, targetUserId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNBLOCK_FAILED",
            message: result.error || "Không thể bỏ chặn người dùng.",
          },
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Đã bỏ chặn người dùng.",
    });
  } catch (err: any) {
    console.error("[API v1] DELETE /api/v1/friends/[id]/block error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi bỏ chặn người dùng.",
        },
      },
      { status: 500 }
    );
  }
}
