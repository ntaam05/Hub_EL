import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/error_state_widget.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../authentication/domain/entities/user_entity.dart';
import '../../../learning/domain/entities/video_item_entity.dart';
import '../../../learning/presentation/screens/watch_screen.dart';
import '../bloc/dashboard_bloc.dart';
import '../bloc/dashboard_event.dart';
import '../bloc/dashboard_state.dart';
import '../widgets/continue_learning_card.dart';
import '../widgets/daily_tasks_card.dart';
import '../widgets/favorite_videos_card.dart';
import '../widgets/recent_activities_card.dart';
import '../widgets/recommended_videos_card.dart';

class DashboardScreen extends StatefulWidget {
  final UserEntity user;

  const DashboardScreen({super.key, required this.user});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    context.read<DashboardBloc>().add(const DashboardFetchRequested());
  }

  void _showRewardSuccessDialog(BuildContext context, int xp, int coins) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [Color(0xFFFACC15), Color(0xFFEA580C)]),
              ),
              child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 32),
            ),
            AppSpacing.gapV16,
            const Text(
              'NHẬN THƯỞNG THÀNH CÔNG! 🎉',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white),
            ),
            AppSpacing.gapV12,
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (xp > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.3)),
                    ),
                    child: Text('+$xp XP', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blueAccent)),
                  ),
                if (xp > 0 && coins > 0) const SizedBox(width: 8),
                if (coins > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.amberAccent.withValues(alpha: 0.3)),
                    ),
                    child: Text('+$coins Xu', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amberAccent)),
                  ),
              ],
            ),
            AppSpacing.gapV20,
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Tuyệt vời', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      children: [
        // Hiệu ứng ánh sáng nền vũ trụ mờ ảo ở đỉnh (Ambient Glow)
        Positioned(
          top: -80,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: isDark ? 0.15 : 0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ),

        // Nội dung trang Dashboard
        BlocConsumer<DashboardBloc, DashboardState>(
          listener: (context, state) {
            if (state is DashboardRewardClaimed) {
              _showRewardSuccessDialog(context, state.xpDelta, state.coinsDelta);
            }
          },
          builder: (context, state) {
            if (state is DashboardLoading) {
              return const Center(child: LoadingWidget(message: 'Đang tải thông tin Dashboard...'));
            }

            if (state is DashboardFailure) {
              return Center(
                child: ErrorStateWidget(
                  message: state.message,
                  onRetry: () => context.read<DashboardBloc>().add(const DashboardFetchRequested()),
                ),
              );
            }

            if (state is DashboardLoaded) {
              final data = state.data;

              return RefreshIndicator(
                onRefresh: () async {
                  context.read<DashboardBloc>().add(const DashboardFetchRequested(isRefresh: true));
                },
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(left: 16, right: 16, top: 20, bottom: 96),
                  children: [
                    // Tiêu đề Chào mừng
                    RichText(
                      text: TextSpan(
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                          color: isDark ? Colors.white : AppColors.lightTextPrimary,
                        ),
                        children: [
                          const TextSpan(text: 'Chào mừng trở lại, '),
                          TextSpan(
                            text: '${widget.user.displayName}! 👋',
                            style: const TextStyle(color: AppColors.primaryLight),
                          ),
                        ],
                      ),
                    ),
                    AppSpacing.gapV20,

                    // 1. Thẻ Tiếp Tục Học
                    ContinueLearningCard(
                      continueLearning: data.continueLearning,
                      onStartLearning: () {
                        if (data.continueLearning != null) {
                          final item = data.continueLearning!;
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => WatchScreen(
                                video: VideoItemEntity(
                                  videoId: item.videoId,
                                  title: item.title,
                                  channelTitle: item.course,
                                  thumbnailUrl: item.thumbnailUrl,
                                ),
                              ),
                            ),
                          );
                        }
                      },
                    ),
                    AppSpacing.gapV24,

                    // 2. Thẻ Nhiệm Vụ Hôm Nay
                    DailyTasksCard(
                      tasks: data.dailyTasks,
                      claimingTaskId: state.claimingTaskId,
                      onClaimReward: (taskId) {
                        context.read<DashboardBloc>().add(DashboardClaimTaskRequested(taskId));
                      },
                    ),
                    AppSpacing.gapV24,

                    // 3. Thẻ Dành Cho Bạn (Đề xuất)
                    RecommendedVideosCard(
                      videos: data.recommendedVideos,
                      onVideoTap: (vid) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => WatchScreen(
                              video: VideoItemEntity(
                                videoId: vid.videoId,
                                title: vid.title,
                                channelTitle: vid.channelTitle,
                                thumbnailUrl: vid.thumbnailUrl,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    AppSpacing.gapV24,

                    // 4. Thẻ Video Yêu Thích
                    FavoriteVideosCard(
                      videos: data.favoriteVideos,
                      onVideoTap: (vid) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => WatchScreen(
                              video: VideoItemEntity(
                                videoId: vid.videoId,
                                title: vid.title,
                                channelTitle: vid.channelTitle,
                                thumbnailUrl: vid.thumbnailUrl,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    AppSpacing.gapV24,

                    // 5. Thẻ Hoạt Động Gần Đây
                    RecentActivitiesCard(activities: data.recentActivities),
                  ],
                ),
              );
            }

            return const SizedBox.shrink();
          },
        ),
      ],
    );
  }
}

