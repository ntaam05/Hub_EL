class VideoItemEntity {
  final String videoId;
  final String title;
  final String channelTitle;
  final String thumbnailUrl;
  final int duration;
  final bool isPlaylist;
  final String type;

  const VideoItemEntity({
    required this.videoId,
    required this.title,
    required this.channelTitle,
    required this.thumbnailUrl,
    this.duration = 0,
    this.isPlaylist = false,
    this.type = 'video',
  });

  /// Tạo link YouTube chuẩn
  String get youtubeUrl => 'https://www.youtube.com/watch?v=$videoId';
}

class VideoSearchResultEntity {
  final List<VideoItemEntity> items;
  final String? nextPageToken;

  const VideoSearchResultEntity({
    required this.items,
    this.nextPageToken,
  });
}

class VideoDetailEntity {
  final String videoId;
  final bool isBanned;
  final String? bannedReason;

  const VideoDetailEntity({
    required this.videoId,
    required this.isBanned,
    this.bannedReason,
  });
}

