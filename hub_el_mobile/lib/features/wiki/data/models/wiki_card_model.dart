import '../../domain/entities/wiki_card_entity.dart';
import 'wiki_quiz_attempt_model.dart';

class WikiCardModel extends WikiCardEntity {
  const WikiCardModel({
    required super.id,
    super.wikiUrl,
    required super.title,
    super.rarity,
    super.imageUrl,
    super.aiContent,
    super.totalStars,
    super.awakenedStars,
    super.contentText,
    super.attempts,
  });

  factory WikiCardModel.fromJson(Map<String, dynamic> json) {
    List<WikiQuizAttemptModel> parsedAttempts = [];
    if (json['attempts'] is List) {
      parsedAttempts = (json['attempts'] as List)
          .whereType<Map<String, dynamic>>()
          .map((a) => WikiQuizAttemptModel.fromJson(a))
          .toList();
    }

    return WikiCardModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      wikiUrl: json['wikiUrl'] as String?,
      title: json['title'] as String? ?? '',
      rarity: json['rarity'] as String? ?? 'N',
      imageUrl: json['imageUrl'] as String?,
      aiContent: json['aiContent'] as String? ?? '',
      totalStars: (json['totalStars'] as num?)?.toInt() ?? 1,
      awakenedStars: (json['awakenedStars'] as num?)?.toInt() ?? 0,
      contentText: json['contentText'] as String?,
      attempts: parsedAttempts,
    );
  }
}

