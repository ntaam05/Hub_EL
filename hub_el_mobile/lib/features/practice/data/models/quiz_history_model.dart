import 'dart:convert';

class QuizHistoryModel {
  final int id;
  final String userId;
  final dynamic videoId;
  final int score;
  final int correctCount;
  final int totalQuizzes;
  final DateTime createdAt;
  final String? videoTitle;
  final String? channelName;
  final String? thumbnailUrl;
  final String? youtubeUrl;
  final List<dynamic> questions;

  QuizHistoryModel({
    required this.id,
    required this.userId,
    required this.videoId,
    required this.score,
    required this.correctCount,
    required this.totalQuizzes,
    required this.createdAt,
    this.videoTitle,
    this.channelName,
    this.thumbnailUrl,
    this.youtubeUrl,
    this.questions = const [],
  });

  factory QuizHistoryModel.fromJson(Map<String, dynamic> json) {
    List<dynamic> parsedQuestions = [];
    final qData = json['questionsData'];
    if (qData != null) {
      if (qData is List) {
        parsedQuestions = qData;
      } else if (qData is String && qData.isNotEmpty && qData != 'null') {
        try {
          final decoded = jsonDecode(qData);
          if (decoded is List) {
            parsedQuestions = decoded;
          }
        } catch (_) {}
      }
    }

    final videoObj = json['video'] is Map<String, dynamic> ? json['video'] : null;
    final ytUrl = videoObj?['youtubeUrl']?.toString() ?? json['videoId']?.toString() ?? '';
    final thumb = videoObj?['thumbnail']?.toString() ??
        (ytUrl.isNotEmpty ? 'https://img.youtube.com/vi/$ytUrl/mqdefault.jpg' : '');

    return QuizHistoryModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['userId']?.toString() ?? '',
      videoId: json['videoId'],
      score: json['score'] is int ? json['score'] : int.tryParse(json['score'].toString()) ?? 0,
      correctCount: json['correctCount'] is int
          ? json['correctCount']
          : int.tryParse(json['correctCount'].toString()) ?? 0,
      totalQuizzes: json['totalQuizzes'] is int
          ? json['totalQuizzes']
          : int.tryParse(json['totalQuizzes'].toString()) ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      videoTitle: videoObj?['title']?.toString() ?? 'Bài tập trắc nghiệm',
      channelName: videoObj?['channelName']?.toString() ?? 'Kênh học tập',
      thumbnailUrl: thumb,
      youtubeUrl: ytUrl,
      questions: parsedQuestions,
    );
  }
}

