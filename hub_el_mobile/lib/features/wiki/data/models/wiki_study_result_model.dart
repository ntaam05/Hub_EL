import '../../domain/entities/wiki_study_result_entity.dart';

class GradedQuizModel extends GradedQuizEntity {
  const GradedQuizModel({
    required super.index,
    required super.type,
    required super.question,
    required super.options,
    required super.userAnswer,
    required super.correctAnswers,
    required super.isCorrect,
    required super.explanation,
  });

  factory GradedQuizModel.fromJson(Map<String, dynamic> json, int defaultIndex) {
    List<String> parsedOptions = [];
    if (json['options'] is List) {
      parsedOptions = (json['options'] as List).map((o) => o?.toString() ?? '').toList();
    }

    List<String> parsedCorrect = [];
    if (json['correctAnswers'] is List) {
      parsedCorrect = (json['correctAnswers'] as List).map((c) => c?.toString() ?? '').toList();
    }

    return GradedQuizModel(
      index: json['index'] is int ? json['index'] : defaultIndex,
      type: json['type']?.toString() ?? 'multiple_choice',
      question: json['question']?.toString() ?? '',
      options: parsedOptions,
      userAnswer: json['userAnswer']?.toString() ?? '',
      correctAnswers: parsedCorrect,
      isCorrect: json['isCorrect'] == true,
      explanation: json['explanation']?.toString() ?? '',
    );
  }
}

class WikiStudyResultModel extends WikiStudyResultEntity {
  const WikiStudyResultModel({
    required super.attemptId,
    required super.cardId,
    required super.score,
    required super.correctCount,
    required super.totalQuizzes,
    required super.isPass,
    required super.expGained,
    required super.gainedCoins,
    required super.newAwakenedStars,
    required super.currentStar,
    required super.isLostStar,
    required super.leveledUp,
    required super.newLevel,
    required super.currentStreak,
    required super.quizzes,
  });

  factory WikiStudyResultModel.fromJson(Map<String, dynamic> json) {
    List<GradedQuizModel> gradedList = [];
    if (json['quizzes'] is List) {
      final list = json['quizzes'] as List;
      for (int i = 0; i < list.length; i++) {
        if (list[i] is Map<String, dynamic>) {
          gradedList.add(GradedQuizModel.fromJson(list[i] as Map<String, dynamic>, i));
        }
      }
    }

    return WikiStudyResultModel(
      attemptId: json['attemptId'] is int ? json['attemptId'] : int.tryParse(json['attemptId'].toString()) ?? 0,
      cardId: json['cardId'] is int ? json['cardId'] : int.tryParse(json['cardId'].toString()) ?? 0,
      score: json['score'] is int ? json['score'] : int.tryParse(json['score'].toString()) ?? 0,
      correctCount: json['correctCount'] is int ? json['correctCount'] : int.tryParse(json['correctCount'].toString()) ?? 0,
      totalQuizzes: json['totalQuizzes'] is int ? json['totalQuizzes'] : int.tryParse(json['totalQuizzes'].toString()) ?? 0,
      isPass: json['isPass'] == true,
      expGained: json['expGained'] is int ? json['expGained'] : int.tryParse(json['expGained'].toString()) ?? 0,
      gainedCoins: json['gainedCoins'] is int ? json['gainedCoins'] : int.tryParse(json['gainedCoins'].toString()) ?? 0,
      newAwakenedStars: json['newAwakenedStars'] is int ? json['newAwakenedStars'] : int.tryParse(json['newAwakenedStars'].toString()) ?? 0,
      currentStar: json['currentStar'] is int ? json['currentStar'] : int.tryParse(json['currentStar'].toString()) ?? 0,
      isLostStar: json['isLostStar'] == true,
      leveledUp: json['leveledUp'] == true,
      newLevel: json['newLevel'] is int ? json['newLevel'] : int.tryParse(json['newLevel'].toString()) ?? 1,
      currentStreak: json['currentStreak'] is int ? json['currentStreak'] : int.tryParse(json['currentStreak'].toString()) ?? 0,
      quizzes: gradedList,
    );
  }
}

