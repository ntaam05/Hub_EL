import '../../domain/entities/user_entity.dart';

/// Model Người dùng ánh xạ dữ liệu JSON từ Backend
class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.email,
    super.name,
    super.fullName,
    super.username,
    super.avatar,
    super.image,
    super.role = 'student',
    super.isActive = true,
    super.level = 1,
    super.xp = 0,
    super.freeCoins = 0,
    super.aiTokens = 0,
    super.premiumCoins = 0,
    super.stardust = 0,
    super.isPro = false,
    super.currentStreak = 0,
    super.highestStreak = 0,
    super.streakFreezes = 0,
    super.lastStudyDate,
    super.targetLanguage = 'en',
    super.languageLevel = 'A2',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString(),
      fullName: json['fullName']?.toString(),
      username: json['username']?.toString(),
      avatar: json['avatar']?.toString(),
      image: json['image']?.toString(),
      role: json['role']?.toString() ?? 'student',
      isActive: json['isActive'] == true || json['isActive'] == 1,
      level: json['level'] is int ? json['level'] : int.tryParse(json['level']?.toString() ?? '1') ?? 1,
      xp: json['xp'] is int ? json['xp'] : int.tryParse(json['xp']?.toString() ?? '0') ?? 0,
      freeCoins: json['freeCoins'] is int ? json['freeCoins'] : int.tryParse(json['freeCoins']?.toString() ?? '0') ?? 0,
      aiTokens: json['aiTokens'] is int ? json['aiTokens'] : int.tryParse(json['aiTokens']?.toString() ?? '0') ?? 0,
      premiumCoins: json['premiumCoins'] is int ? json['premiumCoins'] : int.tryParse(json['premiumCoins']?.toString() ?? '0') ?? 0,
      stardust: json['stardust'] is int ? json['stardust'] : int.tryParse(json['stardust']?.toString() ?? '0') ?? 0,
      isPro: json['isPro'] == true || json['isPro'] == 1,
      currentStreak: json['currentStreak'] is int ? json['currentStreak'] : int.tryParse(json['currentStreak']?.toString() ?? '0') ?? 0,
      highestStreak: json['highestStreak'] is int ? json['highestStreak'] : int.tryParse(json['highestStreak']?.toString() ?? '0') ?? 0,
      streakFreezes: json['streakFreezes'] is int ? json['streakFreezes'] : int.tryParse(json['streakFreezes']?.toString() ?? '0') ?? 0,
      lastStudyDate: json['lastStudyDate'] != null ? DateTime.tryParse(json['lastStudyDate'].toString()) : null,
      targetLanguage: json['targetLanguage']?.toString() ?? 'en',
      languageLevel: json['languageLevel']?.toString() ?? 'A2',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'fullName': fullName,
      'username': username,
      'avatar': avatar,
      'image': image,
      'role': role,
      'isActive': isActive,
      'level': level,
      'xp': xp,
      'freeCoins': freeCoins,
      'aiTokens': aiTokens,
      'premiumCoins': premiumCoins,
      'stardust': stardust,
      'isPro': isPro,
      'currentStreak': currentStreak,
      'highestStreak': highestStreak,
      'streakFreezes': streakFreezes,
      'lastStudyDate': lastStudyDate?.toIso8601String(),
      'targetLanguage': targetLanguage,
      'languageLevel': languageLevel,
    };
  }
}

