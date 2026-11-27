import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/quiz_question_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/quiz_result_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/generate_quiz_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/submit_quiz_usecase.dart';
import 'quiz_event.dart';
import 'quiz_state.dart';

class QuizBloc extends Bloc<QuizEvent, QuizState> {
  final GenerateQuizUseCase generateQuizUseCase;
  final GenerateNextQuestionUseCase? generateNextQuestionUseCase;
  final SubmitQuizUseCase submitQuizUseCase;

  QuizBloc({
    required this.generateQuizUseCase,
    this.generateNextQuestionUseCase,
    required this.submitQuizUseCase,
  }) : super(const QuizInitial()) {
    on<GenerateQuizRequested>(_onGenerateQuizRequested);
    on<QuizAnswerSelected>(_onAnswerSelected);
    on<QuizNextQuestionRequested>(_onNextQuestionRequested);
    on<QuizSubmitRequested>(_onSubmitRequested);
    on<QuizDismissRewardModal>(_onDismissRewardModal);
    on<QuizRetryRequested>(_onRetryRequested);
    on<QuizResetRequested>(_onResetRequested);
  }

  Future<void> _onGenerateQuizRequested(
    GenerateQuizRequested event,
    Emitter<QuizState> emit,
  ) async {
    emit(QuizGenerating(count: event.count));

    final result = await generateQuizUseCase(
      videoId: event.videoId,
      count: event.count,
      mode: 'adaptive',
    );

    if (result is ApiSuccess<QuizGeneratedEntity>) {
      emit(QuizLoaded(
        videoId: event.videoId,
        questions: result.data.questions,
        totalCount: event.count,
        currentIndex: 0,
        difficultyLevel: 2,
        questionDifficulties: const {0: 2},
        userAnswers: const {},
      ));
    } else if (result is ApiFailure<QuizGeneratedEntity>) {
      emit(QuizError(message: result.message));
    }
  }

  void _onAnswerSelected(
    QuizAnswerSelected event,
    Emitter<QuizState> emit,
  ) {
    if (state is QuizLoaded) {
      final current = state as QuizLoaded;
      if (current.isSubmitted) return; // Không cho sửa đáp án khi đã nộp bài
      if (current.userAnswers.containsKey(event.questionIndex)) return;

      final updatedAnswers = Map<int, String>.from(current.userAnswers);
      updatedAnswers[event.questionIndex] = event.option;

      emit(current.copyWith(
        userAnswers: updatedAnswers,
        clearNextQuestionError: true,
      ));
    }
  }

  Future<void> _onNextQuestionRequested(
    QuizNextQuestionRequested event,
    Emitter<QuizState> emit,
  ) async {
    if (state is! QuizLoaded) return;
    final current = state as QuizLoaded;
    if (current.isLoadingNext || current.isSubmitted) return;

    final idx = current.currentIndex;
    final selected = current.userAnswers[idx];
    if (selected == null) return;

    // Nếu câu tiếp theo đã có sẵn (ví dụ khi làm lại bài), chuyển tiếp luôn
    if (idx + 1 < current.questions.length) {
      emit(current.copyWith(
        currentIndex: idx + 1,
        clearNextQuestionError: true,
      ));
      return;
    }

    final currentQuestion = current.questions[idx];
    final isCorrect = selected.trim().toUpperCase() ==
        currentQuestion.correctAnswer.trim().toUpperCase();
    final currentDiff = current.questionDifficulties[idx] ?? current.difficultyLevel;
    final nextLevel = isCorrect
        ? (currentDiff + 1).clamp(1, 5)
        : (currentDiff - 1).clamp(1, 5);

    emit(current.copyWith(isLoadingNext: true, clearNextQuestionError: true));

    final prevTexts = current.questions.map((q) => q.questionText).toList();
    final result = generateNextQuestionUseCase != null
        ? await generateNextQuestionUseCase!(
            videoId: current.videoId,
            difficultyLevel: nextLevel,
            previousQuestions: prevTexts,
          )
        : await generateQuizUseCase.repository.generateNextQuestion(
            videoId: current.videoId,
            difficultyLevel: nextLevel,
            previousQuestions: prevTexts,
          );

    if (result is ApiSuccess<QuizQuestionEntity>) {
      final updatedQuestions = List<QuizQuestionEntity>.from(current.questions)
        ..add(result.data);
      final nextIdx = updatedQuestions.length - 1;
      final updatedDiffs = Map<int, int>.from(current.questionDifficulties);
      updatedDiffs[nextIdx] = nextLevel;

      emit(current.copyWith(
        questions: updatedQuestions,
        currentIndex: nextIdx,
        difficultyLevel: nextLevel,
        questionDifficulties: updatedDiffs,
        isLoadingNext: false,
        clearNextQuestionError: true,
      ));
    } else if (result is ApiFailure<QuizQuestionEntity>) {
      emit(current.copyWith(
        isLoadingNext: false,
        nextQuestionError: result.message,
      ));
    }
  }

  Future<void> _onSubmitRequested(
    QuizSubmitRequested event,
    Emitter<QuizState> emit,
  ) async {
    if (state is! QuizLoaded) return;
    final current = state as QuizLoaded;
    if (current.isSubmitted || current.isSubmitting) return;

    emit(current.copyWith(isSubmitting: true));

    final correctCount = current.calculatedCorrectCount;
    final total = current.questions.length;

    final questionsPayload = current.questions
        .map((q) => {
              'questionText': q.questionText,
              'optionA': q.optionA,
              'optionB': q.optionB,
              'optionC': q.optionC,
              'optionD': q.optionD,
              'correctAnswer': q.correctAnswer,
              'explanation': q.explanation,
            })
        .toList();

    final result = await submitQuizUseCase(
      videoId: current.videoId,
      videoTitle: event.videoTitle,
      channelName: event.channelName,
      score: correctCount,
      correctCount: correctCount,
      totalQuizzes: total,
      questionsData: questionsPayload,
    );

    if (result is ApiSuccess<QuizResultEntity>) {
      final quizResult = result.data;
      emit(current.copyWith(
        isSubmitting: false,
        isSubmitted: true,
        result: quizResult,
        showRewardModal: (quizResult.earnedXP > 0 || quizResult.earnedCoins > 0),
      ));
    } else {
      // Fallback chấm điểm cục bộ nếu mất kết nối server
      final fallbackResult = QuizResultEntity(
        score: correctCount,
        correctCount: correctCount,
        totalQuizzes: total,
        earnedXP: 0,
        earnedCoins: 0,
      );
      emit(current.copyWith(
        isSubmitting: false,
        isSubmitted: true,
        result: fallbackResult,
        showRewardModal: false,
      ));
    }
  }

  void _onDismissRewardModal(
    QuizDismissRewardModal event,
    Emitter<QuizState> emit,
  ) {
    if (state is QuizLoaded) {
      final current = state as QuizLoaded;
      emit(current.copyWith(showRewardModal: false));
    }
  }

  void _onRetryRequested(
    QuizRetryRequested event,
    Emitter<QuizState> emit,
  ) {
    if (state is QuizLoaded) {
      final current = state as QuizLoaded;
      emit(current.copyWith(
        currentIndex: 0,
        userAnswers: const {},
        isSubmitted: false,
        isSubmitting: false,
        showRewardModal: false,
        clearNextQuestionError: true,
      ));
    }
  }

  void _onResetRequested(
    QuizResetRequested event,
    Emitter<QuizState> emit,
  ) {
    emit(const QuizInitial());
  }
}
