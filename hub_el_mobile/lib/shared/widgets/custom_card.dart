import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';

class CustomCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final Gradient? gradient;
  final Color? borderColor;
  final bool isHighlighted;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? shadows;

  const CustomCard({
    super.key,
    required this.child,
    this.padding = AppSpacing.paddingLg,
    this.onTap,
    this.backgroundColor,
    this.gradient,
    this.borderColor,
    this.isHighlighted = false,
    this.borderRadius,
    this.shadows,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final defaultBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final defaultBorder = isHighlighted
        ? AppColors.primary
        : (borderColor ?? (isDark ? AppColors.darkBorder : AppColors.lightBorder));
    final radius = borderRadius ?? AppRadius.border2Xl;

    return Container(
      decoration: BoxDecoration(
        color: gradient == null ? (backgroundColor ?? defaultBg) : null,
        gradient: gradient,
        borderRadius: radius,
        border: Border.all(
          color: defaultBorder,
          width: isHighlighted ? 1.5 : 1.0,
        ),
        boxShadow: shadows ?? AppShadows.soft,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: radius,
          onTap: onTap,
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      ),
    );
  }
}

