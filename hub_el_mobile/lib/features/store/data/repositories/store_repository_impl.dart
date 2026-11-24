import '../../../../core/network/api_result.dart';
import '../../domain/entities/store_entities.dart';
import '../../domain/repositories/store_repository.dart';
import '../datasources/store_remote_data_source.dart';

class StoreRepositoryImpl implements IStoreRepository {
  final IStoreRemoteDataSource remoteDataSource;

  StoreRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<StoreCatalogEntity>> getCatalog() {
    return remoteDataSource.getCatalog();
  }

  @override
  Future<ApiResult<ExchangeResultEntity>> exchangeResources(
    String type, {
    String? idempotencyKey,
  }) {
    return remoteDataSource.exchangeResources(type, idempotencyKey: idempotencyKey);
  }

  @override
  Future<ApiResult<MoMoPaymentEntity>> createMoMoPayment({
    required String type,
    required int amount,
    required String name,
    String? redirectUrl,
  }) {
    return remoteDataSource.createMoMoPayment(
      type: type,
      amount: amount,
      name: name,
      redirectUrl: redirectUrl,
    );
  }

  @override
  Future<ApiResult<MoMoStatusEntity>> checkMoMoStatus(String orderId) {
    return remoteDataSource.checkMoMoStatus(orderId);
  }

  @override
  Future<ApiResult<TransactionHistoryEntity>> getTransactions({int limit = 20}) {
    return remoteDataSource.getTransactions(limit: limit);
  }
}

