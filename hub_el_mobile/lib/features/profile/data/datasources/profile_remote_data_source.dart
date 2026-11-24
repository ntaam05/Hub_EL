import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../../domain/entities/user_profile_entity.dart';
import '../models/user_profile_model.dart';

abstract class ProfileRemoteDataSource {
  Future<ApiResult<UserProfileModel>> getProfile();
  Future<ApiResult<UserProfileModel>> updateProfile(UpdateProfileRequest request);
  Future<ApiResult<String>> updateAvatar(String base64Image);
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final DioClient dioClient;

  ProfileRemoteDataSourceImpl({required this.dioClient});

  @override
  Future<ApiResult<UserProfileModel>> getProfile() async {
    return dioClient.get<UserProfileModel>(
      ApiEndpoints.settingsProfile,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json.containsKey('data') && json['data'] is Map<String, dynamic>
              ? json['data'] as Map<String, dynamic>
              : json;
          return UserProfileModel.fromJson(data);
        }
        throw Exception('Phản hồi hồ sơ không hợp lệ.');
      },
    );
  }

  @override
  Future<ApiResult<UserProfileModel>> updateProfile(UpdateProfileRequest request) async {
    return dioClient.patch<UserProfileModel>(
      ApiEndpoints.settingsProfile,
      data: request.toJson(),
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json.containsKey('data') && json['data'] is Map<String, dynamic>
              ? json['data'] as Map<String, dynamic>
              : json;
          return UserProfileModel.fromJson(data);
        }
        throw Exception('Phản hồi cập nhật hồ sơ không hợp lệ.');
      },
    );
  }

  @override
  Future<ApiResult<String>> updateAvatar(String base64Image) async {
    return dioClient.post<String>(
      ApiEndpoints.settingsAvatar,
      data: {'image': base64Image},
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Cập nhật ảnh đại diện thành công!';
        }
        return 'Cập nhật ảnh đại diện thành công!';
      },
    );
  }
}
