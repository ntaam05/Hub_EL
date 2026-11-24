import { prisma } from "@/lib/prisma";
import { getMaxEnergy } from "@/lib/leveling";

export async function syncUserStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastStudyDate: true,
        currentStreak: true,
        level: true,
        isPro: true,
        gracePeriodEndsAt: true,
        aiTokens: true,
      },
    });

    if (!user) return null;

    const vnTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const today = new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate()));

    let needsUpdate = false;
    const updateData: any = {};

    if (user.lastStudyDate) {
      const lastStudy = new Date(user.lastStudyDate);
      const lastStudyDay = new Date(Date.UTC(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate()));

      const diffDays = Math.floor((today.getTime() - lastStudyDay.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 1 && user.currentStreak > 0) {
        updateData.currentStreak = 0;
        needsUpdate = true;
      }
    }

    const maxEnergy = getMaxEnergy(user.level, user.isPro);
    const isGracePeriodActive = user.gracePeriodEndsAt && new Date(user.gracePeriodEndsAt) > vnTime;

    if (!user.isPro && !isGracePeriodActive && user.aiTokens > maxEnergy) {
      updateData.aiTokens = maxEnergy;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return {
      syncedStreak: updateData.currentStreak !== undefined ? updateData.currentStreak : user.currentStreak,
      syncedTokens: updateData.aiTokens !== undefined ? updateData.aiTokens : user.aiTokens,
      maxEnergy,
    };
  } catch (error) {
    console.error("syncUserStatus error:", error);
    return null;
  }
}

