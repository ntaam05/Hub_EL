import '../../../../core/network/api_result.dart';
import '../../../../core/storage/token_storage_service.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements IAuthRepository {
  final IAuthRemoteDataSource remoteDataSource;
  final ITokenStorageService tokenStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.tokenStorage,
  });

  @override
  Future<ApiResult<UserEntity>> login({
    required String email,
    required String password,
  }) async {
    final result = await remoteDataSource.login(
      email: email,
      password: password,
    );

    return result.fold(
      onSuccess: (authModel, message) async {
        await tokenStorage.saveTokens(
          accessToken: authModel.accessToken,
          refreshToken: authModel.refreshToken,
          userId: authModel.user.id,
        );
        return ApiSuccess<UserEntity>(authModel.user, message: message);
      },
      onFailure: (failure) => ApiFailure<UserEntity>(
        message: failure.message,
        statusCode: failure.statusCode,
        code: failure.code,
        details: failure.details,
      ),
    );
  }

  @override
  Future<ApiResult<UserEntity>> register({
    required String email,
    required String password,
    required String name,
    String? code,
  }) async {
    final result = await remoteDataSource.register(
      email: email,
      password: password,
      name: name,
      code: code,
    );

    return result.fold(
      onSuccess: (authModel, message) async {
        await tokenStorage.saveTokens(
          accessToken: authModel.accessToken,
          refreshToken: authModel.refreshToken,
          userId: authModel.user.id,
        );
        return ApiSuccess<UserEntity>(authModel.user, message: message);
      },
      onFailure: (failure) => ApiFailure<UserEntity>(
        message: failure.message,
        statusCode: failure.statusCode,
        code: failure.code,
        details: failure.details,
      ),
    );
  }

  @override
  Future<ApiResult<void>> sendRegisterOtp({required String email}) {
    return remoteDataSource.sendRegisterOtp(email: email);
  }

  @override
  Future<ApiResult<UserEntity>> getCurrentUser() async {
    final result = await remoteDataSource.getCurrentUser();
    return result.fold(
      onSuccess: (user, message) => ApiSuccess<UserEntity>(user, message: message),
      onFailure: (failure) => ApiFailure<UserEntity>(
        message: failure.message,
        statusCode: failure.statusCode,
        code: failure.code,
        details: failure.details,
      ),
    );
  }

  @override
  Future<ApiResult<UserEntity>> googleSignIn({
    required String email,
    String? name,
    String? image,
    String? idToken,
  }) async {
    final result = await remoteDataSource.googleSignIn(
      email: email,
      name: name,
      image: image,
      idToken: idToken,
    );

    return result.fold(
      onSuccess: (authModel, message) async {
        await tokenStorage.saveTokens(
          accessToken: authModel.accessToken,
          refreshToken: authModel.refreshToken,
          userId: authModel.user.id,
        );
        return ApiSuccess<UserEntity>(authModel.user, message: message);
      },
      onFailure: (failure) => ApiFailure<UserEntity>(
        message: failure.message,
        statusCode: failure.statusCode,
        code: failure.code,
        details: failure.details,
      ),
    );
  }

  @override
  Future<ApiResult<void>> logout() async {
    try {
      await remoteDataSource.logout();
    } catch (_) {
      // Bỏ qua lỗi mạng khi logout để luôn xóa token cục bộ
    } finally {
      await tokenStorage.clearTokens();
    }
    return const ApiSuccess<void>(null, message: 'Đăng xuất thành công.');
  }

  @override
  Future<ApiResult<void>> forgotPassword({required String email}) {
    return remoteDataSource.forgotPassword(email: email);
  }

  @override
  Future<ApiResult<void>> verifyResetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) {
    return remoteDataSource.verifyResetPassword(
      email: email,
      code: code,
      newPassword: newPassword,
    );
  }

  @override
  Future<bool> isAuthenticated() async {
    return await tokenStorage.hasAccessToken();
  }
}
