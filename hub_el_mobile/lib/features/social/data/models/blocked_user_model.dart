import '../../domain/entities/blocked_user_entity.dart';

class BlockedUserModel extends BlockedUserEntity {
  const BlockedUserModel({
    required super.id,
    required super.name,
    super.username,
    super.image,
  });

  factory BlockedUserModel.fromJson(Map<String, dynamic> json) {
    return BlockedUserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Người dùng',
      username: json['username']?.toString(),
      image: json['image']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'image': image,
    };
  }
}

