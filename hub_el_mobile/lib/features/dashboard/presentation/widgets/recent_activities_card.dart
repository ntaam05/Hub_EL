import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/dashboard_entity.dart';

class RecentActivitiesCard extends StatelessWidget {
  final List<RecentActivityEntity> activities;

  const RecentActivitiesCard({
    super.key,
    required this.activities,
  });

  String _formatTimeAgo(String dateString) {
    if (dateString.isEmpty) return 'Vừa xong';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inSeconds < 60) return 'Vừa xong';
      if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
      if (diff.inHours < 24) return '${diff.inHours} giờ trước';
      if (diff.inDays < 7) return '${diff.inDays} ngày trước';
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return 'Gần đây';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.history, size: 18, color: AppColors.primaryLight),
            AppSpacing.gapH8,
            Text(
              'Hoạt động gần đây',
              style: AppTextStyles.h3.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
          ],
        ),
        AppSpacing.gapV12,

        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              width: 1,
            ),
          ),
          child: activities.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'Chưa có hoạt động nào được ghi nhận.',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: activities.length,
                  separatorBuilder: (context, index) => const Divider(height: 16),
                  itemBuilder: (context, index) {
                    final item = activities[index];
                    final style = _getActivityStyle(item.type);

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: style.color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(style.icon, size: 16, color: style.color),
                        ),
                        AppSpacing.gapH12,
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    item.action,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: style.color,
                                    ),
                                  ),
                                  Text(
                                    _formatTimeAgo(item.timestamp),
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                item.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              if (item.context.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  item.context,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
        ),
      ],
    );
  }

  _ActivityStyle _getActivityStyle(String type) {
    switch (type.toUpperCase()) {
      case 'QUIZ':
        return _ActivityStyle(icon: LucideIcons.checkCircle, color: Colors.green);
      case 'RETAKE_QUIZ':
        return _ActivityStyle(icon: LucideIcons.rotateCcw, color: Colors.orange);
      case 'COURSE':
        return _ActivityStyle(icon: LucideIcons.graduationCap, color: Colors.indigoAccent);
      case 'ACHIEVEMENT':
        return _ActivityStyle(icon: LucideIcons.trophy, color: Colors.amber);
      case 'GACHA':
        return _ActivityStyle(icon: LucideIcons.sparkles, color: Colors.purpleAccent);
      case 'WIKI':
        return _ActivityStyle(icon: LucideIcons.bookOpen, color: Colors.teal);
      case 'VIDEO':
      default:
        return _ActivityStyle(icon: LucideIcons.playCircle, color: Colors.blueAccent);
    }
  }
}

class _ActivityStyle {
  final IconData icon;
  final Color color;

  _ActivityStyle({required this.icon, required this.color});
}

