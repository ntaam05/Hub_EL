import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../cubit/leaderboard_cubit.dart';
import '../cubit/leaderboard_state.dart';
import '../widgets/category_selector_widget.dart';
import '../widgets/leaderboard_row_item.dart';
import '../widgets/podium_widget.dart';
import '../widgets/sticky_current_user_rank.dart';
import '../widgets/timeframe_selector_widget.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  @override
  void initState() {
    super.initState();
    final cubit = context.read<LeaderboardCubit>();
    if (cubit.state.data == null) {
      cubit.loadLeaderboard();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF020617) : const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: BlocBuilder<LeaderboardCubit, LeaderboardState>(
          builder: (context, state) {
            final cubit = context.read<LeaderboardCubit>();
            final topPlayers = state.data?.topPlayers ?? [];
            final top3 = topPlayers.take(3).toList();
            final restOfBoard = topPlayers.length > 3 ? topPlayers.sublist(3) : [];
            final currentUser = state.data?.currentUser;

            return Column(
              children: [
                // 1. Header Bar
                _buildHeader(context),

                const SizedBox(height: 8),

                // 2. Bộ lọc danh mục (4 Categories)
                CategorySelectorWidget(
                  selectedCategory: state.selectedCategory,
                  onCategorySelected: (cat) => cubit.selectCategory(cat),
                ),

                const SizedBox(height: 10),

                // 3. Bộ lọc thời gian (4 Timeframes)
                TimeframeSelectorWidget(
                  selectedTimeframe: state.selectedTimeframe,
                  onTimeframeSelected: (tf) => cubit.selectTimeframe(tf),
                  isStreakCategory: state.selectedCategory.code == 'STREAK',
                ),

                const SizedBox(height: 8),

                // 4. Nội dung chính & Danh sách người chơi
                Expanded(
                  child: Stack(
                    children: [
                      if (state.isLoading && state.data == null)
                        const Center(
                          child: CircularProgressIndicator(color: AppColors.primary),
                        )
                      else if (state.errorMessage != null && state.data == null)
                        _buildErrorState(context, state.errorMessage!, cubit.refresh)
                      else if (topPlayers.isEmpty)
                        _buildEmptyState(context)
                      else
                        RefreshIndicator(
                          onRefresh: cubit.refresh,
                          color: AppColors.primary,
                          child: CustomScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            slivers: [
                              // Top 3 Podium
                              SliverToBoxAdapter(
                                child: PodiumWidget(top3: top3),
                              ),

                              // Header Danh sách Hạng 4 - 50
                              if (restOfBoard.isNotEmpty)
                                SliverToBoxAdapter(
                                  child: Padding(
                                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                                    child: Row(
                                      children: [
                                        const Icon(
                                          LucideIcons.medal,
                                          size: 16,
                                          color: AppColors.primary,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Bảng Vinh Danh (Top 4 - 50)',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: isDark
                                                ? const Color(0xFFE2E8F0)
                                                : const Color(0xFF1E293B),
                                          ),
                                        ),
                                        const Spacer(),
                                        Text(
                                          '${topPlayers.length} người tham gia',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: isDark
                                                ? const Color(0xFF94A3B8)
                                                : const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                              // Danh sách từ hạng 4 đến 50
                              SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) {
                                    final player = restOfBoard[index];
                                    final isMe = currentUser != null &&
                                        player.userId == currentUser.userId;

                                    return LeaderboardRowItem(
                                      player: player,
                                      isCurrentUser: isMe,
                                    );
                                  },
                                  childCount: restOfBoard.length,
                                ),
                              ),

                              // Khoảng trống đệm cuối danh sách để không bị Sticky Card che
                              SliverToBoxAdapter(
                                child: SizedBox(
                                  height: currentUser != null ? 88.0 : 24.0,
                                ),
                              ),
                            ],
                          ),
                        ),

                      // 5. Thẻ Thứ hạng Cá nhân Ghim đáy (Sticky Personal Rank)
                      if (currentUser != null)
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          child: StickyCurrentUserRank(currentUser: currentUser),
                        ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              LucideIcons.trophy,
              size: 24,
              color: Colors.amber,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Bảng Vàng',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              Text(
                'Vinh danh người học xuất sắc nhất',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String message, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.alertCircle, size: 48, color: Colors.pinkAccent),
            const SizedBox(height: 12),
            Text(
              'Không thể tải bảng xếp hạng',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(LucideIcons.refreshCw, size: 16),
              label: const Text('Thử lại'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.trophy, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            const Text(
              'Chưa có dữ liệu xếp hạng',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'Hãy là người đầu tiên ghi tên lên bảng vàng!',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
