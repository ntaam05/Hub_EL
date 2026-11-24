import '../../../../core/network/api_result.dart';
import '../entities/user_inventory_entity.dart';
import '../repositories/wiki_repository.dart';

class GetWikiInventoryUseCase {
  final IWikiRepository repository;

  GetWikiInventoryUseCase(this.repository);

  Future<ApiResult<List<UserInventoryEntity>>> call() async {
    return await repository.getInventory();
  }
}

