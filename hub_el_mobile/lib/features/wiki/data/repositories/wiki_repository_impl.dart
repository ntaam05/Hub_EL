import '../../../../core/network/api_result.dart';
import '../../domain/entities/user_inventory_entity.dart';
import '../../domain/entities/wiki_study_card_entity.dart';
import '../../domain/entities/wiki_study_result_entity.dart';
import '../../domain/entities/wiki_study_session_entity.dart';
import '../../domain/repositories/wiki_repository.dart';
import '../datasources/wiki_remote_data_source.dart';

class WikiRepositoryImpl implements IWikiRepository {
  final IWikiRemoteDataSource remoteDataSource;

  WikiRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<List<UserInventoryEntity>>> getInventory() async {
    return await remoteDataSource.getInventory();
  }

  @override
  Future<ApiResult<WikiStudyCardEntity>> getWikiStudyCard(int cardId) async {
    return await remoteDataSource.getWikiStudyCard(cardId);
  }

  @override
  Future<ApiResult<WikiStudySessionEntity>> generateWikiStudy({
    required int cardId,
    String? language,
    String? level,
    int? numQs,
    int? timeLimit,
    int? wordMin,
    int? wordMax,
    List<String>? quizTypes,
  }) async {
    return await remoteDataSource.generateWikiStudy(
      cardId: cardId,
      language: language,
      level: level,
      numQs: numQs,
      timeLimit: timeLimit,
      wordMin: wordMin,
      wordMax: wordMax,
      quizTypes: quizTypes,
    );
  }

  @override
  Future<ApiResult<WikiStudyResultEntity>> finishWikiStudy({
    required String sessionId,
    String? sessionToken,
    required List<dynamic> answers,
    int? cardId,
  }) async {
    return await remoteDataSource.finishWikiStudy(
      sessionId: sessionId,
      sessionToken: sessionToken,
      answers: answers,
      cardId: cardId,
    );
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> keepWikiCardStar(int attemptId) async {
    return await remoteDataSource.keepWikiCardStar(attemptId);
  }
}
