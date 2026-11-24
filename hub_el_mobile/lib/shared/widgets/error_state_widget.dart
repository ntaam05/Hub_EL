import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';
import 'custom_button.dart';

class ErrorStateWidget extends StatelessWidget {
  final String title;
  final String message;
  final String retryText;
  final VoidCallback? onRetry;
  final IconData icon;

  const ErrorStateWidget({
    super.key,
    this.title = 'Đã có lỗi xảy ra',
    this.message = 'Không thể tải dữ liệu vào lúc này. Vui lòng thử lại sau.',
    this.retryText = 'Thử lại',
    this.onRetry,
    this.icon = LucideIcons.alertOctagon,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Center(
      child: Padding(
        padding: AppSpacing.paddingXl,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.error.withValues(alpha: 0.15)
                    : AppColors.errorLight,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark
                      ? AppColors.error.withValues(alpha: 0.3)
                      : AppColors.errorBorder,
                  width: 1,
                ),
              ),
              child: Icon(
                icon,
                size: 32,
                color: AppColors.error,
              ),
            ),
            AppSpacing.gapV16,
            Text(
              title,
              style: AppTextStyles.h2.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            AppSpacing.gapV8,
            Text(
              message,
              style: AppTextStyles.bodyMedium.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              AppSpacing.gapV24,
              CustomButton(
                text: retryText,
                icon: const Icon(LucideIcons.refreshCw, size: 16),
                variant: ButtonVariant.primary,
                size: ButtonSize.medium,
                onPressed: onRetry,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
