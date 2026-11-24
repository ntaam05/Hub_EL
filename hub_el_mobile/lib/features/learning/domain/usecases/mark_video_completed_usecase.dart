import '../../../../core/network/api_result.dart';
import '../repositories/learning_repository.dart';

class MarkVideoCompletedUseCase {
  final ILearningRepository repository;

  MarkVideoCompletedUseCase(this.repository);

  Future<ApiResult<bool>> call(String videoId) {
    return repository.markVideoCompleted(videoId);
  }
}

