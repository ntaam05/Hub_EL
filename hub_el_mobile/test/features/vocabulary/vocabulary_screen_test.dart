import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/vocabulary/data/models/vocabulary_models.dart';
import 'package:hub_el_mobile/features/vocabulary/domain/entities/vocabulary_entities.dart';
import 'package:hub_el_mobile/features/vocabulary/domain/repositories/vocabulary_repository.dart';
import 'package:hub_el_mobile/features/vocabulary/domain/usecases/vocabulary_usecases.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/cubit/vocabulary_cubit.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/screens/vocabulary_screen.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/widgets/vocabulary_card.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/widgets/vocabulary_dashboard_header.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class MockVocabularyScreenRepo implements IVocabularyRepository {
  @override
  Future<ApiResult<VocabularyListResponseEntity>> getVocabularyList({
    String? search,
    String? language,
    String? sort,
    int? page,
    int? limit,
  }) async {
    final items = [
      const VocabularyItemModel(
        id: 1,
        word: 'Apple',
        meaning: 'Quả táo',
        pos: 'N',
        language: 'Tiếng Anh',
        cardId: 10,
        cardTitle: 'Fruit Collection',
      ),
      const VocabularyItemModel(
        id: 2,
        word: 'Hiking',
        meaning: 'Đi bộ đường dài',
        pos: 'N',
        language: 'Tiếng Anh',
        cardId: 20,
        cardTitle: 'Mountain',
      ),
      const VocabularyItemModel(
        id: 3,
        word: 'Sakura',
        meaning: 'Hoa anh đào',
        pos: 'N',
        language: 'Tiếng Nhật',
        cardId: 30,
        cardTitle: 'Japan Wiki',
      ),
    ];

    return ApiSuccess(
      VocabularyListResponseEntity(
        items: items,
        pagination: const VocabularyPaginationModel(
          total: 3,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        ),
      ),
    );
  }

  @override
  Future<ApiResult<VocabularyDetailEntity>> getVocabularyDetail(int id) async {
    return const ApiSuccess(
      VocabularyDetailModel(
        id: 1,
        word: 'Apple',
        meaning: 'Quả táo',
        cardId: 10,
        cardTitle: 'Fruit Collection',
      ),
    );
  }

  @override
  Future<ApiResult<VocabularyContextEntity>> getVocabularyContext(
      int cardId, String targetWord) async {
    return const ApiSuccess(
      VocabularyContextModel(
        cardId: 10,
        cardTitle: 'Fruit Collection',
        targetWord: 'Apple',
        simplifiedText: 'Apple is delicious.',
        found: true,
      ),
    );
  }
}

void main() {
  testWidgets('VocabularyScreen renders full interface and interacts',
      (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final repo = MockVocabularyScreenRepo();
    final cubit = VocabularyCubit(
      getVocabularyListUseCase: GetVocabularyListUseCase(repo),
      getVocabularyDetailUseCase: GetVocabularyDetailUseCase(repo),
      getVocabularyContextUseCase: GetVocabularyContextUseCase(repo),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<VocabularyCubit>.value(
          value: cubit,
          child: const VocabularyScreen(),
        ),
      ),
    );

    // Initial pump
    await tester.pump();
    await tester.pumpAndSettle();

    // Verify AppBar
    expect(find.text('SỔ TAY TỪ VỰNG'), findsNWidgets(2)); // AppBar + Dashboard

    // Verify Dashboard
    expect(find.byType(VocabularyDashboardHeader), findsOneWidget);
    expect(find.text('3'), findsOneWidget); // total

    // Verify list of cards
    expect(find.byType(VocabularyCard), findsNWidgets(3));
    expect(find.text('Apple'), findsOneWidget);
    expect(find.text('Hiking'), findsOneWidget);
    expect(find.text('Sakura'), findsOneWidget);

    // Verify searching
    await tester.tap(find.byIcon(LucideIcons.search));
    await tester.pumpAndSettle();

    // Type query
    await tester.enterText(find.byType(TextField), 'hik');
    await tester.pumpAndSettle();

    // Now only Hiking is shown
    expect(find.byType(VocabularyCard), findsOneWidget);
    expect(find.text('Hiking'), findsOneWidget);
    expect(find.text('Apple'), findsNothing);

    // Clear search
    await tester.tap(find.byIcon(LucideIcons.x));
    await tester.pumpAndSettle();

    // All 3 back
    expect(find.byType(VocabularyCard), findsNWidgets(3));
  });
}
