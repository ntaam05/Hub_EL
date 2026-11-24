import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { syncStudyTimeAction } from "@/actions/stats";
import { markVideoCompletedAction } from "@/actions/user/learning";

function extractUserId(req: Request): { userId: string | null; errorResponse: NextResponse | null } {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      userId: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Thiếu Bearer Token trong Authorization Header!",
          },
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded: any = verifyToken(token);
    return { userId: decoded.id, errorResponse: null };
  } catch (err: any) {
    return {
      userId: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: err.message === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            message: err.message === "TOKEN_EXPIRED" ? "Phiên đăng nhập đã hết hạn!" : "Token xác thực không hợp lệ!",
          },
        },
        { status: 401 }
      ),
    };
  }
}

// GET /api/v1/learning/progress?videoId=xxx
export async function GET(req: Request) {
  try {
    const { userId, errorResponse } = extractUserId(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_VIDEO_ID",
            message: "Thiếu tham số videoId trong query param!",
          },
        },
        { status: 400 }
      );
    }

    const videoRecord = await prisma.video.findFirst({
      where: { youtubeUrl: videoId },
    });

    if (!videoRecord) {
      return NextResponse.json({
        success: true,
        data: {
          videoId,
          lastWatched: 0,
          isCompleted: false,
          duration: 0,
        },
      });
    }

    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_videoId: {
          userId: userId!,
          videoId: videoRecord.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        lastWatched: progress?.lastWatched || 0,
        isCompleted: progress?.isCompleted || false,
        duration: videoRecord.duration || 0,
        updatedAt: progress?.updatedAt ? progress.updatedAt.toISOString() : null,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/learning/progress Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi lấy tiến độ học tập.",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/learning/progress
export async function POST(req: Request) {
  try {
    const { userId, errorResponse } = extractUserId(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { videoId, seconds = 0, lastWatchedSeconds = 0, videoMeta, markCompleted = false } = body;

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_VIDEO_ID",
            message: "Thiếu trường videoId trong body!",
          },
        },
        { status: 400 }
      );
    }

    // 1. Đồng bộ thời gian học & vị trí xem dở
    if (seconds > 0 || lastWatchedSeconds > 0) {
      await syncStudyTimeAction(
        userId!,
        seconds,
        videoId,
        lastWatchedSeconds,
        videoMeta
      );
    }

    // 2. Nếu người dùng xem hết video hoặc yêu cầu đánh dấu hoàn thành
    if (markCompleted) {
      await markVideoCompletedAction(userId!, videoId);
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        lastWatched: lastWatchedSeconds,
        isCompleted: markCompleted,
        synced: true,
      },
    });
  } catch (error: any) {
    console.error("POST /api/v1/learning/progress Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi lưu tiến độ học tập.",
        },
      },
      { status: 500 }
    );
  }
}

