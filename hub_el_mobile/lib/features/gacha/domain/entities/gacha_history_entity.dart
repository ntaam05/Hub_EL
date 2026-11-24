import 'package:equatable/equatable.dart';

class GachaHistoryItemEntity extends Equatable {
  final int inventoryId;
  final int cardId;
  final String title;
  final String rarity;
  final String? imageUrl;
  final String? wikiUrl;
  final int currentStar;
  final DateTime? acquiredAt;

  const GachaHistoryItemEntity({
    required this.inventoryId,
    required this.cardId,
    required this.title,
    required this.rarity,
    this.imageUrl,
    this.wikiUrl,
    this.currentStar = 0,
    this.acquiredAt,
  });

  @override
  List<Object?> get props => [
        inventoryId,
        cardId,
        title,
        rarity,
        imageUrl,
        wikiUrl,
        currentStar,
        acquiredAt,
      ];
}

class GachaHistoryEntity extends Equatable {
  final List<GachaHistoryItemEntity> cards;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const GachaHistoryEntity({
    required this.cards,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  @override
  List<Object?> get props => [cards, total, page, limit, totalPages];
}

