import 'package:equatable/equatable.dart';
import '../../domain/entities/store_entities.dart';

enum StoreTab { vip, gems, exchange, history }

enum StoreStatus {
  initial,
  loading,
  loaded,
  exchanging,
  creatingPayment,
  verifyingPayment,
  paymentSuccess,
  error,
}

class StoreState extends Equatable {
  final StoreStatus status;
  final StoreTab activeTab;
  final StoreCatalogEntity? catalog;
  final MoMoPaymentEntity? currentPayment;
  final MoMoStatusEntity? paymentStatus;
  final TransactionHistoryEntity? transactions;
  final String? errorMessage;
  final String? successMessage;
  final String? exchangingType;

  const StoreState({
    this.status = StoreStatus.initial,
    this.activeTab = StoreTab.vip,
    this.catalog,
    this.currentPayment,
    this.paymentStatus,
    this.transactions,
    this.errorMessage,
    this.successMessage,
    this.exchangingType,
  });

  bool get isLoading => status == StoreStatus.loading;
  bool get isExchanging => status == StoreStatus.exchanging;
  bool get isCreatingPayment => status == StoreStatus.creatingPayment;
  bool get isVerifyingPayment => status == StoreStatus.verifyingPayment;

  StoreState copyWith({
    StoreStatus? status,
    StoreTab? activeTab,
    StoreCatalogEntity? catalog,
    MoMoPaymentEntity? currentPayment,
    MoMoStatusEntity? paymentStatus,
    TransactionHistoryEntity? transactions,
    String? errorMessage,
    String? successMessage,
    String? exchangingType,
    bool clearPayment = false,
    bool clearMessages = false,
  }) {
    return StoreState(
      status: status ?? this.status,
      activeTab: activeTab ?? this.activeTab,
      catalog: catalog ?? this.catalog,
      currentPayment: clearPayment ? null : (currentPayment ?? this.currentPayment),
      paymentStatus: clearPayment ? null : (paymentStatus ?? this.paymentStatus),
      transactions: transactions ?? this.transactions,
      errorMessage: clearMessages ? null : (errorMessage ?? this.errorMessage),
      successMessage: clearMessages ? null : (successMessage ?? this.successMessage),
      exchangingType: clearMessages ? null : (exchangingType ?? this.exchangingType),
    );
  }

  @override
  List<Object?> get props => [
        status,
        activeTab,
        catalog,
        currentPayment,
        paymentStatus,
        transactions,
        errorMessage,
        successMessage,
        exchangingType,
      ];
}

