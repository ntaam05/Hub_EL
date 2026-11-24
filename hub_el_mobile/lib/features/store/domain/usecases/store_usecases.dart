import '../../../../core/network/api_result.dart';
import '../entities/store_entities.dart';
import '../repositories/store_repository.dart';

class GetStoreCatalogUseCase {
  final IStoreRepository repository;
  GetStoreCatalogUseCase({required this.repository});

  Future<ApiResult<StoreCatalogEntity>> call() {
    return repository.getCatalog();
  }
}

class ExchangeResourcesUseCase {
  final IStoreRepository repository;
  ExchangeResourcesUseCase({required this.repository});

  Future<ApiResult<ExchangeResultEntity>> call(String type, {String? idempotencyKey}) {
    return repository.exchangeResources(type, idempotencyKey: idempotencyKey);
  }
}

class CreateMoMoPaymentUseCase {
  final IStoreRepository repository;
  CreateMoMoPaymentUseCase({required this.repository});

  Future<ApiResult<MoMoPaymentEntity>> call({
    required String type,
    required int amount,
    required String name,
    String? redirectUrl,
  }) {
    return repository.createMoMoPayment(
      type: type,
      amount: amount,
      name: name,
      redirectUrl: redirectUrl,
    );
  }
}

class CheckMoMoStatusUseCase {
  final IStoreRepository repository;
  CheckMoMoStatusUseCase({required this.repository});

  Future<ApiResult<MoMoStatusEntity>> call(String orderId) {
    return repository.checkMoMoStatus(orderId);
  }
}

class GetTransactionsUseCase {
  final IStoreRepository repository;
  GetTransactionsUseCase({required this.repository});

  Future<ApiResult<TransactionHistoryEntity>> call({int limit = 20}) {
    return repository.getTransactions(limit: limit);
  }
}

