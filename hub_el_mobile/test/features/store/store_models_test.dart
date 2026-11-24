import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/features/store/data/models/store_models.dart';

void main() {
  group('Store Models JSON Deserialization', () {
    test('StoreCatalogModel.fromJson should parse correctly', () {
      final json = {
        'balance': {
          'freeCoins': 1500,
          'aiTokens': 50,
          'premiumCoins': 120,
          'stardust': 10,
          'isPro': true,
          'premiumExpiresAt': '2026-12-31T23:59:59.000Z',
        },
        'exchangeRules': [
          {
            'type': 'DIAMOND_TO_ENERGY',
            'name': 'Đổi 20 Ngọc lấy 100 AI Energy',
            'costField': 'premiumCoins',
            'cost': 20,
            'rewardField': 'aiTokens',
            'reward': 100,
          }
        ],
        'vipPlans': [
          {
            'id': 'vip_1m',
            'name': '1 Tháng',
            'days': 30,
            'amount': 79000,
            'badge': 'Phổ Biến',
            'description': 'Trải nghiệm VIP 30 ngày',
            'isPopular': true,
            'features': ['Không giới hạn AI'],
          }
        ],
        'coinPackages': [
          {
            'id': 'gem_1',
            'name': 'Túi Ngọc Nhỏ',
            'amount': 20000,
            'coins': 100,
            'badge': '+10%',
          }
        ],
      };

      final model = StoreCatalogModel.fromJson(json);

      expect(model.balance.freeCoins, 1500);
      expect(model.balance.premiumCoins, 120);
      expect(model.balance.aiTokens, 50);
      expect(model.balance.isPro, true);
      expect(model.balance.remainingVipDays, greaterThan(0));

      expect(model.exchangeRules.length, 1);
      expect(model.exchangeRules.first.type, 'DIAMOND_TO_ENERGY');
      expect(model.exchangeRules.first.cost, 20);
      expect(model.exchangeRules.first.reward, 100);

      expect(model.vipPlans.length, 1);
      expect(model.vipPlans.first.id, 'vip_1m');
      expect(model.vipPlans.first.amount, 79000);
      expect(model.vipPlans.first.isPopular, true);

      expect(model.coinPackages.length, 1);
      expect(model.coinPackages.first.coins, 100);
      expect(model.coinPackages.first.amount, 20000);
    });

    test('ExchangeResultModel.fromJson should parse correctly', () {
      final json = {
        'type': 'DIAMOND_TO_ENERGY',
        'costField': 'premiumCoins',
        'cost': 20,
        'rewardField': 'aiTokens',
        'reward': 100,
        'updatedBalances': {
          'premiumCoins': 100,
          'aiTokens': 150,
        },
      };

      final result = ExchangeResultModel.fromJson(json);

      expect(result.type, 'DIAMOND_TO_ENERGY');
      expect(result.cost, 20);
      expect(result.reward, 100);
      expect(result.updatedBalances['premiumCoins'], 100);
      expect(result.updatedBalances['aiTokens'], 150);
    });

    test('MoMoPaymentModel.fromJson should parse correctly', () {
      final json = {
        'orderId': 'ORDER_123',
        'payUrl': 'https://test-payment.momo.vn/v2/gateway/api/create',
        'deeplink': 'momo://pay?id=123',
        'qrCodeUrl': 'momo://pay?id=123',
      };

      final payment = MoMoPaymentModel.fromJson(json);

      expect(payment.orderId, 'ORDER_123');
      expect(payment.payUrl, 'https://test-payment.momo.vn/v2/gateway/api/create');
      expect(payment.deeplink, 'momo://pay?id=123');
    });

    test('MoMoStatusModel.fromJson should parse correctly', () {
      final json = {
        'orderCode': 'ORDER_123',
        'status': 'SUCCESS',
        'amount': 79000,
        'type': 'VIP',
        'isPro': true,
      };

      final status = MoMoStatusModel.fromJson(json);

      expect(status.orderCode, 'ORDER_123');
      expect(status.status, 'SUCCESS');
      expect(status.isSuccess, true);
      expect(status.type, 'VIP');
      expect(status.isPro, true);
    });

    test('TransactionHistoryModel.fromJson should parse correctly', () {
      final json = {
        'orders': [
          {
            'id': 1,
            'orderCode': 'ORDER_123',
            'amount': 79000,
            'type': 'VIP',
            'status': 'SUCCESS',
            'createdAt': '2026-11-21T10:00:00.000Z',
          }
        ],
        'coinTransactions': [
          {
            'id': 101,
            'amount': -20,
            'currencyType': 'PREMIUM',
            'reason': 'EXCHANGE_TO_ENERGY',
            'createdAt': '2026-11-21T10:05:00.000Z',
          }
        ],
      };

      final history = TransactionHistoryModel.fromJson(json);

      expect(history.orders.length, 1);
      expect(history.orders.first.orderCode, 'ORDER_123');
      expect(history.orders.first.status, 'SUCCESS');

      expect(history.coinTransactions.length, 1);
      expect(history.coinTransactions.first.amount, -20);
      expect(history.coinTransactions.first.reason, 'EXCHANGE_TO_ENERGY');
    });
  });
}
