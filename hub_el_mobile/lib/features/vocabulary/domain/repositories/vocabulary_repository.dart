import '../../../../core/network/api_result.dart';
import '../entities/vocabulary_entities.dart';

abstract class IVocabularyRepository {
  Future<ApiResult<VocabularyListResponseEntity>> getVocabularyList({
    String? search,
    String? language,
    String? sort,
    int? page,
    int? limit,
  });

  Future<ApiResult<VocabularyDetailEntity>> getVocabularyDetail(int id);

  Future<ApiResult<VocabularyContextEntity>> getVocabularyContext(int cardId, String targetWord);
}

