import '../../domain/entities/gacha_roll_result_entity.dart';
import 'gacha_card_model.dart';

class GachaRollResultModel extends GachaRollResultEntity {
  const GachaRollResultModel({
    required super.cards,
    required super.remainingCoins,
    required super.remainingStardust,
    required super.pitySR,
    required super.pitySSR,
    required super.pityUR,
    super.usedFreePull,
    super.coinsSpent,
  });

  factory GachaRollResultModel.fromJson(Map<String, dynamic> json) {
    final rawCards = (json['rolls'] ?? json['cards']) as List<dynamic>? ?? [];
    final parsedCards = rawCards.map((item) {
      if (item is Map<String, dynamic>) {
        if (item.containsKey('card') && item['card'] is Map<String, dynamic>) {
          final cardData = Map<String, dynamic>.from(item['card'] as Map<String, dynamic>);
          cardData['isNew'] = item['isNew'] == true;
          cardData['stardustEarned'] = item['stardustEarned'] ?? 0;
          return GachaCardModel.fromJson(cardData);
        }
        return GachaCardModel.fromJson(item);
      }
      return const GachaCardModel(id: 0, title: '', rarity: 'N');
    }).where((c) => c.id > 0).toList();

    final summary = json['summary'] as Map<String, dynamic>? ?? {};

    int parseInt(dynamic val) {
      if (val is int) return val;
      return int.tryParse(val?.toString() ?? '0') ?? 0;
    }

    final coins = summary['remainingCoins'] ?? json['remainingCoins'];
    final dust = summary['totalStardust'] ?? summary['remainingStardust'] ?? json['remainingStardust'];
    final pSR = summary['pitySR'] ?? json['pitySR'];
    final pSSR = summary['pitySSR'] ?? json['pitySSR'];
    final pUR = summary['pityUR'] ?? json['pityUR'];
    final freePull = summary['usedFreePull'] == true || json['usedFreePull'] == true;
    final spent = summary['coinsSpent'] ?? json['coinsSpent'];

    return GachaRollResultModel(
      cards: parsedCards,
      remainingCoins: parseInt(coins),
      remainingStardust: parseInt(dust),
      pitySR: parseInt(pSR),
      pitySSR: parseInt(pSSR),
      pityUR: parseInt(pUR),
      usedFreePull: freePull,
      coinsSpent: parseInt(spent),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cards': cards
          .map((c) => c is GachaCardModel
              ? c.toJson()
              : {
                  'id': c.id,
                  'title': c.title,
                  'rarity': c.rarity,
                  'imageUrl': c.imageUrl,
                  'wikiUrl': c.wikiUrl,
                  'awakenedStars': c.awakenedStars,
                  'totalStars': c.totalStars,
                  'isNew': c.isNew,
                  'stardustEarned': c.stardustEarned,
                })
          .toList(),
      'remainingCoins': remainingCoins,
      'remainingStardust': remainingStardust,
      'pitySR': pitySR,
      'pitySSR': pitySSR,
      'pityUR': pityUR,
      'usedFreePull': usedFreePull,
      'coinsSpent': coinsSpent,
    };
  }
}
