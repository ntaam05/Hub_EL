import 'package:equatable/equatable.dart';
import '../../domain/entities/settings_entities.dart';

enum SettingsActionStatus {
  initial,
  loading,
  success,
  error,
}

enum OtpStatus {
  initial,
  sending,
  sent,
  verifying,
  verified,
  error,
}

class SettingsState extends Equatable {
  // Security
  final SettingsActionStatus securityStatus;
  final SecurityInfoEntity? securityInfo;

  // OTP
  final OtpStatus otpStatus;
  final int otpCountdown;
  final bool isOtpVerified;

  // Password
  final SettingsActionStatus passwordStatus;

  // Privacy
  final SettingsActionStatus privacyStatus;
  final PrivacySettingsEntity? privacySettings;

  // Notifications
  final SettingsActionStatus notificationStatus;
  final NotificationSettingsEntity? notificationSettings;

  // Feedback
  final SettingsActionStatus feedbackStatus;

  // Account Deletion
  final SettingsActionStatus deleteAccountStatus;

  // System Interests
  final List<String> interestTags;

  // Messages
  final String? message;
  final String? errorMessage;

  const SettingsState({
    this.securityStatus = SettingsActionStatus.initial,
    this.securityInfo,
    this.otpStatus = OtpStatus.initial,
    this.otpCountdown = 0,
    this.isOtpVerified = false,
    this.passwordStatus = SettingsActionStatus.initial,
    this.privacyStatus = SettingsActionStatus.initial,
    this.privacySettings,
    this.notificationStatus = SettingsActionStatus.initial,
    this.notificationSettings,
    this.feedbackStatus = SettingsActionStatus.initial,
    this.deleteAccountStatus = SettingsActionStatus.initial,
    this.interestTags = const [],
    this.message,
    this.errorMessage,
  });

  SettingsState copyWith({
    SettingsActionStatus? securityStatus,
    SecurityInfoEntity? securityInfo,
    OtpStatus? otpStatus,
    int? otpCountdown,
    bool? isOtpVerified,
    SettingsActionStatus? passwordStatus,
    SettingsActionStatus? privacyStatus,
    PrivacySettingsEntity? privacySettings,
    SettingsActionStatus? notificationStatus,
    NotificationSettingsEntity? notificationSettings,
    SettingsActionStatus? feedbackStatus,
    SettingsActionStatus? deleteAccountStatus,
    List<String>? interestTags,
    String? message,
    String? errorMessage,
  }) {
    return SettingsState(
      securityStatus: securityStatus ?? this.securityStatus,
      securityInfo: securityInfo ?? this.securityInfo,
      otpStatus: otpStatus ?? this.otpStatus,
      otpCountdown: otpCountdown ?? this.otpCountdown,
      isOtpVerified: isOtpVerified ?? this.isOtpVerified,
      passwordStatus: passwordStatus ?? this.passwordStatus,
      privacyStatus: privacyStatus ?? this.privacyStatus,
      privacySettings: privacySettings ?? this.privacySettings,
      notificationStatus: notificationStatus ?? this.notificationStatus,
      notificationSettings: notificationSettings ?? this.notificationSettings,
      feedbackStatus: feedbackStatus ?? this.feedbackStatus,
      deleteAccountStatus: deleteAccountStatus ?? this.deleteAccountStatus,
      interestTags: interestTags ?? this.interestTags,
      message: message,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        securityStatus,
        securityInfo,
        otpStatus,
        otpCountdown,
        isOtpVerified,
        passwordStatus,
        privacyStatus,
        privacySettings,
        notificationStatus,
        notificationSettings,
        feedbackStatus,
        deleteAccountStatus,
        interestTags,
        message,
        errorMessage,
      ];
}

