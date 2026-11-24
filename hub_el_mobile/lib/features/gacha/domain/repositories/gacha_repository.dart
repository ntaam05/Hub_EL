import '../../../../core/network/api_result.dart';
import '../entities/gacha_exchange_entity.dart';
import '../entities/gacha_history_entity.dart';
import '../entities/gacha_roll_result_entity.dart';
import '../entities/gacha_status_entity.dart';

abstract class IGachaRepository {
  Future<ApiResult<GachaStatusEntity>> getGachaStatus();

  Future<ApiResult<GachaRollResultEntity>> rollGacha(int count);

  Future<ApiResult<GachaExchangeEntity>> getExchangeCards();

  Future<ApiResult<Map<String, dynamic>>> exchangeCard(int cardId);

  Future<ApiResult<GachaHistoryEntity>> getGachaHistory({int page = 1, int limit = 10});
}

