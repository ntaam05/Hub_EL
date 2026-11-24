class CoursePlaylistModel {
  final int id;
  final String userId;
  final String playlistId;
  final String title;
  final String? channelTitle;
  final String? thumbnailUrl;
  final int totalVideos;
  final String videoIds;
  final int videoScore;
  final int summaryScore;
  final int finalScore;
  final String grade;
  final bool isCompleted;

  CoursePlaylistModel({
    required this.id,
    required this.userId,
    required this.playlistId,
    required this.title,
    this.channelTitle,
    this.thumbnailUrl,
    required this.totalVideos,
    required this.videoIds,
    required this.videoScore,
    required this.summaryScore,
    required this.finalScore,
    required this.grade,
    required this.isCompleted,
  });

  factory CoursePlaylistModel.fromJson(Map<String, dynamic> json) {
    return CoursePlaylistModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['userId']?.toString() ?? '',
      playlistId: json['playlistId']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Khóa học',
      channelTitle: json['channelTitle']?.toString() ?? 'Kênh đào tạo',
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      totalVideos: json['totalVideos'] is int ? json['totalVideos'] : int.tryParse(json['totalVideos'].toString()) ?? 1,
      videoIds: json['videoIds']?.toString() ?? '',
      videoScore: json['videoScore'] is int ? json['videoScore'] : int.tryParse(json['videoScore'].toString()) ?? 0,
      summaryScore: json['summaryScore'] is int ? json['summaryScore'] : int.tryParse(json['summaryScore'].toString()) ?? 0,
      finalScore: json['finalScore'] is int ? json['finalScore'] : int.tryParse(json['finalScore'].toString()) ?? 0,
      grade: json['grade']?.toString() ?? 'Chưa đạt',
      isCompleted: json['isCompleted'] == true,
    );
  }
}

