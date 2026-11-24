import 'package:dio/dio.dart';
import '../constants/app_environment.dart';
import '../errors/app_exceptions.dart';
import '../storage/token_storage_service.dart';
import 'api_result.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/error_interceptor.dart';
import 'interceptors/logging_interceptor.dart';

/// Lớp DioClient đóng gói toàn bộ cấu hình mạng cho ứng dụng Hub-EL
class DioClient {
  late final Dio _dio;
  final ITokenStorageService _tokenStorage;

  DioClient({
    Dio? dio,
    ITokenStorageService? tokenStorage,
    String? baseUrl,
    void Function()? onSessionExpired,
    void Function(String reason)? onUserBanned,
  }) : _tokenStorage = tokenStorage ?? TokenStorageService() {
    _dio = dio ??
        Dio(
          BaseOptions(
            baseUrl: baseUrl ?? AppConfig.baseUrl,
            connectTimeout: AppConfig.connectTimeout,
            receiveTimeout: AppConfig.receiveTimeout,
            sendTimeout: AppConfig.sendTimeout,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            responseType: ResponseType.json,
          ),
        );

    // Gắn kết hệ thống Interceptors
    _dio.interceptors.addAll([
      AuthInterceptor(
        tokenStorage: _tokenStorage,
        onSessionExpired: onSessionExpired,
        onUserBanned: onUserBanned,
        dioGetter: () => _dio,
      ),
      LoggingInterceptor(),
      ErrorInterceptor(),
    ]);
  }

  /// Truy cập trực tiếp instance Dio (dành cho các trường hợp nâng cao như FormData upload)
  Dio get dio => _dio;

  /// Cập nhật Base URL động khi thay đổi môi trường
  void setBaseUrl(String newBaseUrl) {
    _dio.options.baseUrl = newBaseUrl;
  }

  // ==========================================
  // PHƯƠNG THỨC HTTP CHUẨN ĐÓNG GÓI APIRESULT
  // ==========================================

  /// GET Request
  Future<ApiResult<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? fromJson,
  }) async {
    return _sendRequest<T>(
      () => _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      ),
      fromJson: fromJson,
    );
  }

  /// POST Request
  Future<ApiResult<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? fromJson,
  }) async {
    return _sendRequest<T>(
      () => _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      ),
      fromJson: fromJson,
    );
  }

  /// PUT Request
  Future<ApiResult<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? fromJson,
  }) async {
    return _sendRequest<T>(
      () => _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      ),
      fromJson: fromJson,
    );
  }

  /// DELETE Request
  Future<ApiResult<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? fromJson,
  }) async {
    return _sendRequest<T>(
      () => _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      ),
      fromJson: fromJson,
    );
  }

  /// PATCH Request
  Future<ApiResult<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? fromJson,
  }) async {
    return _sendRequest<T>(
      () => _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      ),
      fromJson: fromJson,
    );
  }

  // ==========================================
  // XỬ LÝ PHẢN HỒI VÀ ĐÓNG GÓI LỖI
  // ==========================================
  Future<ApiResult<T>> _sendRequest<T>(
    Future<Response> Function() requestExecutor, {
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final response = await requestExecutor();
      final dynamic rawData = response.data;

      // Xử lý bóc tách vỏ phong bì chuẩn { "success": true, "data": ... }
      dynamic payload = rawData;
      String? message;

      if (rawData is Map) {
        if (rawData.containsKey('data')) {
          payload = rawData['data'];
        }
        if (rawData.containsKey('message')) {
          message = rawData['message']?.toString();
        }
      }

      final T parsedData;
      if (fromJson != null) {
        parsedData = fromJson(payload);
      } else {
        parsedData = payload as T;
      }

      return ApiSuccess<T>(parsedData, message: message);
    } on DioException catch (e) {
      if (e.error is AppException) {
        return ApiFailure<T>.fromException(e.error as AppException);
      }
      return ApiFailure<T>(
        message: e.message ?? 'Đã có lỗi kết nối xảy ra.',
        statusCode: e.response?.statusCode,
      );
    } catch (e) {
      return ApiFailure<T>(
        message: 'Lỗi xử lý dữ liệu: $e',
        code: 'PARSE_ERROR',
      );
    }
  }
}

