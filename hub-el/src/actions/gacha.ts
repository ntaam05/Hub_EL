// src/actions/gacha.ts
"use server";

import { revalidatePath } from "next/cache";
import {
  rollGachaService,
  getGachaExchangeService,
  exchangeGachaCardService,
  getGachaHistoryService,
} from "@/services/gacha.service";

/**
 * Server Action: Quay 1 thẻ Gacha (tương thích 100% với Web UI)
 */
export async function rollGacha(userId: string) {
  try {
    const res = await rollGachaService(userId, 1);
    if (!res.success || !res.data) {
      return { success: false, message: res.message || "Lỗi khi quay Gacha." };
    }

    const firstRoll = res.data.rolls[0];
    const isNew = firstRoll.isNew;
    const stardust = firstRoll.stardustEarned;
    const isFree = res.data.summary.usedFreePull;

    revalidatePath("/", "layout");

    return {
      success: true,
      card: firstRoll.card,
      message: !isNew
        ? `Trùng thẻ! Nhận được +${stardust} Bụi Sao.`
        : `Thẻ mới! Bạn đã sở hữu ${firstRoll.card.title}. ${isFree ? '(Lượt quay miễn phí VIP)' : ''}`,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Server Action: Lấy lịch sử quay thẻ (tối đa 1000 thẻ gần nhất)
 */
export async function getGachaHistory(userId: string) {
  try {
    const res = await getGachaHistoryService(userId, { page: 1, limit: 1000 });
    if (!res.success || !res.data) return [];
    return res.data.items;
  } catch (error) {
    console.error("Lỗi lấy lịch sử:", error);
    return [];
  }
}

/**
 * Server Action: Lấy số bụi sao và danh sách thẻ chưa sở hữu
 */
export async function getExchangeData(userId: string) {
  try {
    const res = await getGachaExchangeService(userId);
    if (!res.success || !res.data) {
      return { success: false, message: res.message || "Lỗi lấy dữ liệu đổi thẻ." };
    }
    return {
      success: true,
      stardust: res.data.stardust,
      unownedCards: res.data.unownedCards,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Server Action: Dùng bụi sao để đổi lấy thẻ
 */
export async function exchangeCard(userId: string, cardId: number, cost?: number) {
  try {
    const res = await exchangeGachaCardService(userId, cardId);
    if (!res.success) {
      return { success: false, message: res.message || "Lỗi đổi thẻ." };
    }

    revalidatePath("/", "layout");
    return { success: true, message: res.message || "Đổi thẻ thành công!" };
  } catch (error: any) {
    return { success: false, message: error.message || "Lỗi hệ thống khi đổi thẻ." };
  }
}
