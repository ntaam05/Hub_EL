import '../../../../core/network/api_result.dart';
import '../entities/video_item_entity.dart';
import '../repositories/learning_repository.dart';

class CheckVideoLinkUseCase {
  final ILearningRepository repository;

  CheckVideoLinkUseCase(this.repository);

  Future<ApiResult<VideoItemEntity>> call(String url) {
    return repository.checkVideoUrl(url);
  }
}

