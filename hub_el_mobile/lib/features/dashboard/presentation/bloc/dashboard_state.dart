import '../../domain/entities/dashboard_entity.dart';

abstract class DashboardState {
  const DashboardState();
}

class DashboardInitial extends DashboardState {
  const DashboardInitial();
}

class DashboardLoading extends DashboardState {
  const DashboardLoading();
}

class DashboardLoaded extends DashboardState {
  final DashboardDataEntity data;
  final int? claimingTaskId;

  const DashboardLoaded({
    required this.data,
    this.claimingTaskId,
  });

  DashboardLoaded copyWith({
    DashboardDataEntity? data,
    int? claimingTaskId,
    bool clearClaiming = false,
  }) {
    return DashboardLoaded(
      data: data ?? this.data,
      claimingTaskId: clearClaiming ? null : (claimingTaskId ?? this.claimingTaskId),
    );
  }
}

class DashboardRewardClaimed extends DashboardState {
  final int xpDelta;
  final int coinsDelta;
  final DashboardDataEntity updatedData;

  const DashboardRewardClaimed({
    required this.xpDelta,
    required this.coinsDelta,
    required this.updatedData,
  });
}

class DashboardFailure extends DashboardState {
  final String message;
  const DashboardFailure(this.message);
}

