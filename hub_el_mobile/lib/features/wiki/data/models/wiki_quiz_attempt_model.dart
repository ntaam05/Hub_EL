import 'dart:convert';
import '../../domain/entities/wiki_quiz_attempt_entity.dart';

class QuizQuestionModel extends QuizQuestion {
  const QuizQuestionModel({
    required super.type,
    required super.question,
    required super.options,
    required super.correctAnswers,
    required super.explanation,
  });

  factory QuizQuestionModel.fromJson(Map<String, dynamic> json) {
    List<String> options = [];
    if (json['options'] is List) {
      options = (json['options'] as List).map((e) => e.toString()).toList();
    }

    List<String> correctAnswers = [];
    if (json['correctAnswers'] is List) {
      correctAnswers = (json['correctAnswers'] as List).map((e) => e.toString()).toList();
    } else if (json['correctAnswer'] != null) {
      correctAnswers = [json['correctAnswer'].toString()];
    }

    return QuizQuestionModel(
      type: json['type'] as String? ?? 'multiple_choice',
      question: json['question'] as String? ?? '',
      options: options,
      correctAnswers: correctAnswers,
      explanation: json['explanation'] as String? ?? '',
    );
  }
}

class WikiQuizAttemptModel extends WikiQuizAttemptEntity {
  const WikiQuizAttemptModel({
    required super.id,
    required super.userId,
    required super.cardId,
    required super.score,
    required super.correctCount,
    required super.totalQuizzes,
    required super.createdAt,
    super.userAnswers,
    super.simplifiedText,
    super.quizzes,
  });

  factory WikiQuizAttemptModel.fromJson(Map<String, dynamic> json) {
    // Parse user answers
    List<String> parsedUserAnswers = [];
    if (json['userAnswers'] != null) {
      if (json['userAnswers'] is List) {
        parsedUserAnswers = (json['userAnswers'] as List).map((e) => e.toString()).toList();
      } else if (json['userAnswers'] is String) {
        try {
          final decoded = jsonDecode(json['userAnswers'] as String);
          if (decoded is List) {
            parsedUserAnswers = decoded.map((e) => e.toString()).toList();
          }
        } catch (_) {}
      }
    }

    // Parse lesson snapshot
    String? simplifiedText;
    List<QuizQuestionModel> parsedQuizzes = [];
    if (json['lessonSnapshot'] != null) {
      Map<String, dynamic>? snapMap;
      if (json['lessonSnapshot'] is Map<String, dynamic>) {
        snapMap = json['lessonSnapshot'] as Map<String, dynamic>;
      } else if (json['lessonSnapshot'] is String) {
        try {
          final decoded = jsonDecode(json['lessonSnapshot'] as String);
          if (decoded is Map<String, dynamic>) {
            snapMap = decoded;
          }
        } catch (_) {}
      }

      if (snapMap != null) {
        simplifiedText = snapMap['simplifiedText'] as String?;
        if (snapMap['quizzes'] is List) {
          parsedQuizzes = (snapMap['quizzes'] as List)
              .whereType<Map<String, dynamic>>()
              .map((q) => QuizQuestionModel.fromJson(q))
              .toList();
        }
      }
    }

    return WikiQuizAttemptModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      userId: json['userId'] as String? ?? '',
      cardId: (json['cardId'] as num?)?.toInt() ?? 0,
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      correctCount: (json['correctCount'] as num?)?.toInt() ?? 0,
      totalQuizzes: (json['totalQuizzes'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      userAnswers: parsedUserAnswers,
      simplifiedText: simplifiedText,
      quizzes: parsedQuizzes,
    );
  }
}

