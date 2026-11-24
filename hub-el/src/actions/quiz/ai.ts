"use server";

import { generateQuizService } from "@/lib/quiz/gemini";
import { getVideoContext } from "@/lib/video/youtube"; 
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function generateQuizFromVideoAction(userId: string, videoId: string, count: number = 5) {
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
    
    const videoContext = await getVideoContext(videoId); 
    
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

    console.log(`🧠 [2] Đang nhờ Gemini tạo ${count} câu hỏi trắc nghiệm...`);
    const quizResult = await generateQuizService(videoContext, count, "vừa");
    
    console.log("✅ [3] AI đã tạo bài tập thành công!");
    console.log("========================================\n");
    revalidatePath("/", "layout");

    return { success: true, data: quizResult };
  } catch (error: any) {
    console.error("❌ Lỗi toàn cục khi tạo AI Quiz: " + error.message);
    return { success: false, error: "Lỗi Server hoặc AI đang quá tải." };
  }
}