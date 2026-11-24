import '../../../../core/network/api_result.dart';
import '../entities/wiki_study_session_entity.dart';
import '../repositories/wiki_repository.dart';

class GenerateWikiStudyUseCase {
  final IWikiRepository repository;

  GenerateWikiStudyUseCase({required this.repository});

  Future<ApiResult<WikiStudySessionEntity>> call({
    required int cardId,
    String? language,
    String? level,
    int? numQs,
    int? timeLimit,
    int? wordMin,
    int? wordMax,
    List<String>? quizTypes,
  }) {
    return repository.generateWikiStudy(
      cardId: cardId,
      language: language,
      level: level,
      numQs: numQs,
      timeLimit: timeLimit,
      wordMin: wordMin,
      wordMax: wordMax,
      quizTypes: quizTypes,
    );
  }
}

