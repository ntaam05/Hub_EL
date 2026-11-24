import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../authentication/presentation/bloc/auth_bloc.dart';
import '../../../authentication/presentation/bloc/auth_event.dart';
import '../cubit/store_cubit.dart';
import '../cubit/store_state.dart';
import '../widgets/exchange_card.dart';
import '../widgets/exchange_confirm_dialog.dart';
import '../widgets/gem_package_card.dart';
import '../widgets/momo_payment_sheet.dart';
import '../widgets/store_balance_header.dart';
import '../widgets/transaction_history_view.dart';
import '../widgets/vip_plan_card.dart';

class StoreScreen extends StatefulWidget {
  final StoreTab initialTab;

  const StoreScreen({
    super.key,
    this.initialTab = StoreTab.vip,
  });

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  @override
  void initState() {
    super.initState();
    final cubit = context.read<StoreCubit>();
    cubit.loadCatalog();
    if (widget.initialTab != StoreTab.vip) {
      cubit.switchTab(widget.initialTab);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF0F9FF),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : AppColors.lightTextPrimary,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Cửa Hàng Hub-EL',
          style: AppTextStyles.h2.copyWith(
            fontSize: 18,
            color: isDark ? Colors.white : AppColors.lightTextPrimary,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              LucideIcons.refreshCw,
              color: isDark ? Colors.white70 : AppColors.lightTextSecondary,
              size: 20,
            ),
            onPressed: () => context.read<StoreCubit>().loadCatalog(),
          ),
        ],
      ),
      body: BlocConsumer<StoreCubit, StoreState>(
        listener: (context, state) {
          if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.error,
                duration: const Duration(seconds: 3),
              ),
            );
            context.read<StoreCubit>().clearMessages();
          }

          if (state.successMessage != null && state.status != StoreStatus.paymentSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage!),
                backgroundColor: const Color(0xFF10B981),
                duration: const Duration(seconds: 3),
              ),
            );
            context.read<StoreCubit>().clearMessages();
          }

          // Đồng bộ số dư sang AuthBloc khi catalog thay đổi
          if (state.catalog?.balance != null) {
            final balance = state.catalog!.balance;
            context.read<AuthBloc>().add(AuthUserBalanceUpdated(
              freeCoins: balance.freeCoins,
              aiTokens: balance.aiTokens,
              premiumCoins: balance.premiumCoins,
              stardust: balance.stardust,
              isPro: balance.isPro,
            ));
          }

          // Khi có thanh toán MoMo vừa tạo
          if (state.currentPayment != null && state.status == StoreStatus.loaded) {
            // Không mở nhiều lần
          }
        },
        builder: (context, state) {
          if (state.isLoading && state.catalog == null) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final catalog = state.catalog;
          if (catalog == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.alertCircle,
                    size: 48,
                    color: isDark ? Colors.white38 : Colors.grey,
                  ),
                  AppSpacing.gapV12,
                  Text(
                    'Không thể tải dữ liệu cửa hàng',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: isDark ? Colors.white70 : Colors.black87,
                    ),
                  ),
                  AppSpacing.gapV12,
                  ElevatedButton(
                    onPressed: () => context.read<StoreCubit>().loadCatalog(),
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => context.read<StoreCubit>().loadCatalog(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Balance Header & Badges
                  StoreBalanceHeader(balance: catalog.balance),

                  AppSpacing.gapV16,

                  // 2. Tab Navigation
                  _buildTabBar(context, state.activeTab, isDark),

                  AppSpacing.gapV16,

                  // 3. Tab Contents
                  _buildTabContent(context, state),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTabBar(BuildContext context, StoreTab currentTab, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : const Color(0xFFE0F2FE),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : const Color(0xFFBAE6FD),
        ),
      ),
      child: Row(
        children: [
          _buildTabItem(context, 'Premium', LucideIcons.crown, StoreTab.vip, currentTab, isDark),
          _buildTabItem(context, 'Mua Ngọc', LucideIcons.gem, StoreTab.gems, currentTab, isDark),
          _buildTabItem(context, 'Tiếp Tế', LucideIcons.arrowRightLeft, StoreTab.exchange, currentTab, isDark),
          _buildTabItem(context, 'Lịch Sử', LucideIcons.history, StoreTab.history, currentTab, isDark),
        ],
      ),
    );
  }

  Widget _buildTabItem(
    BuildContext context,
    String label,
    IconData icon,
    StoreTab tab,
    StoreTab currentTab,
    bool isDark,
  ) {
    final isSelected = currentTab == tab;

    return Expanded(
      child: InkWell(
        onTap: () => context.read<StoreCubit>().switchTab(tab),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 14,
                color: isSelected
                    ? const Color(0xFF2563EB)
                    : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              ),
              AppSpacing.gapH6,
              Text(
                label,
                style: AppTextStyles.caption.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                  color: isSelected
                      ? const Color(0xFF2563EB)
                      : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent(BuildContext context, StoreState state) {
    final catalog = state.catalog!;

    switch (state.activeTab) {
      case StoreTab.vip:
        return Column(
          children: [
            ...catalog.vipPlans.map((plan) {
              final isCardLoading = state.isCreatingPayment;
              return VipPlanCard(
                plan: plan,
                isLoading: isCardLoading,
                onPurchase: () async {
                  final cubit = context.read<StoreCubit>();
                  final ok = await cubit.createMoMoPayment(
                    type: 'VIP',
                    amount: plan.amount,
                    name: 'Premium ${plan.name}',
                  );
                  if (!context.mounted) return;
                  if (ok && cubit.state.currentPayment != null) {
                    MoMoPaymentSheet.show(
                      context,
                      payment: cubit.state.currentPayment!,
                      packageName: 'Gói VIP ${plan.name}',
                      amount: plan.amount,
                    );
                  }
                },
              );
            }),
            AppSpacing.gapV8,
            const VipFeaturesOverview(),
          ],
        );

      case StoreTab.gems:
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: catalog.coinPackages.length,
          itemBuilder: (context, index) {
            final pkg = catalog.coinPackages[index];
            return GemPackageCard(
              package: pkg,
              isLoading: state.isCreatingPayment,
              onPurchase: () async {
                final cubit = context.read<StoreCubit>();
                final ok = await cubit.createMoMoPayment(
                  type: 'COIN',
                  amount: pkg.amount,
                  name: pkg.name,
                );
                if (!context.mounted) return;
                if (ok && cubit.state.currentPayment != null) {
                  MoMoPaymentSheet.show(
                    context,
                    payment: cubit.state.currentPayment!,
                    packageName: pkg.name,
                    amount: pkg.amount,
                  );
                }
              },
            );
          },
        );

      case StoreTab.exchange:
        return Column(
          children: catalog.exchangeRules.map((rule) {
            final isCardExchanging = state.isExchanging && state.exchangingType == rule.type;
            return ExchangeCard(
              rule: rule,
              isLoading: isCardExchanging,
              onExchangeTap: () {
                ExchangeConfirmDialog.show(
                  context,
                  rule: rule,
                  balance: catalog.balance,
                  onConfirm: () {
                    context.read<StoreCubit>().exchangeResource(
                          type: rule.type,
                          cost: rule.cost,
                          costField: rule.costField,
                        );
                  },
                );
              },
            );
          }).toList(),
        );

      case StoreTab.history:
        return TransactionHistoryView(
          transactions: state.transactions,
          onRefresh: () => context.read<StoreCubit>().loadTransactions(),
        );
    }
  }
}
