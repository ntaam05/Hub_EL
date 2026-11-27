import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/dashboard_entity.dart';

class FavoriteVideosCard extends StatefulWidget {
  final List<DashboardVideoEntity> videos;
  final Function(DashboardVideoEntity video)? onVideoTap;

  const FavoriteVideosCard({
    super.key,
    required this.videos,
    this.onVideoTap,
  });

  @override
  State<FavoriteVideosCard> createState() => _FavoriteVideosCardState();
}

class _FavoriteVideosCardState extends State<FavoriteVideosCard> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Icon(LucideIcons.heart, size: 18, color: Colors.redAccent),
                AppSpacing.gapH8,
                Text(
                  'Video yêu thích',
                  style: AppTextStyles.h3.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  ),
                ),
              ],
            ),
            if (widget.videos.length > 1) ...[
              Row(
                children: [
                  IconButton(
                    icon: const Icon(LucideIcons.chevronLeft, size: 18),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () {
                      setState(() {
                        _currentIndex = (_currentIndex - 1 + widget.videos.length) % widget.videos.length;
                      });
                    },
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${_currentIndex + 1}/${widget.videos.length}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(LucideIcons.chevronRight, size: 18),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () {
                      setState(() {
                        _currentIndex = (_currentIndex + 1) % widget.videos.length;
                      });
                    },
                  ),
                ],
              ),
            ],
          ],
        ),
        AppSpacing.gapV12,

        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.spaceCard : Colors.white,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(
              color: isDark ? AppColors.spaceCardBorder : Colors.grey.shade200,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
                blurRadius: 25,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: widget.videos.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(LucideIcons.heart, size: 28, color: Colors.grey),
                        SizedBox(height: 8),
                        Text(
                          'Bạn chưa có video yêu thích nào.',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                )
              : _buildVideoItem(widget.videos[_currentIndex], isDark),
        ),
      ],
    );
  }

  Widget _buildVideoItem(DashboardVideoEntity item, bool isDark) {
    return InkWell(
      onTap: () => widget.onVideoTap?.call(item),
      borderRadius: BorderRadius.circular(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (item.thumbnailUrl.isNotEmpty)
                    Image.network(
                      item.thumbnailUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(color: Colors.black26),
                    )
                  else
                    Container(color: Colors.black38),

                  Container(
                    color: Colors.black.withValues(alpha: 0.3),
                    child: Center(
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.25),
                        ),
                        child: const Icon(
                          LucideIcons.playCircle,
                          color: Colors.white,
                          size: 26,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          AppSpacing.gapV12,
          Text(
            item.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, height: 1.25),
          ),
          const SizedBox(height: 4),
          Text(
            item.channelTitle,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
            ),
          ),
        ],
      ),
    );
  }
}

