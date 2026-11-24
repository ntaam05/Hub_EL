import 'package:equatable/equatable.dart';

abstract class WikiStudyEvent extends Equatable {
  const WikiStudyEvent();

  @override
  List<Object?> get props => [];
}

class WikiStudyInitRequested extends WikiStudyEvent {
  final int cardId;

  const WikiStudyInitRequested(this.cardId);

  @override
  List<Object?> get props => [cardId];
}

class WikiStudyLanguageChanged extends WikiStudyEvent {
  final String language;

  const WikiStudyLanguageChanged(this.language);

  @override
  List<Object?> get props => [language];
}

class WikiStudyLevelChanged extends WikiStudyEvent {
  final String level;

  const WikiStudyLevelChanged(this.level);

  @override
  List<Object?> get props => [level];
}

class WikiStudyNumQuestionsChanged extends WikiStudyEvent {
  final int numQs;

  const WikiStudyNumQuestionsChanged(this.numQs);

  @override
  List<Object?> get props => [numQs];
}

class WikiStudyTimeLimitChanged extends WikiStudyEvent {
  final int timeLimit;

  const WikiStudyTimeLimitChanged(this.timeLimit);

  @override
  List<Object?> get props => [timeLimit];
}

class WikiStudyWordRangeChanged extends WikiStudyEvent {
  final int wordMin;
  final int wordMax;

  const WikiStudyWordRangeChanged(this.wordMin, this.wordMax);

  @override
  List<Object?> get props => [wordMin, wordMax];
}

class WikiStudySkillToggled extends WikiStudyEvent {
  final String skillId;

  const WikiStudySkillToggled(this.skillId);

  @override
  List<Object?> get props => [skillId];
}

class WikiStudyGenerateRequested extends WikiStudyEvent {
  const WikiStudyGenerateRequested();
}

class WikiStudyAnswerSelected extends WikiStudyEvent {
  final int questionIndex;
  final dynamic answer;

  const WikiStudyAnswerSelected({
    required this.questionIndex,
    required this.answer,
  });

  @override
  List<Object?> get props => [questionIndex, answer];
}

class WikiStudyAnswerConfirmed extends WikiStudyEvent {
  final int questionIndex;

  const WikiStudyAnswerConfirmed(this.questionIndex);

  @override
  List<Object?> get props => [questionIndex];
}

class WikiStudyTimerTicked extends WikiStudyEvent {
  const WikiStudyTimerTicked();
}

class WikiStudyFinishRequested extends WikiStudyEvent {
  const WikiStudyFinishRequested();
}

class WikiStudyKeepStarRequested extends WikiStudyEvent {
  const WikiStudyKeepStarRequested();
}

class WikiStudyResetRequested extends WikiStudyEvent {
  const WikiStudyResetRequested();
}

