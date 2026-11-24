import 'package:equatable/equatable.dart';

class WikiVocabularyEntity extends Equatable {
  final String word;
  final String pos;
  final String meaning;
  final String englishDesc;
  final String? language;

  const WikiVocabularyEntity({
    required this.word,
    required this.pos,
    required this.meaning,
    required this.englishDesc,
    this.language,
  });

  @override
  List<Object?> get props => [word, pos, meaning, englishDesc, language];
}

class WikiStudyQuestionEntity extends Equatable {
  final int index;
  final String type;
  final String? targetWord;
  final String question;
  final List<String> options;

  const WikiStudyQuestionEntity({
    required this.index,
    required this.type,
    this.targetWord,
    required this.question,
    required this.options,
  });

  @override
  List<Object?> get props => [index, type, targetWord, question, options];
}

class WikiStudySessionEntity extends Equatable {
  final String sessionId;
  final String sessionToken;
  final int cardId;
  final String cardTitle;
  final String cardRarity;
  final int totalStars;
  final int awakenedStars;
  final int timeLimit;
  final String simplifiedText;
  final List<WikiVocabularyEntity> vocabularies;
  final List<WikiStudyQuestionEntity> quizzes;
  final int aiEnergySpent;
  final int remainingEnergy;

  const WikiStudySessionEntity({
    required this.sessionId,
    required this.sessionToken,
    required this.cardId,
    required this.cardTitle,
    required this.cardRarity,
    required this.totalStars,
    required this.awakenedStars,
    required this.timeLimit,
    required this.simplifiedText,
    required this.vocabularies,
    required this.quizzes,
    required this.aiEnergySpent,
    required this.remainingEnergy,
  });

  @override
  List<Object?> get props => [
        sessionId,
        sessionToken,
        cardId,
        cardTitle,
        cardRarity,
        totalStars,
        awakenedStars,
        timeLimit,
        simplifiedText,
        vocabularies,
        quizzes,
        aiEnergySpent,
        remainingEnergy,
      ];
}

