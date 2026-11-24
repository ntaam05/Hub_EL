import '../../domain/entities/gacha_history_entity.dart';

class GachaHistoryItemModel extends GachaHistoryItemEntity {
  const GachaHistoryItemModel({
    required super.inventoryId,
    required super.cardId,
    required super.title,
    required super.rarity,
    super.imageUrl,
    super.wikiUrl,
    super.currentStar,
    super.acquiredAt,
  });

  factory GachaHistoryItemModel.fromJson(Map<String, dynamic> json) {
    String cardTitle = json['title']?.toString() ?? '';
    String cardRarity = json['rarity']?.toString().toUpperCase() ?? 'N';
    String? cardImg = json['imageUrl']?.toString();
    String? cardWiki = json['wikiUrl']?.toString();

    if (json.containsKey('card') && json['card'] is Map<String, dynamic>) {
      final cardObj = json['card'] as Map<String, dynamic>;
      cardTitle = cardObj['title']?.toString() ?? cardTitle;
      cardRarity = cardObj['rarity']?.toString().toUpperCase() ?? cardRarity;
      cardImg = cardObj['imageUrl']?.toString() ?? cardImg;
      cardWiki = cardObj['wikiUrl']?.toString() ?? cardWiki;
    }

    final invId = json['inventoryId'] ?? json['id'] ?? 0;
    int parseInt(dynamic val) {
      if (val is int) return val;
      return int.tryParse(val?.toString() ?? '0') ?? 0;
    }

    return GachaHistoryItemModel(
      inventoryId: parseInt(invId),
      cardId: parseInt(json['cardId']),
      title: cardTitle,
      rarity: cardRarity,
      imageUrl: cardImg,
      wikiUrl: cardWiki,
      currentStar: parseInt(json['currentStar']),
      acquiredAt: json['acquiredAt'] != null
          ? DateTime.tryParse(json['acquiredAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'inventoryId': inventoryId,
      'cardId': cardId,
      'title': title,
      'rarity': rarity,
      'imageUrl': imageUrl,
      'wikiUrl': wikiUrl,
      'currentStar': currentStar,
      'acquiredAt': acquiredAt?.toIso8601String(),
    };
  }
}

class GachaHistoryModel extends GachaHistoryEntity {
  const GachaHistoryModel({
    required super.cards,
    required super.total,
    required super.page,
    required super.limit,
    required super.totalPages,
  });

  factory GachaHistoryModel.fromJson(Map<String, dynamic> json) {
    final rawCards = (json['items'] ?? json['cards']) as List<dynamic>? ?? [];
    final parsedCards = rawCards
        .whereType<Map<String, dynamic>>()
        .map((c) => GachaHistoryItemModel.fromJson(c))
        .toList();

    final pagination = json['pagination'] as Map<String, dynamic>? ?? {};

    int parseInt(dynamic val, int defaultVal) {
      if (val is int) return val;
      return int.tryParse(val?.toString() ?? defaultVal.toString()) ?? defaultVal;
    }

    return GachaHistoryModel(
      cards: parsedCards,
      total: parseInt(pagination['total'], parsedCards.length),
      page: parseInt(pagination['page'], 1),
      limit: parseInt(pagination['limit'], 10),
      totalPages: parseInt(pagination['totalPages'], 1),
    );
  }
}
