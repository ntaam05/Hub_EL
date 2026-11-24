import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/core/storage/token_storage_service.dart';
import 'package:hub_el_mobile/features/authentication/data/datasources/auth_remote_data_source.dart';
import 'package:hub_el_mobile/features/authentication/data/models/auth_model.dart';
import 'package:hub_el_mobile/features/authentication/data/models/user_model.dart';
import 'package:hub_el_mobile/features/authentication/data/repositories/auth_repository_impl.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/check_auth_status_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/forgot_password_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/google_sign_in_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/login_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/logout_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/register_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/verify_reset_password_usecase.dart';
import 'package:hub_el_mobile/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:hub_el_mobile/features/authentication/presentation/bloc/auth_event.dart';
import 'package:hub_el_mobile/features/authentication/presentation/bloc/auth_state.dart';

class FakeAuthRemoteDataSource implements IAuthRemoteDataSource {
  bool shouldFailLogin = false;
  bool isUserBanned = false;
  bool emailExists = false;
  bool isOtpInvalid = false;
  bool isOtpExpired = false;

  UserModel sampleUser = const UserModel(
    id: 'user_123',
    email: 'student@hubel.edu.vn',
    name: 'Học viên Hub-EL',
    role: 'student',
    isActive: true,
    freeCoins: 100,
    aiTokens: 20,
    level: 2,
    xp: 450,
  );

  @override
  Future<ApiResult<AuthModel>> login({
    required String email,
    required String password,
  }) async {
    if (email == 'notfound@test.com') {
      return const ApiFailure<AuthModel>(
        message: 'Tài khoản không tồn tại',
        statusCode: 401,
        code: 'USER_NOT_FOUND',
      );
    }
    if (isUserBanned || email == 'banned@test.com') {
      return const ApiFailure<AuthModel>(
        message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên!',
        statusCode: 403,
        code: 'USER_BANNED',
      );
    }
    if (shouldFailLogin || password != 'correct_password') {
      return const ApiFailure<AuthModel>(
        message: 'Email hoặc mật khẩu không chính xác',
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      );
    }

    return ApiSuccess<AuthModel>(
      AuthModel(
        user: sampleUser,
        accessToken: 'mock_jwt_access_token_123',
        refreshToken: 'mock_jwt_refresh_token_123',
      ),
    );
  }

  @override
  Future<ApiResult<AuthModel>> register({
    required String email,
    required String password,
    required String name,
    String? code,
  }) async {
    if (emailExists || email == 'existing@test.com') {
      return const ApiFailure<AuthModel>(
        message: 'Email này đã được sử dụng!',
        statusCode: 400,
        code: 'EMAIL_EXISTS',
      );
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      return const ApiFailure<AuthModel>(
        message: 'Định dạng email không hợp lệ!',
        statusCode: 400,
        code: 'INVALID_EMAIL',
      );
    }
    if (password.length < 6) {
      return const ApiFailure<AuthModel>(
        message: 'Mật khẩu phải từ 6 ký tự trở lên!',
        statusCode: 400,
        code: 'WEAK_PASSWORD',
      );
    }
    if (isOtpInvalid) {
      return const ApiFailure<AuthModel>(
        message: 'Mã xác thực OTP không đúng!',
        statusCode: 400,
        code: 'INVALID_OTP',
      );
    }
    if (isOtpExpired) {
      return const ApiFailure<AuthModel>(
        message: 'Mã xác thực OTP đã hết hạn!',
        statusCode: 400,
        code: 'EXPIRED_OTP',
      );
    }

    return ApiSuccess<AuthModel>(
      AuthModel(
        user: UserModel(
          id: 'new_user_456',
          email: email,
          name: name,
          role: 'student',
          isActive: true,
          freeCoins: 100,
          aiTokens: 20,
        ),
        accessToken: 'new_registered_access_token',
        refreshToken: 'new_registered_refresh_token',
      ),
    );
  }

  @override
  Future<ApiResult<void>> sendRegisterOtp({required String email}) async {
    if (email == 'existing@test.com') {
      return const ApiFailure<void>(
        message: 'Email này đã được sử dụng!',
        statusCode: 400,
        code: 'EMAIL_EXISTS',
      );
    }
    return const ApiSuccess<void>(null, message: 'Mã OTP đã được gửi về email!');
  }

  @override
  Future<ApiResult<UserModel>> getCurrentUser() async {
    if (isUserBanned) {
      return const ApiFailure<UserModel>(
        message: 'Tài khoản của bạn đã bị khóa!',
        statusCode: 403,
        code: 'USER_BANNED',
      );
    }
    return ApiSuccess<UserModel>(sampleUser);
  }

  @override
  Future<ApiResult<AuthModel>> googleSignIn({
    required String email,
    String? name,
    String? image,
    String? idToken,
  }) async {
    return ApiSuccess<AuthModel>(
      AuthModel(
        user: sampleUser,
        accessToken: 'mock_google_access_token',
        refreshToken: 'mock_google_refresh_token',
      ),
    );
  }

  @override
  Future<ApiResult<void>> logout() async {
    return const ApiSuccess<void>(null, message: 'Đăng xuất thành công.');
  }

  @override
  Future<ApiResult<void>> forgotPassword({required String email}) async {
    if (email == 'notfound@test.com') {
      return const ApiFailure<void>(
        message: 'Email không tồn tại trong hệ thống.',
        statusCode: 400,
        code: 'EMAIL_NOT_FOUND',
      );
    }
    return const ApiSuccess<void>(null, message: 'Mã OTP đã được gửi về email!');
  }

  @override
  Future<ApiResult<void>> verifyResetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    if (isOtpInvalid || code != '123456') {
      return const ApiFailure<void>(
        message: 'Mã xác nhận không đúng!',
        statusCode: 400,
        code: 'INVALID_OTP',
      );
    }
    if (isOtpExpired) {
      return const ApiFailure<void>(
        message: 'Mã xác nhận đã hết hạn!',
        statusCode: 400,
        code: 'EXPIRED_OTP',
      );
    }
    return const ApiSuccess<void>(null, message: 'Đổi mật khẩu thành công!');
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FakeAuthRemoteDataSource fakeRemote;
  late TokenStorageService tokenStorage;
  late AuthRepositoryImpl authRepo;
  late AuthBloc authBloc;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    fakeRemote = FakeAuthRemoteDataSource();
    tokenStorage = TokenStorageService();
    authRepo = AuthRepositoryImpl(
      remoteDataSource: fakeRemote,
      tokenStorage: tokenStorage,
    );

    authBloc = AuthBloc(
      loginUseCase: LoginUseCase(authRepo),
      registerUseCase: RegisterUseCase(authRepo),
      checkAuthStatusUseCase: CheckAuthStatusUseCase(authRepo),
      logoutUseCase: LogoutUseCase(authRepo),
      forgotPasswordUseCase: ForgotPasswordUseCase(authRepo),
      verifyResetPasswordUseCase: VerifyResetPasswordUseCase(authRepo),
      googleSignInUseCase: GoogleSignInUseCase(authRepo),
    );
  });

  tearDown(() {
    authBloc.close();
  });

  group('Task 8: Authentication Automated Tests (16 Scenarios)', () {
    test('1. Đăng ký thành công -> Lưu token và phát ra Authenticated', () async {
      authBloc.add(
        const AuthRegisterSubmitted(
          name: 'Nguyễn Văn A',
          email: 'nguyenvana@test.com',
          password: 'password123',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<Authenticated>((state) => state.user.email == 'nguyenvana@test.com'),
        ]),
      );

      expect(await tokenStorage.hasAccessToken(), isTrue);
      expect(await tokenStorage.getAccessToken(), equals('new_registered_access_token'));
    });

    test('2. Email đã tồn tại -> Trả về lỗi EMAIL_EXISTS', () async {
      fakeRemote.emailExists = true;

      authBloc.add(
        const AuthRegisterSubmitted(
          name: 'Trùng Email',
          email: 'existing@test.com',
          password: 'password123',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthFailure>((state) => state.code == 'EMAIL_EXISTS'),
        ]),
      );
    });

    test('3. Email không hợp lệ -> Báo lỗi INVALID_EMAIL', () async {
      authBloc.add(
        const AuthRegisterSubmitted(
          name: 'Sai Định Dạng',
          email: 'not-an-email',
          password: 'password123',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthFailure>((state) => state.code == 'INVALID_EMAIL'),
        ]),
      );
    });

    test('4. Password không đạt yêu cầu (< 6 ký tự) -> Báo lỗi WEAK_PASSWORD', () async {
      authBloc.add(
        const AuthRegisterSubmitted(
          name: 'Mật Khẩu Ngắn',
          email: 'valid@test.com',
          password: '123',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthFailure>((state) => state.code == 'WEAK_PASSWORD'),
        ]),
      );
    });

    test('5. Đăng nhập thành công -> Lưu Access & Refresh Token', () async {
      authBloc.add(
        const AuthLoginSubmitted(
          email: 'student@hubel.edu.vn',
          password: 'correct_password',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<Authenticated>((state) => state.user.id == 'user_123'),
        ]),
      );

      expect(await tokenStorage.getAccessToken(), equals('mock_jwt_access_token_123'));
      expect(await tokenStorage.getRefreshToken(), equals('mock_jwt_refresh_token_123'));
    });

    test('6. Sai mật khẩu -> Báo lỗi INVALID_CREDENTIALS', () async {
      authBloc.add(
        const AuthLoginSubmitted(
          email: 'student@hubel.edu.vn',
          password: 'wrong_password',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthFailure>((state) => state.code == 'INVALID_CREDENTIALS'),
        ]),
      );
    });

    test('7. Tài khoản không tồn tại -> Báo lỗi USER_NOT_FOUND', () async {
      authBloc.add(
        const AuthLoginSubmitted(
          email: 'notfound@test.com',
          password: 'correct_password',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthFailure>((state) => state.code == 'USER_NOT_FOUND'),
        ]),
      );
    });

    test('8. Tài khoản bị khóa USER_BANNED -> Phát ra AuthBanned state', () async {
      authBloc.add(
        const AuthLoginSubmitted(
          email: 'banned@test.com',
          password: 'correct_password',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthBanned>((state) => state.reason.contains('khóa')),
        ]),
      );
    });

    test('9. Access Token hết hạn -> Interceptor kích hoạt session expired', () {
      authBloc.add(const AuthSessionExpiredReceived());

      expect(
        authBloc.stream,
        emits(predicate<Unauthenticated>((state) => state.message?.contains('hết hạn') ?? false)),
      );
    });

    test('10. Refresh Token hết hạn hoặc tài khoản bị ban -> AuthUserBannedReceived', () {
      authBloc.add(const AuthUserBannedReceived(reason: 'Tài khoản vi phạm quy chuẩn.'));

      expect(
        authBloc.stream,
        emits(predicate<AuthBanned>((state) => state.reason.contains('vi phạm'))),
      );
    });

    test('11. Đăng xuất -> Xóa sạch Token và phát ra Unauthenticated', () async {
      await tokenStorage.saveTokens(
        accessToken: 'token_to_clear',
        refreshToken: 'refresh_to_clear',
      );
      expect(await tokenStorage.hasAccessToken(), isTrue);

      authBloc.add(const AuthLogoutRequested());

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          isA<Unauthenticated>(),
        ]),
      );

      expect(await tokenStorage.hasAccessToken(), isFalse);
    });

    test('12. Khởi động lại app và duy trì phiên -> Đọc token thành công -> Authenticated', () async {
      await tokenStorage.saveTokens(
        accessToken: 'persisted_token',
        refreshToken: 'persisted_refresh',
      );

      authBloc.add(const AuthCheckRequested());

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<Authenticated>((state) => state.user.email == 'student@hubel.edu.vn'),
        ]),
      );
    });

    test('13. Gửi OTP -> Phát ra AuthOtpSentState', () async {
      authBloc.add(const AuthSendOtpRequested(email: 'otp@test.com'));

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthOtpSentState>((state) => state.email == 'otp@test.com'),
        ]),
      );
    });

    test('14. OTP không hợp lệ -> Báo lỗi INVALID_OTP', () async {
      authBloc.add(
        const AuthVerifyResetPasswordRequested(
          email: 'user@test.com',
          code: '000000',
          newPassword: 'newpassword123',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthFailure>((state) => state.code == 'INVALID_OTP'),
        ]),
      );
    });

    test('15. OTP hết hạn -> Báo lỗi EXPIRED_OTP', () async {
      fakeRemote.isOtpExpired = true;

      authBloc.add(
        const AuthVerifyResetPasswordRequested(
          email: 'user@test.com',
          code: '123456',
          newPassword: 'newpassword123',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthFailure>((state) => state.code == 'EXPIRED_OTP'),
        ]),
      );
    });

    test('16. Đổi mật khẩu thành công -> Phát ra AuthPasswordResetSuccess', () async {
      authBloc.add(
        const AuthVerifyResetPasswordRequested(
          email: 'user@test.com',
          code: '123456',
          newPassword: 'newpassword123',
        ),
      );

      await expectLater(
        authBloc.stream,
        emitsInOrder([
          isA<AuthLoading>(),
          predicate<AuthPasswordResetSuccess>((state) => state.message.contains('thành công')),
        ]),
      );
    });
  });
}

