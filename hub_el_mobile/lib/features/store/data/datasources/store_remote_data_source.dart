import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/store_models.dart';

abstract class IStoreRemoteDataSource {
  Future<ApiResult<StoreCatalogModel>> getCatalog();

  Future<ApiResult<ExchangeResultModel>> exchangeResources(
    String type, {
    String? idempotencyKey,
  });

  Future<ApiResult<MoMoPaymentModel>> createMoMoPayment({
    required String type,
    required int amount,
    required String name,
    String? redirectUrl,
  });

  Future<ApiResult<MoMoStatusModel>> checkMoMoStatus(String orderId);

  Future<ApiResult<TransactionHistoryModel>> getTransactions({int limit = 20});
}

class StoreRemoteDataSource implements IStoreRemoteDataSource {
  final DioClient dioClient;

  StoreRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<StoreCatalogModel>> getCatalog() async {
    return dioClient.get<StoreCatalogModel>(
      ApiEndpoints.storeCatalog,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return StoreCatalogModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu kho hàng không đúng định dạng');
      },
    );
  }

  @override
  Future<ApiResult<ExchangeResultModel>> exchangeResources(
    String type, {
    String? idempotencyKey,
  }) async {
    final Map<String, dynamic> data = {'type': type};
    if (idempotencyKey != null) {
      data['idempotencyKey'] = idempotencyKey;
    }

    return dioClient.post<ExchangeResultModel>(
      ApiEndpoints.storeExchange,
      data: data,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return ExchangeResultModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu phản hồi quy đổi không đúng định dạng');
      },
    );
  }

  @override
  Future<ApiResult<MoMoPaymentModel>> createMoMoPayment({
    required String type,
    required int amount,
    required String name,
    String? redirectUrl,
  }) async {
    final Map<String, dynamic> data = {
      'type': type,
      'amount': amount,
      'name': name,
    };
    if (redirectUrl != null) {
      data['redirectUrl'] = redirectUrl;
    }

    return dioClient.post<MoMoPaymentModel>(
      ApiEndpoints.storeMomoCreate,
      data: data,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return MoMoPaymentModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu liên kết MoMo không đúng định dạng');
      },
    );
  }

  @override
  Future<ApiResult<MoMoStatusModel>> checkMoMoStatus(String orderId) async {
    return dioClient.post<MoMoStatusModel>(
      ApiEndpoints.storeMomoCheckStatus,
      data: {'orderId': orderId},
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return MoMoStatusModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu trạng thái thanh toán không đúng định dạng');
      },
    );
  }

  @override
  Future<ApiResult<TransactionHistoryModel>> getTransactions({int limit = 20}) async {
    return dioClient.get<TransactionHistoryModel>(
      ApiEndpoints.storeTransactions,
      queryParameters: {'limit': limit},
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return TransactionHistoryModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu lịch sử giao dịch không đúng định dạng');
      },
    );
  }
}
