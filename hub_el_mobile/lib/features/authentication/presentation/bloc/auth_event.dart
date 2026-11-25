abstract class AuthEvent {
  const AuthEvent();
}

/// Kiểm tra trạng thái đăng nhập khi khởi động ứng dụng
class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

/// Người dùng bấm nút Đăng nhập với Email & Password
class AuthLoginSubmitted extends AuthEvent {
  final String email;
  final String password;
  final bool rememberMe;

  const AuthLoginSubmitted({
    required this.email,
    required this.password,
    this.rememberMe = false,
  });
}

/// Người dùng bấm nút Đăng ký tài khoản
class AuthRegisterSubmitted extends AuthEvent {
  final String name;
  final String email;
  final String password;
  final String? code;

  const AuthRegisterSubmitted({
    required this.name,
    required this.email,
    required this.password,
    this.code,
  });
}

/// Yêu cầu gửi mã OTP đăng ký
class AuthSendOtpRequested extends AuthEvent {
  final String email;

  const AuthSendOtpRequested({required this.email});
}

/// Đăng nhập bằng Google
class AuthGoogleSignInRequested extends AuthEvent {
  final String? email;
  final String? name;
  final String? image;

  const AuthGoogleSignInRequested({
    this.email,
    this.name,
    this.image,
  });
}

/// Yêu cầu gửi mã OTP quên mật khẩu
class AuthForgotPasswordRequested extends AuthEvent {
  final String email;

  const AuthForgotPasswordRequested({required this.email});
}

/// Xác nhận OTP và đặt mật khẩu mới
class AuthVerifyResetPasswordRequested extends AuthEvent {
  final String email;
  final String code;
  final String newPassword;

  const AuthVerifyResetPasswordRequested({
    required this.email,
    required this.code,
    required this.newPassword,
  });
}

/// Yêu cầu Đăng xuất
class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

/// Nhận thông báo tài khoản bị khóa từ Interceptor
class AuthUserBannedReceived extends AuthEvent {
  final String reason;

  const AuthUserBannedReceived({required this.reason});
}

/// Nhận thông báo phiên đăng nhập hết hạn từ Interceptor
class AuthSessionExpiredReceived extends AuthEvent {
  const AuthSessionExpiredReceived();
}

/// Cập nhật số dư tài nguyên của User thời gian thực
class AuthUserBalanceUpdated extends AuthEvent {
  final int? freeCoins;
  final int? aiTokens;
  final int? premiumCoins;
  final int? stardust;
  final bool? isPro;

  const AuthUserBalanceUpdated({
    this.freeCoins,
    this.aiTokens,
    this.premiumCoins,
    this.stardust,
    this.isPro,
  });
}

/// Cập nhật thông tin hồ sơ / ảnh đại diện của User thời gian thực
class AuthUserProfileUpdated extends AuthEvent {
  final String? name;
  final String? fullName;
  final String? username;
  final String? avatar;
  final String? image;

  const AuthUserProfileUpdated({
    this.name,
    this.fullName,
    this.username,
    this.avatar,
    this.image,
  });
}

/// Yêu cầu làm mới thông tin User từ backend
class AuthUserRefreshed extends AuthEvent {
  const AuthUserRefreshed();
}


