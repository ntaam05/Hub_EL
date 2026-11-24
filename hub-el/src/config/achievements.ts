// src/config/achievements.ts
import { Trophy, Flame, PlaySquare, BrainCircuit, Sparkles, Users, Coins, Gem, Crown, Swords, Share2, Target, BookOpen, MessageSquare, ShieldAlert, Ghost, Skull, Rabbit, Clock, BatteryWarning, Star } from "lucide-react";

export const TIER_STYLES: Record<number, any> = {
  1: { color: "text-amber-700 dark:text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/30" },
  2: { color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/30" },
  3: { color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  4: { color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
  5: { color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  6: { color: "text-rose-500 dark:text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/50" },
};

export const ACHIEVEMENT_LIST = [
  // ==========================================
  // NHÓM CHUỖI NGÀY HỌC (STREAK) - Thưởng XP & Năng lượng (Để học tiếp)
  // ==========================================
  { id: "STR_1", groupId: "STREAK", tier: 1, title: "Mới vào nghề", desc: "Đạt chuỗi học 3 ngày liên tiếp.", icon: Flame, reqType: "highestStreak", reqValue: 3, rewardXp: 100, rewardEnergy: 10 },
  { id: "STR_2", groupId: "STREAK", tier: 2, title: "Thợ săn thói quen", desc: "Đạt chuỗi học 7 ngày liên tiếp.", icon: Flame, reqType: "highestStreak", reqValue: 7, rewardXp: 300, rewardEnergy: 25 },
  { id: "STR_3", groupId: "STREAK", tier: 3, title: "Kẻ hủy diệt lười biếng", desc: "Đạt chuỗi học 30 ngày liên tiếp.", icon: Flame, reqType: "highestStreak", reqValue: 30, rewardXp: 1000, rewardCoins: 500, rewardEnergy: 50 },
  { id: "STR_4", groupId: "STREAK", tier: 4, title: "Ý chí sắt đá", desc: "Đạt chuỗi học 100 ngày liên tiếp.", icon: Flame, reqType: "highestStreak", reqValue: 100, rewardXp: 3000, rewardCoins: 1500, rewardEnergy: 100 },
  { id: "STR_5", groupId: "STREAK", tier: 5, title: "Vượt qua giới hạn", desc: "Đạt chuỗi học 180 ngày liên tiếp.", icon: Flame, reqType: "highestStreak", reqValue: 180, rewardXp: 6000, rewardCoins: 3000, rewardEnergy: 200 },
  { id: "STR_6", groupId: "STREAK", tier: 6, title: "Kẻ nghiện học thuật", desc: "Đạt chuỗi học 365 ngày liên tiếp.", icon: Flame, reqType: "highestStreak", reqValue: 365, rewardXp: 15000, rewardCoins: 10000, rewardEnergy: 500 },

  // ==========================================
  // NHÓM CẤP ĐỘ (LEVEL) - Thưởng Xu & Năng lượng
  // ==========================================
  { id: "LVL_1", groupId: "LEVEL", tier: 1, title: "Tân binh", desc: "Đạt Cấp 5.", icon: Crown, reqType: "level", reqValue: 5, rewardCoins: 200, rewardEnergy: 15 },
  { id: "LVL_2", groupId: "LEVEL", tier: 2, title: "Học giả tập sự", desc: "Đạt Cấp 20.", icon: Crown, reqType: "level", reqValue: 20, rewardCoins: 800, rewardEnergy: 40 },
  { id: "LVL_3", groupId: "LEVEL", tier: 3, title: "Chuyên gia", desc: "Đạt Cấp 50.", icon: Crown, reqType: "level", reqValue: 50, rewardXp: 2000, rewardCoins: 2000, rewardEnergy: 100 },
  { id: "LVL_4", groupId: "LEVEL", tier: 4, title: "Bậc thầy", desc: "Đạt Cấp 80.", icon: Crown, reqType: "level", reqValue: 80, rewardXp: 5000, rewardCoins: 5000, rewardEnergy: 200 },
  { id: "LVL_5", groupId: "LEVEL", tier: 5, title: "Kẻ thống trị", desc: "Đạt Cấp 120.", icon: Crown, reqType: "level", reqValue: 120, rewardXp: 10000, rewardCoins: 10000, rewardEnergy: 300 },
  { id: "LVL_6", groupId: "LEVEL", tier: 6, title: "Thần đồng", desc: "Đạt Cấp 200.", icon: Crown, reqType: "level", reqValue: 200, rewardXp: 30000, rewardCoins: 25000, rewardEnergy: 1000 },

  // ==========================================
  // NHÓM VIDEO ĐÃ XEM (VIDEO)
  // ==========================================
  { id: "VID_1", groupId: "VIDEO", tier: 1, title: "Khán giả tò mò", desc: "Xem hoàn thành 10 Video.", icon: PlaySquare, reqType: "totalVideoWatched", reqValue: 10, rewardXp: 150, rewardCoins: 100 },
  { id: "VID_2", groupId: "VIDEO", tier: 2, title: "Khán giả chăm chỉ", desc: "Xem hoàn thành 50 Video.", icon: PlaySquare, reqType: "totalVideoWatched", reqValue: 50, rewardXp: 500, rewardCoins: 400 },
  { id: "VID_3", groupId: "VIDEO", tier: 3, title: "Mọt phim tri thức", desc: "Xem hoàn thành 200 Video.", icon: PlaySquare, reqType: "totalVideoWatched", reqValue: 200, rewardXp: 2000, rewardCoins: 1500 },
  { id: "VID_4", groupId: "VIDEO", tier: 4, title: "Nhà phê bình", desc: "Xem hoàn thành 500 Video.", icon: PlaySquare, reqType: "totalVideoWatched", reqValue: 500, rewardXp: 6000, rewardCoins: 4000, rewardEnergy: 100 },
  { id: "VID_5", groupId: "VIDEO", tier: 5, title: "Kẻ nghiện hình ảnh", desc: "Xem hoàn thành 1,000 Video.", icon: PlaySquare, reqType: "totalVideoWatched", reqValue: 1000, rewardXp: 15000, rewardCoins: 10000, rewardEnergy: 300 },

  // ==========================================
  // NHÓM ĐÁP ÁN ĐÚNG QUIZ (QUIZ_CORRECT)
  // ==========================================
  { id: "QZC_1", groupId: "QUIZ_CORRECT", tier: 1, title: "Bước đầu khám phá", desc: "Trả lời đúng 50 câu Quiz.", icon: BrainCircuit, reqType: "correctQuizAnswers", reqValue: 50, rewardXp: 200, rewardEnergy: 10 },
  { id: "QZC_2", groupId: "QUIZ_CORRECT", tier: 2, title: "Bộ não sắc bén", desc: "Trả lời đúng 200 câu Quiz.", icon: BrainCircuit, reqType: "correctQuizAnswers", reqValue: 200, rewardXp: 800, rewardEnergy: 30 },
  { id: "QZC_3", groupId: "QUIZ_CORRECT", tier: 3, title: "Trí tuệ nhân tạo", desc: "Trả lời đúng 1,000 câu Quiz.", icon: BrainCircuit, reqType: "correctQuizAnswers", reqValue: 1000, rewardXp: 3000, rewardCoins: 1000, rewardEnergy: 100 },
  { id: "QZC_4", groupId: "QUIZ_CORRECT", tier: 4, title: "Bách khoa toàn thư", desc: "Trả lời đúng 5,000 câu Quiz.", icon: BrainCircuit, reqType: "correctQuizAnswers", reqValue: 5000, rewardXp: 10000, rewardCoins: 3000, rewardEnergy: 250 },
  { id: "QZC_5", groupId: "QUIZ_CORRECT", tier: 5, title: "Vượt qua máy móc", desc: "Trả lời đúng 10,000 câu Quiz.", icon: BrainCircuit, reqType: "correctQuizAnswers", reqValue: 10000, rewardXp: 25000, rewardCoins: 8000, rewardEnergy: 600 },

  // ==========================================
  // NHÓM TỔNG SỐ BÀI THI QUIZ (QUIZ_TOTAL)
  // ==========================================
  { id: "QZT_1", groupId: "QUIZ_TOTAL", tier: 1, title: "Sĩ tử", desc: "Thực hiện tổng cộng 100 câu Quiz.", icon: Target, reqType: "totalQuizAttempts", reqValue: 100, rewardXp: 100, rewardCoins: 50 },
  { id: "QZT_2", groupId: "QUIZ_TOTAL", tier: 2, title: "Cỗ máy giải đề", desc: "Thực hiện tổng cộng 500 câu Quiz.", icon: Target, reqType: "totalQuizAttempts", reqValue: 500, rewardXp: 500, rewardCoins: 300 },
  { id: "QZT_3", groupId: "QUIZ_TOTAL", tier: 3, title: "Kẻ cuồng thi cử", desc: "Thực hiện tổng cộng 2,000 câu Quiz.", icon: Target, reqType: "totalQuizAttempts", reqValue: 2000, rewardXp: 2000, rewardCoins: 1000, rewardEnergy: 50 },

  // ==========================================
  // NHÓM TỪ VỰNG (VOCAB)
  // ==========================================
  { id: "VOC_1", groupId: "VOCAB", tier: 1, title: "Vốn từ sơ cấp", desc: "Học được 100 từ vựng mới.", icon: BookOpen, reqType: "learnedWordsCount", reqValue: 100, rewardXp: 200, rewardCoins: 100 },
  { id: "VOC_2", groupId: "VOCAB", tier: 2, title: "Ngôn ngữ lưu loát", desc: "Học được 500 từ vựng mới.", icon: BookOpen, reqType: "learnedWordsCount", reqValue: 500, rewardXp: 1000, rewardCoins: 500 },
  { id: "VOC_3", groupId: "VOCAB", tier: 3, title: "Từ điển sống", desc: "Học được 2,000 từ vựng mới.", icon: BookOpen, reqType: "learnedWordsCount", reqValue: 2000, rewardXp: 4000, rewardCoins: 2000, rewardEnergy: 50 },
  { id: "VOC_4", groupId: "VOCAB", tier: 4, title: "Nhà ngôn ngữ học", desc: "Học được 5,000 từ vựng mới.", icon: BookOpen, reqType: "learnedWordsCount", reqValue: 5000, rewardXp: 10000, rewardCoins: 5000, rewardEnergy: 150 },
  { id: "VOC_5", groupId: "VOCAB", tier: 5, title: "Vua từ vựng", desc: "Học được 10,000 từ vựng mới.", icon: BookOpen, reqType: "learnedWordsCount", reqValue: 10000, rewardXp: 25000, rewardCoins: 12000, rewardEnergy: 300 },

  // ==========================================
  // NHÓM LƯỢT QUAY GACHA (GACHA) - Quay nhiều trả lại Xu
  // ==========================================
  { id: "GC_1", groupId: "GACHA", tier: 1, title: "Người thử vận may", desc: "Thực hiện 50 lần quay Gacha.", icon: Sparkles, reqType: "totalGachaPulls", reqValue: 50, rewardXp: 100, rewardCoins: 200 },
  { id: "GC_2", groupId: "GACHA", tier: 2, title: "Bàn tay vàng", desc: "Thực hiện 200 lần quay Gacha.", icon: Sparkles, reqType: "totalGachaPulls", reqValue: 200, rewardXp: 400, rewardCoins: 800 },
  { id: "GC_3", groupId: "GACHA", tier: 3, title: "Con bạc khát nước", desc: "Thực hiện 1,000 lần quay Gacha.", icon: Sparkles, reqType: "totalGachaPulls", reqValue: 1000, rewardXp: 2000, rewardCoins: 3000 },
  { id: "GC_4", groupId: "GACHA", tier: 4, title: "Đáy xã hội", desc: "Thực hiện 5,000 lần quay Gacha.", icon: Sparkles, reqType: "totalGachaPulls", reqValue: 5000, rewardXp: 10000, rewardCoins: 15000 },
  { id: "GC_5", groupId: "GACHA", tier: 5, title: "Thần Gacha", desc: "Thực hiện 10,000 lần quay Gacha.", icon: Sparkles, reqType: "totalGachaPulls", reqValue: 10000, rewardXp: 25000, rewardCoins: 50000, rewardEnergy: 200 },

  // ==========================================
  // NHÓM BỤI SAO DƯ THỪA (STARDUST)
  // ==========================================
  { id: "SD_1", groupId: "STARDUST", tier: 1, title: "Người gom rác", desc: "Có 1,000 Bụi Sao do trùng thẻ.", icon: ShieldAlert, reqType: "stardust", reqValue: 1000, rewardXp: 100, rewardCoins: 300 },
  { id: "SD_2", groupId: "STARDUST", tier: 2, title: "Tái chế gia", desc: "Có 5,000 Bụi Sao do trùng thẻ.", icon: ShieldAlert, reqType: "stardust", reqValue: 5000, rewardXp: 500, rewardCoins: 1500 },
  { id: "SD_3", groupId: "STARDUST", tier: 3, title: "Đại lý ve chai", desc: "Có 20,000 Bụi Sao do trùng thẻ.", icon: ShieldAlert, reqType: "stardust", reqValue: 20000, rewardXp: 2000, rewardCoins: 6000 },

  // ==========================================
  // NHÓM TIN NHẮN CHAT & XÃ HỘI
  // ==========================================
  { id: "MSG_1", groupId: "SOCIAL_MSG", tier: 1, title: "Bắt đầu giao tiếp", desc: "Gửi 100 tin nhắn trong Box Chat.", icon: MessageSquare, reqType: "messagesSentCount", reqValue: 100, rewardXp: 100, rewardCoins: 50 },
  { id: "MSG_2", groupId: "SOCIAL_MSG", tier: 2, title: "Người kết nối", desc: "Gửi 1,000 tin nhắn trong Box Chat.", icon: MessageSquare, reqType: "messagesSentCount", reqValue: 1000, rewardXp: 500, rewardCoins: 300 },
  { id: "MSG_3", groupId: "SOCIAL_MSG", tier: 3, title: "Kẻ lắm lời", desc: "Gửi 10,000 tin nhắn trong Box Chat.", icon: MessageSquare, reqType: "messagesSentCount", reqValue: 10000, rewardXp: 5000, rewardCoins: 2000 },
  { id: "SHR_1", groupId: "SOCIAL_SHARE", tier: 1, title: "Hào phóng", desc: "Chia sẻ thẻ Wiki 20 lần.", icon: Swords, reqType: "sharedCardsCount", reqValue: 20, rewardXp: 200, rewardCoins: 100 },
  { id: "SHR_2", groupId: "SOCIAL_SHARE", tier: 2, title: "Nhà truyền giáo", desc: "Chia sẻ thẻ Wiki 100 lần.", icon: Swords, reqType: "sharedCardsCount", reqValue: 100, rewardXp: 1000, rewardCoins: 500 },
  { id: "SHR_3", groupId: "SOCIAL_SHARE", tier: 3, title: "Đại sứ tri thức", desc: "Chia sẻ thẻ Wiki 500 lần.", icon: Swords, reqType: "sharedCardsCount", reqValue: 500, rewardXp: 5000, rewardCoins: 2000, rewardEnergy: 100 },

  // ==========================================
  // NHÓM TÀI CHÍNH (ECONOMY) - Tiêu tiền trả lại năng lượng
  // ==========================================
  { id: "ECO_1", groupId: "ECONOMY", tier: 1, title: "Tiểu thương", desc: "Tiêu hao tổng cộng 5,000 Xu Gacha.", icon: Coins, reqType: "totalCoinsSpent", reqValue: 5000, rewardXp: 200, rewardEnergy: 20 },
  { id: "ECO_2", groupId: "ECONOMY", tier: 2, title: "Phú hào", desc: "Tiêu hao tổng cộng 50,000 Xu Gacha.", icon: Coins, reqType: "totalCoinsSpent", reqValue: 50000, rewardXp: 2000, rewardEnergy: 100 },
  { id: "ECO_3", groupId: "ECONOMY", tier: 3, title: "Tài phiệt", desc: "Tiêu hao tổng cộng 200,000 Xu Gacha.", icon: Coins, reqType: "totalCoinsSpent", reqValue: 200000, rewardXp: 8000, rewardEnergy: 400 },
  { id: "ECO_4", groupId: "ECONOMY", tier: 4, title: "Tỷ phú Hub-EL", desc: "Tiêu hao tổng cộng 1,000,000 Xu Gacha.", icon: Coins, reqType: "totalCoinsSpent", reqValue: 1000000, rewardXp: 40000, rewardEnergy: 2000 },
  
  // ==========================================
  // NHÓM NĂNG LƯỢNG AI (AI_TOKENS) - Tiêu năng lượng trả lại Xu
  // ==========================================
  { id: "AIT_1", groupId: "AI_TOKENS", tier: 1, title: "Học giả AI", desc: "Sử dụng tổng cộng 500 Năng lượng AI.", icon: Gem, reqType: "totalAiEnergySpent", reqValue: 500, rewardXp: 300, rewardCoins: 500 },
  { id: "AIT_2", groupId: "AI_TOKENS", tier: 2, title: "Kẻ thao túng trí tuệ", desc: "Sử dụng tổng cộng 2,000 Năng lượng AI.", icon: Gem, reqType: "totalAiEnergySpent", reqValue: 2000, rewardXp: 1500, rewardCoins: 2500 },
  { id: "AIT_3", groupId: "AI_TOKENS", tier: 3, title: "Chúa tể máy móc", desc: "Sử dụng tổng cộng 10,000 Năng lượng AI.", icon: Gem, reqType: "totalAiEnergySpent", reqValue: 10000, rewardXp: 8000, rewardCoins: 15000 },

  // ==========================================
  // THÀNH TỰU LẺ (MISC) & ẨN (EASTER EGGS) - Đậm đà bản sắc
  // ==========================================
  { id: "MISC_1", groupId: "MISC", tier: 3, title: "Mối tình đầu", desc: "Kết bạn với người đầu tiên trong cộng đồng.", icon: Users, reqType: "totalFriends", reqValue: 1, rewardXp: 500, rewardCoins: 500 },
  { id: "MISC_2", groupId: "MISC", tier: 4, title: "Kẻ lắm tiền", desc: "Lần đầu tiên nạp tiền vào hệ thống.", icon: Gem, reqType: "totalSpent", reqValue: 10000, rewardXp: 1000, rewardEnergy: 50, rewardCoins: 2000 },
  { id: "MISC_3", groupId: "MISC", tier: 2, title: "Loa phường", desc: "Chia sẻ thẻ lần đầu tiên lên mạng xã hội.", icon: Share2, reqType: "sharedCardsCount", reqValue: 1, rewardXp: 200, rewardCoins: 100 },
  { id: "MISC_4", groupId: "MISC", tier: 5, title: "Học giả đích thực", desc: "Hoàn thành 1 thẻ bài lên mức Full Sao.", icon: Star, reqType: "fullyAwakenedCards", reqValue: 1, rewardXp: 5000, rewardCoins: 5000, rewardEnergy: 100 },
  
  { id: "EGG_1", groupId: "EASTER_EGG", tier: 6, title: "Cú đêm Sài Thành", desc: "Nộp bài trắc nghiệm trong khoảng từ 1h - 4h sáng.", icon: Flame, reqType: "nightOwlStudies", reqValue: 1, rewardXp: 2000, rewardEnergy: 50 },
  { id: "EGG_2", groupId: "EASTER_EGG", tier: 2, title: "Chạm đáy nỗi đau", desc: "Làm bài thi (trên 10 câu) và sai sạch 100%.", icon: Skull, reqType: "zeroScoreQuizzes", reqValue: 1, rewardCoins: 1000, rewardEnergy: 50 }, // Thưởng an ủi
  { id: "EGG_3", groupId: "EASTER_EGG", tier: 3, title: "Tổ tiên phù hộ", desc: "Nộp bài dưới 10 giây mà vẫn đúng trên 50%.", icon: Rabbit, reqType: "luckyGuesses", reqValue: 1, rewardXp: 1500, rewardCoins: 1000 },
  { id: "EGG_4", groupId: "EASTER_EGG", tier: 2, title: "Đỗ nghèo khỉ", desc: "Bấm Nạp Tiền nhưng hủy thanh toán MoMo 3 lần.", icon: Coins, reqType: "canceledOrders", reqValue: 3, rewardCoins: 500 }, // Cho 500 xu xài đỡ
  { id: "EGG_5", groupId: "EASTER_EGG", tier: 2, title: "Vô sản thực sự", desc: "Tiêu sạch sành sanh không còn 1 đồng Xu Gacha nào.", icon: BatteryWarning, reqType: "brokeTimes", reqValue: 1, rewardCoins: 1000 }, // Bơm máu khẩn cấp
  { id: "EGG_6", groupId: "EASTER_EGG", tier: 4, title: "Nhân phẩm bộc phát", desc: "Quay Gacha trúng thẻ MR/LR ngay lần đầu tiên trong ngày.", icon: Sparkles, reqType: "firstPullJackpots", reqValue: 1, rewardXp: 3000, rewardCoins: 2000, rewardEnergy: 50 },
  { id: "EGG_7", groupId: "EASTER_EGG", tier: 2, title: "Bàn tay thối", desc: "Quay Gacha trúng 10 thẻ trùng lặp (Dupe) liên tiếp.", icon: ShieldAlert, reqType: "consecutiveDupes", reqValue: 10, rewardXp: 1000, rewardEnergy: 100 }, // Thưởng năng lượng cày bài
  { id: "EGG_8", groupId: "EASTER_EGG", tier: 6, title: "Ngủ quên trong lớp", desc: "Làm bài dở dang để hết thời gian và bị 0 điểm.", icon: Clock, reqType: "timeoutQuizzes", reqValue: 1, rewardXp: 500 },
  { id: "EGG_9", groupId: "EASTER_EGG", tier: 2, title: "Cà lơ phất phơ", desc: "Bật một bài học lên và treo máy không làm gì trong 30 phút.", icon: Ghost, reqType: "afkLessons", reqValue: 1, rewardCoins: 200 }
];