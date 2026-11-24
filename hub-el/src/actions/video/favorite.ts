"use server";

import { prisma } from "@/lib/prisma";

// Tham số đầu vào giờ đầy đủ hơn để lưu cache UI như file Java
interface AddFavoriteParams {
  userId: string;
  videoId: string;
  title?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
}

// 1. Thêm video vào danh sách yêu thích
export async function addFavoriteAction(data: AddFavoriteParams) {
  try {
    const exists = await prisma.favoriteVideo.findUnique({
      where: { userId_videoId: { userId: data.userId, videoId: data.videoId } }
    });

    if (!exists) {
      await prisma.favoriteVideo.create({
        data: {
          userId: data.userId,
          videoId: data.videoId,
          title: data.title,
          channelTitle: data.channelTitle,
          thumbnailUrl: data.thumbnailUrl
        }
      });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Xóa video khỏi danh sách yêu thích
export async function removeFavoriteAction(userId: string, videoId: string) {
  try {
    await prisma.favoriteVideo.delete({
      where: { userId_videoId: { userId, videoId } }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Kiểm tra xem video đã được yêu thích chưa (Dùng cho nút thả tim)
export async function checkFavoriteAction(userId: string, videoId: string) {
  try {
    const exists = await prisma.favoriteVideo.findUnique({
      where: { userId_videoId: { userId, videoId } }
    });
    return { success: true, data: !!exists };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. LẤY DANH SÁCH VIDEO YÊU THÍCH (Hàm mới bổ sung cho Dashboard)
export async function getFavoriteVideosAction(userId: string) {
  try {
    const favorites = await prisma.favoriteVideo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' } // Sắp xếp video mới lưu lên đầu
    });
    
    return { success: true, data: favorites };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}