import '../../../../core/network/api_result.dart';
import '../entities/quiz_result_entity.dart';
import '../repositories/learning_repository.dart';

class SubmitQuizUseCase {
  final ILearningRepository repository;

  SubmitQuizUseCase(this.repository);

  Future<ApiResult<QuizResultEntity>> call({
    required String videoId,
    String? videoTitle,
    String? channelName,
    required int score,
    required int correctCount,
    required int totalQuizzes,
    dynamic questionsData,
  }) {
    return repository.submitQuiz(
      videoId: videoId,
      videoTitle: videoTitle,
      channelName: channelName,
      score: score,
      correctCount: correctCount,
      totalQuizzes: totalQuizzes,
      questionsData: questionsData,
    );
  }
}

