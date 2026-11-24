import 'dart:convert';
import '../../domain/entities/quiz_result_entity.dart';

class QuizResultModel extends QuizResultEntity {
  const QuizResultModel({
    required super.score,
    required super.correctCount,
    required super.totalQuizzes,
    required super.earnedXP,
    required super.earnedCoins,
  });

  factory QuizResultModel.fromJson(Map<String, dynamic> json) {
    // Xử lý cả trường hợp response lồng data hoặc json trực tiếp
    final Map<String, dynamic> map = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : (json['data'] is String
            ? (tryDecodeJson(json['data'] as String) ?? json)
            : json);

    return QuizResultModel(
      score: _parseInt(map['score']),
      correctCount: _parseInt(map['correctCount'] ?? map['score']),
      totalQuizzes: _parseInt(map['totalQuizzes'] ?? map['total']),
      earnedXP: _parseInt(map['earnedXP'] ?? map['xp']),
      earnedCoins: _parseInt(map['earnedCoins'] ?? map['coins']),
    );
  }

  static int _parseInt(dynamic val) {
    if (val is int) return val;
    if (val is num) return val.toInt();
    if (val is String) return int.tryParse(val) ?? 0;
    return 0;
  }

  static Map<String, dynamic>? tryDecodeJson(String str) {
    try {
      final decoded = jsonDecode(str);
      if (decoded is Map<String, dynamic>) return decoded;
    } catch (_) {}
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'score': score,
      'correctCount': correctCount,
      'totalQuizzes': totalQuizzes,
      'earnedXP': earnedXP,
      'earnedCoins': earnedCoins,
    };
  }
}

