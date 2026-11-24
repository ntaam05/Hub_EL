import { prisma } from '../src/lib/prisma';

async function run() {
  const u = await prisma.user.findUnique({ where: { id: 'cmp2zxzh80001vcv44u74w80o' } });
  console.log('image:', u?.image);
  console.log('avatar:', u?.avatar);
}

run().finally(() => prisma.$disconnect());

