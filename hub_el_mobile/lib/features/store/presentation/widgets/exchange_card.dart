import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/store_entities.dart';

class ExchangeCard extends StatelessWidget {
  final ExchangeRuleEntity rule;
  final VoidCallback onExchangeTap;
  final bool isLoading;

  const ExchangeCard({
    super.key,
    required this.rule,
    required this.onExchangeTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    // Xác định icon và màu sắc của tài nguyên nhận được
    IconData rewardIcon = LucideIcons.zap;
    Color rewardColor = Colors.blueAccent;
    String rewardName = 'NĂNG LƯỢNG';

    if (rule.rewardField == 'freeCoins') {
      rewardIcon = LucideIcons.coins;
      rewardColor = Colors.amber;
      rewardName = 'XU GACHA';
    } else if (rule.rewardField == 'premiumCoins') {
      rewardIcon = LucideIcons.gem;
      rewardColor = Colors.purpleAccent;
      rewardName = 'NGỌC';
    }

    // Icon của chi phí
    IconData costIcon = LucideIcons.gem;
    Color costColor = Colors.purpleAccent;
    String costName = 'Ngọc';

    if (rule.costField == 'freeCoins') {
      costIcon = LucideIcons.coins;
      costColor = Colors.amber;
      costName = 'Xu';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : Colors.blue.shade100,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon Container
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: rewardColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: rewardColor.withValues(alpha: 0.3)),
            ),
            child: Center(
              child: Icon(rewardIcon, size: 28, color: rewardColor),
            ),
          ),

          AppSpacing.gapH12,

          // Thông tin phần thưởng & Chi phí
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      currencyFormatter.format(rule.reward),
                      style: AppTextStyles.h2.copyWith(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : AppColors.lightTextPrimary,
                      ),
                    ),
                    AppSpacing.gapH6,
                    Text(
                      rewardName,
                      style: AppTextStyles.caption.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 10,
                        color: rewardColor,
                      ),
                    ),
                  ],
                ),
                AppSpacing.gapV4,
                Row(
                  children: [
                    Text(
                      'Chi phí: ${currencyFormatter.format(rule.cost)} $costName',
                      style: AppTextStyles.bodySmall.copyWith(
                        fontSize: 12,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                    AppSpacing.gapH4,
                    Icon(costIcon, size: 14, color: costColor),
                  ],
                ),
              ],
            ),
          ),

          // Nút Quy Đổi
          ElevatedButton(
            onPressed: isLoading ? null : onExchangeTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            child: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    'Đổi Ngay',
                    style: AppTextStyles.labelMedium.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
