import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/gacha_exchange_model.dart';
import '../models/gacha_history_model.dart';
import '../models/gacha_roll_result_model.dart';
import '../models/gacha_status_model.dart';

abstract class IGachaRemoteDataSource {
  Future<ApiResult<GachaStatusModel>> getGachaStatus();

  Future<ApiResult<GachaRollResultModel>> rollGacha(int count);

  Future<ApiResult<GachaExchangeModel>> getExchangeCards();

  Future<ApiResult<Map<String, dynamic>>> exchangeCard(int cardId);

  Future<ApiResult<GachaHistoryModel>> getGachaHistory({int page = 1, int limit = 10});
}

class GachaRemoteDataSource implements IGachaRemoteDataSource {
  final DioClient dioClient;

  GachaRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<GachaStatusModel>> getGachaStatus() async {
    return dioClient.get<GachaStatusModel>(
      ApiEndpoints.gachaStatus,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return GachaStatusModel.fromJson(json);
        }
        throw Exception('Dữ liệu trạng thái Gacha không hợp lệ');
      },
    );
  }

  @override
  Future<ApiResult<GachaRollResultModel>> rollGacha(int count) async {
    return dioClient.post<GachaRollResultModel>(
      ApiEndpoints.gachaRoll,
      data: {'count': count},
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return GachaRollResultModel.fromJson(json);
        }
        throw Exception('Dữ liệu kết quả quay thẻ không hợp lệ');
      },
    );
  }

  @override
  Future<ApiResult<GachaExchangeModel>> getExchangeCards() async {
    return dioClient.get<GachaExchangeModel>(
      ApiEndpoints.gachaExchange,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return GachaExchangeModel.fromJson(json);
        }
        throw Exception('Dữ liệu tiệm đổi thẻ không hợp lệ');
      },
    );
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> exchangeCard(int cardId) async {
    return dioClient.post<Map<String, dynamic>>(
      ApiEndpoints.gachaExchange,
      data: {'cardId': cardId},
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json;
        }
        throw Exception('Kết quả đổi thẻ không hợp lệ');
      },
    );
  }

  @override
  Future<ApiResult<GachaHistoryModel>> getGachaHistory({int page = 1, int limit = 10}) async {
    return dioClient.get<GachaHistoryModel>(
      ApiEndpoints.gachaHistory,
      queryParameters: {
        'page': page,
        'limit': limit,
      },
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return GachaHistoryModel.fromJson(json);
        }
        throw Exception('Dữ liệu lịch sử thẻ không hợp lệ');
      },
    );
  }
}

