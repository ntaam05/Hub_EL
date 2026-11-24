import { prisma } from '../src/lib/prisma';

async function clean() {
  try {
    await prisma.friendship.delete({ where: { id: 35 } });
    console.log('Deleted duplicate friendship #35');
  } catch (e: any) {
    console.log('Already deleted or error:', e.message);
  }
}

clean().finally(() => prisma.$disconnect());

