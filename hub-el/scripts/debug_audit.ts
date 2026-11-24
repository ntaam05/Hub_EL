import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { getLeaderboardService } from '../src/services/leaderboard.service';

async function main() {
  const res = await getLeaderboardService('GRINDER', 'ALL', 'cmp2zxzh80001vcv44u74w80o');
  console.log('Success:', res.success);
  console.log('CurrentUser:', res.data?.currentUser);
  console.log('TopPlayers length:', res.data?.topPlayers?.length);
  console.log('TopPlayers:', res.data?.topPlayers);
}

main().catch(console.error).finally(() => process.exit(0));
