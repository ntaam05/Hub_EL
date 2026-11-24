import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/dashboard_entity.dart';

class ContinueLearningCard extends StatelessWidget {
  final ContinueLearningEntity? continueLearning;
  final VoidCallback? onStartLearning;

  const ContinueLearningCard({
    super.key,
    this.continueLearning,
    this.onStartLearning,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.playCircle, size: 18, color: AppColors.primaryLight),
            AppSpacing.gapH8,
            Text(
              'TIẾP TỤC HỌC',
              style: AppTextStyles.h3.copyWith(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ],
        ),
        AppSpacing.gapV12,

        if (continueLearning != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.spaceCard : Colors.white,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: isDark ? AppColors.spaceCardBorder : Colors.grey.shade200,
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
                  blurRadius: 25,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Khung thumbnail 16:9
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (continueLearning!.thumbnailUrl.isNotEmpty)
                          Image.network(
                            continueLearning!.thumbnailUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(color: Colors.black26),
                          )
                        else
                          Container(color: Colors.black38),

                        // Overlay Play Button
                        Container(
                          color: Colors.black.withValues(alpha: 0.35),
                          child: Center(
                            child: Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.25),
                              ),
                              child: const Icon(
                                LucideIcons.playCircle,
                                color: Colors.white,
                                size: 32,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                AppSpacing.gapV16,

                // Tên chuyên mục / Khóa học
                Text(
                  continueLearning!.course.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                    color: AppColors.primaryLight,
                  ),
                ),
                AppSpacing.gapV4,

                // Tiêu đề video bài học
                Text(
                  continueLearning!.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.h2.copyWith(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    height: 1.25,
                    color: isDark ? Colors.white : AppColors.lightTextPrimary,
                  ),
                ),
                AppSpacing.gapV16,

                // Thanh tiến độ & phần trăm
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: (continueLearning!.progress / 100).clamp(0.0, 1.0),
                          minHeight: 8,
                          backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
                        ),
                      ),
                    ),
                    AppSpacing.gapH12,
                    Text(
                      '${continueLearning!.progress}%',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                    ),
                  ],
                ),
                AppSpacing.gapV16,

                // Hàng thời gian còn lại & Nút vào học
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.clock, size: 14, color: AppColors.streak),
                          AppSpacing.gapH6,
                          Text(
                            continueLearning!.timeLeft,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                        foregroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 4,
                      ),
                      onPressed: onStartLearning,
                      icon: const Icon(LucideIcons.playCircle, size: 18),
                      label: const Text(
                        'Vào học',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ] else ...[
          // Empty State nét đứt
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
            decoration: BoxDecoration(
              color: isDark ? AppColors.spaceCard.withValues(alpha: 0.6) : Colors.white,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                width: 1.5,
              ),
            ),
            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.playCircle, color: AppColors.primaryLight, size: 28),
                ),
                AppSpacing.gapV12,
                const Text(
                  'Chưa có bài học dở dang',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                AppSpacing.gapV6,
                Text(
                  'Hãy tìm kiếm một chủ đề bạn yêu thích và bắt đầu hành trình học tập ngay hôm nay!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
