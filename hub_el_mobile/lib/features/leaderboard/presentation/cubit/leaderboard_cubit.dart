import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_result.dart';
import '../../domain/entities/leaderboard_entity.dart';
import '../../domain/usecases/get_leaderboard_use_case.dart';
import 'leaderboard_state.dart';

class LeaderboardCubit extends Cubit<LeaderboardState> {
  final GetLeaderboardUseCase getLeaderboardUseCase;

  LeaderboardCubit({required this.getLeaderboardUseCase})
      : super(const LeaderboardState());

  /// Tải dữ liệu bảng xếp hạng
  Future<void> loadLeaderboard({
    LeaderboardCategoryType? category,
    LeaderboardTimeframeType? timeframe,
    bool refresh = false,
  }) async {
    final targetCategory = category ?? state.selectedCategory;
    final targetTimeframe = timeframe ?? state.selectedTimeframe;

    if (!refresh &&
        state.data != null &&
        state.selectedCategory == targetCategory &&
        state.selectedTimeframe == targetTimeframe &&
        !state.isLoading) {
      return;
    }

    emit(state.copyWith(
      selectedCategory: targetCategory,
      selectedTimeframe: targetTimeframe,
      isLoading: true,
      clearError: true,
    ));

    final result = await getLeaderboardUseCase(
      category: targetCategory,
      timeframe: targetTimeframe,
    );

    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(
          data: data,
          isLoading: false,
          clearError: true,
        ));
      case ApiFailure(:final message):
        emit(state.copyWith(
          isLoading: false,
          errorMessage: message,
        ));
    }
  }

  /// Chuyển danh mục
  void selectCategory(LeaderboardCategoryType category) {
    if (state.selectedCategory == category) return;
    loadLeaderboard(category: category);
  }

  /// Chuyển mốc thời gian
  void selectTimeframe(LeaderboardTimeframeType timeframe) {
    if (state.selectedTimeframe == timeframe) return;
    loadLeaderboard(timeframe: timeframe);
  }

  /// Làm mới dữ liệu
  Future<void> refresh() async {
    await loadLeaderboard(refresh: true);
  }
}

