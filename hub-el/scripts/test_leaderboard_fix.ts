import { prisma } from '../src/lib/prisma';
import { getLeaderboardService } from '../src/services/leaderboard.service';

async function test() {
  const userId = 'cmp2zxzh80001vcv44u74w80o'; // Hoàng Nhật Tâm
  console.log('Testing categories for user:', userId);
  for (const cat of ['GRINDER', 'STREAK', 'TIME', 'AI_KILLER'] as const) {
    for (const tf of ['ALL', 'DAY'] as const) {
      const res = await getLeaderboardService(cat, tf, userId);
      console.log(`[${cat} - ${tf}] success: ${res.success}, currentUser rank: ${res.data?.currentUser?.rank}, isTop50: ${res.data?.currentUser?.isTop50}, score: ${res.data?.currentUser?.scoreLabel}`);
    }
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());

