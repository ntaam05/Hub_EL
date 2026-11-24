import '../../../../core/network/api_result.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class RegisterUseCase {
  final IAuthRepository _repository;

  RegisterUseCase(this._repository);

  Future<ApiResult<UserEntity>> call({
    required String email,
    required String password,
    required String name,
    String? code,
  }) {
    return _repository.register(
      email: email,
      password: password,
      name: name,
      code: code,
    );
  }

  Future<ApiResult<void>> sendOtp({required String email}) {
    return _repository.sendRegisterOtp(email: email);
  }
}

