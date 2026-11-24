import '../../../../core/network/api_result.dart';
import '../entities/settings_entities.dart';

abstract class SettingsRepository {
  /// Lấy thông tin trạng thái bảo mật
  Future<ApiResult<SecurityInfoEntity>> getSecurityInfo();

  /// Gửi mã xác thực OTP qua email
  Future<ApiResult<String>> sendOtp();

  /// Xác thực mã OTP 6 số
  Future<ApiResult<String>> verifyOtp(String code);

  /// Đổi mật khẩu tài khoản
  Future<ApiResult<String>> changePassword(String oldPassword, String newPassword);

  /// Đặt lại mật khẩu bằng mã OTP đã xác thực
  Future<ApiResult<String>> resetPassword(String code, String newPassword);

  /// Lấy cấu hình quyền riêng tư
  Future<ApiResult<PrivacySettingsEntity>> getPrivacySettings();

  /// Cập nhật cấu hình quyền riêng tư
  Future<ApiResult<String>> updatePrivacySettings(PrivacySettingsEntity settings);

  /// Lấy cấu hình thông báo
  Future<ApiResult<NotificationSettingsEntity>> getNotificationSettings();

  /// Cập nhật cấu hình thông báo
  Future<ApiResult<String>> updateNotificationSettings(NotificationSettingsEntity settings);

  /// Gửi phản hồi / đóng góp ý kiến
  Future<ApiResult<String>> submitFeedback(String content, {String? category});

  /// Xóa tài khoản vĩnh viễn
  Future<ApiResult<String>> deleteAccount();

  /// Lấy danh mục sở thích từ hệ thống
  Future<ApiResult<List<String>>> getInterestTags();
}

