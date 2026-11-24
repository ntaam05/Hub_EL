import 'package:flutter/foundation.dart';

enum AppEnvironment {
  development,
  staging,
  production,
}

/// Cấu hình môi trường mạng và các tham số kỹ thuật của Hub-EL
class AppConfig {
  static AppEnvironment _environment = kDebugMode
      ? AppEnvironment.development
      : AppEnvironment.production;

  static String? _customBaseUrl;

  /// Thiết lập môi trường chạy ứng dụng
  static void setEnvironment(AppEnvironment env, {String? customBaseUrl}) {
    _environment = env;
    _customBaseUrl = customBaseUrl;
  }

  static AppEnvironment get environment => _environment;

  /// Địa chỉ Base URL máy chủ backend
  /// Mặc định:
  /// - Development: http://10.0.2.2:3000 (Android Emulator) hoặc http://localhost:3000 (iOS / Desktop)
  /// - Production: Máy chủ phát hành
  static String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }

    switch (_environment) {
      case AppEnvironment.development:
        // Hỗ trợ Android Emulator kết nối tới localhost của máy Host
        if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
          return 'http://10.0.2.2:3000';
        }
        return 'http://localhost:3000';

      case AppEnvironment.staging:
        return 'https://staging-api.hub-el.com';

      case AppEnvironment.production:
        return 'https://api.hub-el.com';
    }
  }

  /// Địa chỉ máy chủ Socket.io Realtime (dùng chung cổng với HTTP server)
  static String get webSocketUrl => baseUrl;

  /// Google OAuth 2.0 Web Client ID (dùng làm serverClientId trên Mobile để lấy idToken và xác thực)
  static const String googleServerClientId =
      '347743652273-vr0b9e1k7ahl8201h0eaoeh6h8vcisu5.apps.googleusercontent.com';

  // Thời gian chờ mạng tối đa (Timeout)
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 60);
  static const Duration sendTimeout = Duration(seconds: 30);

  /// Cho phép in log request/response (chỉ bật ở Development / Debug)
  static bool get enableLogging =>
      _environment == AppEnvironment.development && kDebugMode;
}

