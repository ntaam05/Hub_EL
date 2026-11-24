import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../constants/api_endpoints.dart';
import '../../constants/app_environment.dart';
import '../../storage/token_storage_service.dart';

/// Interceptor quản lý xác thực:
/// 1. Tự động gắn Bearer Token vào Request Header nếu có token.
/// 2. Bắt lỗi HTTP 401 (Unauthorized):
///    - Nếu token hết hạn, thực hiện Refresh Token một cách an toàn (chống concurrent duplicate refreshes).
///    - Nếu refresh thành công, tự động re-fetch request gốc.
///    - Nếu refresh thất bại, xóa token và gọi callback hết hạn phiên.
/// 3. Bắt lỗi HTTP 403 (Forbidden / USER_BANNED): Xóa token và kích hoạt callback tài khoản bị khóa.
class AuthInterceptor extends Interceptor {
  final ITokenStorageService tokenStorage;
  final VoidCallback? onSessionExpired;
  final void Function(String reason)? onUserBanned;
  final Dio? Function()? dioGetter;

  Completer<bool>? _refreshCompleter;

  AuthInterceptor({
    required this.tokenStorage,
    this.onSessionExpired,
    this.onUserBanned,
    this.dioGetter,
  });

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final requiresAuth = options.extra['requiresAuth'] ?? true;

    if (requiresAuth) {
      final token = await tokenStorage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final statusCode = err.response?.statusCode;
    final responseData = err.response?.data;
    final path = err.requestOptions.path;

    // 1. Xử lý 403 Forbidden (USER_BANNED)
    if (statusCode == 403) {
      bool isBanned = false;
      String banReason = 'Tài khoản của bạn đã bị khóa!';

      if (responseData is Map) {
        final code = responseData['code']?.toString().toUpperCase();
        final errorMsg = responseData['error']?.toString();
        if (code == 'USER_BANNED' || (errorMsg != null && errorMsg.toLowerCase().contains('khóa'))) {
          isBanned = true;
          if (errorMsg != null && errorMsg.isNotEmpty) {
            banReason = errorMsg;
          }
        }
      }

      if (isBanned) {
        debugPrint('⛔ [AUTH] Phát hiện tài khoản bị khóa (USER_BANNED).');
        await tokenStorage.clearTokens();
        onUserBanned?.call(banReason);
        handler.next(err);
        return;
      }
    }

    // 2. Xử lý 401 Unauthorized
    if (statusCode == 401) {
      final isAuthEndpoint = path.contains(ApiEndpoints.login) ||
          path.contains(ApiEndpoints.register) ||
          path.contains(ApiEndpoints.refreshToken);
      final isRetry = err.requestOptions.extra['isRetry'] == true;

      if (!isAuthEndpoint && !isRetry) {
        final refreshToken = await tokenStorage.getRefreshToken();
        if (refreshToken != null && refreshToken.isNotEmpty) {
          final refreshSuccess = await _tryRefreshToken(refreshToken);
          if (refreshSuccess) {
            final newAccessToken = await tokenStorage.getAccessToken();
            if (newAccessToken != null && dioGetter != null) {
              final dio = dioGetter!();
              if (dio != null) {
                try {
                  final options = err.requestOptions;
                  options.headers['Authorization'] = 'Bearer $newAccessToken';
                  options.extra['isRetry'] = true;
                  final response = await dio.fetch(options);
                  return handler.resolve(response);
                } catch (_) {
                  // Fall through
                }
              }
            }
          }
        }
      }

      debugPrint('⚠️ [AUTH] Phát hiện HTTP 401: Phiên đăng nhập đã hết hạn.');
      await tokenStorage.clearTokens();
      onSessionExpired?.call();
    }

    handler.next(err);
  }

  Future<bool> _tryRefreshToken(String refreshToken) async {
    if (_refreshCompleter != null) {
      return await _refreshCompleter!.future;
    }

    final completer = Completer<bool>();
    _refreshCompleter = completer;

    try {
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: AppConfig.baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        ),
      );

      final response = await refreshDio.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200 && response.data is Map) {
        final data = response.data['data'] ?? response.data;
        final newAccessToken = data['accessToken']?.toString();
        final newRefreshToken = data['refreshToken']?.toString();

        if (newAccessToken != null) {
          await tokenStorage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken ?? refreshToken,
          );
          completer.complete(true);
          return true;
        }
      }

      completer.complete(false);
      return false;
    } catch (_) {
      completer.complete(false);
      return false;
    } finally {
      _refreshCompleter = null;
    }
  }
}
