import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_result.dart';
import '../../domain/entities/gacha_exchange_entity.dart';
import '../../domain/entities/gacha_history_entity.dart';
import '../../domain/entities/gacha_roll_result_entity.dart';
import '../../domain/entities/gacha_status_entity.dart';
import '../../domain/usecases/exchange_card_usecase.dart';
import '../../domain/usecases/get_exchange_cards_usecase.dart';
import '../../domain/usecases/get_gacha_history_usecase.dart';
import '../../domain/usecases/get_gacha_status_usecase.dart';
import '../../domain/usecases/roll_gacha_usecase.dart';
import 'gacha_event.dart';
import 'gacha_state.dart';

class GachaBloc extends Bloc<GachaEvent, GachaState> {
  final GetGachaStatusUseCase getGachaStatusUseCase;
  final RollGachaUseCase rollGachaUseCase;
  final GetExchangeCardsUseCase getExchangeCardsUseCase;
  final ExchangeCardUseCase exchangeCardUseCase;
  final GetGachaHistoryUseCase getGachaHistoryUseCase;

  GachaBloc({
    required this.getGachaStatusUseCase,
    required this.rollGachaUseCase,
    required this.getExchangeCardsUseCase,
    required this.exchangeCardUseCase,
    required this.getGachaHistoryUseCase,
  }) : super(const GachaInitial()) {
    on<GachaStatusFetchRequested>(_onStatusFetchRequested);
    on<GachaRollRequested>(_onRollRequested);
    on<GachaAnimationStepChanged>(_onAnimationStepChanged);
    on<GachaResetResultRequested>(_onResetResultRequested);
    on<GachaExchangeDataFetchRequested>(_onExchangeDataFetchRequested);
    on<GachaCardExchangeRequested>(_onCardExchangeRequested);
    on<GachaHistoryFetchRequested>(_onHistoryFetchRequested);
  }

  Future<void> _onStatusFetchRequested(
    GachaStatusFetchRequested event,
    Emitter<GachaState> emit,
  ) async {
    if (state is! GachaLoaded) {
      emit(const GachaLoading(message: 'Đang tải thông tin Cầu Nguyện...'));
    }

    final result = await getGachaStatusUseCase();
    if (result is ApiSuccess<GachaStatusEntity>) {
      if (state is GachaLoaded) {
        emit((state as GachaLoaded).copyWith(status: result.data));
      } else {
        emit(GachaLoaded(status: result.data));
      }
    } else if (result is ApiFailure<GachaStatusEntity>) {
      emit(GachaError(message: result.message, statusCode: result.statusCode));
    }
  }

  Future<void> _onRollRequested(
    GachaRollRequested event,
    Emitter<GachaState> emit,
  ) async {
    final currentState = state;
    if (currentState is! GachaLoaded) return;
    if (currentState.isRolling || currentState.rollState != GachaAnimationState.idle) return;

    // 1. Chuyển sang giai đoạn Drawing (Khung sáng bao quanh thẻ)
    emit(currentState.copyWith(
      isRolling: true,
      rollState: GachaAnimationState.drawing,
      rollCount: event.count,
      clearRollResult: true,
      clearBannerMessage: true,
      clearErrorMessage: true,
    ));

    try {
      final result = await rollGachaUseCase(event.count);

      if (emit.isDone) return;

      if (result is ApiSuccess<GachaRollResultEntity>) {
        final rollData = result.data;
        final newCards = rollData.cards.where((c) => c.isNew).length;
        final dupes = rollData.cards.length - newCards;

        final bannerMsg = rollData.cards.length == 1
            ? (newCards > 0 ? 'Nhận được thẻ mới!' : 'Thẻ trùng lặp (+ Bụi sao)')
            : 'Đã rút ${rollData.cards.length} thẻ: $newCards Mới, $dupes Trùng';

        // Cập nhật lại status theo số dư server trả về
        final updatedStatus = GachaStatusEntity(
          freeCoins: rollData.remainingCoins,
          stardust: rollData.remainingStardust,
          pitySR: rollData.pitySR,
          pitySSR: rollData.pitySSR,
          pityUR: rollData.pityUR,
          isPro: currentState.status.isPro,
          isFreePullAvailable: rollData.usedFreePull ? false : currentState.status.isFreePullAvailable,
          lastFreeGachaDate: rollData.usedFreePull ? DateTime.now() : currentState.status.lastFreeGachaDate,
          rollCost: currentState.status.rollCost,
        );

        // Lưu kết quả trước khi tiếp tục chuyển animation
        emit((state as GachaLoaded).copyWith(
          status: updatedStatus,
          rollResult: rollData,
          bannerMessage: bannerMsg,
        ));

        // 2. Chuyển sang giai đoạn spinning (sau 1.2s drawing)
        await Future.delayed(const Duration(milliseconds: 1200));
        if (!emit.isDone && (state as GachaLoaded).isRolling) {
          emit((state as GachaLoaded).copyWith(
            rollState: GachaAnimationState.spinning,
          ));
        }

        // 3. Chuyển sang giai đoạn revealed (sau 800ms spinning)
        await Future.delayed(const Duration(milliseconds: 800));
        if (!emit.isDone && (state as GachaLoaded).isRolling) {
          emit((state as GachaLoaded).copyWith(
            rollState: GachaAnimationState.revealed,
            isRolling: false,
          ));
        }
      } else if (result is ApiFailure<GachaRollResultEntity>) {
        emit((state as GachaLoaded).copyWith(
          isRolling: false,
          rollState: GachaAnimationState.idle,
          errorMessage: result.message,
        ));
      }
    } catch (e) {
      if (!emit.isDone && state is GachaLoaded) {
        emit((state as GachaLoaded).copyWith(
          isRolling: false,
          rollState: GachaAnimationState.idle,
          errorMessage: 'Lỗi không xác định khi quay thẻ: $e',
        ));
      }
    }
  }

  void _onAnimationStepChanged(
    GachaAnimationStepChanged event,
    Emitter<GachaState> emit,
  ) {
    if (state is GachaLoaded) {
      emit((state as GachaLoaded).copyWith(rollState: event.rollState));
    }
  }

  void _onResetResultRequested(
    GachaResetResultRequested event,
    Emitter<GachaState> emit,
  ) {
    if (state is GachaLoaded) {
      emit((state as GachaLoaded).copyWith(
        rollState: GachaAnimationState.idle,
        clearRollResult: true,
        clearBannerMessage: true,
        clearErrorMessage: true,
        rollCount: 1,
        isRolling: false,
      ));
    }
  }

  Future<void> _onExchangeDataFetchRequested(
    GachaExchangeDataFetchRequested event,
    Emitter<GachaState> emit,
  ) async {
    if (state is! GachaLoaded) return;
    emit((state as GachaLoaded).copyWith(isExchangeLoading: true));

    final result = await getExchangeCardsUseCase();
    if (result is ApiSuccess<GachaExchangeEntity>) {
      emit((state as GachaLoaded).copyWith(
        exchangeData: result.data,
        isExchangeLoading: false,
        // Cập nhật lại stardust hiện tại
        status: (state as GachaLoaded).status.copyWith(stardust: result.data.currentStardust),
      ));
    } else if (result is ApiFailure<GachaExchangeEntity>) {
      emit((state as GachaLoaded).copyWith(
        isExchangeLoading: false,
        errorMessage: result.message,
      ));
    }
  }

  Future<void> _onCardExchangeRequested(
    GachaCardExchangeRequested event,
    Emitter<GachaState> emit,
  ) async {
    if (state is! GachaLoaded) return;
    emit((state as GachaLoaded).copyWith(isExchangeLoading: true, clearErrorMessage: true));

    final result = await exchangeCardUseCase(event.cardId);
    if (result is ApiSuccess<Map<String, dynamic>>) {
      // Tải lại status và danh sách thẻ tiệm đổi
      final statusResult = await getGachaStatusUseCase();
      final exchangeResult = await getExchangeCardsUseCase();

      final updatedStatus = statusResult is ApiSuccess<GachaStatusEntity>
          ? statusResult.data
          : (state as GachaLoaded).status;

      final updatedExchange = exchangeResult is ApiSuccess<GachaExchangeEntity>
          ? exchangeResult.data
          : (state as GachaLoaded).exchangeData;

      emit((state as GachaLoaded).copyWith(
        isExchangeLoading: false,
        status: updatedStatus,
        exchangeData: updatedExchange,
        exchangeMessage: 'Đổi thẻ thành công!',
      ));
    } else if (result is ApiFailure<Map<String, dynamic>>) {
      emit((state as GachaLoaded).copyWith(
        isExchangeLoading: false,
        errorMessage: result.message,
      ));
    }
  }

  Future<void> _onHistoryFetchRequested(
    GachaHistoryFetchRequested event,
    Emitter<GachaState> emit,
  ) async {
    if (state is! GachaLoaded) return;
    emit((state as GachaLoaded).copyWith(isHistoryLoading: true));

    final result = await getGachaHistoryUseCase(page: event.page, limit: event.limit);
    if (result is ApiSuccess<GachaHistoryEntity>) {
      emit((state as GachaLoaded).copyWith(
        historyData: result.data,
        isHistoryLoading: false,
      ));
    } else if (result is ApiFailure<GachaHistoryEntity>) {
      emit((state as GachaLoaded).copyWith(
        isHistoryLoading: false,
        errorMessage: result.message,
      ));
    }
  }
}

extension GachaStatusCopy on GachaStatusEntity {
  GachaStatusEntity copyWith({
    int? freeCoins,
    int? stardust,
    int? pitySR,
    int? pitySSR,
    int? pityUR,
    bool? isPro,
    bool? isFreePullAvailable,
    DateTime? lastFreeGachaDate,
    int? rollCost,
  }) {
    return GachaStatusEntity(
      freeCoins: freeCoins ?? this.freeCoins,
      stardust: stardust ?? this.stardust,
      pitySR: pitySR ?? this.pitySR,
      pitySSR: pitySSR ?? this.pitySSR,
      pityUR: pityUR ?? this.pityUR,
      isPro: isPro ?? this.isPro,
      isFreePullAvailable: isFreePullAvailable ?? this.isFreePullAvailable,
      lastFreeGachaDate: lastFreeGachaDate ?? this.lastFreeGachaDate,
      rollCost: rollCost ?? this.rollCost,
    );
  }
}
