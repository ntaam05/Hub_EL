import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getOtherUserProfileService } from "@/services/friends.service";

export async function GET(
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
            message: "ID người dùng không hợp lệ.",
          },
        },
        { status: 400 }
      );
    }

    const result = await getOtherUserProfileService(targetUserId, userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: result.error || "Không tìm thấy hồ sơ người dùng.",
          },
        },
        { status: result.statusCode || 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err: any) {
    console.error("[API v1] GET /api/v1/users/[id]/profile error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi lấy thông tin hồ sơ.",
        },
      },
      { status: 500 }
    );
  }
}
