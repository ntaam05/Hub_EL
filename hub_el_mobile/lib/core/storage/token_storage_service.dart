import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Hợp đồng giao tiếp của Dịch vụ Lưu trữ Token bảo mật
abstract class ITokenStorageService {
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
    String? userId,
  });

  Future<String?> getAccessToken();
  Future<String?> getRefreshToken();
  Future<String?> getUserId();
  Future<bool> hasAccessToken();
  Future<void> clearTokens();
}

/// Dịch vụ Lưu trữ Token sử dụng FlutterSecureStorage (mã hóa KeyStore/Keychain)
/// Tuyệt đối KHÔNG lưu trữ Token trong SharedPreferences.
class TokenStorageService implements ITokenStorageService {
  static const String _accessTokenKey = 'hubel_access_token';
  static const String _refreshTokenKey = 'hubel_refresh_token';
  static const String _userIdKey = 'hubel_user_id';

  final FlutterSecureStorage _storage;

  TokenStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(resetOnError: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  @override
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
    String? userId,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _refreshTokenKey, value: refreshToken);
    }
    if (userId != null) {
      await _storage.write(key: _userIdKey, value: userId);
    }
  }

  @override
  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  @override
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  @override
  Future<String?> getUserId() async {
    return await _storage.read(key: _userIdKey);
  }

  @override
  Future<bool> hasAccessToken() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _userIdKey);
  }
}
