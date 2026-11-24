import '../../domain/entities/video_progress_entity.dart';

class VideoProgressModel extends VideoProgressEntity {
  const VideoProgressModel({
    required super.videoId,
    super.lastWatched = 0,
    super.isCompleted = false,
    super.duration = 0,
    super.updatedAt,
  });

  factory VideoProgressModel.fromJson(Map<String, dynamic> json) {
    return VideoProgressModel(
      videoId: (json['videoId'] ?? '').toString(),
      lastWatched: json['lastWatched'] is num ? (json['lastWatched'] as num).toInt() : 0,
      isCompleted: json['isCompleted'] == true,
      duration: json['duration'] is num ? (json['duration'] as num).toInt() : 0,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'videoId': videoId,
      'lastWatched': lastWatched,
      'isCompleted': isCompleted,
      'duration': duration,
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

