import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_result.dart';
import '../../domain/entities/achievement_entities.dart';
import '../../domain/usecases/get_achievements_usecase.dart';
import 'achievements_state.dart';

class AchievementsCubit extends Cubit<AchievementsState> {
  final GetAchievementsUseCase getAchievementsUseCase;

  AchievementsCubit({required this.getAchievementsUseCase})
      : super(const AchievementsState());

  /// Tải dữ liệu thành tựu từ Backend API
  Future<void> loadAchievements({bool showLoading = true}) async {
    if (showLoading) {
      emit(state.copyWith(
        status: AchievementsStatus.loading,
        clearErrorMessage: true,
      ));
    }

    final result = await getAchievementsUseCase();
    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(
          status: AchievementsStatus.loaded,
          data: data,
          showCelebration: data.hasEarnedRewards,
          clearErrorMessage: true,
        ));
      case ApiFailure(:final message):
        emit(state.copyWith(
          status: AchievementsStatus.error,
          errorMessage: message,
        ));
    }
  }

  /// Lọc theo nhóm (Group)
  void filterByGroup(String? groupId) {
    if (state.selectedGroup == groupId) {
      emit(state.copyWith(clearSelectedGroup: true));
    } else {
      emit(state.copyWith(selectedGroup: groupId));
    }
  }

  /// Lọc theo cấp bậc (Tier 1-6)
  void filterByTier(int? tier) {
    if (state.selectedTier == tier) {
      emit(state.copyWith(clearSelectedTier: true));
    } else {
      emit(state.copyWith(selectedTier: tier));
    }
  }

  /// Lọc theo trạng thái hoàn thành (Tất cả / Đã mở khóa / Đang làm)
  void setFilterStatus(AchievementFilterStatus status) {
    emit(state.copyWith(filterStatus: status));
  }

  /// Tìm kiếm theo từ khóa
  void setSearchQuery(String query) {
    emit(state.copyWith(searchQuery: query));
  }

  /// Chọn xem chi tiết một thành tựu
  void selectAchievement(AchievementItemEntity? achievement) {
    if (achievement == null) {
      emit(state.copyWith(clearSelectedAchievement: true));
    } else {
      emit(state.copyWith(selectedAchievement: achievement));
    }
  }

  /// Đóng popup chúc mừng nhận thưởng
  void dismissCelebration() {
    emit(state.copyWith(showCelebration: false));
  }

  /// Đặt lại toàn bộ bộ lọc
  void resetFilters() {
    emit(state.copyWith(
      clearSelectedGroup: true,
      clearSelectedTier: true,
      filterStatus: AchievementFilterStatus.all,
      searchQuery: '',
    ));
  }
}

