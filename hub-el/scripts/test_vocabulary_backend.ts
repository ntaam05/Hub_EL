// scripts/test_vocabulary_backend.ts
import { prisma } from '../src/lib/prisma';
import {
  getUserVocabularyService,
  getVocabularyDetailService,
  getVocabularyContextService,
} from '../src/services/vocabulary.service';

async function runVocabularyTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING VOCABULARY BACKEND TESTS');
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

  // 1. Test Get Vocabulary List
  const res = await getUserVocabularyService(userId, { limit: 100 });
  assert(res.success, 'Get User Vocabulary Success');
  assert(Array.isArray(res.data?.items), 'Items is an array');
  assert(typeof res.data?.pagination?.total === 'number', `Total vocabularies: ${res.data?.pagination?.total}`);

  // 2. Test Pagination
  const paged = await getUserVocabularyService(userId, { page: 1, limit: 3 });
  assert(paged.success, 'Pagination query success');
  assert((paged.data?.items?.length || 0) <= 3, 'Page size respected (<= 3)');
  assert(paged.data?.pagination?.limit === 3, 'Pagination limit metadata correct');

  // 3. Test Sorting (A-Z)
  if ((res.data?.items?.length || 0) > 1) {
    const items = res.data!.items;
    let isSorted = true;
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].word.localeCompare(items[i + 1].word) > 0) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Default sorting is A-Z');
  }

  // 4. Test Search Filter
  if ((res.data?.items?.length || 0) > 0) {
    const firstWord = res.data!.items[0].word;
    const searchRes = await getUserVocabularyService(userId, { search: firstWord.slice(0, 3) });
    assert(searchRes.success, 'Search filter query success');
    assert((searchRes.data?.items?.length || 0) > 0, `Search found matches for '${firstWord.slice(0, 3)}'`);
  }

  // 5. Test Vocabulary Context
  // Find a card owned by user
  const inventoryItem = await prisma.userInventory.findFirst({
    where: { userId },
    include: { card: { include: { vocabularies: true } } }
  });

  if (inventoryItem?.card) {
    const cardId = inventoryItem.card.id;
    const testWord = inventoryItem.card.vocabularies?.[0]?.word || inventoryItem.card.title;
    const contextRes = await getVocabularyContextService(userId, cardId, testWord);
    assert(contextRes.success, 'Get Vocabulary Context success');
    assert(!!contextRes.data?.cardTitle, 'Context returns card title', contextRes.data?.cardTitle);
  }

  // 6. Test User Isolation on Context (trying to get context of a card not owned)
  const unownedCard = await prisma.wikiCard.findFirst({
    where: {
      owners: { none: { userId } }
    }
  });

  if (unownedCard) {
    const blockedContext = await getVocabularyContextService(userId, unownedCard.id, 'word');
    assert(!blockedContext.success, 'Unowned card context access blocked properly', blockedContext.error);
  }

  console.log(`\n📊 VOCABULARY TESTS RESULT: ${passCount} PASSED, ${failCount} FAILED\n`);
}

runVocabularyTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
