import '../../domain/entities/gacha_status_entity.dart';

class GachaStatusModel extends GachaStatusEntity {
  const GachaStatusModel({
    super.freeCoins,
    super.stardust,
    super.pitySR,
    super.pitySSR,
    super.pityUR,
    super.isPro,
    super.isFreePullAvailable,
    super.lastFreeGachaDate,
    super.rollCost,
  });

  factory GachaStatusModel.fromJson(Map<String, dynamic> json) {
    return GachaStatusModel(
      freeCoins: json['freeCoins'] is int
          ? json['freeCoins'] as int
          : int.tryParse(json['freeCoins']?.toString() ?? '0') ?? 0,
      stardust: json['stardust'] is int
          ? json['stardust'] as int
          : int.tryParse(json['stardust']?.toString() ?? '0') ?? 0,
      pitySR: json['pitySR'] is int
          ? json['pitySR'] as int
          : int.tryParse(json['pitySR']?.toString() ?? '0') ?? 0,
      pitySSR: json['pitySSR'] is int
          ? json['pitySSR'] as int
          : int.tryParse(json['pitySSR']?.toString() ?? '0') ?? 0,
      pityUR: json['pityUR'] is int
          ? json['pityUR'] as int
          : int.tryParse(json['pityUR']?.toString() ?? '0') ?? 0,
      isPro: json['isPro'] == true,
      isFreePullAvailable: json['isFreePullAvailable'] == true,
      lastFreeGachaDate: json['lastFreeGachaDate'] != null
          ? DateTime.tryParse(json['lastFreeGachaDate'].toString())
          : null,
      rollCost: json['rollCost'] is int
          ? json['rollCost'] as int
          : int.tryParse(json['rollCost']?.toString() ?? '100') ?? 100,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'freeCoins': freeCoins,
      'stardust': stardust,
      'pitySR': pitySR,
      'pitySSR': pitySSR,
      'pityUR': pityUR,
      'isPro': isPro,
      'isFreePullAvailable': isFreePullAvailable,
      'lastFreeGachaDate': lastFreeGachaDate?.toIso8601String(),
      'rollCost': rollCost,
    };
  }
}

