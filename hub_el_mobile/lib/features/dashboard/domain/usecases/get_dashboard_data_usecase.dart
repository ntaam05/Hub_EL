import '../../../../core/network/api_result.dart';
import '../entities/dashboard_entity.dart';
import '../repositories/dashboard_repository.dart';

class GetDashboardDataUseCase {
  final IDashboardRepository repository;

  GetDashboardDataUseCase(this.repository);

  Future<ApiResult<DashboardDataEntity>> call() {
    return repository.getDashboardData();
  }
}

