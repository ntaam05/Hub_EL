import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/leaderboard/data/models/leaderboard_model.dart';
import 'package:hub_el_mobile/features/leaderboard/domain/entities/leaderboard_entity.dart';
import 'package:hub_el_mobile/features/leaderboard/domain/repositories/leaderboard_repository.dart';
import 'package:hub_el_mobile/features/leaderboard/domain/usecases/get_leaderboard_use_case.dart';
import 'package:hub_el_mobile/features/leaderboard/presentation/cubit/leaderboard_cubit.dart';
import 'package:hub_el_mobile/features/leaderboard/presentation/widgets/category_selector_widget.dart';
import 'package:hub_el_mobile/features/leaderboard/presentation/widgets/leaderboard_row_item.dart';
import 'package:hub_el_mobile/features/leaderboard/presentation/widgets/podium_widget.dart';
import 'package:hub_el_mobile/features/leaderboard/presentation/widgets/sticky_current_user_rank.dart';
import 'package:hub_el_mobile/features/leaderboard/presentation/widgets/timeframe_selector_widget.dart';

// Mock Leaderboard Repository
class MockLeaderboardRepository implements ILeaderboardRepository {
  bool shouldFail = false;
  LeaderboardDataEntity? mockData;

  @override
  Future<ApiResult<LeaderboardDataEntity>> getLeaderboard({
    required LeaderboardCategoryType category,
    required LeaderboardTimeframeType timeframe,
  }) async {
    if (shouldFail) {
      return const ApiFailure(message: 'Lỗi nạp bảng xếp hạng', statusCode: 500);
    }

    final data = mockData ??
        LeaderboardDataEntity(
          category: category,
          range: timeframe,
          generatedAt: DateTime.now(),
          topPlayers: [
            const LeaderboardPlayerEntity(
              rank: 1,
              userId: 'u1',
              displayName: 'Nguyễn Văn A',
              level: 15,
              scoreValue: 5000,
              scoreLabel: '5,000 XP',
              subLabel: 'Cấp 15',
              isPro: true,
            ),
            const LeaderboardPlayerEntity(
              rank: 2,
              userId: 'u2',
              displayName: 'Trần Thị B',
              level: 12,
              scoreValue: 4200,
              scoreLabel: '4,200 XP',
              subLabel: 'Cấp 12',
            ),
            const LeaderboardPlayerEntity(
              rank: 3,
              userId: 'u3',
              displayName: 'Lê Hoàng C',
              level: 10,
              scoreValue: 3800,
              scoreLabel: '3,800 XP',
              subLabel: 'Cấp 10',
            ),
            const LeaderboardPlayerEntity(
              rank: 4,
              userId: 'u4',
              displayName: 'Phạm Văn D',
              level: 8,
              scoreValue: 3100,
              scoreLabel: '3,100 XP',
              subLabel: 'Cấp 8',
            ),
          ],
          currentUser: const LeaderboardPlayerEntity(
            rank: 14,
            userId: 'me',
            displayName: 'Tôi Là Người Học',
            level: 6,
            scoreValue: 1200,
            scoreLabel: '1,200 XP',
            subLabel: 'Cấp 6',
            isTop50: true,
          ),
        );

    return ApiSuccess(data);
  }
}

void main() {
  group('1. Data Models & Entity Parsing Tests', () {
    test('LeaderboardPlayerModel parses JSON accurately', () {
      final json = {
        'rank': 1,
        'userId': 'usr_123',
        'displayName': 'Alice Hero',
        'username': 'alice_h',
        'avatar': 'https://example.com/avatar.jpg',
        'isPro': true,
        'level': 18,
        'scoreValue': 9500,
        'scoreLabel': '9,500 XP',
        'subLabel': 'Cấp 18',
        'isTop50': true,
      };

      final model = LeaderboardPlayerModel.fromJson(json);

      expect(model.rank, 1);
      expect(model.userId, 'usr_123');
      expect(model.displayName, 'Alice Hero');
      expect(model.username, 'alice_h');
      expect(model.isPro, isTrue);
      expect(model.level, 18);
      expect(model.scoreValue, 9500);
      expect(model.scoreLabel, '9,500 XP');
      expect(model.subLabel, 'Cấp 18');
      expect(model.isTop50, isTrue);
    });

    test('LeaderboardDataModel parses full response JSON properly', () {
      final json = {
        'category': 'GRINDER',
        'range': 'WEEK',
        'generatedAt': '2026-11-21T06:30:00.000Z',
        'topPlayers': [
          {
            'rank': 1,
            'userId': 'u1',
            'displayName': 'Top Player 1',
            'scoreValue': 2000,
            'scoreLabel': '2,000 XP',
            'subLabel': 'Cấp 10',
          }
        ],
        'currentUser': {
          'rank': 5,
          'userId': 'me',
          'displayName': 'My Account',
          'scoreValue': 1500,
          'scoreLabel': '1,500 XP',
          'subLabel': 'Cấp 8',
          'isTop50': true,
        }
      };

      final model = LeaderboardDataModel.fromJson(json);

      expect(model.category, LeaderboardCategoryType.grinder);
      expect(model.range, LeaderboardTimeframeType.week);
      expect(model.topPlayers.length, 1);
      expect(model.topPlayers.first.displayName, 'Top Player 1');
      expect(model.currentUser?.rank, 5);
      expect(model.currentUser?.displayName, 'My Account');
    });
  });

  group('2. LeaderboardCubit & UseCase State Transitions', () {
    late MockLeaderboardRepository repository;
    late GetLeaderboardUseCase useCase;
    late LeaderboardCubit cubit;

    setUp(() {
      repository = MockLeaderboardRepository();
      useCase = GetLeaderboardUseCase(repository);
      cubit = LeaderboardCubit(getLeaderboardUseCase: useCase);
    });

    tearDown(() {
      cubit.close();
    });

    test('Initial state is clean', () {
      expect(cubit.state.selectedCategory, LeaderboardCategoryType.streak);
      expect(cubit.state.selectedTimeframe, LeaderboardTimeframeType.day);
      expect(cubit.state.data, isNull);
      expect(cubit.state.isLoading, isFalse);
    });

    test('loadLeaderboard fetches data and updates state on success', () async {
      await cubit.loadLeaderboard();

      expect(cubit.state.isLoading, isFalse);
      expect(cubit.state.data, isNotNull);
      expect(cubit.state.data?.topPlayers.length, 4);
      expect(cubit.state.errorMessage, isNull);
    });

    test('selectCategory updates category and reloads data', () async {
      cubit.selectCategory(LeaderboardCategoryType.grinder);

      expect(cubit.state.selectedCategory, LeaderboardCategoryType.grinder);
      await pumpEventQueue();

      expect(cubit.state.data?.category, LeaderboardCategoryType.grinder);
    });

    test('selectTimeframe updates timeframe and reloads data', () async {
      cubit.selectTimeframe(LeaderboardTimeframeType.month);

      expect(cubit.state.selectedTimeframe, LeaderboardTimeframeType.month);
      await pumpEventQueue();

      expect(cubit.state.data?.range, LeaderboardTimeframeType.month);
    });

    test('loadLeaderboard updates errorMessage on failure', () async {
      repository.shouldFail = true;
      await cubit.loadLeaderboard(refresh: true);

      expect(cubit.state.isLoading, isFalse);
      expect(cubit.state.errorMessage, contains('Lỗi nạp bảng xếp hạng'));
    });
  });

  group('3. Leaderboard UI Widget Tests', () {
    testWidgets('CategorySelectorWidget renders all categories and responds to tap', (tester) async {
      LeaderboardCategoryType? selected;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CategorySelectorWidget(
              selectedCategory: LeaderboardCategoryType.streak,
              onCategorySelected: (cat) => selected = cat,
            ),
          ),
        ),
      );

      expect(find.text('Bền Bỉ'), findsOneWidget);
      expect(find.text('Cày Cuốc'), findsOneWidget);
      expect(find.text('Thời Gian'), findsOneWidget);
      expect(find.text('Khắc Tinh AI'), findsOneWidget);

      await tester.tap(find.text('Cày Cuốc'));
      expect(selected, LeaderboardCategoryType.grinder);
    });

    testWidgets('TimeframeSelectorWidget renders all timeframes and responds to tap', (tester) async {
      LeaderboardTimeframeType? selected;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TimeframeSelectorWidget(
              selectedTimeframe: LeaderboardTimeframeType.day,
              onTimeframeSelected: (tf) => selected = tf,
            ),
          ),
        ),
      );

      expect(find.text('Hôm nay'), findsOneWidget);
      expect(find.text('Tuần này'), findsOneWidget);
      expect(find.text('Tháng này'), findsOneWidget);
      expect(find.text('Mọi lúc'), findsOneWidget);

      await tester.tap(find.text('Tuần này'));
      expect(selected, LeaderboardTimeframeType.week);
    });

    testWidgets('PodiumWidget renders rank 1, 2, 3 properly with crown and scores', (tester) async {
      const top3 = [
        LeaderboardPlayerEntity(
          rank: 1,
          userId: 'u1',
          displayName: 'Player One',
          scoreValue: 5000,
          scoreLabel: '5,000 XP',
          subLabel: 'Cấp 15',
        ),
        LeaderboardPlayerEntity(
          rank: 2,
          userId: 'u2',
          displayName: 'Player Two',
          scoreValue: 4000,
          scoreLabel: '4,000 XP',
          subLabel: 'Cấp 12',
        ),
        LeaderboardPlayerEntity(
          rank: 3,
          userId: 'u3',
          displayName: 'Player Three',
          scoreValue: 3000,
          scoreLabel: '3,000 XP',
          subLabel: 'Cấp 10',
        ),
      ];

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PodiumWidget(top3: top3),
          ),
        ),
      );

      expect(find.text('Player One'), findsOneWidget);
      expect(find.text('5,000 XP'), findsOneWidget);
      expect(find.text('Player Two'), findsOneWidget);
      expect(find.text('4,000 XP'), findsOneWidget);
      expect(find.text('Player Three'), findsOneWidget);
      expect(find.text('3,000 XP'), findsOneWidget);
      expect(find.text('1'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('LeaderboardRowItem renders rank, display name, and score', (tester) async {
      const player = LeaderboardPlayerEntity(
        rank: 4,
        userId: 'u4',
        displayName: 'Dũng Lê',
        level: 9,
        scoreValue: 2500,
        scoreLabel: '2,500 XP',
        subLabel: 'Cấp 9',
        isPro: true,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LeaderboardRowItem(player: player),
          ),
        ),
      );

      expect(find.text('4'), findsOneWidget);
      expect(find.text('Dũng Lê'), findsOneWidget);
      expect(find.text('2,500 XP'), findsOneWidget);
      expect(find.text('PRO'), findsOneWidget);
    });

    testWidgets('StickyCurrentUserRank renders personal sticky rank card', (tester) async {
      const currentUser = LeaderboardPlayerEntity(
        rank: 18,
        userId: 'me',
        displayName: 'Nguyễn Văn Tôi',
        level: 7,
        scoreValue: 1400,
        scoreLabel: '1,400 XP',
        subLabel: 'Thu thập được',
        isTop50: true,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StickyCurrentUserRank(currentUser: currentUser),
          ),
        ),
      );

      expect(find.text('#18'), findsOneWidget);
      expect(find.text('Nguyễn Văn Tôi'), findsOneWidget);
      expect(find.text('Tôi'), findsOneWidget);
      expect(find.text('1,400 XP'), findsOneWidget);
      expect(find.text('Thu thập được'), findsOneWidget);
    });
  });
}

