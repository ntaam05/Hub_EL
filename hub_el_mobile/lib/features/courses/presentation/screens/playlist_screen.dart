import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/lucian_widgets.dart';
import '../../../learning/data/models/video_item_model.dart';
import '../../../learning/domain/entities/video_item_entity.dart';
import '../../../learning/presentation/screens/watch_screen.dart';
import '../../data/models/course_model.dart';

class PlaylistScreen extends StatefulWidget {
  final CoursePlaylistModel? course;
  final VideoItemEntity? playlistItem;
  final String? playlistId;

  const PlaylistScreen({
    super.key,
    this.course,
    this.playlistItem,
    this.playlistId,
  }) : assert(course != null || playlistItem != null || playlistId != null);

  @override
  State<PlaylistScreen> createState() => _PlaylistScreenState();
}

class _PlaylistScreenState extends State<PlaylistScreen> {
  late String _playlistId;
  late String _title;
  late String _channelTitle;
  late String _thumbnailUrl;
  late int _totalVideos;
  late int _videoScore;
  late int _summaryScore;
  late String _grade;

  bool _isSaved = false;
  bool _isLoading = false;
  bool _isToggling = false;
  String? _errorMessage;

  List<VideoItemEntity> _items = [];
  List<String> _videoIds = [];

  @override
  void initState() {
    super.initState();
    final course = widget.course;
    final item = widget.playlistItem;

    _playlistId = course?.playlistId ?? item?.videoId ?? widget.playlistId ?? '';
    _title = course?.title ?? item?.title ?? 'Danh sách phát';
    _channelTitle = course?.channelTitle ?? item?.channelTitle ?? 'Kênh đào tạo';
    _thumbnailUrl = course?.thumbnailUrl ?? item?.thumbnailUrl ?? '';
    _totalVideos = course?.totalVideos ?? 0;
    _videoScore = course?.videoScore ?? 0;
    _summaryScore = course?.summaryScore ?? 0;
    _grade = course?.grade ?? 'Chưa đạt';

    if (course != null) {
      _isSaved = true;
      _videoIds = course.videoIds
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();
    }

    _loadPlaylistDetails();
  }

  Future<void> _loadPlaylistDetails() async {
    if (!mounted) return;
    if (_items.isEmpty) {
      setState(() => _isLoading = true);
    }
    try {
      final dioClient = DioClient();
      final res = await dioClient.dio.get(
        ApiEndpoints.playlistItems,
        queryParameters: {'playlistId': _playlistId},
      );

      if (!mounted) return;

      if (res.data != null && res.data['success'] == true) {
        final data = res.data['data'] as Map<String, dynamic>;
        final rawItems = data['items'] as List<dynamic>? ?? [];
        final parsedItems = rawItems
            .map((e) => VideoItemModel.fromJson(e as Map<String, dynamic>))
            .toList();

        final favorited = data['isFavorited'] == true;
        final videoScore = data['videoScore'] is int
            ? data['videoScore'] as int
            : int.tryParse(data['videoScore']?.toString() ?? '0') ?? 0;
        final summaryScore = data['summaryScore'] is int
            ? data['summaryScore'] as int
            : int.tryParse(data['summaryScore']?.toString() ?? '0') ?? 0;
        final grade = (data['grade'] ?? _grade).toString();
        final title = (data['title'] ?? _title).toString();
        final channelTitle = (data['channelTitle'] ?? _channelTitle).toString();
        final thumb = (data['thumbnailUrl'] ?? _thumbnailUrl).toString();

        setState(() {
          _items = parsedItems;
          _isSaved = favorited;
          if (title.isNotEmpty && _title == 'Danh sách phát') _title = title;
          if (channelTitle.isNotEmpty && _channelTitle == 'Kênh đào tạo') {
            _channelTitle = channelTitle;
          }
          if (thumb.isNotEmpty && _thumbnailUrl.isEmpty) _thumbnailUrl = thumb;
          _videoScore = videoScore;
          _summaryScore = summaryScore;
          _grade = grade;
          _videoIds = parsedItems.map((e) => e.videoId).toList();
          _totalVideos = parsedItems.isNotEmpty
              ? parsedItems.length
              : (data['totalVideos'] is int ? data['totalVideos'] as int : _totalVideos);
          _isLoading = false;
          _errorMessage = null;
        });
      } else {
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          if (_items.isEmpty && _videoIds.isEmpty) {
            _errorMessage = res.data?['error']?['message']?.toString() ??
                'Không thể tải danh sách bài học.';
          }
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        if (_items.isEmpty && _videoIds.isEmpty) {
          _errorMessage = 'Lỗi kết nối khi tải danh sách phát.';
        }
      });
    }
  }

  Future<void> _toggleSaveCourse() async {
    setState(() => _isToggling = true);
    try {
      final dioClient = DioClient();
      final res = await dioClient.dio.post(
        ApiEndpoints.courses,
        data: {
          'playlistId': _playlistId,
          'title': _title,
          'channelTitle': _channelTitle,
          'thumbnailUrl': _thumbnailUrl,
          'totalVideos': _items.isNotEmpty ? _items.length : (_totalVideos > 0 ? _totalVideos : 1),
          'videoIds': _videoIds.isNotEmpty ? _videoIds.join(',') : _playlistId,
        },
      );

      if (res.data != null && res.data['success'] == true) {
        final favorited = res.data['data']?['isFavorited'] == true;
        setState(() {
          _isSaved = favorited;
          _isToggling = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                favorited
                    ? 'Đã lưu Khóa học vào bộ sưu tập!'
                    : 'Đã bỏ lưu Khóa học!',
              ),
              backgroundColor: favorited ? AppColors.primary : Colors.grey.shade800,
            ),
          );
        }
      } else {
        setState(() => _isToggling = false);
      }
    } catch (e) {
      setState(() => _isToggling = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  void _startLearning() {
    if (_items.isNotEmpty) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => WatchScreen(video: _items.first),
        ),
      );
    } else if (_videoIds.isNotEmpty) {
      final vidId = _videoIds.first;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => WatchScreen(
            video: VideoItemEntity(
              videoId: vidId,
              title: '$_title - Bài 1',
              channelTitle: _channelTitle,
              thumbnailUrl: 'https://img.youtube.com/vi/$vidId/mqdefault.jpg',
            ),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalDisplayVideos = _items.isNotEmpty
        ? _items.length
        : (_totalVideos > 0 ? _totalVideos : _videoIds.length);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text(
          'CHI TIẾT KHÓA HỌC',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
        ),
        backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
        elevation: 0.5,
        actions: [
          LucianBookmarkButton(
            isBookmarked: _isSaved,
            onToggle: () {
              if (!_isToggling) _toggleSaveCourse();
            },
          ),
        ],
      ),
      body: LucianMeteorBackground(
        child: RefreshIndicator(
        onRefresh: _loadPlaylistDetails,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Banner khóa học
            GestureDetector(
              onTap: _startLearning,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 9,
                      child: _thumbnailUrl.isNotEmpty
                          ? Image.network(
                              _thumbnailUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(
                                color: Colors.grey.shade900,
                                child: const Center(
                                  child: Icon(LucideIcons.image, size: 48, color: Colors.white24),
                                ),
                              ),
                            )
                          : Container(
                              color: Colors.grey.shade900,
                              child: const Center(
                                child: Icon(LucideIcons.video, size: 48, color: Colors.white24),
                              ),
                            ),
                    ),
                    // Nút Play overlay ở giữa banner
                    Positioned.fill(
                      child: Container(
                        color: Colors.black.withValues(alpha: 0.25),
                        child: const Center(
                          child: Icon(
                            LucideIcons.playCircle,
                            size: 54,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.listVideo, color: Colors.white, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '$totalDisplayVideos Video',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
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
            AppSpacing.gapV16,

            // Tiêu đề & Kênh đào tạo
            Text(
              _title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            AppSpacing.gapV6,
            Row(
              children: [
                const Icon(LucideIcons.tv, size: 14, color: Colors.grey),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _channelTitle,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white60 : Colors.grey.shade600,
                    ),
                  ),
                ),
              ],
            ),
            AppSpacing.gapV16,

            // Điểm số & Xếp loại (Hiển thị khi đã lưu hoặc có điểm)
            if (_isSaved || _videoScore > 0 || _summaryScore > 0) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildScoreCol('Điểm Video', '$_videoScore/50', Colors.blueAccent),
                    Container(width: 1, height: 36, color: isDark ? Colors.white12 : Colors.grey.shade300),
                    _buildScoreCol('Tổng kết', '$_summaryScore/50', Colors.purpleAccent),
                    Container(width: 1, height: 36, color: isDark ? Colors.white12 : Colors.grey.shade300),
                    _buildScoreCol('Xếp loại', _grade, Colors.amber),
                  ],
                ),
              ),
              AppSpacing.gapV16,
            ],

            // Bộ nút thao tác: BẮT ĐẦU HỌC & LƯU KHÓA HỌC
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: (_items.isNotEmpty || _videoIds.isNotEmpty) ? _startLearning : null,
                      icon: const Icon(LucideIcons.play, size: 18, color: Colors.white),
                      label: const Text(
                        'BẮT ĐẦU HỌC',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: _isToggling ? null : _toggleSaveCourse,
                    icon: _isToggling
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(
                            _isSaved ? LucideIcons.bookmarkCheck : LucideIcons.bookmark,
                            size: 18,
                            color: _isSaved ? AppColors.primary : (isDark ? Colors.white70 : Colors.black87),
                          ),
                    label: Text(
                      _isSaved ? 'ĐÃ LƯU' : 'LƯU KHÓA',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: _isSaved ? AppColors.primary : (isDark ? Colors.white : Colors.black87),
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: _isSaved ? AppColors.primary : (isDark ? Colors.white24 : Colors.grey.shade300),
                        width: 1.5,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
            AppSpacing.gapV24,

            // Danh sách bài học
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'DANH SÁCH BÀI HỌC ($totalDisplayVideos)',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                    color: isDark ? Colors.white70 : const Color(0xFF334155),
                  ),
                ),
                if (_isLoading)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                  ),
              ],
            ),
            AppSpacing.gapV12,

            if (_isLoading && _items.isEmpty && _videoIds.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Column(
                    children: [
                      CircularProgressIndicator(color: AppColors.primary),
                      SizedBox(height: 12),
                      Text('Đang tải danh sách bài học từ YouTube...', style: TextStyle(color: Colors.grey, fontSize: 13)),
                    ],
                  ),
                ),
              )
            else if (_errorMessage != null && _items.isEmpty && _videoIds.isEmpty)
              Padding(
                padding: EdgeInsets.symmetric(vertical: 30),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(LucideIcons.alertCircle, size: 36, color: Colors.orangeAccent),
                      const SizedBox(height: 10),
                      Text(_errorMessage!, style: const TextStyle(color: Colors.grey)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _loadPlaylistDetails,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                ),
              )
            else if (_items.isNotEmpty)
              ..._items.asMap().entries.map((entry) {
                final idx = entry.key;
                final item = entry.value;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => WatchScreen(video: item),
                        ),
                      );
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Row(
                        children: [
                          // Thumbnail video với số thứ tự
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Stack(
                              children: [
                                SizedBox(
                                  width: 100,
                                  height: 60,
                                  child: item.thumbnailUrl.isNotEmpty
                                      ? Image.network(
                                          item.thumbnailUrl,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) =>
                                              Container(color: Colors.grey.shade800),
                                        )
                                      : Container(color: Colors.grey.shade800),
                                ),
                                Positioned(
                                  top: 4,
                                  left: 4,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.75),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '#${idx + 1}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Tiêu đề & tác giả
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.channelTitle.isNotEmpty ? item.channelTitle : _channelTitle,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? Colors.white60 : Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Icon Play
                          const Icon(
                            LucideIcons.playCircle,
                            color: AppColors.primary,
                            size: 26,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              })
            else
              ..._videoIds.asMap().entries.map((entry) {
                final idx = entry.key;
                final vidId = entry.value;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      leading: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${idx + 1}',
                            style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary),
                          ),
                        ),
                      ),
                      title: Text(
                        'Bài học ${idx + 1}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      subtitle: Text('ID: $vidId', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      trailing: const Icon(LucideIcons.playCircle, color: AppColors.primary, size: 28),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => WatchScreen(
                              video: VideoItemEntity(
                                videoId: vidId,
                                title: '$_title - Bài ${idx + 1}',
                                channelTitle: _channelTitle,
                                thumbnailUrl: 'https://img.youtube.com/vi/$vidId/mqdefault.jpg',
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                );
              }),
          ],
        ),
        ),
      ),
    );
  }

  Widget _buildScoreCol(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: color),
        ),
      ],
    );
  }
}
