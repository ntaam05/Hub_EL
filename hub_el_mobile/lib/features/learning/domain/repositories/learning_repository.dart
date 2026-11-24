import '../../../../core/network/api_result.dart';
import '../entities/video_item_entity.dart';
import '../entities/video_progress_entity.dart';
import '../entities/quiz_question_entity.dart';
import '../entities/quiz_result_entity.dart';

abstract class ILearningRepository {
  Future<ApiResult<VideoSearchResultEntity>> searchVideos(String query, {String? pageToken});
  Future<ApiResult<VideoItemEntity>> checkVideoUrl(String url);
  Future<ApiResult<VideoDetailEntity>> getVideoDetail(String videoId);
  Future<ApiResult<List<VideoItemEntity>>> getRelatedVideos(String videoId);
  Future<ApiResult<VideoProgressEntity>> getVideoProgress(String videoId);
  Future<ApiResult<VideoProgressEntity>> syncVideoProgress({
    required String videoId,
    required int seconds,
    required int lastWatchedSeconds,
    Map<String, dynamic>? videoMeta,
    bool markCompleted = false,
  });
  Future<ApiResult<bool>> markVideoCompleted(String videoId);
  Future<ApiResult<QuizGeneratedEntity>> generateQuiz({required String videoId, int count = 5});
  Future<ApiResult<QuizResultEntity>> submitQuiz({
    required String videoId,
    String? videoTitle,
    String? channelName,
    required int score,
    required int correctCount,
    required int totalQuizzes,
    dynamic questionsData,
  });
}


