import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

enum ResourcePillType {
  streak,
  energy,
  coin,
  gem,
  pro,
}

class ResourcePill extends StatelessWidget {
  final ResourcePillType type;
  final String value;
  final VoidCallback? onTap;
  final bool isAnimated;
  final bool isActive;

  const ResourcePill({
    super.key,
    required this.type,
    required this.value,
    this.onTap,
    this.isAnimated = false,
    this.isActive = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final IconData iconData;
    final Color mainColor;
    final Color bgColor;
    final Color borderColor;

    switch (type) {
      case ResourcePillType.streak:
        iconData = LucideIcons.flame;
        if (isActive) {
          mainColor = AppColors.streak;
          bgColor = isDark ? AppColors.streak.withValues(alpha: 0.12) : AppColors.streakLight;
          borderColor = isDark ? AppColors.streak.withValues(alpha: 0.3) : AppColors.streakBorder;
        } else {
          mainColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
          bgColor = isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
          borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
        }
        break;
      case ResourcePillType.energy:
        iconData = LucideIcons.zap;
        mainColor = AppColors.energy;
        bgColor = isDark ? AppColors.energy.withValues(alpha: 0.12) : AppColors.energyLight;
        borderColor = isDark ? AppColors.energy.withValues(alpha: 0.3) : AppColors.energyBorder;
        break;
      case ResourcePillType.coin:
        iconData = LucideIcons.coins;
        mainColor = AppColors.coin;
        bgColor = isDark ? AppColors.coin.withValues(alpha: 0.12) : AppColors.coinLight;
        borderColor = isDark ? AppColors.coin.withValues(alpha: 0.3) : AppColors.coinBorder;
        break;
      case ResourcePillType.gem:
        iconData = LucideIcons.gem;
        mainColor = AppColors.gem;
        bgColor = isDark ? AppColors.gem.withValues(alpha: 0.12) : AppColors.gemLight;
        borderColor = isDark ? AppColors.gem.withValues(alpha: 0.3) : AppColors.gemBorder;
        break;
      case ResourcePillType.pro:
        iconData = LucideIcons.crown;
        mainColor = AppColors.proText;
        bgColor = AppColors.proBadge;
        borderColor = Colors.transparent;
        break;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3.5),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor, width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              iconData,
              size: 13,
              color: mainColor,
            ),
            const SizedBox(width: 3),
            Text(
              value,
              style: AppTextStyles.labelMedium.copyWith(
                color: mainColor,
                fontWeight: FontWeight.w800,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
