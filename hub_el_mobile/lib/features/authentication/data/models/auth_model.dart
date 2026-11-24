import 'user_model.dart';

/// Model đóng gói phản hồi xác thực thành công (User, Access Token, Refresh Token)
class AuthModel {
  final UserModel user;
  final String accessToken;
  final String? refreshToken;

  const AuthModel({
    required this.user,
    required this.accessToken,
    this.refreshToken,
  });

  factory AuthModel.fromJson(Map<String, dynamic> json) {
    return AuthModel(
      user: UserModel.fromJson(
        json['user'] is Map<String, dynamic>
            ? json['user'] as Map<String, dynamic>
            : <String, dynamic>{},
      ),
      accessToken: json['accessToken']?.toString() ?? '',
      refreshToken: json['refreshToken']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'accessToken': accessToken,
      'refreshToken': refreshToken,
    };
  }
}

