import '../../domain/entities/gacha_exchange_entity.dart';

class GachaExchangeItemModel extends GachaExchangeItemEntity {
  const GachaExchangeItemModel({
    required super.id,
    required super.title,
    required super.rarity,
    super.imageUrl,
    super.wikiUrl,
    super.awakenedStars,
    super.totalStars,
    required super.stardustCost,
  });

  factory GachaExchangeItemModel.fromJson(Map<String, dynamic> json) {
    final cost = json['stardustCost'] ?? json['cost'] ?? 10;
    int parseCost(dynamic val) {
      if (val is int) return val;
      return int.tryParse(val?.toString() ?? '10') ?? 10;
    }

    return GachaExchangeItemModel(
      id: json['id'] is int
          ? json['id'] as int
          : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      title: json['title']?.toString() ?? '',
      rarity: json['rarity']?.toString().toUpperCase() ?? 'N',
      imageUrl: json['imageUrl']?.toString(),
      wikiUrl: json['wikiUrl']?.toString(),
      awakenedStars: json['awakenedStars'] is int
          ? json['awakenedStars'] as int
          : int.tryParse(json['awakenedStars']?.toString() ?? '0') ?? 0,
      totalStars: json['totalStars'] is int
          ? json['totalStars'] as int
          : int.tryParse(json['totalStars']?.toString() ?? '1') ?? 1,
      stardustCost: parseCost(cost),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'rarity': rarity,
      'imageUrl': imageUrl,
      'wikiUrl': wikiUrl,
      'awakenedStars': awakenedStars,
      'totalStars': totalStars,
      'stardustCost': stardustCost,
    };
  }
}

class GachaExchangeModel extends GachaExchangeEntity {
  const GachaExchangeModel({
    required super.cards,
    required super.currentStardust,
  });

  factory GachaExchangeModel.fromJson(Map<String, dynamic> json) {
    final rawCards = (json['unownedCards'] ?? json['cards']) as List<dynamic>? ?? [];
    final parsedCards = rawCards
        .whereType<Map<String, dynamic>>()
        .map((c) => GachaExchangeItemModel.fromJson(c))
        .toList();

    final dust = json['stardust'] ?? json['currentStardust'] ?? 0;
    int parseDust(dynamic val) {
      if (val is int) return val;
      return int.tryParse(val?.toString() ?? '0') ?? 0;
    }

    return GachaExchangeModel(
      cards: parsedCards,
      currentStardust: parseDust(dust),
    );
  }
}
