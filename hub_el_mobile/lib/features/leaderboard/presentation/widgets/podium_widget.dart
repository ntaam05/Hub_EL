import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../domain/entities/leaderboard_entity.dart';

class PodiumWidget extends StatelessWidget {
  final List<LeaderboardPlayerEntity> top3;

  const PodiumWidget({super.key, required this.top3});

  LeaderboardPlayerEntity? get rank1 => top3.isNotEmpty ? top3[0] : null;
  LeaderboardPlayerEntity? get rank2 => top3.length > 1 ? top3[1] : null;
  LeaderboardPlayerEntity? get rank3 => top3.length > 2 ? top3[2] : null;

  @override
  Widget build(BuildContext context) {
    if (top3.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Hạng 2 (Bạc - Bên trái)
          Expanded(
            child: _buildPodiumColumn(
              context,
              player: rank2,
              position: 2,
              pillarHeight: 110,
              gradientColors: [
                const Color(0xFF64748B).withValues(alpha: 0.15),
                const Color(0xFF94A3B8).withValues(alpha: 0.4),
              ],
              borderColor: const Color(0xFF94A3B8),
              badgeColor: const Color(0xFFE2E8F0),
              badgeTextColor: const Color(0xFF0F172A),
              avatarSize: 56,
            ),
          ),
          const SizedBox(width: 8),

          // Hạng 1 (Vàng - Ở giữa cao nhất)
          Expanded(
            child: _buildPodiumColumn(
              context,
              player: rank1,
              position: 1,
              pillarHeight: 145,
              gradientColors: [
                const Color(0xFFEAB308).withValues(alpha: 0.15),
                const Color(0xFFFACC15).withValues(alpha: 0.5),
              ],
              borderColor: const Color(0xFFFACC15),
              badgeColor: const Color(0xFFFACC15),
              badgeTextColor: const Color(0xFF713F12),
              avatarSize: 68,
              hasCrown: true,
            ),
          ),
          const SizedBox(width: 8),

          // Hạng 3 (Đồng - Bên phải)
          Expanded(
            child: _buildPodiumColumn(
              context,
              player: rank3,
              position: 3,
              pillarHeight: 85,
              gradientColors: [
                const Color(0xFFEA580C).withValues(alpha: 0.15),
                const Color(0xFFFB923C).withValues(alpha: 0.4),
              ],
              borderColor: const Color(0xFFFB923C),
              badgeColor: const Color(0xFFFED7AA),
              badgeTextColor: const Color(0xFF7C2D12),
              avatarSize: 52,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPodiumColumn(
    BuildContext context, {
    required LeaderboardPlayerEntity? player,
    required int position,
    required double pillarHeight,
    required List<Color> gradientColors,
    required Color borderColor,
    required Color badgeColor,
    required Color badgeTextColor,
    required double avatarSize,
    bool hasCrown = false,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final name = player?.displayName ?? '...';
    final score = player?.scoreLabel ?? '...';
    final avatarUrl = player?.avatar;

    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        // Vương miện cho Hạng 1
        if (hasCrown)
          const Padding(
            padding: EdgeInsets.only(bottom: 2),
            child: Icon(
              LucideIcons.crown,
              size: 26,
              color: Color(0xFFFACC15),
            ),
          )
        else
          const SizedBox(height: 28),

        // Avatar + Badge thứ hạng
        Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Container(
              width: avatarSize,
              height: avatarSize,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: borderColor, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: borderColor.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipOval(
                child: buildSafeAvatarImage(
                  imageUrl: avatarUrl,
                  fallback: _buildFallbackAvatar(name),
                ),
              ),
            ),
            // Badge tròn số thứ hạng
            Positioned(
              bottom: -6,
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: badgeColor,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '$position',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: badgeTextColor,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Tên người chơi
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: position == 1 ? 13 : 12,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
        ),

        // Điểm số
        Text(
          score,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: borderColor,
          ),
        ),

        const SizedBox(height: 8),

        // Cột bục vinh quang (Pillar)
        Container(
          height: pillarHeight,
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: gradientColors,
            ),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            border: Border.all(
              color: borderColor.withValues(alpha: 0.6),
              width: 1.5,
            ),
          ),
          child: Center(
            child: Icon(
              LucideIcons.trophy,
              size: position == 1 ? 32 : 24,
              color: borderColor.withValues(alpha: 0.4),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFallbackAvatar(String name) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';
    return Container(
      color: const Color(0xFF334155),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}
