import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../domain/entities/search_user_entity.dart';
import '../../domain/entities/user_profile_entity.dart';
import '../cubit/friends_cubit.dart';
import '../cubit/friends_state.dart';
import '../screens/chat_screen.dart';
import 'confirm_action_dialog.dart';

class UserProfileBottomSheet extends StatelessWidget {
  final String userId;

  const UserProfileBottomSheet({
    super.key,
    required this.userId,
  });

  static Future<void> show(BuildContext context, String userId) {
    // Kích hoạt nạp hồ sơ người dùng
    context.read<FriendsCubit>().loadUserProfile(userId);

    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: context.read<FriendsCubit>(),
        child: UserProfileBottomSheet(userId: userId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.82,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Expanded(
            child: BlocBuilder<FriendsCubit, FriendsState>(
              builder: (context, state) {
                if (state.isProfileLoading) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (state.profileError != null) {
                  return Center(
                    child: Padding(
                      padding: AppSpacing.paddingXl,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.alertCircle, size: 40, color: AppColors.error),
                          AppSpacing.gapV12,
                          Text(
                            state.profileError!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                          AppSpacing.gapV16,
                          ElevatedButton(
                            onPressed: () => context.read<FriendsCubit>().loadUserProfile(userId),
                            child: const Text('Thử lại'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final profile = state.selectedProfile;
                if (profile == null) {
                  return const Center(child: Text('Không tìm thấy thông tin'));
                }

                return SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
                  child: Column(
                    children: [
                      // Avatar lớn kèm chỉ báo Online
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          CircleAvatar(
                            radius: 46,
                            backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                            backgroundImage: safeGetImageProvider(profile.image),
                            child: (profile.image == null || profile.image!.isEmpty)
                                ? Text(
                                    profile.name.isNotEmpty ? profile.name[0].toUpperCase() : 'U',
                                    style: TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                    ),
                                  )
                                : null,
                          ),
                          Container(
                            width: 18,
                            height: 18,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: profile.isOnline ? AppColors.success : AppColors.darkTextMuted,
                              border: Border.all(
                                color: isDark ? AppColors.darkCard : AppColors.lightCard,
                                width: 3,
                              ),
                            ),
                          ),
                        ],
                      ),
                      AppSpacing.gapV12,
                      // Tên & Level
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Flexible(
                            child: Text(
                              profile.name,
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          AppSpacing.gapH8,
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Cấp ${profile.level}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryLight,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (profile.username != null && profile.username!.isNotEmpty) ...[
                        AppSpacing.gapV4,
                        Text(
                          '@${profile.username}',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                      AppSpacing.gapV16,
                      // Bio
                      if (profile.bio != null && profile.bio!.isNotEmpty && !profile.isProfileHidden)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                            ),
                          ),
                          child: Text(
                            profile.bio!,
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              fontStyle: FontStyle.italic,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      // Cảnh báo riêng tư nếu bị ẩn
                      if (profile.isProfileHidden)
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.warning.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(LucideIcons.lock, size: 18, color: AppColors.warning),
                              AppSpacing.gapH8,
                              const Expanded(
                                child: Text(
                                  'Hồ sơ người dùng này đang đặt ở chế độ riêng tư.',
                                  style: TextStyle(fontSize: 12, color: AppColors.warning),
                                ),
                              ),
                            ],
                          ),
                        ),
                      AppSpacing.gapV16,
                      // Thống kê (Chỉ hiển thị khi không ẩn hoàn toàn)
                      Row(
                        children: [
                          _buildStatCard(
                            isDark: isDark,
                            icon: LucideIcons.flame,
                            iconColor: AppColors.streak,
                            title: 'Chuỗi',
                            value: '${profile.streak} ngày',
                          ),
                          AppSpacing.gapH8,
                          _buildStatCard(
                            isDark: isDark,
                            icon: LucideIcons.zap,
                            iconColor: AppColors.energy,
                            title: 'Kinh nghiệm',
                            value: '${profile.experience} XP',
                          ),
                          AppSpacing.gapH8,
                          _buildStatCard(
                            isDark: isDark,
                            icon: LucideIcons.users,
                            iconColor: AppColors.primaryLight,
                            title: 'Bạn bè',
                            value: '${profile.friendsCount}',
                          ),
                        ],
                      ),
                      AppSpacing.gapV20,
                      // Các nút thao tác quan hệ
                      _buildActionButtons(context, profile, isDark),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required bool isDark,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String value,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: iconColor),
            AppSpacing.gapV6,
            Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            AppSpacing.gapV2,
            Text(
              title,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, UserProfileEntity profile, bool isDark) {
    final cubit = context.read<FriendsCubit>();

    if (profile.friendshipStatus == FriendshipStatus.accepted) {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ChatScreen(
                      partnerId: profile.id,
                      partnerName: profile.name,
                      partnerAvatar: profile.image,
                      isOnline: profile.isOnline,
                    ),
                  ),
                );
              },
              icon: const Icon(LucideIcons.messageCircle, size: 18),
              label: const Text('Nhắn tin', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          AppSpacing.gapV8,
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final confirm = await ConfirmActionDialog.show(
                      context,
                      title: 'Hủy kết bạn?',
                      content: 'Bạn có chắc chắn muốn hủy kết bạn với ${profile.name}?',
                      confirmLabel: 'Hủy kết bạn',
                      isDestructive: true,
                    );
                    if (confirm == true && context.mounted) {
                      await cubit.removeFriend(profile.id);
                    }
                  },
                  icon: const Icon(LucideIcons.userMinus, size: 16),
                  label: const Text('Hủy kết bạn', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                    foregroundColor: AppColors.error,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                  ),
                ),
              ),
              AppSpacing.gapH8,
              ElevatedButton.icon(
                onPressed: () async {
                  final confirm = await ConfirmActionDialog.show(
                    context,
                    title: 'Chặn người dùng?',
                    content: 'Sau khi chặn, người này sẽ không thể liên lạc hoặc thấy hồ sơ của bạn.',
                    confirmLabel: 'Chặn',
                    isDestructive: true,
                  );
                  if (confirm == true && context.mounted) {
                    await cubit.blockUser(profile.id);
                  }
                },
                icon: const Icon(LucideIcons.ban, size: 16),
                label: const Text('Chặn', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.error.withValues(alpha: 0.15),
                  foregroundColor: AppColors.error,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ],
      );
    }

    if (profile.friendshipStatus == FriendshipStatus.blocked) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () async {
            final confirm = await ConfirmActionDialog.show(
              context,
              title: 'Bỏ chặn?',
              content: 'Bạn có chắc chắn muốn bỏ chặn ${profile.name}?',
              confirmLabel: 'Bỏ chặn',
            );
            if (confirm == true && context.mounted) {
              await cubit.unblockUser(profile.id);
            }
          },
          icon: const Icon(LucideIcons.unlock, size: 16),
          label: const Text('Bỏ chặn người dùng', style: TextStyle(fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(vertical: 12),
          ),
        ),
      );
    }

    if (profile.friendshipStatus == FriendshipStatus.pending) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () async {
            await cubit.cancelFriendRequest(profile.id, targetUserId: profile.id);
          },
          icon: const Icon(LucideIcons.x, size: 16),
          label: const Text('Hủy lời mời kết bạn đã gửi', style: TextStyle(fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.streak.withValues(alpha: 0.15),
            foregroundColor: AppColors.streak,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(vertical: 12),
            elevation: 0,
          ),
        ),
      );
    }

    // Chưa kết bạn (NONE)
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () async {
              await cubit.sendFriendRequest(profile.id);
            },
            icon: const Icon(LucideIcons.userPlus, size: 16),
            label: const Text('Gửi lời mời kết bạn', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        AppSpacing.gapH8,
        ElevatedButton(
          onPressed: () async {
            final confirm = await ConfirmActionDialog.show(
              context,
              title: 'Chặn người dùng?',
              content: 'Sau khi chặn, người này sẽ không thể liên lạc với bạn.',
              confirmLabel: 'Chặn',
              isDestructive: true,
            );
            if (confirm == true && context.mounted) {
              await cubit.blockUser(profile.id);
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.error.withValues(alpha: 0.15),
            foregroundColor: AppColors.error,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
            elevation: 0,
          ),
          child: const Icon(LucideIcons.ban, size: 16),
        ),
      ],
    );
  }
}

