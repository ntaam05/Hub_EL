import '../../domain/entities/quiz_question_entity.dart';

class QuizQuestionModel extends QuizQuestionEntity {
  const QuizQuestionModel({
    required super.questionText,
    required super.optionA,
    required super.optionB,
    required super.optionC,
    required super.optionD,
    required super.correctAnswer,
    required super.explanation,
  });

  factory QuizQuestionModel.fromJson(Map<String, dynamic> json) {
    return QuizQuestionModel(
      questionText: (json['questionText'] ?? json['question'] ?? '').toString(),
      optionA: (json['optionA'] ?? json['A'] ?? '').toString(),
      optionB: (json['optionB'] ?? json['B'] ?? '').toString(),
      optionC: (json['optionC'] ?? json['C'] ?? '').toString(),
      optionD: (json['optionD'] ?? json['D'] ?? '').toString(),
      correctAnswer: (json['correctAnswer'] ?? json['answer'] ?? 'A').toString().toUpperCase().trim(),
      explanation: (json['explanation'] ?? json['explain'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'questionText': questionText,
      'optionA': optionA,
      'optionB': optionB,
      'optionC': optionC,
      'optionD': optionD,
      'correctAnswer': correctAnswer,
      'explanation': explanation,
    };
  }
}

class QuizGeneratedModel extends QuizGeneratedEntity {
  const QuizGeneratedModel({
    required super.videoId,
    required super.questionCount,
    required super.questions,
  });

  factory QuizGeneratedModel.fromJson(Map<String, dynamic> json) {
    final rawQuestions = json['questions'] ?? json['data'] ?? [];
    final List<QuizQuestionModel> parsedQuestions = [];

    if (rawQuestions is List) {
      for (final item in rawQuestions) {
        if (item is Map<String, dynamic>) {
          parsedQuestions.add(QuizQuestionModel.fromJson(item));
        }
      }
    }

    return QuizGeneratedModel(
      videoId: (json['videoId'] ?? '').toString(),
      questionCount: json['questionCount'] is int ? json['questionCount'] as int : parsedQuestions.length,
      questions: parsedQuestions,
    );
  }
}

