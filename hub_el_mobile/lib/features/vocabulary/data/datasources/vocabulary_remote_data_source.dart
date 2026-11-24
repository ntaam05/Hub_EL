import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/vocabulary_models.dart';

abstract class IVocabularyRemoteDataSource {
  Future<ApiResult<VocabularyListResponseModel>> getVocabularyList({
    String? search,
    String? language,
    String? sort,
    int? page,
    int? limit,
  });

  Future<ApiResult<VocabularyDetailModel>> getVocabularyDetail(int id);

  Future<ApiResult<VocabularyContextModel>> getVocabularyContext(int cardId, String targetWord);
}

class VocabularyRemoteDataSource implements IVocabularyRemoteDataSource {
  final DioClient dioClient;

  VocabularyRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<VocabularyListResponseModel>> getVocabularyList({
    String? search,
    String? language,
    String? sort,
    int? page,
    int? limit,
  }) async {
    final queryParams = <String, dynamic>{};
    if (search != null && search.trim().isNotEmpty) {
      queryParams['search'] = search.trim();
    }
    if (language != null && language.trim().isNotEmpty && language != 'ALL' && language != 'Tất cả') {
      queryParams['language'] = language.trim();
    }
    if (sort != null && sort.isNotEmpty) {
      queryParams['sort'] = sort;
    }
    if (page != null && page > 0) {
      queryParams['page'] = page;
    }
    if (limit != null && limit > 0) {
      queryParams['limit'] = limit;
    }

    return dioClient.get<VocabularyListResponseModel>(
      ApiEndpoints.vocabularyList,
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return VocabularyListResponseModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu Danh sách từ vựng không đúng định dạng');
      },
    );
  }

  @override
  Future<ApiResult<VocabularyDetailModel>> getVocabularyDetail(int id) async {
    return dioClient.get<VocabularyDetailModel>(
      ApiEndpoints.vocabularyDetail(id),
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return VocabularyDetailModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu Chi tiết từ vựng không đúng định dạng');
      },
    );
  }

  @override
  Future<ApiResult<VocabularyContextModel>> getVocabularyContext(int cardId, String targetWord) async {
    return dioClient.get<VocabularyContextModel>(
      ApiEndpoints.vocabularyContext(cardId, targetWord),
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return VocabularyContextModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu Ngữ cảnh bài học không đúng định dạng');
      },
    );
  }
}

