import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/errors/app_exceptions.dart';
import 'package:hub_el_mobile/core/network/interceptors/auth_interceptor.dart';
import 'package:hub_el_mobile/core/network/interceptors/error_interceptor.dart';
import 'package:hub_el_mobile/core/storage/token_storage_service.dart';

class _MockErrorInterceptorHandler extends ErrorInterceptorHandler {
  DioException? capturedError;

  @override
  void next(DioException err) {
    capturedError = err;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('HTTP Error Handling & Interceptor Tests', () {
    late TokenStorageService tokenStorage;
    late ErrorInterceptor errorInterceptor;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      tokenStorage = TokenStorageService();
      errorInterceptor = ErrorInterceptor();
    });

    test('1. Xử lý HTTP 401: AuthInterceptor xóa token và gọi onSessionExpired', () async {
      await tokenStorage.saveTokens(accessToken: 'expired_token');
      expect(await tokenStorage.hasAccessToken(), isTrue);

      bool sessionExpiredCalled = false;
      final authInterceptor = AuthInterceptor(
        tokenStorage: tokenStorage,
        onSessionExpired: () => sessionExpiredCalled = true,
      );

      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/api/v1/dashboard/stats'),
        response: Response(
          requestOptions: RequestOptions(path: '/api/v1/dashboard/stats'),
          statusCode: 401,
          data: {'error': 'Phiên đăng nhập đã hết hạn.'},
        ),
        type: DioExceptionType.badResponse,
      );

      final handler = _MockErrorInterceptorHandler();
      await authInterceptor.onError(dioErr, handler);

      expect(sessionExpiredCalled, isTrue);
      expect(await tokenStorage.hasAccessToken(), isFalse); // Token đã bị xóa sạch
      expect(handler.capturedError, equals(dioErr));
    });

    test('2. Xử lý HTTP 403 USER_BANNED: AuthInterceptor xóa token và kích hoạt onUserBanned', () async {
      await tokenStorage.saveTokens(accessToken: 'banned_user_token');

      String? banReason;
      final authInterceptor = AuthInterceptor(
        tokenStorage: tokenStorage,
        onUserBanned: (reason) => banReason = reason,
      );

      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/api/v1/dashboard/stats'),
        response: Response(
          requestOptions: RequestOptions(path: '/api/v1/dashboard/stats'),
          statusCode: 403,
          data: {
            'error': 'Tài khoản của bạn đã bị khóa!',
            'code': 'USER_BANNED',
          },
        ),
        type: DioExceptionType.badResponse,
      );

      final handler = _MockErrorInterceptorHandler();
      await authInterceptor.onError(dioErr, handler);

      expect(banReason, equals('Tài khoản của bạn đã bị khóa!'));
      expect(await tokenStorage.hasAccessToken(), isFalse); // Token đã bị xóa
      expect(handler.capturedError, equals(dioErr));
    });

    test('3. Xử lý HTTP 404: ErrorInterceptor tạo NotFoundException', () {
      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/api/v1/unknown-endpoint'),
        response: Response(
          requestOptions: RequestOptions(path: '/api/v1/unknown-endpoint'),
          statusCode: 404,
          data: {'error': 'Không tìm thấy trang yêu cầu.'},
        ),
        type: DioExceptionType.badResponse,
      );

      final appException = errorInterceptor.mapDioException(dioErr);
      expect(appException, isA<NotFoundException>());
      expect((appException as NotFoundException).statusCode, equals(404));
      expect(appException.message, equals('Không tìm thấy trang yêu cầu.'));
    });

    test('4. Xử lý HTTP 500: ErrorInterceptor tạo ServerException', () {
      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/api/v1/gacha/roll'),
        response: Response(
          requestOptions: RequestOptions(path: '/api/v1/gacha/roll'),
          statusCode: 500,
          data: {'error': 'Lỗi nội bộ máy chủ CSDL SQL Server.'},
        ),
        type: DioExceptionType.badResponse,
      );

      final appException = errorInterceptor.mapDioException(dioErr);
      expect(appException, isA<ServerException>());
      expect((appException as ServerException).statusCode, equals(500));
      expect(appException.message, contains('Lỗi nội bộ máy chủ'));
    });

    test('5. Xử lý Lỗi Mạng Connection Timeout -> NetworkException', () {
      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/api/v1/video/search'),
        type: DioExceptionType.connectionTimeout,
      );

      final appException = errorInterceptor.mapDioException(dioErr);
      expect(appException, isA<NetworkException>());
      expect((appException as NetworkException).code, equals('CONNECTION_TIMEOUT'));
    });

    test('6. Xử lý Lỗi Thiếu Năng Lượng -> InsufficientResourceException', () {
      final dioErr = DioException(
        requestOptions: RequestOptions(path: '/api/v1/wiki/generate-lesson'),
        response: Response(
          requestOptions: RequestOptions(path: '/api/v1/wiki/generate-lesson'),
          statusCode: 400,
          data: {
            'error': 'Bạn không đủ năng lượng! Cần 7⚡ để tạo bài học.',
            'code': 'INSUFFICIENT_ENERGY',
          },
        ),
        type: DioExceptionType.badResponse,
      );

      final appException = errorInterceptor.mapDioException(dioErr);
      expect(appException, isA<InsufficientResourceException>());
      final resEx = appException as InsufficientResourceException;
      expect(resEx.resourceType, equals('ENERGY'));
      expect(resEx.code, equals('INSUFFICIENT_ENERGY'));
    });
  });
}
