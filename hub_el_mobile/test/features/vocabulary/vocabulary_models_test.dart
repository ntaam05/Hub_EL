import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/vocabulary/data/datasources/vocabulary_remote_data_source.dart';
import 'package:hub_el_mobile/features/vocabulary/data/models/vocabulary_models.dart';
import 'package:hub_el_mobile/features/vocabulary/data/repositories/vocabulary_repository_impl.dart';
import 'package:hub_el_mobile/features/vocabulary/domain/entities/vocabulary_entities.dart';
import 'package:hub_el_mobile/features/vocabulary/domain/usecases/vocabulary_usecases.dart';

class MockVocabularyRemoteDataSource implements IVocabularyRemoteDataSource {
  ApiResult<VocabularyListResponseModel>? mockListResult;
  ApiResult<VocabularyDetailModel>? mockDetailResult;
  ApiResult<VocabularyContextModel>? mockContextResult;

  @override
  Future<ApiResult<VocabularyListResponseModel>> getVocabularyList({
    String? search,
    String? language,
    String? sort,
    int? page,
    int? limit,
  }) async {
    return mockListResult ??
        const ApiFailure(message: 'Default list failure', statusCode: 500);
  }

  @override
  Future<ApiResult<VocabularyDetailModel>> getVocabularyDetail(int id) async {
    return mockDetailResult ??
        const ApiFailure(message: 'Default detail failure', statusCode: 500);
  }

  @override
  Future<ApiResult<VocabularyContextModel>> getVocabularyContext(
      int cardId, String targetWord) async {
    return mockContextResult ??
        const ApiFailure(message: 'Default context failure', statusCode: 500);
  }
}

void main() {
  group('Vocabulary Models & Entity Unit Tests', () {
    final sampleItemJson = {
      'id': 7,
      'word': 'hiking',
      'meaning': 'Đi bộ đường dài',
      'pronunciation': '[ˈhaɪkɪŋ]',
      'pos': 'N',
      'englishDesc':
          '[ˈhaɪkɪŋ]-/hy-king/\nThe activity of walking long distances in the countryside.',
      'language': 'Tiếng Anh',
      'cardId': 1,
      'cardTitle': 'Tsakkar Mountain',
      'rarity': 'RARE',
      'imageUrl': 'https://example.com/card.png',
      'createdAt': '2026-11-20T10:00:00.000Z',
    };

    test('VocabularyItemModel parses from JSON correctly', () {
      final model = VocabularyItemModel.fromJson(sampleItemJson);

      expect(model.id, 7);
      expect(model.word, 'hiking');
      expect(model.meaning, 'Đi bộ đường dài');
      expect(model.pronunciation, '[ˈhaɪkɪŋ]');
      expect(model.pos, 'N');
      expect(model.cardId, 1);
      expect(model.cardTitle, 'Tsakkar Mountain');
      expect(model.rarity, 'RARE');
      expect(model.imageUrl, 'https://example.com/card.png');
      expect(model.createdAt, isNotNull);
    });

    test('VocabularyItemModel converts to JSON correctly', () {
      final model = VocabularyItemModel.fromJson(sampleItemJson);
      final json = model.toJson();

      expect(json['id'], 7);
      expect(json['word'], 'hiking');
      expect(json['meaning'], 'Đi bộ đường dài');
      expect(json['cardTitle'], 'Tsakkar Mountain');
    });

    test('VocabularyItemEntity getters parse phonetic, transcription, and explanation', () {
      final item = VocabularyItemModel.fromJson(sampleItemJson);

      expect(item.phonetic, '[ˈhaɪkɪŋ]');
      expect(item.transcription, '/hy-king/');
      expect(item.explanation,
          'The activity of walking long distances in the countryside.');
    });

    test('VocabularyItemEntity maps TTS language codes accurately', () {
      const enItem = VocabularyItemEntity(
        id: 1,
        word: 'apple',
        meaning: 'quả táo',
        cardId: 1,
        cardTitle: 'Fruit',
        language: 'Tiếng Anh',
      );
      expect(enItem.ttsLanguageCode, 'en-US');

      const jaItem = VocabularyItemEntity(
        id: 2,
        word: 'りんご',
        meaning: 'quả táo',
        cardId: 1,
        cardTitle: 'Fruit',
        language: 'Tiếng Nhật',
      );
      expect(jaItem.ttsLanguageCode, 'ja-JP');

      const koItem = VocabularyItemEntity(
        id: 3,
        word: '사과',
        meaning: 'quả táo',
        cardId: 1,
        cardTitle: 'Fruit',
        language: 'Tiếng Hàn',
      );
      expect(koItem.ttsLanguageCode, 'ko-KR');

      const zhItem = VocabularyItemEntity(
        id: 4,
        word: '苹果',
        meaning: 'quả táo',
        cardId: 1,
        cardTitle: 'Fruit',
        language: 'Tiếng Trung',
      );
      expect(zhItem.ttsLanguageCode, 'zh-CN');

      const frItem = VocabularyItemEntity(
        id: 5,
        word: 'pomme',
        meaning: 'quả táo',
        cardId: 1,
        cardTitle: 'Fruit',
        language: 'Tiếng Pháp',
      );
      expect(frItem.ttsLanguageCode, 'fr-FR');

      const deItem = VocabularyItemEntity(
        id: 6,
        word: 'Apfel',
        meaning: 'quả táo',
        cardId: 1,
        cardTitle: 'Fruit',
        language: 'Tiếng Đức',
      );
      expect(deItem.ttsLanguageCode, 'de-DE');
    });

    test('VocabularyPaginationModel parses from JSON correctly', () {
      final json = {
        'total': 32,
        'page': 1,
        'limit': 50,
        'totalPages': 1,
        'hasNextPage': false,
        'hasPrevPage': false,
      };

      final pagination = VocabularyPaginationModel.fromJson(json);

      expect(pagination.total, 32);
      expect(pagination.page, 1);
      expect(pagination.limit, 50);
      expect(pagination.totalPages, 1);
      expect(pagination.hasNextPage, false);
      expect(pagination.hasPrevPage, false);
    });

    test('VocabularyListResponseModel parses items and pagination correctly', () {
      final json = {
        'items': [sampleItemJson],
        'pagination': {
          'total': 1,
          'page': 1,
          'limit': 50,
          'totalPages': 1,
          'hasNextPage': false,
          'hasPrevPage': false,
        },
      };

      final response = VocabularyListResponseModel.fromJson(json);

      expect(response.items.length, 1);
      expect(response.items.first.word, 'hiking');
      expect(response.pagination.total, 1);
    });

    test('VocabularyContextModel parses from JSON correctly', () {
      final json = {
        'cardId': 1,
        'cardTitle': 'Tsakkar Mountain',
        'rarity': 'RARE',
        'targetWord': 'hiking',
        'simplifiedText': 'We went hiking in Tsakkar mountain today.',
        'found': true,
      };

      final contextModel = VocabularyContextModel.fromJson(json);

      expect(contextModel.cardId, 1);
      expect(contextModel.cardTitle, 'Tsakkar Mountain');
      expect(contextModel.rarity, 'RARE');
      expect(contextModel.targetWord, 'hiking');
      expect(contextModel.simplifiedText,
          'We went hiking in Tsakkar mountain today.');
      expect(contextModel.found, true);
    });

    test('VocabularyDetailModel parses correctly', () {
      final detail = VocabularyDetailModel.fromJson(sampleItemJson);

      expect(detail.id, 7);
      expect(detail.word, 'hiking');
      expect(detail.cardTitle, 'Tsakkar Mountain');
    });
  });

  group('Vocabulary Repository & UseCases Unit Tests', () {
    late MockVocabularyRemoteDataSource mockDataSource;
    late VocabularyRepositoryImpl repository;

    setUp(() {
      mockDataSource = MockVocabularyRemoteDataSource();
      repository = VocabularyRepositoryImpl(remoteDataSource: mockDataSource);
    });

    test('GetVocabularyListUseCase returns success data', () async {
      final responseModel = VocabularyListResponseModel(
        items: [
          const VocabularyItemModel(
            id: 1,
            word: 'aroma',
            meaning: 'hương thơm',
            cardId: 1,
            cardTitle: 'Coffee',
          ),
        ],
        pagination: const VocabularyPaginationModel(
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        ),
      );

      mockDataSource.mockListResult = ApiSuccess(responseModel);

      final useCase = GetVocabularyListUseCase(repository);
      final result = await useCase();

      expect(result.isSuccess, true);
      expect(result.dataOrNull?.items.length, 1);
      expect(result.dataOrNull?.items.first.word, 'aroma');
    });

    test('GetVocabularyDetailUseCase returns detail model', () async {
      const detailModel = VocabularyDetailModel(
        id: 7,
        word: 'hiking',
        meaning: 'Đi bộ',
        cardId: 1,
        cardTitle: 'Mountain',
      );

      mockDataSource.mockDetailResult = const ApiSuccess(detailModel);

      final useCase = GetVocabularyDetailUseCase(repository);
      final result = await useCase(7);

      expect(result.isSuccess, true);
      expect(result.dataOrNull?.id, 7);
      expect(result.dataOrNull?.word, 'hiking');
    });

    test('GetVocabularyContextUseCase returns context data', () async {
      const contextModel = VocabularyContextModel(
        cardId: 1,
        cardTitle: 'Mountain',
        targetWord: 'hiking',
        simplifiedText: 'Hiking is great.',
        found: true,
      );

      mockDataSource.mockContextResult = const ApiSuccess(contextModel);

      final useCase = GetVocabularyContextUseCase(repository);
      final result = await useCase(1, 'hiking');

      expect(result.isSuccess, true);
      expect(result.dataOrNull?.simplifiedText, 'Hiking is great.');
      expect(result.dataOrNull?.found, true);
    });

    test('Repository handles failure correctly', () async {
      mockDataSource.mockListResult =
          const ApiFailure(message: 'Server Error', statusCode: 500);

      final useCase = GetVocabularyListUseCase(repository);
      final result = await useCase();

      expect(result.isFailure, true);
      expect((result as ApiFailure).message, 'Server Error');
    });
  });
}

