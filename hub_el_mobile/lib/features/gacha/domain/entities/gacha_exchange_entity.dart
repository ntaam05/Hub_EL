import 'package:equatable/equatable.dart';

class GachaExchangeItemEntity extends Equatable {
  final int id;
  final String title;
  final String rarity;
  final String? imageUrl;
  final String? wikiUrl;
  final int awakenedStars;
  final int totalStars;
  final int stardustCost;

  const GachaExchangeItemEntity({
    required this.id,
    required this.title,
    required this.rarity,
    this.imageUrl,
    this.wikiUrl,
    this.awakenedStars = 0,
    this.totalStars = 1,
    required this.stardustCost,
  });

  @override
  List<Object?> get props => [
        id,
        title,
        rarity,
        imageUrl,
        wikiUrl,
        awakenedStars,
        totalStars,
        stardustCost,
      ];
}

class GachaExchangeEntity extends Equatable {
  final List<GachaExchangeItemEntity> cards;
  final int currentStardust;

  const GachaExchangeEntity({
    required this.cards,
    required this.currentStardust,
  });

  @override
  List<Object?> get props => [cards, currentStardust];
}

