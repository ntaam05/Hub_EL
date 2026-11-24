import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/storage/token_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TokenStorageService Tests', () {
    late TokenStorageService tokenStorage;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      tokenStorage = TokenStorageService();
    });

    test('1. Ban đầu chưa có token -> hasAccessToken trả về false', () async {
      final hasToken = await tokenStorage.hasAccessToken();
      expect(hasToken, isFalse);

      final token = await tokenStorage.getAccessToken();
      expect(token, isNull);
    });

    test('2. Lưu token thành công và đọc lại chính xác', () async {
      await tokenStorage.saveTokens(
        accessToken: 'mock_jwt_access_token_123',
        refreshToken: 'mock_refresh_token_456',
        userId: 'user_cuid_789',
      );

      final hasToken = await tokenStorage.hasAccessToken();
      expect(hasToken, isTrue);

      final accessToken = await tokenStorage.getAccessToken();
      expect(accessToken, equals('mock_jwt_access_token_123'));

      final refreshToken = await tokenStorage.getRefreshToken();
      expect(refreshToken, equals('mock_refresh_token_456'));

      final userId = await tokenStorage.getUserId();
      expect(userId, equals('user_cuid_789'));
    });

    test('3. Xóa token (khi đăng xuất / hết hạn phiên) thành công', () async {
      await tokenStorage.saveTokens(
        accessToken: 'token_to_be_deleted',
        refreshToken: 'refresh_to_be_deleted',
        userId: 'user_to_be_deleted',
      );

      // Xác nhận đã lưu
      expect(await tokenStorage.hasAccessToken(), isTrue);

      // Thực hiện xóa
      await tokenStorage.clearTokens();

      // Kiểm tra sạch sẽ
      expect(await tokenStorage.hasAccessToken(), isFalse);
      expect(await tokenStorage.getAccessToken(), isNull);
      expect(await tokenStorage.getRefreshToken(), isNull);
      expect(await tokenStorage.getUserId(), isNull);
    });
  });
}

