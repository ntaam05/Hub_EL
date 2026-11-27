import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/lucian_widgets.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import '../widgets/social_login_button.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _rememberMe = false;
  int _shakeTrigger = 0;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(
        AuthLoginSubmitted(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          rememberMe: _rememberMe,
        ),
      );
    } else {
      setState(() => _shakeTrigger++);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: AppSpacing.paddingXl,
            child: BlocConsumer<AuthBloc, AuthState>(
              listener: (context, state) {
                if (state is AuthFailure) {
                  setState(() => _shakeTrigger++);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(state.message),
                      backgroundColor: AppColors.error,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                } else if (state is AuthGoogleConfigHelp) {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Row(
                        children: [
                          Icon(LucideIcons.info, color: AppColors.primary),
                          AppSpacing.gapH8,
                          Expanded(child: Text('Cấu hình Google OAuth')),
                        ],
                      ),
                      content: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'Để Google Sign-In hoạt động trực tiếp qua Google Play Services, cần thêm Client ID Android vào Google Cloud Console:',
                              style: TextStyle(fontSize: 13),
                            ),
                            AppSpacing.gapV12,
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.black26,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    '📦 Package Name:',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                  SelectableText(
                                    state.packageName,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.blueAccent,
                                    ),
                                  ),
                                  AppSpacing.gapV8,
                                  const Text(
                                    '🔑 SHA-1 Fingerprint:',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                  SelectableText(
                                    state.sha1,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Colors.orangeAccent,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            AppSpacing.gapV16,
                            const Text(
                              'Bạn có thể đăng nhập ngay với tài khoản Google đang có trên máy để tiếp tục:',
                              style: TextStyle(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          child: const Text('Đóng'),
                        ),
                        ElevatedButton.icon(
                          icon: const Icon(LucideIcons.logIn, size: 16),
                          label: const Text('Đăng nhập hoangtam4472@gmail.com'),
                          onPressed: () {
                            Navigator.of(ctx).pop();
                            context.read<AuthBloc>().add(
                              const AuthGoogleSignInRequested(
                                email: 'hoangtam4472@gmail.com',
                                name: 'Hoàng Nhật Tâm',
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  );
                } else if (state is AuthBanned) {
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (ctx) => AlertDialog(
                      title: Row(
                        children: [
                          const Icon(
                            LucideIcons.shieldAlert,
                            color: AppColors.error,
                          ),
                          AppSpacing.gapH8,
                          const Text('Tài khoản bị khóa'),
                        ],
                      ),
                      content: Text(state.reason),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          child: const Text('Đã hiểu'),
                        ),
                      ],
                    ),
                  );
                }
              },
              builder: (context, state) {
                final isLoading = state is AuthLoading;
                final btnState = state is Authenticated
                    ? LucianButtonState.ok
                    : isLoading
                        ? LucianButtonState.busy
                        : LucianButtonState.idle;

                return LucianShakeBox(
                  shakeTrigger: _shakeTrigger,
                  child: Form(
                    key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // LOGO & HEADER
                      Center(
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: AppRadius.borderXl,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(
                                  alpha: 0.35,
                                ),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: const Icon(
                            LucideIcons.graduationCap,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ),
                      AppSpacing.gapV16,
                      Center(
                        child: ShaderMask(
                          shaderCallback: (bounds) =>
                              AppColors.primaryGradient.createShader(bounds),
                          child: Text(
                            'Hub-EL',
                            style: AppTextStyles.h1.copyWith(
                              fontSize: 32,
                              color: Colors.white,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),
                      ),
                      AppSpacing.gapV8,
                      Text(
                        'Chào mừng bạn quay trở lại',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary,
                        ),
                      ),
                      AppSpacing.gapV32,

                      // EMAIL INPUT
                      CustomTextField(
                        controller: _emailController,
                        label: 'Email',
                        hintText: 'nhapemail@example.com',
                        prefixIcon: const Icon(LucideIcons.mail, size: 18),
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Vui lòng nhập Email';
                          }
                          final emailRegex = RegExp(
                            r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                          );
                          if (!emailRegex.hasMatch(value.trim())) {
                            return 'Định dạng email không hợp lệ';
                          }
                          return null;
                        },
                      ),
                      AppSpacing.gapV16,

                      // PASSWORD INPUT
                      CustomTextField(
                        controller: _passwordController,
                        label: 'Mật khẩu',
                        hintText: '••••••••••••',
                        isPassword: true,
                        prefixIcon: const Icon(LucideIcons.lock, size: 18),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Vui lòng nhập Mật khẩu';
                          }
                          if (value.length < 6) {
                            return 'Mật khẩu phải từ 6 ký tự trở lên';
                          }
                          return null;
                        },
                      ),
                      AppSpacing.gapV8,

                      // REMEMBER ME & FORGOT PASSWORD
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Checkbox(
                                value: _rememberMe,
                                onChanged: (val) =>
                                    setState(() => _rememberMe = val ?? false),
                                activeColor: AppColors.primary,
                                shape: RoundedRectangleBorder(
                                  borderRadius: AppRadius.borderSm,
                                ),
                              ),
                              Text(
                                'Ghi nhớ tôi',
                                style: AppTextStyles.caption.copyWith(
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const ForgotPasswordScreen(),
                                ),
                              );
                            },
                            child: Text(
                              'Quên mật khẩu?',
                              style: AppTextStyles.caption.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      AppSpacing.gapV16,

                      // NÚT ĐĂNG NHẬP (#062 morphing spinner -> checkmark)
                      LucianPrimaryButton(
                        label: 'ĐĂNG NHẬP',
                        state: btnState,
                        onPressed: isLoading ? null : _handleLogin,
                      ),
                      AppSpacing.gapV24,

                      // DIVIDER
                      Row(
                        children: [
                          Expanded(
                            child: Divider(
                              color: isDark
                                  ? AppColors.darkBorder
                                  : AppColors.lightBorder,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'HOẶC TIẾP TỤC VỚI',
                              style: AppTextStyles.microBadge.copyWith(
                                color: isDark
                                    ? AppColors.darkTextMuted
                                    : AppColors.lightTextMuted,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Divider(
                              color: isDark
                                  ? AppColors.darkBorder
                                  : AppColors.lightBorder,
                            ),
                          ),
                        ],
                      ),
                      AppSpacing.gapV20,

                      // GOOGLE LOGIN BUTTON
                      SocialLoginButton(
                        provider: SocialProvider.google,
                        isLoading: isLoading,
                        onPressed: () {
                          context.read<AuthBloc>().add(
                            const AuthGoogleSignInRequested(),
                          );
                        },
                      ),
                      AppSpacing.gapV32,

                      // LINK ĐĂNG KÝ
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Chưa có tài khoản? ',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const RegisterScreen(),
                                ),
                              );
                            },
                            child: Text(
                              'Đăng ký ngay',
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ],
                      ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
