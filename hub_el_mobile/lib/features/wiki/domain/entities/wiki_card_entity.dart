import 'package:equatable/equatable.dart';
import 'wiki_quiz_attempt_entity.dart';

class WikiCardEntity extends Equatable {
  final int id;
  final String? wikiUrl;
  final String title;
  final String rarity;
  final String? imageUrl;
  final String aiContent;
  final int totalStars;
  final int awakenedStars;
  final String? contentText;
  final List<WikiQuizAttemptEntity> attempts;

  const WikiCardEntity({
    required this.id,
    this.wikiUrl,
    required this.title,
    this.rarity = 'N',
    this.imageUrl,
    this.aiContent = '',
    this.totalStars = 1,
    this.awakenedStars = 0,
    this.contentText,
    this.attempts = const [],
  });

  bool get isStudied => attempts.isNotEmpty;

  int get rarityWeight {
    switch (rarity.toUpperCase()) {
      case 'MR':
        return 7;
      case 'LR':
        return 6;
      case 'UR':
        return 5;
      case 'SSR':
        return 4;
      case 'SR':
        return 3;
      case 'R':
        return 2;
      case 'N':
      default:
        return 1;
    }
  }

  String get effectiveWikiUrl {
    if (wikiUrl != null && wikiUrl!.trim().isNotEmpty) {
      return wikiUrl!;
    }
    return 'https://vi.wikipedia.org/wiki/${Uri.encodeComponent(title)}';
  }

  @override
  List<Object?> get props => [
        id,
        wikiUrl,
        title,
        rarity,
        imageUrl,
        aiContent,
        totalStars,
        awakenedStars,
        contentText,
        attempts,
      ];
}

