import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../domain/entities/friend_user_entity.dart';
import '../screens/chat_screen.dart';

class FriendCard extends StatelessWidget {
  final FriendUserEntity friend;
  final VoidCallback onTap;
  final VoidCallback onRemove;
  final VoidCallback onBlock;
  final VoidCallback? onChat;

  const FriendCard({
    super.key,
    required this.friend,
    required this.onTap,
    required this.onRemove,
    required this.onBlock,
    this.onChat,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Avatar kèm chỉ báo Online
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                      backgroundImage: safeGetImageProvider(friend.image),
                      child: (friend.image == null || friend.image!.isEmpty)
                          ? Text(
                              friend.name.isNotEmpty ? friend.name[0].toUpperCase() : 'U',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                            )
                          : null,
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        width: 13,
                        height: 13,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: friend.isOnline ? AppColors.success : AppColors.darkTextMuted,
                          border: Border.all(
                            color: isDark ? AppColors.darkCard : AppColors.lightCard,
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                AppSpacing.gapH12,
                // Thông tin bạn bè
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              friend.name,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          AppSpacing.gapH6,
                          // Level badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Lv.${friend.level}',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryLight,
                              ),
                            ),
                          ),
                        ],
                      ),
                      AppSpacing.gapV4,
                      Row(
                        children: [
                          if (friend.username != null && friend.username!.isNotEmpty) ...[
                            Flexible(
                              child: Text(
                                '@${friend.username}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            AppSpacing.gapH8,
                          ],
                          if (friend.streak > 0) ...[
                            const Icon(LucideIcons.flame, size: 12, color: AppColors.streak),
                            const SizedBox(width: 2),
                            Text(
                              '${friend.streak}d',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.streak,
                              ),
                            ),
                            AppSpacing.gapH8,
                          ],
                          Text(
                            friend.isOnline ? 'Đang hoạt động' : 'Offline',
                            style: TextStyle(
                              fontSize: 11,
                              color: friend.isOnline ? AppColors.success : AppColors.darkTextMuted,
                              fontWeight: friend.isOnline ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Nút Nhắn tin nhanh
                IconButton(
                  icon: const Icon(
                    LucideIcons.messageCircle,
                    size: 20,
                    color: Color(0xFF38BDF8),
                  ),
                  tooltip: 'Nhắn tin',
                  onPressed: onChat ??
                      () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ChatScreen(
                              partnerId: friend.id,
                              partnerName: friend.name,
                              partnerAvatar: friend.image,
                              isOnline: friend.isOnline,
                            ),
                          ),
                        );
                      },
                ),
                // Menu 3 chấm thao tác
                PopupMenuButton<String>(
                  icon: Icon(
                    LucideIcons.ellipsisVertical,
                    size: 18,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  onSelected: (value) {
                    if (value == 'chat') {
                      if (onChat != null) {
                        onChat!();
                      } else {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ChatScreen(
                              partnerId: friend.id,
                              partnerName: friend.name,
                              partnerAvatar: friend.image,
                              isOnline: friend.isOnline,
                            ),
                          ),
                        );
                      }
                    } else if (value == 'profile') {
                      onTap();
                    } else if (value == 'remove') {
                      onRemove();
                    } else if (value == 'block') {
                      onBlock();
                    }
                  },
                  itemBuilder: (ctx) => [
                    PopupMenuItem(
                      value: 'chat',
                      child: Row(
                        children: [
                          const Icon(LucideIcons.messageCircle, size: 16, color: Color(0xFF38BDF8)),
                          AppSpacing.gapH8,
                          const Text('Nhắn tin', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'profile',
                      child: Row(
                        children: [
                          Icon(LucideIcons.user, size: 16, color: AppColors.primaryLight),
                          AppSpacing.gapH8,
                          const Text('Xem hồ sơ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'remove',
                      child: Row(
                        children: [
                          Icon(LucideIcons.userMinus, size: 16, color: AppColors.error),
                          AppSpacing.gapH8,
                          Text('Hủy kết bạn', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.error)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'block',
                      child: Row(
                        children: [
                          Icon(LucideIcons.ban, size: 16, color: AppColors.error),
                          AppSpacing.gapH8,
                          Text('Chặn người dùng', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.error)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

