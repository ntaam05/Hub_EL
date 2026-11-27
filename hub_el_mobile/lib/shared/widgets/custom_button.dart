import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

enum ButtonVariant {
  primary,
  gradient,
  pro,
  secondary,
  outline,
  ghost,
  destructive,
}

enum ButtonSize {
  small,
  medium,
  large,
}

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ButtonSize size;
  final Widget? icon;
  final bool isTrailingIcon;
  final bool isLoading;
  final bool isFullWidth;
  final BorderRadius? borderRadius;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.medium,
    this.icon,
    this.isTrailingIcon = false,
    this.isLoading = false,
    this.isFullWidth = false,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEnabled = onPressed != null && !isLoading;

    // Kích thước & Padding theo ButtonSize
    final double height;
    final EdgeInsets padding;
    final double fontSize;

    switch (size) {
      case ButtonSize.small:
        height = 36;
        padding = const EdgeInsets.symmetric(horizontal: 12);
        fontSize = 12;
        break;
      case ButtonSize.large:
        height = 52;
        padding = const EdgeInsets.symmetric(horizontal: 22);
        fontSize = 15;
        break;
      case ButtonSize.medium:
        height = 46;
        padding = const EdgeInsets.symmetric(horizontal: 16);
        fontSize = 14;
        break;
    }

    // Xác định màu nền, viền và chữ theo ButtonVariant
    Color? backgroundColor;
    Gradient? gradient;
    Color textColor = Colors.white;
    Border? border;

    switch (variant) {
      case ButtonVariant.primary:
        backgroundColor = AppColors.primary;
        textColor = Colors.white;
        break;
      case ButtonVariant.gradient:
        backgroundColor = AppColors.primary;
        textColor = Colors.white;
        break;
      case ButtonVariant.pro:
        backgroundColor = AppColors.proBadge;
        textColor = AppColors.proText;
        break;
      case ButtonVariant.secondary:
        backgroundColor = isDark ? AppColors.darkSurface : AppColors.lightInputFill;
        textColor = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
        break;
      case ButtonVariant.outline:
        backgroundColor = Colors.transparent;
        textColor = isDark ? AppColors.darkTextPrimary : AppColors.primary;
        border = Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.primary.withValues(alpha: 0.3),
          width: 1.5,
        );
        break;
      case ButtonVariant.ghost:
        backgroundColor = Colors.transparent;
        textColor = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
        break;
      case ButtonVariant.destructive:
        backgroundColor = AppColors.error;
        textColor = Colors.white;
        break;
    }

    final radius = borderRadius ?? AppRadius.borderMd;

    Widget buttonContent = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: fontSize + 2,
            height: fontSize + 2,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(textColor),
            ),
          ),
          AppSpacing.gapH8,
        ] else if (icon != null && !isTrailingIcon) ...[
          icon!,
          AppSpacing.gapH8,
        ],
        Text(
          text,
          style: AppTextStyles.labelLarge.copyWith(
            color: textColor,
            fontSize: fontSize,
          ),
        ),
        if (!isLoading && icon != null && isTrailingIcon) ...[
          AppSpacing.gapH8,
          icon!,
        ],
      ],
    );

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 150),
      opacity: isEnabled ? 1.0 : 0.5,
      child: Container(
        height: height,
        width: isFullWidth ? double.infinity : null,
        decoration: BoxDecoration(
          color: gradient == null ? backgroundColor : null,
          gradient: gradient,
          borderRadius: radius,
          border: border,
          boxShadow: (variant == ButtonVariant.pro && isEnabled)
              ? [
                  BoxShadow(
                    color: AppColors.proBadge.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: radius,
            onTap: isEnabled ? onPressed : null,
            child: Padding(
              padding: padding,
              child: buttonContent,
            ),
          ),
        ),
      ),
    );
  }
}
