import 'package:equatable/equatable.dart';

/// Đại diện cho một người dùng trong danh sách đã bị chặn
class BlockedUserEntity extends Equatable {
  final String id;
  final String name;
  final String? username;
  final String? image;

  const BlockedUserEntity({
    required this.id,
    required this.name,
    this.username,
    this.image,
  });

  @override
  List<Object?> get props => [id, name, username, image];
}

