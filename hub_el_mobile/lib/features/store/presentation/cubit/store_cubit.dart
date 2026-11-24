import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_result.dart';
import '../../domain/usecases/store_usecases.dart';
import 'store_state.dart';

class StoreCubit extends Cubit<StoreState> {
  final GetStoreCatalogUseCase getStoreCatalogUseCase;
  final ExchangeResourcesUseCase exchangeResourcesUseCase;
  final CreateMoMoPaymentUseCase createMoMoPaymentUseCase;
  final CheckMoMoStatusUseCase checkMoMoStatusUseCase;
  final GetTransactionsUseCase getTransactionsUseCase;

  StoreCubit({
    required this.getStoreCatalogUseCase,
    required this.exchangeResourcesUseCase,
    required this.createMoMoPaymentUseCase,
    required this.checkMoMoStatusUseCase,
    required this.getTransactionsUseCase,
  }) : super(const StoreState());

  void switchTab(StoreTab tab) {
    emit(state.copyWith(activeTab: tab, clearMessages: true));
    if (tab == StoreTab.history && state.transactions == null) {
      loadTransactions();
    }
  }

  void clearMessages() {
    emit(state.copyWith(clearMessages: true));
  }

  void resetPayment() {
    emit(state.copyWith(clearPayment: true, clearMessages: true));
  }

  Future<void> loadCatalog({bool showLoading = true}) async {
    if (showLoading) {
      emit(state.copyWith(status: StoreStatus.loading, clearMessages: true));
    }

    final result = await getStoreCatalogUseCase();
    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(
          status: StoreStatus.loaded,
          catalog: data,
        ));
      case ApiFailure(:final message):
        emit(state.copyWith(
          status: StoreStatus.error,
          errorMessage: message,
        ));
    }
  }

  Future<bool> exchangeResource({
    required String type,
    required int cost,
    required String costField,
  }) async {
    final balance = state.catalog?.balance;
    if (balance != null) {
      int currentBalance = 0;
      if (costField == 'premiumCoins') currentBalance = balance.premiumCoins;
      if (costField == 'freeCoins') currentBalance = balance.freeCoins;
      if (costField == 'aiTokens') currentBalance = balance.aiTokens;

      if (currentBalance < cost) {
        emit(state.copyWith(
          status: StoreStatus.error,
          errorMessage: 'Số dư không đủ để thực hiện quy đổi.',
        ));
        return false;
      }
    }

    emit(state.copyWith(
      status: StoreStatus.exchanging,
      exchangingType: type,
      clearMessages: true,
    ));

    final idempotencyKey = 'EX_${DateTime.now().millisecondsSinceEpoch}_$type';
    final result = await exchangeResourcesUseCase(type, idempotencyKey: idempotencyKey);

    switch (result) {
      case ApiSuccess():
        await loadCatalog(showLoading: false);
        emit(state.copyWith(
          status: StoreStatus.loaded,
          successMessage: 'Quy đổi tài nguyên thành công!',
          exchangingType: null,
        ));
        return true;
      case ApiFailure(:final message):
        emit(state.copyWith(
          status: StoreStatus.error,
          errorMessage: message,
          exchangingType: null,
        ));
        return false;
    }
  }

  Future<bool> createMoMoPayment({
    required String type,
    required int amount,
    required String name,
    String? redirectUrl,
  }) async {
    emit(state.copyWith(
      status: StoreStatus.creatingPayment,
      clearPayment: true,
      clearMessages: true,
    ));

    final result = await createMoMoPaymentUseCase(
      type: type,
      amount: amount,
      name: name,
      redirectUrl: redirectUrl ?? 'hubel://payment-callback',
    );

    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(
          status: StoreStatus.loaded,
          currentPayment: data,
        ));
        return true;
      case ApiFailure(:final message):
        emit(state.copyWith(
          status: StoreStatus.error,
          errorMessage: message,
        ));
        return false;
    }
  }

  Future<bool> checkMoMoStatus(String orderId) async {
    emit(state.copyWith(
      status: StoreStatus.verifyingPayment,
      clearMessages: true,
    ));

    final result = await checkMoMoStatusUseCase(orderId);

    switch (result) {
      case ApiSuccess(:final data):
        if (data.isSuccess) {
          await loadCatalog(showLoading: false);
          emit(state.copyWith(
            status: StoreStatus.paymentSuccess,
            paymentStatus: data,
            successMessage: 'Thanh toán thành công! Tài khoản đã được nâng cấp.',
          ));
          return true;
        } else {
          emit(state.copyWith(
            status: StoreStatus.loaded,
            paymentStatus: data,
            errorMessage: 'Đơn hàng đang chờ xử lý trên MoMo.',
          ));
          return false;
        }
      case ApiFailure(:final message):
        emit(state.copyWith(
          status: StoreStatus.error,
          errorMessage: message,
        ));
        return false;
    }
  }

  Future<void> loadTransactions({int limit = 20}) async {
    final result = await getTransactionsUseCase(limit: limit);
    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(transactions: data));
      case ApiFailure():
        break;
    }
  }
}
