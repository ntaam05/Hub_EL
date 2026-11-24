import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// 6 Cấp độ Thành Tựu
enum AchievementTier {
  bronze(1, 'Đồng', 'BRONZE', Color(0xFFD97706), Color(0xFFB45309)),
  silver(2, 'Bạc', 'SILVER', Color(0xFF94A3B8), Color(0xFF64748B)),
  gold(3, 'Vàng', 'GOLD', Color(0xFFEAB308), Color(0xFFCA8A04)),
  platinum(4, 'Bạch Kim', 'PLATINUM', Color(0xFF06B6D4), Color(0xFF0891B2)),
  diamond(5, 'Kim Cương', 'DIAMOND', Color(0xFF8B5CF6), Color(0xFF7C3AED)),
  master(6, 'Tinh Anh', 'MASTER', Color(0xFFF43F5E), Color(0xFFE11D48));

  final int level;
  final String label;
  final String code;
  final Color primaryColor;
  final Color darkColor;

  const AchievementTier(
    this.level,
    this.label,
    this.code,
    this.primaryColor,
    this.darkColor,
  );

  static AchievementTier fromLevel(int level) {
    return AchievementTier.values.firstWhere(
      (t) => t.level == level,
      orElse: () => AchievementTier.bronze,
    );
  }
}

/// 14 Nhóm Thành Tựu
enum AchievementGroup {
  streak('STREAK', 'Chuỗi ngày học', LucideIcons.flame),
  level('LEVEL', 'Cấp độ học giả', LucideIcons.crown),
  video('VIDEO', 'Video bài giảng', LucideIcons.playSquare),
  quizCorrect('QUIZ_CORRECT', 'Đúng trắc nghiệm', LucideIcons.brainCircuit),
  quizTotal('QUIZ_TOTAL', 'Tổng câu trắc nghiệm', LucideIcons.target),
  vocab('VOCAB', 'Kho từ vựng', LucideIcons.bookOpen),
  gacha('GACHA', 'Vòng quay Gacha', LucideIcons.sparkles),
  stardust('STARDUST', 'Bụi Sao dư thừa', LucideIcons.shieldAlert),
  socialMsg('SOCIAL_MSG', 'Tin nhắn cộng đồng', LucideIcons.messageSquare),
  socialShare('SOCIAL_SHARE', 'Chia sẻ tri thức', LucideIcons.share2),
  economy('ECONOMY', 'Tiêu dùng Xu', LucideIcons.coins),
  aiTokens('AI_TOKENS', 'Năng lượng AI', LucideIcons.gem),
  misc('MISC', 'Thành tựu đặc biệt', LucideIcons.award),
  easterEgg('EASTER_EGG', 'Trứng phục sinh', LucideIcons.ghost);

  final String code;
  final String label;
  final IconData icon;

  const AchievementGroup(this.code, this.label, this.icon);

  static AchievementGroup fromCode(String code) {
    return AchievementGroup.values.firstWhere(
      (g) => g.code.toUpperCase() == code.toUpperCase(),
      orElse: () => AchievementGroup.misc,
    );
  }
}

/// Thực thể từng thành tựu
class AchievementItemEntity {
  final String id;
  final String groupId;
  final int tier;
  final String title;
  final String desc;
  final String reqType;
  final int reqValue;
  final int currentProgress;
  final int progressPercent;
  final bool isUnlocked;
  final int rewardXp;
  final int rewardCoins;
  final int rewardEnergy;

  const AchievementItemEntity({
    required this.id,
    required this.groupId,
    required this.tier,
    required this.title,
    required this.desc,
    required this.reqType,
    required this.reqValue,
    required this.currentProgress,
    required this.progressPercent,
    required this.isUnlocked,
    required this.rewardXp,
    required this.rewardCoins,
    required this.rewardEnergy,
  });

  AchievementTier get tierEnum => AchievementTier.fromLevel(tier);
  AchievementGroup get groupEnum => AchievementGroup.fromCode(groupId);

  bool get hasRewards => rewardXp > 0 || rewardCoins > 0 || rewardEnergy > 0;
}

/// Thống kê tổng quan thành tựu
class AchievementSummaryEntity {
  final int totalCount;
  final int unlockedCount;
  final int progressPercent;

  const AchievementSummaryEntity({
    required this.totalCount,
    required this.unlockedCount,
    required this.progressPercent,
  });

  int get lockedCount => totalCount - unlockedCount;
}

/// Chi tiết thành tựu vừa được mở khóa
class NewlyUnlockedEntity {
  final String id;
  final String title;
  final String desc;
  final int tier;
  final int rewardXp;
  final int rewardCoins;
  final int rewardEnergy;

  const NewlyUnlockedEntity({
    required this.id,
    required this.title,
    required this.desc,
    required this.tier,
    required this.rewardXp,
    required this.rewardCoins,
    required this.rewardEnergy,
  });

  AchievementTier get tierEnum => AchievementTier.fromLevel(tier);
}

/// Dữ liệu tổng thể màn hình Thành Tựu
class AchievementsDataEntity {
  final AchievementSummaryEntity summary;
  final List<AchievementItemEntity> achievements;
  final List<NewlyUnlockedEntity> newlyUnlocked;
  final int earnedXP;
  final int earnedCoins;
  final int earnedEnergy;

  const AchievementsDataEntity({
    required this.summary,
    required this.achievements,
    this.newlyUnlocked = const [],
    this.earnedXP = 0,
    this.earnedCoins = 0,
    this.earnedEnergy = 0,
  });

  bool get hasEarnedRewards =>
      earnedXP > 0 || earnedCoins > 0 || earnedEnergy > 0 || newlyUnlocked.isNotEmpty;
}

