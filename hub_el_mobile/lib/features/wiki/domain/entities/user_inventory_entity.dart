import 'package:equatable/equatable.dart';
import 'wiki_card_entity.dart';

class UserInventoryEntity extends Equatable {
  final int? id;
  final int cardId;
  final bool isOwned;
  final DateTime? acquiredAt;
  final bool isNew;
  final int currentStar;
  final int canShareCount;
  final String? source;
  final bool isCompleted;
  final WikiCardEntity card;

  const UserInventoryEntity({
    this.id,
    required this.cardId,
    this.isOwned = true,
    this.acquiredAt,
    this.isNew = false,
    this.currentStar = 0,
    this.canShareCount = 1,
    this.source,
    this.isCompleted = false,
    required this.card,
  });

  @override
  List<Object?> get props => [
        id,
        cardId,
        isOwned,
        acquiredAt,
        isNew,
        currentStar,
        canShareCount,
        source,
        isCompleted,
        card,
      ];
}
