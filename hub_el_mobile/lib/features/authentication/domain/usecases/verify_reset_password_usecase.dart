import '../../../../core/network/api_result.dart';
import '../repositories/auth_repository.dart';

class VerifyResetPasswordUseCase {
  final IAuthRepository _repository;

  VerifyResetPasswordUseCase(this._repository);

  Future<ApiResult<void>> call({
    required String email,
    required String code,
    required String newPassword,
  }) {
    return _repository.verifyResetPassword(
      email: email,
      code: code,
      newPassword: newPassword,
    );
  }
}

