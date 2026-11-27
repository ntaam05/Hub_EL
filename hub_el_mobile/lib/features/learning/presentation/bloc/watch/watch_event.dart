import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';

abstract class WatchEvent {
  const WatchEvent();
}

class WatchInitRequested extends WatchEvent {
  final VideoItemEntity video;

  const WatchInitRequested(this.video);
}

class WatchPlayStateChanged extends WatchEvent {
  final bool isPlaying;

  const WatchPlayStateChanged(this.isPlaying);
}

class WatchPositionUpdated extends WatchEvent {
  final int positionSeconds;
  final int totalDurationSeconds;

  const WatchPositionUpdated({
    required this.positionSeconds,
    required this.totalDurationSeconds,
  });
}

class WatchProgressSyncRequested extends WatchEvent {
  final bool forceComplete;

  const WatchProgressSyncRequested({this.forceComplete = false});
}

class WatchDismissResumeBanner extends WatchEvent {
  const WatchDismissResumeBanner();
}

class WatchMarkCompletedRequested extends WatchEvent {
  const WatchMarkCompletedRequested();
}

class WatchSecondTicked extends WatchEvent {
  const WatchSecondTicked();
}
