import '../../domain/entities/friend_request_entity.dart';

class FriendRequestModel extends FriendRequestEntity {
  const FriendRequestModel({
    required super.id,
    required super.userId,
    required super.name,
    super.username,
    super.image,
    super.level,
    super.createdAt,
    required super.isIncoming,
  });

  factory FriendRequestModel.fromJson(Map<String, dynamic> json, {required bool isIncoming}) {
    final int id = (json['id'] is num) ? (json['id'] as num).toInt() : 0;
    final userMap = isIncoming
        ? (json['sender'] as Map<String, dynamic>?)
        : (json['receiver'] as Map<String, dynamic>?);

    final userId = userMap?['id']?.toString() ?? '';
    final name = userMap?['name']?.toString() ?? 'Người dùng';
    final username = userMap?['username']?.toString();
    final image = userMap?['image']?.toString() ?? userMap?['avatar']?.toString();
    final level = (userMap?['level'] is num) ? (userMap!['level'] as num).toInt() : 1;

    DateTime? createdAt;
    if (json['createdAt'] != null) {
      createdAt = DateTime.tryParse(json['createdAt'].toString());
    }

    return FriendRequestModel(
      id: id,
      userId: userId,
      name: name,
      username: username,
      image: image,
      level: level,
      createdAt: createdAt,
      isIncoming: isIncoming,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'username': username,
      'image': image,
      'level': level,
      'createdAt': createdAt?.toIso8601String(),
      'isIncoming': isIncoming,
    };
  }
}

