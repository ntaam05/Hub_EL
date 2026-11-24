import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/quiz_history_model.dart';
import 'quiz_review_screen.dart';

class PracticeScreen extends StatefulWidget {
  const PracticeScreen({super.key});

  @override
  State<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends State<PracticeScreen> {
  bool _isLoading = true;
  String? _error;
  List<QuizHistoryModel> _history = [];

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dioClient = DioClient();
      final res = await dioClient.dio.get(ApiEndpoints.quizHistory);
      if (res.data != null && res.data['success'] == true) {
        final list = (res.data['data'] as List<dynamic>? ?? [])
            .map((item) => QuizHistoryModel.fromJson(item as Map<String, dynamic>))
            .toList();
        setState(() {
          _history = list;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = res.data?['error']?.toString() ?? 'Không thể tải lịch sử làm bài.';
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

  Map<String, List<QuizHistoryModel>> _groupHistory() {
    final Map<String, List<QuizHistoryModel>> grouped = {};
    for (final item in _history) {
      final text = '${item.videoTitle ?? ''} ${item.channelName ?? ''}'.toLowerCase();
      String topic = 'Chủ đề Khác';

      if (text.contains('python') || text.contains('django') || text.contains('flask')) {
        topic = 'Python';
      } else if (text.contains('java') || text.contains('spring')) {
        topic = 'Java';
      } else if (text.contains('javascript') || text.contains('typescript') || text.contains('js')) {
        topic = 'JavaScript';
      } else if (text.contains('flutter') || text.contains('dart')) {
        topic = 'Flutter';
      } else if (text.contains('react') || text.contains('nextjs')) {
        topic = 'React & Next';
      } else if (text.contains('english') || text.contains('tiếng anh') || text.contains('toeic') || text.contains('ielts')) {
        topic = 'Tiếng Anh';
      }

      grouped.putIfAbsent(topic, () => []).add(item);
    }
    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      body: RefreshIndicator(
        onRefresh: _loadHistory,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.indigo.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(LucideIcons.target, color: Colors.indigoAccent, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Góc Luyện Tập',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Xem lại và ôn tập các bài kiểm tra đã hoàn thành',
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

            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: AppColors.primary),
                      SizedBox(height: 12),
                      Text('Đang nạp kho bài tập...', style: TextStyle(color: Colors.grey, fontSize: 13)),
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
                          onPressed: _loadHistory,
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
            else if (_history.isEmpty)
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
                            color: Colors.indigo.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.bookOpen, color: Colors.indigo, size: 44),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Chưa có dữ liệu bài tập',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Bạn chưa thực hiện bài tập nào. Hãy chọn một video và bắt đầu kiểm tra kiến thức ngay nhé!',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              _buildGroupedList(isDark),

            const SliverToBoxAdapter(child: SizedBox(height: 96)),
          ],
        ),
      ),
    );
  }

  Widget _buildGroupedList(bool isDark) {
    final grouped = _groupHistory();

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final topic = grouped.keys.elementAt(index);
            final items = grouped[topic]!;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Topic header
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(LucideIcons.award, color: AppColors.primary, size: 16),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        topic,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white10 : Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${items.length} bài',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white60 : Colors.black54,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Cards in topic
                ...items.map((attempt) => _buildAttemptCard(attempt, isDark)),
                const SizedBox(height: 12),
              ],
            );
          },
          childCount: grouped.keys.length,
        ),
      ),
    );
  }

  Widget _buildAttemptCard(QuizHistoryModel attempt, bool isDark) {
    final percent = attempt.totalQuizzes > 0
        ? (attempt.correctCount / attempt.totalQuizzes)
        : 0.0;
    final scoreStr = '${attempt.correctCount}/${attempt.totalQuizzes}';
    final dateStr = '${attempt.createdAt.day}/${attempt.createdAt.month}/${attempt.createdAt.year}';

    Color scoreColor = Colors.redAccent;
    if (percent >= 0.8) {
      scoreColor = AppColors.success;
    } else if (percent >= 0.5) {
      scoreColor = Colors.amber;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => QuizReviewScreen(attempt: attempt),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Video thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    children: [
                      Container(
                        width: 100,
                        height: 65,
                        color: Colors.grey.shade800,
                        child: attempt.thumbnailUrl != null && attempt.thumbnailUrl!.isNotEmpty
                            ? Image.network(
                                attempt.thumbnailUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => const Center(
                                  child: Icon(LucideIcons.video, color: Colors.white54, size: 24),
                                ),
                              )
                            : const Center(
                                child: Icon(LucideIcons.video, color: Colors.white54, size: 24),
                              ),
                      ),
                      Positioned(
                        bottom: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.75),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            dateStr,
                            style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),

                // Info & score
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        attempt.videoTitle ?? 'Trắc nghiệm',
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
                        attempt.channelName ?? 'Kênh học tập',
                        maxLines: 1,
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.white54 : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Progress bar and score
                      Row(
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: percent.clamp(0.0, 1.0),
                                backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                                valueColor: AlwaysStoppedAnimation<Color>(scoreColor),
                                minHeight: 6,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: scoreColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              scoreStr,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                color: scoreColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                const Icon(LucideIcons.chevronRight, size: 16, color: Colors.grey),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
