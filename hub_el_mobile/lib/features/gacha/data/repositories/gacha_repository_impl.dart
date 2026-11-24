import '../../../../core/network/api_result.dart';
import '../../domain/entities/gacha_exchange_entity.dart';
import '../../domain/entities/gacha_history_entity.dart';
import '../../domain/entities/gacha_roll_result_entity.dart';
import '../../domain/entities/gacha_status_entity.dart';
import '../../domain/repositories/gacha_repository.dart';
import '../datasources/gacha_remote_data_source.dart';

class GachaRepositoryImpl implements IGachaRepository {
  final IGachaRemoteDataSource remoteDataSource;

  GachaRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<GachaStatusEntity>> getGachaStatus() async {
    final result = await remoteDataSource.getGachaStatus();
    if (result is ApiSuccess) {
      return ApiSuccess((result as ApiSuccess).data);
    } else {
      final failure = result as ApiFailure;
      return ApiFailure(message: failure.message, statusCode: failure.statusCode);
    }
  }

  @override
  Future<ApiResult<GachaRollResultEntity>> rollGacha(int count) async {
    final result = await remoteDataSource.rollGacha(count);
    if (result is ApiSuccess) {
      return ApiSuccess((result as ApiSuccess).data);
    } else {
      final failure = result as ApiFailure;
      return ApiFailure(message: failure.message, statusCode: failure.statusCode);
    }
  }

  @override
  Future<ApiResult<GachaExchangeEntity>> getExchangeCards() async {
    final result = await remoteDataSource.getExchangeCards();
    if (result is ApiSuccess) {
      return ApiSuccess((result as ApiSuccess).data);
    } else {
      final failure = result as ApiFailure;
      return ApiFailure(message: failure.message, statusCode: failure.statusCode);
    }
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> exchangeCard(int cardId) async {
    final result = await remoteDataSource.exchangeCard(cardId);
    if (result is ApiSuccess) {
      return ApiSuccess((result as ApiSuccess).data);
    } else {
      final failure = result as ApiFailure;
      return ApiFailure(message: failure.message, statusCode: failure.statusCode);
    }
  }

  @override
  Future<ApiResult<GachaHistoryEntity>> getGachaHistory({int page = 1, int limit = 10}) async {
    final result = await remoteDataSource.getGachaHistory(page: page, limit: limit);
    if (result is ApiSuccess) {
      return ApiSuccess((result as ApiSuccess).data);
    } else {
      final failure = result as ApiFailure;
      return ApiFailure(message: failure.message, statusCode: failure.statusCode);
    }
  }
}

