import '../../domain/entities/owned_wiki_card_entity.dart';

class OwnedWikiCardModel extends OwnedWikiCardEntity {
  const OwnedWikiCardModel({
    required super.id,
    required super.title,
    required super.rarity,
    super.imageUrl,
  });

  factory OwnedWikiCardModel.fromJson(Map<String, dynamic> json) {
    return OwnedWikiCardModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      title: (json['title'] ?? 'Thẻ Wiki').toString(),
      rarity: (json['rarity'] ?? 'N').toString(),
      imageUrl: json['imageUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'rarity': rarity,
      'imageUrl': imageUrl,
    };
  }
}

