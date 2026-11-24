"use server";

import { prisma } from "@/lib/prisma";

// 1. LƯU HOẶC HỦY LƯU VIDEO
export async function toggleFavoriteVideoAction(data: { userId: string; videoId: string; title: string; channelTitle?: string; thumbnailUrl?: string}) {
  try {
    if (!data.userId) throw new Error("Chưa đăng nhập");

    // Kiểm tra xem đã lưu chưa
    const existing = await prisma.favoriteVideo.findUnique({
      where: { userId_videoId: { userId: data.userId, videoId: data.videoId } }
    });

    if (existing) {
      // Nếu đã lưu -> Xóa (Hủy thả tim)
      await prisma.favoriteVideo.delete({ where: { id: existing.id } });
      return { success: true, isFavorited: false };
    } else {
      // Nếu chưa lưu -> Thêm mới
      await prisma.favoriteVideo.create({
        data: {
          userId: data.userId,
          videoId: data.videoId,
          title: data.title || "Video không tên",
          channelTitle: data.channelTitle,
          thumbnailUrl: data.thumbnailUrl,
        }
      });
      return { success: true, isFavorited: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. LƯU HOẶC HỦY LƯU PLAYLIST (KHÓA HỌC)
export async function toggleFavoritePlaylistAction(data: { userId: string; playlistId: string; title: string; channelTitle?: string; thumbnailUrl?: string ;totalVideos: number;videoIds: string;}) {
  try {
    if (!data.userId) throw new Error("Chưa đăng nhập");

    const existing = await prisma.favoritePlaylist.findUnique({
      where: { userId_playlistId: { userId: data.userId, playlistId: data.playlistId } }
    });

    if (existing) {
      await prisma.favoritePlaylist.delete({ where: { id: existing.id } });
      return { success: true, isFavorited: false };
    } else {
      await prisma.favoritePlaylist.create({
        data: {
          userId: data.userId, playlistId: data.playlistId, title: data.title || "Playlist không tên", channelTitle: data.channelTitle,
          thumbnailUrl: data.thumbnailUrl, totalVideos: data.totalVideos, videoIds: data.videoIds,
        }
      });

      // 🚨 CẬP NHẬT NHIỆM VỤ LƯU KHÓA HỌC (PRO)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const saveTask = await prisma.userTaskProgress.findFirst({
          where: { userId: data.userId, assignedDate: { gte: startOfToday }, isClaimed: false, task: { taskType: "SAVE_COURSE" } },
          include: { task: true }
      });
      if (saveTask && saveTask.current < saveTask.task.target) {
          await prisma.userTaskProgress.update({
              where: { id: saveTask.id }, data: { current: saveTask.current + 1 }
          });
      }

      return { success: true, isFavorited: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}