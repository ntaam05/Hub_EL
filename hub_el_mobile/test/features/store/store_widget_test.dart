import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/features/store/domain/entities/store_entities.dart';
import 'package:hub_el_mobile/features/store/presentation/widgets/exchange_card.dart';
import 'package:hub_el_mobile/features/store/presentation/widgets/gem_package_card.dart';
import 'package:hub_el_mobile/features/store/presentation/widgets/store_balance_header.dart';
import 'package:hub_el_mobile/features/store/presentation/widgets/transaction_history_view.dart';
import 'package:hub_el_mobile/features/store/presentation/widgets/vip_plan_card.dart';

void main() {
  group('Store Widget Unit Tests', () {
    testWidgets('StoreBalanceHeader renders balance numbers correctly', (tester) async {
      final balance = StoreBalanceEntity(
        freeCoins: 5200,
        premiumCoins: 140,
        aiTokens: 85,
        stardust: 12,
        isPro: true,
        premiumExpiresAt: DateTime.now().add(const Duration(days: 28)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StoreBalanceHeader(balance: balance),
          ),
        ),
      );

      expect(find.text('Xu Gacha'), findsOneWidget);
      expect(find.text('Ngọc'), findsOneWidget);
      expect(find.text('Năng Lượng'), findsOneWidget);
      expect(find.text('85/100'), findsOneWidget);
      expect(find.textContaining('VIP PRO'), findsOneWidget);
      expect(find.textContaining('ngày'), findsOneWidget);
    });

    testWidgets('VipPlanCard displays name, amount, and handles button press', (tester) async {
      const plan = VipPlanEntity(
        id: 'vip_6m',
        name: '6 Tháng',
        days: 180,
        amount: 399000,
        badge: 'Tiết Kiệm',
        description: 'Gói nửa năm ưu đãi',
        isPopular: true,
      );

      bool clicked = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: VipPlanCard(
              plan: plan,
              onPurchase: () => clicked = true,
            ),
          ),
        ),
      );

      expect(find.text('6 Tháng'), findsOneWidget);
      expect(find.text('Tiết Kiệm'), findsOneWidget);
      expect(find.text('399.000'), findsOneWidget);
      expect(find.text('Kích Hoạt Ngay'), findsOneWidget);

      await tester.tap(find.text('Kích Hoạt Ngay'));
      await tester.pump();

      expect(clicked, true);
    });

    testWidgets('GemPackageCard displays package coins, badge and price button', (tester) async {
      const pkg = CoinPackageEntity(
        id: 'gem_large',
        coins: 600,
        amount: 100000,
        name: 'Rương Ngọc Lớn',
        badge: 'HOT',
      );

      bool clicked = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GemPackageCard(
              package: pkg,
              onPurchase: () => clicked = true,
            ),
          ),
        ),
      );

      expect(find.text('600'), findsOneWidget);
      expect(find.text('NGỌC'), findsOneWidget);
      expect(find.text('HOT'), findsOneWidget);
      expect(find.text('100.000 đ'), findsOneWidget);

      await tester.tap(find.text('100.000 đ'));
      await tester.pump();

      expect(clicked, true);
    });

    testWidgets('ExchangeCard displays exchange rule and handles exchange button', (tester) async {
      const rule = ExchangeRuleEntity(
        type: 'DIAMOND_TO_ENERGY',
        name: 'Đổi 10 Ngọc lấy 50 Energy',
        costField: 'premiumCoins',
        cost: 10,
        rewardField: 'aiTokens',
        reward: 50,
      );

      bool clicked = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ExchangeCard(
              rule: rule,
              onExchangeTap: () => clicked = true,
            ),
          ),
        ),
      );

      expect(find.text('50'), findsOneWidget);
      expect(find.text('NĂNG LƯỢNG'), findsOneWidget);
      expect(find.text('Chi phí: 10 Ngọc'), findsOneWidget);
      expect(find.text('Đổi Ngay'), findsOneWidget);

      await tester.tap(find.text('Đổi Ngay'));
      await tester.pump();

      expect(clicked, true);
    });

    testWidgets('TransactionHistoryView displays empty state and filter chips', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TransactionHistoryView(
              transactions: const TransactionHistoryEntity(orders: [], coinTransactions: []),
              onRefresh: () {},
            ),
          ),
        ),
      );

      expect(find.text('Tất Cả (0)'), findsOneWidget);
      expect(find.text('Nạp MoMo (0)'), findsOneWidget);
      expect(find.text('Ví Xu (0)'), findsOneWidget);
      expect(find.text('Chưa có lịch sử giao dịch'), findsOneWidget);
    });
  });
}
