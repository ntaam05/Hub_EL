import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/store_entities.dart';

class TransactionHistoryView extends StatefulWidget {
  final TransactionHistoryEntity? transactions;
  final VoidCallback onRefresh;

  const TransactionHistoryView({
    super.key,
    required this.transactions,
    required this.onRefresh,
  });

  @override
  State<TransactionHistoryView> createState() => _TransactionHistoryViewState();
}

class _TransactionHistoryViewState extends State<TransactionHistoryView> {
  int _selectedFilter = 0; // 0: Tất cả, 1: Nạp MoMo, 2: Ví Xu

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');
    final dateFormatter = DateFormat('dd/MM/yyyy HH:mm');

    final orders = widget.transactions?.orders ?? [];
    final coinTxs = widget.transactions?.coinTransactions ?? [];

    final hasData = orders.isNotEmpty || coinTxs.isNotEmpty;

    return Column(
      children: [
        // Filter Chips
        Row(
          children: [
            _buildFilterChip('Tất Cả (${orders.length + coinTxs.length})', 0, isDark),
            AppSpacing.gapH8,
            _buildFilterChip('Nạp MoMo (${orders.length})', 1, isDark),
            AppSpacing.gapH8,
            _buildFilterChip('Ví Xu (${coinTxs.length})', 2, isDark),
          ],
        ),
        AppSpacing.gapV12,

        if (!hasData)
          Container(
            padding: const EdgeInsets.all(40),
            alignment: Alignment.center,
            child: Column(
              children: [
                Icon(
                  LucideIcons.receipt,
                  size: 48,
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                ),
                AppSpacing.gapV12,
                Text(
                  'Chưa có lịch sử giao dịch',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
                AppSpacing.gapV8,
                TextButton.icon(
                  onPressed: widget.onRefresh,
                  icon: const Icon(LucideIcons.refreshCw, size: 16),
                  label: const Text('Tải lại'),
                ),
              ],
            ),
          )
        else ...[
          // Orders List
          if (_selectedFilter == 0 || _selectedFilter == 1)
            ...orders.map((order) {
              Color statusColor = Colors.amber;
              String statusText = 'CHỜ THANH TOÁN';
              if (order.status == 'SUCCESS') {
                statusColor = const Color(0xFF10B981);
                statusText = 'THÀNH CÔNG';
              } else if (order.status == 'FAILED') {
                statusColor = Colors.redAccent;
                statusText = 'THẤT BẠI';
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFA50064).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Center(
                        child: Icon(LucideIcons.creditCard, size: 22, color: Color(0xFFA50064)),
                      ),
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
                                order.type == 'VIP' ? 'Nạp Gói VIP PRO' : 'Nạp Gói Ngọc',
                                style: AppTextStyles.labelLarge.copyWith(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                '+${currencyFormatter.format(order.amount)} đ',
                                style: AppTextStyles.labelLarge.copyWith(
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFFA50064),
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.gapV4,
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                dateFormatter.format(order.createdAt),
                                style: AppTextStyles.caption.copyWith(
                                  fontSize: 11,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: statusColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  statusText,
                                  style: AppTextStyles.microBadge.copyWith(
                                    color: statusColor,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),

          // Coin Transactions List
          if (_selectedFilter == 0 || _selectedFilter == 2)
            ...coinTxs.map((tx) {
              final isPositive = tx.amount > 0;
              final isPremium = tx.currencyType == 'PREMIUM';

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: (isPremium ? Colors.purple : Colors.amber).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Icon(
                          isPremium ? LucideIcons.gem : LucideIcons.coins,
                          size: 22,
                          color: isPremium ? Colors.purpleAccent : Colors.amber,
                        ),
                      ),
                    ),
                    AppSpacing.gapH12,
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  tx.reason,
                                  style: AppTextStyles.labelLarge.copyWith(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Text(
                                '${isPositive ? '+' : ''}${currencyFormatter.format(tx.amount)} ${isPremium ? 'Ngọc' : 'Xu'}',
                                style: AppTextStyles.labelLarge.copyWith(
                                  fontWeight: FontWeight.w900,
                                  color: isPositive ? const Color(0xFF10B981) : Colors.redAccent,
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.gapV4,
                          Text(
                            dateFormatter.format(tx.createdAt),
                            style: AppTextStyles.caption.copyWith(
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
            }),
        ],
      ],
    );
  }

  Widget _buildFilterChip(String label, int index, bool isDark) {
    final isSelected = _selectedFilter == index;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = index),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF2563EB)
              : (isDark ? AppColors.darkCard : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: AppTextStyles.caption.copyWith(
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
          ),
        ),
      ),
    );
  }
}
