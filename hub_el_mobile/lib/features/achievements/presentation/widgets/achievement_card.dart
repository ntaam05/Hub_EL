import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/achievement_entities.dart';

class AchievementCard extends StatelessWidget {
  final AchievementItemEntity achievement;
  final VoidCallback onTap;

  const AchievementCard({
    super.key,
    required this.achievement,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isUnlocked = achievement.isUnlocked;
    final tier = achievement.tierEnum;
    final group = achievement.groupEnum;
    final tierColor = tier.primaryColor;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isUnlocked
              ? tierColor.withValues(alpha: isDark ? 0.45 : 0.35)
              : (isDark ? AppColors.darkBorder : Colors.grey.shade200),
          width: isUnlocked ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: isUnlocked
                ? tierColor.withValues(alpha: isDark ? 0.08 : 0.06)
                : Colors.black.withValues(alpha: isDark ? 0.15 : 0.02),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Stack(
            children: [
              // Nền mờ watermark ở góc phải
              Positioned(
                right: -10,
                bottom: -10,
                child: Opacity(
                  opacity: isUnlocked ? (isDark ? 0.12 : 0.08) : (isDark ? 0.05 : 0.03),
                  child: Icon(
                    isUnlocked ? LucideIcons.checkCircle2 : LucideIcons.lock,
                    size: 90,
                    color: isUnlocked ? tierColor : Colors.grey,
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header của Card: Badge cấp bậc & Group + Nút trạng thái
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Huy hiệu Cấp độ & Icon nhóm
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: tierColor.withValues(alpha: isDark ? 0.18 : 0.12),
                                borderRadius: BorderRadius.circular(15),
                                border: Border.all(
                                  color: tierColor.withValues(alpha: isDark ? 0.4 : 0.3),
                                  width: 1.5,
                                ),
                              ),
                              child: Center(
                                child: Icon(
                                  group.icon,
                                  color: isUnlocked ? tierColor : (isDark ? Colors.white70 : Colors.grey.shade700),
                                  size: 24,
                                ),
                              ),
                            ),
                            // Số cấp bậc nhỏ ở góc dưới
                            Positioned(
                              bottom: -4,
                              right: -4,
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isDark ? AppColors.darkCard : Colors.white,
                                    width: 2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    '${achievement.tier}',
                                    style: TextStyle(
                                      color: tierColor,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 12),

                        // Tên & Mô tả
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  // Nhãn Cấp bậc & Nhóm
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: tierColor.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '${tier.label.toUpperCase()} • ${group.label}',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.3,
                                        color: tierColor,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  if (isUnlocked)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.green.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(LucideIcons.check, size: 10, color: Colors.greenAccent),
                                          SizedBox(width: 2),
                                          Text(
                                            'ĐẠT',
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w900,
                                              color: Colors.greenAccent,
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  else
                                    Icon(
                                      LucideIcons.lock,
                                      size: 14,
                                      color: isDark ? Colors.white30 : Colors.grey.shade400,
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                achievement.title,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                  color: isUnlocked
                                      ? (isDark ? Colors.white : const Color(0xFF0F172A))
                                      : (isDark ? Colors.white70 : Colors.grey.shade700),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                achievement.desc,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? Colors.white54 : Colors.grey.shade600,
                                  height: 1.3,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Phần thưởng (XP, Xu, Năng lượng)
                    if (achievement.hasRewards) ...[
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          if (achievement.rewardXp > 0)
                            _buildRewardBadge(
                              text: '+${achievement.rewardXp.toLocaleString()} XP',
                              color: Colors.blueAccent,
                              isDark: isDark,
                            ),
                          if (achievement.rewardCoins > 0)
                            _buildRewardBadge(
                              text: '+${achievement.rewardCoins.toLocaleString()} Xu',
                              color: AppColors.coin,
                              isDark: isDark,
                              icon: LucideIcons.coins,
                            ),
                          if (achievement.rewardEnergy > 0)
                            _buildRewardBadge(
                              text: '+${achievement.rewardEnergy.toLocaleString()} NL',
                              color: Colors.cyanAccent,
                              isDark: isDark,
                              icon: LucideIcons.zap,
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                    ],

                    // Thanh tiến độ
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.black.withValues(alpha: 0.3) : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Tiến độ',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white54 : Colors.grey.shade600,
                                ),
                              ),
                              Text(
                                isUnlocked
                                    ? 'Hoàn thành'
                                    : '${achievement.currentProgress.toLocaleString()} / ${achievement.reqValue.toLocaleString()} (${achievement.progressPercent}%)',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: isUnlocked
                                      ? Colors.greenAccent
                                      : (isDark ? Colors.white70 : Colors.grey.shade800),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: (achievement.progressPercent / 100).clamp(0.0, 1.0),
                              minHeight: 5,
                              backgroundColor: isDark ? Colors.white12 : Colors.grey.shade300,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                isUnlocked ? Colors.greenAccent : tierColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRewardBadge({
    required String text,
    required Color color,
    required bool isDark,
    IconData? icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.15 : 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: color),
            const SizedBox(width: 3),
          ],
          Text(
            text,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

extension NumberFormatting on int {
  String toLocaleString() {
    return toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}

