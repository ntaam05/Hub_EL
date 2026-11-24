import '../../domain/entities/friend_user_entity.dart';

class FriendUserModel extends FriendUserEntity {
  const FriendUserModel({
    required super.id,
    required super.name,
    super.username,
    super.image,
    super.isOnline,
    super.level,
    super.streak,
    super.friendshipId,
  });

  factory FriendUserModel.fromJson(Map<String, dynamic> json) {
    return FriendUserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Người dùng',
      username: json['username']?.toString(),
      image: json['image']?.toString(),
      isOnline: json['isOnline'] == true,
      level: (json['level'] is num) ? (json['level'] as num).toInt() : 1,
      streak: (json['streak'] is num) ? (json['streak'] as num).toInt() : 0,
      friendshipId: (json['friendshipId'] is num) ? (json['friendshipId'] as num).toInt() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'image': image,
      'isOnline': isOnline,
      'level': level,
      'streak': streak,
      'friendshipId': friendshipId,
    };
  }
}

