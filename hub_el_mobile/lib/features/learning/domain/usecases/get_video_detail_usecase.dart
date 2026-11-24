import '../../../../core/network/api_result.dart';
import '../entities/video_item_entity.dart';
import '../repositories/learning_repository.dart';

class GetVideoDetailUseCase {
  final ILearningRepository repository;

  GetVideoDetailUseCase(this.repository);

  Future<ApiResult<VideoDetailEntity>> call(String videoId) {
    return repository.getVideoDetail(videoId);
  }
}

