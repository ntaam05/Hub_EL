import '../../../../core/network/api_result.dart';
import '../entities/quiz_question_entity.dart';
import '../repositories/learning_repository.dart';

class GenerateQuizUseCase {
  final ILearningRepository repository;

  GenerateQuizUseCase(this.repository);

  Future<ApiResult<QuizGeneratedEntity>> call({
    required String videoId,
    int count = 5,
  }) {
    return repository.generateQuiz(videoId: videoId, count: count);
  }
}

