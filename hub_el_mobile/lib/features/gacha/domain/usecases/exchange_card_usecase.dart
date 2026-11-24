import '../../../../core/network/api_result.dart';
import '../repositories/gacha_repository.dart';

class ExchangeCardUseCase {
  final IGachaRepository repository;

  ExchangeCardUseCase(this.repository);

  Future<ApiResult<Map<String, dynamic>>> call(int cardId) {
    if (cardId <= 0) {
      return Future.value(
        const ApiFailure(
          message: 'Mã thẻ bài không hợp lệ',
          statusCode: 400,
        ),
      );
    }
    return repository.exchangeCard(cardId);
  }
}

