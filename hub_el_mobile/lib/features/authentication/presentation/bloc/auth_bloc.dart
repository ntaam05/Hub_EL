import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/constants/app_environment.dart';
import '../../domain/usecases/check_auth_status_usecase.dart';
import '../../domain/usecases/forgot_password_usecase.dart';
import '../../domain/usecases/google_sign_in_usecase.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/verify_reset_password_usecase.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase loginUseCase;
  final RegisterUseCase registerUseCase;
  final CheckAuthStatusUseCase checkAuthStatusUseCase;
  final LogoutUseCase logoutUseCase;
  final ForgotPasswordUseCase forgotPasswordUseCase;
  final VerifyResetPasswordUseCase verifyResetPasswordUseCase;
  final GoogleSignInUseCase googleSignInUseCase;
  final GoogleSignIn googleSignIn;

  AuthBloc({
    required this.loginUseCase,
    required this.registerUseCase,
    required this.checkAuthStatusUseCase,
    required this.logoutUseCase,
    required this.forgotPasswordUseCase,
    required this.verifyResetPasswordUseCase,
    required this.googleSignInUseCase,
    GoogleSignIn? googleSignIn,
  })  : googleSignIn = googleSignIn ??
            GoogleSignIn(
              serverClientId: AppConfig.googleServerClientId,
              scopes: ['email', 'profile'],
            ),
        super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheckRequested);
    on<AuthLoginSubmitted>(_onLoginSubmitted);
    on<AuthRegisterSubmitted>(_onRegisterSubmitted);
    on<AuthSendOtpRequested>(_onSendOtpRequested);
    on<AuthGoogleSignInRequested>(_onGoogleSignInRequested);
    on<AuthForgotPasswordRequested>(_onForgotPasswordRequested);
    on<AuthVerifyResetPasswordRequested>(_onVerifyResetPasswordRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthUserBannedReceived>(_onUserBannedReceived);
    on<AuthSessionExpiredReceived>(_onSessionExpiredReceived);
    on<AuthUserBalanceUpdated>(_onUserBalanceUpdated);
    on<AuthUserRefreshed>(_onUserRefreshed);
  }

  Future<void> _onCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Đang kiểm tra phiên đăng nhập...'));
    final result = await checkAuthStatusUseCase();

    result.fold(
      onSuccess: (user, _) {
        if (user != null) {
          if (user.isBanned) {
            emit(const AuthBanned(reason: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.'));
          } else {
            emit(Authenticated(user: user));
          }
        } else {
          emit(const Unauthenticated());
        }
      },
      onFailure: (failure) {
        if (failure.code == 'USER_BANNED') {
          emit(AuthBanned(reason: failure.message));
        } else {
          emit(const Unauthenticated());
        }
      },
    );
  }

  Future<void> _onLoginSubmitted(
    AuthLoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Đang đăng nhập...'));
    final result = await loginUseCase(
      email: event.email,
      password: event.password,
    );

    result.fold(
      onSuccess: (user, _) {
        if (user.isBanned) {
          emit(const AuthBanned(reason: 'Tài khoản của bạn đã bị khóa!'));
        } else {
          emit(Authenticated(user: user));
        }
      },
      onFailure: (failure) {
        if (failure.code == 'USER_BANNED') {
          emit(AuthBanned(reason: failure.message));
        } else {
          emit(AuthFailure(message: failure.message, code: failure.code));
        }
      },
    );
  }

  Future<void> _onRegisterSubmitted(
    AuthRegisterSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Đang khởi tạo tài khoản...'));
    final result = await registerUseCase(
      name: event.name,
      email: event.email,
      password: event.password,
      code: event.code,
    );

    result.fold(
      onSuccess: (user, _) => emit(Authenticated(user: user)),
      onFailure: (failure) => emit(AuthFailure(message: failure.message, code: failure.code)),
    );
  }

  Future<void> _onSendOtpRequested(
    AuthSendOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Đang gửi mã OTP...'));
    final result = await registerUseCase.sendOtp(email: event.email);

    result.fold(
      onSuccess: (_, msg) => emit(AuthOtpSentState(
        email: event.email,
        message: msg ?? 'Mã xác thực đã được gửi về email của bạn!',
      )),
      onFailure: (failure) => emit(AuthFailure(message: failure.message, code: failure.code)),
    );
  }

  Future<void> _onGoogleSignInRequested(
    AuthGoogleSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(const AuthLoading(message: 'Đang kết nối tài khoản Google...'));
      
      // 1. Nếu có email được truyền trực tiếp (chế độ direct/fallback)
      if (event.email != null && event.email!.isNotEmpty) {
        final result = await googleSignInUseCase(
          email: event.email!,
          name: event.name ?? 'Google User',
          image: event.image,
        );

        result.fold(
          onSuccess: (user, _) => emit(Authenticated(user: user)),
          onFailure: (failure) {
            if (failure.code == 'USER_BANNED') {
              emit(AuthBanned(reason: failure.message));
            } else {
              emit(AuthFailure(message: failure.message, code: failure.code));
            }
          },
        );
        return;
      }

      // 2. Chạy luồng Native Google Sign In
      try {
        await googleSignIn.signOut();
      } catch (_) {}

      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        // Người dùng tự hủy đăng nhập
        emit(const Unauthenticated());
        return;
      }

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;

      final result = await googleSignInUseCase(
        email: googleUser.email,
        name: googleUser.displayName,
        image: googleUser.photoUrl,
        idToken: idToken,
      );

      result.fold(
        onSuccess: (user, _) => emit(Authenticated(user: user)),
        onFailure: (failure) {
          if (failure.code == 'USER_BANNED') {
            emit(AuthBanned(reason: failure.message));
          } else {
            emit(AuthFailure(message: failure.message, code: failure.code));
          }
        },
      );
    } catch (e) {
      final errorStr = e.toString();
      if (errorStr.contains('10') || errorStr.contains('DEVELOPER_ERROR') || errorStr.contains('sign_in_failed')) {
        emit(const AuthGoogleConfigHelp(
          packageName: 'com.example.hub_el_mobile',
          sha1: '30:E0:5A:E9:D1:DA:CC:94:E0:E4:D7:F3:F1:D1:9D:69:18:BA:46:6E',
          serverClientId: AppConfig.googleServerClientId,
          message: 'Google OAuth trên Android yêu cầu đăng ký SHA-1 và Package Name trên Google Cloud Console.',
        ));
      } else if (errorStr.contains('network_error') || errorStr.contains('7')) {
        emit(const AuthFailure(message: 'Lỗi kết nối mạng khi xác thực với Google.', code: 'GOOGLE_SIGN_IN_FAILED'));
      } else {
        emit(AuthFailure(message: 'Đăng nhập Google thất bại: $e', code: 'GOOGLE_SIGN_IN_FAILED'));
      }
    }
  }

  Future<void> _onForgotPasswordRequested(
    AuthForgotPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Đang xử lý yêu cầu OTP...'));
    final result = await forgotPasswordUseCase(email: event.email);

    result.fold(
      onSuccess: (_, msg) => emit(AuthOtpSentState(
        email: event.email,
        message: msg ?? 'Mã xác thực khôi phục mật khẩu đã được gửi đến email!',
      )),
      onFailure: (failure) => emit(AuthFailure(message: failure.message, code: failure.code)),
    );
  }

  Future<void> _onVerifyResetPasswordRequested(
    AuthVerifyResetPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Đang cập nhật mật khẩu mới...'));
    final result = await verifyResetPasswordUseCase(
      email: event.email,
      code: event.code,
      newPassword: event.newPassword,
    );

    result.fold(
      onSuccess: (_, msg) => emit(AuthPasswordResetSuccess(
        message: msg ?? 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.',
      )),
      onFailure: (failure) => emit(AuthFailure(message: failure.message, code: failure.code)),
    );
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Đang đăng xuất...'));
    await logoutUseCase();
    try {
      await googleSignIn.signOut();
    } catch (_) {}
    emit(const Unauthenticated(message: 'Bạn đã đăng xuất thành công.'));
  }

  void _onUserBannedReceived(
    AuthUserBannedReceived event,
    Emitter<AuthState> emit,
  ) {
    emit(AuthBanned(reason: event.reason));
  }

  void _onSessionExpiredReceived(
    AuthSessionExpiredReceived event,
    Emitter<AuthState> emit,
  ) {
    emit(const Unauthenticated(message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
  }

  void _onUserBalanceUpdated(
    AuthUserBalanceUpdated event,
    Emitter<AuthState> emit,
  ) {
    if (state is Authenticated) {
      final currentUser = (state as Authenticated).user;
      final updatedUser = currentUser.copyWith(
        freeCoins: event.freeCoins,
        aiTokens: event.aiTokens,
        premiumCoins: event.premiumCoins,
        stardust: event.stardust,
        isPro: event.isPro,
      );
      emit(Authenticated(user: updatedUser));
    }
  }

  Future<void> _onUserRefreshed(
    AuthUserRefreshed event,
    Emitter<AuthState> emit,
  ) async {
    final result = await checkAuthStatusUseCase();
    result.fold(
      onSuccess: (user, _) {
        if (user != null && !user.isBanned) {
          emit(Authenticated(user: user));
        }
      },
      onFailure: (_) {},
    );
  }
}
