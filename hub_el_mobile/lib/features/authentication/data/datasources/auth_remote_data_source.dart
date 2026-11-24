import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/auth_model.dart';
import '../models/user_model.dart';

abstract class IAuthRemoteDataSource {
  Future<ApiResult<AuthModel>> login({
    required String email,
    required String password,
  });

  Future<ApiResult<AuthModel>> register({
    required String email,
    required String password,
    required String name,
    String? code,
  });

  Future<ApiResult<void>> sendRegisterOtp({
    required String email,
  });

  Future<ApiResult<UserModel>> getCurrentUser();

  Future<ApiResult<AuthModel>> googleSignIn({
    required String email,
    String? name,
    String? image,
    String? idToken,
  });

  Future<ApiResult<void>> logout();

  Future<ApiResult<void>> forgotPassword({
    required String email,
  });

  Future<ApiResult<void>> verifyResetPassword({
    required String email,
    required String code,
    required String newPassword,
  });
}

class AuthRemoteDataSource implements IAuthRemoteDataSource {
  final DioClient dioClient;

  AuthRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<AuthModel>> login({
    required String email,
    required String password,
  }) async {
    return dioClient.post<AuthModel>(
      ApiEndpoints.login,
      data: {
        'email': email.trim(),
        'password': password,
      },
      options: Options(extra: {'requiresAuth': false}),
      fromJson: (json) => AuthModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<AuthModel>> register({
    required String email,
    required String password,
    required String name,
    String? code,
  }) async {
    final payload = <String, dynamic>{
      'email': email.trim(),
      'password': password,
      'name': name.trim(),
    };
    if (code != null && code.isNotEmpty) {
      payload['code'] = code.trim();
    }

    return dioClient.post<AuthModel>(
      ApiEndpoints.register,
      data: payload,
      options: Options(extra: {'requiresAuth': false}),
      fromJson: (json) => AuthModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<void>> sendRegisterOtp({
    required String email,
  }) async {
    return dioClient.post<void>(
      ApiEndpoints.register,
      data: {
        'email': email.trim(),
        'action': 'send_otp',
      },
      options: Options(extra: {'requiresAuth': false}),
    );
  }

  @override
  Future<ApiResult<UserModel>> getCurrentUser() async {
    return dioClient.get<UserModel>(
      ApiEndpoints.me,
      fromJson: (json) {
        if (json is Map<String, dynamic> && json.containsKey('user')) {
          return UserModel.fromJson(json['user'] as Map<String, dynamic>);
        }
        return UserModel.fromJson(json as Map<String, dynamic>);
      },
    );
  }

  @override
  Future<ApiResult<AuthModel>> googleSignIn({
    required String email,
    String? name,
    String? image,
    String? idToken,
  }) async {
    final data = <String, dynamic>{'email': email.trim()};
    if (name != null) data['name'] = name;
    if (image != null) data['image'] = image;
    if (idToken != null) data['idToken'] = idToken;

    return dioClient.post<AuthModel>(
      ApiEndpoints.google,
      data: data,
      options: Options(extra: {'requiresAuth': false}),
      fromJson: (json) => AuthModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<void>> logout() async {
    return dioClient.post<void>(
      ApiEndpoints.logout,
    );
  }

  @override
  Future<ApiResult<void>> forgotPassword({
    required String email,
  }) async {
    return dioClient.post<void>(
      ApiEndpoints.forgotPassword,
      data: {'email': email.trim()},
      options: Options(extra: {'requiresAuth': false}),
    );
  }

  @override
  Future<ApiResult<void>> verifyResetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    return dioClient.post<void>(
      ApiEndpoints.verifyResetPassword,
      data: {
        'email': email.trim(),
        'code': code.trim(),
        'newPassword': newPassword,
      },
      options: Options(extra: {'requiresAuth': false}),
    );
  }
}
