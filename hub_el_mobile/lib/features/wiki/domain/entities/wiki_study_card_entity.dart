import 'package:equatable/equatable.dart';

class WikiStudyCardEntity extends Equatable {
  final int cardId;
  final String title;
  final String rarity;
  final String? imageUrl;
  final String? wikiUrl;
  final int totalStars;
  final int awakenedStars;

  final int currentStar;
  final bool isCompleted;
  final DateTime? acquiredAt;

  final int aiTokens;
  final int maxEnergy;
  final int freeCoins;
  final bool isPro;
  final int level;
  final int xp;
  final String targetLanguage;
  final String languageLevel;
  final int energyCost;

  const WikiStudyCardEntity({
    required this.cardId,
    required this.title,
    required this.rarity,
    this.imageUrl,
    this.wikiUrl,
    required this.totalStars,
    required this.awakenedStars,
    required this.currentStar,
    required this.isCompleted,
    this.acquiredAt,
    required this.aiTokens,
    required this.maxEnergy,
    required this.freeCoins,
    required this.isPro,
    required this.level,
    required this.xp,
    required this.targetLanguage,
    required this.languageLevel,
    required this.energyCost,
  });

  @override
  List<Object?> get props => [
        cardId,
        title,
        rarity,
        imageUrl,
        wikiUrl,
        totalStars,
        awakenedStars,
        currentStar,
        isCompleted,
        acquiredAt,
        aiTokens,
        maxEnergy,
        freeCoins,
        isPro,
        level,
        xp,
        targetLanguage,
        languageLevel,
        energyCost,
      ];
}

