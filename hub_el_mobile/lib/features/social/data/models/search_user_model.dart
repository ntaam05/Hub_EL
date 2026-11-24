import '../../domain/entities/search_user_entity.dart';

class SearchUserModel extends SearchUserEntity {
  const SearchUserModel({
    required super.id,
    required super.name,
    super.username,
    super.image,
    super.level,
    super.isOnline,
    super.friendshipStatus,
    super.isSender,
    super.friendshipId,
    super.isBlockedByMe,
    super.isBlockedByThem,
  });

  factory SearchUserModel.fromJson(Map<String, dynamic> json) {
    final statusStr = json['friendshipStatus']?.toString().toUpperCase();
    FriendshipStatus status = FriendshipStatus.none;
    if (statusStr == 'PENDING') {
      status = FriendshipStatus.pending;
    } else if (statusStr == 'ACCEPTED') {
      status = FriendshipStatus.accepted;
    } else if (statusStr == 'BLOCKED') {
      status = FriendshipStatus.blocked;
    }

    return SearchUserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Người dùng',
      username: json['username']?.toString(),
      image: json['image']?.toString() ?? json['displayAvatar']?.toString(),
      level: (json['level'] is num) ? (json['level'] as num).toInt() : 1,
      isOnline: json['isOnline'] == true,
      friendshipStatus: status,
      isSender: json['isSender'] == true,
      friendshipId: (json['friendshipId'] is num) ? (json['friendshipId'] as num).toInt() : null,
      isBlockedByMe: json['isBlockedByMe'] == true,
      isBlockedByThem: json['isBlockedByThem'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'image': image,
      'level': level,
      'isOnline': isOnline,
      'friendshipStatus': friendshipStatus.name.toUpperCase(),
      'isSender': isSender,
      'friendshipId': friendshipId,
      'isBlockedByMe': isBlockedByMe,
      'isBlockedByThem': isBlockedByThem,
    };
  }
}

