"use server";

import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addExpAndRewards } from "@/lib/leveling";

export async function getUserQuizHistoryAction(userId: string) {
  try {
    if (!userId) throw new Error("Vui lòng đăng nhập để xem lịch sử");

    const history = await prisma.quizAttempt.findMany({
      where: { userId: userId },
      include: {
        video: {
          select: { title: true, thumbnail: true, youtubeUrl: true, channelName: true, }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: history };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveQuizAttemptAction(data: {
  userId: string;
  videoId: string; 
  videoTitle?: string;  
  channelName?: string; 
  score: number;
  correctCount: number;
  totalQuizzes: number;
  questionsData?: any;
}) {
  try {
    let videoRecord = await prisma.video.findFirst({
      where: { youtubeUrl: { contains: data.videoId } }
    });

    if (!videoRecord) {
      videoRecord = await prisma.video.create({
        data: {
          youtubeUrl: data.videoId, 
          title: data.videoTitle || "Video không xác định", 
          channelName: data.channelName || "Kênh Ẩn Danh",
          thumbnail: "",               
          duration: 0                  
        }
      });
    }

    // 1. LƯU LỊCH SỬ THI
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: { userId: data.userId, videoId: videoRecord.id }
    });

    let newlyCorrected = 0; 
    let isNewQuiz = false;

    if (existingAttempt) {
      newlyCorrected = Math.max(0, data.correctCount - existingAttempt.correctCount);
      await prisma.quizAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          score: data.score,
          correctCount: Math.max(data.correctCount, existingAttempt.correctCount),
          totalQuizzes: data.totalQuizzes,
          questionsData: data.questionsData ? JSON.stringify(data.questionsData) : existingAttempt.questionsData,
          createdAt: new Date() 
        }
      });
    } else {
      newlyCorrected = data.correctCount;
      isNewQuiz = true;
      await prisma.quizAttempt.create({
        data: {
          userId: data.userId,
          videoId: videoRecord.id, 
          score: data.score,
          correctCount: data.correctCount,
          totalQuizzes: data.totalQuizzes,
          questionsData: data.questionsData ? JSON.stringify(data.questionsData) : null
        }
      });
    }

    // 2. CẬP NHẬT TIẾN ĐỘ XEM VIDEO
    const existingProgress = await prisma.userProgress.findFirst({
      where: { userId: data.userId, videoId: videoRecord.id }
    });

    let isNewVideo = false;

    if (!existingProgress) {
      isNewVideo = true;
      await prisma.userProgress.create({
        data: { userId: data.userId, videoId: videoRecord.id, isCompleted: true }
      });
    } else if (!existingProgress.isCompleted) {
      isNewVideo = true;
      await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: { isCompleted: true }
      });
    }

    // 3. TÍNH CHUỖI STREAK
    const userRecord = await prisma.user.findUnique({ 
      where: { id: data.userId },
      select: { currentStreak: true, highestStreak: true, lastStudyDate: true, streakFreezes: true }
    });

    let newStreak = 0;
    if (userRecord) {
      const now = new Date();
      const lastDate = userRecord.lastStudyDate ? new Date(userRecord.lastStudyDate) : null;
      
      const getVNDate = (d: Date) => new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const vnNow = getVNDate(now);
      
      const todayMidnight = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate()).getTime();
      const lastMidnight = lastDate ? new Date(getVNDate(lastDate).getFullYear(), getVNDate(lastDate).getMonth(), getVNDate(lastDate).getDate()).getTime() : 0;
      
      const diffDays = lastMidnight ? Math.floor((todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24)) : 0;

      newStreak = userRecord.currentStreak || 0;
      let freezes = userRecord.streakFreezes || 0;

      if (diffDays > 0 || !lastDate) {
        if (diffDays === 1 || !lastDate) {
           newStreak += 1;
        } else if (diffDays > 1) {
           if (freezes > 0) { freezes -= 1; newStreak += 1; } 
           else { newStreak = 1; }
        }
      }

      // 4. LƯU STREAK VÀ UPDATE CHÍNH XÁC VÀO BẢNG STATS
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          currentStreak: newStreak,
          highestStreak: Math.max(userRecord.highestStreak || 0, newStreak),
          lastStudyDate: now,
          streakFreezes: freezes,
          stats: {
            upsert: {
              update: {
                totalQuizAttempts: isNewQuiz ? { increment: 1 } : undefined,
                correctQuizAnswers: newlyCorrected > 0 ? { increment: newlyCorrected } : undefined,
                totalVideoWatched: isNewVideo ? { increment: 1 } : undefined,
              },
              create: {
                totalQuizAttempts: isNewQuiz ? 1 : 0,
                correctQuizAnswers: newlyCorrected,
                totalVideoWatched: isNewVideo ? 1 : 0,
              }
            }
          }
        }
      });
    }

    // ========================================================
    // 5. CẬP NHẬT TIẾN ĐỘ NHIỆM VỤ HÀNG NGÀY (DO_QUIZ)
    // ========================================================
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const quizTask = await prisma.userTaskProgress.findFirst({
        where: {
            userId: data.userId,
            assignedDate: { gte: startOfToday },
            isClaimed: false,
            task: { taskType: "DO_QUIZ" } 
        },
        include: { task: true }
    });

    if (quizTask && quizTask.current < quizTask.task.target) {
        // Chỉ đơn thuần là tăng tiến độ lên +1, KHÔNG tự động chuyển cờ isClaimed và KHÔNG cộng điểm
        await prisma.userTaskProgress.update({
            where: { id: quizTask.id },
            data: { current: quizTask.current + 1 } 
        });
    }

    // 6. GỌI HÀM CỘNG XP/XU CỦA BẢN THÂN BÀI THI (Không gộp chung điểm Task nữa)
    const streakMultiplier = newStreak >= 3 ? 1.2 : 1;
    let earnedXP = Math.round((newlyCorrected * 70) * streakMultiplier); 
    let earnedCoins = newlyCorrected * 7;

    const rewardRes = await addExpAndRewards(data.userId, earnedXP, earnedCoins);

    return { 
      success: true, 
      earnedXP: rewardRes.success ? rewardRes.finalExp : earnedXP, 
      earnedCoins: rewardRes.success ? rewardRes.finalCoins : earnedCoins 
    };

  } catch (error: any) {
    console.error("LỖI LƯU QUÍZ:", error);
    return { success: false, error: error.message };
  }
}

export async function generateTopicReviewAction(data: { topic: string, userId: string }) {
  try {
    const playlistId = data.topic;
    const playlist = await prisma.favoritePlaylist.findFirst({
      where: { playlistId: playlistId }
    });

    let videoUrls: string[] = [];
    if (playlist && playlist.videoIds) {
       videoUrls = playlist.videoIds.split(",").map(id => id.trim()).filter(id => id !== "");
    }

    const videos = await prisma.video.findMany({
      where: { youtubeUrl: { in: videoUrls } }
    });
    const videoIds = videos.map(v => v.id);

    const pastAttempts = await prisma.quizAttempt.findMany({
       where: { userId: data.userId, videoId: { in: videoIds } },
       select: { questionsData: true }
    });

    let questionPool: any[] = [];
    pastAttempts.forEach(attempt => {
       if (attempt.questionsData) {
           try {
              const qs = typeof attempt.questionsData === 'string' ? JSON.parse(attempt.questionsData) : attempt.questionsData;
              if (Array.isArray(qs)) questionPool.push(...qs);
           } catch(e) {}
       }
    });

    questionPool = questionPool.sort(() => 0.5 - Math.random());
    
    let finalQuizzes = questionPool.slice(0, 30).map(q => {
        let optA = q.optionA || (q.options && q.options[0]) || "A";
        let optB = q.optionB || (q.options && q.options[1]) || "B";
        let optC = q.optionC || (q.options && q.options[2]) || "C";
        let optD = q.optionD || (q.options && q.options[3]) || "D";

        let correct = q.correctAnswer || q.answer || "A";
        if (correct.startsWith("A.") || correct === optA) correct = "A";
        else if (correct.startsWith("B.") || correct === optB) correct = "B";
        else if (correct.startsWith("C.") || correct === optC) correct = "C";
        else if (correct.startsWith("D.") || correct === optD) correct = "D";
        else if (['A','B','C','D'].includes(correct[0])) correct = correct[0];

        return {
            questionText: q.questionText || q.question || "Câu hỏi ôn tập",
            optionA: optA.replace(/^[A-D]\.\s*/, ''),
            optionB: optB.replace(/^[A-D]\.\s*/, ''),
            optionC: optC.replace(/^[A-D]\.\s*/, ''),
            optionD: optD.replace(/^[A-D]\.\s*/, ''),
            correctAnswer: correct,
            explanation: q.explanation || "Kiến thức đã học trong khóa.",
            isAdvanced: false
        };
    });

    return { success: true, data: finalQuizzes };
  } catch (error: any) {
    return { success: false, error: "Lỗi trích xuất dữ liệu." };
  }
}

export async function saveSummaryScoreAction(userId: string, playlistId: string, score: number) {
  try {
    await prisma.favoritePlaylist.update({
      where: { userId_playlistId: { userId, playlistId } },
      data: { summaryScore: score }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}