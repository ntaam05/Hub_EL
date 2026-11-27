import 'dart:async';
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

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  int _step = 1; // 1: Email, 2: OTP + New Password
  int _countdown = 0;
  int _shakeTrigger = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _startTimer() {
    setState(() => _countdown = 60);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 0) {
        setState(() => _countdown--);
      } else {
        timer.cancel();
      }
    });
  }

  void _handleSendOtp() {
    final email = _emailController.text.trim();
    if (email.isEmpty || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _shakeTrigger++);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập Email hợp lệ!'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    context.read<AuthBloc>().add(AuthForgotPasswordRequested(email: email));
  }

  void _handleResetPassword() {
    final email = _emailController.text.trim();
    final otp = _otpController.text.trim();
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Mã OTP phải bao gồm 6 chữ số!'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (newPassword.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Mật khẩu mới phải từ 6 ký tự trở lên!'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (newPassword != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Mật khẩu xác nhận không khớp!'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    context.read<AuthBloc>().add(
          AuthVerifyResetPasswordRequested(
            email: email,
            code: otp,
            newPassword: newPassword,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Khôi phục mật khẩu'),
        centerTitle: true,
      ),
      body: SafeArea(
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
              } else if (state is AuthOtpSentState) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
                setState(() => _step = 2);
                _startTimer();
              } else if (state is AuthPasswordResetSuccess) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
                Navigator.of(context).pop();
              }
            },
            builder: (context, state) {
              final isLoading = state is AuthLoading;
              final btnState = state is AuthPasswordResetSuccess
                  ? LucianButtonState.ok
                  : isLoading
                      ? LucianButtonState.busy
                      : LucianButtonState.idle;

              return LucianShakeBox(
                shakeTrigger: _shakeTrigger,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(
                    LucideIcons.keyRound,
                    size: 48,
                    color: AppColors.primary,
                  ),
                  AppSpacing.gapV16,
                  Text(
                    _step == 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.h1.copyWith(
                      fontSize: 24,
                      color: isDark ? Colors.white : AppColors.lightTextPrimary,
                    ),
                  ),
                  AppSpacing.gapV8,
                  Text(
                    _step == 1
                        ? 'Nhập email liên kết với tài khoản Hub-EL để nhận mã xác nhận OTP.'
                        : 'Mã OTP đã được gửi đến ${_emailController.text}. Vui lòng nhập mã và mật khẩu mới.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  AppSpacing.gapV32,

                  if (_step == 1) ...[
                    CustomTextField(
                      controller: _emailController,
                      label: 'Email tài khoản',
                      hintText: 'nhapemail@example.com',
                      prefixIcon: const Icon(LucideIcons.mail, size: 18),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    AppSpacing.gapV24,
                    LucianPrimaryButton(
                      label: 'GỬI MÃ OTP',
                      state: isLoading
                          ? LucianButtonState.busy
                          : LucianButtonState.idle,
                      onPressed: isLoading ? null : _handleSendOtp,
                    ),
                  ] else ...[
                    CustomTextField(
                      controller: _otpController,
                      label: 'Mã xác nhận OTP (6 số)',
                      hintText: '123456',
                      prefixIcon: const Icon(LucideIcons.shieldCheck, size: 18),
                      keyboardType: TextInputType.number,
                    ),
                    AppSpacing.gapV16,
                    CustomTextField(
                      controller: _newPasswordController,
                      label: 'Mật khẩu mới',
                      hintText: '••••••••••••',
                      isPassword: true,
                      prefixIcon: const Icon(LucideIcons.lock, size: 18),
                    ),
                    AppSpacing.gapV16,
                    CustomTextField(
                      controller: _confirmPasswordController,
                      label: 'Xác nhận mật khẩu mới',
                      hintText: '••••••••••••',
                      isPassword: true,
                      prefixIcon: const Icon(LucideIcons.lock, size: 18),
                    ),
                    AppSpacing.gapV12,
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _countdown > 0
                              ? 'Gửi lại mã sau $_countdown s'
                              : 'Chưa nhận được mã?',
                          style: AppTextStyles.caption.copyWith(
                            color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                          ),
                        ),
                        TextButton(
                          onPressed: _countdown == 0 && !isLoading ? _handleSendOtp : null,
                          child: Text(
                            'Gửi lại OTP',
                            style: AppTextStyles.caption.copyWith(
                              color: _countdown == 0 ? AppColors.primary : AppColors.lightTextMuted,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    AppSpacing.gapV20,
                    LucianPrimaryButton(
                      label: 'ĐẶT LẠI MẬT KHẨU',
                      state: btnState,
                      onPressed: isLoading ? null : _handleResetPassword,
                    ),
                  ],
                ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

