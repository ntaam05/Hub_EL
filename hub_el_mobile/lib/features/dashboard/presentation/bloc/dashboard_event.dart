abstract class DashboardEvent {
  const DashboardEvent();
}

class DashboardFetchRequested extends DashboardEvent {
  final bool isRefresh;
  const DashboardFetchRequested({this.isRefresh = false});
}

class DashboardClaimTaskRequested extends DashboardEvent {
  final int taskId;
  const DashboardClaimTaskRequested(this.taskId);
}

