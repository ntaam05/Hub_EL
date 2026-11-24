import '../../../../core/network/api_result.dart';
import '../../domain/entities/user_profile_entity.dart';
import '../../domain/repositories/profile_repository.dart';
import '../datasources/profile_remote_data_source.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource remoteDataSource;

  ProfileRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<UserProfileEntity>> getProfile() async {
    final result = await remoteDataSource.getProfile();
    return result.fold(
      onSuccess: (model, message) => ApiSuccess(model, message: message),
      onFailure: (failure) => ApiFailure(message: failure.message, code: failure.code),
    );
  }

  @override
  Future<ApiResult<UserProfileEntity>> updateProfile(UpdateProfileRequest request) async {
    final result = await remoteDataSource.updateProfile(request);
    return result.fold(
      onSuccess: (model, message) => ApiSuccess(model, message: message),
      onFailure: (failure) => ApiFailure(message: failure.message, code: failure.code),
    );
  }

  @override
  Future<ApiResult<String>> updateAvatar(String base64Image) async {
    return remoteDataSource.updateAvatar(base64Image);
  }
}
