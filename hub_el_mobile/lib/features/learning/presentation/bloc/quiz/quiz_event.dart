abstract class QuizEvent {
  const QuizEvent();
}

class GenerateQuizRequested extends QuizEvent {
  final String videoId;
  final int count;

  const GenerateQuizRequested({
    required this.videoId,
    this.count = 5,
  });
}

class QuizAnswerSelected extends QuizEvent {
  final int questionIndex;
  final String option;

  const QuizAnswerSelected({
    required this.questionIndex,
    required this.option,
  });
}

class QuizSubmitRequested extends QuizEvent {
  final String? videoTitle;
  final String? channelName;

  const QuizSubmitRequested({
    this.videoTitle,
    this.channelName,
  });
}

class QuizDismissRewardModal extends QuizEvent {
  const QuizDismissRewardModal();
}

class QuizRetryRequested extends QuizEvent {
  const QuizRetryRequested();
}

class QuizResetRequested extends QuizEvent {
  const QuizResetRequested();
}
