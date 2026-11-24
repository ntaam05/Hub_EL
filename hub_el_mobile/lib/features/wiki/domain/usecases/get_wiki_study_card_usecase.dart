import '../../../../core/network/api_result.dart';
import '../entities/wiki_study_card_entity.dart';
import '../repositories/wiki_repository.dart';

class GetWikiStudyCardUseCase {
  final IWikiRepository repository;

  GetWikiStudyCardUseCase({required this.repository});

  Future<ApiResult<WikiStudyCardEntity>> call(int cardId) {
    return repository.getWikiStudyCard(cardId);
  }
}

