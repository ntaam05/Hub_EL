// src/services/vocabulary.service.ts
import { prisma } from "@/lib/prisma";

export interface VocabularyItem {
  id: number;
  word: string;
  meaning: string;
  pronunciation?: string | null;
  pos?: string | null;
  englishDesc?: string | null;
  language?: string | null;
  cardId: number;
  cardTitle: string;
  rarity?: string;
  createdAt?: Date;
}

export async function getUserVocabularyService(
  userId: string,
  options?: {
    search?: string;
    language?: string;
    sort?: "asc" | "desc";
    page?: number;
    limit?: number;
  }
) {
  try {
    if (!userId) {
      return { success: false, error: "Chưa xác thực người dùng." };
    }

    const {
      search = "",
      language = "",
      sort = "asc",
      page = 1,
      limit = 50,
    } = options || {};

    // 1. Chỉ lấy các thẻ bài mà user đang sở hữu trong kho đồ (Đảm bảo User Isolation)
    const inventory = await prisma.userInventory.findMany({
      where: { userId },
      select: {
        card: {
          select: {
            id: true,
            title: true,
            rarity: true,
            vocabularies: true,
          },
        },
      },
    });

    const allVocabs: VocabularyItem[] = [];

    inventory.forEach((item) => {
      if (item.card?.vocabularies) {
        item.card.vocabularies.forEach((v: any) => {
          allVocabs.push({
            id: v.id,
            word: v.word,
            meaning: v.meaning,
            pronunciation: v.pronunciation || null,
            pos: v.pos || null,
            englishDesc: v.englishDesc || null,
            language: v.language || "Tiếng Anh",
            cardId: item.card.id,
            cardTitle: item.card.title,
            rarity: item.card.rarity,
            createdAt: v.createdAt,
          });
        });
      }
    });

    // 2. Lọc theo từ khóa tìm kiếm (search)
    let filtered = allVocabs;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.word.toLowerCase().includes(q) ||
          v.meaning.toLowerCase().includes(q) ||
          v.cardTitle.toLowerCase().includes(q)
      );
    }

    // 3. Lọc theo ngôn ngữ nếu có
    if (language.trim() && language !== "Tất cả" && language !== "ALL") {
      const langLower = language.trim().toLowerCase();
      filtered = filtered.filter((v) => {
        const itemLang = (v.language || "tiếng anh").toLowerCase();
        if (itemLang === langLower) return true;
        if (langLower.includes("anh") && (itemLang === "en" || itemLang.includes("english") || itemLang.includes("tiếng anh"))) return true;
        if (langLower.includes("nhật") && (itemLang === "ja" || itemLang.includes("japanese") || itemLang.includes("tiếng nhật"))) return true;
        if (langLower.includes("hàn") && (itemLang === "ko" || itemLang.includes("korean") || itemLang.includes("tiếng hàn"))) return true;
        if (langLower.includes("trung") && (itemLang === "zh" || itemLang.includes("chinese") || itemLang.includes("tiếng trung"))) return true;
        if (langLower.includes("pháp") && (itemLang === "fr" || itemLang.includes("french") || itemLang.includes("tiếng pháp"))) return true;
        if (langLower.includes("đức") && (itemLang === "de" || itemLang.includes("german") || itemLang.includes("tiếng đức"))) return true;
        const text = `${v.word} ${v.meaning} ${v.cardTitle}`.toLowerCase();
        return text.includes(langLower);
      });
    }

    // 4. Sắp xếp thứ tự A-Z hoặc Z-A
    filtered.sort((a, b) => {
      const cmp = a.word.localeCompare(b.word);
      return sort === "desc" ? -cmp : cmp;
    });

    // 5. Phân trang
    const total = filtered.length;
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const pagedData = filtered.slice(startIndex, startIndex + safeLimit);

    return {
      success: true,
      data: {
        items: pagedData,
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages,
          hasNextPage: safePage < totalPages,
          hasPrevPage: safePage > 1,
        },
      },
    };
  } catch (error: any) {
    console.error("LỖI GET VOCABULARY SERVICE:", error);
    return {
      success: false,
      error: error.message || "Lỗi hệ thống khi tải từ vựng.",
    };
  }
}

export async function getVocabularyDetailService(
  userId: string,
  vocabId: number
) {
  try {
    const vocab = await prisma.vocabulary.findUnique({
      where: { id: vocabId },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            rarity: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!vocab) {
      return { success: false, error: "Từ vựng không tồn tại." };
    }

    // Kiểm tra xem user có sở hữu thẻ chứa từ vựng này không
    const owned = await prisma.userInventory.findFirst({
      where: { userId, cardId: vocab.cardId },
    });

    if (!owned) {
      return {
        success: false,
        error: "Bạn chưa mở khóa thẻ bài chứa từ vựng này.",
      };
    }

    return {
      success: true,
      data: {
        id: vocab.id,
        word: vocab.word,
        meaning: vocab.meaning,
        pronunciation: vocab.pronunciation || null,
        pos: (vocab as any).pos || null,
        englishDesc: (vocab as any).englishDesc || null,
        language: (vocab as any).language || "Tiếng Anh",
        cardId: vocab.card.id,
        cardTitle: vocab.card.title,
        rarity: vocab.card.rarity,
        imageUrl: vocab.card.imageUrl,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi tra cứu chi tiết từ vựng.",
    };
  }
}

export async function getVocabularyContextService(
  userId: string,
  cardId: number,
  targetWord: string
) {
  try {
    if (!userId) {
      return { success: false, error: "Chưa xác thực người dùng." };
    }

    // Kiểm tra quyền sở hữu thẻ
    const owned = await prisma.userInventory.findFirst({
      where: { userId, cardId },
      include: {
        card: {
          include: {
            attempts: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    if (!owned || !owned.card) {
      return {
        success: false,
        error: "Bạn không sở hữu thẻ bài này để xem ngữ cảnh bài học.",
      };
    }

    const card = owned.card;
    let foundText = "";
    const searchTarget = targetWord.trim().toLowerCase();

    // 1. Tìm trong bài học hiện tại (aiContent)
    try {
      if (card.aiContent && card.aiContent !== "Chưa generate") {
        const ai = JSON.parse(card.aiContent);
        if (
          ai.simplifiedText &&
          ai.simplifiedText.toLowerCase().includes(searchTarget)
        ) {
          foundText = ai.simplifiedText;
        }
      }
    } catch (_) {}

    // 2. Nếu bài mới nhất không có, lục lại lịch sử attempts
    if (!foundText && card.attempts && card.attempts.length > 0) {
      for (const att of card.attempts) {
        if (att.passageText && att.passageText.toLowerCase().includes(searchTarget)) {
          foundText = att.passageText;
          break;
        }
      }
    }

    // 3. Nếu vẫn không thấy, dùng contentText gốc của thẻ bài Wiki
    if (!foundText && card.contentText) {
      foundText = card.contentText;
    }

    return {
      success: true,
      data: {
        cardId: card.id,
        cardTitle: card.title,
        rarity: card.rarity,
        targetWord,
        simplifiedText: foundText,
        found: foundText.toLowerCase().includes(searchTarget),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi lấy ngữ cảnh bài học từ vựng.",
    };
  }
}

