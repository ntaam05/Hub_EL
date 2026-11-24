import { prisma } from '../src/lib/prisma';

async function run() {
  const stats = await prisma.userStats.findUnique({ where: { userId: 'cmp2zxzh80001vcv44u74w80o' } });
  console.log('User stats:', stats);
  const daily = await prisma.dailyStat.findMany({ where: { userId: 'cmp2zxzh80001vcv44u74w80o' } });
  console.log('User daily stats count:', daily.length);
  const quizAttempts = await prisma.quizAttempt.findMany({ where: { userId: 'cmp2zxzh80001vcv44u74w80o' } });
  console.log('User quiz attempts count:', quizAttempts.length);
  for (const q of quizAttempts) {
    console.log('Quiz attempt:', q.id, q.videoId, q.score, q.correctCount, q.totalQuizzes, q.createdAt);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

