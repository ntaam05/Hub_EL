import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/achievements/domain/entities/achievement_entities.dart';
import 'package:hub_el_mobile/features/achievements/domain/repositories/achievements_repository.dart';
import 'package:hub_el_mobile/features/achievements/domain/usecases/get_achievements_usecase.dart';
import 'package:hub_el_mobile/features/achievements/presentation/cubit/achievements_cubit.dart';
import 'package:hub_el_mobile/features/achievements/presentation/cubit/achievements_state.dart';

class MockAchievementsRepository implements IAchievementsRepository {
  bool shouldFail = false;
  String errorMessage = 'Lỗi kết nối';
  AchievementsDataEntity? customData;

  @override
  Future<ApiResult<AchievementsDataEntity>> getAchievements() async {
    if (shouldFail) {
      return ApiFailure(message: errorMessage);
    }
    return ApiSuccess(customData ?? _defaultData);
  }

  static const _defaultData = AchievementsDataEntity(
    summary: AchievementSummaryEntity(
      totalCount: 4,
      unlockedCount: 2,
      progressPercent: 50,
    ),
    achievements: [
      AchievementItemEntity(
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
        rewardCoins: 0,
        rewardEnergy: 10,
      ),
      AchievementItemEntity(
        id: 'STR_2',
        groupId: 'STREAK',
        tier: 2,
        title: 'Thợ săn thói quen',
        desc: 'Đạt chuỗi học 7 ngày liên tiếp.',
        reqType: 'highestStreak',
        reqValue: 7,
        currentProgress: 3,
        progressPercent: 43,
        isUnlocked: false,
        rewardXp: 300,
        rewardCoins: 0,
        rewardEnergy: 25,
      ),
      AchievementItemEntity(
        id: 'LVL_1',
        groupId: 'LEVEL',
        tier: 1,
        title: 'Tân binh',
        desc: 'Đạt Cấp 5.',
        reqType: 'level',
        reqValue: 5,
        currentProgress: 5,
        progressPercent: 100,
        isUnlocked: true,
        rewardXp: 0,
        rewardCoins: 200,
        rewardEnergy: 15,
      ),
      AchievementItemEntity(
        id: 'VOC_1',
        groupId: 'VOCAB',
        tier: 3,
        title: 'Từ điển sống',
        desc: 'Học được 2,000 từ vựng mới.',
        reqType: 'learnedWordsCount',
        reqValue: 2000,
        currentProgress: 120,
        progressPercent: 6,
        isUnlocked: false,
        rewardXp: 4000,
        rewardCoins: 2000,
        rewardEnergy: 50,
      ),
    ],
    newlyUnlocked: [
      NewlyUnlockedEntity(
        id: 'LVL_1',
        title: 'Tân binh',
        desc: 'Đạt Cấp 5.',
        tier: 1,
        rewardXp: 0,
        rewardCoins: 200,
        rewardEnergy: 15,
      ),
    ],
    earnedXP: 0,
    earnedCoins: 200,
    earnedEnergy: 15,
  );
}

void main() {
  group('AchievementsCubit Tests', () {
    late MockAchievementsRepository mockRepository;
    late GetAchievementsUseCase useCase;
    late AchievementsCubit cubit;

    setUp(() {
      mockRepository = MockAchievementsRepository();
      useCase = GetAchievementsUseCase(repository: mockRepository);
      cubit = AchievementsCubit(getAchievementsUseCase: useCase);
    });

    tearDown(() {
      cubit.close();
    });

    test('Initial state is correct', () {
      expect(cubit.state.status, equals(AchievementsStatus.initial));
      expect(cubit.state.data, isNull);
      expect(cubit.state.selectedGroup, isNull);
      expect(cubit.state.selectedTier, isNull);
      expect(cubit.state.filterStatus, equals(AchievementFilterStatus.all));
      expect(cubit.state.searchQuery, isEmpty);
      expect(cubit.state.showCelebration, isFalse);
    });

    test('loadAchievements success emits loading and loaded with celebration', () async {
      final future = cubit.loadAchievements();

      expect(cubit.state.status, equals(AchievementsStatus.loading));

      await future;

      expect(cubit.state.status, equals(AchievementsStatus.loaded));
      expect(cubit.state.data, isNotNull);
      expect(cubit.state.data!.summary.totalCount, equals(4));
      expect(cubit.state.showCelebration, isTrue); // because hasEarnedRewards = true
      expect(cubit.state.filteredAchievements.length, equals(4));
    });

    test('loadAchievements failure emits loading and error', () async {
      mockRepository.shouldFail = true;
      mockRepository.errorMessage = 'Lỗi máy chủ';

      await cubit.loadAchievements();

      expect(cubit.state.status, equals(AchievementsStatus.error));
      expect(cubit.state.errorMessage, equals('Lỗi máy chủ'));
    });

    test('filterByGroup toggles selection and filters items correctly', () async {
      await cubit.loadAchievements();

      // Filter by STREAK
      cubit.filterByGroup('STREAK');
      expect(cubit.state.selectedGroup, equals('STREAK'));
      expect(cubit.state.filteredAchievements.length, equals(2));
      expect(cubit.state.filteredAchievements.every((a) => a.groupId == 'STREAK'), isTrue);

      // Tap STREAK again to unselect
      cubit.filterByGroup('STREAK');
      expect(cubit.state.selectedGroup, isNull);
      expect(cubit.state.filteredAchievements.length, equals(4));
    });

    test('filterByTier toggles selection and filters items correctly', () async {
      await cubit.loadAchievements();

      // Filter by Tier 1
      cubit.filterByTier(1);
      expect(cubit.state.selectedTier, equals(1));
      expect(cubit.state.filteredAchievements.length, equals(2));
      expect(cubit.state.filteredAchievements.every((a) => a.tier == 1), isTrue);

      // Tap Tier 1 again to unselect
      cubit.filterByTier(1);
      expect(cubit.state.selectedTier, isNull);
      expect(cubit.state.filteredAchievements.length, equals(4));
    });

    test('setFilterStatus filters unlocked vs inProgress correctly', () async {
      await cubit.loadAchievements();

      // Filter Unlocked only
      cubit.setFilterStatus(AchievementFilterStatus.unlocked);
      expect(cubit.state.filterStatus, equals(AchievementFilterStatus.unlocked));
      expect(cubit.state.filteredAchievements.length, equals(2));
      expect(cubit.state.filteredAchievements.every((a) => a.isUnlocked), isTrue);

      // Filter InProgress only
      cubit.setFilterStatus(AchievementFilterStatus.inProgress);
      expect(cubit.state.filterStatus, equals(AchievementFilterStatus.inProgress));
      expect(cubit.state.filteredAchievements.length, equals(2));
      expect(cubit.state.filteredAchievements.every((a) => !a.isUnlocked), isTrue);

      // Back to All
      cubit.setFilterStatus(AchievementFilterStatus.all);
      expect(cubit.state.filteredAchievements.length, equals(4));
    });

    test('setSearchQuery filters achievements by title or description', () async {
      await cubit.loadAchievements();

      cubit.setSearchQuery('thói quen');
      expect(cubit.state.filteredAchievements.length, equals(1));
      expect(cubit.state.filteredAchievements.first.id, equals('STR_2'));

      cubit.setSearchQuery('Cấp 5');
      expect(cubit.state.filteredAchievements.length, equals(1));
      expect(cubit.state.filteredAchievements.first.id, equals('LVL_1'));

      cubit.setSearchQuery('Không có');
      expect(cubit.state.filteredAchievements.length, equals(0));
    });

    test('selectAchievement, dismissCelebration and resetFilters work properly', () async {
      await cubit.loadAchievements();
      expect(cubit.state.showCelebration, isTrue);

      cubit.dismissCelebration();
      expect(cubit.state.showCelebration, isFalse);

      final ach = cubit.state.data!.achievements.first;
      cubit.selectAchievement(ach);
      expect(cubit.state.selectedAchievement, equals(ach));

      cubit.selectAchievement(null);
      expect(cubit.state.selectedAchievement, isNull);

      // Apply some filters
      cubit.filterByGroup('STREAK');
      cubit.filterByTier(1);
      cubit.setFilterStatus(AchievementFilterStatus.unlocked);
      cubit.setSearchQuery('test');

      cubit.resetFilters();
      expect(cubit.state.selectedGroup, isNull);
      expect(cubit.state.selectedTier, isNull);
      expect(cubit.state.filterStatus, equals(AchievementFilterStatus.all));
      expect(cubit.state.searchQuery, isEmpty);
    });
  });
}
