import '../../../../core/network/api_result.dart';
import '../entities/user_entity.dart';

/// Hợp đồng Repository Xác thực người dùng
abstract class IAuthRepository {
  /// Đăng nhập bằng Email & Mật khẩu
  Future<ApiResult<UserEntity>> login({
    required String email,
    required String password,
  });

  /// Đăng ký tài khoản (Họ tên, Email, Mật khẩu, Mã OTP tùy chọn)
  Future<ApiResult<UserEntity>> register({
    required String email,
    required String password,
    required String name,
    String? code,
  });

  /// Yêu cầu gửi mã OTP đăng ký về Email
  Future<ApiResult<void>> sendRegisterOtp({
    required String email,
  });

  /// Lấy thông tin tài khoản người dùng hiện tại (profile + gamification)
  Future<ApiResult<UserEntity>> getCurrentUser();

  /// Đăng nhập bằng Google
  Future<ApiResult<UserEntity>> googleSignIn({
    required String email,
    String? name,
    String? image,
    String? idToken,
  });

  /// Đăng xuất khỏi hệ thống
  Future<ApiResult<void>> logout();

  /// Yêu cầu gửi mã OTP khôi phục mật khẩu
  Future<ApiResult<void>> forgotPassword({
    required String email,
  });

  /// Xác thực mã OTP và đổi mật khẩu mới
  Future<ApiResult<void>> verifyResetPassword({
    required String email,
    required String code,
    required String newPassword,
  });

  /// Kiểm tra xem ứng dụng đã có Access Token hợp lệ chưa
  Future<bool> isAuthenticated();
}

