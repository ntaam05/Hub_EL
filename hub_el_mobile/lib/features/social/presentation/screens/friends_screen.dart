import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../cubit/friends_cubit.dart';
import '../cubit/friends_state.dart';
import '../widgets/blocked_user_card.dart';
import '../widgets/confirm_action_dialog.dart';
import '../widgets/friend_card.dart';
import '../widgets/friend_request_card.dart';
import '../widgets/search_user_card.dart';
import '../widgets/user_profile_bottom_sheet.dart';

class FriendsScreen extends StatefulWidget {
  const FriendsScreen({super.key});

  @override
  State<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _filterController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<FriendsCubit>().init();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _filterController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BlocConsumer<FriendsCubit, FriendsState>(
      listenWhen: (prev, curr) =>
          prev.actionMessage != curr.actionMessage ||
          prev.actionError != curr.actionError,
      listener: (context, state) {
        if (state.actionMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.actionMessage!),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 3),
            ),
          );
          context.read<FriendsCubit>().clearActionFeedback();
        }
        if (state.actionError != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.actionError!),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 4),
            ),
          );
          context.read<FriendsCubit>().clearActionFeedback();
        }
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          body: Column(
            children: [
              // Thanh chọn Tab phong cách Mobile Web
              _buildTabBar(context, state, isDark),
              // Nội dung hiển thị theo tab
              Expanded(
                child: _buildTabContent(context, state, isDark),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTabBar(BuildContext context, FriendsState state, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        border: Border(
          bottom: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
      ),
      child: Row(
        children: [
          _buildTabItem(
            context: context,
            tab: FriendsTab.friends,
            label: 'Bạn bè',
            icon: LucideIcons.users,
            count: state.friends.length,
            isActive: state.activeTab == FriendsTab.friends,
            isDark: isDark,
          ),
          _buildTabItem(
            context: context,
            tab: FriendsTab.requests,
            label: 'Lời mời',
            icon: LucideIcons.userCheck,
            count: state.incomingRequests.length,
            showCountBadgeOnlyIfPositive: true,
            isActive: state.activeTab == FriendsTab.requests,
            isDark: isDark,
          ),
          _buildTabItem(
            context: context,
            tab: FriendsTab.search,
            label: 'Tìm kiếm',
            icon: LucideIcons.search,
            isActive: state.activeTab == FriendsTab.search,
            isDark: isDark,
          ),
          _buildTabItem(
            context: context,
            tab: FriendsTab.blocked,
            label: 'Đã chặn',
            icon: LucideIcons.ban,
            count: state.blockedUsers.length,
            showCountBadgeOnlyIfPositive: true,
            isActive: state.activeTab == FriendsTab.blocked,
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildTabItem({
    required BuildContext context,
    required FriendsTab tab,
    required String label,
    required IconData icon,
    int? count,
    bool showCountBadgeOnlyIfPositive = false,
    required bool isActive,
    required bool isDark,
  }) {
    final showBadge = count != null && (!showCountBadgeOnlyIfPositive || count > 0);

    return Expanded(
      child: GestureDetector(
        onTap: () => context.read<FriendsCubit>().changeTab(tab),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isActive
                ? (isDark ? AppColors.primary.withValues(alpha: 0.15) : AppColors.primary.withValues(alpha: 0.1))
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: isActive
                    ? AppColors.primaryLight
                    : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              ),
              AppSpacing.gapH6,
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                  color: isActive
                      ? AppColors.primaryLight
                      : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                ),
              ),
              if (showBadge) ...[
                AppSpacing.gapH4,
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.primary : (isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$count',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent(BuildContext context, FriendsState state, bool isDark) {
    switch (state.activeTab) {
      case FriendsTab.friends:
        return _buildFriendsTab(context, state, isDark);
      case FriendsTab.requests:
        return _buildRequestsTab(context, state, isDark);
      case FriendsTab.search:
        return _buildSearchTab(context, state, isDark);
      case FriendsTab.blocked:
        return _buildBlockedTab(context, state, isDark);
    }
  }

  // ==========================================
  // TAB 1: DANH SÁCH BẠN BÈ
  // ==========================================
  Widget _buildFriendsTab(BuildContext context, FriendsState state, bool isDark) {
    if (state.isFriendsLoading && state.friends.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.friendsError != null && state.friends.isEmpty) {
      return Center(
        child: Padding(
          padding: AppSpacing.paddingXl,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.wifiOff, size: 48, color: AppColors.error),
              AppSpacing.gapV12,
              Text(
                state.friendsError!,
                textAlign: TextAlign.center,
                style: TextStyle(color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              ),
              AppSpacing.gapV16,
              ElevatedButton.icon(
                onPressed: () => context.read<FriendsCubit>().loadFriends(),
                icon: const Icon(LucideIcons.refreshCw, size: 16),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<FriendsCubit>().loadFriends(isRefresh: true),
      child: Column(
        children: [
          // Ô lọc nhanh trong danh sách bạn bè
          if (state.friends.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: TextField(
                controller: _filterController,
                onChanged: (val) => context.read<FriendsCubit>().updateFriendsFilter(val),
                decoration: InputDecoration(
                  hintText: 'Tìm trong danh sách bạn bè...',
                  hintStyle: TextStyle(
                    fontSize: 13,
                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                  ),
                  prefixIcon: const Icon(LucideIcons.search, size: 18),
                  suffixIcon: _filterController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, size: 16),
                          onPressed: () {
                            _filterController.clear();
                            context.read<FriendsCubit>().updateFriendsFilter('');
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: isDark ? AppColors.darkCard : AppColors.lightInputFill,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                ),
              ),
            ),
          // Danh sách bạn bè
          Expanded(
            child: state.filteredFriends.isEmpty
                ? _buildEmptyState(
                    isDark: isDark,
                    icon: LucideIcons.users,
                    title: state.friends.isEmpty ? 'Chưa có bạn bè nào' : 'Không tìm thấy bạn bè phù hợp',
                    subtitle: state.friends.isEmpty
                        ? 'Hãy sang tab Tìm kiếm để kết nối với những người học khác nhé!'
                        : 'Thử tìm kiếm với từ khóa khác.',
                    actionLabel: state.friends.isEmpty ? 'Tìm bạn mới' : null,
                    onAction: () => context.read<FriendsCubit>().changeTab(FriendsTab.search),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: state.filteredFriends.length,
                    itemBuilder: (context, index) {
                      final friend = state.filteredFriends[index];
                      return FriendCard(
                        friend: friend,
                        onTap: () => UserProfileBottomSheet.show(context, friend.id),
                        onRemove: () async {
                          final confirm = await ConfirmActionDialog.show(
                            context,
                            title: 'Hủy kết bạn?',
                            content: 'Bạn có chắc chắn muốn hủy kết bạn với ${friend.name}?',
                            confirmLabel: 'Hủy kết bạn',
                            isDestructive: true,
                          );
                          if (confirm == true && context.mounted) {
                            context.read<FriendsCubit>().removeFriend(friend.id);
                          }
                        },
                        onBlock: () async {
                          final confirm = await ConfirmActionDialog.show(
                            context,
                            title: 'Chặn người dùng?',
                            content: 'Sau khi chặn, người này sẽ không thể nhắn tin hay thấy hồ sơ của bạn.',
                            confirmLabel: 'Chặn',
                            isDestructive: true,
                          );
                          if (confirm == true && context.mounted) {
                            context.read<FriendsCubit>().blockUser(friend.id);
                          }
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 2: LỜI MỜI KẾT BẠN (NHẬN / GỬI)
  // ==========================================
  Widget _buildRequestsTab(BuildContext context, FriendsState state, bool isDark) {
    return Column(
      children: [
        // Sub-tab switcher: Nhận được / Đã gửi
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : AppColors.lightInputFill,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => context
                        .read<FriendsCubit>()
                        .changeRequestsSubTab(RequestsSubTab.incoming),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: state.requestsSubTab == RequestsSubTab.incoming
                            ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: state.requestsSubTab == RequestsSubTab.incoming
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
                          'Nhận được (${state.incomingRequests.length})',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: state.requestsSubTab == RequestsSubTab.incoming
                                ? AppColors.primaryLight
                                : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => context
                        .read<FriendsCubit>()
                        .changeRequestsSubTab(RequestsSubTab.sent),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: state.requestsSubTab == RequestsSubTab.sent
                            ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: state.requestsSubTab == RequestsSubTab.sent
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
                          'Đã gửi (${state.sentRequests.length})',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: state.requestsSubTab == RequestsSubTab.sent
                                ? AppColors.primaryLight
                                : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        // Danh sách lời mời
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => context.read<FriendsCubit>().loadRequests(isRefresh: true),
            child: state.isRequestsLoading &&
                    state.incomingRequests.isEmpty &&
                    state.sentRequests.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : (state.requestsSubTab == RequestsSubTab.incoming
                    ? _buildIncomingRequestsList(context, state, isDark)
                    : _buildSentRequestsList(context, state, isDark)),
          ),
        ),
      ],
    );
  }

  Widget _buildIncomingRequestsList(BuildContext context, FriendsState state, bool isDark) {
    if (state.incomingRequests.isEmpty) {
      return _buildEmptyState(
        isDark: isDark,
        icon: LucideIcons.userCheck,
        title: 'Không có lời mời nào',
        subtitle: 'Khi có ai đó gửi lời mời kết bạn, bạn sẽ thấy ở đây.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: state.incomingRequests.length,
      itemBuilder: (context, index) {
        final req = state.incomingRequests[index];
        final isProcessing = state.actionInProgressId == 'req_${req.id}';

        return FriendRequestCard(
          request: req,
          isLoading: isProcessing,
          onTap: () => UserProfileBottomSheet.show(context, req.userId),
          onAccept: () => context.read<FriendsCubit>().respondFriendRequest(req.id, true, targetUserId: req.userId),
          onDecline: () => context.read<FriendsCubit>().respondFriendRequest(req.id, false, targetUserId: req.userId),
        );
      },
    );
  }

  Widget _buildSentRequestsList(BuildContext context, FriendsState state, bool isDark) {
    if (state.sentRequests.isEmpty) {
      return _buildEmptyState(
        isDark: isDark,
        icon: LucideIcons.send,
        title: 'Chưa gửi lời mời nào',
        subtitle: 'Các lời mời kết bạn bạn đã gửi đang chờ phản hồi sẽ xuất hiện ở đây.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: state.sentRequests.length,
      itemBuilder: (context, index) {
        final req = state.sentRequests[index];
        final isProcessing = state.actionInProgressId == 'cancel_${req.id}';

        return FriendRequestCard(
          request: req,
          isLoading: isProcessing,
          onTap: () => UserProfileBottomSheet.show(context, req.userId),
          onCancel: () => context.read<FriendsCubit>().cancelFriendRequest(req.id, targetUserId: req.userId),
        );
      },
    );
  }

  // ==========================================
  // TAB 3: TÌM KIẾM NGƯỜI DÙNG
  // ==========================================
  Widget _buildSearchTab(BuildContext context, FriendsState state, bool isDark) {
    return Column(
      children: [
        // Ô tìm kiếm
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
          child: TextField(
            controller: _searchController,
            onChanged: (val) => context.read<FriendsCubit>().onSearchQueryChanged(val),
            decoration: InputDecoration(
              hintText: 'Nhập tên hoặc username để tìm...',
              hintStyle: TextStyle(
                fontSize: 13,
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
              ),
              prefixIcon: const Icon(LucideIcons.search, size: 18),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(LucideIcons.x, size: 16),
                      onPressed: () {
                        _searchController.clear();
                        context.read<FriendsCubit>().clearSearch();
                      },
                    )
                  : null,
              filled: true,
              fillColor: isDark ? AppColors.darkCard : AppColors.lightInputFill,
              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
            ),
          ),
        ),
        // Kết quả tìm kiếm
        Expanded(
          child: state.isSearching
              ? const Center(child: CircularProgressIndicator())
              : state.searchQuery.trim().isEmpty
                  ? _buildEmptyState(
                      isDark: isDark,
                      icon: LucideIcons.userSearch,
                      title: 'Tìm kiếm bạn bè',
                      subtitle: 'Nhập tên hiển thị hoặc username để bắt đầu tìm kiếm.',
                    )
                  : state.searchResults.isEmpty
                      ? _buildEmptyState(
                          isDark: isDark,
                          icon: LucideIcons.searchX,
                          title: 'Không tìm thấy ai',
                          subtitle: 'Không có người dùng nào khớp với "${state.searchQuery}".',
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: state.searchResults.length,
                          itemBuilder: (context, index) {
                            final user = state.searchResults[index];
                            final isProcessing = state.actionInProgressId == user.id ||
                                (user.friendshipId != null &&
                                    state.actionInProgressId == 'cancel_${user.friendshipId}');

                            return SearchUserCard(
                              user: user,
                              isLoading: isProcessing,
                              onTap: () => UserProfileBottomSheet.show(context, user.id),
                              onAddFriend: () => context.read<FriendsCubit>().sendFriendRequest(user.id),
                              onCancelRequest: () {
                                final cancelId = user.friendshipId ?? user.id;
                                context.read<FriendsCubit>().cancelFriendRequest(cancelId, targetUserId: user.id);
                              },
                              onAcceptRequest: () {
                                if (user.friendshipId != null) {
                                  context.read<FriendsCubit>().respondFriendRequest(user.friendshipId!, true, targetUserId: user.id);
                                }
                              },
                            );
                          },
                        ),
        ),
      ],
    );
  }

  // ==========================================
  // TAB 4: DANH SÁCH BỊ CHẶN
  // ==========================================
  Widget _buildBlockedTab(BuildContext context, FriendsState state, bool isDark) {
    if (state.isBlockedLoading && state.blockedUsers.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.blockedUsers.isEmpty) {
      return _buildEmptyState(
        isDark: isDark,
        icon: LucideIcons.shieldCheck,
        title: 'Không có ai bị chặn',
        subtitle: 'Những người dùng bạn đã chặn sẽ được hiển thị ở đây.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<FriendsCubit>().loadBlockedUsers(isRefresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: state.blockedUsers.length,
        itemBuilder: (context, index) {
          final user = state.blockedUsers[index];
          final isProcessing = state.actionInProgressId == user.id;

          return BlockedUserCard(
            user: user,
            isLoading: isProcessing,
            onUnblock: () async {
              final confirm = await ConfirmActionDialog.show(
                context,
                title: 'Bỏ chặn?',
                content: 'Bạn có chắc chắn muốn bỏ chặn ${user.name}?',
                confirmLabel: 'Bỏ chặn',
              );
              if (confirm == true && context.mounted) {
                context.read<FriendsCubit>().unblockUser(user.id);
              }
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState({
    required bool isDark,
    required IconData icon,
    required String title,
    required String subtitle,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: AppSpacing.paddingXl,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : AppColors.lightInputFill,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 30,
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
              ),
            ),
            AppSpacing.gapV16,
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            AppSpacing.gapV6,
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            if (actionLabel != null && onAction != null) ...[
              AppSpacing.gapV16,
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                child: Text(actionLabel, style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
