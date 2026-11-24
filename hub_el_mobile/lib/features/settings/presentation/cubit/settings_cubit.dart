import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/settings_entities.dart';
import '../../domain/usecases/settings_usecases.dart';
import 'settings_state.dart';

class SettingsCubit extends Cubit<SettingsState> {
  final GetSecurityInfoUseCase getSecurityInfoUseCase;
  final SendSecurityOtpUseCase sendSecurityOtpUseCase;
  final VerifySecurityOtpUseCase verifySecurityOtpUseCase;
  final ChangePasswordUseCase changePasswordUseCase;
  final ResetPasswordWithOtpUseCase resetPasswordWithOtpUseCase;
  final GetPrivacySettingsUseCase getPrivacySettingsUseCase;
  final UpdatePrivacySettingsUseCase updatePrivacySettingsUseCase;
  final GetNotificationSettingsUseCase getNotificationSettingsUseCase;
  final UpdateNotificationSettingsUseCase updateNotificationSettingsUseCase;
  final SubmitFeedbackUseCase submitFeedbackUseCase;
  final DeleteAccountUseCase? deleteAccountUseCase;
  final GetInterestTagsUseCase? getInterestTagsUseCase;

  Timer? _countdownTimer;

  SettingsCubit({
    required this.getSecurityInfoUseCase,
    required this.sendSecurityOtpUseCase,
    required this.verifySecurityOtpUseCase,
    required this.changePasswordUseCase,
    required this.resetPasswordWithOtpUseCase,
    required this.getPrivacySettingsUseCase,
    required this.updatePrivacySettingsUseCase,
    required this.getNotificationSettingsUseCase,
    required this.updateNotificationSettingsUseCase,
    required this.submitFeedbackUseCase,
    this.deleteAccountUseCase,
    this.getInterestTagsUseCase,
  }) : super(const SettingsState());

  @override
  Future<void> close() {
    _countdownTimer?.cancel();
    return super.close();
  }

  // ==========================================
  // 1. SECURITY & PASSWORDS
  // ==========================================

  Future<void> loadSecurityInfo() async {
    emit(state.copyWith(
      securityStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await getSecurityInfoUseCase();
    result.fold(
      onSuccess: (info, _) {
        emit(state.copyWith(
          securityStatus: SettingsActionStatus.success,
          securityInfo: info,
          errorMessage: null,
        ));
      },
      onFailure: (failure) {
        emit(state.copyWith(
          securityStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
      },
    );
  }

  Future<bool> sendOtp() async {
    if (state.otpCountdown > 0) return false;

    emit(state.copyWith(otpStatus: OtpStatus.sending, errorMessage: null));
    final result = await sendSecurityOtpUseCase();
    return result.fold(
      onSuccess: (_, message) {
        _startOtpCountdown(60);
        emit(state.copyWith(
          otpStatus: OtpStatus.sent,
          message: message ?? 'Mã xác thực 6 số đã được gửi vào Email.',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          otpStatus: OtpStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  void _startOtpCountdown(int seconds) {
    _countdownTimer?.cancel();
    emit(state.copyWith(otpCountdown: seconds));
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.otpCountdown <= 1) {
        timer.cancel();
        emit(state.copyWith(otpCountdown: 0));
      } else {
        emit(state.copyWith(otpCountdown: state.otpCountdown - 1));
      }
    });
  }

  Future<bool> verifyOtp(String code) async {
    if (code.trim().length != 6) {
      emit(state.copyWith(
        otpStatus: OtpStatus.error,
        errorMessage: 'Mã xác thực OTP phải gồm 6 chữ số.',
      ));
      return false;
    }

    emit(state.copyWith(otpStatus: OtpStatus.verifying, errorMessage: null));
    final result = await verifySecurityOtpUseCase(code);
    return result.fold(
      onSuccess: (_, message) {
        emit(state.copyWith(
          otpStatus: OtpStatus.verified,
          isOtpVerified: true,
          message: message ?? 'Xác thực OTP thành công!',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          otpStatus: OtpStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  Future<bool> changePassword(String oldPassword, String newPassword) async {
    if (newPassword.length < 8) {
      emit(state.copyWith(
        passwordStatus: SettingsActionStatus.error,
        errorMessage: 'Mật khẩu mới phải dài ít nhất 8 ký tự.',
      ));
      return false;
    }

    emit(state.copyWith(
      passwordStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await changePasswordUseCase(oldPassword, newPassword);
    return result.fold(
      onSuccess: (_, message) {
        emit(state.copyWith(
          passwordStatus: SettingsActionStatus.success,
          message: message ?? 'Đổi mật khẩu thành công!',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          passwordStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  Future<bool> resetPassword(String code, String newPassword) async {
    if (newPassword.length < 8) {
      emit(state.copyWith(
        passwordStatus: SettingsActionStatus.error,
        errorMessage: 'Mật khẩu mới phải dài ít nhất 8 ký tự.',
      ));
      return false;
    }

    emit(state.copyWith(
      passwordStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await resetPasswordWithOtpUseCase(code, newPassword);
    return result.fold(
      onSuccess: (_, message) {
        emit(state.copyWith(
          passwordStatus: SettingsActionStatus.success,
          isOtpVerified: false,
          otpStatus: OtpStatus.initial,
          message: message ?? 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          passwordStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  void resetOtpState() {
    _countdownTimer?.cancel();
    emit(state.copyWith(
      otpStatus: OtpStatus.initial,
      otpCountdown: 0,
      isOtpVerified: false,
      errorMessage: null,
    ));
  }

  // ==========================================
  // 2. PRIVACY SETTINGS
  // ==========================================

  Future<void> loadPrivacySettings() async {
    emit(state.copyWith(
      privacyStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await getPrivacySettingsUseCase();
    result.fold(
      onSuccess: (settings, _) {
        emit(state.copyWith(
          privacyStatus: SettingsActionStatus.success,
          privacySettings: settings,
          errorMessage: null,
        ));
      },
      onFailure: (failure) {
        emit(state.copyWith(
          privacyStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
      },
    );
  }

  Future<bool> updatePrivacySettings(PrivacySettingsEntity settings) async {
    emit(state.copyWith(
      privacyStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await updatePrivacySettingsUseCase(settings);
    return result.fold(
      onSuccess: (_, message) {
        emit(state.copyWith(
          privacyStatus: SettingsActionStatus.success,
          privacySettings: settings,
          message: message ?? 'Đã lưu cài đặt quyền riêng tư!',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          privacyStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  // ==========================================
  // 3. NOTIFICATION SETTINGS
  // ==========================================

  Future<void> loadNotificationSettings() async {
    emit(state.copyWith(
      notificationStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await getNotificationSettingsUseCase();
    result.fold(
      onSuccess: (settings, _) {
        emit(state.copyWith(
          notificationStatus: SettingsActionStatus.success,
          notificationSettings: settings,
          errorMessage: null,
        ));
      },
      onFailure: (failure) {
        emit(state.copyWith(
          notificationStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
      },
    );
  }

  Future<bool> updateNotificationSettings(NotificationSettingsEntity settings) async {
    emit(state.copyWith(
      notificationStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await updateNotificationSettingsUseCase(settings);
    return result.fold(
      onSuccess: (_, message) {
        emit(state.copyWith(
          notificationStatus: SettingsActionStatus.success,
          notificationSettings: settings,
          message: message ?? 'Đã lưu cài đặt thông báo!',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          notificationStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  // ==========================================
  // 4. FEEDBACK & SUPPORT
  // ==========================================

  Future<bool> submitFeedback(String content, {String? category}) async {
    if (content.trim().isEmpty) {
      emit(state.copyWith(
        feedbackStatus: SettingsActionStatus.error,
        errorMessage: 'Nội dung góp ý không được để trống.',
      ));
      return false;
    }
    if (content.trim().length > 2000) {
      emit(state.copyWith(
        feedbackStatus: SettingsActionStatus.error,
        errorMessage: 'Nội dung góp ý không được vượt quá 2000 ký tự.',
      ));
      return false;
    }

    emit(state.copyWith(
      feedbackStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await submitFeedbackUseCase(content, category: category);
    return result.fold(
      onSuccess: (_, message) {
        emit(state.copyWith(
          feedbackStatus: SettingsActionStatus.success,
          message: message ?? 'Cảm ơn bạn đã đóng góp ý kiến!',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          feedbackStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  // ==========================================
  // 5. ACCOUNT DELETION & SYSTEM INTERESTS
  // ==========================================

  Future<bool> deleteAccount() async {
    if (deleteAccountUseCase == null) return false;
    emit(state.copyWith(
      deleteAccountStatus: SettingsActionStatus.loading,
      errorMessage: null,
    ));
    final result = await deleteAccountUseCase!();
    return result.fold(
      onSuccess: (_, msg) {
        emit(state.copyWith(
          deleteAccountStatus: SettingsActionStatus.success,
          message: msg ?? 'Tài khoản đã được xóa vĩnh viễn.',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          deleteAccountStatus: SettingsActionStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  Future<void> loadInterestTags() async {
    if (getInterestTagsUseCase == null) return;
    final result = await getInterestTagsUseCase!();
    result.fold(
      onSuccess: (tags, _) {
        emit(state.copyWith(interestTags: tags));
      },
      onFailure: (_) {},
    );
  }
}

