/// Định nghĩa các danh mục bảng xếp hạng
enum LeaderboardCategoryType {
  streak('STREAK', 'Bền Bỉ', 'Chuỗi liên tục'),
  grinder('GRINDER', 'Cày Cuốc', 'Top kinh nghiệm XP'),
  time('TIME', 'Thời Gian', 'Thời lượng học tập'),
  aiKiller('AI_KILLER', 'Khắc Tinh AI', 'Số câu trả lời đúng');

  final String code;
  final String title;
  final String subtitle;

  const LeaderboardCategoryType(this.code, this.title, this.subtitle);

  static LeaderboardCategoryType fromCode(String code) {
    return LeaderboardCategoryType.values.firstWhere(
      (e) => e.code.toUpperCase() == code.toUpperCase(),
      orElse: () => LeaderboardCategoryType.streak,
    );
  }
}

/// Định nghĩa các mốc thời gian lọc
enum LeaderboardTimeframeType {
  day('DAY', 'Hôm nay'),
  week('WEEK', 'Tuần này'),
  month('MONTH', 'Tháng này'),
  all('ALL', 'Mọi lúc');

  final String code;
  final String label;

  const LeaderboardTimeframeType(this.code, this.label);

  static LeaderboardTimeframeType fromCode(String code) {
    return LeaderboardTimeframeType.values.firstWhere(
      (e) => e.code.toUpperCase() == code.toUpperCase(),
      orElse: () => LeaderboardTimeframeType.day,
    );
  }
}

/// Thực thể người chơi trên bảng xếp hạng
class LeaderboardPlayerEntity {
  final int rank;
  final String userId;
  final String displayName;
  final String? username;
  final String? avatar;
  final bool isPro;
  final int level;
  final int scoreValue;
  final String scoreLabel;
  final String subLabel;
  final bool isTop50;

  const LeaderboardPlayerEntity({
    required this.rank,
    required this.userId,
    required this.displayName,
    this.username,
    this.avatar,
    this.isPro = false,
    this.level = 1,
    required this.scoreValue,
    required this.scoreLabel,
    required this.subLabel,
    this.isTop50 = true,
  });
}

/// Thực thể tổng hợp toàn bộ bảng xếp hạng
class LeaderboardDataEntity {
  final LeaderboardCategoryType category;
  final LeaderboardTimeframeType range;
  final DateTime generatedAt;
  final List<LeaderboardPlayerEntity> topPlayers;
  final LeaderboardPlayerEntity? currentUser;

  const LeaderboardDataEntity({
    required this.category,
    required this.range,
    required this.generatedAt,
    required this.topPlayers,
    this.currentUser,
  });
}

