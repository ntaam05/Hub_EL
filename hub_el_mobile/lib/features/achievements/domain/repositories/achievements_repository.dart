import '../../../../core/network/api_result.dart';
import '../entities/achievement_entities.dart';

abstract class IAchievementsRepository {
  Future<ApiResult<AchievementsDataEntity>> getAchievements();
}

