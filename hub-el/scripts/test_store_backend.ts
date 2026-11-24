// scripts/test_store_backend.ts
import { prisma } from '../src/lib/prisma';
import {
  getStoreCatalogService,
  exchangeResourcesService,
  createMoMoPaymentService,
  checkMoMoPaymentStatusService,
  getUserTransactionsService,
  VIP_PLANS,
  COIN_PACKAGES,
} from '../src/services/store.service';

async function runStoreTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING STORE & ECONOMY BACKEND TESTS');
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

  // 1. Test Get Store Catalog
  const catalog = await getStoreCatalogService(userId);
  assert(catalog.success, 'Get Store Catalog Success');
  assert(catalog.data?.vipPlans?.length === 3, 'VIP Plans count is 3');
  assert(catalog.data?.coinPackages?.length === 5, 'Coin Packages count is 5');
  assert(catalog.data?.exchangeRules?.length === 3, 'Exchange Rules count is 3');
  assert(typeof catalog.data?.balance?.freeCoins === 'number', 'User FreeCoins balance exists');

  // 2. Test Invalid Exchange Type
  const invalidExchange = await exchangeResourcesService(userId, 'INVALID_TYPE');
  assert(!invalidExchange.success, 'Invalid Exchange Type rejected');

  // 3. Test Exchange Resources with valid type
  // Give test user some coins if needed to ensure transaction works
  await prisma.user.update({
    where: { id: userId },
    data: { premiumCoins: { increment: 100 } }
  });

  const validExchange = await exchangeResourcesService(userId, 'GEM_TO_COIN');
  assert(validExchange.success, 'Exchange GEM_TO_COIN successful', validExchange.message);
  assert(validExchange.data?.reward === 1000, 'Rewarded 1000 FreeCoins correctly');

  // 4. Test Insufficient Balance
  // Temporarily set a dummy user with 0 balance
  const dummyUser = await prisma.user.findFirst({ where: { role: 'student', id: { not: userId } } });
  if (dummyUser) {
    await prisma.user.update({
      where: { id: dummyUser.id },
      data: { premiumCoins: 0, freeCoins: 0 }
    });
    const brokeExchange = await exchangeResourcesService(dummyUser.id, 'GEM_TO_ENERGY');
    assert(!brokeExchange.success, 'Insufficient balance rejected properly', brokeExchange.error);
  }

  // 5. Test Price Tampering Prevention in MoMo Order
  const tamperedOrder = await createMoMoPaymentService(userId, {
    type: 'VIP',
    amount: 9999, // Hack price
    name: 'Fake VIP'
  });
  assert(!tamperedOrder.success, 'Tampered price rejected by server');

  // 6. Test Valid MoMo Order Creation
  const validOrder = await createMoMoPaymentService(userId, {
    type: 'VIP',
    amount: 49000,
    name: 'Gói VIP 1 Tháng'
  });
  assert(validOrder.success, 'Valid MoMo order creation initiated');
  assert(!!validOrder.data?.orderId, 'Generated Order ID correctly', validOrder.data?.orderId);

  // 7. Test Check MoMo Order Status
  if (validOrder.data?.orderId) {
    const statusCheck = await checkMoMoPaymentStatusService(validOrder.data.orderId, userId, { testBypassMoMoQuery: true });
    assert(statusCheck.success, 'Checked and activated MoMo order successfully');
    assert(statusCheck.data?.status === 'SUCCESS', 'Order marked SUCCESS');
  }

  // 8. Test Transactions History
  const txHistory = await getUserTransactionsService(userId, 5);
  assert(txHistory.success, 'Get user transactions history success');
  assert(Array.isArray(txHistory.data?.orders), 'Orders list is an array');

  console.log(`\n📊 STORE TESTS RESULT: ${passCount} PASSED, ${failCount} FAILED\n`);
}

runStoreTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

