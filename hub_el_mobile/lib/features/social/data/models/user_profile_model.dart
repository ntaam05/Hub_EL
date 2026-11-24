import '../../domain/entities/search_user_entity.dart';
import '../../domain/entities/user_profile_entity.dart';

class UserProfileModel extends UserProfileEntity {
  const UserProfileModel({
    required super.id,
    required super.name,
    super.username,
    super.image,
    super.bio,
    super.level,
    super.streak,
    super.experience,
    super.isOnline,
    super.friendshipStatus,
    super.isProfileHidden,
    super.friendsCount,
    super.mutualFriendsCount,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    final statusStr = json['friendshipStatus']?.toString().toUpperCase();
    FriendshipStatus status = FriendshipStatus.none;
    if (statusStr == 'PENDING') {
      status = FriendshipStatus.pending;
    } else if (statusStr == 'ACCEPTED') {
      status = FriendshipStatus.accepted;
    } else if (statusStr == 'BLOCKED') {
      status = FriendshipStatus.blocked;
    }

    return UserProfileModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Người dùng',
      username: json['username']?.toString(),
      image: json['image']?.toString(),
      bio: json['bio']?.toString(),
      level: (json['level'] is num) ? (json['level'] as num).toInt() : 1,
      streak: (json['streak'] is num) ? (json['streak'] as num).toInt() : 0,
      experience: (json['experience'] is num) ? (json['experience'] as num).toInt() : 0,
      isOnline: json['isOnline'] == true,
      friendshipStatus: status,
      isProfileHidden: json['isProfileHidden'] == true,
      friendsCount: (json['friendsCount'] is num) ? (json['friendsCount'] as num).toInt() : 0,
      mutualFriendsCount: (json['mutualFriendsCount'] is num)
          ? (json['mutualFriendsCount'] as num).toInt()
          : 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'image': image,
      'bio': bio,
      'level': level,
      'streak': streak,
      'experience': experience,
      'isOnline': isOnline,
      'friendshipStatus': friendshipStatus.name.toUpperCase(),
      'isProfileHidden': isProfileHidden,
      'friendsCount': friendsCount,
      'mutualFriendsCount': mutualFriendsCount,
    };
  }
}

