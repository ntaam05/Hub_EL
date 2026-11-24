import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../constants/app_environment.dart';

/// Interceptor ghi log mạng an toàn, tuân thủ nguyên tắc bảo mật:
/// TUYỆT ĐỐI KHÔNG ghi token, mật khẩu hoặc mã OTP vào Logs.
class LoggingInterceptor extends Interceptor {
  static const Set<String> _sensitiveKeys = {
    'password',
    'newpassword',
    'oldpassword',
    'otp',
    'secretkey',
    'accesskey',
    'signature',
    'idtoken',
    'refreshtoken',
    'accesstoken',
  };

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (AppConfig.enableLogging) {
      debugPrint('\n🌐 [DIO REQUEST] ──────────────────────────────');
      debugPrint('➡️ ${options.method} ${options.uri}');
      debugPrint('📋 Headers: ${_sanitizeHeaders(options.headers)}');
      if (options.data != null) {
        debugPrint('📦 Payload: ${_sanitizeData(options.data)}');
      }
      debugPrint('────────────────────────────────────────────────');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (AppConfig.enableLogging) {
      debugPrint('\n✅ [DIO RESPONSE] ─────────────────────────────');
      debugPrint('⬅️ ${response.statusCode} ${response.requestOptions.uri}');
      debugPrint('📦 Data: ${_sanitizeData(response.data)}');
      debugPrint('────────────────────────────────────────────────');
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (AppConfig.enableLogging) {
      debugPrint('\n❌ [DIO ERROR] ────────────────────────────────');
      debugPrint('💥 ${err.requestOptions.method} ${err.requestOptions.uri}');
      debugPrint('⚠️ Status: ${err.response?.statusCode}');
      debugPrint('⚠️ Type: ${err.type}');
      debugPrint('⚠️ Message: ${err.message}');
      if (err.response?.data != null) {
        debugPrint('📦 Error Data: ${_sanitizeData(err.response?.data)}');
      }
      debugPrint('────────────────────────────────────────────────');
    }
    handler.next(err);
  }

  /// Ẩn token trong Authorization Header
  Map<String, dynamic> _sanitizeHeaders(Map<String, dynamic> headers) {
    final sanitized = Map<String, dynamic>.from(headers);
    if (sanitized.containsKey('Authorization')) {
      sanitized['Authorization'] = 'Bearer [PROTECTED]';
    }
    if (sanitized.containsKey('authorization')) {
      sanitized['authorization'] = 'Bearer [PROTECTED]';
    }
    return sanitized;
  }

  /// Ẩn mật khẩu, OTP và token trong Request/Response body
  dynamic _sanitizeData(dynamic data) {
    if (data is Map) {
      final sanitized = <String, dynamic>{};
      data.forEach((key, value) {
        final lowerKey = key.toString().toLowerCase().replaceAll('_', '');
        if (_sensitiveKeys.contains(lowerKey)) {
          sanitized[key.toString()] = '[PROTECTED]';
        } else if (value is Map || value is List) {
          sanitized[key.toString()] = _sanitizeData(value);
        } else {
          sanitized[key.toString()] = value;
        }
      });
      return jsonEncode(sanitized);
    } else if (data is List) {
      return jsonEncode(data.map((item) => _sanitizeData(item)).toList());
    } else if (data is FormData) {
      return '[FormData with ${data.fields.length} fields, ${data.files.length} files]';
    }
    return data?.toString();
  }
}

