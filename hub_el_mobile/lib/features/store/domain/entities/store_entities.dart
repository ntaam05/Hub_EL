import 'package:equatable/equatable.dart';

class StoreBalanceEntity extends Equatable {
  final int freeCoins;
  final int aiTokens;
  final int premiumCoins;
  final int stardust;
  final bool isPro;
  final DateTime? premiumExpiresAt;
  final int level;
  final int? rawMaxEnergy;

  const StoreBalanceEntity({
    required this.freeCoins,
    required this.aiTokens,
    required this.premiumCoins,
    required this.stardust,
    required this.isPro,
    this.premiumExpiresAt,
    this.level = 1,
    this.rawMaxEnergy,
  });

  int get maxEnergy {
    if (rawMaxEnergy != null && rawMaxEnergy! > 0) return rawMaxEnergy!;
    final baseCap = 50 + (level - 1) * 5;
    return isPro ? baseCap + 50 : baseCap;
  }

  int get remainingVipDays {
    if (!isPro || premiumExpiresAt == null) return 0;
    final diff = premiumExpiresAt!.difference(DateTime.now()).inDays;
    return diff > 0 ? diff : 0;
  }

  @override
  List<Object?> get props => [
        freeCoins,
        aiTokens,
        premiumCoins,
        stardust,
        isPro,
        premiumExpiresAt,
        level,
        rawMaxEnergy,
      ];
}

class ExchangeRuleEntity extends Equatable {
  final String type;
  final String name;
  final String costField;
  final int cost;
  final String rewardField;
  final int reward;

  const ExchangeRuleEntity({
    required this.type,
    required this.name,
    required this.costField,
    required this.cost,
    required this.rewardField,
    required this.reward,
  });

  @override
  List<Object?> get props => [type, name, costField, cost, rewardField, reward];
}

class VipPlanEntity extends Equatable {
  final String id;
  final String name;
  final int days;
  final int amount;
  final String description;
  final String? badge;
  final bool isPopular;
  final List<String> features;

  const VipPlanEntity({
    required this.id,
    required this.name,
    required this.days,
    required this.amount,
    required this.description,
    this.badge,
    this.isPopular = false,
    this.features = const [],
  });

  @override
  List<Object?> get props => [id, name, days, amount, description, badge, isPopular, features];
}

class CoinPackageEntity extends Equatable {
  final String id;
  final String name;
  final int amount;
  final int coins;
  final String? badge;

  const CoinPackageEntity({
    required this.id,
    required this.name,
    required this.amount,
    required this.coins,
    this.badge,
  });

  @override
  List<Object?> get props => [id, name, amount, coins, badge];
}

class StoreCatalogEntity extends Equatable {
  final StoreBalanceEntity balance;
  final List<ExchangeRuleEntity> exchangeRules;
  final List<VipPlanEntity> vipPlans;
  final List<CoinPackageEntity> coinPackages;

  const StoreCatalogEntity({
    required this.balance,
    required this.exchangeRules,
    required this.vipPlans,
    required this.coinPackages,
  });

  @override
  List<Object?> get props => [balance, exchangeRules, vipPlans, coinPackages];
}

class ExchangeResultEntity extends Equatable {
  final String type;
  final String costField;
  final int cost;
  final String rewardField;
  final int reward;
  final Map<String, dynamic> updatedBalances;

  const ExchangeResultEntity({
    required this.type,
    required this.costField,
    required this.cost,
    required this.rewardField,
    required this.reward,
    required this.updatedBalances,
  });

  @override
  List<Object?> get props => [type, costField, cost, rewardField, reward, updatedBalances];
}

class MoMoPaymentEntity extends Equatable {
  final String orderId;
  final String payUrl;
  final String deeplink;
  final String? qrCodeUrl;

  const MoMoPaymentEntity({
    required this.orderId,
    required this.payUrl,
    required this.deeplink,
    this.qrCodeUrl,
  });

  @override
  List<Object?> get props => [orderId, payUrl, deeplink, qrCodeUrl];
}

class MoMoStatusEntity extends Equatable {
  final String orderCode;
  final String status;
  final int amount;
  final String type;
  final bool isPro;
  final DateTime? premiumExpiresAt;

  const MoMoStatusEntity({
    required this.orderCode,
    required this.status,
    required this.amount,
    required this.type,
    this.isPro = false,
    this.premiumExpiresAt,
  });

  bool get isSuccess => status == 'SUCCESS';

  @override
  List<Object?> get props => [orderCode, status, amount, type, isPro, premiumExpiresAt];
}

class OrderItemEntity extends Equatable {
  final int id;
  final String orderCode;
  final int amount;
  final String type;
  final String status;
  final DateTime createdAt;

  const OrderItemEntity({
    required this.id,
    required this.orderCode,
    required this.amount,
    required this.type,
    required this.status,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, orderCode, amount, type, status, createdAt];
}

class CoinTransactionItemEntity extends Equatable {
  final int id;
  final int amount;
  final String currencyType;
  final String reason;
  final DateTime createdAt;

  const CoinTransactionItemEntity({
    required this.id,
    required this.amount,
    required this.currencyType,
    required this.reason,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, amount, currencyType, reason, createdAt];
}

class TransactionHistoryEntity extends Equatable {
  final List<OrderItemEntity> orders;
  final List<CoinTransactionItemEntity> coinTransactions;

  const TransactionHistoryEntity({
    required this.orders,
    required this.coinTransactions,
  });

  @override
  List<Object?> get props => [orders, coinTransactions];
}

