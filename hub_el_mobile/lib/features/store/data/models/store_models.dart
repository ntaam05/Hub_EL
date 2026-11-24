import '../../domain/entities/store_entities.dart';

class StoreBalanceModel extends StoreBalanceEntity {
  const StoreBalanceModel({
    required super.freeCoins,
    required super.aiTokens,
    required super.premiumCoins,
    required super.stardust,
    required super.isPro,
    super.premiumExpiresAt,
    super.level,
    super.rawMaxEnergy,
  });

  factory StoreBalanceModel.fromJson(Map<String, dynamic> json) {
    DateTime? expiresAt;
    if (json['premiumExpiresAt'] != null) {
      expiresAt = DateTime.tryParse(json['premiumExpiresAt'].toString());
    }

    return StoreBalanceModel(
      freeCoins: (json['freeCoins'] as num?)?.toInt() ?? 0,
      aiTokens: (json['aiTokens'] as num?)?.toInt() ?? 0,
      premiumCoins: (json['premiumCoins'] as num?)?.toInt() ?? 0,
      stardust: (json['stardust'] as num?)?.toInt() ?? 0,
      isPro: json['isPro'] == true,
      premiumExpiresAt: expiresAt,
      level: (json['level'] as num?)?.toInt() ?? 1,
      rawMaxEnergy: (json['maxEnergy'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
        'freeCoins': freeCoins,
        'aiTokens': aiTokens,
        'premiumCoins': premiumCoins,
        'stardust': stardust,
        'isPro': isPro,
        'premiumExpiresAt': premiumExpiresAt?.toIso8601String(),
        'level': level,
        'maxEnergy': maxEnergy,
      };
}

class ExchangeRuleModel extends ExchangeRuleEntity {
  const ExchangeRuleModel({
    required super.type,
    required super.name,
    required super.costField,
    required super.cost,
    required super.rewardField,
    required super.reward,
  });

  factory ExchangeRuleModel.fromJson(Map<String, dynamic> json) {
    return ExchangeRuleModel(
      type: json['type']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      costField: json['costField']?.toString() ?? '',
      cost: (json['cost'] as num?)?.toInt() ?? 0,
      rewardField: json['rewardField']?.toString() ?? '',
      reward: (json['reward'] as num?)?.toInt() ?? 0,
    );
  }
}

class VipPlanModel extends VipPlanEntity {
  const VipPlanModel({
    required super.id,
    required super.name,
    required super.days,
    required super.amount,
    required super.description,
    super.badge,
    super.isPopular = false,
    super.features = const [],
  });

  factory VipPlanModel.fromJson(Map<String, dynamic> json) {
    List<String> feats = [];
    if (json['features'] is List) {
      feats = (json['features'] as List).map((e) => e.toString()).toList();
    }

    return VipPlanModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      days: (json['days'] as num?)?.toInt() ?? 30,
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      description: json['description']?.toString() ?? '',
      badge: json['badge']?.toString(),
      isPopular: json['isPopular'] == true,
      features: feats,
    );
  }
}

class CoinPackageModel extends CoinPackageEntity {
  const CoinPackageModel({
    required super.id,
    required super.name,
    required super.amount,
    required super.coins,
    super.badge,
  });

  factory CoinPackageModel.fromJson(Map<String, dynamic> json) {
    return CoinPackageModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      coins: (json['coins'] as num?)?.toInt() ?? 0,
      badge: json['badge']?.toString(),
    );
  }
}

class StoreCatalogModel extends StoreCatalogEntity {
  const StoreCatalogModel({
    required super.balance,
    required super.exchangeRules,
    required super.vipPlans,
    required super.coinPackages,
  });

  factory StoreCatalogModel.fromJson(Map<String, dynamic> json) {
    final balanceData = json['balance'] is Map<String, dynamic>
        ? StoreBalanceModel.fromJson(json['balance'] as Map<String, dynamic>)
        : const StoreBalanceModel(
            freeCoins: 0,
            aiTokens: 0,
            premiumCoins: 0,
            stardust: 0,
            isPro: false,
          );

    final rulesList = (json['exchangeRules'] as List?)
            ?.map((e) => ExchangeRuleModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final vipList = (json['vipPlans'] as List?)
            ?.map((e) => VipPlanModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final coinList = (json['coinPackages'] as List?)
            ?.map((e) => CoinPackageModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return StoreCatalogModel(
      balance: balanceData,
      exchangeRules: rulesList,
      vipPlans: vipList,
      coinPackages: coinList,
    );
  }
}

class ExchangeResultModel extends ExchangeResultEntity {
  const ExchangeResultModel({
    required super.type,
    required super.costField,
    required super.cost,
    required super.rewardField,
    required super.reward,
    required super.updatedBalances,
  });

  factory ExchangeResultModel.fromJson(Map<String, dynamic> json) {
    return ExchangeResultModel(
      type: json['type']?.toString() ?? '',
      costField: json['costField']?.toString() ?? '',
      cost: (json['cost'] as num?)?.toInt() ?? 0,
      rewardField: json['rewardField']?.toString() ?? '',
      reward: (json['reward'] as num?)?.toInt() ?? 0,
      updatedBalances: (json['updatedBalances'] as Map<String, dynamic>?) ?? {},
    );
  }
}

class MoMoPaymentModel extends MoMoPaymentEntity {
  const MoMoPaymentModel({
    required super.orderId,
    required super.payUrl,
    required super.deeplink,
    super.qrCodeUrl,
  });

  factory MoMoPaymentModel.fromJson(Map<String, dynamic> json) {
    return MoMoPaymentModel(
      orderId: json['orderId']?.toString() ?? '',
      payUrl: json['payUrl']?.toString() ?? '',
      deeplink: json['deeplink']?.toString() ?? (json['payUrl']?.toString() ?? ''),
      qrCodeUrl: json['qrCodeUrl']?.toString(),
    );
  }
}

class MoMoStatusModel extends MoMoStatusEntity {
  const MoMoStatusModel({
    required super.orderCode,
    required super.status,
    required super.amount,
    required super.type,
    super.isPro = false,
    super.premiumExpiresAt,
  });

  factory MoMoStatusModel.fromJson(Map<String, dynamic> json) {
    DateTime? expiresAt;
    if (json['updatedBalances'] != null && json['updatedBalances']['premiumExpiresAt'] != null) {
      expiresAt = DateTime.tryParse(json['updatedBalances']['premiumExpiresAt'].toString());
    } else if (json['premiumExpiresAt'] != null) {
      expiresAt = DateTime.tryParse(json['premiumExpiresAt'].toString());
    }

    final isPro = json['updatedBalances']?['isPro'] == true || json['isPro'] == true;

    return MoMoStatusModel(
      orderCode: json['orderCode']?.toString() ?? json['orderId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      type: json['type']?.toString() ?? '',
      isPro: isPro,
      premiumExpiresAt: expiresAt,
    );
  }
}

class OrderItemModel extends OrderItemEntity {
  const OrderItemModel({
    required super.id,
    required super.orderCode,
    required super.amount,
    required super.type,
    required super.status,
    required super.createdAt,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      orderCode: json['orderCode']?.toString() ?? '',
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      type: json['type']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class CoinTransactionItemModel extends CoinTransactionItemEntity {
  const CoinTransactionItemModel({
    required super.id,
    required super.amount,
    required super.currencyType,
    required super.reason,
    required super.createdAt,
  });

  factory CoinTransactionItemModel.fromJson(Map<String, dynamic> json) {
    return CoinTransactionItemModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      currencyType: json['currencyType']?.toString() ?? 'FREE',
      reason: json['reason']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class TransactionHistoryModel extends TransactionHistoryEntity {
  const TransactionHistoryModel({
    required super.orders,
    required super.coinTransactions,
  });

  factory TransactionHistoryModel.fromJson(Map<String, dynamic> json) {
    final orderList = (json['orders'] as List?)
            ?.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final txList = (json['coinTransactions'] as List?)
            ?.map((e) => CoinTransactionItemModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return TransactionHistoryModel(
      orders: orderList,
      coinTransactions: txList,
    );
  }
}

