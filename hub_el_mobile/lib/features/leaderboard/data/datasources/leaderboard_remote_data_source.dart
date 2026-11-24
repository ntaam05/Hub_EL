import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/leaderboard_model.dart';

abstract class ILeaderboardRemoteDataSource {
  Future<ApiResult<LeaderboardDataModel>> getLeaderboard({
    required String category,
    required String range,
  });
}

class LeaderboardRemoteDataSource implements ILeaderboardRemoteDataSource {
  final DioClient dioClient;

  LeaderboardRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<LeaderboardDataModel>> getLeaderboard({
    required String category,
    required String range,
  }) async {
    return dioClient.get<LeaderboardDataModel>(
      ApiEndpoints.leaderboard,
      queryParameters: {
        'category': category,
        'range': range,
      },
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return LeaderboardDataModel.fromJson(json);
        }
        throw Exception('Phản hồi dữ liệu bảng xếp hạng không đúng định dạng');
      },
    );
  }
}

