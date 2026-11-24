import 'package:equatable/equatable.dart';
import 'search_user_entity.dart';

/// Đại diện cho hồ sơ chi tiết của người dùng khác
class UserProfileEntity extends Equatable {
  final String id;
  final String name;
  final String? username;
  final String? image;
  final String? bio;
  final int level;
  final int streak;
  final int experience;
  final bool isOnline;
  final FriendshipStatus friendshipStatus;
  final bool isProfileHidden;
  final int friendsCount;
  final int mutualFriendsCount;

  const UserProfileEntity({
    required this.id,
    required this.name,
    this.username,
    this.image,
    this.bio,
    this.level = 1,
    this.streak = 0,
    this.experience = 0,
    this.isOnline = false,
    this.friendshipStatus = FriendshipStatus.none,
    this.isProfileHidden = false,
    this.friendsCount = 0,
    this.mutualFriendsCount = 0,
  });

  UserProfileEntity copyWith({
    String? id,
    String? name,
    String? username,
    String? image,
    String? bio,
    int? level,
    int? streak,
    int? experience,
    bool? isOnline,
    FriendshipStatus? friendshipStatus,
    bool? isProfileHidden,
    int? friendsCount,
    int? mutualFriendsCount,
  }) {
    return UserProfileEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      image: image ?? this.image,
      bio: bio ?? this.bio,
      level: level ?? this.level,
      streak: streak ?? this.streak,
      experience: experience ?? this.experience,
      isOnline: isOnline ?? this.isOnline,
      friendshipStatus: friendshipStatus ?? this.friendshipStatus,
      isProfileHidden: isProfileHidden ?? this.isProfileHidden,
      friendsCount: friendsCount ?? this.friendsCount,
      mutualFriendsCount: mutualFriendsCount ?? this.mutualFriendsCount,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        username,
        image,
        bio,
        level,
        streak,
        experience,
        isOnline,
        friendshipStatus,
        isProfileHidden,
        friendsCount,
        mutualFriendsCount,
      ];
}

