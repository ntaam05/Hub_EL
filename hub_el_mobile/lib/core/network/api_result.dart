import '../errors/app_exceptions.dart';

/// Kiểu dữ liệu đóng gói kết quả phản hồi từ API
sealed class ApiResult<T> {
  const ApiResult();

  bool get isSuccess => this is ApiSuccess<T>;
  bool get isFailure => this is ApiFailure<T>;

  T? get dataOrNull => switch (this) {
        ApiSuccess<T>(data: final data) => data,
        ApiFailure<T>() => null,
      };

  R fold<R>({
    required R Function(T data, String? message) onSuccess,
    required R Function(ApiFailure<T> failure) onFailure,
  }) {
    return switch (this) {
      ApiSuccess<T>(data: final data, message: final message) =>
        onSuccess(data, message),
      ApiFailure<T>() => onFailure(this as ApiFailure<T>),
    };
  }

  ApiResult<R> map<R>(R Function(T data) transform) {
    return switch (this) {
      ApiSuccess<T>(data: final data, message: final message) =>
        ApiSuccess<R>(transform(data), message: message),
      ApiFailure<T>(
        message: final message,
        code: final code,
        statusCode: final statusCode,
        details: final details,
        exception: final exception,
      ) =>
        ApiFailure<R>(
          message: message,
          code: code,
          statusCode: statusCode,
          details: details,
          exception: exception,
        ),
    };
  }
}

/// Kết quả gọi API thành công
class ApiSuccess<T> extends ApiResult<T> {
  final T data;
  final String? message;

  const ApiSuccess(this.data, {this.message});

  @override
  String toString() => 'ApiSuccess(data: $data, message: $message)';
}

/// Kết quả gọi API thất bại
class ApiFailure<T> extends ApiResult<T> {
  final String message;
  final String? code;
  final int? statusCode;
  final dynamic details;
  final AppException? exception;

  const ApiFailure({
    required this.message,
    this.code,
    this.statusCode,
    this.details,
    this.exception,
  });

  factory ApiFailure.fromException(AppException exception) {
    return ApiFailure<T>(
      message: exception.message,
      code: exception.code,
      statusCode: exception.statusCode,
      details: exception.details,
      exception: exception,
    );
  }

  @override
  String toString() =>
      'ApiFailure(message: $message, code: $code, statusCode: $statusCode)';
}

