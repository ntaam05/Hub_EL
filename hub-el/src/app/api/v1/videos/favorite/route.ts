import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getFavoriteVideosAction, checkFavoriteAction } from "@/actions/video/favorite";
import { toggleFavoriteVideoAction } from "@/actions/user/favorites";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(req.url);
    const videoId = url.searchParams.get("videoId");

    if (videoId) {
      const res = await checkFavoriteAction(auth.userId, videoId);
      return NextResponse.json({ success: true, data: { isFavorited: res.data ?? false } });
    }

    const res = await getFavoriteVideosAction(auth.userId);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "Không thể lấy danh sách video yêu thích." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: res.data || [],
    });
  } catch (error: any) {
    console.error("API /api/v1/videos/favorite GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { videoId, title, channelTitle, thumbnailUrl } = body;

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "Thiếu videoId." },
        { status: 400 }
      );
    }

    const res = await toggleFavoriteVideoAction({
      userId: auth.userId,
      videoId,
      title: title || "Video không tên",
      channelTitle,
      thumbnailUrl,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "Lỗi khi lưu/hủy yêu thích video." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { isFavorited: res.isFavorited },
    });
  } catch (error: any) {
    console.error("API /api/v1/videos/favorite POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ." },
      { status: 500 }
    );
  }
}

