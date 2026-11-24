import { prisma } from "@/lib/prisma";

export interface WikiQuizAttemptDTO {
  id: number;
  cardId: number;
  score: number;
  correctCount: number;
  totalQuizzes: number;
  createdAt: Date;
  userAnswers: string | null;
  lessonSnapshot: string | null;
}

export interface WikiCardDTO {
  id: number;
  title: string;
  rarity: string;
  imageUrl: string | null;
  wikiUrl: string | null;
  aiContent: string;
  totalStars: number;
  awakenedStars: number;
  contentText: string | null;
  attempts: WikiQuizAttemptDTO[];
}

export interface WikiInventoryItemDTO {
  id: number | null;
  cardId: number;
  isOwned: boolean;
  acquiredAt: Date | null;
  currentStar: number;
  isNew: boolean;
  isCompleted: boolean;
  canShareCount: number;
  source: string | null;
  card: WikiCardDTO;
}

export async function getWikiManagementService(userId: string): Promise<{
  success: boolean;
  data?: WikiInventoryItemDTO[];
  message?: string;
}> {
  try {
    // 1. Truy vấn toàn bộ danh sách WikiCard trong cơ sở dữ liệu
    // Bảo mật: Lọc attempts strictly theo userId của người dùng hiện tại
    const allCards = await prisma.wikiCard.findMany({
      include: {
        attempts: {
          where: { userId: userId },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { id: "asc" },
    });

    // 2. Truy vấn kho đồ UserInventory của người dùng
    const userInventory = await prisma.userInventory.findMany({
      where: { userId: userId },
      select: {
        id: true,
        cardId: true,
        acquiredAt: true,
        currentStar: true,
        isNew: true,
        isCompleted: true,
        canShareCount: true,
        source: true,
      },
    });

    // Tạo bản đồ ánh xạ nhanh theo cardId (O(1) lookup)
    const inventoryMap = new Map<number, (typeof userInventory)[0]>();
    for (const inv of userInventory) {
      inventoryMap.set(inv.cardId, inv);
    }

    // 3. Kết hợp dữ liệu: Thẻ đã sở hữu và Thẻ chưa sở hữu
    const combinedData: WikiInventoryItemDTO[] = allCards.map((card) => {
      const inv = inventoryMap.get(card.id);
      const isOwned = !!inv;

      return {
        id: inv ? inv.id : null,
        cardId: card.id,
        isOwned,
        acquiredAt: inv ? inv.acquiredAt : null,
        currentStar: inv ? inv.currentStar : 0,
        isNew: inv ? inv.isNew : false,
        isCompleted: inv ? inv.isCompleted : false,
        canShareCount: inv ? inv.canShareCount : 0,
        source: inv ? inv.source : null,
        card: {
          id: card.id,
          title: card.title,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          wikiUrl: card.wikiUrl,
          aiContent: card.aiContent,
          totalStars: card.totalStars,
          awakenedStars: card.awakenedStars,
          contentText: card.contentText,
          // Bảo mật: Chỉ trả về lịch sử thi của đúng user này, loại bỏ các trường nhạy cảm
          attempts: isOwned
            ? card.attempts.map((att) => ({
                id: att.id,
                cardId: att.cardId,
                score: att.score,
                correctCount: att.correctCount,
                totalQuizzes: att.totalQuizzes,
                createdAt: att.createdAt,
                userAnswers: att.userAnswers,
                lessonSnapshot: att.lessonSnapshot,
              }))
            : [],
        },
      };
    });

    return {
      success: true,
      data: combinedData,
    };
  } catch (error: any) {
    console.error("Lỗi getWikiManagementService:", error);
    return {
      success: false,
      message: error.message || "Đã xảy ra lỗi khi lấy dữ liệu Wiki Service!",
    };
  }
}

