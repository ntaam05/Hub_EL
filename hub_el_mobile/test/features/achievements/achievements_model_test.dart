import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/achievements/data/datasources/achievements_remote_data_source.dart';
import 'package:hub_el_mobile/features/achievements/data/models/achievement_models.dart';
import 'package:hub_el_mobile/features/achievements/data/repositories/achievements_repository_impl.dart';
import 'package:hub_el_mobile/features/achievements/domain/entities/achievement_entities.dart';
import 'package:hub_el_mobile/features/achievements/domain/usecases/get_achievements_usecase.dart';

class MockAchievementsRemoteDataSource implements IAchievementsRemoteDataSource {
  bool shouldFail = false;
  String errorMessage = 'Lỗi máy chủ khi tải thành tựu';
  AchievementsDataModel? customData;

  @override
  Future<ApiResult<AchievementsDataModel>> getAchievements() async {
    if (shouldFail) {
      return ApiFailure(message: errorMessage);
    }
    return ApiSuccess(customData ?? _defaultMockData);
  }

  static const _defaultMockData = AchievementsDataModel(
    summary: AchievementSummaryModel(
      totalCount: 64,
      unlockedCount: 12,
      progressPercent: 19,
    ),
    achievements: [
      AchievementItemModel(
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
      AchievementItemModel(
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
      AchievementItemModel(
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
    ],
    newlyUnlocked: [
      NewlyUnlockedModel(
        id: 'STR_1',
        title: 'Mới vào nghề',
        desc: 'Đạt chuỗi học 3 ngày liên tiếp.',
        tier: 1,
        rewardXp: 100,
        rewardCoins: 0,
        rewardEnergy: 10,
      ),
    ],
    earnedXP: 100,
    earnedCoins: 0,
    earnedEnergy: 10,
  );
}

void main() {
  group('Achievements Models & Enums Tests', () {
    test('AchievementTier enum mapping works correctly', () {
      expect(AchievementTier.fromLevel(1), equals(AchievementTier.bronze));
      expect(AchievementTier.fromLevel(2), equals(AchievementTier.silver));
      expect(AchievementTier.fromLevel(3), equals(AchievementTier.gold));
      expect(AchievementTier.fromLevel(4), equals(AchievementTier.platinum));
      expect(AchievementTier.fromLevel(5), equals(AchievementTier.diamond));
      expect(AchievementTier.fromLevel(6), equals(AchievementTier.master));
      expect(AchievementTier.fromLevel(99), equals(AchievementTier.bronze)); // fallback
    });

    test('AchievementGroup enum mapping works correctly', () {
      expect(AchievementGroup.fromCode('STREAK'), equals(AchievementGroup.streak));
      expect(AchievementGroup.fromCode('level'), equals(AchievementGroup.level));
      expect(AchievementGroup.fromCode('EASTER_EGG'), equals(AchievementGroup.easterEgg));
      expect(AchievementGroup.fromCode('UNKNOWN'), equals(AchievementGroup.misc)); // fallback
    });

    test('AchievementItemModel parses JSON correctly', () {
      final json = {
        'id': 'STR_4',
        'groupId': 'STREAK',
        'tier': 4,
        'title': 'Ý chí sắt đá',
        'desc': 'Đạt chuỗi học 100 ngày liên tiếp.',
        'reqType': 'highestStreak',
        'reqValue': 100,
        'currentProgress': 45,
        'progressPercent': 45,
        'isUnlocked': false,
        'rewardXp': 3000,
        'rewardCoins': 1500,
        'rewardEnergy': 100,
      };

      final model = AchievementItemModel.fromJson(json);

      expect(model.id, equals('STR_4'));
      expect(model.groupId, equals('STREAK'));
      expect(model.tier, equals(4));
      expect(model.tierEnum, equals(AchievementTier.platinum));
      expect(model.title, equals('Ý chí sắt đá'));
      expect(model.reqValue, equals(100));
      expect(model.currentProgress, equals(45));
      expect(model.progressPercent, equals(45));
      expect(model.isUnlocked, isFalse);
      expect(model.rewardXp, equals(3000));
      expect(model.rewardCoins, equals(1500));
      expect(model.rewardEnergy, equals(100));
      expect(model.hasRewards, isTrue);

      final outJson = model.toJson();
      expect(outJson['id'], equals('STR_4'));
      expect(outJson['rewardXp'], equals(3000));
    });

    test('AchievementSummaryModel parses JSON correctly', () {
      final json = {
        'totalCount': 64,
        'unlockedCount': 20,
        'progressPercent': 31,
      };

      final summary = AchievementSummaryModel.fromJson(json);

      expect(summary.totalCount, equals(64));
      expect(summary.unlockedCount, equals(20));
      expect(summary.lockedCount, equals(44));
      expect(summary.progressPercent, equals(31));
    });

    test('AchievementsDataModel parses full API payload', () {
      final payload = {
        'summary': {
          'totalCount': 64,
          'unlockedCount': 10,
          'progressPercent': 16,
        },
        'achievements': [
          {
            'id': 'GC_1',
            'groupId': 'GACHA',
            'tier': 1,
            'title': 'Người thử vận may',
            'desc': 'Thực hiện 50 lần quay Gacha.',
            'reqType': 'totalGachaPulls',
            'reqValue': 50,
            'currentProgress': 50,
            'progressPercent': 100,
            'isUnlocked': true,
            'rewardXp': 100,
            'rewardCoins': 200,
            'rewardEnergy': 0,
          }
        ],
        'newlyUnlocked': [
          {
            'id': 'GC_1',
            'title': 'Người thử vận may',
            'desc': 'Thực hiện 50 lần quay Gacha.',
            'tier': 1,
            'rewardXp': 100,
            'rewardCoins': 200,
            'rewardEnergy': 0,
          }
        ],
        'earnedXP': 100,
        'earnedCoins': 200,
        'earnedEnergy': 0,
      };

      final dataModel = AchievementsDataModel.fromJson(payload);

      expect(dataModel.summary.totalCount, equals(64));
      expect(dataModel.summary.unlockedCount, equals(10));
      expect(dataModel.achievements.length, equals(1));
      expect(dataModel.newlyUnlocked.length, equals(1));
      expect(dataModel.earnedXP, equals(100));
      expect(dataModel.earnedCoins, equals(200));
      expect(dataModel.earnedEnergy, equals(0));
      expect(dataModel.hasEarnedRewards, isTrue);
    });
  });

  group('Achievements Repository & UseCase Tests', () {
    late MockAchievementsRemoteDataSource mockDataSource;
    late AchievementsRepositoryImpl repository;
    late GetAchievementsUseCase useCase;

    setUp(() {
      mockDataSource = MockAchievementsRemoteDataSource();
      repository = AchievementsRepositoryImpl(remoteDataSource: mockDataSource);
      useCase = GetAchievementsUseCase(repository: repository);
    });

    test('GetAchievementsUseCase returns ApiSuccess when remote succeeds', () async {
      final result = await useCase();

      expect(result, isA<ApiSuccess<AchievementsDataEntity>>());
      final data = (result as ApiSuccess<AchievementsDataEntity>).data;
      expect(data.summary.totalCount, equals(64));
      expect(data.achievements.length, equals(3));
      expect(data.hasEarnedRewards, isTrue);
    });

    test('GetAchievementsUseCase returns ApiFailure when remote fails', () async {
      mockDataSource.shouldFail = true;
      mockDataSource.errorMessage = 'Network timeout';

      final result = await useCase();

      expect(result, isA<ApiFailure<AchievementsDataEntity>>());
      expect((result as ApiFailure<AchievementsDataEntity>).message, equals('Network timeout'));
    });
  });
}

