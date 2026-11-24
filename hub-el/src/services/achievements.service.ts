// src/services/achievements.service.ts
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENT_LIST } from "@/config/achievements";

export async function getAchievementsService(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "Chưa xác thực người dùng.",
        data: null,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
        achievements: { select: { achievementId: true, unlockedAt: true } },
        inventory: {
          include: {
            card: {
              include: { vocabularies: true },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Không tìm thấy người dùng.",
        data: null,
      };
    }

    // Đảm bảo toàn bộ 64 thành tựu có mặt trong Database
    let dbAchievements = await prisma.achievement.findMany();
    const missingAchievements = ACHIEVEMENT_LIST.filter(
      (config) => !dbAchievements.some((db) => db.code === config.id)
    );

    if (missingAchievements.length > 0) {
      for (const missing of missingAchievements) {
        await prisma.achievement.upsert({
          where: { code: missing.id },
          update: {
            name: missing.title,
            description: missing.desc,
            rewardXp: missing.rewardXp || (missing.tier || 1) * 100,
          },
          create: {
            code: missing.id,
            name: missing.title,
            description: missing.desc,
            rewardXp: missing.rewardXp || (missing.tier || 1) * 100,
          },
        });
      }
      dbAchievements = await prisma.achievement.findMany();
    }

    const ownedMap = new Map<number, Date>();
    user.achievements.forEach((a) => {
      ownedMap.set(a.achievementId, a.unlockedAt);
    });

    const newlyUnlockedIds: number[] = [];
    const newlyUnlockedDetails: any[] = [];

    let actualVocabCount = 0;
    user.inventory.forEach((item: any) => {
      actualVocabCount += item.card?.vocabularies?.length || 0;
    });

    const aggregatedData: Record<string, any> = {
      ...user,
      ...(user.stats || {}),
      learnedWordsCount: actualVocabCount,
    };

    for (const config of ACHIEVEMENT_LIST) {
      const dbAch = dbAchievements.find((a) => a.code === config.id);
      if (!dbAch || ownedMap.has(dbAch.id)) continue;

      const currentValue = Number(aggregatedData[config.reqType]) || 0;

      if (currentValue >= config.reqValue) {
        newlyUnlockedIds.push(dbAch.id);
        newlyUnlockedDetails.push({
          id: config.id,
          title: config.title,
          desc: config.desc,
          tier: config.tier,
          rewardXp: config.rewardXp || 0,
          rewardCoins: config.rewardCoins || 0,
          rewardEnergy: config.rewardEnergy || 0,
        });
      }
    }

    let totalXpBonus = 0;
    let totalCoinsBonus = 0;
    let totalEnergyBonus = 0;
    const actuallyUnlockedDetails: any[] = [];
    let actuallyUnlockedIds: number[] = [];

    if (newlyUnlockedIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Double-check existing unlocks inside transaction to prevent concurrent duplicate rewards
        const alreadyUnlocked = await tx.userAchievement.findMany({
          where: {
            userId,
            achievementId: { in: newlyUnlockedIds },
          },
          select: { achievementId: true },
        });

        const alreadySet = new Set(alreadyUnlocked.map((a) => a.achievementId));
        const toUnlockIds = newlyUnlockedIds.filter((id) => !alreadySet.has(id));

        if (toUnlockIds.length === 0) return;

        for (const achId of toUnlockIds) {
          await tx.userAchievement.create({
            data: { userId, achievementId: achId },
          });

          const dbAch = dbAchievements.find((a) => a.id === achId);
          const configDef = ACHIEVEMENT_LIST.find((c) => c.id === dbAch?.code);

          if (configDef) {
            totalXpBonus += configDef.rewardXp || 0;
            totalCoinsBonus += configDef.rewardCoins || 0;
            totalEnergyBonus += configDef.rewardEnergy || 0;
            actuallyUnlockedDetails.push({
              id: configDef.id,
              title: configDef.title,
              desc: configDef.desc,
              tier: configDef.tier,
              rewardXp: configDef.rewardXp || 0,
              rewardCoins: configDef.rewardCoins || 0,
              rewardEnergy: configDef.rewardEnergy || 0,
            });
          }
        }

        actuallyUnlockedIds = toUnlockIds;

        if (totalXpBonus > 0 || totalCoinsBonus > 0 || totalEnergyBonus > 0) {
          await tx.user.update({
            where: { id: userId },
            data: {
              xp: { increment: totalXpBonus },
              freeCoins: { increment: totalCoinsBonus },
              aiTokens: { increment: totalEnergyBonus },
            },
          });
        }
      });
    }

    const finalOwnedIds = new Set([
      ...Array.from(ownedMap.keys()),
      ...actuallyUnlockedIds,
    ]);

    const displayAchievements = ACHIEVEMENT_LIST.map((config) => {
      const dbAch = dbAchievements.find((a) => a.code === config.id);
      const isUnlocked = dbAch ? finalOwnedIds.has(dbAch.id) : false;
      const progressValue = Number(aggregatedData[config.reqType]) || 0;

      return {
        id: config.id,
        groupId: config.groupId,
        tier: config.tier,
        title: config.title,
        desc: config.desc,
        reqType: config.reqType,
        reqValue: config.reqValue,
        currentProgress: progressValue,
        progressPercent: Math.min(
          100,
          Math.round((progressValue / (config.reqValue || 1)) * 100)
        ),
        isUnlocked,
        rewardXp: config.rewardXp || 0,
        rewardCoins: config.rewardCoins || 0,
        rewardEnergy: config.rewardEnergy || 0,
      };
    });

    const unlockedCount = displayAchievements.filter((a) => a.isUnlocked).length;
    const totalCount = ACHIEVEMENT_LIST.length;

    return {
      success: true,
      data: {
        summary: {
          totalCount,
          unlockedCount,
          progressPercent:
            totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
        },
        achievements: displayAchievements,
        newlyUnlocked: actuallyUnlockedDetails,
        earnedXP: totalXpBonus,
        earnedCoins: totalCoinsBonus,
        earnedEnergy: totalEnergyBonus,
      },
    };
  } catch (error: any) {
    console.error("LỖI CHECK THÀNH TỰU SERVICE:", error);
    return {
      success: false,
      error: error.message || "Lỗi hệ thống khi tải thành tựu.",
      data: null,
    };
  }
}

