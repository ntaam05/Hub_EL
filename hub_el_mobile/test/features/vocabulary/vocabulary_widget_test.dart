import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hub_el_mobile/features/vocabulary/domain/entities/vocabulary_entities.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/cubit/vocabulary_state.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/widgets/vocabulary_card.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/widgets/vocabulary_context_modal.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/widgets/vocabulary_dashboard_header.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/widgets/vocabulary_detail_sheet.dart';
import 'package:hub_el_mobile/features/vocabulary/presentation/widgets/vocabulary_filter_bar.dart';

void main() {
  Widget createWidgetForTesting(Widget child) {
    return MaterialApp(
      home: Scaffold(
        body: child,
      ),
    );
  }

  const sampleItem = VocabularyItemEntity(
    id: 7,
    word: 'hiking',
    meaning: 'Đi bộ đường dài',
    pronunciation: '[ˈhaɪkɪŋ]',
    pos: 'N',
    englishDesc:
        '[ˈhaɪkɪŋ]-/hy-king/\nThe activity of walking long distances in the countryside.',
    language: 'Tiếng Anh',
    cardId: 1,
    cardTitle: 'Tsakkar Mountain',
    rarity: 'RARE',
  );

  group('Vocabulary Widgets Unit Tests', () {
    testWidgets('VocabularyDashboardHeader renders total count and language stats',
        (tester) async {
      await tester.pumpWidget(
        createWidgetForTesting(
          const VocabularyDashboardHeader(
            totalCount: 32,
            languageCounts: {
              'Tiếng Anh': 30,
              'Tiếng Nhật': 2,
            },
          ),
        ),
      );

      expect(find.text('SỔ TAY TỪ VỰNG'), findsOneWidget);
      expect(find.text('32'), findsOneWidget);
      expect(find.text('Tiếng Anh: '), findsOneWidget);
      expect(find.text('30'), findsOneWidget);
      expect(find.text('Tiếng Nhật: '), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('VocabularyFilterBar renders language chips and sort button',
        (tester) async {
      String selectedLang = 'ALL';
      String selectedPos = 'ALL';
      bool toggledSort = false;
      bool resetCalled = false;

      await tester.pumpWidget(
        createWidgetForTesting(
          VocabularyFilterBar(
            selectedLanguage: selectedLang,
            selectedPos: selectedPos,
            sortOrder: VocabSortOrder.az,
            posList: const ['ADJ', 'N', 'V'],
            hasActiveFilters: true,
            onLanguageChanged: (val) => selectedLang = val,
            onPosChanged: (val) => selectedPos = val,
            onToggleSort: () => toggledSort = true,
            onReset: () => resetCalled = true,
          ),
        ),
      );

      expect(find.text('Mọi ngôn ngữ'), findsOneWidget);
      expect(find.text('Tiếng Anh'), findsOneWidget);
      expect(find.text('TẤT CẢ TỪ LOẠI'), findsOneWidget);
      expect(find.text('N'), findsOneWidget);
      expect(find.text('A-Z'), findsOneWidget);
      expect(find.text('Đặt lại'), findsOneWidget);

      // Tap on sort button
      await tester.tap(find.text('A-Z'));
      await tester.pumpAndSettle();
      expect(toggledSort, true);

      // Tap on Reset button
      await tester.tap(find.text('Đặt lại'));
      await tester.pumpAndSettle();
      expect(resetCalled, true);
    });

    testWidgets('VocabularyCard renders word, POS, phonetic, meaning and triggers speak',
        (tester) async {
      bool spoke = false;
      bool cardTapped = false;
      bool contextTapped = false;

      await tester.pumpWidget(
        createWidgetForTesting(
          VocabularyCard(
            item: sampleItem,
            onSpeak: () => spoke = true,
            onTapCard: () => cardTapped = true,
            onTapContext: () => contextTapped = true,
          ),
        ),
      );

      expect(find.text('hiking'), findsOneWidget);
      expect(find.text('N'), findsOneWidget);
      expect(find.text('Đi bộ đường dài'), findsOneWidget);
      expect(find.text('[ˈhaɪkɪŋ]'), findsOneWidget);
      expect(find.text('/hy-king/'), findsOneWidget);
      expect(find.text('TSAKKAR MOUNTAIN'), findsOneWidget);

      // Tap speak button
      await tester.tap(find.byIcon(LucideIcons.volume2));
      await tester.pumpAndSettle();
      expect(spoke, true);

      // Tap card
      await tester.tap(find.text('hiking'));
      await tester.pumpAndSettle();
      expect(cardTapped, true);

      // Tap context
      await tester.tap(find.text('TSAKKAR MOUNTAIN'));
      await tester.pumpAndSettle();
      expect(contextTapped, true);
    });

    testWidgets('VocabularyContextModal renders passage text and highlight',
        (tester) async {
      bool closed = false;

      const contextData = VocabularyContextEntity(
        cardId: 1,
        cardTitle: 'Tsakkar Mountain',
        rarity: 'RARE',
        targetWord: 'hiking',
        simplifiedText: 'Hiking in nature is wonderful.',
        found: true,
      );

      await tester.pumpWidget(
        createWidgetForTesting(
          VocabularyContextModal(
            contextData: contextData,
            isLoading: false,
            targetWord: 'hiking',
            onClose: () => closed = true,
          ),
        ),
      );

      expect(find.text('NGỮ CẢNH TỪ VỰNG'), findsOneWidget);
      expect(find.text('Tsakkar Mountain'), findsOneWidget);
      expect(find.text('RARE'), findsOneWidget);
      expect(find.text('ĐẾN BÀI HỌC WIKI NÀY'), findsOneWidget);

      // Close tap
      await tester.tap(find.byType(IconButton));
      await tester.pumpAndSettle();
      expect(closed, true);
    });

    testWidgets('VocabularyDetailSheet renders detailed info', (tester) async {
      bool spoke = false;
      bool viewedContext = false;

      await tester.pumpWidget(
        createWidgetForTesting(
          VocabularyDetailSheet(
            item: sampleItem,
            onSpeak: () => spoke = true,
            onViewContext: () => viewedContext = true,
          ),
        ),
      );

      expect(find.text('CHI TIẾT TỪ VỰNG'), findsOneWidget);
      expect(find.text('hiking'), findsOneWidget);
      expect(find.text('NGHĨA TIẾNG VIỆT'), findsOneWidget);
      expect(find.text('Đi bộ đường dài'), findsOneWidget);
      expect(find.text('XEM NGỮ CẢNH TRONG BÀI HỌC'), findsOneWidget);

      await tester.tap(find.byIcon(LucideIcons.volume2));
      await tester.pumpAndSettle();
      expect(spoke, true);

      await tester.ensureVisible(find.text('XEM NGỮ CẢNH TRONG BÀI HỌC'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('XEM NGỮ CẢNH TRONG BÀI HỌC'));
      await tester.pumpAndSettle();
      expect(viewedContext, true);
    });
  });
}
