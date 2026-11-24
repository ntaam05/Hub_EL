import '../../../../core/network/api_result.dart';
import '../../domain/entities/achievement_entities.dart';
import '../../domain/repositories/achievements_repository.dart';
import '../datasources/achievements_remote_data_source.dart';

class AchievementsRepositoryImpl implements IAchievementsRepository {
  final IAchievementsRemoteDataSource remoteDataSource;

  AchievementsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<AchievementsDataEntity>> getAchievements() {
    return remoteDataSource.getAchievements();
  }
}

