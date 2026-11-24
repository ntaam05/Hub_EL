import '../../../../core/network/api_result.dart';
import '../entities/vocabulary_entities.dart';
import '../repositories/vocabulary_repository.dart';

class GetVocabularyListUseCase {
  final IVocabularyRepository repository;

  GetVocabularyListUseCase(this.repository);

  Future<ApiResult<VocabularyListResponseEntity>> call({
    String? search,
    String? language,
    String? sort,
    int? page,
    int? limit,
  }) {
    return repository.getVocabularyList(
      search: search,
      language: language,
      sort: sort,
      page: page,
      limit: limit,
    );
  }
}

class GetVocabularyDetailUseCase {
  final IVocabularyRepository repository;

  GetVocabularyDetailUseCase(this.repository);

  Future<ApiResult<VocabularyDetailEntity>> call(int id) {
    return repository.getVocabularyDetail(id);
  }
}

class GetVocabularyContextUseCase {
  final IVocabularyRepository repository;

  GetVocabularyContextUseCase(this.repository);

  Future<ApiResult<VocabularyContextEntity>> call(int cardId, String targetWord) {
    return repository.getVocabularyContext(cardId, targetWord);
  }
}

