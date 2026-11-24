import '../../../../core/network/api_result.dart';
import '../entities/video_progress_entity.dart';
import '../repositories/learning_repository.dart';

class SyncVideoProgressUseCase {
  final ILearningRepository repository;

  SyncVideoProgressUseCase(this.repository);

  Future<ApiResult<VideoProgressEntity>> call({
    required String videoId,
    required int seconds,
    required int lastWatchedSeconds,
    Map<String, dynamic>? videoMeta,
    bool markCompleted = false,
  }) {
    return repository.syncVideoProgress(
      videoId: videoId,
      seconds: seconds,
      lastWatchedSeconds: lastWatchedSeconds,
      videoMeta: videoMeta,
      markCompleted: markCompleted,
    );
  }
}

