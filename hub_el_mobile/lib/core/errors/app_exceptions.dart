/// Lớp ngoại lệ cơ sở tập trung của ứng dụng Hub-EL
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;
  final dynamic details;

  const AppException(
    this.message, {
    this.code,
    this.statusCode,
    this.details,
  });

  @override
  String toString() => 'AppException(message: $message, code: $code, statusCode: $statusCode)';
}

/// Lỗi mất kết nối mạng hoặc quá hạn chờ (Timeout)
class NetworkException extends AppException {
  const NetworkException([
    super.message = 'Không có kết nối mạng. Vui lòng kiểm tra lại WiFi hoặc 4G.',
    String? code = 'NETWORK_ERROR',
  ]) : super(code: code);
}

/// Lỗi máy chủ Backend gặp sự cố (HTTP 500, 502, 503)
class ServerException extends AppException {
  const ServerException([
    super.message = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau giây lát.',
    int? statusCode = 500,
    String? code = 'SERVER_ERROR',
    dynamic details,
  ]) : super(statusCode: statusCode, code: code, details: details);
}

/// Lỗi hết hạn phiên đăng nhập hoặc thông tin xác thực không đúng (HTTP 401)
class UnauthorizedException extends AppException {
  const UnauthorizedException([
    super.message = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
    String? code = 'UNAUTHORIZED',
  ]) : super(statusCode: 401, code: code);
}

/// Lỗi truy cập bị từ chối hoặc tài khoản bị khóa (HTTP 403)
class ForbiddenException extends AppException {
  final bool isUserBanned;

  const ForbiddenException({
    String message = 'Bạn không có quyền truy cập chức năng này.',
    String code = 'FORBIDDEN',
    this.isUserBanned = false,
  }) : super(message, statusCode: 403, code: code);

  factory ForbiddenException.userBanned([String? message]) {
    return ForbiddenException(
      message: message ?? 'Tài khoản của bạn đã bị khóa bởi quản trị viên.',
      code: 'USER_BANNED',
      isUserBanned: true,
    );
  }
}

/// Lỗi không tìm thấy tài nguyên (HTTP 404)
class NotFoundException extends AppException {
  const NotFoundException([
    super.message = 'Không tìm thấy dữ liệu yêu cầu.',
    String? code = 'NOT_FOUND',
  ]) : super(statusCode: 404, code: code);
}

/// Lỗi dữ liệu gửi lên không hợp lệ (HTTP 400 hoặc 422)
class ValidationException extends AppException {
  const ValidationException(
    super.message, {
    super.code = 'VALIDATION_ERROR',
    super.details,
  }) : super(statusCode: 400);
}

/// Lỗi không đủ tài nguyên học tập (Xu Gacha, Năng lượng AI, Ngọc)
class InsufficientResourceException extends AppException {
  final String resourceType; // 'COINS' | 'ENERGY' | 'GEMS' | 'STARDUST'

  const InsufficientResourceException({
    required this.resourceType,
    required String message,
    String code = 'INSUFFICIENT_RESOURCE',
  }) : super(message, statusCode: 400, code: code);
}

/// Lỗi không xác định khác
class UnknownException extends AppException {
  const UnknownException([
    super.message = 'Đã có lỗi không xác định xảy ra. Vui lòng thử lại.',
    String? code = 'UNKNOWN_ERROR',
    dynamic details,
  ]) : super(code: code, details: details);
}
