import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/store_entities.dart';
import '../cubit/store_cubit.dart';
import '../cubit/store_state.dart';

class MoMoPaymentSheet extends StatefulWidget {
  final MoMoPaymentEntity payment;
  final String packageName;
  final int amount;

  const MoMoPaymentSheet({
    super.key,
    required this.payment,
    required this.packageName,
    required this.amount,
  });

  static Future<void> show(
    BuildContext context, {
    required MoMoPaymentEntity payment,
    required String packageName,
    required int amount,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: context.read<StoreCubit>(),
        child: MoMoPaymentSheet(
          payment: payment,
          packageName: packageName,
          amount: amount,
        ),
      ),
    );
  }

  @override
  State<MoMoPaymentSheet> createState() => _MoMoPaymentSheetState();
}

class _MoMoPaymentSheetState extends State<MoMoPaymentSheet> {
  Future<void> _launchMoMoUrl() async {
    final uri = Uri.parse(widget.payment.payUrl);
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể tự động mở trình duyệt/MoMo. Vui lòng thử lại.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    return BlocConsumer<StoreCubit, StoreState>(
      listener: (context, state) {
        if (state.status == StoreStatus.paymentSuccess) {
          // Thành công
        }
      },
      builder: (context, state) {
        final isSuccess = state.status == StoreStatus.paymentSuccess || state.paymentStatus?.isSuccess == true;
        final isVerifying = state.isVerifyingPayment;

        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 24,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Thanh kéo
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                AppSpacing.gapV20,

                // Logo MoMo & Trạng thái
                if (isSuccess) ...[
                  Container(
                    width: 64,
                    height: 64,
                    decoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.check, size: 36, color: Colors.white),
                  ),
                  AppSpacing.gapV12,
                  Text(
                    'THANH TOÁN THÀNH CÔNG!',
                    style: AppTextStyles.h2.copyWith(
                      color: const Color(0xFF10B981),
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                  AppSpacing.gapV4,
                  Text(
                    'Tài khoản của bạn đã được nâng cấp thành công.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      fontSize: 12,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ] else ...[
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: const Color(0xFFA50064).withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFA50064), width: 1.5),
                    ),
                    child: const Center(
                      child: Icon(
                        LucideIcons.creditCard,
                        size: 28,
                        color: Color(0xFFA50064),
                      ),
                    ),
                  ),
                  AppSpacing.gapV12,
                  Text(
                    'Cổng Thanh Toán MoMo Sandbox',
                    style: AppTextStyles.h2.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppColors.lightTextPrimary,
                    ),
                  ),
                  AppSpacing.gapV4,
                  Text(
                    'Vui lòng mở ứng dụng MoMo để hoàn tất giao dịch an toàn.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontSize: 12,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],

                AppSpacing.gapV16,

                // Bảng chi tiết đơn hàng
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : const Color(0xFFFDF2F8),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : const Color(0xFFFBCFE8),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Mặt hàng:', style: AppTextStyles.caption.copyWith(color: isDark ? Colors.white70 : Colors.black54)),
                          Text(
                            widget.packageName,
                            style: AppTextStyles.labelLarge.copyWith(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      AppSpacing.gapV8,
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Số tiền:', style: AppTextStyles.caption.copyWith(color: isDark ? Colors.white70 : Colors.black54)),
                          Text(
                            '${currencyFormatter.format(widget.amount)} đ',
                            style: AppTextStyles.h2.copyWith(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFFA50064),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Mã đơn:', style: AppTextStyles.caption.copyWith(color: isDark ? Colors.white70 : Colors.black54)),
                          Text(
                            widget.payment.orderId,
                            style: AppTextStyles.caption.copyWith(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white60 : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                if (state.errorMessage != null && !isSuccess) ...[
                  AppSpacing.gapV12,
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.amber.shade700),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.alertCircle, size: 16, color: Colors.amber),
                        AppSpacing.gapH8,
                        Expanded(
                          child: Text(
                            state.errorMessage!,
                            style: AppTextStyles.caption.copyWith(
                              color: isDark ? Colors.amber.shade200 : Colors.amber.shade900,
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

                if (isSuccess) ...[
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        context.read<StoreCubit>().resetPayment();
                        Navigator.of(context).pop();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Hoàn Tất & Đóng'),
                    ),
                  ),
                ] else ...[
                  // Nút mở MoMo URL
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _launchMoMoUrl,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFA50064),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 2,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.externalLink, size: 18),
                          AppSpacing.gapH8,
                          Text(
                            'Mở Cổng Thanh Toán MoMo',
                            style: AppTextStyles.labelLarge.copyWith(
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  AppSpacing.gapV8,

                  // Nút Đối Soát Trạng Thái
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: OutlinedButton(
                      onPressed: isVerifying
                          ? null
                          : () => context.read<StoreCubit>().checkMoMoStatus(widget.payment.orderId),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF2563EB)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: isVerifying
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(LucideIcons.refreshCw, size: 16, color: Color(0xFF2563EB)),
                                AppSpacing.gapH8,
                                const Text(
                                  'Tôi Đã Thanh Toán (Kiểm Tra)',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF2563EB),
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
