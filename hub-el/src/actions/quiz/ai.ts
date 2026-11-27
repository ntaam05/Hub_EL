"use server";

import { generateQuizService } from "@/lib/quiz/gemini";
import { getVideoContext } from "@/lib/video/youtube"; 
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const videoContextCache = new Map<string, { context: string; expiresAt: number }>();

function getDifficultyDescription(level: number): string {
  switch (Math.max(1, Math.min(5, level))) {
    case 1:
      return "Mức 1 - Rất dễ (nhận biết cơ bản, hỏi trực tiếp khái niệm rõ ràng nhất trong bài)";
    case 2:
      return "Mức 2 - Tương đối dễ (kiến thức nền tảng, hiểu trực tiếp từ nội dung bài học)";
    case 3:
      return "Mức 3 - Trung bình (hiểu và áp dụng đơn giản vào ví dụ ngắn)";
    case 4:
      return "Mức 4 - Khá khó (phân tích tình huống, tìm lỗi hoặc chi tiết dễ nhầm lẫn)";
    case 5:
      return "Mức 5 - Khó / Nâng cao (tổng hợp kiến thức, suy luận sâu, bài tập phức tạp)";
    default:
      return "Mức 2 - Tương đối dễ";
  }
}

async function getCachedVideoContext(videoId: string): Promise<string | null> {
  const cached = videoContextCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.context;
  }
  const context = await getVideoContext(videoId);
  if (context && context.trim() !== "") {
    videoContextCache.set(videoId, {
      context,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });
  }
  return context;
}

export async function generateQuizFromVideoAction(
  userId: string,
  videoId: string,
  count: number = 5,
  adaptive: boolean = false
) {
  try {
    if (!userId) return { success: false, error: "Vui lòng đăng nhập để sử dụng tính năng AI!" };

    const user = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { aiTokens: true, lastStudyDate: true, level: true, isPro: true } 
    });

    if (!user) return { success: false, error: "Tài khoản không tồn tại." };

    // ==========================================
    // 🚨 ĐÃ FIX: TÍNH TOÁN CHI PHÍ NĂNG LƯỢNG
    // ==========================================
    // Mặc định: 1 câu hỏi = 1 Năng lượng
    let energyCost = count;

    // Đặc quyền PRO: Giảm 30% trên tổng số năng lượng
    if (user.isPro) {
        energyCost = Math.ceil(energyCost * 0.7); 
        if (energyCost < 1) energyCost = 1; // Tối thiểu tốn 1 năng lượng
    }

    // --- BẮT ĐẦU ĐỒNG BỘ NĂNG LƯỢNG MÁY CHỦ (ÉP MÚI GIỜ VIỆT NAM) ---
    let currentEnergy = user.aiTokens || 0;
    let diffDays = 0;

    if (user.lastStudyDate) {
      const getVNDate = (d: Date) => new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const now = getVNDate(new Date());
      const lastDate = getVNDate(new Date(user.lastStudyDate));
      
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
      diffDays = Math.floor((todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24));
    }

    const baseCap = 50 + ((user.level || 1) - 1) * 5;
    const maxEnergy = user.isPro ? baseCap + 50 : baseCap;

    if (diffDays > 0 || currentEnergy === 0) {
        currentEnergy = maxEnergy;
    }

    if (currentEnergy < energyCost) {
        return { success: false, error: `Bạn không đủ năng lượng! Cần ${energyCost}⚡ để tạo ${count} câu hỏi.` };
    }

    const remainingEnergy = currentEnergy - energyCost;
    await prisma.user.update({
        where: { id: userId },
        data: { 
            aiTokens: remainingEnergy,
            stats: {
                upsert: {
                    update: { totalAiEnergySpent: { increment: energyCost } },
                    create: { totalAiEnergySpent: energyCost }
                }
            }
        }
    });

    console.log(`\n========================================`);
    console.log(`⏳ [1] Đang lấy nội dung Video ID: ${videoId} (Còn lại ${remainingEnergy} năng lượng)`);
    
    const videoContext = await getCachedVideoContext(videoId); 
    
    if (!videoContext || videoContext.trim() === "") {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          aiTokens: { increment: energyCost },
          stats: { update: { totalAiEnergySpent: { decrement: energyCost } } }
        }
      });
      return { success: false, error: "Không thể trích xuất nội dung từ Video này. Đã hoàn trả năng lượng!" };
    }

    const initialDifficulty = 2;
    const generateCount = adaptive ? 1 : count;
    const difficultyText = adaptive ? getDifficultyDescription(initialDifficulty) : "vừa";

    console.log(`🧠 [2] Đang nhờ Gemini tạo ${generateCount} câu hỏi trắc nghiệm (${difficultyText})...`);
    const quizResult = await generateQuizService(videoContext, generateCount, difficultyText);
    
    console.log("✅ [3] AI đã tạo bài tập thành công!");
    console.log("========================================\n");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: quizResult,
      totalCount: count,
      difficultyLevel: initialDifficulty,
    };
  } catch (error: any) {
    console.error("❌ Lỗi toàn cục khi tạo AI Quiz: " + error.message);
    return { success: false, error: "Lỗi Server hoặc AI đang quá tải." };
  }
}

export async function generateNextAdaptiveQuestionAction(
  userId: string,
  videoId: string,
  difficultyLevel: number,
  previousQuestions: string[] = []
) {
  try {
    if (!userId) return { success: false, error: "Vui lòng đăng nhập để sử dụng tính năng AI!" };
    if (!videoId) return { success: false, error: "Thiếu mã video!" };

    const clampedLevel = Math.max(1, Math.min(5, Math.round(difficultyLevel || 2)));
    const videoContext = await getCachedVideoContext(videoId);

    if (!videoContext || videoContext.trim() === "") {
      return { success: false, error: "Không thể trích xuất nội dung từ Video này." };
    }

    const difficultyText = getDifficultyDescription(clampedLevel);
    console.log(`🧠 [Adaptive] Tạo câu hỏi tiếp theo cho ${videoId} - ${difficultyText}`);

    const quizResult = await generateQuizService(
      videoContext,
      1,
      difficultyText,
      previousQuestions
    );

    const question = Array.isArray(quizResult) ? quizResult[0] : quizResult;
    if (!question) {
      return { success: false, error: "AI không trả về câu hỏi hợp lệ." };
    }

    return {
      success: true,
      data: question,
      difficultyLevel: clampedLevel,
    };
  } catch (error: any) {
    console.error("❌ Lỗi tạo câu hỏi thích ứng tiếp theo: " + error.message);
    return { success: false, error: "Lỗi Server hoặc AI đang quá tải." };
  }
}