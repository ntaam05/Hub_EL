import '../../../../core/network/api_result.dart';
import '../entities/user_inventory_entity.dart';
import '../entities/wiki_study_card_entity.dart';
import '../entities/wiki_study_result_entity.dart';
import '../entities/wiki_study_session_entity.dart';

abstract class IWikiRepository {
  Future<ApiResult<List<UserInventoryEntity>>> getInventory();

  Future<ApiResult<WikiStudyCardEntity>> getWikiStudyCard(int cardId);

  Future<ApiResult<WikiStudySessionEntity>> generateWikiStudy({
    required int cardId,
    String? language,
    String? level,
    int? numQs,
    int? timeLimit,
    int? wordMin,
    int? wordMax,
    List<String>? quizTypes,
  });

  Future<ApiResult<WikiStudyResultEntity>> finishWikiStudy({
    required String sessionId,
    String? sessionToken,
    required List<dynamic> answers,
    int? cardId,
  });

  Future<ApiResult<Map<String, dynamic>>> keepWikiCardStar(int attemptId);
}
