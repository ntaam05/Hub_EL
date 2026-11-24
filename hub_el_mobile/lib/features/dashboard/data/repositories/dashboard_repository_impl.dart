import '../../../../core/network/api_result.dart';
import '../../domain/entities/dashboard_entity.dart';
import '../../domain/repositories/dashboard_repository.dart';
import '../datasources/dashboard_remote_data_source.dart';

class DashboardRepositoryImpl implements IDashboardRepository {
  final IDashboardRemoteDataSource remoteDataSource;

  DashboardRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<DashboardDataEntity>> getDashboardData() {
    return remoteDataSource.getDashboardData();
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> claimTaskReward(int taskId) {
    return remoteDataSource.claimTaskReward(taskId);
  }
}

