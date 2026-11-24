import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/settings/domain/entities/settings_entities.dart';
import 'package:hub_el_mobile/features/settings/domain/repositories/settings_repository.dart';
import 'package:hub_el_mobile/features/settings/domain/usecases/settings_usecases.dart';
import 'package:hub_el_mobile/features/settings/presentation/cubit/settings_cubit.dart';
import 'package:hub_el_mobile/features/settings/presentation/cubit/settings_state.dart';

class MockSettingsRepository implements SettingsRepository {
  bool shouldFail = false;
  String errorMessage = 'Lỗi hệ thống';

  @override
  Future<ApiResult<SecurityInfoEntity>> getSecurityInfo() async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess(
      SecurityInfoEntity(isOAuth: false, email: 'tam@hub-el.com', hasPassword: true),
    );
  }

  @override
  Future<ApiResult<String>> sendOtp() async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess('Đã gửi mã OTP thành công!');
  }

  @override
  Future<ApiResult<String>> verifyOtp(String code) async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    if (code == '123456') return const ApiSuccess('Mã hợp lệ!');
    return const ApiFailure(message: 'Mã OTP không chính xác.');
  }

  @override
  Future<ApiResult<String>> changePassword(String oldPassword, String newPassword) async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    if (oldPassword != 'correct_old') return const ApiFailure(message: 'Mật khẩu cũ không đúng.');
    return const ApiSuccess('Đổi mật khẩu thành công!');
  }

  @override
  Future<ApiResult<String>> resetPassword(String code, String newPassword) async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess('Đặt lại mật khẩu thành công!');
  }

  @override
  Future<ApiResult<PrivacySettingsEntity>> getPrivacySettings() async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess(PrivacySettingsEntity());
  }

  @override
  Future<ApiResult<String>> updatePrivacySettings(PrivacySettingsEntity settings) async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess('Đã lưu quyền riêng tư!');
  }

  @override
  Future<ApiResult<NotificationSettingsEntity>> getNotificationSettings() async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess(NotificationSettingsEntity());
  }

  @override
  Future<ApiResult<String>> updateNotificationSettings(NotificationSettingsEntity settings) async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess('Đã lưu cài đặt thông báo!');
  }

  @override
  Future<ApiResult<String>> submitFeedback(String content, {String? category}) async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess('Cảm ơn bạn đã đóng góp ý kiến!');
  }

  @override
  Future<ApiResult<String>> deleteAccount() async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess('Tài khoản đã được xóa vĩnh viễn.');
  }

  @override
  Future<ApiResult<List<String>>> getInterestTags() async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess(['Tiếng Anh', 'Lập trình web', 'Python']);
  }
}

void main() {
  group('SettingsCubit Unit Tests', () {
    late MockSettingsRepository repository;
    late SettingsCubit cubit;

    setUp(() {
      repository = MockSettingsRepository();
      cubit = SettingsCubit(
        getSecurityInfoUseCase: GetSecurityInfoUseCase(repository),
        sendSecurityOtpUseCase: SendSecurityOtpUseCase(repository),
        verifySecurityOtpUseCase: VerifySecurityOtpUseCase(repository),
        changePasswordUseCase: ChangePasswordUseCase(repository),
        resetPasswordWithOtpUseCase: ResetPasswordWithOtpUseCase(repository),
        getPrivacySettingsUseCase: GetPrivacySettingsUseCase(repository),
        updatePrivacySettingsUseCase: UpdatePrivacySettingsUseCase(repository),
        getNotificationSettingsUseCase: GetNotificationSettingsUseCase(repository),
        updateNotificationSettingsUseCase: UpdateNotificationSettingsUseCase(repository),
        submitFeedbackUseCase: SubmitFeedbackUseCase(repository),
      );
    });

    tearDown(() {
      cubit.close();
    });

    test('loadSecurityInfo loads security details correctly', () async {
      await cubit.loadSecurityInfo();

      expect(cubit.state.securityStatus, SettingsActionStatus.success);
      expect(cubit.state.securityInfo?.email, 'tam@hub-el.com');
      expect(cubit.state.securityInfo?.hasPassword, true);
    });

    test('sendOtp and verifyOtp workflow', () async {
      final sent = await cubit.sendOtp();
      expect(sent, true);
      expect(cubit.state.otpStatus, OtpStatus.sent);
      expect(cubit.state.otpCountdown, 60);

      final verified = await cubit.verifyOtp('123456');
      expect(verified, true);
      expect(cubit.state.otpStatus, OtpStatus.verified);
      expect(cubit.state.isOtpVerified, true);
    });

    test('changePassword validates length and updates password', () async {
      final tooShort = await cubit.changePassword('old', '1234');
      expect(tooShort, false);
      expect(cubit.state.errorMessage, contains('8 ký tự'));

      final ok = await cubit.changePassword('correct_old', 'newPassword123');
      expect(ok, true);
      expect(cubit.state.passwordStatus, SettingsActionStatus.success);
    });

    test('loadPrivacySettings and updatePrivacySettings workflow', () async {
      await cubit.loadPrivacySettings();
      expect(cubit.state.privacyStatus, SettingsActionStatus.success);
      expect(cubit.state.privacySettings, isNotNull);

      final updated = await cubit.updatePrivacySettings(
        const PrivacySettingsEntity(showOnline: false, allowFriendRequests: false),
      );
      expect(updated, true);
      expect(cubit.state.privacySettings?.showOnline, false);
    });

    test('loadNotificationSettings and updateNotificationSettings workflow', () async {
      await cubit.loadNotificationSettings();
      expect(cubit.state.notificationStatus, SettingsActionStatus.success);
      expect(cubit.state.notificationSettings, isNotNull);

      final updated = await cubit.updateNotificationSettings(
        const NotificationSettingsEntity(allowEmail: false),
      );
      expect(updated, true);
      expect(cubit.state.notificationSettings?.allowEmail, false);
    });

    test('submitFeedback validates empty content and submits successfully', () async {
      final empty = await cubit.submitFeedback('');
      expect(empty, false);
      expect(cubit.state.errorMessage, contains('không được để trống'));

      final success = await cubit.submitFeedback('Ứng dụng rất tốt!');
      expect(success, true);
      expect(cubit.state.feedbackStatus, SettingsActionStatus.success);
    });
  });
}
