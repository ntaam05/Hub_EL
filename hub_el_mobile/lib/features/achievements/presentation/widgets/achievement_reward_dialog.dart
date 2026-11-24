import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../domain/entities/achievement_entities.dart';

class AchievementRewardDialog extends StatelessWidget {
  final int earnedXP;
  final int earnedCoins;
  final int earnedEnergy;
  final List<NewlyUnlockedEntity> newlyUnlocked;
  final VoidCallback onDismiss;

  const AchievementRewardDialog({
    super.key,
    required this.earnedXP,
    required this.earnedCoins,
    required this.earnedEnergy,
    this.newlyUnlocked = const [],
    required this.onDismiss,
  });

  static Future<void> show(
    BuildContext context, {
    required int earnedXP,
    required int earnedCoins,
    required int earnedEnergy,
    List<NewlyUnlockedEntity> newlyUnlocked = const [],
    required VoidCallback onDismiss,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AchievementRewardDialog(
        earnedXP: earnedXP,
        earnedCoins: earnedCoins,
        earnedEnergy: earnedEnergy,
        newlyUnlocked: newlyUnlocked,
        onDismiss: onDismiss,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: const Color(0xFFFBBF24).withValues(alpha: 0.5),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon Trophy tỏa sáng
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Color(0xFFFBBF24), Color(0xFFEA580C)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: const Center(
                child: Icon(LucideIcons.trophy, color: Colors.white, size: 36),
              ),
            ),
            AppSpacing.gapV16,

            const Text(
              'THÀNH TỰU MỚI! 🎉',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
                color: Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Chúc mừng bạn vừa mở khóa thành công thành tựu và nhận được phần thưởng:',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.white70 : Colors.grey.shade600,
                height: 1.4,
              ),
            ),
            AppSpacing.gapV16,

            // Danh sách thành tựu mới nếu có
            if (newlyUnlocked.isNotEmpty) ...[
              Container(
                constraints: const BoxConstraints(maxHeight: 120),
                child: SingleChildScrollView(
                  child: Column(
                    children: newlyUnlocked.map((ach) {
                      final tierColor = ach.tierEnum.primaryColor;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: tierColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: tierColor.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            Icon(LucideIcons.award, size: 14, color: tierColor),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                ach.title,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              ach.tierEnum.label,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: tierColor,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              AppSpacing.gapV16,
            ],

            // Khối hiển thị phần thưởng
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (earnedXP > 0)
                  Expanded(
                    child: _buildRewardCard(
                      label: 'EXP',
                      value: '+$earnedXP',
                      color: Colors.blueAccent,
                      isDark: isDark,
                    ),
                  ),
                if (earnedXP > 0 && (earnedCoins > 0 || earnedEnergy > 0))
                  const SizedBox(width: 8),
                if (earnedCoins > 0)
                  Expanded(
                    child: _buildRewardCard(
                      label: 'XU',
                      value: '+$earnedCoins',
                      color: AppColors.coin,
                      isDark: isDark,
                    ),
                  ),
                if (earnedCoins > 0 && earnedEnergy > 0)
                  const SizedBox(width: 8),
                if (earnedEnergy > 0)
                  Expanded(
                    child: _buildRewardCard(
                      label: 'NĂNG LƯỢNG',
                      value: '+$earnedEnergy',
                      color: Colors.greenAccent,
                      isDark: isDark,
                    ),
                  ),
              ],
            ),
            AppSpacing.gapV24,

            // Nút Tuyệt Vời
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  onDismiss();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: const Text('TUYỆT VỜI', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRewardCard({
    required String label,
    required String value,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.15 : 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white54 : Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }
}

