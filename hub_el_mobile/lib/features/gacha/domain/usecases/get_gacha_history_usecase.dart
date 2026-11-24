import '../../../../core/network/api_result.dart';
import '../entities/gacha_history_entity.dart';
import '../repositories/gacha_repository.dart';

class GetGachaHistoryUseCase {
  final IGachaRepository repository;

  GetGachaHistoryUseCase(this.repository);

  Future<ApiResult<GachaHistoryEntity>> call({int page = 1, int limit = 10}) {
    return repository.getGachaHistory(page: page, limit: limit);
  }
}

