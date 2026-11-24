import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/gacha/data/models/gacha_exchange_model.dart';
import 'package:hub_el_mobile/features/gacha/data/models/gacha_history_model.dart';
import 'package:hub_el_mobile/features/gacha/data/models/gacha_roll_result_model.dart';
import 'package:hub_el_mobile/features/gacha/data/models/gacha_status_model.dart';
import 'package:hub_el_mobile/features/gacha/domain/entities/gacha_card_entity.dart';
import 'package:hub_el_mobile/features/gacha/domain/entities/gacha_exchange_entity.dart';
import 'package:hub_el_mobile/features/gacha/domain/entities/gacha_history_entity.dart';
import 'package:hub_el_mobile/features/gacha/domain/entities/gacha_roll_result_entity.dart';
import 'package:hub_el_mobile/features/gacha/domain/entities/gacha_status_entity.dart';
import 'package:hub_el_mobile/features/gacha/domain/repositories/gacha_repository.dart';
import 'package:hub_el_mobile/features/gacha/domain/usecases/exchange_card_usecase.dart';
import 'package:hub_el_mobile/features/gacha/domain/usecases/get_exchange_cards_usecase.dart';
import 'package:hub_el_mobile/features/gacha/domain/usecases/get_gacha_history_usecase.dart';
import 'package:hub_el_mobile/features/gacha/domain/usecases/get_gacha_status_usecase.dart';
import 'package:hub_el_mobile/features/gacha/domain/usecases/roll_gacha_usecase.dart';
import 'package:hub_el_mobile/features/gacha/presentation/bloc/gacha_bloc.dart';
import 'package:hub_el_mobile/features/gacha/presentation/bloc/gacha_event.dart';
import 'package:hub_el_mobile/features/gacha/presentation/bloc/gacha_state.dart';
import 'package:hub_el_mobile/features/gacha/presentation/widgets/gacha_header_widget.dart';
import 'package:hub_el_mobile/features/gacha/presentation/widgets/gacha_info_modal.dart';
import 'package:hub_el_mobile/features/gacha/presentation/widgets/gacha_result_view.dart';
import 'package:hub_el_mobile/features/gacha/presentation/widgets/gacha_roll_button.dart';

class FakeGachaRepository implements IGachaRepository {
  ApiResult<GachaStatusEntity>? statusResult;
  ApiResult<GachaRollResultEntity>? rollResult;
  ApiResult<GachaExchangeEntity>? exchangeResult;
  ApiResult<Map<String, dynamic>>? exchangeCardResult;
  ApiResult<GachaHistoryEntity>? historyResult;

  @override
  Future<ApiResult<GachaStatusEntity>> getGachaStatus() async {
    return statusResult!;
  }

  @override
  Future<ApiResult<GachaRollResultEntity>> rollGacha(int count) async {
    return rollResult!;
  }

  @override
  Future<ApiResult<GachaExchangeEntity>> getExchangeCards() async {
    return exchangeResult!;
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> exchangeCard(int cardId) async {
    return exchangeCardResult!;
  }

  @override
  Future<ApiResult<GachaHistoryEntity>> getGachaHistory({int page = 1, int limit = 10}) async {
    return historyResult!;
  }
}

void main() {
  group('1. Gacha Data Models Parsing', () {
    test('GachaStatusModel parses JSON correctly', () {
      final json = {
        'freeCoins': 1200,
        'stardust': 450,
        'pitySR': 5,
        'pitySSR': 22,
        'pityUR': 80,
        'isPro': true,
        'isFreePullAvailable': true,
        'lastFreeGachaDate': '2026-11-15T10:00:00.000Z',
        'rollCost': 100,
      };

      final model = GachaStatusModel.fromJson(json);

      expect(model.freeCoins, 1200);
      expect(model.stardust, 450);
      expect(model.pitySR, 5);
      expect(model.pitySSR, 22);
      expect(model.pityUR, 80);
      expect(model.isPro, true);
      expect(model.isFreePullAvailable, true);
      expect(model.lastFreeGachaDate, isNotNull);
      expect(model.rollCost, 100);
    });

    test('GachaRollResultModel parses single and multi cards correctly', () {
      final json = {
        'cards': [
          {
            'id': 1,
            'title': 'Solar System',
            'rarity': 'SSR',
            'imageUrl': 'https://example.com/solar.png',
            'wikiUrl': 'https://wikipedia.org/wiki/Solar_System',
            'awakenedStars': 0,
            'totalStars': 3,
            'isNew': true,
            'stardustEarned': 0,
          },
          {
            'id': 2,
            'title': 'Photosynthesis',
            'rarity': 'SR',
            'awakenedStars': 1,
            'totalStars': 2,
            'isNew': false,
            'stardustEarned': 24,
          }
        ],
        'remainingCoins': 1000,
        'remainingStardust': 474,
        'pitySR': 0,
        'pitySSR': 0,
        'pityUR': 81,
        'usedFreePull': false,
        'coinsSpent': 200,
      };

      final model = GachaRollResultModel.fromJson(json);

      expect(model.cards.length, 2);
      expect(model.cards[0].title, 'Solar System');
      expect(model.cards[0].isNew, true);
      expect(model.cards[1].stardustEarned, 24);
      expect(model.remainingCoins, 1000);
      expect(model.coinsSpent, 200);
    });

    test('GachaExchangeModel parses unowned cards correctly', () {
      final json = {
        'cards': [
          {
            'id': 99,
            'title': 'Deep Learning',
            'rarity': 'UR',
            'stardustCost': 800,
          }
        ],
        'currentStardust': 1000,
      };

      final model = GachaExchangeModel.fromJson(json);

      expect(model.cards.length, 1);
      expect(model.cards[0].title, 'Deep Learning');
      expect(model.cards[0].stardustCost, 800);
      expect(model.currentStardust, 1000);
    });

    test('GachaHistoryModel parses pagination correctly', () {
      final json = {
        'cards': [
          {
            'inventoryId': 10,
            'cardId': 1,
            'title': 'Quantum Physics',
            'rarity': 'SSR',
            'currentStar': 1,
            'acquiredAt': '2026-11-15T12:00:00.000Z',
          }
        ],
        'pagination': {
          'total': 15,
          'page': 1,
          'limit': 10,
          'totalPages': 2,
        }
      };

      final model = GachaHistoryModel.fromJson(json);

      expect(model.cards.length, 1);
      expect(model.total, 15);
      expect(model.totalPages, 2);
    });
  });

  group('2. Gacha Domain UseCases Validation', () {
    late FakeGachaRepository fakeRepo;

    setUp(() {
      fakeRepo = FakeGachaRepository();
    });

    test('RollGachaUseCase rejects count < 1', () async {
      final useCase = RollGachaUseCase(fakeRepo);
      final result = await useCase(0);

      expect(result is ApiFailure, true);
      expect((result as ApiFailure).statusCode, 400);
    });

    test('RollGachaUseCase rejects count > 5', () async {
      final useCase = RollGachaUseCase(fakeRepo);
      final result = await useCase(6);

      expect(result is ApiFailure, true);
      expect((result as ApiFailure).statusCode, 400);
    });

    test('ExchangeCardUseCase rejects cardId <= 0', () async {
      final useCase = ExchangeCardUseCase(fakeRepo);
      final result = await useCase(-1);

      expect(result is ApiFailure, true);
      expect((result as ApiFailure).statusCode, 400);
    });
  });

  group('3. GachaBloc State Transitions', () {
    late FakeGachaRepository fakeRepo;
    late GachaBloc bloc;

    setUp(() {
      fakeRepo = FakeGachaRepository();
      bloc = GachaBloc(
        getGachaStatusUseCase: GetGachaStatusUseCase(fakeRepo),
        rollGachaUseCase: RollGachaUseCase(fakeRepo),
        getExchangeCardsUseCase: GetExchangeCardsUseCase(fakeRepo),
        exchangeCardUseCase: ExchangeCardUseCase(fakeRepo),
        getGachaHistoryUseCase: GetGachaHistoryUseCase(fakeRepo),
      );
    });

    tearDown(() {
      bloc.close();
    });

    test('Initial state is GachaInitial', () {
      expect(bloc.state, isA<GachaInitial>());
    });

    test('Emits GachaLoaded on successful status fetch', () async {
      fakeRepo.statusResult = const ApiSuccess(
        GachaStatusEntity(
          freeCoins: 1500,
          stardust: 300,
          pitySR: 2,
          pitySSR: 10,
          pityUR: 25,
          isPro: true,
          isFreePullAvailable: true,
        ),
      );

      bloc.add(const GachaStatusFetchRequested());

      await expectLater(
        bloc.stream,
        emitsInOrder([
          isA<GachaLoading>(),
          isA<GachaLoaded>().having((s) => s.status.freeCoins, 'freeCoins', 1500),
        ]),
      );
    });

    test('ResetResult clears result and resets to idle', () async {
      fakeRepo.statusResult = const ApiSuccess(GachaStatusEntity(freeCoins: 1000));
      bloc.add(const GachaStatusFetchRequested());
      await pumpEventQueue();

      bloc.add(const GachaResetResultRequested());
      await pumpEventQueue();

      final state = bloc.state as GachaLoaded;
      expect(state.rollState, GachaAnimationState.idle);
      expect(state.rollResult, isNull);
      expect(state.rollCount, 1);
    });

    test('Roll failure handles network error gracefully and resets isRolling', () async {
      fakeRepo.statusResult = const ApiSuccess(GachaStatusEntity(freeCoins: 1000));
      bloc.add(const GachaStatusFetchRequested());
      await pumpEventQueue();

      fakeRepo.rollResult = const ApiFailure(message: 'Mất kết nối máy chủ', statusCode: 500);
      bloc.add(const GachaRollRequested(1));
      await pumpEventQueue();

      final state = bloc.state as GachaLoaded;
      expect(state.isRolling, false);
      expect(state.rollState, GachaAnimationState.idle);
      expect(state.errorMessage, 'Mất kết nối máy chủ');
    });

    test('Roll request is ignored when already rolling (anti-spam / debouncing)', () async {
      fakeRepo.statusResult = const ApiSuccess(GachaStatusEntity(freeCoins: 1000));
      bloc.add(const GachaStatusFetchRequested());
      await pumpEventQueue();

      // Mock a long-running roll
      fakeRepo.rollResult = const ApiSuccess(
        GachaRollResultEntity(
          cards: [
            GachaCardEntity(
              id: 1,
              title: 'Card 1',
              rarity: 'SSR',
              awakenedStars: 0,
              totalStars: 3,
              isNew: true,
              stardustEarned: 0,
            ),
          ],
          remainingCoins: 900,
          remainingStardust: 0,
          pitySR: 1,
          pitySSR: 1,
          pityUR: 1,
          usedFreePull: false,
          coinsSpent: 100,
        ),
      );

      // First roll
      bloc.add(const GachaRollRequested(1));
      await Future.delayed(Duration.zero);

      final stateDuringRoll = bloc.state as GachaLoaded;
      expect(stateDuringRoll.isRolling, true);

      // Second immediate roll should be ignored
      bloc.add(const GachaRollRequested(1));
      await Future.delayed(Duration.zero);

      expect((bloc.state as GachaLoaded).rollCount, 1);
    });
  });

  group('4. Gacha Presentation Widgets', () {
    testWidgets('GachaHeaderWidget renders Xu, Stardust, PRO and Pity bars', (tester) async {
      const status = GachaStatusEntity(
        freeCoins: 2500,
        stardust: 780,
        pitySR: 6,
        pitySSR: 32,
        pityUR: 95,
        isPro: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GachaHeaderWidget(
              status: status,
              onOpenWikiInventory: () {},
            ),
          ),
        ),
      );

      expect(find.text('Kho Thẻ'), findsOneWidget);
      expect(find.text('2500'), findsOneWidget);
      expect(find.text('780'), findsOneWidget);
      expect(find.text('PRO'), findsOneWidget);
      expect(find.text('6/10'), findsOneWidget);
      expect(find.text('32/50'), findsOneWidget);
      expect(find.text('95/120'), findsOneWidget);
    });

    testWidgets('GachaRollButton displays roll count and cost', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GachaRollButton(
              isRolling: false,
              isFreePullAvailable: false,
              userCoins: 500,
              costPerRoll: 100,
              onRoll: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Tìm Tri Thức x1'), findsOneWidget);
      expect(find.text('100 Xu'), findsOneWidget);
    });

    testWidgets('GachaInfoModal renders all rarity rates and rules', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GachaInfoModal(),
          ),
        ),
      );

      expect(find.text('CHI TIẾT CẦU NGUYỆN'), findsOneWidget);
      expect(find.text('CƠ CHẾ BẢO HIỂM (PITY)'), findsOneWidget);
      expect(find.text('XÁC SUẤT TRIỆU HỒI'), findsOneWidget);
      expect(find.text('0.05%'), findsOneWidget); // MR
      expect(find.text('4.00%'), findsOneWidget); // SSR
      expect(find.text('50.0%'), findsOneWidget); // N
    });

    testWidgets('GachaResultView renders x5 cards with mixed rarities and badges', (tester) async {
      bool closed = false;
      final cards = [
        const GachaCardEntity(
          id: 1,
          title: 'Card N',
          rarity: 'N',
          awakenedStars: 0,
          totalStars: 1,
          isNew: true,
          stardustEarned: 0,
        ),
        const GachaCardEntity(
          id: 2,
          title: 'Card R',
          rarity: 'R',
          awakenedStars: 1,
          totalStars: 2,
          isNew: false,
          stardustEarned: 1,
        ),
        const GachaCardEntity(
          id: 3,
          title: 'Card SR',
          rarity: 'SR',
          awakenedStars: 2,
          totalStars: 3,
          isNew: false,
          stardustEarned: 5,
        ),
        const GachaCardEntity(
          id: 4,
          title: 'Card SSR',
          rarity: 'SSR',
          awakenedStars: 0,
          totalStars: 3,
          isNew: true,
          stardustEarned: 0,
        ),
        const GachaCardEntity(
          id: 5,
          title: 'Card UR',
          rarity: 'UR',
          awakenedStars: 1,
          totalStars: 3,
          isNew: false,
          stardustEarned: 25,
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GachaResultView(
              cards: cards,
              bannerMessage: 'Đã rút 5 thẻ: 2 Mới, 3 Trùng',
              onClose: () => closed = true,
            ),
          ),
        ),
      );

      expect(find.text('Đã rút 5 thẻ: 2 Mới, 3 Trùng'), findsOneWidget);
      expect(find.text('NEW!'), findsNWidgets(2));
      expect(find.text('+1 Bụi sao'), findsOneWidget);
      expect(find.text('+5 Bụi sao'), findsOneWidget);
      expect(find.text('+25 Bụi sao'), findsOneWidget);
      expect(find.text('CHẠM VÀO MÀN HÌNH ĐỂ TIẾP TỤC'), findsOneWidget);

      await tester.tap(find.text('CHẠM VÀO MÀN HÌNH ĐỂ TIẾP TỤC'));
      expect(closed, true);
    });
  });
}

