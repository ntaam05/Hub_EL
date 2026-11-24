import { prisma } from "@/lib/prisma";
import { updateTaskProgressAction } from "@/actions/quests/progress";

// Chi phí và bản đồ quy đổi Bụi Sao theo tỷ lệ gốc của web
export const GACHA_CONSTANTS = {
  ROLL_COST: 100,
  STARDUST_MAP: {
    N: 1,
    R: 5,
    SR: 20,
    SSR: 100,
    UR: 500,
    LR: 1000,
    MR: 5000,
  } as Record<string, number>,
  RARITY_COST: {
    MR: 5000,
    LR: 2000,
    UR: 800,
    SSR: 300,
    SR: 100,
    R: 30,
    N: 10,
  } as Record<string, number>,
  PITY_CAPS: {
    SR: 10,
    SSR: 50,
    UR: 120,
  },
  PITY_UR_RESET: new Set(["UR", "LR", "MR"]),
  PITY_SSR_RESET: new Set(["SSR", "UR", "LR", "MR"]),
  PITY_SR_RESET: new Set(["SR", "SSR", "UR", "LR", "MR"]),
};

export interface GachaStatusDTO {
  freeCoins: number;
  stardust: number;
  pitySR: number;
  pitySSR: number;
  pityUR: number;
  isPro: boolean;
  isFreePullAvailable: boolean;
  lastFreeGachaDate: Date | null;
  rollCost: number;
  pityCaps: {
    sr: number;
    ssr: number;
    ur: number;
  };
}

export interface GachaRollItemDTO {
  card: {
    id: number;
    title: string;
    rarity: string;
    imageUrl: string | null;
    wikiUrl: string | null;
    totalStars: number;
    awakenedStars: number;
  };
  isNew: boolean;
  stardustEarned: number;
}

export interface GachaRollResultDTO {
  rolls: GachaRollItemDTO[];
  summary: {
    totalRolls: number;
    coinsSpent: number;
    stardustEarned: number;
    newCardsCount: number;
    duplicateCardsCount: number;
    usedFreePull: boolean;
    remainingCoins: number;
    totalStardust: number;
    pitySR: number;
    pitySSR: number;
    pityUR: number;
  };
}

/**
 * Kiểm tra xem người dùng PRO hôm nay còn lượt quay miễn phí hay không
 */
export function isFreeGachaAvailable(isPro: boolean, lastFreeDate: Date | null | undefined): boolean {
  if (!isPro) return false;
  if (!lastFreeDate) return true;

  const now = new Date();
  const last = new Date(lastFreeDate);
  return (
    now.getFullYear() !== last.getFullYear() ||
    now.getMonth() !== last.getMonth() ||
    now.getDate() !== last.getDate()
  );
}

/**
 * 1. Lấy trạng thái Gacha của người dùng
 */
export async function getGachaStatusService(userId: string): Promise<{
  success: boolean;
  data?: GachaStatusDTO;
  message?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        freeCoins: true,
        stardust: true,
        pitySR: true,
        pitySSR: true,
        pityUR: true,
        isPro: true,
        lastFreeGachaDate: true,
      },
    });

    if (!user) {
      return { success: false, message: "Không tìm thấy người dùng!" };
    }

    const freePullAvailable = isFreeGachaAvailable(user.isPro, user.lastFreeGachaDate);

    return {
      success: true,
      data: {
        freeCoins: user.freeCoins,
        stardust: user.stardust,
        pitySR: user.pitySR,
        pitySSR: user.pitySSR,
        pityUR: user.pityUR,
        isPro: user.isPro,
        isFreePullAvailable: freePullAvailable,
        lastFreeGachaDate: user.lastFreeGachaDate,
        rollCost: GACHA_CONSTANTS.ROLL_COST,
        pityCaps: {
          sr: GACHA_CONSTANTS.PITY_CAPS.SR,
          ssr: GACHA_CONSTANTS.PITY_CAPS.SSR,
          ur: GACHA_CONSTANTS.PITY_CAPS.UR,
        },
      },
    };
  } catch (error: any) {
    console.error("Lỗi getGachaStatusService:", error);
    return { success: false, message: error.message || "Lỗi hệ thống khi lấy trạng thái Gacha." };
  }
}

/**
 * 2. Thực hiện quay Gacha (1 đến 5 lượt) trong ACID Transaction
 */
export async function rollGachaService(
  userId: string,
  count: number = 1
): Promise<{
  success: boolean;
  data?: GachaRollResultDTO;
  code?: string;
  message?: string;
}> {
  try {
    // Validate count
    if (!Number.isInteger(count) || count < 1 || count > 5) {
      return {
        success: false,
        code: "INVALID_COUNT",
        message: "Số lượt quay phải từ 1 đến 5.",
      };
    }

    const txResult = await prisma.$transaction(
      async (tx) => {
        // 1. Lấy trạng thái user mới nhất trong transaction
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        // 2. Tính toán chi phí & lượt quay miễn phí PRO
        const hasFreePull = isFreeGachaAvailable(user.isPro, user.lastFreeGachaDate);
        let coinsRequired = 0;

        if (hasFreePull) {
          // Lượt đầu tiên free, (count - 1) lượt tiếp theo tính 100 Xu/lượt
          coinsRequired = (count - 1) * GACHA_CONSTANTS.ROLL_COST;
        } else {
          coinsRequired = count * GACHA_CONSTANTS.ROLL_COST;
        }

        if (user.freeCoins < coinsRequired) {
          return {
            success: false,
            code: "INSUFFICIENT_COINS",
            message: `Bạn không đủ Xu Gacha! Cần ${coinsRequired} Xu nhưng bạn chỉ có ${user.freeCoins} Xu.`,
          };
        }

        // 3. Chuẩn bị chạy vòng lặp quay thẻ
        let runningPityUR = Number(user.pityUR || 0);
        let runningPitySSR = Number(user.pitySSR || 0);
        let runningPitySR = Number(user.pitySR || 0);

        const rollResults: GachaRollItemDTO[] = [];
        let totalStardustGained = 0;
        let newCardsCount = 0;
        let duplicateCardsCount = 0;

        // Theo dõi các thẻ được mở trong lần multi-roll này để tránh tạo trùng bản ghi UserInventory
        const newlyAcquiredInThisRoll = new Set<number>();

        for (let i = 0; i < count; i++) {
          const nextPityUR = runningPityUR + 1;
          const nextPitySSR = runningPitySSR + 1;
          const nextPitySR = runningPitySR + 1;

          let rolledRarity = "N";

          // Logic bảo hiểm (Pity)
          if (nextPityUR >= GACHA_CONSTANTS.PITY_CAPS.UR) {
            rolledRarity = "UR";
          } else if (nextPitySSR >= GACHA_CONSTANTS.PITY_CAPS.SSR) {
            rolledRarity = "SSR";
          } else if (nextPitySR >= GACHA_CONSTANTS.PITY_CAPS.SR) {
            rolledRarity = "SR";
          } else {
            // Tỷ lệ ngẫu nhiên
            const roll = Math.random() * 100;
            if (roll < 0.05) rolledRarity = "MR";
            else if (roll < 0.20) rolledRarity = "LR";
            else if (roll < 1.00) rolledRarity = "UR";
            else if (roll < 5.00) rolledRarity = "SSR";
            else if (roll < 20.00) rolledRarity = "SR";
            else if (roll < 50.00) rolledRarity = "R";
            else rolledRarity = "N";
          }

          // Truy vấn ngẫu nhiên thẻ theo phẩm chất
          const cardsCount = await tx.wikiCard.count({ where: { rarity: rolledRarity } });
          let finalCard = null;

          if (cardsCount > 0) {
            const skip = Math.floor(Math.random() * cardsCount);
            finalCard = await tx.wikiCard.findFirst({
              where: { rarity: rolledRarity },
              skip: skip,
            });
          }

          // Fallback thẻ N nếu phẩm chất chưa có thẻ
          if (!finalCard) {
            const fallbackCount = await tx.wikiCard.count({ where: { rarity: "N" } });
            const skipFallback = Math.floor(Math.random() * (fallbackCount || 1));
            finalCard = await tx.wikiCard.findFirst({
              where: { rarity: "N" },
              skip: skipFallback,
            });
          }

          if (!finalCard) {
            throw new Error("CARD_DATA_EMPTY");
          }

          // Kiểm tra sở hữu trong database
          const existingInventory = await tx.userInventory.findUnique({
            where: { userId_cardId: { userId, cardId: finalCard.id } },
          });

          const isDuplicate = existingInventory != null || newlyAcquiredInThisRoll.has(finalCard.id);

          let stardustEarned = 0;

          if (isDuplicate) {
            // Thẻ trùng: quy đổi ra Bụi Sao (+20% nếu VIP PRO)
            let baseStardust = GACHA_CONSTANTS.STARDUST_MAP[finalCard.rarity] || 1;
            if (user.isPro) {
              baseStardust = Math.floor(baseStardust * 1.2);
            }
            stardustEarned = baseStardust;
            totalStardustGained += stardustEarned;
            duplicateCardsCount++;
          } else {
            // Thẻ mới: tạo bản ghi sở hữu
            newlyAcquiredInThisRoll.add(finalCard.id);
            newCardsCount++;

            await tx.userInventory.create({
              data: {
                userId,
                cardId: finalCard.id,
                source: "GACHA",
                isNew: true,
                currentStar: 0,
                isCompleted: false,
              },
            });
          }

          rollResults.push({
            card: {
              id: finalCard.id,
              title: finalCard.title,
              rarity: finalCard.rarity,
              imageUrl: finalCard.imageUrl,
              wikiUrl: finalCard.wikiUrl,
              totalStars: finalCard.totalStars,
              awakenedStars: finalCard.awakenedStars,
            },
            isNew: !isDuplicate,
            stardustEarned: stardustEarned,
          });

          // Cập nhật bộ đếm Pity theo phẩm chất vừa quay được
          if (GACHA_CONSTANTS.PITY_UR_RESET.has(rolledRarity)) {
            runningPityUR = 0;
            runningPitySSR = 0;
            runningPitySR = 0;
          } else if (GACHA_CONSTANTS.PITY_SSR_RESET.has(rolledRarity)) {
            runningPitySSR = 0;
            runningPitySR = 0;
            runningPityUR = nextPityUR;
          } else if (GACHA_CONSTANTS.PITY_SR_RESET.has(rolledRarity)) {
            runningPitySR = 0;
            runningPitySSR = nextPitySSR;
            runningPityUR = nextPityUR;
          } else {
            runningPitySR = nextPitySR;
            runningPitySSR = nextPitySSR;
            runningPityUR = nextPityUR;
          }
        }

        // 4. Cập nhật User trong transaction
        const updateData: any = {
          freeCoins: { decrement: coinsRequired },
          pitySR: runningPitySR,
          pitySSR: runningPitySSR,
          pityUR: runningPityUR,
          stats: {
            upsert: {
              create: {
                totalGachaPulls: count,
                totalCoinsSpent: coinsRequired,
              },
              update: {
                totalGachaPulls: { increment: count },
                totalCoinsSpent: { increment: coinsRequired },
              },
            },
          },
        };

        if (totalStardustGained > 0) {
          updateData.stardust = { increment: totalStardustGained };
        }

        if (hasFreePull) {
          updateData.lastFreeGachaDate = new Date();
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: updateData,
        });

        return {
          success: true,
          data: {
            rolls: rollResults,
            summary: {
              totalRolls: count,
              coinsSpent: coinsRequired,
              stardustEarned: totalStardustGained,
              newCardsCount,
              duplicateCardsCount,
              usedFreePull: hasFreePull,
              remainingCoins: updatedUser.freeCoins,
              totalStardust: updatedUser.stardust,
              pitySR: runningPitySR,
              pitySSR: runningPitySSR,
              pityUR: runningPityUR,
            },
          },
        };
      },
      { maxWait: 10000, timeout: 20000 }
    );

    // 5. Cập nhật tiến độ nhiệm vụ sau khi transaction đã commit thành công
    if (txResult.success && txResult.data) {
      try {
        await updateTaskProgressAction(userId, "ROLL_GACHA", count);
        await updateTaskProgressAction(userId, "GACHA_PULL", count);
        if (txResult.data.summary.coinsSpent > 0) {
          await updateTaskProgressAction(userId, "SPEND_COIN", txResult.data.summary.coinsSpent);
        }
      } catch (_) {}
    }

    return txResult;
  } catch (error: any) {
    console.error("Lỗi rollGachaService:", error);
    if (error.message === "USER_NOT_FOUND") {
      return { success: false, code: "USER_NOT_FOUND", message: "Không tìm thấy người dùng." };
    }
    if (error.message === "CARD_DATA_EMPTY") {
      return { success: false, code: "CARD_DATA_EMPTY", message: "Hệ thống chưa có dữ liệu thẻ bài." };
    }
    return { success: false, code: "SYSTEM_ERROR", message: error.message || "Lỗi hệ thống khi quay Gacha." };
  }
}

/**
 * 3. Lấy danh sách thẻ chưa sở hữu và Bụi sao hiện có
 */
export async function getGachaExchangeService(userId: string): Promise<{
  success: boolean;
  data?: {
    stardust: number;
    unownedCards: any[];
    costs: Record<string, number>;
  };
  message?: string;
}> {
  try {
    const [user, unownedCards] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { stardust: true },
      }),
      prisma.wikiCard.findMany({
        where: {
          NOT: {
            owners: {
              some: { userId: userId },
            },
          },
        },
        orderBy: [{ rarity: "desc" }, { id: "asc" }],
      }),
    ]);

    if (!user) {
      return { success: false, message: "Không tìm thấy người dùng!" };
    }

    return {
      success: true,
      data: {
        stardust: user.stardust,
        unownedCards: unownedCards.map((c) => ({
          id: c.id,
          title: c.title,
          rarity: c.rarity,
          imageUrl: c.imageUrl,
          wikiUrl: c.wikiUrl,
          totalStars: c.totalStars,
          awakenedStars: c.awakenedStars,
          cost: GACHA_CONSTANTS.RARITY_COST[c.rarity] || 10,
        })),
        costs: GACHA_CONSTANTS.RARITY_COST,
      },
    };
  } catch (error: any) {
    console.error("Lỗi getGachaExchangeService:", error);
    return { success: false, message: error.message || "Lỗi khi lấy dữ liệu tiệm đổi thẻ." };
  }
}

/**
 * 4. Đổi thẻ chưa sở hữu bằng Bụi sao trong ACID Transaction
 */
export async function exchangeGachaCardService(
  userId: string,
  cardId: number
): Promise<{
  success: boolean;
  code?: string;
  data?: {
    card: any;
    cost: number;
    remainingStardust: number;
  };
  message?: string;
}> {
  try {
    if (!cardId || typeof cardId !== "number" || cardId <= 0) {
      return {
        success: false,
        code: "INVALID_CARD_ID",
        message: "ID thẻ bài không hợp lệ.",
      };
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra thẻ tồn tại
      const targetCard = await tx.wikiCard.findUnique({
        where: { id: cardId },
      });

      if (!targetCard) {
        return {
          success: false,
          code: "CARD_NOT_FOUND",
          message: "Thẻ bài không tồn tại trên hệ thống.",
        };
      }

      const cost = GACHA_CONSTANTS.RARITY_COST[targetCard.rarity] || 10;

      // 2. Kiểm tra người dùng và số dư Bụi sao
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, stardust: true },
      });

      if (!user) {
        return {
          success: false,
          code: "USER_NOT_FOUND",
          message: "Không tìm thấy người dùng.",
        };
      }

      if (user.stardust < cost) {
        return {
          success: false,
          code: "INSUFFICIENT_STARDUST",
          message: `Không đủ Bụi Sao! Cần ${cost} Bụi Sao nhưng bạn chỉ có ${user.stardust}.`,
        };
      }

      // 3. Kiểm tra tính sở hữu (Chống đổi trùng / race condition)
      const existing = await tx.userInventory.findUnique({
        where: { userId_cardId: { userId, cardId } },
      });

      if (existing) {
        return {
          success: false,
          code: "ALREADY_OWNED",
          message: "Bạn đã sở hữu thẻ bài này rồi!",
        };
      }

      // 4. Trừ Bụi sao và thêm thẻ vào kho
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { stardust: { decrement: cost } },
      });

      await tx.userInventory.create({
        data: {
          userId,
          cardId,
          source: "EXCHANGE",
          isNew: true,
          currentStar: 0,
          isCompleted: false,
        },
      });

      return {
        success: true,
        data: {
          card: {
            id: targetCard.id,
            title: targetCard.title,
            rarity: targetCard.rarity,
            imageUrl: targetCard.imageUrl,
            wikiUrl: targetCard.wikiUrl,
            totalStars: targetCard.totalStars,
            awakenedStars: targetCard.awakenedStars,
          },
          cost,
          remainingStardust: updatedUser.stardust,
        },
        message: "Đổi thẻ thành công!",
      };
    }, { maxWait: 10000, timeout: 20000 });
  } catch (error: any) {
    console.error("Lỗi exchangeGachaCardService:", error);
    return {
      success: false,
      code: "SYSTEM_ERROR",
      message: error.message || "Lỗi hệ thống khi đổi thẻ.",
    };
  }
}

/**
 * 5. Lấy lịch sử nhận thẻ (hỗ trợ phân trang)
 */
export async function getGachaHistoryService(
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{
  success: boolean;
  data?: {
    items: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}> {
  try {
    const page = Math.max(1, Number(options?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options?.limit || 20)));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.userInventory.count({
        where: { userId },
      }),
      prisma.userInventory.findMany({
        where: { userId },
        orderBy: { acquiredAt: "desc" },
        skip,
        take: limit,
        include: {
          card: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((inv) => ({
          id: inv.id,
          cardId: inv.cardId,
          acquiredAt: inv.acquiredAt,
          source: inv.source,
          currentStar: inv.currentStar,
          isCompleted: inv.isCompleted,
          isNew: inv.isNew,
          card: {
            id: inv.card.id,
            title: inv.card.title,
            rarity: inv.card.rarity,
            imageUrl: inv.card.imageUrl,
            wikiUrl: inv.card.wikiUrl,
            totalStars: inv.card.totalStars,
            awakenedStars: inv.card.awakenedStars,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error: any) {
    console.error("Lỗi getGachaHistoryService:", error);
    return {
      success: false,
      message: error.message || "Lỗi hệ thống khi lấy lịch sử quay thẻ.",
    };
  }
}
