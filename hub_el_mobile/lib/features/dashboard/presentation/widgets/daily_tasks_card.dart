import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/dashboard_entity.dart';

class DailyTasksCard extends StatelessWidget {
  final List<DailyTaskEntity> tasks;
  final int? claimingTaskId;
  final Function(int taskId)? onClaimReward;

  const DailyTasksCard({
    super.key,
    required this.tasks,
    this.claimingTaskId,
    this.onClaimReward,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.award, size: 18, color: AppColors.primaryLight),
            AppSpacing.gapH8,
            Text(
              'Nhiệm vụ hôm nay',
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
          child: tasks.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'Hôm nay không có nhiệm vụ nào cần làm.',
                      style: TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                  ),
                )
              : Column(
                  children: [
                    Builder(
                      builder: (context) {
                        final completedCount = tasks.where((t) => t.current >= t.target).length;
                        final progress = tasks.isNotEmpty ? completedCount / tasks.length : 0.0;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.03) : AppColors.lightInputFill,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                          ),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 42,
                                height: 42,
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    CircularProgressIndicator(
                                      value: progress,
                                      strokeWidth: 4,
                                      backgroundColor: isDark ? Colors.white12 : Colors.grey.shade300,
                                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.success),
                                    ),
                                    Text(
                                      '$completedCount/${tasks.length}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              AppSpacing.gapH12,
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Tiến độ nhiệm vụ',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                      ),
                                    ),
                                    Text(
                                      'Hoàn thành $completedCount trên ${tasks.length} nhiệm vụ hôm nay',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: tasks.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final item = tasks[index];
                        return _buildTaskTile(context, item, isDark);
                      },
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  Widget _buildTaskTile(BuildContext context, DailyTaskEntity item, bool isDark) {
    final style = _getTaskStyle(item.taskType);
    final isClaiming = claimingTaskId == item.id;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.shade200,
        ),
      ),
      child: Row(
        children: [
          // Icon nhiệm vụ
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: style.color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(style.icon, size: 20, color: style.color),
          ),
          AppSpacing.gapH12,

          // Nội dung & tiến độ
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item.taskDesc,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      '${item.current}/${item.target}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                      ),
                    ),
                  ],
                ),
                if (!item.isClaimed) ...[
                  AppSpacing.gapV6,
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: item.percent,
                      minHeight: 5,
                      backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(style.color),
                    ),
                  ),
                ],
              ],
            ),
          ),
          AppSpacing.gapH12,

          // Nút nhận thưởng hoặc trạng thái
          if (item.isClaimed) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isDark ? Colors.white10 : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.checkCircle, size: 14, color: AppColors.success),
                  SizedBox(width: 4),
                  Text('Đã nhận', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ] else if (item.isCompleted) ...[
            GestureDetector(
              onTap: isClaiming ? null : () => onClaimReward?.call(item.id),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isClaiming)
                      const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    else ...[
                      const Icon(LucideIcons.checkCircle, size: 14, color: Colors.white),
                      const SizedBox(width: 4),
                      const Text(
                        'Nhận',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ] else ...[
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (item.rewardXp > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.blue.withValues(alpha: 0.25)),
                    ),
                    child: Text(
                      '+${item.rewardXp} XP',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Colors.blueAccent,
                      ),
                    ),
                  ),
                if (item.rewardCoins > 0) ...[
                  const SizedBox(height: 3),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.amber.withValues(alpha: 0.25)),
                    ),
                    child: Text(
                      '+${item.rewardCoins} Xu',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.amberAccent : Colors.orange.shade800,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }

  _TaskStyle _getTaskStyle(String type) {
    switch (type.toUpperCase()) {
      case 'STUDY_TIME':
      case 'WATCH_MINUTE':
        return _TaskStyle(icon: LucideIcons.clock, color: Colors.green);
      case 'DO_QUIZ':
        return _TaskStyle(icon: LucideIcons.helpCircle, color: Colors.purpleAccent);
      case 'LOGIN':
        return _TaskStyle(icon: LucideIcons.logIn, color: Colors.blueAccent);
      case 'SAVE_COURSE':
        return _TaskStyle(icon: LucideIcons.bookmark, color: Colors.indigoAccent);
      case 'ROLL_GACHA':
        return _TaskStyle(icon: LucideIcons.sparkles, color: Colors.tealAccent);
      case 'WATCH_VIDEO':
      default:
        return _TaskStyle(icon: LucideIcons.tv, color: Colors.orange);
    }
  }
}

class _TaskStyle {
  final IconData icon;
  final Color color;

  _TaskStyle({required this.icon, required this.color});
}

