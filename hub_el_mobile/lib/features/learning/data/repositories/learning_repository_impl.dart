import '../../../../core/network/api_result.dart';
import '../../domain/entities/video_item_entity.dart';
import '../../domain/entities/video_progress_entity.dart';
import '../../domain/entities/quiz_question_entity.dart';
import '../../domain/entities/quiz_result_entity.dart';
import '../../domain/repositories/learning_repository.dart';
import '../datasources/learning_remote_data_source.dart';

class LearningRepositoryImpl implements ILearningRepository {
  final ILearningRemoteDataSource remoteDataSource;

  LearningRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<VideoSearchResultEntity>> searchVideos(String query, {String? pageToken}) {
    return remoteDataSource.searchVideos(query, pageToken: pageToken);
  }

  @override
  Future<({List<String> history, List<String> suggestions})> getSearchSuggestions(String query) {
    return remoteDataSource.getSearchSuggestions(query);
  }

  @override
  Future<ApiResult<VideoItemEntity>> checkVideoUrl(String url) {
    return remoteDataSource.checkVideoUrl(url);
  }

  @override
  Future<ApiResult<VideoDetailEntity>> getVideoDetail(String videoId) {
    return remoteDataSource.getVideoDetail(videoId);
  }

  @override
  Future<ApiResult<List<VideoItemEntity>>> getRelatedVideos(String videoId) {
    return remoteDataSource.getRelatedVideos(videoId);
  }

  @override
  Future<ApiResult<VideoProgressEntity>> getVideoProgress(String videoId) {
    return remoteDataSource.getVideoProgress(videoId);
  }

  @override
  Future<ApiResult<VideoProgressEntity>> syncVideoProgress({
    required String videoId,
    required int seconds,
    required int lastWatchedSeconds,
    Map<String, dynamic>? videoMeta,
    bool markCompleted = false,
  }) {
    return remoteDataSource.syncVideoProgress(
      videoId: videoId,
      seconds: seconds,
      lastWatchedSeconds: lastWatchedSeconds,
      videoMeta: videoMeta,
      markCompleted: markCompleted,
    );
  }

  @override
  Future<ApiResult<bool>> markVideoCompleted(String videoId) {
    return remoteDataSource.markVideoCompleted(videoId);
  }

  @override
  Future<ApiResult<QuizGeneratedEntity>> generateQuiz({
    required String videoId,
    int count = 5,
    String? mode,
  }) {
    return remoteDataSource.generateQuiz(videoId: videoId, count: count, mode: mode);
  }

  @override
  Future<ApiResult<QuizQuestionEntity>> generateNextQuestion({
    required String videoId,
    required int difficultyLevel,
    List<String> previousQuestions = const [],
  }) {
    return remoteDataSource.generateNextQuestion(
      videoId: videoId,
      difficultyLevel: difficultyLevel,
      previousQuestions: previousQuestions,
    );
  }

  @override
  Future<ApiResult<QuizResultEntity>> submitQuiz({
    required String videoId,
    String? videoTitle,
    String? channelName,
    required int score,
    required int correctCount,
    required int totalQuizzes,
    dynamic questionsData,
  }) {
    return remoteDataSource.submitQuiz(
      videoId: videoId,
      videoTitle: videoTitle,
      channelName: channelName,
      score: score,
      correctCount: correctCount,
      totalQuizzes: totalQuizzes,
      questionsData: questionsData,
    );
  }
}


