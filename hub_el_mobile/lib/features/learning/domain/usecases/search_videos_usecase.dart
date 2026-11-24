import '../../../../core/network/api_result.dart';
import '../entities/video_item_entity.dart';
import '../repositories/learning_repository.dart';

class SearchVideosUseCase {
  final ILearningRepository repository;

  SearchVideosUseCase(this.repository);

  Future<ApiResult<VideoSearchResultEntity>> call(String query, {String? pageToken}) {
    return repository.searchVideos(query, pageToken: pageToken);
  }
}

