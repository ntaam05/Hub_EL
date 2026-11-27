import 'package:hub_el_mobile/features/learning/domain/entities/quiz_question_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/quiz_result_entity.dart';

abstract class QuizState {
  const QuizState();
}

class QuizInitial extends QuizState {
  const QuizInitial();
}

class QuizGenerating extends QuizState {
  final int count;

  const QuizGenerating({required this.count});
}

class QuizLoaded extends QuizState {
  final String videoId;
  final List<QuizQuestionEntity> questions;
  final int totalCount;
  final int currentIndex;
  final int difficultyLevel;
  final Map<int, int> questionDifficulties;
  final bool isLoadingNext;
  final String? nextQuestionError;
  final Map<int, String> userAnswers;
  final bool isSubmitted;
  final bool isSubmitting;
  final QuizResultEntity? result;
  final bool showRewardModal;

  const QuizLoaded({
    required this.videoId,
    required this.questions,
    int? totalCount,
    this.currentIndex = 0,
    this.difficultyLevel = 2,
    this.questionDifficulties = const {0: 2},
    this.isLoadingNext = false,
    this.nextQuestionError,
    this.userAnswers = const {},
    this.isSubmitted = false,
    this.isSubmitting = false,
    this.result,
    this.showRewardModal = false,
  }) : totalCount = totalCount ?? questions.length;

  /// Số lượng câu hỏi đã trả lời
  int get answeredCount => userAnswers.length;

  /// Đã trả lời hết tất cả câu hỏi hay chưa
  bool get isAllAnswered => userAnswers.length >= totalCount;

  /// Tính số câu đúng dựa trên danh sách câu hỏi
  int get calculatedCorrectCount {
    int count = 0;
    for (int i = 0; i < questions.length; i++) {
      if (userAnswers[i] != null &&
          userAnswers[i]!.trim().toUpperCase() == questions[i].correctAnswer.trim().toUpperCase()) {
        count++;
      }
    }
    return count;
  }

  QuizLoaded copyWith({
    String? videoId,
    List<QuizQuestionEntity>? questions,
    int? totalCount,
    int? currentIndex,
    int? difficultyLevel,
    Map<int, int>? questionDifficulties,
    bool? isLoadingNext,
    String? nextQuestionError,
    bool clearNextQuestionError = false,
    Map<int, String>? userAnswers,
    bool? isSubmitted,
    bool? isSubmitting,
    QuizResultEntity? result,
    bool? showRewardModal,
  }) {
    return QuizLoaded(
      videoId: videoId ?? this.videoId,
      questions: questions ?? this.questions,
      totalCount: totalCount ?? this.totalCount,
      currentIndex: currentIndex ?? this.currentIndex,
      difficultyLevel: difficultyLevel ?? this.difficultyLevel,
      questionDifficulties: questionDifficulties ?? this.questionDifficulties,
      isLoadingNext: isLoadingNext ?? this.isLoadingNext,
      nextQuestionError: clearNextQuestionError ? null : (nextQuestionError ?? this.nextQuestionError),
      userAnswers: userAnswers ?? this.userAnswers,
      isSubmitted: isSubmitted ?? this.isSubmitted,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      result: result ?? this.result,
      showRewardModal: showRewardModal ?? this.showRewardModal,
    );
  }
}

class QuizError extends QuizState {
  final String message;

  const QuizError({required this.message});
}
