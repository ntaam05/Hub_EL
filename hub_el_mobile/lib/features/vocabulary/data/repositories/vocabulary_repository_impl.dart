import '../../../../core/network/api_result.dart';
import '../../domain/entities/vocabulary_entities.dart';
import '../../domain/repositories/vocabulary_repository.dart';
import '../datasources/vocabulary_remote_data_source.dart';

class VocabularyRepositoryImpl implements IVocabularyRepository {
  final IVocabularyRemoteDataSource remoteDataSource;

  VocabularyRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<VocabularyListResponseEntity>> getVocabularyList({
    String? search,
    String? language,
    String? sort,
    int? page,
    int? limit,
  }) async {
    return remoteDataSource.getVocabularyList(
      search: search,
      language: language,
      sort: sort,
      page: page,
      limit: limit,
    );
  }

  @override
  Future<ApiResult<VocabularyDetailEntity>> getVocabularyDetail(int id) async {
    return remoteDataSource.getVocabularyDetail(id);
  }

  @override
  Future<ApiResult<VocabularyContextEntity>> getVocabularyContext(int cardId, String targetWord) async {
    return remoteDataSource.getVocabularyContext(cardId, targetWord);
  }
}

