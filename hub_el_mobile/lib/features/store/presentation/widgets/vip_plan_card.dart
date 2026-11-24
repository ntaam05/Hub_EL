import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/store_entities.dart';

class VipPlanCard extends StatelessWidget {
  final VipPlanEntity plan;
  final VoidCallback onPurchase;
  final bool isLoading;

  const VipPlanCard({
    super.key,
    required this.plan,
    required this.onPurchase,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');
    final isPopular = plan.isPopular;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isPopular
            ? const Color(0xFF2563EB)
            : (isDark ? AppColors.darkCard : Colors.white),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isPopular
              ? Colors.blue.shade400
              : (isDark ? AppColors.darkBorder : Colors.blue.shade100),
          width: isPopular ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isPopular
                ? const Color(0xFF2563EB).withValues(alpha: 0.3)
                : Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: isPopular ? 16 : 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    plan.name,
                    style: AppTextStyles.h2.copyWith(
                      fontSize: 20,
                      fontStyle: FontStyle.italic,
                      color: isPopular ? Colors.white : (isDark ? Colors.white : AppColors.lightTextPrimary),
                    ),
                  ),
                  if (plan.badge != null) ...[
                    AppSpacing.gapH8,
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.amber,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        plan.badge!,
                        style: AppTextStyles.microBadge.copyWith(
                          color: const Color(0xFF451A03),
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isPopular ? Colors.white.withValues(alpha: 0.2) : (isDark ? Colors.white10 : Colors.blue.shade50),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${plan.days} Ngày',
                  style: AppTextStyles.caption.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isPopular ? Colors.white : (isDark ? AppColors.darkTextSecondary : AppColors.primary),
                  ),
                ),
              ),
            ],
          ),

          AppSpacing.gapV8,

          Text(
            plan.description,
            style: AppTextStyles.bodyMedium.copyWith(
              fontSize: 13,
              color: isPopular ? Colors.blue.shade100 : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
            ),
          ),

          AppSpacing.gapV16,

          // Giá tiền
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                currencyFormatter.format(plan.amount),
                style: AppTextStyles.h1.copyWith(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: isPopular ? Colors.white : (isDark ? Colors.white : AppColors.lightTextPrimary),
                ),
              ),
              AppSpacing.gapH4,
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  'đ',
                  style: AppTextStyles.labelLarge.copyWith(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isPopular ? Colors.white70 : (isDark ? Colors.white70 : Colors.black54),
                  ),
                ),
              ),
            ],
          ),

          AppSpacing.gapV16,

          // Nút Mua MoMo
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: isLoading ? null : onPurchase,
              style: ElevatedButton.styleFrom(
                backgroundColor: isPopular ? Colors.white : const Color(0xFF2563EB),
                foregroundColor: isPopular ? const Color(0xFF2563EB) : Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: isPopular ? 4 : 0,
              ),
              child: isLoading
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isPopular ? const Color(0xFF2563EB) : Colors.white,
                        ),
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.crown, size: 18),
                        AppSpacing.gapH8,
                        Text(
                          'Kích Hoạt Ngay',
                          style: AppTextStyles.labelLarge.copyWith(
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                            color: isPopular ? const Color(0xFF2563EB) : Colors.white,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class VipFeaturesOverview extends StatelessWidget {
  const VipFeaturesOverview({super.key});

  static const List<String> coreVipFeatures = [
    "Năng lượng tối đa +50",
    "Giảm 30% phí tạo AI Quiz",
    "Tốc độ nhận XP & Xu +20%",
    "Bụi sao nhận được +20%",
    "1 Lượt quay Gacha Free/ngày",
    "Khung Chat Vàng & Tag PRO",
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : const Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : const Color(0xFFBAE6FD),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.shieldCheck, size: 20, color: Color(0xFF2563EB)),
              AppSpacing.gapH8,
              Text(
                'TOÀN BỘ ĐẶC QUYỀN VIP PRO',
                style: AppTextStyles.labelLarge.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                  letterSpacing: 0.5,
                  color: isDark ? Colors.white : const Color(0xFF0369A1),
                ),
              ),
            ],
          ),
          AppSpacing.gapV12,
          ...coreVipFeatures.map(
            (feat) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.check, size: 12, color: Color(0xFF2563EB)),
                  ),
                  AppSpacing.gapH8,
                  Expanded(
                    child: Text(
                      feat,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white70 : const Color(0xFF0C4A6E),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
