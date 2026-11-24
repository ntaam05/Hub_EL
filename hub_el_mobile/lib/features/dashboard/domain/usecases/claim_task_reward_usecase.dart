import '../../../../core/network/api_result.dart';
import '../repositories/dashboard_repository.dart';

class ClaimTaskRewardUseCase {
  final IDashboardRepository repository;

  ClaimTaskRewardUseCase(this.repository);

  Future<ApiResult<Map<String, dynamic>>> call(int taskId) {
    return repository.claimTaskReward(taskId);
  }
}

