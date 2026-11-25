import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

class StreakDialog extends StatelessWidget {
  final int streak;
  final int streakFreezes;
  final bool isStudiedToday;

  const StreakDialog({
    super.key,
    required this.streak,
    required this.streakFreezes,
    this.isStudiedToday = true,
  });

  static Future<void> show(
    BuildContext context, {
    required int streak,
    required int streakFreezes,
    bool isStudiedToday = true,
  }) {
    return showDialog(
      context: context,
      builder: (ctx) => StreakDialog(
        streak: streak,
        streakFreezes: streakFreezes,
        isStudiedToday: isStudiedToday,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: (isStudiedToday ? AppColors.streak : const Color(0xFF94A3B8)).withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(
                LucideIcons.flame,
                color: isStudiedToday ? AppColors.streak : const Color(0xFF94A3B8),
                size: 32,
              ),
            ),
            AppSpacing.gapV12,
            Text(
              '$streak Ngày Liên Tục! 🔥',
              style: AppTextStyles.h2.copyWith(fontSize: 20),
            ),
            AppSpacing.gapV8,
            Text(
              'Hãy học ít nhất một bài mỗi ngày để duy trì chuỗi học tập rực rỡ của bạn.',
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMedium.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            AppSpacing.gapV16,
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? Colors.blue.withValues(alpha: 0.1) : Colors.blue.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.blue.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.blue.shade500,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.snowflake, color: Colors.white, size: 20),
                  ),
                  AppSpacing.gapH12,
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Bảo vệ chuỗi', style: AppTextStyles.labelLarge),
                        Text(
                          'Tự động kích hoạt khi lỡ 1 ngày',
                          style: AppTextStyles.caption.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '$streakFreezes/2',
                    style: AppTextStyles.h2.copyWith(color: Colors.blueAccent, fontSize: 18),
                  ),
                ],
              ),
            ),
            AppSpacing.gapV20,
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Đã hiểu', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

