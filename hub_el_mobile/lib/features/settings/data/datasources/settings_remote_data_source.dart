import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/settings_models.dart';

abstract class SettingsRemoteDataSource {
  Future<ApiResult<SecurityInfoModel>> getSecurityInfo();
  Future<ApiResult<String>> sendOtp();
  Future<ApiResult<String>> verifyOtp(String code);
  Future<ApiResult<String>> changePassword(String oldPassword, String newPassword);
  Future<ApiResult<String>> resetPassword(String code, String newPassword);
  Future<ApiResult<PrivacySettingsModel>> getPrivacySettings();
  Future<ApiResult<String>> updatePrivacySettings(Map<String, dynamic> data);
  Future<ApiResult<NotificationSettingsModel>> getNotificationSettings();
  Future<ApiResult<String>> updateNotificationSettings(Map<String, dynamic> data);
  Future<ApiResult<String>> submitFeedback(String content, {String? category});
  Future<ApiResult<String>> deleteAccount();
  Future<ApiResult<List<String>>> getInterestTags();
}

class SettingsRemoteDataSourceImpl implements SettingsRemoteDataSource {
  final DioClient dioClient;

  SettingsRemoteDataSourceImpl({required this.dioClient});

  @override
  Future<ApiResult<SecurityInfoModel>> getSecurityInfo() async {
    return dioClient.get<SecurityInfoModel>(
      ApiEndpoints.settingsSecurity,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json.containsKey('data') && json['data'] is Map<String, dynamic>
              ? json['data'] as Map<String, dynamic>
              : json;
          return SecurityInfoModel.fromJson(data);
        }
        throw Exception('Phản hồi thông tin bảo mật không hợp lệ.');
      },
    );
  }

  @override
  Future<ApiResult<String>> sendOtp() async {
    return dioClient.post<String>(
      ApiEndpoints.settingsSendOtp,
      data: {},
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Đã gửi mã xác thực qua Email.';
        }
        return 'Đã gửi mã xác thực qua Email.';
      },
    );
  }

  @override
  Future<ApiResult<String>> verifyOtp(String code) async {
    return dioClient.post<String>(
      ApiEndpoints.settingsVerifyOtp,
      data: {'code': code.trim()},
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Xác thực mã OTP thành công!';
        }
        return 'Xác thực mã OTP thành công!';
      },
    );
  }

  @override
  Future<ApiResult<String>> changePassword(String oldPassword, String newPassword) async {
    return dioClient.post<String>(
      ApiEndpoints.settingsChangePassword,
      data: {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      },
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Đổi mật khẩu thành công!';
        }
        return 'Đổi mật khẩu thành công!';
      },
    );
  }

  @override
  Future<ApiResult<String>> resetPassword(String code, String newPassword) async {
    return dioClient.post<String>(
      ApiEndpoints.settingsResetPassword,
      data: {
        'code': code.trim(),
        'newPassword': newPassword,
      },
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Đặt lại mật khẩu thành công!';
        }
        return 'Đặt lại mật khẩu thành công!';
      },
    );
  }

  @override
  Future<ApiResult<PrivacySettingsModel>> getPrivacySettings() async {
    return dioClient.get<PrivacySettingsModel>(
      ApiEndpoints.settingsPrivacy,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json.containsKey('data') && json['data'] is Map<String, dynamic>
              ? json['data'] as Map<String, dynamic>
              : json;
          return PrivacySettingsModel.fromJson(data);
        }
        throw Exception('Phản hồi cài đặt quyền riêng tư không hợp lệ.');
      },
    );
  }

  @override
  Future<ApiResult<String>> updatePrivacySettings(Map<String, dynamic> data) async {
    return dioClient.patch<String>(
      ApiEndpoints.settingsPrivacy,
      data: data,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Đã lưu cài đặt quyền riêng tư!';
        }
        return 'Đã lưu cài đặt quyền riêng tư!';
      },
    );
  }

  @override
  Future<ApiResult<NotificationSettingsModel>> getNotificationSettings() async {
    return dioClient.get<NotificationSettingsModel>(
      ApiEndpoints.settingsNotifications,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          final data = json.containsKey('data') && json['data'] is Map<String, dynamic>
              ? json['data'] as Map<String, dynamic>
              : json;
          return NotificationSettingsModel.fromJson(data);
        }
        throw Exception('Phản hồi cài đặt thông báo không hợp lệ.');
      },
    );
  }

  @override
  Future<ApiResult<String>> updateNotificationSettings(Map<String, dynamic> data) async {
    return dioClient.patch<String>(
      ApiEndpoints.settingsNotifications,
      data: data,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Đã lưu cài đặt thông báo!';
        }
        return 'Đã lưu cài đặt thông báo!';
      },
    );
  }

  @override
  Future<ApiResult<String>> submitFeedback(String content, {String? category}) async {
    final body = <String, dynamic>{'content': content.trim()};
    if (category != null && category.trim().isNotEmpty) {
      body['category'] = category.trim();
    }
    return dioClient.post<String>(
      ApiEndpoints.feedback,
      data: body,
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Cảm ơn bạn đã đóng góp ý kiến!';
        }
        return 'Cảm ơn bạn đã đóng góp ý kiến!';
      },
    );
  }

  @override
  Future<ApiResult<String>> deleteAccount() async {
    return dioClient.post<String>(
      ApiEndpoints.settingsDeleteAccount,
      data: {},
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return json['message']?.toString() ?? 'Tài khoản đã được xóa vĩnh viễn!';
        }
        return 'Tài khoản đã được xóa vĩnh viễn!';
      },
    );
  }

  @override
  Future<ApiResult<List<String>>> getInterestTags() async {
    return dioClient.get<List<String>>(
      ApiEndpoints.settingsInterests,
      fromJson: (json) {
        if (json is Map<String, dynamic> && json['data'] is List) {
          return (json['data'] as List).map((e) => e.toString()).toList();
        } else if (json is List) {
          return json.map((e) => e.toString()).toList();
        }
        return <String>[];
      },
    );
  }
}
