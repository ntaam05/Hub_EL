import '../../../../core/network/api_result.dart';
import '../entities/leaderboard_entity.dart';
import '../repositories/leaderboard_repository.dart';

class GetLeaderboardUseCase {
  final ILeaderboardRepository repository;

  GetLeaderboardUseCase(this.repository);

  Future<ApiResult<LeaderboardDataEntity>> call({
    required LeaderboardCategoryType category,
    required LeaderboardTimeframeType timeframe,
  }) {
    return repository.getLeaderboard(
      category: category,
      timeframe: timeframe,
    );
  }
}

