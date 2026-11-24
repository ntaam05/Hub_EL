import 'package:equatable/equatable.dart';

/// Đại diện cho một lời mời kết bạn (nhận được hoặc đã gửi)
class FriendRequestEntity extends Equatable {
  final int id;
  final String userId;
  final String name;
  final String? username;
  final String? image;
  final int level;
  final DateTime? createdAt;
  final bool isIncoming;

  const FriendRequestEntity({
    required this.id,
    required this.userId,
    required this.name,
    this.username,
    this.image,
    this.level = 1,
    this.createdAt,
    required this.isIncoming,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        name,
        username,
        image,
        level,
        createdAt,
        isIncoming,
      ];
}

