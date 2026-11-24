import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';
import 'custom_button.dart';

enum DialogType {
  info,
  success,
  warning,
  error,
}

class CustomDialog extends StatelessWidget {
  final String title;
  final String message;
  final Widget? content;
  final DialogType type;
  final String confirmText;
  final VoidCallback? onConfirm;
  final String? cancelText;
  final VoidCallback? onCancel;
  final bool isDestructive;

  const CustomDialog({
    super.key,
    required this.title,
    required this.message,
    this.content,
    this.type = DialogType.info,
    this.confirmText = 'Xác nhận',
    this.onConfirm,
    this.cancelText,
    this.onCancel,
    this.isDestructive = false,
  });

  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required String message,
    Widget? content,
    DialogType type = DialogType.info,
    String confirmText = 'Xác nhận',
    VoidCallback? onConfirm,
    String? cancelText,
    VoidCallback? onCancel,
    bool isDestructive = false,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => CustomDialog(
        title: title,
        message: message,
        content: content,
        type: type,
        confirmText: confirmText,
        onConfirm: onConfirm,
        cancelText: cancelText,
        onCancel: onCancel,
        isDestructive: isDestructive,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final IconData iconData;
    final Color iconColor;
    final Color iconBg;

    switch (type) {
      case DialogType.success:
        iconData = LucideIcons.checkCircle2;
        iconColor = AppColors.success;
        iconBg = isDark ? AppColors.success.withValues(alpha: 0.15) : AppColors.successLight;
        break;
      case DialogType.warning:
        iconData = LucideIcons.alertTriangle;
        iconColor = AppColors.warning;
        iconBg = isDark ? AppColors.warning.withValues(alpha: 0.15) : AppColors.warningLight;
        break;
      case DialogType.error:
        iconData = LucideIcons.alertCircle;
        iconColor = AppColors.error;
        iconBg = isDark ? AppColors.error.withValues(alpha: 0.15) : AppColors.errorLight;
        break;
      case DialogType.info:
        iconData = LucideIcons.info;
        iconColor = AppColors.primary;
        iconBg = isDark ? AppColors.primary.withValues(alpha: 0.15) : AppColors.infoLight;
        break;
    }

    return Dialog(
      backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
      shape: const RoundedRectangleBorder(
        borderRadius: AppRadius.border2Xl,
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: AppRadius.border2Xl,
          border: Border.all(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
          boxShadow: AppShadows.dialog,
        ),
        padding: AppSpacing.paddingXl,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon hình tròn phía trên
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(
                iconData,
                color: iconColor,
                size: 28,
              ),
            ),
            AppSpacing.gapV16,

            // Tiêu đề
            Text(
              title,
              style: AppTextStyles.h2.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            AppSpacing.gapV8,

            // Nội dung mô tả
            Text(
              message,
              style: AppTextStyles.bodyMedium.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
              textAlign: TextAlign.center,
            ),

            if (content != null) ...[
              AppSpacing.gapV16,
              content!,
            ],

            AppSpacing.gapV24,

            // Các nút hành động
            Row(
              children: [
                if (cancelText != null) ...[
                  Expanded(
                    child: CustomButton(
                      text: cancelText!,
                      variant: ButtonVariant.secondary,
                      onPressed: () {
                        Navigator.of(context).pop();
                        onCancel?.call();
                      },
                    ),
                  ),
                  AppSpacing.gapH12,
                ],
                Expanded(
                  child: CustomButton(
                    text: confirmText,
                    variant: isDestructive
                        ? ButtonVariant.destructive
                        : ButtonVariant.primary,
                    onPressed: () {
                      Navigator.of(context).pop();
                      onConfirm?.call();
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
