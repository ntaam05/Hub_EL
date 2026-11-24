import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_progress_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_related_videos_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_video_detail_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_video_progress_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/sync_video_progress_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/mark_video_completed_usecase.dart';
import 'watch_event.dart';
import 'watch_state.dart';

class WatchBloc extends Bloc<WatchEvent, WatchState> {
  final GetVideoDetailUseCase getVideoDetailUseCase;
  final GetRelatedVideosUseCase getRelatedVideosUseCase;
  final GetVideoProgressUseCase getVideoProgressUseCase;
  final SyncVideoProgressUseCase syncVideoProgressUseCase;
  final MarkVideoCompletedUseCase markVideoCompletedUseCase;

  int _accumulatedWatchSeconds = 0;
  int _totalSessionWatchedSeconds = 0;
  bool _hasAutoCompleted = false;

  WatchBloc({
    required this.getVideoDetailUseCase,
    required this.getRelatedVideosUseCase,
    required this.getVideoProgressUseCase,
    required this.syncVideoProgressUseCase,
    required this.markVideoCompletedUseCase,
  }) : super(const WatchInitial()) {
    on<WatchInitRequested>(_onInitRequested);
    on<WatchPlayStateChanged>(_onPlayStateChanged);
    on<WatchPositionUpdated>(_onPositionUpdated);
    on<WatchProgressSyncRequested>(_onProgressSyncRequested);
    on<WatchDismissResumeBanner>(_onDismissResumeBanner);
    on<WatchMarkCompletedRequested>(_onMarkCompletedRequested);
  }

  Future<void> _onInitRequested(
    WatchInitRequested event,
    Emitter<WatchState> emit,
  ) async {
    emit(const WatchLoading());
    _accumulatedWatchSeconds = 0;
    _totalSessionWatchedSeconds = 0;
    _hasAutoCompleted = false;

    // 1. Kiểm tra video có bị Admin cấm không
    final detailRes = await getVideoDetailUseCase(event.video.videoId);
    bool isBanned = false;
    String? bannedReason;

    if (detailRes is ApiSuccess<VideoDetailEntity>) {
      isBanned = detailRes.data.isBanned;
      bannedReason = detailRes.data.bannedReason;
    }

    // 2. Lấy danh sách video liên quan
    final relatedRes = await getRelatedVideosUseCase(event.video.videoId);
    final List<VideoItemEntity> relatedVideos =
        relatedRes is ApiSuccess<List<VideoItemEntity>> ? relatedRes.data : <VideoItemEntity>[];

    // 3. Lấy tiến độ học tập đã lưu (Part B)
    VideoProgressEntity? savedProgress;
    bool isCompleted = false;
    bool showResumeBanner = false;

    final progressRes = await getVideoProgressUseCase(event.video.videoId);
    if (progressRes is ApiSuccess<VideoProgressEntity>) {
      savedProgress = progressRes.data;
      isCompleted = savedProgress.isCompleted;
      // Hiển thị banner tiếp tục học nếu đã xem hơn 5 giây và chưa kết thúc
      if (savedProgress.lastWatched > 5 && !isCompleted) {
        showResumeBanner = true;
      }
    }

    emit(WatchLoaded(
      video: event.video,
      isBanned: isBanned,
      bannedReason: bannedReason,
      relatedVideos: relatedVideos,
      isPlaying: false,
      savedProgress: savedProgress,
      currentPosition: savedProgress?.lastWatched ?? 0,
      totalDuration: savedProgress?.duration ?? event.video.duration,
      isCompleted: isCompleted,
      showResumeBanner: showResumeBanner,
    ));
  }

  void _onPlayStateChanged(
    WatchPlayStateChanged event,
    Emitter<WatchState> emit,
  ) {
    if (state is WatchLoaded) {
      emit((state as WatchLoaded).copyWith(isPlaying: event.isPlaying));
    }
  }

  void _onPositionUpdated(
    WatchPositionUpdated event,
    Emitter<WatchState> emit,
  ) {
    if (state is! WatchLoaded) return;
    final loaded = state as WatchLoaded;

    if (loaded.isPlaying) {
      _accumulatedWatchSeconds += 1;
      _totalSessionWatchedSeconds += 1;
    }

    // Tự động đánh dấu hoàn thành sau khi xem tích lũy >= 60 giây
    if (_totalSessionWatchedSeconds >= 60 && !loaded.isCompleted && !_hasAutoCompleted) {
      _hasAutoCompleted = true;
      add(const WatchMarkCompletedRequested());
    }

    emit(loaded.copyWith(
      currentPosition: event.positionSeconds,
      totalDuration: event.totalDurationSeconds > 0 ? event.totalDurationSeconds : loaded.totalDuration,
    ));
  }

  Future<void> _onProgressSyncRequested(
    WatchProgressSyncRequested event,
    Emitter<WatchState> emit,
  ) async {
    if (state is! WatchLoaded) return;
    final loaded = state as WatchLoaded;

    final secondsToSync = _accumulatedWatchSeconds;
    if (secondsToSync <= 0 && !event.forceComplete) return;

    _accumulatedWatchSeconds = 0; // Reset bộ đếm tích lũy

    final meta = {
      'title': loaded.video.title,
      'channelName': loaded.video.channelTitle,
      'thumbnail': loaded.video.thumbnailUrl,
      'duration': loaded.totalDuration,
    };

    final result = await syncVideoProgressUseCase(
      videoId: loaded.video.videoId,
      seconds: secondsToSync,
      lastWatchedSeconds: loaded.currentPosition,
      videoMeta: meta,
      markCompleted: event.forceComplete || loaded.isCompleted,
    );

    if (result is ApiSuccess<VideoProgressEntity>) {
      emit(loaded.copyWith(
        savedProgress: result.data,
        isCompleted: result.data.isCompleted,
      ));
    }
  }

  void _onDismissResumeBanner(
    WatchDismissResumeBanner event,
    Emitter<WatchState> emit,
  ) {
    if (state is WatchLoaded) {
      emit((state as WatchLoaded).copyWith(showResumeBanner: false));
    }
  }

  Future<void> _onMarkCompletedRequested(
    WatchMarkCompletedRequested event,
    Emitter<WatchState> emit,
  ) async {
    if (state is! WatchLoaded) return;
    final loaded = state as WatchLoaded;

    final result = await markVideoCompletedUseCase(loaded.video.videoId);
    if (result is ApiSuccess<bool> && result.data) {
      emit(loaded.copyWith(
        isCompleted: true,
        showResumeBanner: false,
      ));
    }
  }
}
