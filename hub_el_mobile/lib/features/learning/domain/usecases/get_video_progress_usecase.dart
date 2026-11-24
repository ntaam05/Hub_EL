import '../../../../core/network/api_result.dart';
import '../entities/video_progress_entity.dart';
import '../repositories/learning_repository.dart';

class GetVideoProgressUseCase {
  final ILearningRepository repository;

  GetVideoProgressUseCase(this.repository);

  Future<ApiResult<VideoProgressEntity>> call(String videoId) {
    return repository.getVideoProgress(videoId);
  }
}

