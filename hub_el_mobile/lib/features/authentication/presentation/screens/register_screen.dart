import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _otpController = TextEditingController();

  bool _agreeTerms = true;
  bool _showOtpField = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _handleRegister() {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đồng ý với Điều khoản dịch vụ!'),
          backgroundColor: AppColors.warning,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    context.read<AuthBloc>().add(
          AuthRegisterSubmitted(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            code: _showOtpField ? _otpController.text.trim() : null,
          ),
        );
  }

  void _handleRequestOtp() {
    final email = _emailController.text.trim();
    if (email.isEmpty || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập Email hợp lệ để nhận mã OTP!'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _showOtpField = true);
    context.read<AuthBloc>().add(AuthSendOtpRequested(email: email));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đăng ký tài khoản'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: AppSpacing.paddingXl,
          child: BlocConsumer<AuthBloc, AuthState>(
            listener: (context, state) {
              if (state is AuthFailure) {
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
              } else if (state is Authenticated) {
                Navigator.of(context).pop(); // Quay về root hoặc router tự chuyển
              }
            },
            builder: (context, state) {
              final isLoading = state is AuthLoading;

              return Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Tạo tài khoản mới',
                      style: AppTextStyles.h1.copyWith(
                        fontSize: 26,
                        color: isDark ? Colors.white : AppColors.lightTextPrimary,
                      ),
                    ),
                    AppSpacing.gapV8,
                    Text(
                      'Nhận ngay 100 Xu Gacha và 20 Năng lượng AI tân thủ khi tham gia Hub-EL',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                    AppSpacing.gapV24,

                    // HỌ VÀ TÊN
                    CustomTextField(
                      controller: _nameController,
                      label: 'Họ và tên',
                      hintText: 'Nguyễn Văn A',
                      prefixIcon: const Icon(LucideIcons.user, size: 18),
                      validator: (value) {
                        if (value == null || value.trim().length < 2) {
                          return 'Họ tên phải có ít nhất 2 ký tự';
                        }
                        return null;
                      },
                    ),
                    AppSpacing.gapV16,

                    // EMAIL
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
                        final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
                        if (!emailRegex.hasMatch(value.trim())) {
                          return 'Định dạng email không hợp lệ';
                        }
                        return null;
                      },
                    ),
                    AppSpacing.gapV16,

                    // MẬT KHẨU
                    CustomTextField(
                      controller: _passwordController,
                      label: 'Mật khẩu',
                      hintText: '••••••••••••',
                      isPassword: true,
                      prefixIcon: const Icon(LucideIcons.lock, size: 18),
                      validator: (value) {
                        if (value == null || value.length < 6) {
                          return 'Mật khẩu phải từ 6 ký tự trở lên';
                        }
                        return null;
                      },
                    ),
                    AppSpacing.gapV16,

                    // NHẬP LẠI MẬT KHẨU
                    CustomTextField(
                      controller: _confirmPasswordController,
                      label: 'Xác nhận mật khẩu',
                      hintText: '••••••••••••',
                      isPassword: true,
                      prefixIcon: const Icon(LucideIcons.shieldCheck, size: 18),
                      validator: (value) {
                        if (value != _passwordController.text) {
                          return 'Mật khẩu xác nhận không trùng khớp';
                        }
                        return null;
                      },
                    ),
                    AppSpacing.gapV16,

                    // OTP FIELD (TÙY CHỌN HOẶC KHI GỬI OTP)
                    if (_showOtpField) ...[
                      CustomTextField(
                        controller: _otpController,
                        label: 'Mã xác thực OTP (6 số)',
                        hintText: '123456',
                        prefixIcon: const Icon(LucideIcons.keyRound, size: 18),
                        keyboardType: TextInputType.number,
                      ),
                      AppSpacing.gapV8,
                    ],

                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: isLoading ? null : _handleRequestOtp,
                        icon: const Icon(LucideIcons.mailCheck, size: 16),
                        label: Text(
                          _showOtpField ? 'Gửi lại mã OTP qua Email' : 'Xác thực OTP qua Email (Tùy chọn)',
                          style: AppTextStyles.caption.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    AppSpacing.gapV8,

                    // CHECKBOX ĐỒNG Ý ĐIỀU KHOẢN
                    Row(
                      children: [
                        Checkbox(
                          value: _agreeTerms,
                          onChanged: (val) => setState(() => _agreeTerms = val ?? false),
                          activeColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: AppRadius.borderSm),
                        ),
                        Expanded(
                          child: Text(
                            'Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Hub-EL',
                            style: AppTextStyles.caption.copyWith(
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    AppSpacing.gapV24,

                    // NÚT TẠO TÀI KHOẢN
                    CustomButton(
                      text: 'TẠO TÀI KHOẢN',
                      variant: ButtonVariant.gradient,
                      isLoading: isLoading,
                      onPressed: isLoading ? null : _handleRegister,
                    ),
                    AppSpacing.gapV24,

                    // QUAY LẠI ĐĂNG NHẬP
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Đã có tài khoản? ',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          child: Text(
                            'Đăng nhập',
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
              );
            },
          ),
        ),
      ),
    );
  }
}

