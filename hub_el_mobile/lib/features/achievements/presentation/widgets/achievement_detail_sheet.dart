import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../domain/entities/achievement_entities.dart';

class AchievementDetailSheet extends StatelessWidget {
  final AchievementItemEntity achievement;

  const AchievementDetailSheet({super.key, required this.achievement});

  static Future<void> show(BuildContext context, AchievementItemEntity achievement) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AchievementDetailSheet(achievement: achievement),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tier = achievement.tierEnum;
    final group = achievement.groupEnum;
    final isUnlocked = achievement.isUnlocked;
    final tierColor = tier.primaryColor;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 30,
            offset: const Offset(0, -10),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Thanh kéo
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              AppSpacing.gapV24,

              // Huy hiệu Cấp độ lớn
              Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: tierColor.withValues(alpha: isDark ? 0.2 : 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: tierColor.withValues(alpha: 0.4),
                        width: 2.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: tierColor.withValues(alpha: isDark ? 0.35 : 0.2),
                          blurRadius: 20,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        group.icon,
                        color: isUnlocked ? tierColor : (isDark ? Colors.white60 : Colors.grey.shade600),
                        size: 42,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: tierColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isDark ? AppColors.darkSurface : Colors.white,
                          width: 2,
                        ),
                      ),
                      child: Text(
                        'CẤP ${achievement.tier}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              AppSpacing.gapV16,

              // Tiêu đề & Cấp bậc
              Text(
                '${tier.label.toUpperCase()} • ${group.label}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                  color: tierColor,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                achievement.title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                achievement.desc,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white70 : Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
              AppSpacing.gapV20,

              // Khung Tiến độ thực tế
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              isUnlocked ? LucideIcons.checkCircle2 : LucideIcons.target,
                              size: 16,
                              color: isUnlocked ? Colors.greenAccent : tierColor,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Yêu cầu hoàn thành',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white70 : Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          isUnlocked
                              ? 'Đã mở khóa'
                              : '${achievement.currentProgress} / ${achievement.reqValue}',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            color: isUnlocked ? Colors.greenAccent : tierColor,
                          ),
                        ),
                      ],
                    ),
                    AppSpacing.gapV12,
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: (achievement.progressPercent / 100).clamp(0.0, 1.0),
                        minHeight: 8,
                        backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isUnlocked ? Colors.greenAccent : tierColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              AppSpacing.gapV16,

              // Khung Phần thưởng
              if (achievement.hasRewards) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (achievement.rewardXp > 0)
                      _buildRewardChip(
                        label: '+${achievement.rewardXp} EXP',
                        color: Colors.blueAccent,
                        isDark: isDark,
                      ),
                    if (achievement.rewardCoins > 0) ...[
                      const SizedBox(width: 8),
                      _buildRewardChip(
                        label: '+${achievement.rewardCoins} Xu',
                        color: AppColors.coin,
                        icon: LucideIcons.coins,
                        isDark: isDark,
                      ),
                    ],
                    if (achievement.rewardEnergy > 0) ...[
                      const SizedBox(width: 8),
                      _buildRewardChip(
                        label: '+${achievement.rewardEnergy} NL',
                        color: Colors.cyanAccent,
                        icon: LucideIcons.zap,
                        isDark: isDark,
                      ),
                    ],
                  ],
                ),
                AppSpacing.gapV20,
              ],

              // Nút Đóng
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('ĐÓNG', style: TextStyle(fontWeight: FontWeight.w900)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRewardChip({
    required String label,
    required Color color,
    IconData? icon,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.15 : 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

