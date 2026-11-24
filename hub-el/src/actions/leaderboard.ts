// src/actions/leaderboard.ts
"use server";

import { getLeaderboardService } from "@/services/leaderboard.service";

/**
 * Server Action lấy dữ liệu bảng xếp hạng cho Web
 * Đã refactor để dùng chung Leaderboard Backend Service
 */
export async function getLeaderboardData(category: string, timeframe: string) {
  try {
    const res = await getLeaderboardService(category, timeframe);
    if (!res.success || !res.data) {
      return { success: false, message: res.error || "Lỗi tải dữ liệu bảng xếp hạng" };
    }

    // Map sang cấu trúc tương thích ngược 100% với Web (id, name, avatar, scoreValue, scoreLabel, subLabel, rank)
    const webData = res.data.topPlayers.map((p) => ({
      id: p.userId,
      name: p.displayName,
      avatar: p.avatar,
      isPro: p.isPro,
      scoreValue: p.scoreValue,
      scoreLabel: p.scoreLabel,
      subLabel: p.subLabel,
      rank: p.rank,
    }));

    return { success: true, data: webData };
  } catch (error: any) {
    console.error("Lỗi lấy dữ liệu xếp hạng:", error);
    return { success: false, message: "Lỗi kết nối CSDL." };
  }
}
