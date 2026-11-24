import '../../domain/entities/user_profile_entity.dart';

class UserProfileModel extends UserProfileEntity {
  const UserProfileModel({
    required super.id,
    super.name,
    super.fullName,
    super.username,
    required super.email,
    super.displayAvatar,
    super.bio,
    super.interests = const [],
    super.socialLinks = const [],
    super.level = 1,
    super.xp = 0,
    super.isPro = false,
    super.role = 'student',
    super.createdAt,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedInterests = [];
    if (json['interests'] != null) {
      if (json['interests'] is List) {
        parsedInterests = (json['interests'] as List)
            .map((e) => e.toString().trim())
            .where((e) => e.isNotEmpty)
            .toSet()
            .toList();
      }
    }

    List<Map<String, dynamic>> parsedSocialLinks = [];
    if (json['socialLinks'] != null && json['socialLinks'] is List) {
      for (final item in json['socialLinks'] as List) {
        if (item is Map) {
          parsedSocialLinks.add(Map<String, dynamic>.from(item));
        } else if (item is String && item.trim().isNotEmpty) {
          parsedSocialLinks.add({'platform': 'link', 'url': item.trim()});
        }
      }
    }

    DateTime? parsedCreatedAt;
    if (json['createdAt'] != null) {
      try {
        parsedCreatedAt = DateTime.parse(json['createdAt'].toString());
      } catch (_) {}
    }

    return UserProfileModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString(),
      fullName: json['fullName']?.toString() ?? json['name']?.toString(),
      username: json['username']?.toString(),
      email: json['email']?.toString() ?? '',
      displayAvatar: json['displayAvatar']?.toString() ??
          json['image']?.toString() ??
          json['avatar']?.toString(),
      bio: json['bio']?.toString(),
      interests: parsedInterests,
      socialLinks: parsedSocialLinks,
      level: json['level'] is num ? (json['level'] as num).toInt() : 1,
      xp: json['xp'] is num ? (json['xp'] as num).toInt() : 0,
      isPro: json['isPro'] == true,
      role: json['role']?.toString() ?? 'student',
      createdAt: parsedCreatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'fullName': fullName,
      'username': username,
      'email': email,
      'displayAvatar': displayAvatar,
      'bio': bio,
      'interests': interests,
      'socialLinks': socialLinks,
      'level': level,
      'xp': xp,
      'isPro': isPro,
      'role': role,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

