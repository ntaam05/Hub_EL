import 'package:equatable/equatable.dart';
import 'gacha_card_entity.dart';

class GachaRollResultEntity extends Equatable {
  final List<GachaCardEntity> cards;
  final int remainingCoins;
  final int remainingStardust;
  final int pitySR;
  final int pitySSR;
  final int pityUR;
  final bool usedFreePull;
  final int coinsSpent;

  const GachaRollResultEntity({
    required this.cards,
    required this.remainingCoins,
    required this.remainingStardust,
    required this.pitySR,
    required this.pitySSR,
    required this.pityUR,
    this.usedFreePull = false,
    this.coinsSpent = 0,
  });

  @override
  List<Object?> get props => [
        cards,
        remainingCoins,
        remainingStardust,
        pitySR,
        pitySSR,
        pityUR,
        usedFreePull,
        coinsSpent,
      ];
}

