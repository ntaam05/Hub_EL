import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getRelatedVideosAction } from "@/actions/video/video";

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
    const relatedRes = await getRelatedVideosAction(videoId);

    const relatedVideos = relatedRes.success && Array.isArray(relatedRes.data)
      ? relatedRes.data.filter((v: any) => v.videoId !== videoId)
      : [];

    return NextResponse.json({
      success: true,
      data: relatedVideos,
    });
  } catch (error: any) {
    console.error("API /api/v1/videos/[id]/related Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi lấy video liên quan.",
        },
      },
      { status: 500 }
    );
  }
}

