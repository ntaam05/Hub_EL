import 'package:equatable/equatable.dart';

class GradedQuizEntity extends Equatable {
  final int index;
  final String type;
  final String question;
  final List<String> options;
  final String userAnswer;
  final List<String> correctAnswers;
  final bool isCorrect;
  final String explanation;

  const GradedQuizEntity({
    required this.index,
    required this.type,
    required this.question,
    required this.options,
    required this.userAnswer,
    required this.correctAnswers,
    required this.isCorrect,
    required this.explanation,
  });

  @override
  List<Object?> get props => [
        index,
        type,
        question,
        options,
        userAnswer,
        correctAnswers,
        isCorrect,
        explanation,
      ];
}

class WikiStudyResultEntity extends Equatable {
  final int attemptId;
  final int cardId;
  final int score;
  final int correctCount;
  final int totalQuizzes;
  final bool isPass;
  final int expGained;
  final int gainedCoins;
  final int newAwakenedStars;
  final int currentStar;
  final bool isLostStar;
  final bool leveledUp;
  final int newLevel;
  final int currentStreak;
  final List<GradedQuizEntity> quizzes;

  const WikiStudyResultEntity({
    required this.attemptId,
    required this.cardId,
    required this.score,
    required this.correctCount,
    required this.totalQuizzes,
    required this.isPass,
    required this.expGained,
    required this.gainedCoins,
    required this.newAwakenedStars,
    required this.currentStar,
    required this.isLostStar,
    required this.leveledUp,
    required this.newLevel,
    required this.currentStreak,
    required this.quizzes,
  });

  @override
  List<Object?> get props => [
        attemptId,
        cardId,
        score,
        correctCount,
        totalQuizzes,
        isPass,
        expGained,
        gainedCoins,
        newAwakenedStars,
        currentStar,
        isLostStar,
        leveledUp,
        newLevel,
        currentStreak,
        quizzes,
      ];
}

