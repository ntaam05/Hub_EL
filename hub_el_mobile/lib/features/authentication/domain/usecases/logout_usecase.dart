import '../../../../core/network/api_result.dart';
import '../repositories/auth_repository.dart';

class LogoutUseCase {
  final IAuthRepository _repository;

  LogoutUseCase(this._repository);

  Future<ApiResult<void>> call() {
    return _repository.logout();
  }
}

