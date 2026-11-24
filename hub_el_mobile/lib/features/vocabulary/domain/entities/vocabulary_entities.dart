import 'package:equatable/equatable.dart';

/// Thẻ từ vựng trong kho từ điển cá nhân
class VocabularyItemEntity extends Equatable {
  final int id;
  final String word;
  final String meaning;
  final String? pronunciation;
  final String? pos;
  final String? englishDesc;
  final String? language;
  final int cardId;
  final String cardTitle;
  final String? rarity;
  final String? imageUrl;
  final DateTime? createdAt;

  const VocabularyItemEntity({
    required this.id,
    required this.word,
    required this.meaning,
    this.pronunciation,
    this.pos,
    this.englishDesc,
    this.language,
    required this.cardId,
    required this.cardTitle,
    this.rarity,
    this.imageUrl,
    this.createdAt,
  });

  /// Bóc tách phiên âm IPA ví dụ: [ˈhaɪkɪŋ]
  String get phonetic {
    if (pronunciation != null && pronunciation!.trim().isNotEmpty) {
      final p = pronunciation!.trim();
      return p.startsWith('[') ? p : '[$p]';
    }
    if (englishDesc != null && englishDesc!.isNotEmpty) {
      final match = RegExp(r'\[(.*?)\]').firstMatch(englishDesc!);
      if (match != null) {
        return match.group(0)!;
      }
    }
    return '';
  }

  /// Bóc tách cách đọc phụ trợ ví dụ: /hy-king/
  String get transcription {
    if (englishDesc != null && englishDesc!.isNotEmpty) {
      final match = RegExp(r'/(.*?)/').firstMatch(englishDesc!);
      if (match != null) {
        return match.group(0)!;
      }
    }
    return '';
  }

  /// Bóc tách giải nghĩa chi tiết tiếng Anh
  String get explanation {
    if (englishDesc == null || englishDesc!.isEmpty) return '';
    if (!englishDesc!.contains('\n')) return englishDesc!;
    final lines = englishDesc!.split('\n');
    return lines.sublist(1).join(' ').trim();
  }

  /// Tên chuẩn hóa của ngôn ngữ
  String get displayLanguage {
    final raw = (language ?? 'Tiếng Anh').trim();
    final lower = raw.toLowerCase();
    if (lower == 'en' || lower.contains('anh') || lower.contains('english')) {
      return 'Tiếng Anh';
    }
    if (lower == 'ja' || lower.contains('nhật') || lower.contains('japanese')) {
      return 'Tiếng Nhật';
    }
    if (lower == 'ko' || lower.contains('hàn') || lower.contains('korean')) {
      return 'Tiếng Hàn';
    }
    if (lower == 'zh' || lower.contains('trung') || lower.contains('chinese')) {
      return 'Tiếng Trung';
    }
    if (lower == 'fr' || lower.contains('pháp') || lower.contains('french')) {
      return 'Tiếng Pháp';
    }
    if (lower == 'de' || lower.contains('đức') || lower.contains('german')) {
      return 'Tiếng Đức';
    }
    return raw;
  }

  /// Mã BCP-47 phục vụ TTS (Text-to-Speech)
  String get ttsLanguageCode {
    switch (displayLanguage) {
      case 'Tiếng Nhật':
        return 'ja-JP';
      case 'Tiếng Hàn':
        return 'ko-KR';
      case 'Tiếng Trung':
        return 'zh-CN';
      case 'Tiếng Pháp':
        return 'fr-FR';
      case 'Tiếng Đức':
        return 'de-DE';
      case 'Tiếng Anh':
      default:
        return 'en-US';
    }
  }

  @override
  List<Object?> get props => [
        id,
        word,
        meaning,
        pronunciation,
        pos,
        englishDesc,
        language,
        cardId,
        cardTitle,
        rarity,
        imageUrl,
        createdAt,
      ];
}

/// Metadata phân trang từ vựng
class VocabularyPaginationEntity extends Equatable {
  final int total;
  final int page;
  final int limit;
  final int totalPages;
  final bool hasNextPage;
  final bool hasPrevPage;

  const VocabularyPaginationEntity({
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
    required this.hasNextPage,
    required this.hasPrevPage,
  });

  @override
  List<Object?> get props => [total, page, limit, totalPages, hasNextPage, hasPrevPage];
}

/// Dữ liệu danh sách từ vựng kèm phân trang
class VocabularyListResponseEntity extends Equatable {
  final List<VocabularyItemEntity> items;
  final VocabularyPaginationEntity pagination;

  const VocabularyListResponseEntity({
    required this.items,
    required this.pagination,
  });

  @override
  List<Object?> get props => [items, pagination];
}

/// Ngữ cảnh bài học của từ vựng trong thẻ Wiki
class VocabularyContextEntity extends Equatable {
  final int cardId;
  final String cardTitle;
  final String? rarity;
  final String targetWord;
  final String simplifiedText;
  final bool found;

  const VocabularyContextEntity({
    required this.cardId,
    required this.cardTitle,
    this.rarity,
    required this.targetWord,
    required this.simplifiedText,
    required this.found,
  });

  @override
  List<Object?> get props => [cardId, cardTitle, rarity, targetWord, simplifiedText, found];
}

/// Chi tiết đầy đủ từ vựng
class VocabularyDetailEntity extends VocabularyItemEntity {
  const VocabularyDetailEntity({
    required super.id,
    required super.word,
    required super.meaning,
    super.pronunciation,
    super.pos,
    super.englishDesc,
    super.language,
    required super.cardId,
    required super.cardTitle,
    super.rarity,
    super.imageUrl,
    super.createdAt,
  });
}

