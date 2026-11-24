/// Thực thể Người dùng trong tầng Domain
class UserEntity {
  final String id;
  final String email;
  final String? name;
  final String? fullName;
  final String? username;
  final String? avatar;
  final String? image;
  final String role;
  final bool isActive;
  final int level;
  final int xp;
  final int freeCoins;
  final int aiTokens;
  final int premiumCoins;
  final int stardust;
  final bool isPro;
  final int currentStreak;
  final int highestStreak;
  final int streakFreezes;
  final String? targetLanguage;
  final String? languageLevel;

  const UserEntity({
    required this.id,
    required this.email,
    this.name,
    this.fullName,
    this.username,
    this.avatar,
    this.image,
    this.role = 'student',
    this.isActive = true,
    this.level = 1,
    this.xp = 0,
    this.freeCoins = 0,
    this.aiTokens = 0,
    this.premiumCoins = 0,
    this.stardust = 0,
    this.isPro = false,
    this.currentStreak = 0,
    this.highestStreak = 0,
    this.streakFreezes = 0,
    this.targetLanguage = 'en',
    this.languageLevel = 'A2',
  });

  String get displayName => fullName ?? name ?? username ?? email.split('@').first;
  bool get isBanned => role.toLowerCase() == 'banned' || !isActive;
  String? get displayAvatar => image ?? avatar;

  /// Giới hạn Năng lượng tối đa đồng bộ theo công thức chuẩn Web Hub-EL
  int get maxEnergy {
    final baseCap = 50 + (level - 1) * 5;
    return isPro ? baseCap + 50 : baseCap;
  }

  UserEntity copyWith({
    String? id,
    String? email,
    String? name,
    String? fullName,
    String? username,
    String? avatar,
    String? image,
    String? role,
    bool? isActive,
    int? level,
    int? xp,
    int? freeCoins,
    int? aiTokens,
    int? premiumCoins,
    int? stardust,
    bool? isPro,
    int? currentStreak,
    int? highestStreak,
    int? streakFreezes,
    String? targetLanguage,
    String? languageLevel,
  }) {
    return UserEntity(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      fullName: fullName ?? this.fullName,
      username: username ?? this.username,
      avatar: avatar ?? this.avatar,
      image: image ?? this.image,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      level: level ?? this.level,
      xp: xp ?? this.xp,
      freeCoins: freeCoins ?? this.freeCoins,
      aiTokens: aiTokens ?? this.aiTokens,
      premiumCoins: premiumCoins ?? this.premiumCoins,
      stardust: stardust ?? this.stardust,
      isPro: isPro ?? this.isPro,
      currentStreak: currentStreak ?? this.currentStreak,
      highestStreak: highestStreak ?? this.highestStreak,
      streakFreezes: streakFreezes ?? this.streakFreezes,
      targetLanguage: targetLanguage ?? this.targetLanguage,
      languageLevel: languageLevel ?? this.languageLevel,
    );
  }
}

