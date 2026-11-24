import 'package:equatable/equatable.dart';

class GachaStatusEntity extends Equatable {
  final int freeCoins;
  final int stardust;
  final int pitySR;
  final int pitySSR;
  final int pityUR;
  final bool isPro;
  final bool isFreePullAvailable;
  final DateTime? lastFreeGachaDate;
  final int rollCost;

  const GachaStatusEntity({
    this.freeCoins = 0,
    this.stardust = 0,
    this.pitySR = 0,
    this.pitySSR = 0,
    this.pityUR = 0,
    this.isPro = false,
    this.isFreePullAvailable = false,
    this.lastFreeGachaDate,
    this.rollCost = 100,
  });

  @override
  List<Object?> get props => [
        freeCoins,
        stardust,
        pitySR,
        pitySSR,
        pityUR,
        isPro,
        isFreePullAvailable,
        lastFreeGachaDate,
        rollCost,
      ];
}

