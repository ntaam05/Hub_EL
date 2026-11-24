import '../../../../core/network/api_result.dart';
import '../entities/gacha_status_entity.dart';
import '../repositories/gacha_repository.dart';

class GetGachaStatusUseCase {
  final IGachaRepository repository;

  GetGachaStatusUseCase(this.repository);

  Future<ApiResult<GachaStatusEntity>> call() {
    return repository.getGachaStatus();
  }
}

