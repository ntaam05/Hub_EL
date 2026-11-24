import '../../../../core/network/api_result.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class GoogleSignInUseCase {
  final IAuthRepository _repository;

  GoogleSignInUseCase(this._repository);

  Future<ApiResult<UserEntity>> call({
    required String email,
    String? name,
    String? image,
    String? idToken,
  }) {
    return _repository.googleSignIn(
      email: email,
      name: name,
      image: image,
      idToken: idToken,
    );
  }
}

