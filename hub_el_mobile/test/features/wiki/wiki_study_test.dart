import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/wiki/data/models/wiki_study_card_model.dart';
import 'package:hub_el_mobile/features/wiki/data/models/wiki_study_result_model.dart';
import 'package:hub_el_mobile/features/wiki/data/models/wiki_study_session_model.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/user_inventory_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/wiki_study_card_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/wiki_study_result_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/entities/wiki_study_session_entity.dart';
import 'package:hub_el_mobile/features/wiki/domain/repositories/wiki_repository.dart';
import 'package:hub_el_mobile/features/wiki/domain/usecases/finish_wiki_study_usecase.dart';
import 'package:hub_el_mobile/features/wiki/domain/usecases/generate_wiki_study_usecase.dart';
import 'package:hub_el_mobile/features/wiki/domain/usecases/get_wiki_study_card_usecase.dart';
import 'package:hub_el_mobile/features/wiki/domain/usecases/keep_wiki_card_star_usecase.dart';
import 'package:hub_el_mobile/features/wiki/presentation/bloc/wiki_study_bloc.dart';
import 'package:hub_el_mobile/features/wiki/presentation/bloc/wiki_study_event.dart';
import 'package:hub_el_mobile/features/wiki/presentation/bloc/wiki_study_state.dart';

class FakeWikiRepository implements IWikiRepository {
  ApiResult<WikiStudyCardEntity>? cardResult;
  ApiResult<WikiStudySessionEntity>? sessionResult;
  ApiResult<WikiStudyResultEntity>? finishResult;
  ApiResult<Map<String, dynamic>>? keepStarResult;

  @override
  Future<ApiResult<List<UserInventoryEntity>>> getInventory() async {
    throw UnimplementedError();
  }

  @override
  Future<ApiResult<WikiStudyCardEntity>> getWikiStudyCard(int cardId) async {
    return cardResult!;
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
    return sessionResult!;
  }

  @override
  Future<ApiResult<WikiStudyResultEntity>> finishWikiStudy({
    required String sessionId,
    String? sessionToken,
    required List<dynamic> answers,
    int? cardId,
  }) async {
    return finishResult!;
  }

  @override
  Future<ApiResult<Map<String, dynamic>>> keepWikiCardStar(int attemptId) async {
    return keepStarResult!;
  }
}

void main() {
  group('Wiki Study Models and JSON Parsing', () {
    test('WikiStudyCardModel parses valid JSON correctly', () {
      final json = {
        'card': {
          'id': 101,
          'title': 'Quantum Physics',
          'rarity': 'UR',
          'imageUrl': 'https://example.com/quantum.png',
          'wikiUrl': 'https://en.wikipedia.org/wiki/Quantum_mechanics',
          'totalStars': 5,
          'awakenedStars': 2,
        },
        'inventory': {
          'currentStar': 2,
          'isCompleted': false,
        },
        'user': {
          'aiTokens': 450,
          'maxEnergy': 200,
          'freeCoins': 100,
          'isPro': true,
          'level': 10,
          'xp': 1200,
          'targetLanguage': 'Tiếng Nhật',
          'languageLevel': 'B1',
          'energyCost': 40,
        },
      };

      final model = WikiStudyCardModel.fromJson(json);
      expect(model.cardId, 101);
      expect(model.title, 'Quantum Physics');
      expect(model.rarity, 'UR');
      expect(model.aiTokens, 450);
      expect(model.awakenedStars, 2);
      expect(model.totalStars, 5);
      expect(model.targetLanguage, 'Tiếng Nhật');
      expect(model.languageLevel, 'B1');
      expect(model.energyCost, 40);
    });

    test('WikiStudySessionModel parses quizzes and vocabularies', () {
      final json = {
        'sessionId': 'session_abc',
        'sessionToken': 'jwt_signed_token',
        'timeLimit': 10,
        'aiEnergySpent': 40,
        'remainingEnergy': 160,
        'simplifiedText': 'Quantum mechanics is fundamental physics.',
        'card': {
          'id': 101,
          'title': 'Quantum Physics',
          'rarity': 'UR',
          'totalStars': 5,
          'awakenedStars': 2,
        },
        'vocabularies': [
          {
            'word': 'Quantum',
            'pos': 'N',
            'meaning': 'Lượng tử',
            'englishDesc': 'The minimum amount of any physical entity.',
          }
        ],
        'quizzes': [
          {
            'index': 0,
            'question': 'What is quantum mechanics?',
            'options': ['Physics', 'Chemistry', 'Biology', 'History'],
            'type': 'multiple_choice',
          }
        ],
      };

      final session = WikiStudySessionModel.fromJson(json);
      expect(session.sessionId, 'session_abc');
      expect(session.sessionToken, 'jwt_signed_token');
      expect(session.timeLimit, 10);
      expect(session.aiEnergySpent, 40);
      expect(session.remainingEnergy, 160);
      expect(session.simplifiedText, contains('Quantum mechanics'));
      expect(session.quizzes.length, 1);
      expect(session.quizzes.first.options.length, 4);
      expect(session.vocabularies.length, 1);
      expect(session.vocabularies.first.word, 'Quantum');
    });

    test('WikiStudyResultModel parses pass and fail states', () {
      final passJson = {
        'attemptId': 99,
        'cardId': 101,
        'score': 80,
        'correctCount': 4,
        'totalQuizzes': 5,
        'isPass': true,
        'expGained': 100,
        'gainedCoins': 20,
        'newLevel': 5,
        'leveledUp': false,
        'currentStreak': 7,
        'newAwakenedStars': 3,
        'currentStar': 3,
        'isLostStar': false,
        'quizzes': [
          {
            'index': 0,
            'question': 'Q1',
            'options': ['A', 'B'],
            'userAnswer': 'A',
            'correctAnswers': ['A'],
            'isCorrect': true,
            'explanation': 'Correct',
          }
        ],
      };

      final result = WikiStudyResultModel.fromJson(passJson);
      expect(result.attemptId, 99);
      expect(result.isPass, isTrue);
      expect(result.newAwakenedStars, 3);
      expect(result.expGained, 100);
      expect(result.gainedCoins, 20);
      expect(result.quizzes.first.isCorrect, isTrue);
    });
  });

  group('WikiStudyBloc State Transitions & Business Rules', () {
    late FakeWikiRepository repository;
    late GetWikiStudyCardUseCase getCardUseCase;
    late GenerateWikiStudyUseCase generateUseCase;
    late FinishWikiStudyUseCase finishUseCase;
    late KeepWikiCardStarUseCase keepStarUseCase;

    const dummyCard = WikiStudyCardEntity(
      cardId: 1,
      title: 'Calculus',
      rarity: 'SSR',
      imageUrl: 'https://example.com/math.png',
      wikiUrl: 'https://en.wikipedia.org/wiki/Calculus',
      totalStars: 5,
      awakenedStars: 1,
      currentStar: 1,
      isCompleted: false,
      aiTokens: 300,
      maxEnergy: 200,
      freeCoins: 50,
      isPro: false,
      level: 5,
      xp: 500,
      targetLanguage: 'Tiếng Anh',
      languageLevel: 'B1',
      energyCost: 40,
    );

    const dummySession = WikiStudySessionEntity(
      sessionId: 'sess_123',
      sessionToken: 'jwt_token',
      cardId: 1,
      cardTitle: 'Calculus',
      cardRarity: 'SSR',
      totalStars: 5,
      awakenedStars: 1,
      timeLimit: 5,
      simplifiedText: 'Limits define continuity and derivatives.',
      vocabularies: [
        WikiVocabularyEntity(
          word: 'Limit',
          pos: 'N',
          meaning: 'Giới hạn',
          englishDesc: 'A point or value that a sequence approaches.',
        )
      ],
      quizzes: [
        WikiStudyQuestionEntity(
          index: 0,
          type: 'multiple_choice',
          question: 'What do limits define?',
          options: ['Continuity', 'Cooking', 'Music', 'Drawing'],
        ),
        WikiStudyQuestionEntity(
          index: 1,
          type: 'true_false',
          question: 'Is calculus useful?',
          options: ['Yes', 'No'],
        ),
      ],
      aiEnergySpent: 40,
      remainingEnergy: 260,
    );

    const dummyPassResult = WikiStudyResultEntity(
      attemptId: 50,
      cardId: 1,
      score: 100,
      correctCount: 2,
      totalQuizzes: 2,
      isPass: true,
      expGained: 150,
      gainedCoins: 30,
      newLevel: 6,
      leveledUp: true,
      currentStreak: 3,
      newAwakenedStars: 2,
      currentStar: 2,
      isLostStar: false,
      quizzes: [
        GradedQuizEntity(
          index: 0,
          type: 'multiple_choice',
          question: 'What do limits define?',
          options: ['Continuity', 'Cooking'],
          userAnswer: 'Continuity',
          correctAnswers: ['Continuity'],
          isCorrect: true,
          explanation: 'They define continuity.',
        )
      ],
    );

    setUp(() {
      repository = FakeWikiRepository();
      getCardUseCase = GetWikiStudyCardUseCase(repository: repository);
      generateUseCase = GenerateWikiStudyUseCase(repository: repository);
      finishUseCase = FinishWikiStudyUseCase(repository: repository);
      keepStarUseCase = KeepWikiCardStarUseCase(repository: repository);
    });

    test('Initializes with default config and clamps numQs properly', () async {
      repository.cardResult = const ApiSuccess(dummyCard);

      final bloc = WikiStudyBloc(
        getWikiStudyCardUseCase: getCardUseCase,
        generateWikiStudyUseCase: generateUseCase,
        finishWikiStudyUseCase: finishUseCase,
        keepWikiCardStarUseCase: keepStarUseCase,
      );

      bloc.add(const WikiStudyInitRequested(1));

      await expectLater(
        bloc.stream,
        emitsInOrder([
          predicate<WikiStudyState>((s) => s.isLoading && s.step == WikiStudyStep.config),
          predicate<WikiStudyState>((s) =>
              !s.isLoading &&
              s.card?.cardId == 1 &&
              s.selectedLanguage == 'Tiếng Anh' &&
              s.selectedLevel == 'B1' &&
              s.currentAwakenedStars == 1 &&
              s.numQs >= 2),
        ]),
      );
    });

    test('Skill toggling enforces at least 1 active skill', () async {
      repository.cardResult = const ApiSuccess(dummyCard);

      final bloc = WikiStudyBloc(
        getWikiStudyCardUseCase: getCardUseCase,
        generateWikiStudyUseCase: generateUseCase,
        finishWikiStudyUseCase: finishUseCase,
        keepWikiCardStarUseCase: keepStarUseCase,
      );

      bloc.add(const WikiStudyInitRequested(1));
      await bloc.stream.firstWhere((s) => !s.isLoading);

      // Default skills has 5: multiple_choice, true_false, main_idea, inference, guess_meaning
      expect(bloc.state.quizTypes.length, 5);

      // Remove skills until 1 remains ('multiple_choice')
      bloc.add(const WikiStudySkillToggled('true_false'));
      bloc.add(const WikiStudySkillToggled('main_idea'));
      bloc.add(const WikiStudySkillToggled('inference'));
      bloc.add(const WikiStudySkillToggled('guess_meaning'));
      await pumpEventQueue();
      expect(bloc.state.quizTypes.length, 1);
      expect(bloc.state.quizTypes.contains('multiple_choice'), isTrue);

      // Attempt to remove the last remaining skill -> BLOCKED (must have at least 1)
      bloc.add(const WikiStudySkillToggled('multiple_choice'));
      await pumpEventQueue();
      expect(bloc.state.quizTypes.length, 1);
      expect(bloc.state.quizTypes.contains('multiple_choice'), isTrue);
    });

    test('Full study flow: Generate -> Select Answer -> Confirm -> Finish -> Pass Result', () async {
      repository.cardResult = const ApiSuccess(dummyCard);
      repository.sessionResult = const ApiSuccess(dummySession);
      repository.finishResult = const ApiSuccess(dummyPassResult);

      final bloc = WikiStudyBloc(
        getWikiStudyCardUseCase: getCardUseCase,
        generateWikiStudyUseCase: generateUseCase,
        finishWikiStudyUseCase: finishUseCase,
        keepWikiCardStarUseCase: keepStarUseCase,
      );

      bloc.add(const WikiStudyInitRequested(1));
      await bloc.stream.firstWhere((s) => !s.isLoading);

      // 1. Generate study
      bloc.add(const WikiStudyGenerateRequested());
      await bloc.stream.firstWhere((s) => s.step == WikiStudyStep.study);

      expect(bloc.state.step, WikiStudyStep.study);
      expect(bloc.state.session?.quizzes.length, 2);
      expect(bloc.state.timeLeft, 300); // 5 mins * 60s

      // 2. Select answer for Q0 and Q1
      bloc.add(const WikiStudyAnswerSelected(questionIndex: 0, answer: 'Continuity'));
      await pumpEventQueue();
      expect(bloc.state.userAnswers[0], 'Continuity');

      bloc.add(const WikiStudyAnswerSelected(questionIndex: 1, answer: 'Yes'));
      await pumpEventQueue();
      expect(bloc.state.userAnswers[1], 'Yes');

      // 3. Confirm Q0
      bloc.add(const WikiStudyAnswerConfirmed(0));
      await pumpEventQueue();
      expect(bloc.state.confirmedQuestions.contains(0), isTrue);

      // Attempting to change confirmed answer should be locked
      bloc.add(const WikiStudyAnswerSelected(questionIndex: 0, answer: 'Cooking'));
      await pumpEventQueue();
      expect(bloc.state.userAnswers[0], 'Continuity'); // Not changed!

      // 4. Finish study
      bloc.add(const WikiStudyFinishRequested());
      await bloc.stream.firstWhere((s) => s.step == WikiStudyStep.result);

      expect(bloc.state.step, WikiStudyStep.result);
      expect(bloc.state.result?.isPass, isTrue);
      expect(bloc.state.currentAwakenedStars, 2);
      expect(bloc.state.result?.newLevel, 6);
      expect(bloc.state.result?.leveledUp, isTrue);
    });

    test('Keep Star flow rescues lost star and updates state', () async {
      const failResult = WikiStudyResultEntity(
        attemptId: 60,
        cardId: 1,
        score: 30,
        correctCount: 1,
        totalQuizzes: 3,
        isPass: false,
        expGained: 10,
        gainedCoins: 0,
        newLevel: 5,
        leveledUp: false,
        currentStreak: 3,
        newAwakenedStars: 0,
        currentStar: 0,
        isLostStar: true,
        quizzes: [],
      );

      repository.cardResult = const ApiSuccess(dummyCard);
      repository.sessionResult = const ApiSuccess(dummySession);
      repository.finishResult = const ApiSuccess(failResult);
      repository.keepStarResult = const ApiSuccess({
        'success': true,
        'newAwakenedStars': 1,
        'coinsLeft': 150,
      });

      final bloc = WikiStudyBloc(
        getWikiStudyCardUseCase: getCardUseCase,
        generateWikiStudyUseCase: generateUseCase,
        finishWikiStudyUseCase: finishUseCase,
        keepWikiCardStarUseCase: keepStarUseCase,
      );

      bloc.add(const WikiStudyInitRequested(1));
      await bloc.stream.firstWhere((s) => !s.isLoading);

      bloc.add(const WikiStudyGenerateRequested());
      await bloc.stream.firstWhere((s) => s.step == WikiStudyStep.study);

      bloc.add(const WikiStudyFinishRequested());
      await bloc.stream.firstWhere((s) => s.step == WikiStudyStep.result);

      expect(bloc.state.result?.isPass, isFalse);
      expect(bloc.state.currentAwakenedStars, 0);
      expect(bloc.state.isStarRestored, isFalse);

      // Request Keep Star rescue
      bloc.add(const WikiStudyKeepStarRequested());
      await bloc.stream.firstWhere((s) => s.isStarRestored);

      expect(bloc.state.isStarRestored, isTrue);
      expect(bloc.state.currentAwakenedStars, 1);
    });
  });
}
