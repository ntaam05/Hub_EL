import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getCoursesDataAction, getPlaylistProgressAction } from "@/actions/user/learning";
import { toggleFavoritePlaylistAction } from "@/actions/user/favorites";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(req.url);
    const playlistId = url.searchParams.get("playlistId");

    if (playlistId) {
      const res = await getPlaylistProgressAction(auth.userId, playlistId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: res.data });
    }

    const res = await getCoursesDataAction(auth.userId);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "Không thể tải danh sách khóa học." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: res.data,
    });
  } catch (error: any) {
    console.error("API /api/v1/courses GET error:", error);
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
    const { playlistId, title, channelTitle, thumbnailUrl, totalVideos, videoIds } = body;

    if (!playlistId) {
      return NextResponse.json(
        { success: false, error: "Thiếu playlistId." },
        { status: 400 }
      );
    }

    const res = await toggleFavoritePlaylistAction({
      userId: auth.userId,
      playlistId,
      title: title || "Khóa học Playlist",
      channelTitle,
      thumbnailUrl,
      totalVideos: totalVideos || 1,
      videoIds: videoIds || "",
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "Lỗi khi lưu/hủy lưu khóa học." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { isFavorited: res.isFavorited },
    });
  } catch (error: any) {
    console.error("API /api/v1/courses POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ." },
      { status: 500 }
    );
  }
}

