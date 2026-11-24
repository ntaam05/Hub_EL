import '../../domain/entities/achievement_entities.dart';

class AchievementItemModel extends AchievementItemEntity {
  const AchievementItemModel({
    required super.id,
    required super.groupId,
    required super.tier,
    required super.title,
    required super.desc,
    required super.reqType,
    required super.reqValue,
    required super.currentProgress,
    required super.progressPercent,
    required super.isUnlocked,
    required super.rewardXp,
    required super.rewardCoins,
    required super.rewardEnergy,
  });

  factory AchievementItemModel.fromJson(Map<String, dynamic> json) {
    return AchievementItemModel(
      id: json['id']?.toString() ?? '',
      groupId: json['groupId']?.toString() ?? 'MISC',
      tier: json['tier'] is int ? json['tier'] as int : int.tryParse(json['tier']?.toString() ?? '1') ?? 1,
      title: json['title']?.toString() ?? '',
      desc: json['desc']?.toString() ?? '',
      reqType: json['reqType']?.toString() ?? '',
      reqValue: json['reqValue'] is int
          ? json['reqValue'] as int
          : int.tryParse(json['reqValue']?.toString() ?? '0') ?? 0,
      currentProgress: json['currentProgress'] is int
          ? json['currentProgress'] as int
          : (json['currentProgress'] is double
              ? (json['currentProgress'] as double).round()
              : int.tryParse(json['currentProgress']?.toString() ?? '0') ?? 0),
      progressPercent: json['progressPercent'] is int
          ? json['progressPercent'] as int
          : (json['progressPercent'] is double
              ? (json['progressPercent'] as double).round()
              : int.tryParse(json['progressPercent']?.toString() ?? '0') ?? 0),
      isUnlocked: json['isUnlocked'] == true,
      rewardXp: json['rewardXp'] is int
          ? json['rewardXp'] as int
          : int.tryParse(json['rewardXp']?.toString() ?? '0') ?? 0,
      rewardCoins: json['rewardCoins'] is int
          ? json['rewardCoins'] as int
          : int.tryParse(json['rewardCoins']?.toString() ?? '0') ?? 0,
      rewardEnergy: json['rewardEnergy'] is int
          ? json['rewardEnergy'] as int
          : int.tryParse(json['rewardEnergy']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'groupId': groupId,
      'tier': tier,
      'title': title,
      'desc': desc,
      'reqType': reqType,
      'reqValue': reqValue,
      'currentProgress': currentProgress,
      'progressPercent': progressPercent,
      'isUnlocked': isUnlocked,
      'rewardXp': rewardXp,
      'rewardCoins': rewardCoins,
      'rewardEnergy': rewardEnergy,
    };
  }
}

class AchievementSummaryModel extends AchievementSummaryEntity {
  const AchievementSummaryModel({
    required super.totalCount,
    required super.unlockedCount,
    required super.progressPercent,
  });

  factory AchievementSummaryModel.fromJson(Map<String, dynamic> json) {
    return AchievementSummaryModel(
      totalCount: json['totalCount'] is int
          ? json['totalCount'] as int
          : int.tryParse(json['totalCount']?.toString() ?? '0') ?? 0,
      unlockedCount: json['unlockedCount'] is int
          ? json['unlockedCount'] as int
          : int.tryParse(json['unlockedCount']?.toString() ?? '0') ?? 0,
      progressPercent: json['progressPercent'] is int
          ? json['progressPercent'] as int
          : (json['progressPercent'] is double
              ? (json['progressPercent'] as double).round()
              : int.tryParse(json['progressPercent']?.toString() ?? '0') ?? 0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalCount': totalCount,
      'unlockedCount': unlockedCount,
      'progressPercent': progressPercent,
    };
  }
}

class NewlyUnlockedModel extends NewlyUnlockedEntity {
  const NewlyUnlockedModel({
    required super.id,
    required super.title,
    required super.desc,
    required super.tier,
    required super.rewardXp,
    required super.rewardCoins,
    required super.rewardEnergy,
  });

  factory NewlyUnlockedModel.fromJson(Map<String, dynamic> json) {
    return NewlyUnlockedModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      desc: json['desc']?.toString() ?? '',
      tier: json['tier'] is int ? json['tier'] as int : int.tryParse(json['tier']?.toString() ?? '1') ?? 1,
      rewardXp: json['rewardXp'] is int
          ? json['rewardXp'] as int
          : int.tryParse(json['rewardXp']?.toString() ?? '0') ?? 0,
      rewardCoins: json['rewardCoins'] is int
          ? json['rewardCoins'] as int
          : int.tryParse(json['rewardCoins']?.toString() ?? '0') ?? 0,
      rewardEnergy: json['rewardEnergy'] is int
          ? json['rewardEnergy'] as int
          : int.tryParse(json['rewardEnergy']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'desc': desc,
      'tier': tier,
      'rewardXp': rewardXp,
      'rewardCoins': rewardCoins,
      'rewardEnergy': rewardEnergy,
    };
  }
}

class AchievementsDataModel extends AchievementsDataEntity {
  const AchievementsDataModel({
    required super.summary,
    required super.achievements,
    super.newlyUnlocked = const [],
    super.earnedXP = 0,
    super.earnedCoins = 0,
    super.earnedEnergy = 0,
  });

  factory AchievementsDataModel.fromJson(Map<String, dynamic> json) {
    final summaryJson = json['summary'] is Map<String, dynamic>
        ? json['summary'] as Map<String, dynamic>
        : <String, dynamic>{};

    final rawAchievements = json['achievements'] as List<dynamic>? ?? [];
    final achievements = rawAchievements
        .map((e) => AchievementItemModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final rawNewlyUnlocked = json['newlyUnlocked'] as List<dynamic>? ?? [];
    final newlyUnlocked = rawNewlyUnlocked
        .map((e) => NewlyUnlockedModel.fromJson(e as Map<String, dynamic>))
        .toList();

    return AchievementsDataModel(
      summary: AchievementSummaryModel.fromJson(summaryJson),
      achievements: achievements,
      newlyUnlocked: newlyUnlocked,
      earnedXP: json['earnedXP'] is int
          ? json['earnedXP'] as int
          : int.tryParse(json['earnedXP']?.toString() ?? '0') ?? 0,
      earnedCoins: json['earnedCoins'] is int
          ? json['earnedCoins'] as int
          : int.tryParse(json['earnedCoins']?.toString() ?? '0') ?? 0,
      earnedEnergy: json['earnedEnergy'] is int
          ? json['earnedEnergy'] as int
          : int.tryParse(json['earnedEnergy']?.toString() ?? '0') ?? 0,
    );
  }
}

