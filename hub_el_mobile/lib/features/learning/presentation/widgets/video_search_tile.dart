import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../domain/entities/video_item_entity.dart';

class VideoSearchTile extends StatelessWidget {
  final VideoItemEntity video;
  final VoidCallback onTap;

  const VideoSearchTile({
    super.key,
    required this.video,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 16:9 Thumbnail nhỏ gọn chuẩn Mobile Web (w-[140px])
            SizedBox(
              width: 140,
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (video.thumbnailUrl.isNotEmpty)
                        Image.network(
                          video.thumbnailUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            color: isDark ? AppColors.darkCard : Colors.grey.shade200,
                            child: const Center(
                              child: Icon(LucideIcons.image, size: 24, color: Colors.grey),
                            ),
                          ),
                        )
                      else
                        Container(color: isDark ? AppColors.darkCard : Colors.grey.shade200),

                      // Overlay nút Play mờ
                      Container(
                        color: Colors.black.withValues(alpha: 0.25),
                        child: const Center(
                          child: Icon(
                            LucideIcons.playCircle,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                      ),

                      // Badge Playlist nếu là danh sách bài giảng
                      if (video.isPlaylist)
                        Positioned(
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: 44,
                          child: Container(
                            color: Colors.black.withValues(alpha: 0.8),
                            child: const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.listVideo, size: 14, color: Colors.white),
                                SizedBox(height: 2),
                                Text(
                                  'DANH SÁCH',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 7,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            AppSpacing.gapH12,

            // Nội dung thông tin video bên phải
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    video.title,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      height: 1.25,
                      color: isDark ? Colors.white : AppColors.lightTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        LucideIcons.userCircle,
                        size: 14,
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          video.channelTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
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
      ),
    );
  }
}

