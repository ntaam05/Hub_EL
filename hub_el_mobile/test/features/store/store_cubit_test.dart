import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/store/domain/entities/store_entities.dart';
import 'package:hub_el_mobile/features/store/domain/repositories/store_repository.dart';
import 'package:hub_el_mobile/features/store/domain/usecases/store_usecases.dart';
import 'package:hub_el_mobile/features/store/presentation/cubit/store_cubit.dart';
import 'package:hub_el_mobile/features/store/presentation/cubit/store_state.dart';

class MockStoreRepository implements IStoreRepository {
  bool shouldFail = false;
  String errorMessage = 'Error occurred';

  StoreCatalogEntity mockCatalog = const StoreCatalogEntity(
    balance: StoreBalanceEntity(
      freeCoins: 1000,
      aiTokens: 20,
      premiumCoins: 50,
      stardust: 0,
      isPro: false,
    ),
    exchangeRules: [
      ExchangeRuleEntity(
        type: 'DIAMOND_TO_ENERGY',
        name: 'Đổi 20 Ngọc lấy 100 Energy',
        costField: 'premiumCoins',
        cost: 20,
        rewardField: 'aiTokens',
        reward: 100,
      ),
    ],
    vipPlans: [
      VipPlanEntity(
        id: 'vip_1m',
        name: '1 Tháng',
        days: 30,
        amount: 79000,
        description: 'Gói 1 tháng',
      ),
    ],
    coinPackages: [
      CoinPackageEntity(
        id: 'pkg_1',
        name: 'Gói Nhỏ',
        amount: 20000,
        coins: 100,
      ),
    ],
  );

  @override
  Future<ApiResult<StoreCatalogEntity>> getCatalog() async {
    if (shouldFail) {
      return ApiFailure(message: errorMessage);
    }
    return ApiSuccess(mockCatalog);
  }

  @override
  Future<ApiResult<ExchangeResultEntity>> exchangeResources(
    String type, {
    String? idempotencyKey,
  }) async {
    if (shouldFail) {
      return ApiFailure(message: errorMessage);
    }
    return const ApiSuccess(
      ExchangeResultEntity(
        type: 'DIAMOND_TO_ENERGY',
        costField: 'premiumCoins',
        cost: 20,
        rewardField: 'aiTokens',
        reward: 100,
        updatedBalances: {
          'premiumCoins': 30,
          'aiTokens': 120,
        },
      ),
    );
  }

  @override
  Future<ApiResult<MoMoPaymentEntity>> createMoMoPayment({
    required String type,
    required int amount,
    required String name,
    String? redirectUrl,
  }) async {
    if (shouldFail) {
      return ApiFailure(message: errorMessage);
    }
    return const ApiSuccess(
      MoMoPaymentEntity(
        orderId: 'ORDER_999',
        payUrl: 'https://momo.vn/pay/999',
        deeplink: 'momo://pay?id=999',
      ),
    );
  }

  @override
  Future<ApiResult<MoMoStatusEntity>> checkMoMoStatus(String orderId) async {
    if (shouldFail) {
      return ApiFailure(message: errorMessage);
    }
    return const ApiSuccess(
      MoMoStatusEntity(
        orderCode: 'ORDER_999',
        status: 'SUCCESS',
        amount: 79000,
        type: 'VIP',
        isPro: true,
      ),
    );
  }

  @override
  Future<ApiResult<TransactionHistoryEntity>> getTransactions({int limit = 20}) async {
    if (shouldFail) {
      return ApiFailure(message: errorMessage);
    }
    return ApiSuccess(
      TransactionHistoryEntity(
        orders: [
          OrderItemEntity(
            id: 1,
            orderCode: 'ORDER_999',
            amount: 79000,
            type: 'VIP',
            status: 'SUCCESS',
            createdAt: DateTime.now(),
          ),
        ],
        coinTransactions: [],
      ),
    );
  }
}

void main() {
  late MockStoreRepository mockRepo;
  late StoreCubit storeCubit;

  setUp(() {
    mockRepo = MockStoreRepository();
    storeCubit = StoreCubit(
      getStoreCatalogUseCase: GetStoreCatalogUseCase(repository: mockRepo),
      exchangeResourcesUseCase: ExchangeResourcesUseCase(repository: mockRepo),
      createMoMoPaymentUseCase: CreateMoMoPaymentUseCase(repository: mockRepo),
      checkMoMoStatusUseCase: CheckMoMoStatusUseCase(repository: mockRepo),
      getTransactionsUseCase: GetTransactionsUseCase(repository: mockRepo),
    );
  });

  tearDown(() {
    storeCubit.close();
  });

  group('StoreCubit State Transitions', () {
    test('initial state is correct', () {
      expect(storeCubit.state.status, StoreStatus.initial);
      expect(storeCubit.state.activeTab, StoreTab.vip);
      expect(storeCubit.state.catalog, isNull);
    });

    test('loadCatalog success emits loaded with catalog data', () async {
      await storeCubit.loadCatalog();

      expect(storeCubit.state.status, StoreStatus.loaded);
      expect(storeCubit.state.catalog, isNotNull);
      expect(storeCubit.state.catalog!.balance.freeCoins, 1000);
      expect(storeCubit.state.catalog!.balance.premiumCoins, 50);
    });

    test('loadCatalog failure emits error', () async {
      mockRepo.shouldFail = true;
      mockRepo.errorMessage = 'Network timeout';

      await storeCubit.loadCatalog();

      expect(storeCubit.state.status, StoreStatus.error);
      expect(storeCubit.state.errorMessage, 'Network timeout');
    });

    test('switchTab changes activeTab and loads history when switching to history', () async {
      storeCubit.switchTab(StoreTab.gems);
      expect(storeCubit.state.activeTab, StoreTab.gems);

      storeCubit.switchTab(StoreTab.history);
      expect(storeCubit.state.activeTab, StoreTab.history);
    });

    test('exchangeResource updates balance and emits success', () async {
      await storeCubit.loadCatalog();
      final success = await storeCubit.exchangeResource(
        type: 'DIAMOND_TO_ENERGY',
        cost: 20,
        costField: 'premiumCoins',
      );

      expect(success, true);
      expect(storeCubit.state.status, StoreStatus.loaded);
      expect(storeCubit.state.successMessage, 'Quy đổi tài nguyên thành công!');
    });

    test('createMoMoPayment sets currentPayment and returns true on success', () async {
      final success = await storeCubit.createMoMoPayment(
        type: 'VIP',
        amount: 79000,
        name: 'Gói 1 tháng',
      );

      expect(success, true);
      expect(storeCubit.state.currentPayment, isNotNull);
      expect(storeCubit.state.currentPayment!.orderId, 'ORDER_999');
    });

    test('checkMoMoStatus updates paymentStatus and reloads catalog on success', () async {
      await storeCubit.checkMoMoStatus('ORDER_999');

      expect(storeCubit.state.paymentStatus, isNotNull);
      expect(storeCubit.state.paymentStatus!.isSuccess, true);
      expect(storeCubit.state.status, StoreStatus.paymentSuccess);
    });
  });
}
