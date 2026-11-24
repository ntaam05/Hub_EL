import '../../domain/entities/user_inventory_entity.dart';
import 'wiki_card_model.dart';

class UserInventoryModel extends UserInventoryEntity {
  const UserInventoryModel({
    super.id,
    required super.cardId,
    super.isOwned = true,
    super.acquiredAt,
    super.isNew,
    super.currentStar,
    super.canShareCount,
    super.source,
    super.isCompleted,
    required super.card,
  });

  factory UserInventoryModel.fromJson(Map<String, dynamic> json) {
    WikiCardModel parsedCard;
    if (json['card'] is Map<String, dynamic>) {
      parsedCard = WikiCardModel.fromJson(json['card'] as Map<String, dynamic>);
    } else {
      parsedCard = WikiCardModel(
        id: (json['cardId'] as num?)?.toInt() ?? 0,
        title: 'Thẻ Wiki #${json['cardId']}',
      );
    }

    final cardId = (json['cardId'] as num?)?.toInt() ?? parsedCard.id;
    final isOwned = json['isOwned'] as bool? ?? (json['id'] != null);

    return UserInventoryModel(
      id: (json['id'] as num?)?.toInt(),
      cardId: cardId,
      isOwned: isOwned,
      acquiredAt: json['acquiredAt'] != null
          ? DateTime.tryParse(json['acquiredAt'].toString())
          : null,
      isNew: json['isNew'] as bool? ?? false,
      currentStar: (json['currentStar'] as num?)?.toInt() ?? 0,
      canShareCount: (json['canShareCount'] as num?)?.toInt() ?? 1,
      source: json['source'] as String?,
      isCompleted: json['isCompleted'] as bool? ?? false,
      card: parsedCard,
    );
  }
}
