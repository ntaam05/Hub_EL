import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getPlaylistItemsAction } from "@/actions/video/video";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(req.url);
    const playlistId = url.searchParams.get("playlistId");
    const pageToken = url.searchParams.get("pageToken") || undefined;

    if (!playlistId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PLAYLIST_ID",
            message: "Thiếu mã danh sách phát (playlistId)!",
          },
        },
        { status: 400 }
      );
    }

    // 1. Lấy danh sách video từ YouTube API hoặc Cache
    const itemsRes = await getPlaylistItemsAction(playlistId, pageToken);
    const items = itemsRes.success && itemsRes.data?.items ? itemsRes.data.items : [];
    const nextPageToken = itemsRes.success ? (itemsRes.data?.nextPageToken || null) : null;

    // 2. Kiểm tra xem người dùng đã lưu playlist này vào mục Khóa học chưa
    const favorite = await prisma.favoritePlaylist.findUnique({
      where: {
        userId_playlistId: {
          userId: auth.userId,
          playlistId: playlistId,
        },
      },
    });

    const isFavorited = !!favorite;

    // Nếu YouTube API không trả về items nhưng đã lưu trong DB trước đó, fallback danh sách videoIds
    let finalItems = items;
    if (finalItems.length === 0 && favorite?.videoIds) {
      const savedIds = favorite.videoIds.split(",").map((s) => s.trim()).filter(Boolean);
      finalItems = savedIds.map((vidId, idx) => ({
        videoId: vidId,
        type: "video",
        title: `${favorite.title} - Bài ${idx + 1}`,
        channelTitle: favorite.channelTitle || "Kênh đào tạo",
        thumbnailUrl: `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`,
      }));
    }

    // 3. Lấy điểm số và tiến độ khóa học nếu đã lưu
    let videoScore = 0;
    let summaryScore = favorite?.summaryScore || 0;
    let grade = "Chưa đạt";
    let isCompleted = favorite?.isCompleted || false;

    if (favorite) {
      const idsArray = favorite.videoIds ? favorite.videoIds.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const totalVids = favorite.totalVideos || idsArray.length || 1;

      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId: auth.userId },
        include: { video: true },
        orderBy: { createdAt: "desc" },
      });

      idsArray.forEach((id: string) => {
        const latestAttempt = quizAttempts.find((attempt) =>
          (attempt.video?.youtubeUrl || "").includes(id)
        );
        if (latestAttempt && latestAttempt.totalQuizzes > 0) {
          videoScore += (latestAttempt.correctCount / latestAttempt.totalQuizzes) * (50 / totalVids);
        }
      });

      videoScore = Math.round(videoScore);
      const finalScore = Math.min(100, Math.round(videoScore + (summaryScore * 0.5)));
      if (finalScore >= 80) grade = "Xuất sắc";
      else if (finalScore >= 65) grade = "Giỏi";
      else if (finalScore >= 50) grade = "Khá";
    }

    return NextResponse.json({
      success: true,
      data: {
        playlistId,
        title: favorite?.title || (finalItems.length > 0 ? finalItems[0]?.title : "Danh sách phát"),
        channelTitle: favorite?.channelTitle || (finalItems.length > 0 ? finalItems[0]?.channelTitle : ""),
        thumbnailUrl: favorite?.thumbnailUrl || (finalItems.length > 0 ? finalItems[0]?.thumbnailUrl : ""),
        totalVideos: favorite?.totalVideos || finalItems.length,
        isFavorited,
        videoScore,
        summaryScore,
        grade,
        isCompleted,
        items: finalItems,
        nextPageToken,
        videoIds: finalItems.map((it: any) => it.videoId).join(","),
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/videos/playlist error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi lấy danh sách phát.",
        },
      },
      { status: 500 }
    );
  }
}

