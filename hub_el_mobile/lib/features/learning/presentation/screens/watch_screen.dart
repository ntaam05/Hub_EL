import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../../shared/widgets/lucian_widgets.dart';
import '../../../authentication/presentation/bloc/auth_bloc.dart';
import '../../../authentication/presentation/bloc/auth_event.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';
import '../bloc/watch/watch_bloc.dart';
import '../bloc/watch/watch_event.dart';
import '../bloc/watch/watch_state.dart';
import '../bloc/quiz/quiz_bloc.dart';
import '../bloc/quiz/quiz_event.dart';
import '../bloc/quiz/quiz_state.dart';
import '../widgets/ai_quiz_generator_card.dart';
import '../widgets/generated_quiz_view.dart';
import '../widgets/quiz_reward_dialog.dart';
import '../widgets/learning_progress_bar.dart';
import '../widgets/related_videos_section.dart';
import '../widgets/resume_playback_banner.dart';
import '../widgets/video_actions_row.dart';
import '../widgets/youtube_player_widget.dart';

class WatchScreen extends StatefulWidget {
  final VideoItemEntity video;

  const WatchScreen({super.key, required this.video});

  @override
  State<WatchScreen> createState() => _WatchScreenState();
}

class _WatchScreenState extends State<WatchScreen> {
  late VideoItemEntity _currentVideo;
  YoutubePlayerController? _playerController;
  Timer? _heartbeatTimer;
  bool _isFavorited = false;

  @override
  void initState() {
    super.initState();
    _currentVideo = widget.video;
    context.read<WatchBloc>().add(WatchInitRequested(_currentVideo));
    _checkFavoriteStatus();

    // Khởi tạo Heartbeat Sync định kỳ mỗi 15 giây (Part B)
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) {
        context.read<WatchBloc>().add(const WatchProgressSyncRequested());
      }
    });
  }

  Future<void> _checkFavoriteStatus() async {
    try {
      final dioClient = DioClient();
      final res = await dioClient.dio.get(ApiEndpoints.checkFavoriteVideo(_currentVideo.videoId));
      if (res.data != null && res.data['success'] == true) {
        if (mounted) {
          setState(() {
            _isFavorited = res.data['data']?['isFavorited'] == true;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _toggleFavorite() async {
    try {
      final dioClient = DioClient();
      final res = await dioClient.dio.post(
        ApiEndpoints.favoriteVideos,
        data: {
          'videoId': _currentVideo.videoId,
          'title': _currentVideo.title,
          'channelTitle': _currentVideo.channelTitle,
          'thumbnailUrl': _currentVideo.thumbnailUrl,
        },
      );
      if (res.data != null && res.data['success'] == true) {
        final favorited = res.data['data']?['isFavorited'] == true;
        if (mounted) {
          setState(() {
            _isFavorited = favorited;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(favorited ? 'Đã thêm vào Video yêu thích! ❤️' : 'Đã bỏ yêu thích!'),
              backgroundColor: favorited ? Colors.redAccent : Colors.grey.shade800,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (_) {}
  }

  void _switchVideo(VideoItemEntity newVideo) {
    // Lưu tiến độ video cũ trước khi chuyển
    context.read<WatchBloc>().add(const WatchProgressSyncRequested());
    context.read<QuizBloc>().add(const QuizResetRequested());

    setState(() {
      _currentVideo = newVideo;
      _isFavorited = false;
    });
    context.read<WatchBloc>().add(WatchInitRequested(newVideo));
    _checkFavoriteStatus();
  }

  @override
  void dispose() {
    _heartbeatTimer?.cancel();
    // Lưu tiến độ cuối cùng khi thoát màn hình
    context.read<WatchBloc>().add(const WatchProgressSyncRequested());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : AppColors.lightTextPrimary,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Phòng Học & Luyện Tập',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          LucianBookmarkButton(
            isBookmarked: _isFavorited,
            onToggle: _toggleFavorite,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: BlocConsumer<WatchBloc, WatchState>(
        listenWhen: (previous, current) =>
            current is WatchLoaded &&
            (current.rewardXp > 0 || current.rewardCoins > 0) &&
            (previous is! WatchLoaded ||
                (previous.rewardXp == 0 && previous.rewardCoins == 0)),
        listener: (context, state) {
          if (state is WatchLoaded &&
              (state.rewardXp > 0 || state.rewardCoins > 0)) {
            try {
              context.read<AuthBloc>().add(const AuthUserRefreshed());
            } catch (_) {}
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  '🎉 Hoàn thành 50% video! Nhận +${state.rewardCoins} Xu và +${state.rewardXp} EXP!',
                ),
                backgroundColor: AppColors.success,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is WatchLoading) {
            return const Center(child: LoadingWidget(message: 'Đang tải thông tin bài giảng...'));
          }

          if (state is WatchLoaded) {
            // Trường hợp 1: Video bị Quản trị viên cấm (ModeratedVideo BANNED)
            if (state.isBanned) {
              return _buildBannedOverlay(context, state.bannedReason);
            }

            // Trường hợp 2: Video hoạt động bình thường
            return ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                // 1. YouTube Player Widget Native (16:9)
                YoutubePlayerWidget(
                  key: ValueKey(_currentVideo.videoId),
                  videoId: _currentVideo.videoId,
                  onControllerCreated: (controller) {
                    _playerController = controller;
                  },
                  onPlayStateChanged: (isPlaying) {
                    context.read<WatchBloc>().add(WatchPlayStateChanged(isPlaying));
                  },
                  onProgressUpdated: (position, duration) {
                    context.read<WatchBloc>().add(
                          WatchPositionUpdated(
                            positionSeconds: position,
                            totalDurationSeconds: duration,
                          ),
                        );
                  },
                ),

                // 2. Banner tiếp tục xem (Resume Playback Banner - Part B)
                if (state.showResumeBanner && state.savedProgress != null)
                  ResumePlaybackBanner(
                    lastWatchedSeconds: state.savedProgress!.lastWatched,
                    onResume: () {
                      final targetSeconds = state.savedProgress!.lastWatched.toDouble();
                      _playerController?.seekTo(
                        seconds: targetSeconds,
                        allowSeekAhead: true,
                      );
                      context.read<WatchBloc>().add(const WatchDismissResumeBanner());
                    },
                    onRestart: () {
                      _playerController?.seekTo(
                        seconds: 0,
                        allowSeekAhead: true,
                      );
                      context.read<WatchBloc>().add(const WatchDismissResumeBanner());
                    },
                  ),

                // 3. Thanh hiển thị tiến độ học tập (mục tiêu 50% video)
                LearningProgressBar(
                  currentPositionSeconds: state.currentPosition,
                  totalDurationSeconds: state.totalDuration,
                  watchedSeconds: state.watchedSeconds,
                  isCompleted: state.isCompleted,
                ),
                AppSpacing.gapV16,

                // 4. Video Actions (Like, Report, Share) & Title / Channel
                VideoActionsRow(
                  video: _currentVideo,
                  isLiked: _isFavorited,
                  onLikeToggle: _toggleFavorite,
                ),
                AppSpacing.gapV20,

                // 5. Khung Tạo Bài Tập AI (Part C & D)
                AiQuizGeneratorCard(
                  videoId: _currentVideo.videoId,
                ),
                BlocConsumer<QuizBloc, QuizState>(
                  listenWhen: (previous, current) =>
                      current is QuizLoaded &&
                      current.showRewardModal &&
                      (previous is! QuizLoaded || !previous.showRewardModal),
                  listener: (context, quizState) {
                    if (quizState is QuizLoaded && quizState.showRewardModal && quizState.result != null) {
                      showDialog(
                        context: context,
                        barrierDismissible: false,
                        builder: (dialogCtx) => QuizRewardDialog(
                          earnedXP: quizState.result!.earnedXP,
                          earnedCoins: quizState.result!.earnedCoins,
                          onContinue: () {
                            Navigator.of(dialogCtx).pop();
                            context.read<QuizBloc>().add(const QuizDismissRewardModal());
                          },
                        ),
                      );
                    }
                  },
                  builder: (context, quizState) {
                    if (quizState is QuizLoaded) {
                      return GeneratedQuizView(
                        questions: quizState.questions,
                        totalCount: quizState.totalCount,
                        currentIndex: quizState.currentIndex,
                        difficultyLevel: quizState.difficultyLevel,
                        questionDifficulties: quizState.questionDifficulties,
                        isLoadingNext: quizState.isLoadingNext,
                        nextQuestionError: quizState.nextQuestionError,
                        userAnswers: quizState.userAnswers,
                        isSubmitted: quizState.isSubmitted,
                        isSubmitting: quizState.isSubmitting,
                        result: quizState.result,
                        onNextQuestion: () {
                          context.read<QuizBloc>().add(const QuizNextQuestionRequested());
                        },
                        onSubmit: () {
                          context.read<QuizBloc>().add(
                                QuizSubmitRequested(
                                  videoTitle: _currentVideo.title,
                                  channelName: _currentVideo.channelTitle,
                                ),
                              );
                        },
                        onRetry: () {
                          context.read<QuizBloc>().add(const QuizRetryRequested());
                        },
                        onReset: () {
                          context.read<QuizBloc>().add(const QuizResetRequested());
                        },
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                AppSpacing.gapV24,

                // 6. Video Đề Xuất Liên Quan
                RelatedVideosSection(
                  videos: state.relatedVideos,
                  onVideoTap: _switchVideo,
                ),
                const SizedBox(height: 48),
              ],
            );
          }

          return Center(
            child: ElevatedButton(
              onPressed: () => context.read<WatchBloc>().add(WatchInitRequested(_currentVideo)),
              child: const Text('Thử lại'),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBannedOverlay(BuildContext context, String? reason) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.redAccent.withValues(alpha: 0.5)),
            boxShadow: [
              BoxShadow(
                color: Colors.red.withValues(alpha: 0.1),
                blurRadius: 30,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.ban, color: Colors.redAccent, size: 36),
              ),
              AppSpacing.gapV16,
              const Text(
                'TRUY CẬP BỊ TỪ CHỐI',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                  color: Colors.redAccent,
                ),
              ),
              AppSpacing.gapV12,
              Text(
                reason ?? 'Video này đã bị Quản trị viên khóa do vi phạm nội quy học tập.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, height: 1.4, color: Colors.white70),
              ),
              AppSpacing.gapV24,
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(
                    'Đồng ý (Quay về Trang chủ)',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
