import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../domain/entities/video_progress_entity.dart';

class LearningProgressBar extends StatelessWidget {
  final int currentPositionSeconds;
  final int totalDurationSeconds;
  final int watchedSeconds;
  final bool isCompleted;

  const LearningProgressBar({
    super.key,
    required this.currentPositionSeconds,
    required this.totalDurationSeconds,
    this.watchedSeconds = 0,
    required this.isCompleted,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final double rawPercent = totalDurationSeconds > 0
        ? (watchedSeconds / totalDurationSeconds).clamp(0.0, 1.0)
        : (isCompleted ? 0.5 : 0.0);

    final double displayPercent =
        isCompleted ? (rawPercent < 0.5 ? 0.5 : rawPercent) : rawPercent;

    final String currentTimeStr = VideoProgressEntity.formatSeconds(currentPositionSeconds);
    final String durationStr = VideoProgressEntity.formatSeconds(totalDurationSeconds);

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141416) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Badge trạng thái
              if (isCompleted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.success.withValues(alpha: 0.4),
                      width: 1,
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.checkCircle, size: 12, color: AppColors.success),
                      SizedBox(width: 4),
                      Text(
                        'ĐÃ HOÀN THÀNH (≥50% · +50 Xu, +50 EXP)',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.success,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.playCircle, size: 12, color: AppColors.primaryLight),
                      const SizedBox(width: 4),
                      Text(
                        'TIẾN ĐỘ: ${(displayPercent * 100).toInt()}% / 50%',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryLight,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),

              // Thời gian
              Text(
                totalDurationSeconds > 0 ? '$currentTimeStr / $durationStr' : currentTimeStr,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ),
          AppSpacing.gapV8,

          // Thanh hiển thị tiến độ (mục tiêu xem đủ 50% video)
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: displayPercent,
              minHeight: 6,
              backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(
                isCompleted ? AppColors.success : AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

