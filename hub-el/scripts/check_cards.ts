import { prisma } from '../src/lib/prisma';

function toDirectWikimediaUrl(url: string): string {
  if (url.includes('/commons/thumb/')) {
    return url.replace('/commons/thumb/', '/commons/').replace(/\/[^\/]+$/, '');
  }
  if (url.includes('/en/thumb/')) {
    return url.replace('/en/thumb/', '/en/').replace(/\/[^\/]+$/, '');
  }
  return url;
}

async function testAllDirect() {
  const cards = await prisma.wikiCard.findMany({ take: 20, select: { id: true, title: true, imageUrl: true } });
  let ok = 0;
  let fail = 0;
  for (const c of cards) {
    const directUrl = toDirectWikimediaUrl(c.imageUrl!);
    try {
      const res = await fetch(directUrl, {
        headers: { 'User-Agent': 'HubEL/1.0 (https://hub-el.com; contact@hub-el.com)' }
      });
      if (res.ok) {
        ok++;
        console.log(`Card ${c.id}: 200 OK -> ${directUrl}`);
      } else {
        fail++;
        console.log(`Card ${c.id}: ${res.status} FAIL -> ${directUrl}`);
      }
    } catch (e: any) {
      fail++;
      console.log(`Card ${c.id}: ERROR ${e.message}`);
    }
  }
  console.log(`Total 20 cards: ${ok} OK, ${fail} FAIL`);
}

testAllDirect().finally(() => prisma.$disconnect());
