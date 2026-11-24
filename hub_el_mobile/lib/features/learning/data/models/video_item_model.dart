import '../../domain/entities/video_item_entity.dart';

class VideoItemModel extends VideoItemEntity {
  const VideoItemModel({
    required super.videoId,
    required super.title,
    required super.channelTitle,
    required super.thumbnailUrl,
    super.duration = 0,
    super.isPlaylist = false,
    super.type = 'video',
  });

  static String _cleanHtmlEntities(String text) {
    return text
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&oacute;', 'ó')
        .replaceAll('&aacute;', 'á')
        .replaceAll('&eacute;', 'é')
        .replaceAll('&iacute;', 'í')
        .replaceAll('&uacute;', 'ú');
  }

  factory VideoItemModel.fromJson(Map<String, dynamic> json) {
    // Xử lý các biến thể key từ YouTube API hoặc backend
    final rawId = json['videoId'] ?? json['id'] ?? '';
    final videoId = rawId is Map ? (rawId['videoId'] ?? '') : rawId.toString();

    final title = _cleanHtmlEntities(
      (json['title'] ?? json['snippet']?['title'] ?? 'Video bài giảng').toString(),
    );

    final channelTitle = (json['channelTitle'] ?? json['channelName'] ?? json['snippet']?['channelTitle'] ?? 'Kênh ẩn danh')
        .toString();

    String thumbnailUrl = '';
    if (json['thumbnailUrl'] != null) {
      thumbnailUrl = json['thumbnailUrl'].toString();
    } else if (json['thumbnail'] != null) {
      thumbnailUrl = json['thumbnail'].toString();
    } else if (json['snippet']?['thumbnails']?['high']?['url'] != null) {
      thumbnailUrl = json['snippet']['thumbnails']['high']['url'].toString();
    } else if (videoId.isNotEmpty) {
      thumbnailUrl = 'https://img.youtube.com/vi/$videoId/hqdefault.jpg';
    }

    final type = (json['type'] ?? 'video').toString();
    final isPlaylist = type == 'playlist' || json['isPlaylist'] == true;
    final duration = json['duration'] is int ? json['duration'] as int : 0;

    return VideoItemModel(
      videoId: videoId,
      title: title,
      channelTitle: channelTitle,
      thumbnailUrl: thumbnailUrl,
      duration: duration,
      isPlaylist: isPlaylist,
      type: type,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'videoId': videoId,
      'title': title,
      'channelTitle': channelTitle,
      'thumbnailUrl': thumbnailUrl,
      'duration': duration,
      'isPlaylist': isPlaylist,
      'type': type,
    };
  }
}

class VideoSearchResultModel extends VideoSearchResultEntity {
  const VideoSearchResultModel({
    required super.items,
    super.nextPageToken,
  });

  factory VideoSearchResultModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] ?? json['videos'] ?? [];
    final items = (rawItems as List<dynamic>?)
            ?.map((e) => VideoItemModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final nextPageToken = json['nextPageToken']?.toString();

    return VideoSearchResultModel(
      items: items,
      nextPageToken: nextPageToken,
    );
  }
}

class VideoDetailModel extends VideoDetailEntity {
  const VideoDetailModel({
    required super.videoId,
    required super.isBanned,
    super.bannedReason,
  });

  factory VideoDetailModel.fromJson(Map<String, dynamic> json) {
    return VideoDetailModel(
      videoId: (json['videoId'] ?? '').toString(),
      isBanned: json['isBanned'] == true,
      bannedReason: json['bannedReason']?.toString(),
    );
  }
}
