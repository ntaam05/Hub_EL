import '../../../../core/network/api_result.dart';
import '../entities/quiz_question_entity.dart';
import '../repositories/learning_repository.dart';

class GenerateQuizUseCase {
  final ILearningRepository repository;

  GenerateQuizUseCase(this.repository);

  Future<ApiResult<QuizGeneratedEntity>> call({
    required String videoId,
    int count = 5,
    String? mode,
  }) {
    return repository.generateQuiz(videoId: videoId, count: count, mode: mode);
  }
}

class GenerateNextQuestionUseCase {
  final ILearningRepository repository;

  GenerateNextQuestionUseCase(this.repository);

  Future<ApiResult<QuizQuestionEntity>> call({
    required String videoId,
    required int difficultyLevel,
    List<String> previousQuestions = const [],
  }) {
    return repository.generateNextQuestion(
      videoId: videoId,
      difficultyLevel: difficultyLevel,
      previousQuestions: previousQuestions,
    );
  }
}

