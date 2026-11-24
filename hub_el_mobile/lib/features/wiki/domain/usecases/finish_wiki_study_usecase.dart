import '../../../../core/network/api_result.dart';
import '../entities/wiki_study_result_entity.dart';
import '../repositories/wiki_repository.dart';

class FinishWikiStudyUseCase {
  final IWikiRepository repository;

  FinishWikiStudyUseCase({required this.repository});

  Future<ApiResult<WikiStudyResultEntity>> call({
    required String sessionId,
    String? sessionToken,
    required List<dynamic> answers,
    int? cardId,
  }) {
    return repository.finishWikiStudy(
      sessionId: sessionId,
      sessionToken: sessionToken,
      answers: answers,
      cardId: cardId,
    );
  }
}

