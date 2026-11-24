import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { checkEducationalVideoAction } from "@/actions/video/video";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Thiếu Bearer Token trong Authorization Header!",
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    try {
      verifyToken(token);
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.message === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            message: err.message === "TOKEN_EXPIRED" ? "Phiên đăng nhập đã hết hạn!" : "Token xác thực không hợp lệ!",
          },
        },
        { status: 401 }
      );
    }

    const { id: videoId } = await params;

    // Kiểm tra trong ModeratedVideo
    const modRecord = await prisma.moderatedVideo.findUnique({
      where: { videoId },
    });

    const isBanned = modRecord?.status === "BANNED";
    const bannedReason = isBanned
      ? modRecord?.reason || "Video này đã bị Quản trị viên khóa do vi phạm nội quy học tập."
      : null;

    // Lấy thông tin video nếu đã được lưu trong DB
    const dbVideo = await prisma.video.findFirst({
      where: { youtubeUrl: { contains: videoId } },
      select: {
        id: true,
        title: true,
        channelName: true,
        thumbnail: true,
        duration: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        isBanned,
        bannedReason,
        dbVideo,
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/videos/[id] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi lấy chi tiết video.",
        },
      },
      { status: 500 }
    );
  }
}

