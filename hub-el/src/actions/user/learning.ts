"use server";

import { prisma } from "@/lib/prisma";

/**
 * Hàm lấy dữ liệu tổng hợp cho trang Dashboard
 * Bao gồm: Nhiệm vụ, Thành tựu, Video đang học, Hoạt động gần đây.
 */
export async function getDashboardDataAction(userId: string) {
  try {
    if (!userId) throw new Error("Chưa đăng nhập");

    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { stats: true, achievements: { include: { achievement: true } } } 
    });
     
    // ==========================================
    // 1. LOGIC XỬ LÝ NHIỆM VỤ HÀNG NGÀY & ĐẶC QUYỀN PRO
    // ==========================================
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    let todayUserTasks = await prisma.userTaskProgress.findMany({
      where: { userId: userId, assignedDate: { gte: startOfToday } },
      include: { task: true } 
    });

    let allTasks = await prisma.dailyTask.findMany();
    
    // Khởi tạo 6 loại nhiệm vụ mẫu nếu hệ thống chưa có
    if (allTasks.length < 6) {
      const taskSeedData = [
        { taskDesc: "Xem 2 video bất kỳ", target: 2, rewardXp: 20, rewardCoins: 10, taskType: "WATCH_VIDEO" },
        { taskDesc: "Học tập 15 phút", target: 15, rewardXp: 20, rewardCoins: 0, taskType: "STUDY_TIME" },
        { taskDesc: "Hoàn thành 1 bài quiz", target: 1, rewardXp: 30, rewardCoins: 15, taskType: "DO_QUIZ" },
        { taskDesc: "Đăng nhập hàng ngày (PRO)", target: 1, rewardXp: 10, rewardCoins: 5, taskType: "LOGIN" },
        { taskDesc: "Lưu 1 khóa học (PRO)", target: 1, rewardXp: 20, rewardCoins: 10, taskType: "SAVE_COURSE" },
        { taskDesc: "Quay Gacha 1 lần (PRO)", target: 1, rewardXp: 15, rewardCoins: 10, taskType: "ROLL_GACHA" }
      ];
      
      for (const t of taskSeedData) {
        const exist = allTasks.find(dbT => dbT.taskType === t.taskType);
        if (!exist) await prisma.dailyTask.create({ data: t });
      }
      allTasks = await prisma.dailyTask.findMany();
    }

    // Cấp phát nhiệm vụ mới nếu hôm nay chưa có hoặc user vừa nâng cấp lên PRO
    const expectedTaskCount = user?.isPro ? 6 : 3;

    if (todayUserTasks.length < expectedTaskCount) {
      const existingTaskIds = todayUserTasks.map(t => t.taskId);
      
      // Tìm các nhiệm vụ chưa có trong ngày hôm nay
      let tasksToAssign = allTasks.filter(t => !existingTaskIds.includes(t.id));
      
      // Nếu không phải PRO, lọc vứt đi 3 nhiệm vụ VIP
      if (!user?.isPro) {
         tasksToAssign = tasksToAssign.filter(t => ["WATCH_VIDEO", "STUDY_TIME", "DO_QUIZ"].includes(t.taskType));
      }

      if (tasksToAssign.length > 0) {
          const newTaskProgressData = tasksToAssign.map(task => ({
            userId: userId, 
            taskId: task.id, 
            current: task.taskType === "LOGIN" ? 1 : 0, // Tự động hoàn thành task Đăng nhập
            assignedDate: startOfToday, // 🚨 Đã dùng mốc thời gian chuẩn
            isClaimed: false
          }));
          
          try {
             await prisma.userTaskProgress.createMany({ data: newTaskProgressData });
          } catch (e: any) {
             if (e.code !== 'P2002') throw e; // Chống lỗi dội bom API
          }
      }
      
      // Truy vấn lại lần cuối để lấy đủ danh sách gửi ra giao diện
      todayUserTasks = await prisma.userTaskProgress.findMany({
        where: { userId: userId, assignedDate: { gte: startOfToday } },
        include: { task: true }
      });
    }

    // ==========================================
    // 2. LẤY VIDEO ĐANG XEM DỞ GẦN NHẤT (CONTINUE LEARNING)
    // ==========================================
    const lastWatchedVideo = await prisma.userProgress.findFirst({
      where: { userId: userId },
      orderBy: { updatedAt: 'desc' }, 
      include: { video: true }
    });

    let continueLearning = null;
    if (lastWatchedVideo && lastWatchedVideo.video) {
        const vid = lastWatchedVideo.video;
        const progressRaw = vid.duration > 0 ? (lastWatchedVideo.lastWatched / vid.duration) * 100 : 0;
        
        continueLearning = {
            videoId: vid.youtubeUrl,
            title: vid.title,
            course: vid.channelName || "Khóa học Video",
            thumbnailUrl: vid.thumbnail || "",
            progress: Math.min(Math.round(progressRaw), 100),
            timeLeft: vid.duration > 0 ? `Còn ${Math.max(Math.round((vid.duration - lastWatchedVideo.lastWatched) / 60), 0)} phút` : "Đang học",
            lastWatched: lastWatchedVideo.lastWatched
        };
    }

    // ==========================================
    // 3. LẤY HOẠT ĐỘNG GẦN ĐÂY (RECENT ACTIVITIES)
    // ==========================================
    let activities: any[] = [];
    try {
      // 🚨 ĐÃ FIX: Thêm prisma.wikiQuizAttempt vào Promise.all để kéo lịch sử thẻ Wiki
      const [recentVideos, recentQuizzes, recentAchievementsDb, recentPlaylists, recentWikiAttempts] = await Promise.all([
        prisma.userProgress.findMany({ where: { userId }, include: { video: true }, orderBy: { updatedAt: 'desc' }, take: 5 }),
        prisma.quizAttempt.findMany({ where: { userId }, include: { video: true }, orderBy: { updatedAt: 'desc' }, take: 5 }),
        prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true }, orderBy: { unlockedAt: 'desc' }, take: 5 }),
        prisma.favoritePlaylist.findMany({ where: { userId, summaryScore: { gt: 0 } }, orderBy: { updatedAt: 'desc' }, take: 3 }),
        prisma.wikiQuizAttempt.findMany({ where: { userId }, include: { card: true }, orderBy: { createdAt: 'desc' }, take: 5 }) 
      ]);

      // Gom nhóm Khóa học
      recentPlaylists.forEach(p => {
        activities.push({
            id: `course_${p.id}`, type: 'COURSE', action: "Hoàn thành Khóa học", 
            title: p.title || "Khóa học Video", context: `Điểm cuối khóa: ${p.summaryScore}/100`, timestamp: p.updatedAt || p.createdAt
        });
      });

      // Gom nhóm Video
      recentVideos.forEach(p => {
        if(p.video) activities.push({
            id: `vid_${p.id}`, type: 'VIDEO', action: "Đã xem video", 
            title: p.video.title, context: p.video.channelName, timestamp: p.updatedAt
        });
      });

      // Gom nhóm Bài tập Video
      recentQuizzes.forEach(q => {
        if(q.video) {
            const timeDiff = q.updatedAt ? Math.abs(new Date(q.createdAt).getTime() - new Date(q.updatedAt).getTime()) : 0;
            const isRetake = timeDiff > 60000; 
            activities.push({
                id: `quiz_${q.id}`, 
                type: isRetake ? 'RETAKE_QUIZ' : 'QUIZ', 
                action: isRetake ? "Làm lại bài tập" : "Hoàn thành Bài tập", 
                title: `Kết quả: ${q.correctCount}/${q.totalQuizzes}`, 
                context: q.video.title, 
                timestamp: q.updatedAt || q.createdAt
            });
        }
      });

      // Gom nhóm Thành tựu
      recentAchievementsDb.forEach((a: any) => {
        if(a.achievement) activities.push({
            id: `ach_${a.id}`, type: 'ACHIEVEMENT', action: "Mở khóa Thành tựu", 
            title: a.achievement.name, context: `Thưởng: +${a.achievement.rewardXp} XP`, timestamp: a.unlockedAt
        });
      });

      // 🚨 ĐÃ FIX: Gom nhóm Thẻ bài Wiki (Đếm số từ vựng từ lessonSnapshot)
      recentWikiAttempts.forEach(w => {
        if(w.card) {
            let vocabCount = 0;
            if (w.lessonSnapshot) {
              try {
                const snapshot = JSON.parse(w.lessonSnapshot);
                if (snapshot.vocabularies) vocabCount = snapshot.vocabularies.length;
              } catch (e) {}
            }

            activities.push({
                id: `wiki_${w.id}`, 
                type: 'WIKI', // Phân loại mới cho UI
                action: "Học bài thẻ Wiki", 
                title: w.card.title, 
                context: `Đúng ${w.correctCount}/${w.totalQuizzes} câu • Học ${vocabCount} từ mới`, 
                timestamp: w.createdAt
            });
        }
      });

      // BỘ LỌC CHỐNG LỆCH MÚI GIỜ (Time-travel fix)
      const nowMs = Date.now();
      activities.forEach(a => {
         const t = new Date(a.timestamp).getTime();
         if (t > nowMs) a.timestamp = new Date(t - 7 * 60 * 60 * 1000); 
      });

      // Sắp xếp lại toàn bộ hoạt động theo thời gian mới nhất lên đầu
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch(e) { console.error("Lỗi lấy hoạt động:", e); }

    const favoriteVideos = await prisma.favoriteVideo.findMany({ 
      where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 
    });

    return { 
      success: true, 
      data: { 
        streak: user?.currentStreak || 0, 
        highestStreak: user?.highestStreak || 0, 
        completedVideosCount: user?.stats?.totalVideoWatched || 0,
        achievements: user?.achievements ? [...user.achievements].reverse() : [],
        favoriteVideos: favoriteVideos,
        dailyTasks: todayUserTasks,
        continueLearning: continueLearning,
        recentActivities: activities.slice(0, 6) 
      } 
    };
  } catch (error: any) { 
    console.error("🔥 LỖI TẢI DASHBOARD:", error);
    return { success: false, error: error.message }; 
  }
}

/**
 * Hàm lấy danh sách khóa học và tính toán điểm số trung bình
 */
export async function getCoursesDataAction(userId: string) {
  try {
    if (!userId) throw new Error("Chưa đăng nhập");

    const playlists = await prisma.favoritePlaylist.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId }, include: { video: true }, orderBy: { createdAt: 'desc' }
    });

    const formattedPlaylists = playlists.map(p => {
      const idsArray = p.videoIds ? p.videoIds.split(",") : [];
      const totalVideos = p.totalVideos || idsArray.length || 1;
      let totalVideoScore = 0;

      idsArray.forEach((id: string) => {
        const latestAttempt = quizAttempts.find(attempt => (attempt.video?.youtubeUrl || "").includes(id));
        if (latestAttempt && latestAttempt.totalQuizzes > 0) {
          totalVideoScore += (latestAttempt.correctCount / latestAttempt.totalQuizzes) * (100 / totalVideos);
        }
      });

      totalVideoScore = Math.round(Math.min(totalVideoScore, 100));
      const summaryScore = p.summaryScore || 0; 
      const finalScore = Math.round((totalVideoScore + summaryScore) / 2);

      let grade = "Chưa đạt";
      if (finalScore >= 90) grade = "Xuất sắc";
      else if (finalScore >= 80) grade = "Giỏi";
      else if (finalScore >= 60) grade = "Khá";
      else if (finalScore >= 50) grade = "Trung bình";

      return { ...p, videoScore: totalVideoScore, summaryScore, finalScore, grade, isCompleted: finalScore >= 50 };
    });

    return { success: true, data: { playlists: formattedPlaylists } };
  } catch (error: any) { return { success: false, error: error.message }; }
}

/**
 * Lấy tiến độ học tập của một Playlist cụ thể
 */
export async function getPlaylistProgressAction(userId: string, playlistId: string) {
  try {
    const playlist = await prisma.favoritePlaylist.findUnique({
      where: { userId_playlistId: { userId, playlistId } }
    });
    if (!playlist) return { success: false, error: "Playlist chưa được lưu" };

    const idsArray = playlist.videoIds ? playlist.videoIds.split(",") : [];
    const totalVideos = playlist.totalVideos || idsArray.length || 1;
    
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId }, include: { video: true }, orderBy: { createdAt: 'desc' }
    });

    let currentVideoScore = 0;
    idsArray.forEach((id: string) => {
      const latestAttempt = quizAttempts.find(attempt => (attempt.video?.youtubeUrl || "").includes(id));
      if (latestAttempt && latestAttempt.totalQuizzes > 0) {
        currentVideoScore += (latestAttempt.correctCount / latestAttempt.totalQuizzes) * (50 / totalVideos);
      }
    });

    currentVideoScore = Math.round(currentVideoScore);
    return { 
      success: true, 
      data: { currentVideoScore, potentialMaxVideoScore: 50, isUnlocked: currentVideoScore >= 50, summaryScore: playlist.summaryScore || 0 } 
    };
  } catch (error: any) { return { success: false, error: error.message }; }
}

/**
 * Đánh dấu hoàn thành video và cộng tiến độ nhiệm vụ xem video
 */
export async function markVideoCompletedAction(userId: string, youtubeStringId: string) {
  try {
    if (!userId || !youtubeStringId) return { success: false };

    const videoRecord = await prisma.video.findFirst({ where: { youtubeUrl: youtubeStringId } });
    if (videoRecord) {
      await prisma.userProgress.upsert({
        where: { userId_videoId: { userId, videoId: videoRecord.id } },
        update: { isCompleted: true, updatedAt: new Date() },
        create: { userId, videoId: videoRecord.id, isCompleted: true }
      });
    }

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const watchTask = await prisma.userTaskProgress.findFirst({
        where: { userId, assignedDate: { gte: startOfToday }, isClaimed: false, task: { taskType: "WATCH_VIDEO" } },
        include: { task: true }
    });

    if (watchTask && watchTask.current < watchTask.task.target) {
        await prisma.userTaskProgress.update({
            where: { id: watchTask.id }, data: { current: watchTask.current + 1 }
        });
    }
    return { success: true };
  } catch (error) { return { success: false }; }
}

/**
 * Hàm xử lý nhận thưởng nhiệm vụ hàng ngày
 */
export async function claimDailyTaskRewardAction(userId: string, progressId: number) {
  try {
    const progress = await prisma.userTaskProgress.findUnique({
      where: { id: progressId, userId }, include: { task: true }
    });
    
    if (!progress || progress.isClaimed || progress.current < progress.task.target) {
        return { success: false, error: "Nhiệm vụ không hợp lệ hoặc chưa hoàn thành" };
    }

    await prisma.userTaskProgress.update({ where: { id: progressId }, data: { isClaimed: true } });
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: progress.task.rewardXp }, freeCoins: { increment: progress.task.rewardCoins } }
    });

    return { success: true, xpDelta: progress.task.rewardXp, coinsDelta: progress.task.rewardCoins };
  } catch (error: any) { return { success: false, error: error.message }; }
}
// ==========================================
// API LẤY DỮ LIỆU TƯƠI CHO HEADER (CHỐNG LỖI CACHE SESSION)
// ==========================================
export async function getFreshUserStatsAction(userId: string) {
  try {
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        xp: true, 
        level: true, 
        freeCoins: true, 
        premiumCoins: true,
        aiTokens: true, 
        currentStreak: true,
        highestStreak: true,
        streakFreezes: true,
        lastStudyDate: true,
        isPro: true
      }
    });
    return user;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu tươi cho Header:", error);
    return null;
  }
}