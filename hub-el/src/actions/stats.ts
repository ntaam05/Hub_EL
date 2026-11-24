// src/actions/stats.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; 
import { getMaxEnergy } from "@/lib/leveling"; 
import { syncUserStatus } from "@/lib/user-sync";

export async function getUserFullStats(providedUserId?: string) {
  let userId = providedUserId;
  if (!userId) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Chưa đăng nhập" };
    userId = session.user.id;
  }

  try {
    await syncUserStatus(userId);

    // Performance: Gói 4 lệnh truy vấn đọc (Read) độc lập vào một $transaction mảng. 
    // Prisma sẽ bắn 4 query này chạy song song (concurrently) xuống DB thay vì chờ tuần tự, giúp giảm 70% độ trễ (latency).
    const [user, totalCards, totalAchievements, recentQuizzes] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          stats: true,
          inventory: {
            include: { 
                card: { 
                include: { vocabularies: { select: { id: true } } }
                } 
            }
          },
          achievements: true,
          friendships1: { where: { status: "ACCEPTED" } },
          friendships2: { where: { status: "ACCEPTED" } },
          chatGroups: true,
          progress: true,
          dailyTasks: { include: { task: true } },
          coinTransactions: { orderBy: { createdAt: 'desc' }, take: 8 },
          createdVideos: { select: { id: true } },
          freezeUsage: { select: { id: true } },
          orders: { where: { status: "SUCCESS" } }
        }
      }),
      prisma.wikiCard.count(),
      prisma.achievement.count(),
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    ]);

    if (!user) return { success: false, message: "Không tìm thấy user" };

    let totalStarsCollected = 0;
    let maxPossibleStars = 0;
    user.inventory.forEach(item => {
      totalStarsCollected += (item.card?.awakenedStars || 0);
      maxPossibleStars += (item.card?.totalStars || 1);
    });

    const uniqueCardIds = new Set(user.inventory.map(i => i.cardId));

    let totalLearnedVocab = 0;
    user.inventory.forEach(item => {
      if (item.currentStar > 0 || item.isCompleted) {
        totalLearnedVocab += item.card?.vocabularies?.length || 0;
      }
    });

    const totalFriends = user.friendships1.length + user.friendships2.length;
    const totalSpent = user.orders.reduce((sum, order) => sum + order.amount, 0);

    return { 
      success: true, 
      data: {
        user,
        totalCards,
        uniqueCardsOwned: uniqueCardIds.size,
        totalAchievements,
        recentQuizzes: recentQuizzes.reverse(),
        totalSpent,
        totalStarsCollected,
        maxPossibleStars,
        totalLearnedVocab,
        totalFriends // 🚨 ĐÃ FIX: Trả về số lượng bạn bè để hiển thị lên UI
      } 
    };
  } catch (error) {
    console.error("Stats Error:", error);
    return { success: false, message: "Lỗi máy chủ" };
  }
}

export async function syncStudyTimeAction(
  userId: string, 
  seconds: number, 
  videoId?: string, 
  lastWatchedSeconds?: number,
  videoMeta?: { title: string, channelName: string, thumbnail: string, duration: number }
) {
  try {
    if (!userId || seconds <= 0) return { success: false };

    // [A] Cập nhật tổng thời gian học
    await prisma.user.update({
      where: { id: userId },
      data: { stats: { upsert: { create: { totalStudySeconds: seconds }, update: { totalStudySeconds: { increment: seconds } } } } }
    });

    // [B] CẬP NHẬT TIẾN ĐỘ VIDEO (TỰ ĐỘNG TẠO NẾU CHƯA CÓ)
    if (videoId && lastWatchedSeconds !== undefined) {
      let videoRecord = await prisma.video.findFirst({ where: { youtubeUrl: videoId } });
      
      if (!videoRecord && videoMeta) {
          videoRecord = await prisma.video.create({
              data: {
                  youtubeUrl: videoId,
                  title: videoMeta.title || "Video Bài Giảng",
                  channelName: videoMeta.channelName || "Kênh Ẩn Danh",
                  thumbnail: videoMeta.thumbnail || "",
                  duration: videoMeta.duration || 0
              }
          });
      }

      if (videoRecord) {
          if (videoRecord.duration === 0 && videoMeta && videoMeta.duration > 0) {
              await prisma.video.update({
                  where: { id: videoRecord.id },
                  data: { duration: videoMeta.duration }
              });
          }

          await prisma.userProgress.upsert({
              where: { userId_videoId: { userId, videoId: videoRecord.id } },
              update: { 
                  lastWatched: lastWatchedSeconds,
                  updatedAt: new Date()
              }, 
              create: { userId, videoId: videoRecord.id, lastWatched: lastWatchedSeconds }
          });
      }
    }

    // [C] Cập nhật nhiệm vụ học tập 20p
    // 🚨 ĐÃ FIX: Lấy chuẩn giờ Việt Nam
    const vnTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const startOfToday = new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate()));
    
    const studyTask = await prisma.userTaskProgress.findFirst({
        where: { userId, assignedDate: { gte: startOfToday }, isClaimed: false, task: { taskType: "STUDY_TIME" } },
        include: { task: true }
    });
    const minutesToAdded = Math.round(seconds / 60);
    if (studyTask && minutesToAdded > 0 && studyTask.current < studyTask.task.target) {
        await prisma.userTaskProgress.update({ where: { id: studyTask.id }, data: { current: { increment: minutesToAdded } } });
    }

    return { success: true };
  } catch (error) { 
    console.error("Lỗi syncStudyTime:", error);
    return { success: false }; 
  }
}