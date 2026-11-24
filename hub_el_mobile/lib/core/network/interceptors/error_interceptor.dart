import 'package:dio/dio.dart';
import '../../errors/app_exceptions.dart';

/// Interceptor phân rã lỗi HTTP từ Dio thành các AppException có cấu trúc
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final appException = mapDioException(err);

    // Bọc AppException vào DioException để tầng DioClient xử lý tập trung
    final modifiedError = DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: appException,
      message: appException.message,
    );

    handler.next(modifiedError);
  }

  AppException mapDioException(DioException err) {
    // 1. Lỗi kết nối mạng vật lý hoặc quá thời gian chờ (Timeout)
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkException(
          'Kết nối đến máy chủ quá thời gian quy định (Timeout). Vui lòng thử lại.',
          'CONNECTION_TIMEOUT',
        );

      case DioExceptionType.connectionError:
        return const NetworkException(
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
          'NO_INTERNET',
        );

      case DioExceptionType.cancel:
        return const UnknownException(
          'Yêu cầu đã bị hủy bỏ.',
          'REQUEST_CANCELLED',
        );

      case DioExceptionType.badCertificate:
        return const NetworkException(
          'Chứng chỉ bảo mật không an toàn.',
          'BAD_CERTIFICATE',
        );

      case DioExceptionType.badResponse:
        return _mapHttpResponse(err.response);

      case DioExceptionType.unknown:
      default:
        if (err.error is AppException) {
          return err.error as AppException;
        }
        return UnknownException(
          err.message ?? 'Đã xảy ra sự cố không mong muốn.',
          'UNKNOWN_DIO_ERROR',
        );
    }
  }

  AppException _mapHttpResponse(Response? response) {
    if (response == null) {
      return const ServerException('Không nhận được phản hồi từ máy chủ.');
    }

    final statusCode = response.statusCode ?? 500;
    final data = response.data;

    String? serverError;
    String? errorCode;

    if (data is Map) {
      serverError = data['error']?.toString() ?? data['message']?.toString();
      errorCode = data['code']?.toString();
    } else if (data is String) {
      serverError = data;
    }

    final message = serverError ?? 'Đã có lỗi xảy ra (HTTP $statusCode).';

    switch (statusCode) {
      case 400:
        if (errorCode == 'INSUFFICIENT_ENERGY' || message.contains('năng lượng')) {
          return InsufficientResourceException(
            resourceType: 'ENERGY',
            message: message,
            code: errorCode ?? 'INSUFFICIENT_ENERGY',
          );
        }
        if (errorCode == 'INSUFFICIENT_COINS' || message.contains('Xu')) {
          return InsufficientResourceException(
            resourceType: 'COINS',
            message: message,
            code: errorCode ?? 'INSUFFICIENT_COINS',
          );
        }
        return ValidationException(message, code: errorCode ?? 'BAD_REQUEST', details: data);

      case 401:
        return UnauthorizedException(message, errorCode ?? 'UNAUTHORIZED');

      case 403:
        if (errorCode == 'USER_BANNED' || message.toLowerCase().contains('khóa')) {
          return ForbiddenException.userBanned(message);
        }
        return ForbiddenException(message: message, code: errorCode ?? 'FORBIDDEN');

      case 404:
        return NotFoundException(message, errorCode ?? 'NOT_FOUND');

      case 500:
      case 502:
      case 503:
      case 504:
      default:
        return ServerException(message, statusCode, errorCode ?? 'SERVER_ERROR', data);
    }
  }
}
