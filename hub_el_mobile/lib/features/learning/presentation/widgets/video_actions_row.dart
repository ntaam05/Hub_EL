import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../domain/entities/video_item_entity.dart';

class VideoActionsRow extends StatefulWidget {
  final VideoItemEntity video;
  final VoidCallback? onLikeToggle;
  final VoidCallback? onShareTap;
  final VoidCallback? onReportTap;
  final bool isLiked;

  const VideoActionsRow({
    super.key,
    required this.video,
    this.onLikeToggle,
    this.onShareTap,
    this.onReportTap,
    this.isLiked = false,
  });

  @override
  State<VideoActionsRow> createState() => _VideoActionsRowState();
}

class _VideoActionsRowState extends State<VideoActionsRow> {
  late bool _liked;

  @override
  void initState() {
    super.initState();
    _liked = widget.isLiked;
  }

  @override
  void didUpdateWidget(covariant VideoActionsRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isLiked != widget.isLiked) {
      _liked = widget.isLiked;
    }
  }

  void _showReportDialog(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final predefinedReasons = [
      'Chứa nội dung giải trí, chơi game',
      'Sai kiến thức, thông tin lệch lạc',
      'Nội dung phản cảm, độc hại',
    ];
    String? selectedReason;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Row(
            children: [
              Icon(LucideIcons.alertTriangle, color: Colors.orange, size: 22),
              SizedBox(width: 8),
              Text('Báo cáo Video', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Giúp cộng đồng loại bỏ các video giải trí rác hoặc sai lệch kiến thức khỏi hệ thống.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              AppSpacing.gapV12,
              ...predefinedReasons.map(
                (reason) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () => setDialogState(() => selectedReason = reason),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: selectedReason == reason
                            ? Colors.orange.withValues(alpha: 0.15)
                            : (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: selectedReason == reason
                              ? Colors.orange
                              : (isDark ? Colors.white12 : Colors.grey.shade300),
                        ),
                      ),
                      child: Text(
                        reason,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: selectedReason == reason ? Colors.orange : null,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: selectedReason == null
                  ? null
                  : () {
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Cảm ơn bạn! Báo cáo đã được gửi đến Ban Quản Trị xem xét.'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    },
              child: const Text('Gửi Báo Cáo'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Hàng nút hành động: Like, Report, Share
        Row(
          children: [
            // Nút Like (Thả tim)
            InkWell(
              onTap: () {
                setState(() => _liked = !_liked);
                widget.onLikeToggle?.call();
              },
              borderRadius: BorderRadius.circular(999),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _liked
                      ? Colors.red.withValues(alpha: 0.15)
                      : (isDark ? AppColors.darkCard : Colors.grey.shade100),
                  border: Border.all(
                    color: _liked
                        ? Colors.red.withValues(alpha: 0.4)
                        : (isDark ? AppColors.darkBorder : Colors.grey.shade300),
                  ),
                ),
                child: Icon(
                  LucideIcons.heart,
                  size: 20,
                  color: _liked ? Colors.red : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                ),
              ),
            ),
            AppSpacing.gapH8,

            // Nút Báo Cáo (Flag)
            InkWell(
              onTap: () => _showReportDialog(context),
              borderRadius: BorderRadius.circular(999),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? AppColors.darkCard : Colors.grey.shade100,
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                  ),
                ),
                child: Icon(
                  LucideIcons.flag,
                  size: 20,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
              ),
            ),
            AppSpacing.gapH8,

            // Nút Chia Sẻ (Share2)
            InkWell(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Đã sao chép link video: ${widget.video.youtubeUrl}'),
                    backgroundColor: AppColors.primary,
                  ),
                );
              },
              borderRadius: BorderRadius.circular(999),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? AppColors.darkCard : Colors.grey.shade100,
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                  ),
                ),
                child: Icon(
                  LucideIcons.share2,
                  size: 20,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
              ),
            ),
          ],
        ),
        AppSpacing.gapV16,

        // Tiêu đề video bài học
        Text(
          widget.video.title,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            height: 1.3,
            color: isDark ? Colors.white : AppColors.lightTextPrimary,
          ),
        ),
        AppSpacing.gapV6,

        // Kênh YouTube
        Row(
          children: [
            Icon(
              LucideIcons.userCircle,
              size: 16,
              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
            ),
            AppSpacing.gapH6,
            Text(
              widget.video.channelTitle,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

