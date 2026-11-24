import 'package:equatable/equatable.dart';

/// Thực thể thông tin chi tiết hồ sơ người dùng (Settings & Profile)
class UserProfileEntity extends Equatable {
  final String id;
  final String? name;
  final String? fullName;
  final String? username;
  final String email;
  final String? displayAvatar;
  final String? bio;
  final List<String> interests;
  final List<Map<String, dynamic>> socialLinks;
  final int level;
  final int xp;
  final bool isPro;
  final String role;
  final DateTime? createdAt;

  const UserProfileEntity({
    required this.id,
    this.name,
    this.fullName,
    this.username,
    required this.email,
    this.displayAvatar,
    this.bio,
    this.interests = const [],
    this.socialLinks = const [],
    this.level = 1,
    this.xp = 0,
    this.isPro = false,
    this.role = 'student',
    this.createdAt,
  });

  String get displayName => (fullName != null && fullName!.trim().isNotEmpty)
      ? fullName!.trim()
      : (name != null && name!.trim().isNotEmpty)
          ? name!.trim()
          : (username != null && username!.trim().isNotEmpty)
              ? username!.trim()
              : email.split('@').first;

  String get displayUsername =>
      (username != null && username!.trim().isNotEmpty)
          ? '@${username!.trim()}'
          : '@member';

  String get initialLetter {
    final d = displayName;
    return d.isNotEmpty ? d[0].toUpperCase() : 'U';
  }

  bool get hasBio => bio != null && bio!.trim().isNotEmpty;

  UserProfileEntity copyWith({
    String? id,
    String? name,
    String? fullName,
    String? username,
    String? email,
    String? displayAvatar,
    String? bio,
    List<String>? interests,
    List<Map<String, dynamic>>? socialLinks,
    int? level,
    int? xp,
    bool? isPro,
    String? role,
    DateTime? createdAt,
  }) {
    return UserProfileEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      fullName: fullName ?? this.fullName,
      username: username ?? this.username,
      email: email ?? this.email,
      displayAvatar: displayAvatar ?? this.displayAvatar,
      bio: bio ?? this.bio,
      interests: interests ?? this.interests,
      socialLinks: socialLinks ?? this.socialLinks,
      level: level ?? this.level,
      xp: xp ?? this.xp,
      isPro: isPro ?? this.isPro,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        fullName,
        username,
        email,
        displayAvatar,
        bio,
        interests,
        socialLinks,
        level,
        xp,
        isPro,
        role,
        createdAt,
      ];
}

/// Dữ liệu gửi lên khi cập nhật thông tin cá nhân
class UpdateProfileRequest extends Equatable {
  final String? fullName;
  final String? username;
  final String? bio;
  final List<String>? interests;
  final List<Map<String, dynamic>>? socialLinks;

  const UpdateProfileRequest({
    this.fullName,
    this.username,
    this.bio,
    this.interests,
    this.socialLinks,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (fullName != null) map['fullName'] = fullName!.trim();
    if (username != null) map['username'] = username!.trim();
    if (bio != null) map['bio'] = bio!.trim();
    if (interests != null) map['interests'] = interests;
    if (socialLinks != null) map['socialLinks'] = socialLinks;
    return map;
  }

  @override
  List<Object?> get props => [fullName, username, bio, interests, socialLinks];
}

