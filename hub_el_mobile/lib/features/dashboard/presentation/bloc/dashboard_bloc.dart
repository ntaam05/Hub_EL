import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/dashboard_entity.dart';
import '../../domain/usecases/claim_task_reward_usecase.dart';
import '../../domain/usecases/get_dashboard_data_usecase.dart';
import 'dashboard_event.dart';
import 'dashboard_state.dart';

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final GetDashboardDataUseCase getDashboardDataUseCase;
  final ClaimTaskRewardUseCase claimTaskRewardUseCase;

  DashboardBloc({
    required this.getDashboardDataUseCase,
    required this.claimTaskRewardUseCase,
  }) : super(const DashboardInitial()) {
    on<DashboardFetchRequested>(_onFetchRequested);
    on<DashboardClaimTaskRequested>(_onClaimTaskRequested);
  }

  Future<void> _onFetchRequested(
    DashboardFetchRequested event,
    Emitter<DashboardState> emit,
  ) async {
    if (!event.isRefresh) {
      emit(const DashboardLoading());
    }

    final result = await getDashboardDataUseCase();
    result.fold(
      onSuccess: (data, _) => emit(DashboardLoaded(data: data)),
      onFailure: (failure) => emit(DashboardFailure(failure.message)),
    );
  }

  Future<void> _onClaimTaskRequested(
    DashboardClaimTaskRequested event,
    Emitter<DashboardState> emit,
  ) async {
    final currentState = state;
    if (currentState is! DashboardLoaded) return;

    emit(currentState.copyWith(claimingTaskId: event.taskId));

    final result = await claimTaskRewardUseCase(event.taskId);

    result.fold(
      onSuccess: (resData, _) {
        final xpDelta = (resData['xpDelta'] as num?)?.toInt() ?? 0;
        final coinsDelta = (resData['coinsDelta'] as num?)?.toInt() ?? 0;

        // Cập nhật trạng thái nhiệm vụ thành isClaimed: true
        final updatedTasks = currentState.data.dailyTasks.map((task) {
          if (task.id == event.taskId) {
            return DailyTaskEntity(
              id: task.id,
              taskId: task.taskId,
              current: task.current,
              isClaimed: true,
              taskDesc: task.taskDesc,
              taskType: task.taskType,
              target: task.target,
              rewardCoins: task.rewardCoins,
              rewardXp: task.rewardXp,
              isProOnly: task.isProOnly,
            );
          }
          return task;
        }).toList();

        final updatedData = DashboardDataEntity(
          streak: currentState.data.streak,
          highestStreak: currentState.data.highestStreak,
          completedVideosCount: currentState.data.completedVideosCount,
          continueLearning: currentState.data.continueLearning,
          dailyTasks: updatedTasks,
          recommendedVideos: currentState.data.recommendedVideos,
          favoriteVideos: currentState.data.favoriteVideos,
          recentActivities: currentState.data.recentActivities,
        );

        emit(DashboardRewardClaimed(
          xpDelta: xpDelta,
          coinsDelta: coinsDelta,
          updatedData: updatedData,
        ));

        emit(DashboardLoaded(data: updatedData));
      },
      onFailure: (failure) {
        emit(currentState.copyWith(clearClaiming: true));
        emit(DashboardFailure(failure.message));
        emit(currentState);
      },
    );
  }
}

