import '../../domain/entities/gacha_card_entity.dart';

class GachaCardModel extends GachaCardEntity {
  const GachaCardModel({
    required super.id,
    required super.title,
    required super.rarity,
    super.imageUrl,
    super.wikiUrl,
    super.awakenedStars,
    super.totalStars,
    super.isNew,
    super.stardustEarned,
  });

  factory GachaCardModel.fromJson(Map<String, dynamic> json) {
    return GachaCardModel(
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
      isNew: json['isNew'] == true || json['isNewCard'] == true,
      stardustEarned: json['stardustEarned'] is int
          ? json['stardustEarned'] as int
          : int.tryParse(json['stardustEarned']?.toString() ?? '0') ?? 0,
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
      'isNew': isNew,
      'stardustEarned': stardustEarned,
    };
  }
}

