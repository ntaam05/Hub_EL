import 'package:equatable/equatable.dart';

/// Thẻ Wiki mà người dùng sở hữu trong kho đồ (dùng để tặng quà trong khung chat)
class OwnedWikiCardEntity extends Equatable {
  final int id;
  final String title;
  final String rarity;
  final String? imageUrl;

  const OwnedWikiCardEntity({
    required this.id,
    required this.title,
    required this.rarity,
    this.imageUrl,
  });

  @override
  List<Object?> get props => [id, title, rarity, imageUrl];
}

