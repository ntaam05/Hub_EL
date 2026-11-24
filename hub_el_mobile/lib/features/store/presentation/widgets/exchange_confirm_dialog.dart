import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/store_entities.dart';

class ExchangeConfirmDialog extends StatelessWidget {
  final ExchangeRuleEntity rule;
  final StoreBalanceEntity balance;
  final VoidCallback onConfirm;

  const ExchangeConfirmDialog({
    super.key,
    required this.rule,
    required this.balance,
    required this.onConfirm,
  });

  static Future<void> show(
    BuildContext context, {
    required ExchangeRuleEntity rule,
    required StoreBalanceEntity balance,
    required VoidCallback onConfirm,
  }) {
    return showDialog(
      context: context,
      builder: (_) => ExchangeConfirmDialog(
        rule: rule,
        balance: balance,
        onConfirm: onConfirm,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    int currentBalance = 0;
    String costUnit = 'Ngọc';
    if (rule.costField == 'premiumCoins') {
      currentBalance = balance.premiumCoins;
      costUnit = 'Ngọc';
    } else if (rule.costField == 'freeCoins') {
      currentBalance = balance.freeCoins;
      costUnit = 'Xu';
    } else if (rule.costField == 'aiTokens') {
      currentBalance = balance.aiTokens;
      costUnit = 'Năng Lượng';
    }

    final hasEnoughBalance = currentBalance >= rule.cost;

    String rewardUnit = 'Năng Lượng';
    if (rule.rewardField == 'freeCoins') rewardUnit = 'Xu Gacha';
    if (rule.rewardField == 'premiumCoins') rewardUnit = 'Ngọc';

    return Dialog(
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.arrowRightLeft,
                size: 28,
                color: Color(0xFF2563EB),
              ),
            ),
            AppSpacing.gapV16,

            Text(
              'Xác Nhận Quy Đổi',
              style: AppTextStyles.h2.copyWith(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppColors.lightTextPrimary,
              ),
            ),
            AppSpacing.gapV8,

            Text(
              rule.name,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 13,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
              textAlign: TextAlign.center,
            ),

            AppSpacing.gapV16,

            // Bảng tóm tắt quy đổi
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : Colors.blue.shade100,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Chi phí:',
                        style: AppTextStyles.caption.copyWith(color: isDark ? Colors.white70 : Colors.black54),
                      ),
                      Text(
                        '-${currencyFormatter.format(rule.cost)} $costUnit',
                        style: AppTextStyles.labelLarge.copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.redAccent,
                        ),
                      ),
                    ],
                  ),
                  AppSpacing.gapV8,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Nhận được:',
                        style: AppTextStyles.caption.copyWith(color: isDark ? Colors.white70 : Colors.black54),
                      ),
                      Text(
                        '+${currencyFormatter.format(rule.reward)} $rewardUnit',
                        style: AppTextStyles.labelLarge.copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Số dư hiện có:',
                        style: AppTextStyles.caption.copyWith(color: isDark ? Colors.white70 : Colors.black54),
                      ),
                      Text(
                        '${currencyFormatter.format(currentBalance)} $costUnit',
                        style: AppTextStyles.labelLarge.copyWith(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: hasEnoughBalance ? (isDark ? Colors.white : Colors.black87) : Colors.red,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            if (!hasEnoughBalance) ...[
              AppSpacing.gapV12,
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.alertTriangle, size: 16, color: Colors.red),
                    AppSpacing.gapH8,
                    Expanded(
                      child: Text(
                        'Số dư $costUnit không đủ để thực hiện giao dịch này.',
                        style: AppTextStyles.caption.copyWith(
                          color: Colors.red,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            AppSpacing.gapV20,

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Hủy'),
                  ),
                ),
                AppSpacing.gapH12,
                Expanded(
                  child: ElevatedButton(
                    onPressed: hasEnoughBalance
                        ? () {
                            Navigator.of(context).pop();
                            onConfirm();
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: const Text('Xác Nhận Đổi'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
