import '../../../../core/network/api_result.dart';
import '../entities/gacha_exchange_entity.dart';
import '../repositories/gacha_repository.dart';

class GetExchangeCardsUseCase {
  final IGachaRepository repository;

  GetExchangeCardsUseCase(this.repository);

  Future<ApiResult<GachaExchangeEntity>> call() {
    return repository.getExchangeCards();
  }
}

