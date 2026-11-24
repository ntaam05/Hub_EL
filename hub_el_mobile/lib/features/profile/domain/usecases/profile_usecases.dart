import '../../../../core/network/api_result.dart';
import '../entities/user_profile_entity.dart';
import '../repositories/profile_repository.dart';

class GetProfileUseCase {
  final ProfileRepository repository;
  const GetProfileUseCase(this.repository);

  Future<ApiResult<UserProfileEntity>> call() => repository.getProfile();
}

class UpdateProfileUseCase {
  final ProfileRepository repository;
  const UpdateProfileUseCase(this.repository);

  Future<ApiResult<UserProfileEntity>> call(UpdateProfileRequest request) =>
      repository.updateProfile(request);
}

class UpdateAvatarUseCase {
  final ProfileRepository repository;
  const UpdateAvatarUseCase(this.repository);

  Future<ApiResult<String>> call(String base64Image) =>
      repository.updateAvatar(base64Image);
}

