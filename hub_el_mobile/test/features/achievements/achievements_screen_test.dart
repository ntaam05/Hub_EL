import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/achievements/domain/entities/achievement_entities.dart';
import 'package:hub_el_mobile/features/achievements/domain/repositories/achievements_repository.dart';
import 'package:hub_el_mobile/features/achievements/domain/usecases/get_achievements_usecase.dart';
import 'package:hub_el_mobile/features/achievements/presentation/cubit/achievements_cubit.dart';
import 'package:hub_el_mobile/features/achievements/presentation/screens/achievements_screen.dart';
import 'package:hub_el_mobile/features/achievements/presentation/widgets/achievement_card.dart';
import 'package:hub_el_mobile/features/achievements/presentation/widgets/achievement_dashboard_card.dart';
import 'package:hub_el_mobile/features/authentication/domain/entities/user_entity.dart';
import 'package:hub_el_mobile/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:hub_el_mobile/features/authentication/presentation/bloc/auth_state.dart';

class MockAchievementsRepo implements IAchievementsRepository {
  @override
  Future<ApiResult<AchievementsDataEntity>> getAchievements() async {
    final achievements = List.generate(64, (index) {
      final tier = (index % 6) + 1;
      final group = AchievementGroup.values[index % AchievementGroup.values.length];
      return AchievementItemEntity(
        id: 'ACH_$index',
        groupId: group.code,
        tier: tier,
        title: 'Thành tựu số ${index + 1}',
        desc: 'Mô tả chi tiết cho thành tựu số ${index + 1}',
        reqType: 'count',
        reqValue: (index + 1) * 10,
        currentProgress: index < 15 ? (index + 1) * 10 : (index * 2),
        progressPercent: index < 15 ? 100 : ((index * 2) * 100 ~/ ((index + 1) * 10)),
        isUnlocked: index < 15,
        rewardXp: tier * 100,
        rewardCoins: tier * 50,
        rewardEnergy: tier * 5,
      );
    });

    return ApiSuccess(
      AchievementsDataEntity(
        summary: const AchievementSummaryEntity(
          totalCount: 64,
          unlockedCount: 15,
          progressPercent: 23,
        ),
        achievements: achievements,
      ),
    );
  }
}

class FakeAuthBloc extends Fake implements AuthBloc {
  @override
  AuthState get state => const Authenticated(
        user: UserEntity(
          id: 'user1',
          email: 'test@hub-el.com',
          name: 'Hoàng Nhật Tâm',
          level: 5,
          xp: 1200,
          freeCoins: 500,
          aiTokens: 50,
          isPro: true,
        ),
      );

  @override
  Stream<AuthState> get stream => const Stream.empty();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('AchievementsScreen loads and renders 64 achievements properly', (tester) async {
    tester.view.physicalSize = const Size(800, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final repo = MockAchievementsRepo();
    final useCase = GetAchievementsUseCase(repository: repo);
    final cubit = AchievementsCubit(getAchievementsUseCase: useCase);
    final authBloc = FakeAuthBloc();

    await tester.pumpWidget(
      MultiBlocProvider(
        providers: [
          BlocProvider<AchievementsCubit>.value(value: cubit),
          BlocProvider<AuthBloc>.value(value: authBloc),
        ],
        child: const MaterialApp(
          home: AchievementsScreen(),
        ),
      ),
    );

    // Initial pump
    await tester.pump();
    await tester.pumpAndSettle();

    // Verify AppBar & Title (both AppBar and Dashboard Card display it)
    expect(find.text('BẢNG VÀNG THÀNH TỰU'), findsNWidgets(2));

    // Verify Dashboard Card
    expect(find.byType(AchievementDashboardCard), findsOneWidget);
    expect(find.text('23%'), findsOneWidget);
    expect(find.text('15 / 64'), findsOneWidget);

    // Verify filter tabs & dashboard stat
    expect(find.text('Tất cả'), findsWidgets);
    expect(find.text('Đã mở khóa'), findsNWidgets(2));
    expect(find.text('Đang tiến hành'), findsOneWidget);

    // Verify achievement list count indicator
    expect(find.text('DANH SÁCH HUY HIỆU (64)'), findsOneWidget);

    // Verify AchievementCards are rendered
    expect(find.byType(AchievementCard), findsWidgets);
  });
}
