// src/lib/leveling.ts
import { prisma } from "@/lib/prisma";
/**
 * Công thức tính XP cần thiết để lên cấp tiếp theo.
 * Sử dụng đường cong bậc 2 (Quadratic) để kiểm soát lạm phát XP.
 * Công thức: 500 + (Cấp hiện tại ^ 2 * 20)
 * * Bảng minh họa:
 * - Cấp 1 -> 2: Cần 520 XP (Làm 1-2 bài trắc nghiệm là lên)
 * - Cấp 10 -> 11: Cần 2,500 XP
 * - Cấp 50 -> 51: Cần 50,500 XP
 * - Cấp 83 -> 84: Cần 138,280 XP (Hợp lý cho giai đoạn late game)
 * - Cấp 120 -> 121: Cần 288,500 XP
 * - Cấp 200 -> 201: Cần 800,500 XP
 */
// =========================================
// 1. CẤU HÌNH CÂN BẰNG GAME (GAME BALANCE)
// =========================================
const CONFIG = {
  // Cấp độ & Kinh nghiệm (Sử dụng đường cong bậc 2 để chống lạm phát XP)
  XP_BASE: 500,            // XP cơ sở mặc định
  XP_CURVE_MULTIPLIER: 20, // Hệ số nhân theo bình phương cấp độ
  
  // Năng lượng (aiTokens)
  BASE_MAX_ENERGY: 50,     // Giới hạn năng lượng gốc ở Cấp 1
  ENERGY_PER_LEVEL: 5,     // Mỗi lần lên cấp, Giới hạn tăng thêm 5
  
  // Đặc quyền Nâng cấp
  COIN_BONUS_PER_LVL: 0.01,// Tăng cấp: Cứ mỗi 1 cấp độ, Xu nhận được tăng 1% (+0.01)
  PRO_XP_BONUS: 0.20,      // Premium: Nhận thêm 20% XP
  PRO_COIN_BONUS: 0.20,    // Premium: Nhận thêm 20% Xu
  PRO_ENERGY_CAP_BONUS: 50,// Premium: Giới hạn Năng lượng mở rộng thêm 50
};

// =========================================
// 2. CÁC HÀM TÍNH TOÁN ĐỘNG
// =========================================

// Tính XP cần thiết để lên cấp tiếp theo (Công thức: 500 + level^2 * 20)
export function getRequiredXp(level: number): number {
  return Math.floor(CONFIG.XP_BASE + Math.pow(level, 2) * CONFIG.XP_CURVE_MULTIPLIER);
}

// Tính Giới hạn Năng lượng tối đa hiện tại (Dựa vào Cấp độ + PRO)
export function getMaxEnergy(level: number, isPro: boolean): number {
  const baseCap = CONFIG.BASE_MAX_ENERGY + (level - 1) * CONFIG.ENERGY_PER_LEVEL;
  return isPro ? baseCap + CONFIG.PRO_ENERGY_CAP_BONUS : baseCap;
}

// =========================================
// 3. HÀM XỬ LÝ LÕI: CỘNG THƯỞNG & LÊN CẤP
// =========================================
export async function addExpAndRewards(userId: string, baseExp: number, baseCoins: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Không tìm thấy người dùng");

    const now = new Date();
    let isPro = user.isPro;
    let gracePeriod = user.gracePeriodEndsAt;
    let currentEnergy = user.aiTokens;

    // ---------------------------------------------------------
    // A. KIỂM TRA HẾT HẠN PREMIUM & ÂN HẠN 3 NGÀY
    // ---------------------------------------------------------
    if (isPro && user.premiumExpiresAt && user.premiumExpiresAt < now) {
      // 1. Vừa mới hết hạn PRO -> Cấp cho 3 ngày ân hạn để xài năng lượng dư
      isPro = false;
      gracePeriod = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 Ngày
    }

    const currentMaxEnergy = getMaxEnergy(user.level, isPro);

    if (!isPro && gracePeriod && gracePeriod < now) {
      // 2. Đã qua 3 ngày ân hạn -> Xóa dấu vết ân hạn & ÉP NĂNG LƯỢNG VỀ GIỚI HẠN
      gracePeriod = null; 
      if (currentEnergy > currentMaxEnergy) {
         currentEnergy = currentMaxEnergy; 
      }
    }

    // ---------------------------------------------------------
    // B. TÍNH TOÁN BUFF (TỪ PREMIUM & CẤP ĐỘ)
    // ---------------------------------------------------------
    let finalExp = baseExp;
    let finalCoins = baseCoins;

    // Nếu là PRO -> +% XP và +% Xu
    if (isPro) {
      finalExp += Math.floor(baseExp * CONFIG.PRO_XP_BONUS);
      finalCoins += Math.floor(baseCoins * CONFIG.PRO_COIN_BONUS);
    }
    
    // Tăng Xu nhận được dựa trên Cấp độ (VD: Cấp 10 -> +10% Xu)
    finalCoins += Math.floor(baseCoins * (user.level * CONFIG.COIN_BONUS_PER_LVL));

    // ---------------------------------------------------------
    // C. LOGIC LÊN CẤP (VÒNG LẶP CHO PHÉP NHẢY NHIỀU CẤP 1 LÚC)
    // ---------------------------------------------------------
    let newXp = user.xp + finalExp;
    let newLevel = user.level;
    let hasLeveledUp = false;

    // Chừng nào XP hiện tại còn lớn hơn XP yêu cầu của cấp này -> Lên cấp
    while (newXp >= getRequiredXp(newLevel)) {
      newXp -= getRequiredXp(newLevel); // Trừ đi số XP đã dùng, giữ lại phần dư
      newLevel++;
      hasLeveledUp = true;
    }

    // Nếu lên cấp, thưởng Năng Lượng (VD: Cộng thêm 1 bình năng lượng mới)
    if (hasLeveledUp) {
      const newLevelMaxEnergy = getMaxEnergy(newLevel, isPro);
      currentEnergy += newLevelMaxEnergy; 
    }

    // ---------------------------------------------------------
    // D. LƯU CẬP NHẬT VÀO DATABASE
    // ---------------------------------------------------------
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        level: newLevel,
        freeCoins: { increment: finalCoins },
        aiTokens: currentEnergy,
        isPro: isPro,
        gracePeriodEndsAt: gracePeriod
      }
    });

    return { 
      success: true, 
      finalExp, 
      finalCoins, 
      newLevel, 
      hasLeveledUp 
    };

  } catch (error: any) {
    console.error("LỖI XỬ LÝ LEVEL:", error);
    return { success: false, error: error.message };
  }
}