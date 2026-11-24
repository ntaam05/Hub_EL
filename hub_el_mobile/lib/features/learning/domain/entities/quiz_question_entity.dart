class QuizQuestionEntity {
  final String questionText;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String correctAnswer;
  final String explanation;

  const QuizQuestionEntity({
    required this.questionText,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.correctAnswer,
    required this.explanation,
  });

  String getOption(String opt) {
    switch (opt.toUpperCase()) {
      case 'A':
        return optionA;
      case 'B':
        return optionB;
      case 'C':
        return optionC;
      case 'D':
        return optionD;
      default:
        return '';
    }
  }
}

class QuizGeneratedEntity {
  final String videoId;
  final int questionCount;
  final List<QuizQuestionEntity> questions;

  const QuizGeneratedEntity({
    required this.videoId,
    required this.questionCount,
    required this.questions,
  });
}

