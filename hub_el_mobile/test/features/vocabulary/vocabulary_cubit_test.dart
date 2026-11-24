import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/vocabulary/data/models/vocabulary_models.dart';
import 'package:hub_el_mobile/features/vocabulary/domain/repositories/vocabulary_repository.dart';
import 'package:hub_el_mobile/features/vocabulary/domain/usecases/vocabulary_usecases.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/cubit/vocabulary_cubit.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/cubit/vocabulary_state.dart';

class MockVocabularyRepository implements IVocabularyRepository {
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
  group('VocabularyCubit Unit Tests', () {
    late MockVocabularyRepository mockRepository;
    late VocabularyCubit cubit;

    final sampleItems = [
      const VocabularyItemModel(
        id: 1,
        word: 'Banana',
        meaning: 'Quả chuối',
        pos: 'N',
        language: 'Tiếng Anh',
        cardId: 10,
        cardTitle: 'Fruit Collection',
      ),
      const VocabularyItemModel(
        id: 2,
        word: 'Apple',
        meaning: 'Quả táo',
        pos: 'N',
        language: 'Tiếng Anh',
        cardId: 10,
        cardTitle: 'Fruit Collection',
      ),
      const VocabularyItemModel(
        id: 3,
        word: 'Run',
        meaning: 'Chạy nhanh',
        pos: 'V',
        language: 'Tiếng Anh',
        cardId: 20,
        cardTitle: 'Action Cards',
      ),
      const VocabularyItemModel(
        id: 4,
        word: 'Sakura',
        meaning: 'Hoa anh đào',
        pos: 'N',
        language: 'Tiếng Nhật',
        cardId: 30,
        cardTitle: 'Japan Wiki',
      ),
    ];

    setUp(() {
      mockRepository = MockVocabularyRepository();
      cubit = VocabularyCubit(
        getVocabularyListUseCase: GetVocabularyListUseCase(mockRepository),
        getVocabularyDetailUseCase: GetVocabularyDetailUseCase(mockRepository),
        getVocabularyContextUseCase: GetVocabularyContextUseCase(mockRepository),
      );
    });

    tearDown(() {
      cubit.close();
    });

    test('Initial state is correct', () {
      expect(cubit.state.status, VocabularyStatus.initial);
      expect(cubit.state.items, isEmpty);
      expect(cubit.state.selectedLanguage, 'ALL');
      expect(cubit.state.selectedPos, 'ALL');
      expect(cubit.state.searchQuery, '');
      expect(cubit.state.sortOrder, VocabSortOrder.az);
      expect(cubit.state.hasActiveFilters, false);
    });

    test('loadVocabulary emits [loading, loaded] on success', () async {
      final responseModel = VocabularyListResponseModel(
        items: sampleItems,
        pagination: const VocabularyPaginationModel(
          total: 4,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        ),
      );

      mockRepository.mockListResult = ApiSuccess(responseModel);

      final expectedStates = [
        const VocabularyState(status: VocabularyStatus.loading),
        VocabularyState(
          status: VocabularyStatus.loaded,
          items: sampleItems,
          pagination: responseModel.pagination,
        ),
      ];

      expectLater(cubit.stream, emitsInOrder(expectedStates));

      await cubit.loadVocabulary();
      expect(cubit.state.status, VocabularyStatus.loaded);
      expect(cubit.state.items.length, 4);
      expect(cubit.state.totalWords, 4);
    });

    test('loadVocabulary emits [loading, error] on failure', () async {
      mockRepository.mockListResult =
          const ApiFailure(message: 'Network Timeout', statusCode: 408);

      final expectedStates = [
        const VocabularyState(status: VocabularyStatus.loading),
        const VocabularyState(
          status: VocabularyStatus.error,
          errorMessage: 'Network Timeout',
        ),
      ];

      expectLater(cubit.stream, emitsInOrder(expectedStates));

      await cubit.loadVocabulary();
      expect(cubit.state.status, VocabularyStatus.error);
      expect(cubit.state.errorMessage, 'Network Timeout');
    });

    test('setSearchQuery filters vocabulary correctly', () async {
      final responseModel = VocabularyListResponseModel(
        items: sampleItems,
        pagination: const VocabularyPaginationModel(
          total: 4,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        ),
      );
      mockRepository.mockListResult = ApiSuccess(responseModel);
      await cubit.loadVocabulary();

      cubit.setSearchQuery('app');
      expect(cubit.state.searchQuery, 'app');
      expect(cubit.state.filteredItems.length, 1);
      expect(cubit.state.filteredItems.first.word, 'Apple');

      cubit.setSearchQuery('chuối');
      expect(cubit.state.filteredItems.length, 1);
      expect(cubit.state.filteredItems.first.word, 'Banana');
    });

    test('setLanguageFilter filters by language', () async {
      final responseModel = VocabularyListResponseModel(
        items: sampleItems,
        pagination: const VocabularyPaginationModel(
          total: 4,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        ),
      );
      mockRepository.mockListResult = ApiSuccess(responseModel);
      await cubit.loadVocabulary();

      cubit.setLanguageFilter('Tiếng Nhật');
      expect(cubit.state.selectedLanguage, 'Tiếng Nhật');
      expect(cubit.state.filteredItems.length, 1);
      expect(cubit.state.filteredItems.first.word, 'Sakura');
    });

    test('setPosFilter filters by part of speech', () async {
      final responseModel = VocabularyListResponseModel(
        items: sampleItems,
        pagination: const VocabularyPaginationModel(
          total: 4,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        ),
      );
      mockRepository.mockListResult = ApiSuccess(responseModel);
      await cubit.loadVocabulary();

      cubit.setPosFilter('V');
      expect(cubit.state.selectedPos, 'V');
      expect(cubit.state.filteredItems.length, 1);
      expect(cubit.state.filteredItems.first.word, 'Run');
    });

    test('toggleSortOrder toggles between az and za correctly', () async {
      final responseModel = VocabularyListResponseModel(
        items: sampleItems,
        pagination: const VocabularyPaginationModel(
          total: 4,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        ),
      );
      mockRepository.mockListResult = ApiSuccess(responseModel);
      await cubit.loadVocabulary();

      // Mặc định A-Z: Apple, Banana, Run, Sakura
      expect(cubit.state.sortOrder, VocabSortOrder.az);
      expect(cubit.state.filteredItems.first.word, 'Apple');

      // Chuyển sang Z-A: Sakura, Run, Banana, Apple
      cubit.toggleSortOrder();
      expect(cubit.state.sortOrder, VocabSortOrder.za);
      expect(cubit.state.filteredItems.first.word, 'Sakura');

      // Chuyển lại A-Z
      cubit.toggleSortOrder();
      expect(cubit.state.sortOrder, VocabSortOrder.az);
      expect(cubit.state.filteredItems.first.word, 'Apple');
    });

    test('resetFilters resets all filters to default', () async {
      cubit.setSearchQuery('search test');
      cubit.setLanguageFilter('Tiếng Nhật');
      cubit.setPosFilter('V');
      cubit.toggleSortOrder();

      expect(cubit.state.hasActiveFilters, true);

      cubit.resetFilters();
      expect(cubit.state.searchQuery, '');
      expect(cubit.state.selectedLanguage, 'ALL');
      expect(cubit.state.selectedPos, 'ALL');
      expect(cubit.state.sortOrder, VocabSortOrder.az);
      expect(cubit.state.hasActiveFilters, false);
    });

    test('loadVocabularyContext handles success and error', () async {
      const contextModel = VocabularyContextModel(
        cardId: 10,
        cardTitle: 'Fruit Collection',
        targetWord: 'Apple',
        simplifiedText: 'Apple is sweet and healthy.',
        found: true,
      );

      mockRepository.mockContextResult = const ApiSuccess(contextModel);

      await cubit.loadVocabularyContext(10, 'Apple');
      expect(cubit.state.isContextLoading, false);
      expect(cubit.state.selectedContext?.simplifiedText,
          'Apple is sweet and healthy.');
      expect(cubit.state.selectedContext?.found, true);

      // Test error
      mockRepository.mockContextResult = const ApiFailure(
        message: 'Bạn không sở hữu thẻ bài này.',
        statusCode: 403,
      );

      await cubit.loadVocabularyContext(999, 'Ghost');
      expect(cubit.state.isContextLoading, false);
      expect(cubit.state.contextError, 'Bạn không sở hữu thẻ bài này.');

      // Clear context
      cubit.clearSelectedContext();
      expect(cubit.state.selectedContext, isNull);
      expect(cubit.state.contextError, isNull);
    });
  });
}

