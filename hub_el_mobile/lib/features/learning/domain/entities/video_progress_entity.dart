class VideoProgressEntity {
  final String videoId;
  final int lastWatched;
  final bool isCompleted;
  final int duration;
  final DateTime? updatedAt;

  const VideoProgressEntity({
    required this.videoId,
    this.lastWatched = 0,
    this.isCompleted = false,
    this.duration = 0,
    this.updatedAt,
  });

  double get progressPercent {
    if (duration <= 0) return 0.0;
    final percent = lastWatched / duration;
    return percent.clamp(0.0, 1.0);
  }

  String get formattedLastWatched => formatSeconds(lastWatched);
  String get formattedDuration => formatSeconds(duration);

  static String formatSeconds(int totalSeconds) {
    if (totalSeconds <= 0) return '00:00';
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final seconds = totalSeconds % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  VideoProgressEntity copyWith({
    String? videoId,
    int? lastWatched,
    bool? isCompleted,
    int? duration,
    DateTime? updatedAt,
  }) {
    return VideoProgressEntity(
      videoId: videoId ?? this.videoId,
      lastWatched: lastWatched ?? this.lastWatched,
      isCompleted: isCompleted ?? this.isCompleted,
      duration: duration ?? this.duration,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
