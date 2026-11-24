import 'package:equatable/equatable.dart';
import '../../domain/entities/wiki_study_card_entity.dart';
import '../../domain/entities/wiki_study_result_entity.dart';
import '../../domain/entities/wiki_study_session_entity.dart';

enum WikiStudyStep {
  config,
  loading,
  study,
  result,
}

class WikiStudyState extends Equatable {
  final WikiStudyStep step;
  final bool isLoading;
  final String? errorMessage;

  final WikiStudyCardEntity? card;

  // Config parameters
  final String selectedLanguage;
  final String selectedLevel;
  final int numQs;
  final int timeLimit;
  final int wordMin;
  final int wordMax;
  final List<String> quizTypes;

  // Study session data
  final WikiStudySessionEntity? session;
  final int timeLeft;
  final Map<int, dynamic> userAnswers;
  final Set<int> confirmedQuestions;

  // Result data
  final WikiStudyResultEntity? result;
  final bool isKeepingStar;
  final bool isStarRestored;
  final int currentAwakenedStars;

  const WikiStudyState({
    this.step = WikiStudyStep.config,
    this.isLoading = false,
    this.errorMessage,
    this.card,
    this.selectedLanguage = 'Tiếng Anh',
    this.selectedLevel = 'A2',
    this.numQs = 3,
    this.timeLimit = 0,
    this.wordMin = 150,
    this.wordMax = 200,
    this.quizTypes = const [
      'multiple_choice',
      'true_false',
      'main_idea',
      'inference',
      'guess_meaning',
    ],
    this.session,
    this.timeLeft = 0,
    this.userAnswers = const {},
    this.confirmedQuestions = const {},
    this.result,
    this.isKeepingStar = false,
    this.isStarRestored = false,
    this.currentAwakenedStars = 0,
  });

  bool get isAllQuestionsConfirmed {
    if (session == null || session!.quizzes.isEmpty) return false;
    return confirmedQuestions.length == session!.quizzes.length;
  }

  int get dynamicMaxQs {
    return (wordMax / 40).floor().clamp(2, 15);
  }

  int get energyCost {
    if (card?.isPro == true) return 7;
    return 10;
  }

  WikiStudyState copyWith({
    WikiStudyStep? step,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
    WikiStudyCardEntity? card,
    String? selectedLanguage,
    String? selectedLevel,
    int? numQs,
    int? timeLimit,
    int? wordMin,
    int? wordMax,
    List<String>? quizTypes,
    WikiStudySessionEntity? session,
    int? timeLeft,
    Map<int, dynamic>? userAnswers,
    Set<int>? confirmedQuestions,
    WikiStudyResultEntity? result,
    bool? isKeepingStar,
    bool? isStarRestored,
    int? currentAwakenedStars,
  }) {
    return WikiStudyState(
      step: step ?? this.step,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      card: card ?? this.card,
      selectedLanguage: selectedLanguage ?? this.selectedLanguage,
      selectedLevel: selectedLevel ?? this.selectedLevel,
      numQs: numQs ?? this.numQs,
      timeLimit: timeLimit ?? this.timeLimit,
      wordMin: wordMin ?? this.wordMin,
      wordMax: wordMax ?? this.wordMax,
      quizTypes: quizTypes ?? this.quizTypes,
      session: session ?? this.session,
      timeLeft: timeLeft ?? this.timeLeft,
      userAnswers: userAnswers ?? this.userAnswers,
      confirmedQuestions: confirmedQuestions ?? this.confirmedQuestions,
      result: result ?? this.result,
      isKeepingStar: isKeepingStar ?? this.isKeepingStar,
      isStarRestored: isStarRestored ?? this.isStarRestored,
      currentAwakenedStars: currentAwakenedStars ?? this.currentAwakenedStars,
    );
  }

  @override
  List<Object?> get props => [
        step,
        isLoading,
        errorMessage,
        card,
        selectedLanguage,
        selectedLevel,
        numQs,
        timeLimit,
        wordMin,
        wordMax,
        quizTypes,
        session,
        timeLeft,
        userAnswers,
        confirmedQuestions,
        result,
        isKeepingStar,
        isStarRestored,
        currentAwakenedStars,
      ];
}

