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
  final SubmitQuizUseCase submitQuizUseCase;

  QuizBloc({
    required this.generateQuizUseCase,
    required this.submitQuizUseCase,
  }) : super(const QuizInitial()) {
    on<GenerateQuizRequested>(_onGenerateQuizRequested);
    on<QuizAnswerSelected>(_onAnswerSelected);
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
    );

    if (result is ApiSuccess<QuizGeneratedEntity>) {
      emit(QuizLoaded(
        videoId: event.videoId,
        questions: result.data.questions,
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

      final updatedAnswers = Map<int, String>.from(current.userAnswers);
      updatedAnswers[event.questionIndex] = event.option;

      emit(current.copyWith(userAnswers: updatedAnswers));
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
        userAnswers: const {},
        isSubmitted: false,
        isSubmitting: false,
        showRewardModal: false,
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
