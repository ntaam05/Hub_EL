import '../../../../core/network/api_result.dart';
import '../entities/user_profile_entity.dart';

abstract class ProfileRepository {
  /// Lấy thông tin chi tiết hồ sơ cá nhân
  Future<ApiResult<UserProfileEntity>> getProfile();

  /// Cập nhật thông tin cá nhân (họ tên, username, bio, sở thích)
  Future<ApiResult<UserProfileEntity>> updateProfile(UpdateProfileRequest request);

  /// Cập nhật ảnh đại diện (Base64 data URI)
  Future<ApiResult<String>> updateAvatar(String base64Image);
}

