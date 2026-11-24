// src/actions/quiz.ts
"use server";

import { prisma } from "@/lib/prisma";
import { addExpAndRewards } from "@/lib/leveling";
import { revalidatePath } from "next/cache";
import {
  generateWikiStudyService,
  keepWikiCardStarService,
} from "@/services/wiki-study.service";

interface QuizConfig {
  numQs: number;
  types: string[];
  wordMin: number;
  wordMax: number;
  targetLanguage?: string;
  languageLevel?: string;
}

// Chức năng: Xử lý logic tạo bài giảng và câu hỏi bằng AI qua WikiStudyService
export async function generateQuizFromWikiCard(
  userId: string,
  cardId: number,
  config: QuizConfig
) {
  try {
    const result = await generateWikiStudyService(
      userId,
      {
        cardId,
        language: config.targetLanguage,
        level: config.languageLevel,
        numQs: config.numQs,
        wordMin: config.wordMin,
        wordMax: config.wordMax,
        quizTypes: config.types,
      },
      { hideAnswers: false } // Web cần đáp án và giải thích ngay khi nhấn "Xác nhận"
    );

    if (!result.success) {
      return {
        success: false,
        message: result.error?.message || "Không thể tạo bài học AI",
      };
    }

    return {
      success: true,
      data: {
        simplifiedText: result.data?.simplifiedText,
        vocabularies: result.data?.vocabularies,
        quizzes: result.data?.quizzes,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Lỗi khi gọi AI tạo bài học",
    };
  }
}

// Chức năng: Tính XP, tiền thưởng xu, cộng/trừ mốc thức tỉnh của thẻ, tính chuỗi học tập (streak).
export async function addExpToUser(
  userId: string,
  cardId: number,
  correctAnswers: number,
  isPass: boolean
) {
  try {
    const card = await prisma.wikiCard.findUnique({ where: { id: cardId } });
    if (!card) return { success: false, message: "Thẻ không tồn tại" };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "Không tìm thấy người dùng" };

    const inventory = await prisma.userInventory.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });

    let currentAwakened = card.awakenedStars;
    let isLostStar = false;
    let baseGainedCoins = 0;

    // Business Rule: Đậu sẽ tăng sao, trượt sẽ mất sao
    if (isPass) {
      if (card.awakenedStars < card.totalStars) {
        const updatedCard = await prisma.wikiCard.update({
          where: { id: cardId },
          data: { awakenedStars: { increment: 1 } },
        });
        currentAwakened = updatedCard.awakenedStars;
        baseGainedCoins = 10;
      }
      if (inventory && inventory.currentStar < card.totalStars) {
        await prisma.userInventory.update({
          where: { id: inventory.id },
          data: {
            currentStar: { increment: 1 },
            isCompleted: inventory.currentStar + 1 >= card.totalStars,
          },
        });
      }
    } else {
      if (card.awakenedStars > 0) {
        const updatedCard = await prisma.wikiCard.update({
          where: { id: cardId },
          data: { awakenedStars: { decrement: 1 } },
        });
        currentAwakened = updatedCard.awakenedStars;
        isLostStar = true;
      }
      if (inventory && inventory.currentStar > 0) {
        await prisma.userInventory.update({
          where: { id: inventory.id },
          data: {
            currentStar: { decrement: 1 },
            isCompleted: false,
          },
        });
      }
    }

    const baseExpGained = correctAnswers * 10;
    const rewardResult = await addExpAndRewards(userId, baseExpGained, baseGainedCoins);

    if (!rewardResult.success) {
      return { success: false, message: "Lỗi trong quá trình tính toán Level/XP" };
    }

    // Logic Streak
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;

    let newStreak = user.currentStreak;
    let newHighestStreak = user.highestStreak;
    let updateStreakData: any = {};

    if (!lastStudy) {
      newStreak = 1;
      newHighestStreak = 1;
      updateStreakData = { currentStreak: 1, highestStreak: 1, lastStudyDate: now };
    } else {
      const lastStudyDay = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate());
      const diffTime = today.getTime() - lastStudyDay.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
        if (newStreak > newHighestStreak) newHighestStreak = newStreak;
        updateStreakData = { currentStreak: newStreak, highestStreak: newHighestStreak, lastStudyDate: now };
      } else if (diffDays > 1) {
        updateStreakData = { currentStreak: 1, lastStudyDate: now };
      } else {
        updateStreakData = { lastStudyDate: now };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateStreakData,
    });

    const todayForDB = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    await prisma.dailyStat.upsert({
      where: {
        userId_date: { userId: userId, date: todayForDB },
      },
      update: {
        xpGained: { increment: rewardResult.finalExp },
      },
      create: {
        userId: userId,
        date: todayForDB,
        xpGained: rewardResult.finalExp,
        studySeconds: 0,
        correctAnswers: 0,
        quizAttempts: 0,
      },
    });

    try {
      revalidatePath("/", "layout");
    } catch {}

    return {
      success: true,
      expGained: rewardResult.finalExp,
      gainedCoins: rewardResult.finalCoins,
      newAwakenedStars: currentAwakened,
      isLostStar: isLostStar,
      leveledUp: rewardResult.hasLeveledUp,
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Lỗi cộng điểm hệ thống" };
  }
}

// Chức năng: Đổi 50 Xu để phục hồi lại sao của thẻ bị đánh rớt
export async function keepCardStar(userId: string, cardId: number) {
  try {
    // Tìm lượt thi trượt gần nhất của user trên card này
    const latestAttempt = await prisma.wikiQuizAttempt.findFirst({
      where: {
        userId,
        cardId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (latestAttempt) {
      const res = await keepWikiCardStarService(userId, latestAttempt.id);
      if (res.success) {
        return { success: true, message: "Bảo vệ sao thành công!" };
      }
      return { success: false, message: res.error?.message || "Không thể giữ sao" };
    }

    // Fallback nếu chưa có attempt: Kiểm tra xu và trừ xu trực tiếp
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.freeCoins < 50) {
      return { success: false, message: "Bạn không đủ 50 Xu để giữ sao!" };
    }

    const SAVE_COST = 50;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { freeCoins: { decrement: SAVE_COST } },
      }),
      prisma.wikiCard.update({
        where: { id: cardId },
        data: { awakenedStars: { increment: 1 } },
      }),
      prisma.userStats.upsert({
        where: { userId },
        update: { totalCoinsSpent: { increment: SAVE_COST } },
        create: { userId, totalCoinsSpent: SAVE_COST },
      }),
    ]);

    try {
      revalidatePath("/", "layout");
    } catch {}

    return { success: true, message: "Bảo vệ sao thành công!" };
  } catch (error: any) {
    return { success: false, message: `Lỗi hệ thống: ${error.message}` };
  }
}

// Chức năng: Ghi nhận dữ liệu làm bài để xem lại sau
export async function saveWikiQuizHistory(
  userId: string,
  cardId: number,
  score: number,
  correctCount: number,
  totalQuizzes: number,
  userAnswers: string[],
  lessonSnapshot: any
) {
  try {
    const attempt = await prisma.wikiQuizAttempt.create({
      data: {
        userId: userId,
        cardId: cardId,
        score: score,
        correctCount: correctCount,
        totalQuizzes: totalQuizzes,
        userAnswers: JSON.stringify(userAnswers),
        lessonSnapshot: JSON.stringify(lessonSnapshot),
      },
    });

    await prisma.userStats.upsert({
      where: { userId: userId },
      update: {
        correctQuizAnswers: { increment: correctCount },
        totalQuizAttempts: { increment: totalQuizzes },
      },
      create: {
        userId: userId,
        correctQuizAnswers: correctCount,
        totalQuizAttempts: totalQuizzes,
      },
    });

    const now = new Date();
    const todayForDB = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    await prisma.dailyStat.upsert({
      where: {
        userId_date: { userId: userId, date: todayForDB },
      },
      update: {
        correctAnswers: { increment: correctCount },
        quizAttempts: { increment: totalQuizzes },
      },
      create: {
        userId: userId,
        date: todayForDB,
        xpGained: 0,
        studySeconds: 0,
        correctAnswers: correctCount,
        quizAttempts: totalQuizzes,
      },
    });

    return { success: true, attemptId: attempt.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
