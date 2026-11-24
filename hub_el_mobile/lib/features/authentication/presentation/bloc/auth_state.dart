import '../../domain/entities/user_entity.dart';

abstract class AuthState {
  const AuthState();
}

/// Trạng thái khởi tạo ban đầu
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// Trạng thái đang tải (Loading indicator)
class AuthLoading extends AuthState {
  final String? message;
  const AuthLoading({this.message});
}

/// Trạng thái đã đăng nhập thành công
class Authenticated extends AuthState {
  final UserEntity user;
  const Authenticated({required this.user});
}

/// Trạng thái chưa đăng nhập (ở màn hình Login / Register)
class Unauthenticated extends AuthState {
  final String? message;
  const Unauthenticated({this.message});
}

/// Trạng thái đăng nhập thất bại hoặc có lỗi nghiệp vụ
class AuthFailure extends AuthState {
  final String message;
  final String? code;

  const AuthFailure({
    required this.message,
    this.code,
  });
}

/// Trạng thái tài khoản bị khóa (BANNED)
class AuthBanned extends AuthState {
  final String reason;
  const AuthBanned({required this.reason});
}

/// Trạng thái mã OTP đã được gửi về email thành công
class AuthOtpSentState extends AuthState {
  final String email;
  final String message;
  const AuthOtpSentState({
    required this.email,
    required this.message,
  });
}

/// Trạng thái đổi mật khẩu thành công
class AuthPasswordResetSuccess extends AuthState {
  final String message;
  const AuthPasswordResetSuccess({required this.message});
}

/// Trạng thái cần cấu hình SHA-1 / Package Name cho Google Cloud Console trên Android
class AuthGoogleConfigHelp extends AuthState {
  final String packageName;
  final String sha1;
  final String serverClientId;
  final String message;

  const AuthGoogleConfigHelp({
    required this.packageName,
    required this.sha1,
    required this.serverClientId,
    required this.message,
  });
}

