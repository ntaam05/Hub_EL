import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/constants/app_environment.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/core/network/dio_client.dart';
import 'package:hub_el_mobile/core/network/interceptors/auth_interceptor.dart';
import 'package:hub_el_mobile/core/storage/token_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('DioClient & Network Configuration Tests', () {
    late TokenStorageService tokenStorage;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      tokenStorage = TokenStorageService();
      AppConfig.setEnvironment(AppEnvironment.development);
    });

    test('1. DioClient khởi tạo thành công với cấu hình Base URL', () {
      final client = DioClient(
        tokenStorage: tokenStorage,
        baseUrl: 'http://localhost:3000',
      );

      expect(client.dio.options.baseUrl, equals('http://localhost:3000'));
      expect(client.dio.options.connectTimeout, equals(AppConfig.connectTimeout));
      expect(client.dio.options.receiveTimeout, equals(AppConfig.receiveTimeout));
      expect(client.dio.options.headers['Content-Type'], equals('application/json'));
      expect(client.dio.options.headers['Accept'], equals('application/json'));
    });

    test('2. Thay đổi Base URL động thành công', () {
      final client = DioClient(tokenStorage: tokenStorage);
      client.setBaseUrl('https://api.hub-el.com');
      expect(client.dio.options.baseUrl, equals('https://api.hub-el.com'));
    });

    test('3. ApiResult: ApiSuccess & ApiFailure đóng gói chính xác', () {
      const success = ApiSuccess<String>('Dữ liệu trả về', message: 'Thành công');
      expect(success.isSuccess, isTrue);
      expect(success.isFailure, isFalse);
      expect(success.dataOrNull, equals('Dữ liệu trả về'));

      final mapped = success.map((d) => d.length);
      expect(mapped.dataOrNull, equals(14));

      final foldResult = success.fold(
        onSuccess: (data, msg) => 'OK: $data',
        onFailure: (failure) => 'FAIL',
      );
      expect(foldResult, equals('OK: Dữ liệu trả về'));

      const failure = ApiFailure<String>(
        message: 'Lỗi máy chủ',
        statusCode: 500,
        code: 'SERVER_ERROR',
      );
      expect(failure.isSuccess, isFalse);
      expect(failure.isFailure, isTrue);
      expect(failure.dataOrNull, isNull);
    });

    test('4. AuthInterceptor tự động gắn Bearer Token khi có token trong SecureStorage', () async {
      await tokenStorage.saveTokens(accessToken: 'my_super_secret_token');

      final interceptor = AuthInterceptor(tokenStorage: tokenStorage);
      final options = RequestOptions(path: '/api/v1/dashboard/stats');

      final handler = RequestInterceptorHandler();
      await interceptor.onRequest(options, handler);

      expect(options.headers['Authorization'], equals('Bearer my_super_secret_token'));
    });

    test('5. AuthInterceptor bỏ qua gắn token khi request có requiresAuth = false', () async {
      await tokenStorage.saveTokens(accessToken: 'my_super_secret_token');

      final interceptor = AuthInterceptor(tokenStorage: tokenStorage);
      final options = RequestOptions(
        path: '/api/v1/auth/login',
        extra: {'requiresAuth': false},
      );

      final handler = RequestInterceptorHandler();
      await interceptor.onRequest(options, handler);

      expect(options.headers.containsKey('Authorization'), isFalse);
    });
  });
}
