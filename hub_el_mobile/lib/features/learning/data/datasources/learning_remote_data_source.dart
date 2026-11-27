import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/video_item_model.dart';
import '../models/video_progress_model.dart';
import '../models/quiz_question_model.dart';
import '../models/quiz_result_model.dart';

abstract class ILearningRemoteDataSource {
  Future<ApiResult<VideoSearchResultModel>> searchVideos(String query, {String? pageToken});
  Future<({List<String> history, List<String> suggestions})> getSearchSuggestions(String query);
  Future<ApiResult<VideoItemModel>> checkVideoUrl(String url);
  Future<ApiResult<VideoDetailModel>> getVideoDetail(String videoId);
  Future<ApiResult<List<VideoItemModel>>> getRelatedVideos(String videoId);
  Future<ApiResult<VideoProgressModel>> getVideoProgress(String videoId);
  Future<ApiResult<VideoProgressModel>> syncVideoProgress({
    required String videoId,
    required int seconds,
    required int lastWatchedSeconds,
    Map<String, dynamic>? videoMeta,
    bool markCompleted = false,
  });
  Future<ApiResult<bool>> markVideoCompleted(String videoId);
  Future<ApiResult<QuizGeneratedModel>> generateQuiz({
    required String videoId,
    int count = 5,
    String? mode,
  });
  Future<ApiResult<QuizQuestionModel>> generateNextQuestion({
    required String videoId,
    required int difficultyLevel,
    List<String> previousQuestions = const [],
  });
  Future<ApiResult<QuizResultModel>> submitQuiz({
    required String videoId,
    String? videoTitle,
    String? channelName,
    required int score,
    required int correctCount,
    required int totalQuizzes,
    dynamic questionsData,
  });
}

class LearningRemoteDataSource implements ILearningRemoteDataSource {
  final DioClient dioClient;

  LearningRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<VideoSearchResultModel>> searchVideos(String query, {String? pageToken}) async {
    return dioClient.get<VideoSearchResultModel>(
      ApiEndpoints.videoSearch,
      queryParameters: {
        'q': query,
        if (pageToken != null && pageToken.isNotEmpty) 'pageToken': pageToken,
      },
      fromJson: (json) => VideoSearchResultModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<({List<String> history, List<String> suggestions})> getSearchSuggestions(String query) async {
    final res = await dioClient.get<Map<String, dynamic>>(
      ApiEndpoints.videoSuggestions,
      queryParameters: {'q': query},
      fromJson: (json) => json as Map<String, dynamic>,
    );
    if (res is ApiSuccess<Map<String, dynamic>>) {
      final rawHistory = res.data['history'];
      final rawSuggestions = res.data['suggestions'];
      final history = rawHistory is List
          ? rawHistory.map((e) => e.toString()).toList()
          : <String>[];
      final suggestions = rawSuggestions is List
          ? rawSuggestions.map((e) => e.toString()).toList()
          : <String>[];
      return (history: history, suggestions: suggestions);
    }
    return (history: <String>[], suggestions: <String>[]);
  }

  @override
  Future<ApiResult<VideoItemModel>> checkVideoUrl(String url) async {
    return dioClient.post<VideoItemModel>(
      ApiEndpoints.videoCheck,
      data: {'url': url},
      fromJson: (json) => VideoItemModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<VideoDetailModel>> getVideoDetail(String videoId) async {
    return dioClient.get<VideoDetailModel>(
      ApiEndpoints.videoDetail(videoId),
      fromJson: (json) => VideoDetailModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<List<VideoItemModel>>> getRelatedVideos(String videoId) async {
    return dioClient.get<List<VideoItemModel>>(
      ApiEndpoints.videoRelated(videoId),
      fromJson: (json) {
        if (json is List) {
          return json.map((e) => VideoItemModel.fromJson(e as Map<String, dynamic>)).toList();
        }
        return [];
      },
    );
  }

  @override
  Future<ApiResult<VideoProgressModel>> getVideoProgress(String videoId) async {
    return dioClient.get<VideoProgressModel>(
      ApiEndpoints.videoProgress,
      queryParameters: {'videoId': videoId},
      fromJson: (json) => VideoProgressModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<VideoProgressModel>> syncVideoProgress({
    required String videoId,
    required int seconds,
    required int lastWatchedSeconds,
    Map<String, dynamic>? videoMeta,
    bool markCompleted = false,
  }) async {
    return dioClient.post<VideoProgressModel>(
      ApiEndpoints.videoProgress,
      data: {
        'videoId': videoId,
        'seconds': seconds,
        'lastWatchedSeconds': lastWatchedSeconds,
        'videoMeta': ?videoMeta,
        'markCompleted': markCompleted,
      },
      fromJson: (json) => VideoProgressModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<bool>> markVideoCompleted(String videoId) async {
    final result = await dioClient.post<Map<String, dynamic>>(
      ApiEndpoints.videoProgress,
      data: {
        'videoId': videoId,
        'markCompleted': true,
      },
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (result is ApiSuccess<Map<String, dynamic>>) {
      return const ApiSuccess(true);
    } else if (result is ApiFailure<Map<String, dynamic>>) {
      return ApiFailure(message: result.message, code: result.code);
    }
    return const ApiFailure(message: 'Đánh dấu hoàn thành thất bại');
  }

  @override
  Future<ApiResult<QuizGeneratedModel>> generateQuiz({
    required String videoId,
    int count = 5,
    String? mode,
  }) async {
    return dioClient.post<QuizGeneratedModel>(
      ApiEndpoints.videoGenerateQuiz,
      data: {
        'videoId': videoId,
        'count': count,
        'mode': ?mode,
      },
      options: Options(receiveTimeout: const Duration(seconds: 90)),
      fromJson: (json) => QuizGeneratedModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<QuizQuestionModel>> generateNextQuestion({
    required String videoId,
    required int difficultyLevel,
    List<String> previousQuestions = const [],
  }) async {
    return dioClient.post<QuizQuestionModel>(
      ApiEndpoints.videoNextQuiz,
      data: {
        'videoId': videoId,
        'difficultyLevel': difficultyLevel,
        'previousQuestions': previousQuestions,
      },
      options: Options(receiveTimeout: const Duration(seconds: 90)),
      fromJson: (json) {
        final map = json as Map<String, dynamic>;
        final rawQ = map['question'] is Map<String, dynamic>
            ? map['question'] as Map<String, dynamic>
            : map;
        return QuizQuestionModel.fromJson(rawQ);
      },
    );
  }

  @override
  Future<ApiResult<QuizResultModel>> submitQuiz({
    required String videoId,
    String? videoTitle,
    String? channelName,
    required int score,
    required int correctCount,
    required int totalQuizzes,
    dynamic questionsData,
  }) async {
    return dioClient.post<QuizResultModel>(
      ApiEndpoints.videoSubmitQuiz,
      data: {
        'videoId': videoId,
        'videoTitle': videoTitle,
        'channelName': channelName,
        'score': score,
        'correctCount': correctCount,
        'totalQuizzes': totalQuizzes,
        'questionsData': ?questionsData,
      },
      fromJson: (json) => QuizResultModel.fromJson(json as Map<String, dynamic>),
    );
  }
}


