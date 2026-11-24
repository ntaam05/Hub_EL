import '../../../../core/network/api_result.dart';
import '../entities/achievement_entities.dart';
import '../repositories/achievements_repository.dart';

class GetAchievementsUseCase {
  final IAchievementsRepository repository;

  GetAchievementsUseCase({required this.repository});

  Future<ApiResult<AchievementsDataEntity>> call() {
    return repository.getAchievements();
  }
}

