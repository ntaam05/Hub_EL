import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_progress_entity.dart';

abstract class WatchState {
  const WatchState();
}

class WatchInitial extends WatchState {
  const WatchInitial();
}

class WatchLoading extends WatchState {
  const WatchLoading();
}

class WatchLoaded extends WatchState {
  final VideoItemEntity video;
  final bool isBanned;
  final String? bannedReason;
  final List<VideoItemEntity> relatedVideos;
  final bool isPlaying;
  final VideoProgressEntity? savedProgress;
  final int currentPosition;
  final int totalDuration;
  final int watchedSeconds;
  final int rewardXp;
  final int rewardCoins;
  final bool isCompleted;
  final bool showResumeBanner;
  final bool isSyncing;

  const WatchLoaded({
    required this.video,
    this.isBanned = false,
    this.bannedReason,
    this.relatedVideos = const [],
    this.isPlaying = false,
    this.savedProgress,
    this.currentPosition = 0,
    this.totalDuration = 0,
    this.watchedSeconds = 0,
    this.rewardXp = 0,
    this.rewardCoins = 0,
    this.isCompleted = false,
    this.showResumeBanner = false,
    this.isSyncing = false,
  });

  double get progressPercent {
    if (totalDuration <= 0) return 0.0;
    return (currentPosition / totalDuration).clamp(0.0, 1.0);
  }

  WatchLoaded copyWith({
    VideoItemEntity? video,
    bool? isBanned,
    String? bannedReason,
    List<VideoItemEntity>? relatedVideos,
    bool? isPlaying,
    VideoProgressEntity? savedProgress,
    int? currentPosition,
    int? totalDuration,
    int? watchedSeconds,
    int? rewardXp,
    int? rewardCoins,
    bool? isCompleted,
    bool? showResumeBanner,
    bool? isSyncing,
  }) {
    return WatchLoaded(
      video: video ?? this.video,
      isBanned: isBanned ?? this.isBanned,
      bannedReason: bannedReason ?? this.bannedReason,
      relatedVideos: relatedVideos ?? this.relatedVideos,
      isPlaying: isPlaying ?? this.isPlaying,
      savedProgress: savedProgress ?? this.savedProgress,
      currentPosition: currentPosition ?? this.currentPosition,
      totalDuration: totalDuration ?? this.totalDuration,
      watchedSeconds: watchedSeconds ?? this.watchedSeconds,
      rewardXp: rewardXp ?? this.rewardXp,
      rewardCoins: rewardCoins ?? this.rewardCoins,
      isCompleted: isCompleted ?? this.isCompleted,
      showResumeBanner: showResumeBanner ?? this.showResumeBanner,
      isSyncing: isSyncing ?? this.isSyncing,
    );
  }
}

class WatchFailure extends WatchState {
  final String message;

  const WatchFailure({required this.message});
}
