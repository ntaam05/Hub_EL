import '../../domain/entities/wiki_study_session_entity.dart';

class WikiVocabularyModel extends WikiVocabularyEntity {
  const WikiVocabularyModel({
    required super.word,
    required super.pos,
    required super.meaning,
    required super.englishDesc,
    super.language,
  });

  factory WikiVocabularyModel.fromJson(Map<String, dynamic> json) {
    return WikiVocabularyModel(
      word: json['word']?.toString() ?? '',
      pos: json['pos']?.toString() ?? 'N',
      meaning: json['meaning']?.toString() ?? '',
      englishDesc: json['englishDesc']?.toString() ?? '',
      language: json['language']?.toString(),
    );
  }
}

class WikiStudyQuestionModel extends WikiStudyQuestionEntity {
  const WikiStudyQuestionModel({
    required super.index,
    required super.type,
    super.targetWord,
    required super.question,
    required super.options,
  });

  factory WikiStudyQuestionModel.fromJson(Map<String, dynamic> json, int defaultIndex) {
    List<String> parsedOptions = [];
    if (json['options'] is List) {
      parsedOptions = (json['options'] as List).map((o) => o?.toString() ?? '').toList();
    }

    return WikiStudyQuestionModel(
      index: json['index'] is int ? json['index'] : defaultIndex,
      type: json['type']?.toString() ?? 'multiple_choice',
      targetWord: json['targetWord']?.toString(),
      question: json['question']?.toString() ?? '',
      options: parsedOptions,
    );
  }
}

class WikiStudySessionModel extends WikiStudySessionEntity {
  const WikiStudySessionModel({
    required super.sessionId,
    required super.sessionToken,
    required super.cardId,
    required super.cardTitle,
    required super.cardRarity,
    required super.totalStars,
    required super.awakenedStars,
    required super.timeLimit,
    required super.simplifiedText,
    required super.vocabularies,
    required super.quizzes,
    required super.aiEnergySpent,
    required super.remainingEnergy,
  });

  factory WikiStudySessionModel.fromJson(Map<String, dynamic> json) {
    final cardJson = json['card'] as Map<String, dynamic>? ?? {};

    List<WikiVocabularyModel> vocabs = [];
    if (json['vocabularies'] is List) {
      vocabs = (json['vocabularies'] as List)
          .whereType<Map<String, dynamic>>()
          .map((v) => WikiVocabularyModel.fromJson(v))
          .toList();
    }

    List<WikiStudyQuestionModel> questionList = [];
    if (json['quizzes'] is List) {
      final list = json['quizzes'] as List;
      for (int i = 0; i < list.length; i++) {
        if (list[i] is Map<String, dynamic>) {
          questionList.add(WikiStudyQuestionModel.fromJson(list[i] as Map<String, dynamic>, i));
        }
      }
    }

    return WikiStudySessionModel(
      sessionId: json['sessionId']?.toString() ?? '',
      sessionToken: json['sessionToken']?.toString() ?? '',
      cardId: cardJson['id'] is int ? cardJson['id'] : int.tryParse(cardJson['id'].toString()) ?? 0,
      cardTitle: cardJson['title']?.toString() ?? '',
      cardRarity: cardJson['rarity']?.toString() ?? 'N',
      totalStars: cardJson['totalStars'] is int ? cardJson['totalStars'] : int.tryParse(cardJson['totalStars'].toString()) ?? 1,
      awakenedStars: cardJson['awakenedStars'] is int ? cardJson['awakenedStars'] : int.tryParse(cardJson['awakenedStars'].toString()) ?? 0,
      timeLimit: json['timeLimit'] is int ? json['timeLimit'] : int.tryParse(json['timeLimit'].toString()) ?? 0,
      simplifiedText: json['simplifiedText']?.toString() ?? '',
      vocabularies: vocabs,
      quizzes: questionList,
      aiEnergySpent: json['aiEnergySpent'] is int ? json['aiEnergySpent'] : int.tryParse(json['aiEnergySpent'].toString()) ?? 10,
      remainingEnergy: json['remainingEnergy'] is int ? json['remainingEnergy'] : int.tryParse(json['remainingEnergy'].toString()) ?? 0,
    );
  }
}

