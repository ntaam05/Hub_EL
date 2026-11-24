import 'package:equatable/equatable.dart';

/// Đại diện cho một người bạn trong danh sách bạn bè
class FriendUserEntity extends Equatable {
  final String id;
  final String name;
  final String? username;
  final String? image;
  final bool isOnline;
  final int level;
  final int streak;
  final int? friendshipId;

  const FriendUserEntity({
    required this.id,
    required this.name,
    this.username,
    this.image,
    this.isOnline = false,
    this.level = 1,
    this.streak = 0,
    this.friendshipId,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        username,
        image,
        isOnline,
        level,
        streak,
        friendshipId,
      ];
}

