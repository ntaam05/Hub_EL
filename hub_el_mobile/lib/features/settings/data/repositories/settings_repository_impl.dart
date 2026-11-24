import '../../../../core/network/api_result.dart';
import '../../domain/entities/settings_entities.dart';
import '../../domain/repositories/settings_repository.dart';
import '../datasources/settings_remote_data_source.dart';

class SettingsRepositoryImpl implements SettingsRepository {
  final SettingsRemoteDataSource remoteDataSource;

  SettingsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<SecurityInfoEntity>> getSecurityInfo() async {
    final result = await remoteDataSource.getSecurityInfo();
    return result.fold(
      onSuccess: (model, message) => ApiSuccess(model, message: message),
      onFailure: (failure) => ApiFailure(message: failure.message, code: failure.code),
    );
  }

  @override
  Future<ApiResult<String>> sendOtp() => remoteDataSource.sendOtp();

  @override
  Future<ApiResult<String>> verifyOtp(String code) => remoteDataSource.verifyOtp(code);

  @override
  Future<ApiResult<String>> changePassword(String oldPassword, String newPassword) =>
      remoteDataSource.changePassword(oldPassword, newPassword);

  @override
  Future<ApiResult<String>> resetPassword(String code, String newPassword) =>
      remoteDataSource.resetPassword(code, newPassword);

  @override
  Future<ApiResult<PrivacySettingsEntity>> getPrivacySettings() async {
    final result = await remoteDataSource.getPrivacySettings();
    return result.fold(
      onSuccess: (model, message) => ApiSuccess(model, message: message),
      onFailure: (failure) => ApiFailure(message: failure.message, code: failure.code),
    );
  }

  @override
  Future<ApiResult<String>> updatePrivacySettings(PrivacySettingsEntity settings) =>
      remoteDataSource.updatePrivacySettings(settings.toJson());

  @override
  Future<ApiResult<NotificationSettingsEntity>> getNotificationSettings() async {
    final result = await remoteDataSource.getNotificationSettings();
    return result.fold(
      onSuccess: (model, message) => ApiSuccess(model, message: message),
      onFailure: (failure) => ApiFailure(message: failure.message, code: failure.code),
    );
  }

  @override
  Future<ApiResult<String>> updateNotificationSettings(NotificationSettingsEntity settings) =>
      remoteDataSource.updateNotificationSettings(settings.toJson());

  @override
  Future<ApiResult<String>> submitFeedback(String content, {String? category}) =>
      remoteDataSource.submitFeedback(content, category: category);

  @override
  Future<ApiResult<String>> deleteAccount() => remoteDataSource.deleteAccount();

  @override
  Future<ApiResult<List<String>>> getInterestTags() => remoteDataSource.getInterestTags();
}
