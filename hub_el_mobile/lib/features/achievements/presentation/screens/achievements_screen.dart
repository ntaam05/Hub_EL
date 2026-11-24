import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../authentication/presentation/bloc/auth_bloc.dart';
import '../../../authentication/presentation/bloc/auth_event.dart';
import '../cubit/achievements_cubit.dart';
import '../cubit/achievements_state.dart';
import '../widgets/achievement_card.dart';
import '../widgets/achievement_dashboard_card.dart';
import '../widgets/achievement_detail_sheet.dart';
import '../widgets/achievement_reward_dialog.dart';
import '../widgets/group_filter_bar.dart';
import '../widgets/tier_filter_bar.dart';

class AchievementsScreen extends StatefulWidget {
  const AchievementsScreen({super.key});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  bool _isSearchOpen = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<AchievementsCubit>().loadAchievements();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onCelebration(BuildContext context, AchievementsState state) {
    final data = state.data;
    if (data == null || !data.hasEarnedRewards) return;

    AchievementRewardDialog.show(
      context,
      earnedXP: data.earnedXP,
      earnedCoins: data.earnedCoins,
      earnedEnergy: data.earnedEnergy,
      newlyUnlocked: data.newlyUnlocked,
      onDismiss: () {
        context.read<AchievementsCubit>().dismissCelebration();
        // Cập nhật lại số dư trên Header
        context.read<AuthBloc>().add(const AuthUserRefreshed());
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BlocConsumer<AchievementsCubit, AchievementsState>(
      listenWhen: (prev, curr) => !prev.showCelebration && curr.showCelebration,
      listener: (context, state) {
        _onCelebration(context, state);
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: _isSearchOpen
                ? TextField(
                    controller: _searchController,
                    autofocus: true,
                    style: TextStyle(
                      color: isDark ? Colors.white : Colors.black87,
                      fontSize: 14,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm thành tựu...',
                      hintStyle: TextStyle(
                        color: isDark ? Colors.white38 : Colors.grey,
                        fontSize: 14,
                      ),
                      border: InputBorder.none,
                    ),
                    onChanged: (val) {
                      context.read<AchievementsCubit>().setSearchQuery(val);
                    },
                  )
                : const Text(
                    'BẢNG VÀNG THÀNH TỰU',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                  ),
            backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
            elevation: 0.5,
            actions: [
              IconButton(
                icon: Icon(_isSearchOpen ? LucideIcons.x : LucideIcons.search, size: 20),
                onPressed: () {
                  setState(() {
                    _isSearchOpen = !_isSearchOpen;
                    if (!_isSearchOpen) {
                      _searchController.clear();
                      context.read<AchievementsCubit>().setSearchQuery('');
                    }
                  });
                },
              ),
              IconButton(
                icon: const Icon(LucideIcons.rotateCw, size: 19),
                onPressed: state.status == AchievementsStatus.loading
                    ? null
                    : () => context.read<AchievementsCubit>().loadAchievements(),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => context.read<AchievementsCubit>().loadAchievements(showLoading: false),
            child: _buildBody(context, state, isDark),
          ),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, AchievementsState state, bool isDark) {
    if (state.status == AchievementsStatus.loading && state.data == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: 14),
            Text(
              'Đang rà soát kỷ lục thành tựu...',
              style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );
    }

    if (state.status == AchievementsStatus.error && state.data == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.orangeAccent),
              AppSpacing.gapV16,
              Text(
                state.errorMessage ?? 'Không thể tải danh sách thành tựu.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              AppSpacing.gapV16,
              ElevatedButton.icon(
                onPressed: () => context.read<AchievementsCubit>().loadAchievements(),
                icon: const Icon(LucideIcons.rotateCw, size: 16),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    final achievements = state.filteredAchievements;
    final cubit = context.read<AchievementsCubit>();

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 16),
      children: [
        // 1. Dashboard Card tổng quan
        if (state.data != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: AchievementDashboardCard(summary: state.data!.summary),
          ),
        AppSpacing.gapV16,

        // 2. Bộ lọc trạng thái: Tất cả / Đã mở khóa / Đang làm
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _buildStatusFilterTabs(state, cubit, isDark),
        ),
        AppSpacing.gapV12,

        // 3. Bộ lọc cấp bậc (Tiers 1-6)
        TierFilterBar(
          selectedTier: state.selectedTier,
          tierCounts: state.tierCounts,
          onTierSelected: (tier) => cubit.filterByTier(tier),
        ),
        AppSpacing.gapV12,

        // 4. Bộ lọc nhóm (14 Groups)
        GroupFilterBar(
          selectedGroup: state.selectedGroup,
          groupCounts: state.groupCounts,
          groupUnlockedCounts: state.groupUnlockedCounts,
          onGroupSelected: (groupId) => cubit.filterByGroup(groupId),
        ),
        AppSpacing.gapV16,

        // 5. Tiêu đề danh sách & số lượng
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'DANH SÁCH HUY HIỆU (${achievements.length})',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                  color: isDark ? Colors.white60 : Colors.grey.shade700,
                ),
              ),
              if (state.selectedGroup != null ||
                  state.selectedTier != null ||
                  state.filterStatus != AchievementFilterStatus.all ||
                  state.searchQuery.isNotEmpty)
                GestureDetector(
                  onTap: () => cubit.resetFilters(),
                  child: const Text(
                    'Đặt lại bộ lọc',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ),
            ],
          ),
        ),
        AppSpacing.gapV12,

        // 6. Danh sách thành tựu
        if (achievements.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    LucideIcons.award,
                    size: 48,
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                  ),
                  AppSpacing.gapV12,
                  Text(
                    'Không tìm thấy thành tựu nào phù hợp',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white60 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm.',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white38 : Colors.grey.shade500,
                    ),
                  ),
                  AppSpacing.gapV16,
                  OutlinedButton(
                    onPressed: () => cubit.resetFilters(),
                    child: const Text('Xem tất cả 64 thành tựu'),
                  ),
                ],
              ),
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: achievements.map((ach) {
                return AchievementCard(
                  achievement: ach,
                  onTap: () => AchievementDetailSheet.show(context, ach),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildStatusFilterTabs(
    AchievementsState state,
    AchievementsCubit cubit,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.grey.shade200,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: AchievementFilterStatus.values.map((status) {
          final isSelected = state.filterStatus == status;
          return Expanded(
            child: GestureDetector(
              onTap: () => cubit.setFilterStatus(status),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 8),
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
                child: Center(
                  child: Text(
                    status.label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                      color: isSelected
                          ? (isDark ? Colors.white : const Color(0xFF0F172A))
                          : (isDark ? Colors.white54 : Colors.grey.shade600),
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
