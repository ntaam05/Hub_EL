import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/wiki/data/models/user_inventory_model.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/user_inventory_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/wiki_card_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/wiki_quiz_attempt_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/repositories/wiki_repository.dart';
import 'package:hub_el_mobile/features/wiki/domain/usecases/get_wiki_inventory_usecase.dart';
import 'package:hub_el_mobile/features/wiki/presentation/bloc/wiki_manager_bloc.dart';
import 'package:hub_el_mobile/features/wiki/presentation/bloc/wiki_manager_event.dart';
import 'package:hub_el_mobile/features/wiki/presentation/bloc/wiki_manager_state.dart';

import 'package:hub_el_mobile/features/wiki/domain/entities/wiki_study_card_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/wiki_study_session_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/wiki_study_result_entity.dart';

class MockWikiRepository implements IWikiRepository {
  ApiResult<List<UserInventoryEntity>> result;

  MockWikiRepository(this.result);

  @override
  Future<ApiResult<List<UserInventoryEntity>>> getInventory() async {
    return result;
  }

  @override
  Future<ApiResult<WikiStudyCardEntity>> getWikiStudyCard(int cardId) async {
    throw UnimplementedError();
  }

  @override
  Future<ApiResult<WikiStudySessionEntity>> generateWikiStudy({
    required int cardId,
    String? language,
    String? level,
    int? numQs,
    int? timeLimit,
    int? wordMin,
    int? wordMax,
    List<String>? quizTypes,
  }) async {
    throw UnimplementedError();
  }

  @override
  Future<ApiResult<WikiStudyResultEntity>> finishWikiStudy({
    required String sessionId,
    String? sessionToken,
    required List<dynamic> answers,
    int? cardId,
  }) async {
    throw UnimplementedError();
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> keepWikiCardStar(int attemptId) async {
    throw UnimplementedError();
  }
}

void main() {
  group('Wiki Entities and Models', () {
    test('WikiQuizAttemptEntity isPass logic', () {
      final passAttempt = WikiQuizAttemptEntity(
        id: 1,
        cardId: 10,
        score: 2,
        correctCount: 2,
        totalQuizzes: 3,
        createdAt: DateTime.now(),
      );
      expect(passAttempt.isPass, isTrue);

      final failAttempt = WikiQuizAttemptEntity(
        id: 2,
        cardId: 10,
        score: 1,
        correctCount: 1,
        totalQuizzes: 3,
        createdAt: DateTime.now(),
      );
      expect(failAttempt.isPass, isFalse);
    });

    test('WikiCardEntity rarityWeight and effectiveWikiUrl', () {
      const cardMR = WikiCardEntity(id: 1, title: 'Card MR', rarity: 'MR');
      const cardN = WikiCardEntity(id: 2, title: 'Card N', rarity: 'N');
      expect(cardMR.rarityWeight, equals(7));
      expect(cardN.rarityWeight, equals(1));
      expect(cardMR.rarityWeight > cardN.rarityWeight, isTrue);

      const cardCustomUrl = WikiCardEntity(
        id: 3,
        title: 'Custom Card',
        wikiUrl: 'https://en.wikipedia.org/wiki/Special',
      );
      expect(cardCustomUrl.effectiveWikiUrl, equals('https://en.wikipedia.org/wiki/Special'));

      const cardFallbackUrl = WikiCardEntity(
        id: 4,
        title: 'Thuyết Tương Đối',
      );
      expect(cardFallbackUrl.effectiveWikiUrl, contains('vi.wikipedia.org'));
    });

    test('UserInventoryModel.fromJson parses owned and unowned cards correctly', () {
      // 1. Owned card with attempts
      final ownedJson = {
        'id': 100,
        'cardId': 54,
        'isOwned': true,
        'acquiredAt': '2026-05-13T04:24:02.300Z',
        'isNew': false,
        'currentStar': 2,
        'card': {
          'id': 54,
          'title': 'Ferula gummosa',
          'rarity': 'SSR',
          'imageUrl': 'https://example.com/plant.jpg',
          'totalStars': 4,
          'awakenedStars': 2,
          'attempts': [
            {
              'id': 1,
              'cardId': 54,
              'score': 2.0,
              'correctCount': 2,
              'totalQuizzes': 3,
              'createdAt': '2026-05-13T04:24:02.300Z',
              'userAnswers': '["1", "0", "2"]',
              'lessonSnapshot': '{"simplifiedText":"Sample text","quizzes":[{"type":"multiple_choice","question":"Q1?","options":["A","B"],"correctAnswers":["A"],"explanation":"Exp"}]}'
            }
          ]
        }
      };

      final ownedModel = UserInventoryModel.fromJson(ownedJson);
      expect(ownedModel.id, equals(100));
      expect(ownedModel.isOwned, isTrue);
      expect(ownedModel.card.title, equals('Ferula gummosa'));
      expect(ownedModel.card.rarity, equals('SSR'));
      expect(ownedModel.card.attempts.length, equals(1));
      expect(ownedModel.card.attempts.first.correctCount, equals(2));
      expect(ownedModel.card.isStudied, isTrue);

      // 2. Unowned card (id is null, isOwned is false, attempts empty)
      final unownedJson = {
        'id': null,
        'cardId': 99,
        'isOwned': false,
        'acquiredAt': null,
        'currentStar': 0,
        'card': {
          'id': 99,
          'title': 'Quantum Physics',
          'rarity': 'UR',
          'totalStars': 5,
          'awakenedStars': 0,
          'attempts': []
        }
      };

      final unownedModel = UserInventoryModel.fromJson(unownedJson);
      expect(unownedModel.id, isNull);
      expect(unownedModel.isOwned, isFalse);
      expect(unownedModel.acquiredAt, isNull);
      expect(unownedModel.card.title, equals('Quantum Physics'));
      expect(unownedModel.card.attempts, isEmpty);
      expect(unownedModel.card.isStudied, isFalse);
    });

    test('Robust parsing: handles corrupt or missing JSON snapshot gracefully', () {
      final corruptJson = {
        'id': 101,
        'cardId': 55,
        'isOwned': true,
        'card': {
          'id': 55,
          'title': 'Test Card',
          'attempts': [
            {
              'id': 1,
              'cardId': 55,
              'score': 0,
              'correctCount': 0,
              'totalQuizzes': 0,
              'userAnswers': 'INVALID_NOT_JSON',
              'lessonSnapshot': '{corrupt_json: true}'
            }
          ]
        }
      };

      expect(() => UserInventoryModel.fromJson(corruptJson), returnsNormally);
      final model = UserInventoryModel.fromJson(corruptJson);
      expect(model.card.attempts.first.userAnswers, isEmpty);
      expect(model.card.attempts.first.quizzes, isEmpty);
    });
  });

  group('WikiManagerBloc', () {
    late UserInventoryEntity cardStudied;
    late UserInventoryEntity cardUnstudiedOwned;
    late UserInventoryEntity cardUnownedMR;

    setUp(() {
      cardStudied = UserInventoryEntity(
        id: 1,
        cardId: 10,
        isOwned: true,
        acquiredAt: DateTime(2026, 5, 1),
        card: WikiCardEntity(
          id: 10,
          title: 'Zebra',
          rarity: 'R',
          attempts: [
            WikiQuizAttemptEntity(
              id: 1,
              cardId: 10,
              score: 3,
              correctCount: 3,
              totalQuizzes: 3,
              createdAt: DateTime.now(),
            ),
          ],
        ),
      );

      cardUnstudiedOwned = UserInventoryEntity(
        id: 2,
        cardId: 20,
        isOwned: true,
        acquiredAt: DateTime(2026, 5, 10),
        card: const WikiCardEntity(
          id: 20,
          title: 'Apple',
          rarity: 'SSR',
          attempts: [],
        ),
      );

      cardUnownedMR = const UserInventoryEntity(
        id: null,
        cardId: 30,
        isOwned: false,
        acquiredAt: null,
        card: WikiCardEntity(
          id: 30,
          title: 'Dragon',
          rarity: 'MR',
          attempts: [],
        ),
      );
    });

    test('emits [WikiManagerLoading, WikiManagerLoaded] on fetch success', () async {
      final repo = MockWikiRepository(ApiSuccess([cardStudied, cardUnstudiedOwned, cardUnownedMR]));
      final useCase = GetWikiInventoryUseCase(repo);
      final bloc = WikiManagerBloc(getWikiInventoryUseCase: useCase);

      expectLater(
        bloc.stream,
        emitsInOrder([
          const WikiManagerLoading(),
          isA<WikiManagerLoaded>().having((s) => s.allInventory.length, 'all count', 3),
        ]),
      );

      bloc.add(const WikiInventoryFetchRequested());
    });

    test('filters owned and unowned correctly', () async {
      final repo = MockWikiRepository(ApiSuccess([cardStudied, cardUnstudiedOwned, cardUnownedMR]));
      final useCase = GetWikiInventoryUseCase(repo);
      final bloc = WikiManagerBloc(getWikiInventoryUseCase: useCase);

      bloc.add(const WikiInventoryFetchRequested());
      await pumpEventQueue();

      // Filter: OWNED
      bloc.add(const WikiFilterChanged(WikiFilter.owned));
      await pumpEventQueue();
      var state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory.length, equals(2));
      expect(state.filteredInventory.every((i) => i.isOwned), isTrue);

      // Filter: UNOWNED
      bloc.add(const WikiFilterChanged(WikiFilter.unowned));
      await pumpEventQueue();
      state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory.length, equals(1));
      expect(state.filteredInventory.first.card.title, equals('Dragon'));
      expect(state.filteredInventory.first.isOwned, isFalse);
    });

    test('filters studied and unstudied correctly', () async {
      final repo = MockWikiRepository(ApiSuccess([cardStudied, cardUnstudiedOwned, cardUnownedMR]));
      final useCase = GetWikiInventoryUseCase(repo);
      final bloc = WikiManagerBloc(getWikiInventoryUseCase: useCase);

      bloc.add(const WikiInventoryFetchRequested());
      await pumpEventQueue();

      // Filter: STUDIED
      bloc.add(const WikiFilterChanged(WikiFilter.studied));
      await pumpEventQueue();
      var state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory.length, equals(1));
      expect(state.filteredInventory.first.card.title, equals('Zebra'));

      // Filter: UNSTUDIED
      bloc.add(const WikiFilterChanged(WikiFilter.unstudied));
      await pumpEventQueue();
      state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory.length, equals(2));
    });

    test('filters by rarity correctly', () async {
      final repo = MockWikiRepository(ApiSuccess([cardStudied, cardUnstudiedOwned, cardUnownedMR]));
      final useCase = GetWikiInventoryUseCase(repo);
      final bloc = WikiManagerBloc(getWikiInventoryUseCase: useCase);

      bloc.add(const WikiInventoryFetchRequested());
      await pumpEventQueue();

      // Filter Rarity: MR
      bloc.add(const WikiRarityFilterChanged('MR'));
      await pumpEventQueue();
      var state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory.length, equals(1));
      expect(state.filteredInventory.first.card.rarity, equals('MR'));

      // Clear Rarity Filter
      bloc.add(const WikiRarityFilterChanged(null));
      await pumpEventQueue();
      state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory.length, equals(3));
    });

    test('sorts by RARITY, NAME, and NEWEST correctly', () async {
      final repo = MockWikiRepository(ApiSuccess([cardStudied, cardUnstudiedOwned, cardUnownedMR]));
      final useCase = GetWikiInventoryUseCase(repo);
      final bloc = WikiManagerBloc(getWikiInventoryUseCase: useCase);

      bloc.add(const WikiInventoryFetchRequested());
      await pumpEventQueue();

      // Sort: RARITY (MR=7, SSR=4, R=2)
      bloc.add(const WikiSortChanged(WikiSort.rarity));
      await pumpEventQueue();
      var state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory[0].card.rarity, equals('MR'));
      expect(state.filteredInventory[1].card.rarity, equals('SSR'));
      expect(state.filteredInventory[2].card.rarity, equals('R'));

      // Sort: NAME (Apple < Dragon < Zebra)
      bloc.add(const WikiSortChanged(WikiSort.name));
      await pumpEventQueue();
      state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory[0].card.title, equals('Apple'));
      expect(state.filteredInventory[1].card.title, equals('Dragon'));
      expect(state.filteredInventory[2].card.title, equals('Zebra'));

      // Sort: NEWEST (Owned newest first: Apple (May 10) > Zebra (May 1) > unowned Dragon)
      bloc.add(const WikiSortChanged(WikiSort.newest));
      await pumpEventQueue();
      state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory[0].card.title, equals('Apple'));
      expect(state.filteredInventory[1].card.title, equals('Zebra'));
      expect(state.filteredInventory[2].card.title, equals('Dragon'));
    });

    test('searches by card title query', () async {
      final repo = MockWikiRepository(ApiSuccess([cardStudied, cardUnstudiedOwned, cardUnownedMR]));
      final useCase = GetWikiInventoryUseCase(repo);
      final bloc = WikiManagerBloc(getWikiInventoryUseCase: useCase);

      bloc.add(const WikiInventoryFetchRequested());
      await pumpEventQueue();

      bloc.add(const WikiSearchChanged('drag'));
      await pumpEventQueue();
      final state = bloc.state as WikiManagerLoaded;
      expect(state.filteredInventory.length, equals(1));
      expect(state.filteredInventory.first.card.title, equals('Dragon'));
    });

    test('emits WikiManagerError when use case fails', () async {
      final repo = MockWikiRepository(const ApiFailure(message: 'Mất kết nối mạng!'));
      final useCase = GetWikiInventoryUseCase(repo);
      final bloc = WikiManagerBloc(getWikiInventoryUseCase: useCase);

      expectLater(
        bloc.stream,
        emitsInOrder([
          const WikiManagerLoading(),
          const WikiManagerError('Mất kết nối mạng!'),
        ]),
      );

      bloc.add(const WikiInventoryFetchRequested());
    });
  });
}
