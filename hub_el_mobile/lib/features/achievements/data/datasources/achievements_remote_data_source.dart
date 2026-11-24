import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/achievement_models.dart';

abstract class IAchievementsRemoteDataSource {
  Future<ApiResult<AchievementsDataModel>> getAchievements();
}

class AchievementsRemoteDataSource implements IAchievementsRemoteDataSource {
  final DioClient dioClient;

  AchievementsRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<AchievementsDataModel>> getAchievements() async {
    return dioClient.get<AchievementsDataModel>(
      ApiEndpoints.achievements,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json['data'] ?? json;
          return AchievementsDataModel.fromJson(data as Map<String, dynamic>);
        }
        throw Exception('Dữ liệu Thành Tựu không đúng định dạng');
      },
    );
  }
}

