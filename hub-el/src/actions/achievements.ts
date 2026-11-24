// src/actions/achievements.ts
"use server";
import { getAchievementsService } from "@/services/achievements.service";

export async function checkAndGetAchievements(userId: string) {
  try {
    const res = await getAchievementsService(userId);
    if (!res.success || !res.data) {
      return { success: false, message: res.error || "Lỗi hệ thống", data: [], newlyUnlocked: [] };
    }
    return {
      success: true,
      data: res.data.achievements,
      newlyUnlocked: res.data.newlyUnlocked,
      earnedXP: res.data.earnedXP,
      earnedCoins: res.data.earnedCoins,
      earnedEnergy: res.data.earnedEnergy,
    };
  } catch (error) {
    console.error("LỖI CHECK THÀNH TỰU ACTION:", error);
    return { success: false, message: "Lỗi hệ thống", data: [], newlyUnlocked: [] };
  }
}
