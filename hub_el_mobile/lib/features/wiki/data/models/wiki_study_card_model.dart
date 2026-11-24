import '../../domain/entities/wiki_study_card_entity.dart';

class WikiStudyCardModel extends WikiStudyCardEntity {
  const WikiStudyCardModel({
    required super.cardId,
    required super.title,
    required super.rarity,
    super.imageUrl,
    super.wikiUrl,
    required super.totalStars,
    required super.awakenedStars,
    required super.currentStar,
    required super.isCompleted,
    super.acquiredAt,
    required super.aiTokens,
    required super.maxEnergy,
    required super.freeCoins,
    required super.isPro,
    required super.level,
    required super.xp,
    required super.targetLanguage,
    required super.languageLevel,
    required super.energyCost,
  });

  factory WikiStudyCardModel.fromJson(Map<String, dynamic> json) {
    final cardJson = json['card'] as Map<String, dynamic>? ?? {};
    final invJson = json['inventory'] as Map<String, dynamic>? ?? {};
    final userJson = json['user'] as Map<String, dynamic>? ?? {};

    DateTime? parsedAcquiredAt;
    if (invJson['acquiredAt'] != null) {
      try {
        parsedAcquiredAt = DateTime.parse(invJson['acquiredAt'].toString());
      } catch (_) {}
    }

    return WikiStudyCardModel(
      cardId: cardJson['id'] is int ? cardJson['id'] : int.tryParse(cardJson['id'].toString()) ?? 0,
      title: cardJson['title']?.toString() ?? 'Thẻ Bài Wiki',
      rarity: cardJson['rarity']?.toString() ?? 'N',
      imageUrl: cardJson['imageUrl']?.toString(),
      wikiUrl: cardJson['wikiUrl']?.toString(),
      totalStars: cardJson['totalStars'] is int ? cardJson['totalStars'] : int.tryParse(cardJson['totalStars'].toString()) ?? 1,
      awakenedStars: cardJson['awakenedStars'] is int ? cardJson['awakenedStars'] : int.tryParse(cardJson['awakenedStars'].toString()) ?? 0,
      currentStar: invJson['currentStar'] is int ? invJson['currentStar'] : int.tryParse(invJson['currentStar'].toString()) ?? 0,
      isCompleted: invJson['isCompleted'] == true,
      acquiredAt: parsedAcquiredAt,
      aiTokens: userJson['aiTokens'] is int ? userJson['aiTokens'] : int.tryParse(userJson['aiTokens'].toString()) ?? 0,
      maxEnergy: userJson['maxEnergy'] is int ? userJson['maxEnergy'] : int.tryParse(userJson['maxEnergy'].toString()) ?? 50,
      freeCoins: userJson['freeCoins'] is int ? userJson['freeCoins'] : int.tryParse(userJson['freeCoins'].toString()) ?? 0,
      isPro: userJson['isPro'] == true,
      level: userJson['level'] is int ? userJson['level'] : int.tryParse(userJson['level'].toString()) ?? 1,
      xp: userJson['xp'] is int ? userJson['xp'] : int.tryParse(userJson['xp'].toString()) ?? 0,
      targetLanguage: userJson['targetLanguage']?.toString() ?? 'Tiếng Anh',
      languageLevel: userJson['languageLevel']?.toString() ?? 'A2',
      energyCost: userJson['energyCost'] is int ? userJson['energyCost'] : (userJson['isPro'] == true ? 7 : 10),
    );
  }
}

