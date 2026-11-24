import 'package:equatable/equatable.dart';

class GachaCardEntity extends Equatable {
  final int id;
  final String title;
  final String rarity;
  final String? imageUrl;
  final String? wikiUrl;
  final int awakenedStars;
  final int totalStars;
  final bool isNew;
  final int stardustEarned;

  const GachaCardEntity({
    required this.id,
    required this.title,
    required this.rarity,
    this.imageUrl,
    this.wikiUrl,
    this.awakenedStars = 0,
    this.totalStars = 1,
    this.isNew = false,
    this.stardustEarned = 0,
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
        isNew,
        stardustEarned,
      ];
}

