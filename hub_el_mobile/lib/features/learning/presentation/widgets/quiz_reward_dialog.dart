import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';

class QuizRewardDialog extends StatelessWidget {
  final int earnedXP;
  final int earnedCoins;
  final VoidCallback onContinue;

  const QuizRewardDialog({
    super.key,
    required this.earnedXP,
    required this.earnedCoins,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1D21) : Colors.white,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(
            color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 32,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon Huy chương tỏa sáng
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.award,
                size: 42,
                color: Color(0xFF22C55E),
              ),
            ),
            AppSpacing.gapV20,

            // Tiêu đề chúc mừng
            Text(
              'Tuyệt Vời!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
                color: isDark ? Colors.white : AppColors.lightTextPrimary,
              ),
            ),
            AppSpacing.gapV8,
            Text(
              'Bạn đã hoàn thành xuất sắc và nhận được phần thưởng:',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                height: 1.4,
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
              ),
            ),
            AppSpacing.gapV24,

            // 2 Thẻ EXP và XU (1:1 Web UI)
            Row(
              children: [
                // Thẻ EXP
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? const Color(0xFF3B82F6).withValues(alpha: 0.3) : const Color(0xFFDBEAFE),
                      ),
                    ),
                    child: Column(
                      children: [
                        const Icon(LucideIcons.sparkles, color: Color(0xFF3B82F6), size: 24),
                        AppSpacing.gapV8,
                        Text(
                          '+$earnedXP',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF3B82F6),
                          ),
                        ),
                        const Text(
                          'EXP',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: Color(0xFF60A5FA),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                AppSpacing.gapH12,

                // Thẻ XU
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF2E2413) : const Color(0xFFFEFCE8),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? const Color(0xFFEAB308).withValues(alpha: 0.3) : const Color(0xFFFEF08A),
                      ),
                    ),
                    child: Column(
                      children: [
                        const Icon(LucideIcons.coins, color: Color(0xFFEAB308), size: 24),
                        AppSpacing.gapV8,
                        Text(
                          '+$earnedCoins',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFEAB308),
                          ),
                        ),
                        const Text(
                          'XU',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: Color(0xFFFACC15),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            AppSpacing.gapV24,

            // Nút Tiếp tục học
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                  foregroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 4,
                ),
                onPressed: onContinue,
                child: const Text(
                  'Tiếp Tục Học',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

