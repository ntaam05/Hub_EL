import '../../../../core/network/api_result.dart';
import '../entities/gacha_roll_result_entity.dart';
import '../repositories/gacha_repository.dart';

class RollGachaUseCase {
  final IGachaRepository repository;

  RollGachaUseCase(this.repository);

  Future<ApiResult<GachaRollResultEntity>> call(int count) {
    if (count < 1 || count > 5) {
      return Future.value(
        const ApiFailure(
          message: 'Số lượt quay không hợp lệ (chỉ chấp nhận từ 1 đến 5)',
          statusCode: 400,
        ),
      );
    }
    return repository.rollGacha(count);
  }
}

