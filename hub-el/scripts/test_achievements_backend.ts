// scripts/test_achievements_backend.ts
import { prisma } from '../src/lib/prisma';
import { getAchievementsService } from '../src/services/achievements.service';
import { ACHIEVEMENT_LIST } from '../src/config/achievements';

async function runAchievementsTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING ACHIEVEMENTS BACKEND TESTS');
  console.log('==================================================');

  const userId = 'cmp2zxzh80001vcv44u74w80o'; // Hoàng Nhật Tâm
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${detail}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail}`);
      failCount++;
    }
  }

  // 1. Test Get Achievements
  const res = await getAchievementsService(userId);
  assert(res.success, 'Get Achievements Service Success');
  assert(res.data?.summary?.totalCount === 64, 'Total achievements count equals 64');
  assert(res.data?.achievements?.length === 64, 'List length equals 64');
  assert(typeof res.data?.summary?.unlockedCount === 'number', `Unlocked count is valid number (${res.data?.summary?.unlockedCount})`);
  assert(typeof res.data?.summary?.progressPercent === 'number', `Progress percent calculated (${res.data?.summary?.progressPercent}%)`);

  // 2. Check structure of individual achievement items
  const first = res.data?.achievements?.[0];
  assert(!!first?.id, 'Achievement has ID', first?.id);
  assert(!!first?.groupId, 'Achievement has Group ID', first?.groupId);
  assert(typeof first?.tier === 'number', 'Achievement has Tier');
  assert(typeof first?.currentProgress === 'number', 'Achievement has Progress value');
  assert(typeof first?.isUnlocked === 'boolean', 'Achievement has isUnlocked flag');

  // 3. Test Idempotency (calling twice should not duplicate awards)
  const res2 = await getAchievementsService(userId);
  assert(res2.success, 'Second call success');
  assert(res2.data?.earnedXP === 0, 'No duplicate XP awarded on second call');
  assert(res2.data?.newlyUnlocked?.length === 0, 'No duplicate newly unlocked items on second call');

  // 4. Test User Isolation (invalid user)
  const invalidUserRes = await getAchievementsService('non_existent_user_id');
  assert(!invalidUserRes.success, 'Invalid user ID handled gracefully');

  console.log(`\n📊 ACHIEVEMENTS TESTS RESULT: ${passCount} PASSED, ${failCount} FAILED\n`);
}

runAchievementsTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

