import '../../domain/entities/leaderboard_entity.dart';

class LeaderboardPlayerModel extends LeaderboardPlayerEntity {
  const LeaderboardPlayerModel({
    required super.rank,
    required super.userId,
    required super.displayName,
    super.username,
    super.avatar,
    super.isPro = false,
    super.level = 1,
    required super.scoreValue,
    required super.scoreLabel,
    required super.subLabel,
    super.isTop50 = true,
  });

  factory LeaderboardPlayerModel.fromJson(Map<String, dynamic> json) {
    return LeaderboardPlayerModel(
      rank: json['rank'] is int ? json['rank'] : int.tryParse(json['rank']?.toString() ?? '0') ?? 0,
      userId: json['userId']?.toString() ?? json['id']?.toString() ?? '',
      displayName: json['displayName']?.toString() ?? json['name']?.toString() ?? 'Học viên ẩn danh',
      username: json['username']?.toString(),
      avatar: json['avatar']?.toString() ?? json['image']?.toString(),
      isPro: json['isPro'] == true,
      level: json['level'] is int ? json['level'] : int.tryParse(json['level']?.toString() ?? '1') ?? 1,
      scoreValue: json['scoreValue'] is int
          ? json['scoreValue']
          : int.tryParse(json['scoreValue']?.toString() ?? '0') ?? 0,
      scoreLabel: json['scoreLabel']?.toString() ?? '',
      subLabel: json['subLabel']?.toString() ?? '',
      isTop50: json['isTop50'] != false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rank': rank,
      'userId': userId,
      'displayName': displayName,
      'username': username,
      'avatar': avatar,
      'isPro': isPro,
      'level': level,
      'scoreValue': scoreValue,
      'scoreLabel': scoreLabel,
      'subLabel': subLabel,
      'isTop50': isTop50,
    };
  }
}

class LeaderboardDataModel extends LeaderboardDataEntity {
  const LeaderboardDataModel({
    required super.category,
    required super.range,
    required super.generatedAt,
    required super.topPlayers,
    super.currentUser,
  });

  factory LeaderboardDataModel.fromJson(Map<String, dynamic> json) {
    final rawTop = json['topPlayers'] as List<dynamic>? ?? [];
    final topPlayers = rawTop
        .map((item) => LeaderboardPlayerModel.fromJson(item as Map<String, dynamic>))
        .toList();

    LeaderboardPlayerModel? currentUser;
    if (json['currentUser'] != null && json['currentUser'] is Map<String, dynamic>) {
      currentUser = LeaderboardPlayerModel.fromJson(json['currentUser'] as Map<String, dynamic>);
    }

    return LeaderboardDataModel(
      category: LeaderboardCategoryType.fromCode(json['category']?.toString() ?? 'STREAK'),
      range: LeaderboardTimeframeType.fromCode(json['range']?.toString() ?? 'DAY'),
      generatedAt: json['generatedAt'] != null
          ? DateTime.tryParse(json['generatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      topPlayers: topPlayers,
      currentUser: currentUser,
    );
  }
}

