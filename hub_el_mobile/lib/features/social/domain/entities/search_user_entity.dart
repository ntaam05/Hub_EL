import 'package:equatable/equatable.dart';

/// Trạng thái quan hệ bạn bè từ backend
enum FriendshipStatus {
  none,
  pending,
  accepted,
  blocked,
}

/// Đại diện cho một người dùng trong kết quả tìm kiếm bạn bè
class SearchUserEntity extends Equatable {
  final String id;
  final String name;
  final String? username;
  final String? image;
  final int level;
  final bool isOnline;
  final FriendshipStatus friendshipStatus;
  final bool isSender;
  final int? friendshipId;
  final bool isBlockedByMe;
  final bool isBlockedByThem;

  const SearchUserEntity({
    required this.id,
    required this.name,
    this.username,
    this.image,
    this.level = 1,
    this.isOnline = false,
    this.friendshipStatus = FriendshipStatus.none,
    this.isSender = false,
    this.friendshipId,
    this.isBlockedByMe = false,
    this.isBlockedByThem = false,
  });

  SearchUserEntity copyWith({
    String? id,
    String? name,
    String? username,
    String? image,
    int? level,
    bool? isOnline,
    FriendshipStatus? friendshipStatus,
    bool? isSender,
    int? friendshipId,
    bool? isBlockedByMe,
    bool? isBlockedByThem,
  }) {
    return SearchUserEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      image: image ?? this.image,
      level: level ?? this.level,
      isOnline: isOnline ?? this.isOnline,
      friendshipStatus: friendshipStatus ?? this.friendshipStatus,
      isSender: isSender ?? this.isSender,
      friendshipId: friendshipId ?? this.friendshipId,
      isBlockedByMe: isBlockedByMe ?? this.isBlockedByMe,
      isBlockedByThem: isBlockedByThem ?? this.isBlockedByThem,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        username,
        image,
        level,
        isOnline,
        friendshipStatus,
        isSender,
        friendshipId,
        isBlockedByMe,
        isBlockedByThem,
      ];
}

