class QuizResultEntity {
  final int score;
  final int correctCount;
  final int totalQuizzes;
  final int earnedXP;
  final int earnedCoins;

  const QuizResultEntity({
    required this.score,
    required this.correctCount,
    required this.totalQuizzes,
    required this.earnedXP,
    required this.earnedCoins,
  });

  double get percentage =>
      totalQuizzes > 0 ? (correctCount / totalQuizzes) * 100.0 : 0.0;

  bool get isPassed => percentage >= 50.0;
}

