import '../../../../core/network/api_result.dart';
import '../entities/settings_entities.dart';
import '../repositories/settings_repository.dart';

class GetSecurityInfoUseCase {
  final SettingsRepository repository;
  const GetSecurityInfoUseCase(this.repository);

  Future<ApiResult<SecurityInfoEntity>> call() => repository.getSecurityInfo();
}

class SendSecurityOtpUseCase {
  final SettingsRepository repository;
  const SendSecurityOtpUseCase(this.repository);

  Future<ApiResult<String>> call() => repository.sendOtp();
}

class VerifySecurityOtpUseCase {
  final SettingsRepository repository;
  const VerifySecurityOtpUseCase(this.repository);

  Future<ApiResult<String>> call(String code) => repository.verifyOtp(code);
}

class ChangePasswordUseCase {
  final SettingsRepository repository;
  const ChangePasswordUseCase(this.repository);

  Future<ApiResult<String>> call(String oldPassword, String newPassword) =>
      repository.changePassword(oldPassword, newPassword);
}

class ResetPasswordWithOtpUseCase {
  final SettingsRepository repository;
  const ResetPasswordWithOtpUseCase(this.repository);

  Future<ApiResult<String>> call(String code, String newPassword) =>
      repository.resetPassword(code, newPassword);
}

class GetPrivacySettingsUseCase {
  final SettingsRepository repository;
  const GetPrivacySettingsUseCase(this.repository);

  Future<ApiResult<PrivacySettingsEntity>> call() =>
      repository.getPrivacySettings();
}

class UpdatePrivacySettingsUseCase {
  final SettingsRepository repository;
  const UpdatePrivacySettingsUseCase(this.repository);

  Future<ApiResult<String>> call(PrivacySettingsEntity settings) =>
      repository.updatePrivacySettings(settings);
}

class GetNotificationSettingsUseCase {
  final SettingsRepository repository;
  const GetNotificationSettingsUseCase(this.repository);

  Future<ApiResult<NotificationSettingsEntity>> call() =>
      repository.getNotificationSettings();
}

class UpdateNotificationSettingsUseCase {
  final SettingsRepository repository;
  const UpdateNotificationSettingsUseCase(this.repository);

  Future<ApiResult<String>> call(NotificationSettingsEntity settings) =>
      repository.updateNotificationSettings(settings);
}

class SubmitFeedbackUseCase {
  final SettingsRepository repository;
  const SubmitFeedbackUseCase(this.repository);

  Future<ApiResult<String>> call(String content, {String? category}) =>
      repository.submitFeedback(content, category: category);
}

class DeleteAccountUseCase {
  final SettingsRepository repository;
  const DeleteAccountUseCase(this.repository);

  Future<ApiResult<String>> call() => repository.deleteAccount();
}

class GetInterestTagsUseCase {
  final SettingsRepository repository;
  const GetInterestTagsUseCase(this.repository);

  Future<ApiResult<List<String>>> call() => repository.getInterestTags();
}

