import '../../../../core/network/api_result.dart';
import '../entities/leaderboard_entity.dart';

abstract class ILeaderboardRepository {
  Future<ApiResult<LeaderboardDataEntity>> getLeaderboard({
    required LeaderboardCategoryType category,
    required LeaderboardTimeframeType timeframe,
  });
}

