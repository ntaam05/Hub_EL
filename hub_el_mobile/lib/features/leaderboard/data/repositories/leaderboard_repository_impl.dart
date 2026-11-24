import '../../../../core/network/api_result.dart';
import '../../domain/entities/leaderboard_entity.dart';
import '../../domain/repositories/leaderboard_repository.dart';
import '../datasources/leaderboard_remote_data_source.dart';

class LeaderboardRepositoryImpl implements ILeaderboardRepository {
  final ILeaderboardRemoteDataSource remoteDataSource;

  LeaderboardRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<LeaderboardDataEntity>> getLeaderboard({
    required LeaderboardCategoryType category,
    required LeaderboardTimeframeType timeframe,
  }) async {
    return await remoteDataSource.getLeaderboard(
      category: category.code,
      range: timeframe.code,
    );
  }
}

