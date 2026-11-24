import 'package:equatable/equatable.dart';
import '../../domain/entities/gacha_exchange_entity.dart';
import '../../domain/entities/gacha_history_entity.dart';
import '../../domain/entities/gacha_roll_result_entity.dart';
import '../../domain/entities/gacha_status_entity.dart';
import 'gacha_event.dart';

abstract class GachaState extends Equatable {
  const GachaState();

  @override
  List<Object?> get props => [];
}

class GachaInitial extends GachaState {
  const GachaInitial();
}

class GachaLoading extends GachaState {
  final String? message;

  const GachaLoading({this.message});

  @override
  List<Object?> get props => [message];
}

class GachaLoaded extends GachaState {
  final GachaStatusEntity status;
  final GachaAnimationState rollState;
  final GachaRollResultEntity? rollResult;
  final int rollCount;
  final String? bannerMessage;
  final String? errorMessage;
  final bool isRolling;

  // Sub-feature states (Exchange, History)
  final GachaExchangeEntity? exchangeData;
  final bool isExchangeLoading;
  final String? exchangeMessage;

  final GachaHistoryEntity? historyData;
  final bool isHistoryLoading;

  const GachaLoaded({
    required this.status,
    this.rollState = GachaAnimationState.idle,
    this.rollResult,
    this.rollCount = 1,
    this.bannerMessage,
    this.errorMessage,
    this.isRolling = false,
    this.exchangeData,
    this.isExchangeLoading = false,
    this.exchangeMessage,
    this.historyData,
    this.isHistoryLoading = false,
  });

  GachaLoaded copyWith({
    GachaStatusEntity? status,
    GachaAnimationState? rollState,
    GachaRollResultEntity? rollResult,
    bool clearRollResult = false,
    int? rollCount,
    String? bannerMessage,
    bool clearBannerMessage = false,
    String? errorMessage,
    bool clearErrorMessage = false,
    bool? isRolling,
    GachaExchangeEntity? exchangeData,
    bool? isExchangeLoading,
    String? exchangeMessage,
    bool clearExchangeMessage = false,
    GachaHistoryEntity? historyData,
    bool? isHistoryLoading,
  }) {
    return GachaLoaded(
      status: status ?? this.status,
      rollState: rollState ?? this.rollState,
      rollResult: clearRollResult ? null : (rollResult ?? this.rollResult),
      rollCount: rollCount ?? this.rollCount,
      bannerMessage: clearBannerMessage ? null : (bannerMessage ?? this.bannerMessage),
      errorMessage: clearErrorMessage ? null : (errorMessage ?? this.errorMessage),
      isRolling: isRolling ?? this.isRolling,
      exchangeData: exchangeData ?? this.exchangeData,
      isExchangeLoading: isExchangeLoading ?? this.isExchangeLoading,
      exchangeMessage: clearExchangeMessage ? null : (exchangeMessage ?? this.exchangeMessage),
      historyData: historyData ?? this.historyData,
      isHistoryLoading: isHistoryLoading ?? this.isHistoryLoading,
    );
  }

  @override
  List<Object?> get props => [
        status,
        rollState,
        rollResult,
        rollCount,
        bannerMessage,
        errorMessage,
        isRolling,
        exchangeData,
        isExchangeLoading,
        exchangeMessage,
        historyData,
        isHistoryLoading,
      ];
}

class GachaError extends GachaState {
  final String message;
  final int? statusCode;

  const GachaError({required this.message, this.statusCode});

  @override
  List<Object?> get props => [message, statusCode];
}

