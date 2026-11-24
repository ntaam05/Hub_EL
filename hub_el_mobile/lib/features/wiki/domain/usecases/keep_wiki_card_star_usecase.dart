import '../../../../core/network/api_result.dart';
import '../repositories/wiki_repository.dart';

class KeepWikiCardStarUseCase {
  final IWikiRepository repository;

  KeepWikiCardStarUseCase({required this.repository});

  Future<ApiResult<Map<String, dynamic>>> call(int attemptId) {
    return repository.keepWikiCardStar(attemptId);
  }
}

