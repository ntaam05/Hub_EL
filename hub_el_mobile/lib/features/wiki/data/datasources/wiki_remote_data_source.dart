import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/user_inventory_model.dart';
import '../models/wiki_study_card_model.dart';
import '../models/wiki_study_result_model.dart';
import '../models/wiki_study_session_model.dart';

abstract class IWikiRemoteDataSource {
  Future<ApiResult<List<UserInventoryModel>>> getInventory();

  Future<ApiResult<WikiStudyCardModel>> getWikiStudyCard(int cardId);

  Future<ApiResult<WikiStudySessionModel>> generateWikiStudy({
    required int cardId,
    String? language,
    String? level,
    int? numQs,
    int? timeLimit,
    int? wordMin,
    int? wordMax,
    List<String>? quizTypes,
  });

  Future<ApiResult<WikiStudyResultModel>> finishWikiStudy({
    required String sessionId,
    String? sessionToken,
    required List<dynamic> answers,
    int? cardId,
  });

  Future<ApiResult<Map<String, dynamic>>> keepWikiCardStar(int attemptId);
}

class WikiRemoteDataSource implements IWikiRemoteDataSource {
  final DioClient dioClient;

  WikiRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<List<UserInventoryModel>>> getInventory() async {
    return dioClient.get<List<UserInventoryModel>>(
      ApiEndpoints.wikiInventory,
      fromJson: (json) {
        if (json is List) {
          return json
              .whereType<Map<String, dynamic>>()
              .map((item) => UserInventoryModel.fromJson(item))
              .toList();
        }
        return <UserInventoryModel>[];
      },
    );
  }

  @override
  Future<ApiResult<WikiStudyCardModel>> getWikiStudyCard(int cardId) async {
    return dioClient.get<WikiStudyCardModel>(
      ApiEndpoints.wikiCardDetail(cardId),
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return WikiStudyCardModel.fromJson(json);
        }
        throw Exception('Dữ liệu thẻ bài không hợp lệ');
      },
    );
  }

  @override
  Future<ApiResult<WikiStudySessionModel>> generateWikiStudy({
    required int cardId,
    String? language,
    String? level,
    int? numQs,
    int? timeLimit,
    int? wordMin,
    int? wordMax,
    List<String>? quizTypes,
  }) async {
    return dioClient.post<WikiStudySessionModel>(
      ApiEndpoints.wikiStudyGenerate,
      data: {
        'cardId': cardId,
        if (language != null) 'language': language,
        if (level != null) 'level': level,
        if (numQs != null) 'numQs': numQs,
        if (timeLimit != null) 'timeLimit': timeLimit,
        if (wordMin != null) 'wordMin': wordMin,
        if (wordMax != null) 'wordMax': wordMax,
        if (quizTypes != null) 'quizTypes': quizTypes,
      },
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return WikiStudySessionModel.fromJson(json);
        }
        throw Exception('Dữ liệu bài học không hợp lệ');
      },
    );
  }

  @override
  Future<ApiResult<WikiStudyResultModel>> finishWikiStudy({
    required String sessionId,
    String? sessionToken,
    required List<dynamic> answers,
    int? cardId,
  }) async {
    return dioClient.post<WikiStudyResultModel>(
      ApiEndpoints.wikiStudyFinish,
      data: {
        'sessionId': sessionId,
        if (sessionToken != null) 'sessionToken': sessionToken,
        'answers': answers,
        if (cardId != null) 'cardId': cardId,
      },
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return WikiStudyResultModel.fromJson(json);
        }
        throw Exception('Dữ liệu kết quả không hợp lệ');
      },
    );
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> keepWikiCardStar(int attemptId) async {
    return dioClient.post<Map<String, dynamic>>(
      ApiEndpoints.wikiStudyKeepStar,
      data: {
        'attemptId': attemptId,
      },
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json;
        }
        return <String, dynamic>{};
      },
    );
  }
}
