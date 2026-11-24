import '../../../../core/network/api_result.dart';
import '../entities/dashboard_entity.dart';

abstract class IDashboardRepository {
  Future<ApiResult<DashboardDataEntity>> getDashboardData();
  Future<ApiResult<Map<String, dynamic>>> claimTaskReward(int taskId);
}

