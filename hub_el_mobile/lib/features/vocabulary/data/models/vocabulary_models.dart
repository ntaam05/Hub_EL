import '../../domain/entities/vocabulary_entities.dart';

class VocabularyItemModel extends VocabularyItemEntity {
  const VocabularyItemModel({
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

  factory VocabularyItemModel.fromJson(Map<String, dynamic> json) {
    return VocabularyItemModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      word: json['word']?.toString() ?? '',
      meaning: json['meaning']?.toString() ?? '',
      pronunciation: json['pronunciation']?.toString(),
      pos: json['pos']?.toString(),
      englishDesc: json['englishDesc']?.toString(),
      language: json['language']?.toString(),
      cardId: json['cardId'] is int
          ? json['cardId'] as int
          : int.tryParse(json['cardId']?.toString() ?? '0') ?? 0,
      cardTitle: json['cardTitle']?.toString() ?? '',
      rarity: json['rarity']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'word': word,
      'meaning': meaning,
      'pronunciation': pronunciation,
      'pos': pos,
      'englishDesc': englishDesc,
      'language': language,
      'cardId': cardId,
      'cardTitle': cardTitle,
      'rarity': rarity,
      'imageUrl': imageUrl,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

class VocabularyPaginationModel extends VocabularyPaginationEntity {
  const VocabularyPaginationModel({
    required super.total,
    required super.page,
    required super.limit,
    required super.totalPages,
    required super.hasNextPage,
    required super.hasPrevPage,
  });

  factory VocabularyPaginationModel.fromJson(Map<String, dynamic> json) {
    return VocabularyPaginationModel(
      total: json['total'] is int ? json['total'] as int : int.tryParse(json['total']?.toString() ?? '0') ?? 0,
      page: json['page'] is int ? json['page'] as int : int.tryParse(json['page']?.toString() ?? '1') ?? 1,
      limit: json['limit'] is int ? json['limit'] as int : int.tryParse(json['limit']?.toString() ?? '50') ?? 50,
      totalPages: json['totalPages'] is int
          ? json['totalPages'] as int
          : int.tryParse(json['totalPages']?.toString() ?? '1') ?? 1,
      hasNextPage: json['hasNextPage'] == true,
      hasPrevPage: json['hasPrevPage'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'page': page,
      'limit': limit,
      'totalPages': totalPages,
      'hasNextPage': hasNextPage,
      'hasPrevPage': hasPrevPage,
    };
  }
}

class VocabularyListResponseModel extends VocabularyListResponseEntity {
  const VocabularyListResponseModel({
    required super.items,
    required super.pagination,
  });

  factory VocabularyListResponseModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    final items = rawItems
        .map((e) => VocabularyItemModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final paginationMap = json['pagination'] as Map<String, dynamic>? ?? {};
    final pagination = VocabularyPaginationModel.fromJson(paginationMap);

    return VocabularyListResponseModel(
      items: items,
      pagination: pagination,
    );
  }
}

class VocabularyContextModel extends VocabularyContextEntity {
  const VocabularyContextModel({
    required super.cardId,
    required super.cardTitle,
    super.rarity,
    required super.targetWord,
    required super.simplifiedText,
    required super.found,
  });

  factory VocabularyContextModel.fromJson(Map<String, dynamic> json) {
    return VocabularyContextModel(
      cardId: json['cardId'] is int
          ? json['cardId'] as int
          : int.tryParse(json['cardId']?.toString() ?? '0') ?? 0,
      cardTitle: json['cardTitle']?.toString() ?? '',
      rarity: json['rarity']?.toString(),
      targetWord: json['targetWord']?.toString() ?? '',
      simplifiedText: json['simplifiedText']?.toString() ?? '',
      found: json['found'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cardId': cardId,
      'cardTitle': cardTitle,
      'rarity': rarity,
      'targetWord': targetWord,
      'simplifiedText': simplifiedText,
      'found': found,
    };
  }
}

class VocabularyDetailModel extends VocabularyDetailEntity {
  const VocabularyDetailModel({
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

  factory VocabularyDetailModel.fromJson(Map<String, dynamic> json) {
    return VocabularyDetailModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      word: json['word']?.toString() ?? '',
      meaning: json['meaning']?.toString() ?? '',
      pronunciation: json['pronunciation']?.toString(),
      pos: json['pos']?.toString(),
      englishDesc: json['englishDesc']?.toString(),
      language: json['language']?.toString(),
      cardId: json['cardId'] is int
          ? json['cardId'] as int
          : int.tryParse(json['cardId']?.toString() ?? '0') ?? 0,
      cardTitle: json['cardTitle']?.toString() ?? '',
      rarity: json['rarity']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

