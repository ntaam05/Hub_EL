import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/finish_wiki_study_usecase.dart';
import '../../domain/usecases/generate_wiki_study_usecase.dart';
import '../../domain/usecases/get_wiki_study_card_usecase.dart';
import '../../domain/usecases/keep_wiki_card_star_usecase.dart';
import 'wiki_study_event.dart';
import 'wiki_study_state.dart';

class WikiStudyBloc extends Bloc<WikiStudyEvent, WikiStudyState> {
  final GetWikiStudyCardUseCase getWikiStudyCardUseCase;
  final GenerateWikiStudyUseCase generateWikiStudyUseCase;
  final FinishWikiStudyUseCase finishWikiStudyUseCase;
  final KeepWikiCardStarUseCase keepWikiCardStarUseCase;

  WikiStudyBloc({
    required this.getWikiStudyCardUseCase,
    required this.generateWikiStudyUseCase,
    required this.finishWikiStudyUseCase,
    required this.keepWikiCardStarUseCase,
  }) : super(const WikiStudyState()) {
    on<WikiStudyInitRequested>(_onInitRequested);
    on<WikiStudyLanguageChanged>(_onLanguageChanged);
    on<WikiStudyLevelChanged>(_onLevelChanged);
    on<WikiStudyNumQuestionsChanged>(_onNumQuestionsChanged);
    on<WikiStudyTimeLimitChanged>(_onTimeLimitChanged);
    on<WikiStudyWordRangeChanged>(_onWordRangeChanged);
    on<WikiStudySkillToggled>(_onSkillToggled);
    on<WikiStudyGenerateRequested>(_onGenerateRequested);
    on<WikiStudyAnswerSelected>(_onAnswerSelected);
    on<WikiStudyAnswerConfirmed>(_onAnswerConfirmed);
    on<WikiStudyTimerTicked>(_onTimerTicked);
    on<WikiStudyFinishRequested>(_onFinishRequested);
    on<WikiStudyKeepStarRequested>(_onKeepStarRequested);
    on<WikiStudyResetRequested>(_onResetRequested);
  }

  Future<void> _onInitRequested(
    WikiStudyInitRequested event,
    Emitter<WikiStudyState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, clearError: true));

    final result = await getWikiStudyCardUseCase(event.cardId);

    result.fold(
      onSuccess: (cardData, _) {
        final initialMaxQs = (200 / 40).floor().clamp(2, 15);
        final initialQs = 3.clamp(2, initialMaxQs);

        String normalizedLang = 'Tiếng Anh';
        final tLang = cardData.targetLanguage.toLowerCase();
        if (tLang == 'ja' || tLang.contains('nhật')) {
          normalizedLang = 'Tiếng Nhật';
        } else if (tLang == 'ko' || tLang.contains('hàn')) {
          normalizedLang = 'Tiếng Hàn';
        } else if (tLang == 'zh' || tLang.contains('trung')) {
          normalizedLang = 'Tiếng Trung';
        } else if (tLang == 'fr' || tLang.contains('pháp')) {
          normalizedLang = 'Tiếng Pháp';
        } else if (tLang == 'de' || tLang.contains('đức')) {
          normalizedLang = 'Tiếng Đức';
        }

        emit(state.copyWith(
          step: WikiStudyStep.config,
          isLoading: false,
          card: cardData,
          currentAwakenedStars: cardData.awakenedStars,
          selectedLanguage: normalizedLang,
          selectedLevel: cardData.languageLevel.isNotEmpty ? cardData.languageLevel : 'A2',
          numQs: initialQs,
        ));
      },
      onFailure: (failure) {
        emit(state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        ));
      },
    );
  }

  void _onLanguageChanged(
    WikiStudyLanguageChanged event,
    Emitter<WikiStudyState> emit,
  ) {
    emit(state.copyWith(selectedLanguage: event.language));
  }

  void _onLevelChanged(
    WikiStudyLevelChanged event,
    Emitter<WikiStudyState> emit,
  ) {
    emit(state.copyWith(selectedLevel: event.level));
  }

  void _onNumQuestionsChanged(
    WikiStudyNumQuestionsChanged event,
    Emitter<WikiStudyState> emit,
  ) {
    final clamped = event.numQs.clamp(2, state.dynamicMaxQs);
    emit(state.copyWith(numQs: clamped));
  }

  void _onTimeLimitChanged(
    WikiStudyTimeLimitChanged event,
    Emitter<WikiStudyState> emit,
  ) {
    emit(state.copyWith(timeLimit: event.timeLimit));
  }

  void _onWordRangeChanged(
    WikiStudyWordRangeChanged event,
    Emitter<WikiStudyState> emit,
  ) {
    final maxQs = (event.wordMax / 40).floor().clamp(2, 15);
    final clampedQs = state.numQs > maxQs ? maxQs : state.numQs;

    emit(state.copyWith(
      wordMin: event.wordMin,
      wordMax: event.wordMax,
      numQs: clampedQs,
    ));
  }

  void _onSkillToggled(
    WikiStudySkillToggled event,
    Emitter<WikiStudyState> emit,
  ) {
    final list = List<String>.from(state.quizTypes);
    if (list.contains(event.skillId)) {
      if (list.length > 1) {
        list.remove(event.skillId);
      }
    } else {
      list.add(event.skillId);
    }
    emit(state.copyWith(quizTypes: list));
  }

  Future<void> _onGenerateRequested(
    WikiStudyGenerateRequested event,
    Emitter<WikiStudyState> emit,
  ) async {
    if (state.card == null) return;

    if (state.quizTypes.length < 2) {
      emit(state.copyWith(
        errorMessage: 'Vui lòng chọn ít nhất 2 kỹ năng bài tập!',
      ));
      return;
    }

    emit(state.copyWith(
      step: WikiStudyStep.loading,
      clearError: true,
      userAnswers: {},
      confirmedQuestions: {},
    ));

    final result = await generateWikiStudyUseCase(
      cardId: state.card!.cardId,
      language: state.selectedLanguage,
      level: state.selectedLevel,
      numQs: state.numQs,
      timeLimit: state.timeLimit,
      wordMin: state.wordMin,
      wordMax: state.wordMax,
      quizTypes: state.quizTypes,
    );

    result.fold(
      onSuccess: (session, _) {
        emit(state.copyWith(
          step: WikiStudyStep.study,
          session: session,
          timeLeft: session.timeLimit * 60,
          userAnswers: {},
          confirmedQuestions: {},
          currentAwakenedStars: session.awakenedStars,
        ));
      },
      onFailure: (failure) {
        emit(state.copyWith(
          step: WikiStudyStep.config,
          errorMessage: failure.message,
        ));
      },
    );
  }

  void _onAnswerSelected(
    WikiStudyAnswerSelected event,
    Emitter<WikiStudyState> emit,
  ) {
    if (state.confirmedQuestions.contains(event.questionIndex)) return;

    final updated = Map<int, dynamic>.from(state.userAnswers);
    updated[event.questionIndex] = event.answer;
    emit(state.copyWith(userAnswers: updated));
  }

  void _onAnswerConfirmed(
    WikiStudyAnswerConfirmed event,
    Emitter<WikiStudyState> emit,
  ) {
    if (!state.userAnswers.containsKey(event.questionIndex)) return;

    final updated = Set<int>.from(state.confirmedQuestions);
    updated.add(event.questionIndex);
    emit(state.copyWith(confirmedQuestions: updated));
  }

  void _onTimerTicked(
    WikiStudyTimerTicked event,
    Emitter<WikiStudyState> emit,
  ) {
    if (state.step != WikiStudyStep.study || state.timeLimit == 0) return;

    if (state.timeLeft <= 1) {
      emit(state.copyWith(timeLeft: 0));
      add(const WikiStudyFinishRequested());
    } else {
      emit(state.copyWith(timeLeft: state.timeLeft - 1));
    }
  }

  Future<void> _onFinishRequested(
    WikiStudyFinishRequested event,
    Emitter<WikiStudyState> emit,
  ) async {
    if (state.session == null || state.isLoading) return;

    emit(state.copyWith(isLoading: true, clearError: true));

    final totalQ = state.session!.quizzes.length;
    final formattedAnswers = List.generate(
      totalQ,
      (i) => state.userAnswers[i] ?? '',
    );

    final result = await finishWikiStudyUseCase(
      sessionId: state.session!.sessionId,
      sessionToken: state.session!.sessionToken,
      answers: formattedAnswers,
      cardId: state.card?.cardId,
    );

    result.fold(
      onSuccess: (studyResult, _) {
        emit(state.copyWith(
          step: WikiStudyStep.result,
          isLoading: false,
          result: studyResult,
          currentAwakenedStars: studyResult.newAwakenedStars,
          isStarRestored: false,
        ));
      },
      onFailure: (failure) {
        emit(state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        ));
      },
    );
  }

  Future<void> _onKeepStarRequested(
    WikiStudyKeepStarRequested event,
    Emitter<WikiStudyState> emit,
  ) async {
    if (state.result == null || state.isKeepingStar) return;

    emit(state.copyWith(isKeepingStar: true, clearError: true));

    final result = await keepWikiCardStarUseCase(state.result!.attemptId);

    result.fold(
      onSuccess: (data, _) {
        final newStars = (data['newAwakenedStars'] as int?) ?? (state.currentAwakenedStars + 1);
        emit(state.copyWith(
          isKeepingStar: false,
          isStarRestored: true,
          currentAwakenedStars: newStars,
        ));
      },
      onFailure: (failure) {
        emit(state.copyWith(
          isKeepingStar: false,
          errorMessage: failure.message,
        ));
      },
    );
  }

  void _onResetRequested(
    WikiStudyResetRequested event,
    Emitter<WikiStudyState> emit,
  ) {
    if (state.card != null) {
      add(WikiStudyInitRequested(state.card!.cardId));
    }
  }
}
