import '../../../../core/network/api_result.dart';
import '../entities/video_item_entity.dart';
import '../repositories/learning_repository.dart';

class GetRelatedVideosUseCase {
  final ILearningRepository repository;

  GetRelatedVideosUseCase(this.repository);

  Future<ApiResult<List<VideoItemEntity>>> call(String videoId) {
    return repository.getRelatedVideos(videoId);
  }
}

