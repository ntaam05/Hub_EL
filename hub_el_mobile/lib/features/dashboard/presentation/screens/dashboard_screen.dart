import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../../../shared/widgets/error_state_widget.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../../shared/widgets/lucian_widgets.dart';
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return LucianMeteorBackground(
      child: Stack(
        children: [
        // Nội dung trang Dashboard
        BlocConsumer<DashboardBloc, DashboardState>(
          listener: (context, state) {
            if (state is DashboardRewardClaimed) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    '🎉 Hoàn thành nhiệm vụ! Nhận +${state.coinsDelta} Xu và +${state.xpDelta} EXP!',
                  ),
                  backgroundColor: AppColors.success,
                  behavior: SnackBarBehavior.floating,
                ),
              );
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
                    // Thẻ chào & chỉ số nhanh (khớp layout Web Row 1)
                    _buildUserHeroCard(context, isDark),
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
                    AppSpacing.gapV20,

                    // 2. Thẻ Nhiệm Vụ Hôm Nay
                    DailyTasksCard(
                      tasks: data.dailyTasks,
                      claimingTaskId: state.claimingTaskId,
                      onClaimReward: (taskId) {
                        context.read<DashboardBloc>().add(DashboardClaimTaskRequested(taskId));
                      },
                    ),
                    AppSpacing.gapV20,

                    // 3. Thẻ Video Yêu Thích
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
                    AppSpacing.gapV20,

                    // 4. Thẻ Dành Cho Bạn (Đề xuất)
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
                    AppSpacing.gapV20,

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
      ),
    );
  }

  Widget _buildUserHeroCard(BuildContext context, bool isDark) {
    final avatarProvider = safeGetImageProvider(widget.user.displayAvatar);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary,
                  border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  image: avatarProvider != null
                      ? DecorationImage(image: avatarProvider, fit: BoxFit.cover)
                      : null,
                ),
                child: avatarProvider == null
                    ? Center(
                        child: Text(
                          widget.user.displayName.isNotEmpty
                              ? widget.user.displayName.substring(0, 1).toUpperCase()
                              : 'U',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16),
                        ),
                      )
                    : null,
              ),
              AppSpacing.gapH12,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Xin chào, ${widget.user.displayName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Tiếp tục hành trình chinh phục tri thức của bạn',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

