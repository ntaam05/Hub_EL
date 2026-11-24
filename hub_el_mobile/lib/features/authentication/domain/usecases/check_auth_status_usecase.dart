import '../../../../core/network/api_result.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class CheckAuthStatusUseCase {
  final IAuthRepository _repository;

  CheckAuthStatusUseCase(this._repository);

  Future<ApiResult<UserEntity?>> call() async {
    final hasToken = await _repository.isAuthenticated();
    if (!hasToken) {
      return const ApiSuccess<UserEntity?>(null);
    }

    final userResult = await _repository.getCurrentUser();
    return userResult.fold(
      onSuccess: (user, msg) => ApiSuccess<UserEntity?>(user, message: msg),
      onFailure: (failure) => ApiFailure<UserEntity?>(
        message: failure.message,
        statusCode: failure.statusCode,
        code: failure.code,
        details: failure.details,
      ),
    );
  }
}

