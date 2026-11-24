import '../../../../core/network/api_result.dart';
import '../repositories/auth_repository.dart';

class ForgotPasswordUseCase {
  final IAuthRepository _repository;

  ForgotPasswordUseCase(this._repository);

  Future<ApiResult<void>> call({required String email}) {
    return _repository.forgotPassword(email: email);
  }
}

