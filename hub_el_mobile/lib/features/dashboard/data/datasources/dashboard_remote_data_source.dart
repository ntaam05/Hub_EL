import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/dashboard_model.dart';

abstract class IDashboardRemoteDataSource {
  Future<ApiResult<DashboardDataModel>> getDashboardData();
  Future<ApiResult<Map<String, dynamic>>> claimTaskReward(int taskId);
}

class DashboardRemoteDataSource implements IDashboardRemoteDataSource {
  final DioClient dioClient;

  DashboardRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<DashboardDataModel>> getDashboardData() async {
    return dioClient.get<DashboardDataModel>(
      ApiEndpoints.dashboard,
      fromJson: (json) => DashboardDataModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> claimTaskReward(int taskId) async {
    return dioClient.post<Map<String, dynamic>>(
      ApiEndpoints.claimTaskReward(taskId),
      fromJson: (json) => json as Map<String, dynamic>,
    );
  }
}

