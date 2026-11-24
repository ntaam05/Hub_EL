import 'package:equatable/equatable.dart';

class QuizQuestion extends Equatable {
  final String type;
  final String question;
  final List<String> options;
  final List<String> correctAnswers;
  final String explanation;

  const QuizQuestion({
    required this.type,
    required this.question,
    required this.options,
    required this.correctAnswers,
    required this.explanation,
  });

  @override
  List<Object?> get props => [type, question, options, correctAnswers, explanation];
}

class WikiQuizAttemptEntity extends Equatable {
  final int id;
  final String userId;
  final int cardId;
  final double score;
  final int correctCount;
  final int totalQuizzes;
  final DateTime createdAt;
  final List<String> userAnswers;
  final String? simplifiedText;
  final List<QuizQuestion> quizzes;

  const WikiQuizAttemptEntity({
    required this.id,
    this.userId = '',
    required this.cardId,
    required this.score,
    required this.correctCount,
    required this.totalQuizzes,
    required this.createdAt,
    this.userAnswers = const [],
    this.simplifiedText,
    this.quizzes = const [],
  });

  bool get isPass => correctCount >= (totalQuizzes / 2).ceil();

  @override
  List<Object?> get props => [
        id,
        userId,
        cardId,
        score,
        correctCount,
        totalQuizzes,
        createdAt,
        userAnswers,
        simplifiedText,
        quizzes,
      ];
}

