import { prisma } from "@/lib/prisma";
import { addExpAndRewards, getMaxEnergy } from "@/lib/leveling";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export interface QuizConfigDTO {
  cardId: number;
  language?: string;
  level?: string;
  numQs?: number;
  timeLimit?: number;
  wordMin?: number;
  wordMax?: number;
  quizTypes?: string[];
}

export interface QuizQuestionRaw {
  type: string;
  targetWord?: string;
  question: string;
  options: string[];
  correctAnswers: string[];
  explanation: string;
}

export interface QuizVocabulary {
  word: string;
  pos: string;
  meaning: string;
  englishDesc: string;
  language?: string;
}

export interface StudyDataPayload {
  simplifiedText: string;
  vocabularies: QuizVocabulary[];
  quizzes: QuizQuestionRaw[];
}

export interface ActiveStudySession {
  sessionId: string;
  userId: string;
  cardId: number;
  studyData: StudyDataPayload;
  submitted: boolean;
  attemptId?: number;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory session cache for anti-tamper and server-side grading (2h TTL)
const activeStudySessions = new Map<string, ActiveStudySession>();

// Dọn dẹp session hết hạn định kỳ
setInterval(() => {
  const now = new Date();
  for (const [key, session] of activeStudySessions.entries()) {
    if (session.expiresAt < now) {
      activeStudySessions.delete(key);
    }
  }
}, 10 * 60 * 1000); // Mỗi 10 phút

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

function getRandomApiKey(): string | null {
  const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const apiKeys = keysString
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k !== "" && k.startsWith("AIzaSy"));
  if (apiKeys.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
}

async function fetchFullWikiArticle(title: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(
      title
    )}&format=json`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(5000), // Timeout 5s để tránh nghẽn mạng
      headers: {
        "User-Agent": "WikiGacha_Project/1.0",
        "Accept-Charset": "utf-8",
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const pageId = Object.keys(pages)[0];
    let text = pages[pageId].extract as string;
    if (text) {
      text = text
        .replace(/==\s*(See also|References|External links|Further reading)\s*==[\s\S]*/i, "")
        .trim();
    }
    return text;
  } catch {
    return null;
  }
}

function signSessionToken(payload: { sessionId: string; userId: string; cardId: number }): string {
  const secret = process.env.AUTH_SECRET || "hub_el_secure_study_session_secret_2026";
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(JSON.stringify({ data, hmac })).toString("base64");
}

function verifySessionToken(token: string): { sessionId: string; userId: string; cardId: number } | null {
  try {
    const secret = process.env.AUTH_SECRET || "hub_el_secure_study_session_secret_2026";
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    const calculatedHmac = crypto.createHmac("sha256", secret).update(decoded.data).digest("hex");
    if (calculatedHmac !== decoded.hmac) return null;
    return JSON.parse(decoded.data);
  } catch {
    return null;
  }
}

// Kiểm tra & Tự động bơm đầy năng lượng AI nếu qua ngày mới
async function ensureDailyEnergyRefill(user: any): Promise<number> {
  let currentEnergy = user.aiTokens;
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const todayStr = vnTime.toISOString().split("T")[0];

  let lastGrantStr = "";
  if (user.lastDailyCoinGrant) {
    const lastGrantVn = new Date(user.lastDailyCoinGrant.getTime() + 7 * 60 * 60 * 1000);
    lastGrantStr = lastGrantVn.toISOString().split("T")[0];
  }

  if (todayStr !== lastGrantStr) {
    currentEnergy = getMaxEnergy(user.level, user.isPro);
    await prisma.user.update({
      where: { id: user.id },
      data: { aiTokens: currentEnergy, lastDailyCoinGrant: now },
    });
  }
  return currentEnergy;
}

// ==========================================
// 3. CORE SERVICE METHODS
// ==========================================

/**
 * A. Lấy thông tin chi tiết thẻ bài & quyền sở hữu để cấu hình bài học
 */
export async function getWikiStudyCardService(userId: string, cardId: number) {
  try {
    const card = await prisma.wikiCard.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        title: true,
        rarity: true,
        imageUrl: true,
        wikiUrl: true,
        totalStars: true,
        awakenedStars: true,
        contentText: true,
      },
    });

    if (!card) {
      return {
        success: false,
        statusCode: 404,
        error: { code: "CARD_NOT_FOUND", message: "Thẻ bài không tồn tại trong hệ thống!" },
      };
    }

    // Kiểm tra quyền sở hữu trong UserInventory
    const inventory = await prisma.userInventory.findUnique({
      where: {
        userId_cardId: { userId, cardId },
      },
      select: {
        id: true,
        currentStar: true,
        isCompleted: true,
        acquiredAt: true,
        canShareCount: true,
      },
    });

    if (!inventory) {
      return {
        success: false,
        statusCode: 403,
        error: { code: "CARD_NOT_OWNED", message: "Bạn chưa sở hữu thẻ bài này trong bộ sưu tập!" },
      };
    }

    // Lấy thông tin tài khoản user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        level: true,
        xp: true,
        freeCoins: true,
        aiTokens: true,
        isPro: true,
        targetLanguage: true,
        languageLevel: true,
        lastDailyCoinGrant: true,
      },
    });

    if (!user) {
      return {
        success: false,
        statusCode: 404,
        error: { code: "USER_NOT_FOUND", message: "Không tìm thấy thông tin người dùng!" },
      };
    }

    const currentEnergy = await ensureDailyEnergyRefill(user);
    const maxEnergy = getMaxEnergy(user.level, user.isPro);
    const energyCost = user.isPro ? 7 : 10;

    return {
      success: true,
      statusCode: 200,
      data: {
        card: {
          id: card.id,
          title: card.title,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          wikiUrl: card.wikiUrl,
          totalStars: card.totalStars,
          awakenedStars: card.awakenedStars,
        },
        inventory: {
          id: inventory.id,
          currentStar: inventory.currentStar,
          isCompleted: inventory.isCompleted,
          acquiredAt: inventory.acquiredAt,
        },
        user: {
          level: user.level,
          xp: user.xp,
          freeCoins: user.freeCoins,
          aiTokens: currentEnergy,
          maxEnergy,
          isPro: user.isPro,
          targetLanguage: user.targetLanguage || "Tiếng Anh",
          languageLevel: user.languageLevel || "A2",
          energyCost,
        },
      },
    };
  } catch (error: any) {
    console.error("getWikiStudyCardService error:", error);
    return {
      success: false,
      statusCode: 500,
      error: { code: "SERVER_ERROR", message: error.message || "Lỗi máy chủ khi lấy dữ liệu thẻ!" },
    };
  }
}

/**
 * B. Sinh bài đọc và câu hỏi bằng Gemini AI, trừ năng lượng và lưu phiên làm bài
 */
export async function generateWikiStudyService(
  userId: string,
  config: QuizConfigDTO,
  options: { hideAnswers?: boolean } = { hideAnswers: false }
) {
  try {
    const cardId = Number(config.cardId);
    if (!cardId || isNaN(cardId)) {
      return {
        success: false,
        statusCode: 400,
        error: { code: "INVALID_CARD_ID", message: "Mã thẻ bài không hợp lệ!" },
      };
    }

    // 1. Kiểm tra sở hữu thẻ
    const inventory = await prisma.userInventory.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });
    if (!inventory) {
      return {
        success: false,
        statusCode: 403,
        error: { code: "CARD_NOT_OWNED", message: "Bạn phải sở hữu thẻ bài này để tạo bài học!" },
      };
    }

    // 2. Validate input theo logic Mobile Web
    const quizTypes = config.quizTypes;
    if (!quizTypes || !Array.isArray(quizTypes) || quizTypes.length < 2) {
      return {
        success: false,
        statusCode: 400,
        error: { code: "MIN_SKILLS_REQUIRED", message: "Phải chọn ít nhất 2 kỹ năng bài tập!" },
      };
    }

    const wordMin = Math.max(100, Number(config.wordMin) || 150);
    const wordMax = Math.min(700, Math.max(wordMin + 50, Number(config.wordMax) || 200));
    const dynamicMaxQs = Math.min(15, Math.max(2, Math.floor(wordMax / 40)));
    const numQs = Math.min(dynamicMaxQs, Math.max(2, Number(config.numQs) || 3));
    const timeLimit = Math.max(0, Math.min(60, Number(config.timeLimit) || 0));

    // 3. Kiểm tra User & Năng lượng AI
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        level: true,
        isPro: true,
        aiTokens: true,
        lastDailyCoinGrant: true,
        targetLanguage: true,
        languageLevel: true,
      },
    });

    if (!user) {
      return {
        success: false,
        statusCode: 404,
        error: { code: "USER_NOT_FOUND", message: "Không tìm thấy người dùng!" },
      };
    }

    const currentEnergy = await ensureDailyEnergyRefill(user);
    const aiCost = user.isPro ? 7 : 10;
    const maxEnergy = getMaxEnergy(user.level, user.isPro);

    if (currentEnergy < aiCost) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: "INSUFFICIENT_ENERGY",
          message: `Bạn cần ${aiCost} Năng lượng để tạo bài học. (Hiện tại: ${currentEnergy}/${maxEnergy})`,
        },
      };
    }

    // 4. Lấy dữ liệu thẻ & chunk Wikipedia
    const card = await prisma.wikiCard.findUnique({ where: { id: cardId } });
    if (!card) {
      return {
        success: false,
        statusCode: 404,
        error: { code: "CARD_NOT_FOUND", message: "Thẻ bài không tồn tại!" },
      };
    }

    let fullSourceText = card.contentText || "";
    let chunks: string[] = [];
    if (card.chunkData && typeof card.chunkData === "string") {
      try {
        chunks = JSON.parse(card.chunkData);
      } catch {
        chunks = [];
      }
    }

    if (chunks.join("").length < 1000) {
      const scrapedText = await fetchFullWikiArticle(card.title);
      const textToProcess = scrapedText && scrapedText.length > fullSourceText.length ? scrapedText : fullSourceText;
      if (textToProcess && textToProcess.length > 100) {
        const sentences = textToProcess.match(/[^.!?\n]+[.!?]+|\n+/g) || [textToProcess];
        let currentChunk = "";
        const newChunks: string[] = [];

        for (const sentence of sentences) {
          const cleanSentence = sentence.trim();
          if (cleanSentence.length > 2000) {
            if (currentChunk) {
              newChunks.push(currentChunk.trim());
              currentChunk = "";
            }
            for (let i = 0; i < cleanSentence.length; i += 2000) {
              newChunks.push(cleanSentence.slice(i, i + 2000));
            }
            continue;
          }
          if ((currentChunk + " " + cleanSentence).length > 2000) {
            if (currentChunk) newChunks.push(currentChunk.trim());
            currentChunk = cleanSentence;
          } else {
            currentChunk += (currentChunk ? " " : "") + cleanSentence;
          }
        }
        if (currentChunk) newChunks.push(currentChunk.trim());
        chunks = newChunks;
        await prisma.wikiCard.update({
          where: { id: cardId },
          data: { chunkData: JSON.stringify(chunks) },
        });
      }
    }

    let textForAi = "";
    if (chunks.length > 0) {
      const shuffledChunks = [...chunks].sort(() => Math.random() - 0.5);
      textForAi = shuffledChunks.slice(0, 3).join("\n\n---\n\n");
    } else {
      textForAi = fullSourceText || `Write a lesson about ${card.title}`;
    }

    const safeTextForAi = textForAi.substring(0, 6000);
    const targetLang = config.language || user.targetLanguage || "Tiếng Anh";
    const level = config.level || user.languageLevel || "A2";
    const typesString = quizTypes.map((t) => `"${t}"`).join(", ");

    const focuses = [
      "tập trung vào các mốc thời gian và sự kiện lịch sử quan trọng",
      "tập trung giải thích các thuật ngữ chuyên ngành và định nghĩa cốt lõi",
      "tập trung phân tích mối quan hệ nguyên nhân - kết quả của các sự việc",
      "tập trung vào các chi tiết nhỏ, thú vị hoặc ít người chú ý",
      "tập trung vào các con số, số liệu thống kê và ý nghĩa của chúng",
      "tập trung vào tiểu sử, tính cách và tầm ảnh hưởng của các nhân vật",
      "tập trung so sánh sự khác biệt và tương đồng giữa các khía cạnh",
      "tập trung vào tác động văn hóa, xã hội hoặc kinh tế của chủ đề này",
      "tập trung đưa ra các ví dụ thực tế và ứng dụng trong đời sống",
      "tập trung tóm tắt bức tranh toàn cảnh một cách dễ hiểu và logic nhất",
    ];
    const randomFocus = focuses[Math.floor(Math.random() * focuses.length)];

    const prompt = `
      Bạn là chuyên gia giáo dục ngôn ngữ. Dựa VÀO NỘI DUNG GỐC dưới đây:
      1. Viết lại một bài đọc HOÀN TOÀN BẰNG ${targetLang} ở trình độ ${level}. 
         YÊU CẦU ĐỘ DÀI: BẮT BUỘC NẰM TRONG KHOẢNG TỪ ${wordMin} ĐẾN TỐI ĐA ${wordMax} TỪ. Đặt vào "simplifiedText".
         YÊU CẦU ĐỔI MỚI: Bài đọc và hệ thống câu hỏi BẮT BUỘC PHẢI ${randomFocus}.
      2. Chọn khoảng ${Math.min(numQs + 3, 10)} từ vựng khó TRÍCH XUẤT TRỰC TIẾP TỪ BÀI ĐỌC ${targetLang} VỪA TẠO.
         - "word": BẮT BUỘC phải là từ bằng ${targetLang} CÓ MẶT TRONG BÀI ĐỌC.
         - "pos": Danh từ (N), Động từ (V), Tính từ (ADJ), Trạng từ (ADV), Đại từ (PRO), Giới từ (PREP), Liên từ (CONJ).
         - "meaning": Giải nghĩa ngắn gọn bằng Tiếng Việt.
         - "englishDesc": BẮT BUỘC chia làm 2 dòng bằng "\\n". Dòng 1: [phiên âm]-/phát âm/. Dòng 2: Ngữ cảnh bằng ${targetLang}.
         - "language": "${targetLang}".
      3. Tạo đúng ${numQs} câu hỏi thuộc các loại: ${typesString}.
      TOÀN BỘ nội dung "question" và "options" BẮT BUỘC PHẢI VIẾT BẰNG ${targetLang} (ngoại trừ giải nghĩa tiếng Việt ở guess_meaning).

      TRẢ VỀ JSON DUY NHẤT:
      {
        "simplifiedText": "...",
        "vocabularies": [{ "word": "...", "pos": "...", "meaning": "...", "englishDesc": "...", "language": "${targetLang}" }],
        "quizzes": [
          { 
            "type": "...", 
            "targetWord": "...",
            "question": "...", 
            "options": ["A", "B", "C", "D"], 
            "correctAnswers": ["ĐÁP ÁN ĐÚNG KHỚP TRONG OPTIONS"], 
            "explanation": "Giải thích bằng tiếng Việt." 
          }
        ]
      }
      LƯU Ý: Không thêm tiền tố A), B), C), D) trong options. correctAnswers phải khớp chính xác với 1 option.
      VĂN BẢN GỐC: "${safeTextForAi}"
    `;

    // 5. Gọi Gemini API
    const apiKey = getRandomApiKey();
    if (!apiKey) {
      return {
        success: false,
        statusCode: 500,
        error: { code: "NO_GEMINI_API_KEY", message: "Hệ thống chưa được cấu hình GEMINI_API_KEYS!" },
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    let response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(30000),
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
        },
      }),
    });

    if (!response.ok && response.status === 404) {
      // Fallback model nếu gemini-2.5-flash không khả dụng
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
      response = await fetch(fallbackUrl, {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
          },
        }),
      });
    }

    if (!response.ok) {
      return {
        success: false,
        statusCode: 502,
        error: { code: "AI_SERVICE_ERROR", message: `Lỗi kết nối AI Gateway (HTTP ${response.status})` },
      };
    }

    const aiResData = await response.json();
    const responseText = aiResData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) {
      return {
        success: false,
        statusCode: 502,
        error: { code: "AI_INVALID_JSON", message: "Dữ liệu AI trả về không hợp lệ!" },
      };
    }

    const studyData: StudyDataPayload = JSON.parse(match[0]);

    // Chuẩn hóa quizzes
    studyData.quizzes = (studyData.quizzes || []).map((q: any) => ({
      type: q.type || "multiple_choice",
      targetWord: q.targetWord,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : [q.correctAnswers],
      explanation: q.explanation || "",
    }));

    const newVocabsCount = studyData.vocabularies?.length || 0;

    // 6. Transaction trừ năng lượng và lưu trữ nội dung
    await prisma.$transaction([
      prisma.wikiCard.update({
        where: { id: cardId },
        data: { aiContent: JSON.stringify(studyData) },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { aiTokens: { decrement: aiCost } },
      }),
      prisma.userStats.upsert({
        where: { userId },
        update: {
          totalAiEnergySpent: { increment: aiCost },
          learnedWordsCount: { increment: newVocabsCount },
        },
        create: {
          userId,
          totalAiEnergySpent: aiCost,
          learnedWordsCount: newVocabsCount,
        },
      }),
    ]);

    // Upsert Vocabulary
    if (studyData.vocabularies && Array.isArray(studyData.vocabularies)) {
      await Promise.all(
        studyData.vocabularies.map(async (v) => {
          const existing = await prisma.vocabulary.findFirst({
            where: { cardId, word: v.word },
          });
          if (existing) {
            return prisma.vocabulary.update({
              where: { id: existing.id },
              data: {
                meaning: v.meaning,
                pos: v.pos,
                englishDesc: v.englishDesc,
                language: v.language || targetLang,
              },
            });
          } else {
            return prisma.vocabulary.create({
              data: {
                cardId,
                word: v.word,
                pos: v.pos,
                meaning: v.meaning,
                englishDesc: v.englishDesc,
                language: v.language || targetLang,
              },
            });
          }
        })
      );
    }

    // 7. Tạo phiên làm bài bảo mật (Anti-Cheat Server-side state)
    const sessionId = `wiki_study_${Date.now()}_${crypto.randomUUID()}`;
    const sessionToken = signSessionToken({ sessionId, userId, cardId });

    activeStudySessions.set(sessionId, {
      sessionId,
      userId,
      cardId,
      studyData,
      submitted: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 giờ
    });

    // 8. Trả kết quả: Nếu là REST API (hideAnswers === true), giấu đáp án chuẩn và giải thích
    let clientQuizzes: any[] = studyData.quizzes;
    if (options.hideAnswers) {
      clientQuizzes = studyData.quizzes.map((q, idx) => ({
        index: idx,
        type: q.type,
        targetWord: q.targetWord,
        question: q.question,
        options: q.options,
      }));
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        sessionId,
        sessionToken,
        card: {
          id: card.id,
          title: card.title,
          rarity: card.rarity,
          totalStars: card.totalStars,
          awakenedStars: card.awakenedStars,
        },
        timeLimit,
        simplifiedText: studyData.simplifiedText,
        vocabularies: studyData.vocabularies,
        quizzes: clientQuizzes,
        aiEnergySpent: aiCost,
        remainingEnergy: currentEnergy - aiCost,
      },
    };
  } catch (error: any) {
    console.error("generateWikiStudyService error:", error);
    return {
      success: false,
      statusCode: 500,
      error: { code: "SERVER_ERROR", message: error.message || "Lỗi máy chủ khi sinh bài học AI!" },
    };
  }
}

/**
 * C. Nộp bài, chấm điểm phía server, cập nhật thức tỉnh sao, XP, Xu và lưu WikiQuizAttempt
 */
export async function finishWikiStudyService(
  userId: string,
  input: {
    sessionId: string;
    sessionToken?: string;
    answers: (string | number)[];
    cardId?: number;
  }
) {
  try {
    const { sessionId, sessionToken, answers, cardId: fallbackCardId } = input;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return {
        success: false,
        statusCode: 400,
        error: { code: "INVALID_INPUT", message: "Thiếu sessionId hoặc danh sách câu trả lời!" },
      };
    }

    // 1. Xác thực session
    let session = activeStudySessions.get(sessionId);

    // Fallback nếu server restart hoặc session token hợp lệ
    if (!session && sessionToken) {
      const verified = verifySessionToken(sessionToken);
      if (verified && verified.sessionId === sessionId && verified.userId === userId) {
        const card = await prisma.wikiCard.findUnique({ where: { id: verified.cardId } });
        if (card && card.aiContent) {
          try {
            const parsed = JSON.parse(card.aiContent);
            session = {
              sessionId,
              userId,
              cardId: verified.cardId,
              studyData: parsed,
              submitted: false,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            };
            activeStudySessions.set(sessionId, session);
          } catch {}
        }
      }
    }

    if (!session) {
      return {
        success: false,
        statusCode: 404,
        error: { code: "SESSION_NOT_FOUND", message: "Phiên làm bài không tồn tại hoặc đã hết hạn!" },
      };
    }

    if (session.userId !== userId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: "FORBIDDEN", message: "Bạn không có quyền nộp bài cho phiên làm bài này!" },
      };
    }

    // Chống submit trùng
    if (session.submitted) {
      return {
        success: false,
        statusCode: 400,
        error: { code: "ALREADY_SUBMITTED", message: "Phiên làm bài này đã được nộp trước đó!" },
      };
    }

    const { cardId, studyData } = session;
    const totalQuizzes = studyData.quizzes.length;

    // 2. Chấm điểm server-side
    let score = 0;
    const gradedQuizzes: any[] = [];
    const formattedUserAnswers: string[] = [];

    for (let i = 0; i < totalQuizzes; i++) {
      const quiz = studyData.quizzes[i];
      const ans = answers[i];
      const isMultiple = ["multiple_choice", "guess_meaning", "true_false", "main_idea", "inference"].includes(
        quiz.type
      );

      let userAnsText = "";
      if (typeof ans === "number" && isMultiple && quiz.options[ans] !== undefined) {
        userAnsText = String(quiz.options[ans]);
      } else if (ans !== null && ans !== undefined) {
        userAnsText = String(ans);
      }

      formattedUserAnswers.push(userAnsText);

      const isCorrect = quiz.correctAnswers.some(
        (a: string) => String(a).trim().toLowerCase() === userAnsText.trim().toLowerCase()
      );

      if (isCorrect) score++;

      gradedQuizzes.push({
        index: i,
        type: quiz.type,
        question: quiz.question,
        options: quiz.options,
        userAnswer: userAnsText,
        correctAnswers: quiz.correctAnswers,
        isCorrect,
        explanation: quiz.explanation,
      });
    }

    const isPass = score >= Math.ceil(totalQuizzes / 2);

    // 3. Xử lý Thức tỉnh sao & Phần thưởng
    const card = await prisma.wikiCard.findUnique({ where: { id: cardId } });
    if (!card) {
      return {
        success: false,
        statusCode: 404,
        error: { code: "CARD_NOT_FOUND", message: "Thẻ bài không tồn tại!" },
      };
    }

    const inventory = await prisma.userInventory.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });

    let currentAwakened = card.awakenedStars;
    let invStar = inventory?.currentStar || 0;
    let isLostStar = false;
    let baseGainedCoins = 0;

    if (isPass) {
      // Đậu: Tăng sao (nếu chưa max)
      if (card.awakenedStars < card.totalStars) {
        const updatedCard = await prisma.wikiCard.update({
          where: { id: cardId },
          data: { awakenedStars: { increment: 1 } },
        });
        currentAwakened = updatedCard.awakenedStars;
        baseGainedCoins = 10;
      }
      if (inventory && inventory.currentStar < card.totalStars) {
        const nextStar = inventory.currentStar + 1;
        await prisma.userInventory.update({
          where: { id: inventory.id },
          data: {
            currentStar: nextStar,
            isCompleted: nextStar >= card.totalStars,
          },
        });
        invStar = nextStar;
      }
    } else {
      // Trượt: Trừ 1 sao (nếu đã có sao)
      if (card.awakenedStars > 0) {
        const updatedCard = await prisma.wikiCard.update({
          where: { id: cardId },
          data: { awakenedStars: { decrement: 1 } },
        });
        currentAwakened = updatedCard.awakenedStars;
        isLostStar = true;
      }
      if (inventory && inventory.currentStar > 0) {
        const nextStar = inventory.currentStar - 1;
        await prisma.userInventory.update({
          where: { id: inventory.id },
          data: {
            currentStar: nextStar,
            isCompleted: false,
          },
        });
        invStar = nextStar;
      }
    }

    // 4. Cộng XP & Tiền thưởng
    const baseExpGained = score * 10;
    const rewardResult = await addExpAndRewards(userId, baseExpGained, baseGainedCoins);

    if (!rewardResult.success) {
      return {
        success: false,
        statusCode: 500,
        error: { code: "LEVELING_ERROR", message: "Lỗi trong quá trình tính toán Level và XP!" },
      };
    }

    // 5. Cập nhật chuỗi Streak
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastStudy = user?.lastStudyDate ? new Date(user.lastStudyDate) : null;

    let newStreak = user?.currentStreak || 0;
    let newHighestStreak = user?.highestStreak || 0;
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

    // 6. Cập nhật DailyStat & UserStats
    const todayForDB = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    await prisma.dailyStat.upsert({
      where: { userId_date: { userId, date: todayForDB } },
      update: {
        xpGained: { increment: rewardResult.finalExp },
        correctAnswers: { increment: score },
        quizAttempts: { increment: totalQuizzes },
      },
      create: {
        userId,
        date: todayForDB,
        xpGained: rewardResult.finalExp,
        studySeconds: 0,
        correctAnswers: score,
        quizAttempts: totalQuizzes,
      },
    });

    await prisma.userStats.upsert({
      where: { userId },
      update: {
        correctQuizAnswers: { increment: score },
        totalQuizAttempts: { increment: totalQuizzes },
      },
      create: {
        userId,
        correctQuizAnswers: score,
        totalQuizAttempts: totalQuizzes,
      },
    });

    // 7. Lưu WikiQuizAttempt với snapshot nguyên bản
    const lessonSnapshotData = {
      ...studyData,
      gradedQuizzes,
      isRescued: false,
    };

    const attempt = await prisma.wikiQuizAttempt.create({
      data: {
        userId,
        cardId,
        score,
        correctCount: score,
        totalQuizzes,
        userAnswers: JSON.stringify(formattedUserAnswers),
        lessonSnapshot: JSON.stringify(lessonSnapshotData),
      },
    });

    // 8. Đánh dấu session đã submit hoàn tất (chống nộp lại)
    session.submitted = true;
    session.attemptId = attempt.id;

    try {
      revalidatePath("/", "layout");
    } catch {}

    return {
      success: true,
      statusCode: 200,
      data: {
        attemptId: attempt.id,
        cardId,
        score,
        correctCount: score,
        totalQuizzes,
        isPass,
        expGained: rewardResult.finalExp,
        gainedCoins: rewardResult.finalCoins,
        newAwakenedStars: currentAwakened,
        currentStar: invStar,
        isLostStar,
        leveledUp: rewardResult.hasLeveledUp,
        newLevel: rewardResult.newLevel,
        currentStreak: newStreak,
        quizzes: gradedQuizzes,
      },
    };
  } catch (error: any) {
    console.error("finishWikiStudyService error:", error);
    return {
      success: false,
      statusCode: 500,
      error: { code: "SERVER_ERROR", message: error.message || "Lỗi máy chủ khi hoàn tất bài học!" },
    };
  }
}

/**
 * D. Cứu sao bằng 50 Xu (-50 Xu) khi bài thi bị trượt
 */
export async function keepWikiCardStarService(userId: string, attemptId: number) {
  try {
    const numericAttemptId = Number(attemptId);
    if (!numericAttemptId || isNaN(numericAttemptId)) {
      return {
        success: false,
        statusCode: 400,
        error: { code: "INVALID_ATTEMPT_ID", message: "Mã lượt thi (attemptId) không hợp lệ!" },
      };
    }

    // 1. Kiểm tra lượt thi tồn tại
    const attempt = await prisma.wikiQuizAttempt.findUnique({
      where: { id: numericAttemptId },
    });

    if (!attempt) {
      return {
        success: false,
        statusCode: 404,
        error: { code: "ATTEMPT_NOT_FOUND", message: "Không tìm thấy lượt thi tương ứng!" },
      };
    }

    // 2. Bảo mật: Xác minh attempt thuộc chính user hiện tại
    if (attempt.userId !== userId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: "FORBIDDEN", message: "Bạn không có quyền thao tác trên lượt thi của người khác!" },
      };
    }

    // 3. Kiểm tra xem lượt thi có thực sự bị trượt không
    const isPass = attempt.score >= Math.ceil(attempt.totalQuizzes / 2);
    if (isPass) {
      return {
        success: false,
        statusCode: 400,
        error: { code: "NOT_FAILED", message: "Lượt thi này đã đạt chuẩn (không bị trừ sao), không cần cứu sao!" },
      };
    }

    // 4. Chống cứu sao nhiều lần (Anti-Double Rescue)
    let snapshot: any = {};
    if (attempt.lessonSnapshot) {
      try {
        snapshot = JSON.parse(attempt.lessonSnapshot);
      } catch {
        snapshot = {};
      }
    }

    if (snapshot.isRescued === true) {
      return {
        success: false,
        statusCode: 400,
        error: { code: "ALREADY_RESCUED", message: "Lượt thi này đã được cứu sao trước đó, không thể dùng lại!" },
      };
    }

    // 5. Kiểm tra số Xu của người dùng (50 Xu)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.freeCoins < 50) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: "INSUFFICIENT_COINS",
          message: `Bạn không đủ 50 Xu để giữ sao! (Hiện có: ${user?.freeCoins || 0} Xu)`,
        },
      };
    }

    // 6. Kiểm tra số sao của thẻ bài
    const card = await prisma.wikiCard.findUnique({ where: { id: attempt.cardId } });
    if (!card) {
      return {
        success: false,
        statusCode: 404,
        error: { code: "CARD_NOT_FOUND", message: "Thẻ bài không tồn tại!" },
      };
    }

    if (card.awakenedStars >= card.totalStars) {
      return {
        success: false,
        statusCode: 400,
        error: { code: "MAX_STARS_REACHED", message: "Thẻ bài đã đạt số sao tối đa, không thể tăng thêm!" },
      };
    }

    const inventory = await prisma.userInventory.findUnique({
      where: { userId_cardId: { userId, cardId: attempt.cardId } },
    });

    const SAVE_COST = 50;

    // 7. Atomic Transaction: Trừ 50 Xu, Phục hồi +1 Sao, Cập nhật Snapshot & Thống kê
    snapshot.isRescued = true;
    snapshot.rescuedAt = new Date().toISOString();

    const transactionOps: any[] = [
      prisma.user.update({
        where: { id: userId },
        data: { freeCoins: { decrement: SAVE_COST } },
      }),
      prisma.wikiCard.update({
        where: { id: attempt.cardId },
        data: { awakenedStars: { increment: 1 } },
      }),
      prisma.wikiQuizAttempt.update({
        where: { id: attempt.id },
        data: { lessonSnapshot: JSON.stringify(snapshot) },
      }),
      prisma.userStats.upsert({
        where: { userId },
        update: { totalCoinsSpent: { increment: SAVE_COST } },
        create: { userId, totalCoinsSpent: SAVE_COST },
      }),
    ];

    if (inventory) {
      transactionOps.push(
        prisma.userInventory.update({
          where: { id: inventory.id },
          data: {
            currentStar: { increment: 1 },
            isCompleted: inventory.currentStar + 1 >= card.totalStars,
          },
        })
      );
    }

    await prisma.$transaction(transactionOps);

    try {
      revalidatePath("/", "layout");
    } catch {}

    const newAwakenedStars = card.awakenedStars + 1;
    const newCurrentStar = inventory ? inventory.currentStar + 1 : 0;

    return {
      success: true,
      statusCode: 200,
      data: {
        attemptId: attempt.id,
        cardId: attempt.cardId,
        newAwakenedStars,
        currentStar: newCurrentStar,
        remainingCoins: user.freeCoins - SAVE_COST,
        message: "Bảo vệ sao thành công! Đã phục hồi +1 Sao cho thẻ bài.",
      },
    };
  } catch (error: any) {
    console.error("keepWikiCardStarService error:", error);
    return {
      success: false,
      statusCode: 500,
      error: { code: "SERVER_ERROR", message: error.message || "Lỗi máy chủ khi bảo vệ sao!" },
    };
  }
}
