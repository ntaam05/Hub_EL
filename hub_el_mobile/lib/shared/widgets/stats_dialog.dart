import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../features/authentication/domain/entities/user_entity.dart';

class StatsDialog extends StatefulWidget {
  final UserEntity user;

  const StatsDialog({super.key, required this.user});

  static Future<void> show(BuildContext context, {required UserEntity user}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatsDialog(user: user),
    );
  }

  @override
  State<StatsDialog> createState() => _StatsDialogState();
}

class _StatsDialogState extends State<StatsDialog> {
  int _activeTab = 0; // 0: Tổng quan, 1: Học tập & tiến độ, 2: Kho Gacha Wiki & Xã hội
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dioClient = DioClient();
      final res = await dioClient.dio.get(ApiEndpoints.userFullStats);
      if (res.data != null && res.data['success'] == true) {
        setState(() {
          _data = res.data['data'] as Map<String, dynamic>?;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = res.data?['error']?.toString() ?? 'Không thể tải dữ liệu thống kê.';
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
    final size = MediaQuery.of(context).size;

    return Container(
      height: size.height * 0.88,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(LucideIcons.barChart2, color: AppColors.primary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Thống kê học tập',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                      ),
                      Text(
                        'Level ${widget.user.level} • ${widget.user.xp} XP ${widget.user.isPro ? "• PRO" : ""}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          // 3 Tabs matching Web
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: [
                _buildTabPill(0, 'Tổng Quan', LucideIcons.trendingUp),
                const SizedBox(width: 8),
                _buildTabPill(1, 'Học Tập & Tiến Độ', LucideIcons.bookOpen),
                const SizedBox(width: 8),
                _buildTabPill(2, 'Gacha & Xã Hội', LucideIcons.sparkles),
              ],
            ),
          ),
          const Divider(height: 16),

          // Tab Body
          Expanded(
            child: _isLoading
                ? const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: AppColors.primary),
                        SizedBox(height: 12),
                        Text('Đang nạp kho dữ liệu...', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  )
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(LucideIcons.alertCircle, color: Colors.redAccent, size: 36),
                              const SizedBox(height: 10),
                              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _fetchStats,
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                child: const Text('Thử lại', style: TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _buildActiveTabContent(isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildTabPill(int index, String label, IconData icon) {
    final isSelected = _activeTab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _activeTab = index),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary
                : (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.grey.shade100),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: isSelected ? Colors.white : Colors.grey),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                    color: isSelected ? Colors.white : Colors.grey,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActiveTabContent(bool isDark) {
    if (_data == null) return const SizedBox.shrink();

    final userObj = _data!['user'] as Map<String, dynamic>? ?? {};
    final stats = userObj['stats'] as Map<String, dynamic>? ?? {};
    final inventory = (userObj['inventory'] as List<dynamic>? ?? []);
    final recentQuizzes = (_data!['recentQuizzes'] as List<dynamic>? ?? []);
    final totalCards = _data!['totalCards'] ?? 80;
    final uniqueCardsOwned = _data!['uniqueCardsOwned'] ?? 0;
    final totalAchievements = _data!['totalAchievements'] ?? 10;
    final userAchievements = (userObj['achievements'] as List<dynamic>? ?? []).length;
    final totalFriends = _data!['totalFriends'] ?? 0;
    final totalSpent = _data!['totalSpent'] ?? 0;

    switch (_activeTab) {
      case 0:
        return _buildOverviewTab(isDark, userObj, stats, recentQuizzes, totalAchievements, userAchievements);
      case 1:
        return _buildLearningTab(isDark, userObj, stats);
      case 2:
      default:
        return _buildGachaAndSocialTab(
          isDark,
          userObj,
          stats,
          inventory,
          totalCards,
          uniqueCardsOwned,
          totalFriends,
          totalSpent,
        );
    }
  }

  // TAB 1: TỔNG QUAN
  Widget _buildOverviewTab(
    bool isDark,
    Map<String, dynamic> userObj,
    Map<String, dynamic> stats,
    List<dynamic> recentQuizzes,
    int totalAchievements,
    int userAchievements,
  ) {
    final streak = userObj['currentStreak'] ?? 0;
    final highestStreak = userObj['highestStreak'] ?? 0;
    final totalStudySeconds = stats['totalStudySeconds'] ?? 0;
    final hours = totalStudySeconds ~/ 3600;
    final minutes = (totalStudySeconds % 3600) ~/ 60;
    final timeStr = hours > 0 ? '$hours giờ $minutes phút' : '$minutes phút';
    final totalVideosWatched = stats['totalVideoWatched'] ?? 0;

    final correctAnswers = stats['correctQuizAnswers'] ?? 0;
    final attempts = stats['totalQuizAttempts'] ?? 0;
    final totalQuestions = attempts > 0 ? attempts * 5 : correctAnswers;
    final accuracy = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).round() : 0;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      children: [
        // 4 Stat Cards
        Row(
          children: [
            Expanded(
              child: _buildStatBox(
                icon: LucideIcons.flame,
                color: Colors.orange,
                label: 'Chuỗi học',
                value: '$streak Ngày',
                sub: 'Kỷ lục: $highestStreak ngày',
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildStatBox(
                icon: LucideIcons.clock,
                color: Colors.blueAccent,
                label: 'Thời gian xem',
                value: timeStr,
                sub: '$totalVideosWatched video hoàn thành',
                isDark: isDark,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildStatBox(
                icon: LucideIcons.target,
                color: AppColors.success,
                label: 'Độ chính xác',
                value: '$accuracy%',
                sub: '$correctAnswers / $totalQuestions câu đúng',
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildStatBox(
                icon: LucideIcons.trophy,
                color: Colors.amber,
                label: 'Thành tựu',
                value: '$userAchievements',
                sub: 'Đạt $userAchievements/$totalAchievements huy hiệu',
                isDark: isDark,
              ),
            ),
          ],
        ),
        AppSpacing.gapV16,

        // Biểu đồ phong độ Quiz 10 bài gần nhất
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(LucideIcons.zap, color: Colors.blueAccent, size: 16),
                  SizedBox(width: 6),
                  Text(
                    'PHONG ĐỘ QUIZ GẦN NHẤT',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (recentQuizzes.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Text('Chưa có dữ liệu làm bài trắc nghiệm', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  ),
                )
              else
                SizedBox(
                  height: 130,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: recentQuizzes.map((q) {
                      final correct = q['correctCount'] ?? 0;
                      final totalQ = q['totalQuizzes'] ?? 1;
                      final pct = (correct / (totalQ > 0 ? totalQ : 1)).clamp(0.0, 1.0);

                      Color barColor = Colors.redAccent;
                      if (pct >= 0.8) {
                        barColor = AppColors.success;
                      } else if (pct >= 0.5) {
                        barColor = Colors.amber;
                      }

                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(
                                '$correct/$totalQ',
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                height: (75.0 * pct).toDouble(),
                                decoration: BoxDecoration(
                                  color: barColor,
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${(pct * 100).round()}%',
                                style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: barColor),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  // TAB 2: HỌC TẬP VÀ TIẾN ĐỘ
  Widget _buildLearningTab(bool isDark, Map<String, dynamic> userObj, Map<String, dynamic> stats) {
    final targetLang = (userObj['targetLanguage']?.toString() ?? 'EN').toUpperCase();
    final langLevel = userObj['languageLevel']?.toString() ?? 'Cơ bản';
    final completedVideos = stats['totalVideoWatched'] ?? 0;
    final freezeCount = (userObj['freezeUsage'] as List<dynamic>? ?? []).length;
    final learnedWords = stats['learnedWordsCount'] ?? 0;
    final dailyTasks = (userObj['dailyTasks'] as List<dynamic>? ?? []);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      children: [
        // Hồ sơ ngôn ngữ
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(LucideIcons.globe, color: Colors.blueAccent, size: 16),
                  SizedBox(width: 6),
                  Text('HỒ SƠ HỌC TẬP', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 12),
              _buildRowItem('Ngôn ngữ mục tiêu', targetLang, Colors.blueAccent),
              _buildRowItem('Trình độ hiện tại', langLevel, Colors.purpleAccent),
              _buildRowItem('Video đã học xong', '$completedVideos video', AppColors.success),
              _buildRowItem('Từ vựng đã tích lũy', '$learnedWords từ', Colors.orangeAccent),
              _buildRowItem('Thẻ giữ lửa đã dùng', '$freezeCount lần', Colors.cyan),
            ],
          ),
        ),
        AppSpacing.gapV16,

        // Nhiệm vụ hàng ngày
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(LucideIcons.listTodo, color: Colors.orangeAccent, size: 16),
                  SizedBox(width: 6),
                  Text('NHIỆM VỤ HÀNG NGÀY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 12),
              if (dailyTasks.isEmpty)
                const Text('Hôm nay chưa có nhiệm vụ nào được giao.', style: TextStyle(color: Colors.grey, fontSize: 12))
              else
                ...dailyTasks.map((t) {
                  final task = t['task'] as Map<String, dynamic>? ?? {};
                  final desc = task['taskDesc']?.toString() ?? 'Nhiệm vụ';
                  final current = t['current'] ?? 0;
                  final target = task['target'] ?? 1;
                  final progress = (current / (target > 0 ? target : 1)).clamp(0.0, 1.0);

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(desc, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                            Text('$current/$target', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 6,
                            backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation<Color>(progress >= 1.0 ? AppColors.success : Colors.orangeAccent),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      ],
    );
  }

  // TAB 3: GACHA & XÃ HỘI
  Widget _buildGachaAndSocialTab(
    bool isDark,
    Map<String, dynamic> userObj,
    Map<String, dynamic> stats,
    List<dynamic> inventory,
    int totalCards,
    int uniqueCardsOwned,
    int totalFriends,
    int totalSpent,
  ) {
    final stardust = userObj['stardust'] ?? 0;
    final totalGachaPulls = stats['totalGachaPulls'] ?? 0;
    final pityUR = userObj['pityUR'] ?? 0;
    final pitySSR = userObj['pitySSR'] ?? 0;
    final pitySR = userObj['pitySR'] ?? 0;

    final freeCoins = userObj['freeCoins'] ?? 0;
    final aiTokens = userObj['aiTokens'] ?? 0;
    final premiumCoins = userObj['premiumCoins'] ?? 0;
    final isPro = userObj['isPro'] == true;

    final messagesSent = stats['messagesSentCount'] ?? 0;
    final sharedCards = stats['sharedCardsCount'] ?? 0;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      children: [
        // Kho thẻ & Bụi sao
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(LucideIcons.sparkles, color: Colors.purpleAccent, size: 16),
                      SizedBox(width: 6),
                      Text('BỘ SƯU TẬP THẺ WIKI', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text('$stardust BỤI SAO', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w900, fontSize: 10)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildRowItem('Thẻ đã sở hữu', '$uniqueCardsOwned / $totalCards thẻ', Colors.purpleAccent),
              _buildRowItem('Tổng lượt quay Gacha', '$totalGachaPulls lượt', Colors.blueAccent),
              const SizedBox(height: 8),

              // Pity Bars
              const Text('Hệ thống bảo hiểm (Pity):', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
              const SizedBox(height: 6),
              _buildPityBar('Bảo hiểm UR (120)', pityUR, 120, Colors.redAccent, isDark),
              _buildPityBar('Bảo hiểm SSR (50)', pitySSR, 50, Colors.amber, isDark),
              _buildPityBar('Bảo hiểm SR (10)', pitySR, 10, Colors.purpleAccent, isDark),
            ],
          ),
        ),
        AppSpacing.gapV16,

        // Tài chính & Phúc lợi
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(LucideIcons.wallet, color: Colors.amber, size: 16),
                      SizedBox(width: 6),
                      Text('TÀI CHÍNH & VÍ', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isPro ? Colors.amber.withValues(alpha: 0.2) : Colors.blue.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isPro ? 'PREMIUM VIP' : 'MIỄN PHÍ',
                      style: TextStyle(
                        color: isPro ? Colors.amber : Colors.blueAccent,
                        fontWeight: FontWeight.w900,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildWalletPill('Xu Gacha', '$freeCoins', Colors.amber)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildWalletPill('Năng lượng AI', '$aiTokens⚡', Colors.blueAccent)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildWalletPill('Xu Nạp', '$premiumCoins💎', Colors.purpleAccent)),
                ],
              ),
              const SizedBox(height: 12),
              _buildRowItem('Tổng chi tiêu', '${totalSpent.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')} đ', Colors.amber),
            ],
          ),
        ),
        AppSpacing.gapV16,

        // Tương tác xã hội
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(LucideIcons.users, color: AppColors.success, size: 16),
                  const SizedBox(width: 6),
                  const Text('KẾT NỐI XÃ HỘI', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 12),
              _buildRowItem('Số lượng bạn bè', '$totalFriends bạn bè', AppColors.success),
              _buildRowItem('Tin nhắn đã gửi', '$messagesSent tin', Colors.blueAccent),
              _buildRowItem('Lượt tặng/share thẻ', '$sharedCards lần', Colors.orangeAccent),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatBox({
    required IconData icon,
    required Color color,
    required String label,
    required String value,
    required String sub,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: isDark ? Colors.white : const Color(0xFF0F172A)),
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 10, color: isDark ? Colors.white38 : Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  Widget _buildRowItem(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500)),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildWalletPill(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: color)),
        ],
      ),
    );
  }

  Widget _buildPityBar(String label, int current, int max, Color color, bool isDark) {
    final progress = (current / max).clamp(0.0, 1.0);
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
              Text('$current/$max', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
          const SizedBox(height: 3),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 4,
              backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}
