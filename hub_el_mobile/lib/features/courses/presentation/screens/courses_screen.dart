import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/lucian_widgets.dart';
import '../../data/models/course_model.dart';
import 'playlist_screen.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  bool _isLoading = true;
  String? _error;
  List<CoursePlaylistModel> _courses = [];

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dioClient = DioClient();
      final res = await dioClient.dio.get(ApiEndpoints.courses);
      if (res.data != null && res.data['success'] == true) {
        final list = (res.data['data']?['playlists'] as List<dynamic>? ?? [])
            .map((item) => CoursePlaylistModel.fromJson(item as Map<String, dynamic>))
            .toList();
        setState(() {
          _courses = list;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = res.data?['error']?.toString() ?? 'Không thể tải danh sách khóa học.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Lỗi kết nối máy chủ: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final total = _courses.length;
    final completed = _courses.where((c) => c.isCompleted).length;
    final inProgress = total - completed;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: LucianMeteorBackground(
        child: RefreshIndicator(
        onRefresh: _loadCourses,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(LucideIcons.book, color: Colors.blueAccent, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Khóa Học Của Tôi',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Theo dõi tiến độ và lộ trình học tập trọn bộ',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Overview stats header (matching Web)
            if (!_isLoading && _error == null && _courses.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.darkCard : Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(LucideIcons.flame, color: Colors.orangeAccent, size: 16),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Đang theo học',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '$inProgress',
                                style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.darkCard : Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 16),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Đã hoàn thành',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '$completed',
                                style: const TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.success,
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

            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: AppColors.primary),
                      SizedBox(height: 12),
                      Text('Đang tải danh sách khóa học...', style: TextStyle(color: Colors.grey, fontSize: 13)),
                    ],
                  ),
                ),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.alertCircle, color: Colors.redAccent, size: 40),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadCourses,
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
                ),
              )
            else if (_courses.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.blue.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.listVideo, color: Colors.blueAccent, size: 44),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Chưa lưu Khóa học nào',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Bạn chưa lưu Playlist nào. Hãy tìm kiếm khóa học và nhấn "Lưu Khóa học" để theo dõi nhé!',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final course = _courses[index];
                      return _buildCourseCard(course, isDark);
                    },
                    childCount: _courses.length,
                  ),
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 96)),
          ],
        ),
        ),
      ),
    );
  }

  Widget _buildCourseCard(CoursePlaylistModel course, bool isDark) {
    Color gradeColor = Colors.grey;
    if (course.grade == 'Xuất sắc') {
      gradeColor = Colors.amber;
    } else if (course.grade == 'Giỏi') {
      gradeColor = AppColors.success;
    } else if (course.grade == 'Khá') {
      gradeColor = Colors.blueAccent;
    } else if (course.grade == 'Trung bình') {
      gradeColor = Colors.orangeAccent;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => PlaylistScreen(course: course),
              ),
            );
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Ảnh bìa Playlist
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: Stack(
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 8,
                      child: course.thumbnailUrl != null && course.thumbnailUrl!.isNotEmpty
                          ? Image.network(
                              course.thumbnailUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(color: Colors.grey.shade800),
                            )
                          : Container(color: Colors.grey.shade800),
                    ),
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'PLAYLIST',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 0.5),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.listVideo, color: Colors.white, size: 12),
                            const SizedBox(width: 4),
                            Text(
                              '${course.totalVideos} Video',
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Thông tin & điểm
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      course.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      course.channelTitle ?? 'Kênh đào tạo',
                      style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : Colors.grey.shade600),
                    ),
                    const SizedBox(height: 12),

                    // Thanh điểm số
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Điểm video', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                Text('${course.videoScore}/100', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(width: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Tổng kết', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                Text('${course.summaryScore}/100', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: gradeColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: gradeColor.withValues(alpha: 0.4)),
                          ),
                          child: Row(
                            children: [
                              if (course.grade == 'Xuất sắc') ...[
                                Icon(LucideIcons.award, color: gradeColor, size: 14),
                                const SizedBox(width: 4),
                              ],
                              Text(
                                course.grade,
                                style: TextStyle(color: gradeColor, fontWeight: FontWeight.w900, fontSize: 11),
                              ),
                            ],
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
      ),
    );
  }
}
