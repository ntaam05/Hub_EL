import '../../../../core/network/api_result.dart';
import '../entities/store_entities.dart';

abstract class IStoreRepository {
  Future<ApiResult<StoreCatalogEntity>> getCatalog();

  Future<ApiResult<ExchangeResultEntity>> exchangeResources(
    String type, {
    String? idempotencyKey,
  });

  Future<ApiResult<MoMoPaymentEntity>> createMoMoPayment({
    required String type,
    required int amount,
    required String name,
    String? redirectUrl,
  });

  Future<ApiResult<MoMoStatusEntity>> checkMoMoStatus(String orderId);

  Future<ApiResult<TransactionHistoryEntity>> getTransactions({int limit = 20});
}

