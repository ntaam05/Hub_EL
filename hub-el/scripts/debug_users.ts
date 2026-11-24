import { prisma } from '../src/lib/prisma';

async function run() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, xp: true, level: true, currentStreak: true }
  });
  console.log('Users in DB:');
  for (const u of users) {
    console.log(u);
  }
  const friendships = await prisma.friendship.findMany();
  console.log('Friendships in DB count:', friendships.length);
  for (const f of friendships) {
    console.log(f.id, f.userId1, f.userId2, f.status);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

