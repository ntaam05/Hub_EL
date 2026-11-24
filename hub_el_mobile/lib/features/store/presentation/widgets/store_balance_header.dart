import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/store_entities.dart';

class StoreBalanceHeader extends StatelessWidget {
  final StoreBalanceEntity balance;

  const StoreBalanceHeader({super.key, required this.balance});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    return Column(
      children: [
        // Banner Cửa Hàng
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.blue.shade400, width: 1),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2563EB).withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                right: -15,
                top: -15,
                child: Opacity(
                  opacity: 0.12,
                  child: Icon(
                    LucideIcons.crown,
                    size: 110,
                    color: Colors.white,
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.sparkles, size: 12, color: Colors.amberAccent),
                        AppSpacing.gapH6,
                        Text(
                          'HỆ THỐNG GIAO DỊCH',
                          style: AppTextStyles.microBadge.copyWith(
                            color: Colors.white,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                  ),
                  AppSpacing.gapV8,
                  Text(
                    'CỬA HÀNG HUB-EL',
                    style: AppTextStyles.h1.copyWith(
                      color: Colors.white,
                      fontSize: 22,
                      fontStyle: FontStyle.italic,
                      letterSpacing: -0.5,
                    ),
                  ),
                  AppSpacing.gapV4,
                  Text(
                    'Nâng cấp tài khoản, nạp Ngọc và trao đổi tài nguyên học tập.',
                    style: AppTextStyles.caption.copyWith(
                      color: Colors.blue.shade100,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        AppSpacing.gapV12,

        // Cụm Số Dư Tài Nguyên (Túi Đồ)
        Row(
          children: [
            Expanded(
              child: _buildResourceBox(
                icon: LucideIcons.coins,
                iconColor: Colors.amber,
                label: 'Xu Gacha',
                value: currencyFormatter.format(balance.freeCoins),
                isDark: isDark,
              ),
            ),
            AppSpacing.gapH8,
            Expanded(
              child: _buildResourceBox(
                icon: LucideIcons.gem,
                iconColor: Colors.purpleAccent,
                label: 'Ngọc',
                value: currencyFormatter.format(balance.premiumCoins),
                isDark: isDark,
              ),
            ),
            AppSpacing.gapH8,
            Expanded(
              child: _buildResourceBox(
                icon: LucideIcons.zap,
                iconColor: Colors.blueAccent,
                label: 'Năng Lượng',
                value: '${balance.aiTokens}/${balance.maxEnergy}',
                isDark: isDark,
              ),
            ),
          ],
        ),

        // Trạng thái VIP nếu có
        if (balance.isPro) ...[
          AppSpacing.gapV8,
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.amber.shade600, Colors.orange.shade600],
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.crown, size: 16, color: Colors.white),
                AppSpacing.gapH8,
                Expanded(
                  child: Text(
                    balance.remainingVipDays > 0
                        ? 'Tài khoản VIP PRO (Còn ${balance.remainingVipDays} ngày)'
                        : 'Tài khoản VIP PRO Vĩnh Viễn',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'ACTIVE',
                    style: AppTextStyles.microBadge.copyWith(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildResourceBox({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : Colors.blue.shade100,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: iconColor),
          AppSpacing.gapV4,
          Text(
            value,
            style: AppTextStyles.h3.copyWith(
              fontWeight: FontWeight.w900,
              fontSize: 13,
              color: isDark ? Colors.white : AppColors.lightTextPrimary,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            label,
            style: AppTextStyles.caption.copyWith(
              fontSize: 10,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
