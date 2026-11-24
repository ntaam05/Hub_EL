import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/features/achievements/domain/entities/achievement_entities.dart';
import 'package:hub_el_mobile/features/achievements/presentation/widgets/achievement_card.dart';
import 'package:hub_el_mobile/features/achievements/presentation/widgets/achievement_dashboard_card.dart';
import 'package:hub_el_mobile/features/achievements/presentation/widgets/achievement_detail_sheet.dart';
import 'package:hub_el_mobile/features/achievements/presentation/widgets/achievement_reward_dialog.dart';
import 'package:hub_el_mobile/features/achievements/presentation/widgets/group_filter_bar.dart';
import 'package:hub_el_mobile/features/achievements/presentation/widgets/tier_filter_bar.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Achievements Widgets Unit Tests', () {
    const mockSummary = AchievementSummaryEntity(
      totalCount: 64,
      unlockedCount: 20,
      progressPercent: 31,
    );

    const mockAchievementUnlocked = AchievementItemEntity(
      id: 'STR_1',
      groupId: 'STREAK',
      tier: 1,
      title: 'Mới vào nghề',
      desc: 'Đạt chuỗi học 3 ngày liên tiếp.',
      reqType: 'highestStreak',
      reqValue: 3,
      currentProgress: 3,
      progressPercent: 100,
      isUnlocked: true,
      rewardXp: 100,
      rewardCoins: 50,
      rewardEnergy: 10,
    );

    const mockAchievementLocked = AchievementItemEntity(
      id: 'STR_4',
      groupId: 'STREAK',
      tier: 4,
      title: 'Ý chí sắt đá',
      desc: 'Đạt chuỗi học 100 ngày liên tiếp.',
      reqType: 'highestStreak',
      reqValue: 100,
      currentProgress: 42,
      progressPercent: 42,
      isUnlocked: false,
      rewardXp: 3000,
      rewardCoins: 1500,
      rewardEnergy: 100,
    );

    testWidgets('AchievementDashboardCard renders stats correctly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AchievementDashboardCard(summary: mockSummary),
          ),
        ),
      );

      expect(find.text('BẢNG VÀNG THÀNH TỰU'), findsOneWidget);
      expect(find.text('31%'), findsOneWidget);
      expect(find.text('20 / 64'), findsOneWidget);
      expect(find.text('20'), findsOneWidget); // Unlocked count
      expect(find.text('44'), findsOneWidget); // Locked count
      expect(find.text('64'), findsOneWidget); // Total count
    });

    testWidgets('AchievementCard renders unlocked achievement properly', (tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AchievementCard(
              achievement: mockAchievementUnlocked,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Mới vào nghề'), findsOneWidget);
      expect(find.text('Đạt chuỗi học 3 ngày liên tiếp.'), findsOneWidget);
      expect(find.text('ĐẠT'), findsOneWidget);
      expect(find.text('Hoàn thành'), findsOneWidget);
      expect(find.text('+100 XP'), findsOneWidget);

      await tester.tap(find.byType(AchievementCard));
      expect(tapped, isTrue);
    });

    testWidgets('AchievementCard renders locked achievement with progress bar', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AchievementCard(
              achievement: mockAchievementLocked,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Ý chí sắt đá'), findsOneWidget);
      expect(find.text('42 / 100 (42%)'), findsOneWidget);
      expect(find.text('+3,000 XP'), findsOneWidget);
      expect(find.text('+1,500 Xu'), findsOneWidget);
    });

    testWidgets('GroupFilterBar handles taps on group chips', (tester) async {
      String? selected;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GroupFilterBar(
              selectedGroup: null,
              groupCounts: const {'STREAK': 6, 'LEVEL': 6},
              groupUnlockedCounts: const {'STREAK': 2},
              onGroupSelected: (id) => selected = id,
            ),
          ),
        ),
      );

      expect(find.text('Tất cả'), findsOneWidget);
      expect(find.text('Chuỗi ngày học'), findsOneWidget);

      await tester.tap(find.text('Chuỗi ngày học'));
      expect(selected, equals('STREAK'));
    });

    testWidgets('TierFilterBar handles taps on tier chips', (tester) async {
      int? selectedTier;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TierFilterBar(
              selectedTier: null,
              tierCounts: const {1: 10, 2: 12, 3: 8},
              onTierSelected: (tier) => selectedTier = tier,
            ),
          ),
        ),
      );

      expect(find.text('Tất cả cấp'), findsOneWidget);
      expect(find.text('Đồng'), findsOneWidget);

      await tester.tap(find.text('Đồng'));
      expect(selectedTier, equals(1));
    });

    testWidgets('AchievementDetailSheet renders complete details', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AchievementDetailSheet(achievement: mockAchievementUnlocked),
          ),
        ),
      );

      expect(find.text('Mới vào nghề'), findsOneWidget);
      expect(find.text('CẤP 1'), findsOneWidget);
      expect(find.text('Đã mở khóa'), findsOneWidget);
      expect(find.text('ĐÓNG'), findsOneWidget);
    });

    testWidgets('AchievementRewardDialog renders reward celebration', (tester) async {
      bool dismissed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AchievementRewardDialog(
              earnedXP: 500,
              earnedCoins: 300,
              earnedEnergy: 20,
              newlyUnlocked: const [
                NewlyUnlockedEntity(
                  id: 'STR_1',
                  title: 'Mới vào nghề',
                  desc: 'Mở khóa thành công',
                  tier: 1,
                  rewardXp: 500,
                  rewardCoins: 300,
                  rewardEnergy: 20,
                ),
              ],
              onDismiss: () => dismissed = true,
            ),
          ),
        ),
      );

      expect(find.text('THÀNH TỰU MỚI! 🎉'), findsOneWidget);
      expect(find.text('+500'), findsOneWidget);
      expect(find.text('+300'), findsOneWidget);
      expect(find.text('+20'), findsOneWidget);
      expect(find.text('TUYỆT VỜI'), findsOneWidget);

      await tester.tap(find.text('TUYỆT VỜI'));
      expect(dismissed, isTrue);
    });
  });
}
