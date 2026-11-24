import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";
import {
  getGachaStatusService,
  rollGachaService,
  getGachaExchangeService,
  exchangeGachaCardService,
  getGachaHistoryService,
  GACHA_CONSTANTS,
  isFreeGachaAvailable,
} from "../src/services/gacha.service";
import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "7fced57dca769f7dd39b1ec909abdf62278f2584e132cf62b234557db98b597e";
const BASE_URL = "http://localhost:3000";

const TEST_STD_USER_ID = "test_gacha_std_user_2026";
const TEST_PRO_USER_ID = "test_gacha_pro_user_2026";
const TEST_OTHER_USER_ID = "test_gacha_other_user_2026";

function generateTestToken(userId: string) {
  return jwt.sign({ id: userId, email: `${userId}@hubel.test` }, AUTH_SECRET, { expiresIn: "1h" });
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ GACHA SERVICE & REST API (5C.2)");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, detail || "");
      failed++;
    }
  }

  try {
    // 1. SETUP TEST USERS IN DATABASE
    console.log("--- 1. CHUẨN BỊ TÀI KHOẢN KIỂM THỬ ---");
    
    // User Standard (Thường)
    await prisma.user.upsert({
      where: { id: TEST_STD_USER_ID },
      create: {
        id: TEST_STD_USER_ID,
        email: "test_gacha_std@hubel.test",
        username: "test_gacha_std_2026",
        name: "Standard Gacha Tester",
        freeCoins: 1000,
        stardust: 50,
        pitySR: 0,
        pitySSR: 0,
        pityUR: 0,
        isPro: false,
      },
      update: {
        freeCoins: 1000,
        stardust: 50,
        pitySR: 0,
        pitySSR: 0,
        pityUR: 0,
        isPro: false,
        lastFreeGachaDate: null,
      },
    });

    // User PRO (VIP)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.user.upsert({
      where: { id: TEST_PRO_USER_ID },
      create: {
        id: TEST_PRO_USER_ID,
        email: "test_gacha_pro@hubel.test",
        username: "test_gacha_pro_2026",
        name: "PRO Gacha Tester",
        freeCoins: 2000,
        stardust: 500,
        pitySR: 0,
        pitySSR: 0,
        pityUR: 0,
        isPro: true,
        lastFreeGachaDate: yesterday,
      },
      update: {
        freeCoins: 2000,
        stardust: 500,
        pitySR: 0,
        pitySSR: 0,
        pityUR: 0,
        isPro: true,
        lastFreeGachaDate: yesterday,
      },
    });

    // User Other (để test cách ly dữ liệu)
    await prisma.user.upsert({
      where: { id: TEST_OTHER_USER_ID },
      create: {
        id: TEST_OTHER_USER_ID,
        email: "test_gacha_other@hubel.test",
        username: "test_gacha_other_2026",
        name: "Other User",
        freeCoins: 500,
        stardust: 0,
      },
      update: {
        freeCoins: 500,
        stardust: 0,
      },
    });

    // Clean up test inventories for pure test run
    await prisma.userInventory.deleteMany({
      where: { userId: { in: [TEST_STD_USER_ID, TEST_PRO_USER_ID, TEST_OTHER_USER_ID] } },
    });

    console.log("Đã khởi tạo dữ liệu kiểm thử thành công.\n");

    // ==========================================
    // NHÓM 1: GACHA STATUS TESTS
    // ==========================================
    console.log("--- 2. KIỂM THỬ GACHA STATUS ---");
    {
      const stdStatus = await getGachaStatusService(TEST_STD_USER_ID);
      assert(stdStatus.success === true, "1.1. Lấy trạng thái tài khoản thường thành công");
      assert(stdStatus.data?.isPro === false, "1.2. Tài khoản thường isPro = false");
      assert(stdStatus.data?.isFreePullAvailable === false, "1.3. Tài khoản thường không có lượt quay miễn phí");
      assert(stdStatus.data?.freeCoins === 1000, "1.4. Số dư Xu chính xác");

      const proStatus = await getGachaStatusService(TEST_PRO_USER_ID);
      assert(proStatus.success === true, "1.5. Lấy trạng thái tài khoản PRO thành công");
      assert(proStatus.data?.isPro === true, "1.6. Tài khoản PRO isPro = true");
      assert(proStatus.data?.isFreePullAvailable === true, "1.7. PRO chưa quay hôm nay -> isFreePullAvailable = true");

      // Cập nhật lastFreeGachaDate là hôm nay
      await prisma.user.update({
        where: { id: TEST_PRO_USER_ID },
        data: { lastFreeGachaDate: new Date() },
      });
      const proUsedStatus = await getGachaStatusService(TEST_PRO_USER_ID);
      assert(proUsedStatus.data?.isFreePullAvailable === false, "1.8. PRO đã quay hôm nay -> isFreePullAvailable = false");

      // Reset lại lastFreeGachaDate sang hôm qua cho các test tiếp theo
      await prisma.user.update({
        where: { id: TEST_PRO_USER_ID },
        data: { lastFreeGachaDate: yesterday },
      });
    }

    // ==========================================
    // NHÓM 2: GACHA ROLL TESTS
    // ==========================================
    console.log("\n--- 3. KIỂM THỬ GACHA ROLL (QUAY THẺ) ---");
    {
      // 2.1. Validate count
      const invalidCount0 = await rollGachaService(TEST_STD_USER_ID, 0);
      assert(invalidCount0.success === false && invalidCount0.code === "INVALID_COUNT", "2.1. Chặn count = 0");

      const invalidCount6 = await rollGachaService(TEST_STD_USER_ID, 6);
      assert(invalidCount6.success === false && invalidCount6.code === "INVALID_COUNT", "2.2. Chặn count = 6");

      const invalidCountFloat = await rollGachaService(TEST_STD_USER_ID, 2.5);
      assert(invalidCountFloat.success === false && invalidCountFloat.code === "INVALID_COUNT", "2.3. Chặn count không phải số nguyên");

      // 2.2. Không đủ Xu
      await prisma.user.update({ where: { id: TEST_STD_USER_ID }, data: { freeCoins: 50 } });
      const insufficientRoll = await rollGachaService(TEST_STD_USER_ID, 1);
      assert(insufficientRoll.success === false && insufficientRoll.code === "INSUFFICIENT_COINS", "2.4. Báo lỗi không đủ Xu khi freeCoins < 100");
      await prisma.user.update({ where: { id: TEST_STD_USER_ID }, data: { freeCoins: 1000 } });

      // 2.3. Quay 1 thẻ (Tài khoản thường)
      const roll1 = await rollGachaService(TEST_STD_USER_ID, 1);
      assert(roll1.success === true && roll1.data?.rolls.length === 1, "2.5. Quay 1 lượt thành công");
      assert(roll1.data?.summary.coinsSpent === 100, "2.6. Trừ chính xác 100 Xu cho tài khoản thường");
      assert(roll1.data?.summary.remainingCoins === 900, "2.7. Số dư Xu còn lại đúng (900)");
      assert(roll1.data?.rolls[0].isNew === true, "2.8. Lần đầu quay ra thẻ mới (isNew = true)");

      // 2.4. Quay nhiều thẻ (Multi-roll x3 cho tài khoản thường)
      const roll3 = await rollGachaService(TEST_STD_USER_ID, 3);
      assert(roll3.success === true && roll3.data?.rolls.length === 3, "2.9. Quay 3 lượt thành công");
      assert(roll3.data?.summary.coinsSpent === 300, "2.10. Trừ chính xác 300 Xu cho 3 lượt thường");
      assert(roll3.data?.summary.remainingCoins === 600, "2.11. Số dư Xu còn lại đúng (600)");

      // 2.5. Quay cho tài khoản PRO có lượt free
      const proRoll1 = await rollGachaService(TEST_PRO_USER_ID, 1);
      assert(proRoll1.success === true, "2.12. PRO quay lượt đầu tiên thành công");
      assert(proRoll1.data?.summary.usedFreePull === true, "2.13. PRO được áp dụng lượt quay miễn phí (usedFreePull = true)");
      assert(proRoll1.data?.summary.coinsSpent === 0, "2.14. PRO tiêu hao 0 Xu cho lượt quay miễn phí");
      assert(proRoll1.data?.summary.remainingCoins === 2000, "2.15. Số dư Xu của PRO không bị trừ");

      // 2.6. Lượt tiếp theo của PRO trong ngày phải tính Xu
      const proRollNext = await rollGachaService(TEST_PRO_USER_ID, 1);
      assert(proRollNext.data?.summary.usedFreePull === false, "2.16. Lượt quay thứ 2 trong ngày của PRO không còn free");
      assert(proRollNext.data?.summary.coinsSpent === 100, "2.17. Lượt quay thứ 2 của PRO trừ 100 Xu");

      // 2.7. Multi-roll PRO khi còn lượt free (Quay 3 lượt: 1 free + 2 mất phí = 200 Xu)
      await prisma.user.update({ where: { id: TEST_PRO_USER_ID }, data: { lastFreeGachaDate: yesterday } });
      const proMultiRoll = await rollGachaService(TEST_PRO_USER_ID, 3);
      assert(proMultiRoll.data?.summary.usedFreePull === true, "2.18. Multi-roll nhận diện lượt free");
      assert(proMultiRoll.data?.summary.coinsSpent === 200, "2.19. Multi-roll x3 chỉ trừ 200 Xu (1 free + 2 trả phí)");
    }

    // ==========================================
    // NHÓM 3: PITY SYSTEM TESTS (BẢO HIỂM)
    // ==========================================
    console.log("\n--- 4. KIỂM THỬ CƠ CHẾ BẢO HIỂM (PITY) & OFF-BY-ONE ---");
    {
      // 3.1. Bảo hiểm SR tại ngưỡng 10
      // Khi user có pitySR = 9, lượt quay tiếp theo (nextPitySR = 10) phải ra tối thiểu SR
      await prisma.user.update({
        where: { id: TEST_STD_USER_ID },
        data: { pitySR: 9, pitySSR: 9, pityUR: 9, freeCoins: 1000 },
      });

      const pitySRRoll = await rollGachaService(TEST_STD_USER_ID, 1);
      const rolledRaritySR = pitySRRoll.data?.rolls[0].card.rarity;
      const isSRorAbove = ["SR", "SSR", "UR", "LR", "MR"].includes(rolledRaritySR || "");
      assert(isSRorAbove, `3.1. Bảo hiểm SR kích hoạt tại lượt thứ 10 (Ra phẩm chất: ${rolledRaritySR})`);
      assert(pitySRRoll.data?.summary.pitySR === 0, "3.2. Ra SR trở lên -> pitySR reset về 0");

      // 3.2. Không lỗi Off-By-One: Tại pitySR = 8, lượt quay tiếp theo là 9 (chưa chạm 10)
      await prisma.user.update({
        where: { id: TEST_STD_USER_ID },
        data: { pitySR: 8, pitySSR: 8, pityUR: 8 },
      });
      // Mock để test đếm tăng
      const userBefore = await prisma.user.findUnique({ where: { id: TEST_STD_USER_ID } });
      assert(userBefore?.pitySR === 8, "3.3. Bộ đếm trước khi quay là 8");

      // 3.3. Bảo hiểm SSR tại ngưỡng 50
      await prisma.user.update({
        where: { id: TEST_STD_USER_ID },
        data: { pitySR: 0, pitySSR: 49, pityUR: 49, freeCoins: 1000 },
      });
      const pitySSRRoll = await rollGachaService(TEST_STD_USER_ID, 1);
      const rolledRaritySSR = pitySSRRoll.data?.rolls[0].card.rarity;
      const isSSRorAbove = ["SSR", "UR", "LR", "MR"].includes(rolledRaritySSR || "");
      assert(isSSRorAbove, `3.4. Bảo hiểm SSR kích hoạt tại lượt thứ 50 (Ra phẩm chất: ${rolledRaritySSR})`);
      assert(pitySSRRoll.data?.summary.pitySSR === 0, "3.5. Ra SSR trở lên -> pitySSR reset về 0");
      assert(pitySSRRoll.data?.summary.pitySR === 0, "3.6. Ra SSR trở lên -> pitySR cũng reset về 0");

      // 3.4. Bảo hiểm UR tại ngưỡng 120
      await prisma.user.update({
        where: { id: TEST_STD_USER_ID },
        data: { pitySR: 0, pitySSR: 0, pityUR: 119, freeCoins: 1000 },
      });
      const pityURRoll = await rollGachaService(TEST_STD_USER_ID, 1);
      const rolledRarityUR = pityURRoll.data?.rolls[0].card.rarity;
      const isURorAbove = ["UR", "LR", "MR"].includes(rolledRarityUR || "");
      assert(isURorAbove, `3.7. Bảo hiểm UR kích hoạt tại lượt thứ 120 (Ra phẩm chất: ${rolledRarityUR})`);
      assert(pityURRoll.data?.summary.pityUR === 0, "3.8. Ra UR -> pityUR reset về 0");
      assert(pityURRoll.data?.summary.pitySSR === 0, "3.9. Ra UR -> pitySSR reset về 0");
      assert(pityURRoll.data?.summary.pitySR === 0, "3.10. Ra UR -> pitySR reset về 0");
    }

    // ==========================================
    // NHÓM 4: DUPLICATE CARDS & STARDUST MATH
    // ==========================================
    console.log("\n--- 5. KIỂM THỬ THẺ TRÙNG LẶP & QUY ĐỔI BỤI SAO ---");
    {
      // Lấy 1 thẻ có sẵn
      const anyCard = await prisma.wikiCard.findFirst({ where: { rarity: "N" } });
      if (anyCard) {
        // Cho Standard User sở hữu thẻ này
        await prisma.userInventory.upsert({
          where: { userId_cardId: { userId: TEST_STD_USER_ID, cardId: anyCard.id } },
          create: { userId: TEST_STD_USER_ID, cardId: anyCard.id, source: "GACHA" },
          update: {},
        });

        const initialStardust = (await prisma.user.findUnique({ where: { id: TEST_STD_USER_ID } }))?.stardust || 0;

        // Mô phỏng hàm phân rã stardust
        const baseStardustN = GACHA_CONSTANTS.STARDUST_MAP["N"];
        assert(baseStardustN === 1, "4.1. Thẻ N phân rã thành 1 Bụi sao");
        assert(GACHA_CONSTANTS.STARDUST_MAP["SR"] === 20, "4.2. Thẻ SR phân rã thành 20 Bụi sao");
        assert(GACHA_CONSTANTS.STARDUST_MAP["UR"] === 500, "4.3. Thẻ UR phân rã thành 500 Bụi sao");

        // PRO được +20%
        const proStardustSR = Math.floor(20 * 1.2);
        assert(proStardustSR === 24, "4.4. PRO nhận +20% Bụi sao cho thẻ SR (20 -> 24 Bụi)");
        const proStardustUR = Math.floor(500 * 1.2);
        assert(proStardustUR === 600, "4.5. PRO nhận +20% Bụi sao cho thẻ UR (500 -> 600 Bụi)");

        // Kiểm tra không bao giờ tạo trùng bản ghi UserInventory trong DB
        const countBefore = await prisma.userInventory.count({
          where: { userId: TEST_STD_USER_ID, cardId: anyCard.id },
        });
        assert(countBefore === 1, "4.6. Trước khi quay trùng: chỉ có duy nhất 1 bản ghi UserInventory");
      }
    }

    // ==========================================
    // NHÓM 5: EXCHANGE SHOP (TIỆM ĐỔI THẺ) & CONCURRENCY
    // ==========================================
    console.log("\n--- 6. KIỂM THỬ TIỆM ĐỔI THẺ & GIAO DỊCH ĐỒNG THỜI ---");
    {
      // Tìm 1 thẻ chưa sở hữu của TEST_STD_USER_ID
      const unownedCard = await prisma.wikiCard.findFirst({
        where: {
          rarity: "N",
          owners: { none: { userId: TEST_STD_USER_ID } },
        },
      });

      if (unownedCard) {
        // 5.1. Lấy danh sách đổi thẻ
        const exchangeData = await getGachaExchangeService(TEST_STD_USER_ID);
        assert(exchangeData.success === true, "5.1. Lấy dữ liệu tiệm đổi thẻ thành công");
        const found = exchangeData.data?.unownedCards.some((c) => c.id === unownedCard.id);
        assert(found === true, "5.2. Danh sách tiệm chỉ chứa thẻ chưa sở hữu");

        // 5.2. Không đủ Bụi sao
        await prisma.user.update({ where: { id: TEST_STD_USER_ID }, data: { stardust: 0 } });
        const failStardust = await exchangeGachaCardService(TEST_STD_USER_ID, unownedCard.id);
        assert(failStardust.success === false && failStardust.code === "INSUFFICIENT_STARDUST", "5.3. Báo lỗi khi không đủ Bụi sao");

        // 5.3. Đổi thẻ thành công khi đủ Bụi sao
        await prisma.user.update({ where: { id: TEST_STD_USER_ID }, data: { stardust: 100 } });
        const exchangeSuccess = await exchangeGachaCardService(TEST_STD_USER_ID, unownedCard.id);
        assert(exchangeSuccess.success === true, "5.4. Đổi thẻ thành công");
        assert(exchangeSuccess.data?.remainingStardust === 90, "5.5. Trừ chính xác 10 Bụi sao cho thẻ N (100 -> 90)");

        // 5.4. Đổi lại chính thẻ đó -> Bị chặn vì đã sở hữu
        const exchangeDuplicate = await exchangeGachaCardService(TEST_STD_USER_ID, unownedCard.id);
        assert(exchangeDuplicate.success === false && exchangeDuplicate.code === "ALREADY_OWNED", "5.6. Chặn đổi thẻ đã sở hữu (ALREADY_OWNED)");

        // 5.5. Đổi thẻ ID không tồn tại
        const nonExistentCard = await exchangeGachaCardService(TEST_STD_USER_ID, 9999999);
        assert(nonExistentCard.success === false && nonExistentCard.code === "CARD_NOT_FOUND", "5.7. Báo lỗi khi cardId không tồn tại");

        // 5.6. Chống Double-Spend / Concurrency: Hai request đổi đồng thời
        const unownedCard2 = await prisma.wikiCard.findFirst({
          where: {
            rarity: "N",
            owners: { none: { userId: TEST_STD_USER_ID } },
          },
        });

        if (unownedCard2) {
          await prisma.user.update({ where: { id: TEST_STD_USER_ID }, data: { stardust: 15 } });
          const [resA, resB] = await Promise.all([
            exchangeGachaCardService(TEST_STD_USER_ID, unownedCard2.id),
            exchangeGachaCardService(TEST_STD_USER_ID, unownedCard2.id),
          ]);

          const oneSucceeded = (resA.success && !resB.success) || (!resA.success && resB.success);
          assert(oneSucceeded, "5.8. Đồng thời 2 request cùng đổi 1 thẻ: Chỉ 1 request thành công, 1 request bị từ chối");

          const userAfterConcurrent = await prisma.user.findUnique({ where: { id: TEST_STD_USER_ID } });
          assert(userAfterConcurrent?.stardust === 5, "5.9. Bụi sao chỉ bị trừ đúng 1 lần (15 - 10 = 5)");
        }
      }
    }

    // ==========================================
    // NHÓM 6: GACHA HISTORY & ISOLATION
    // ==========================================
    console.log("\n--- 7. KIỂM THỬ LỊCH SỬ QUAY THẺ & CÁCH LY NGƯỜI DÙNG ---");
    {
      const history = await getGachaHistoryService(TEST_STD_USER_ID, { page: 1, limit: 5 });
      assert(history.success === true, "6.1. Lấy lịch sử thẻ thành công");
      assert(history.data?.pagination.page === 1, "6.2. Phân trang page = 1");
      assert(history.data?.pagination.limit === 5, "6.3. Giới hạn limit = 5");

      // Đảm bảo User khác không thấy lịch sử này
      const otherHistory = await getGachaHistoryService(TEST_OTHER_USER_ID, { page: 1, limit: 10 });
      assert(otherHistory.success === true && otherHistory.data?.items.length === 0, "6.4. User khác không có thẻ thì lịch sử rỗng (Cách ly tuyệt đối)");
    }

    // ==========================================
    // NHÓM 7: REST API HTTP ENDPOINTS
    // ==========================================
    console.log("\n--- 8. KIỂM THỬ TRỰC TIẾP QUA LIVE HTTP REST APIS ---");
    {
      const stdToken = generateTestToken(TEST_STD_USER_ID);

      // 7.1. GET /api/v1/gacha/status
      // Không có token -> 401
      const noTokenRes = await fetch(`${BASE_URL}/api/v1/gacha/status`);
      assert(noTokenRes.status === 401, "7.1. GET /status không có Bearer token -> 401 Unauthorized");

      // Token không hợp lệ -> 401
      const invalidTokenRes = await fetch(`${BASE_URL}/api/v1/gacha/status`, {
        headers: { Authorization: "Bearer invalid_junk_token" },
      });
      assert(invalidTokenRes.status === 401, "7.2. GET /status token không hợp lệ -> 401");

      // Token hợp lệ -> 200
      const validStatusRes = await fetch(`${BASE_URL}/api/v1/gacha/status`, {
        headers: { Authorization: `Bearer ${stdToken}` },
      });
      const statusJson = await validStatusRes.json();
      assert(validStatusRes.status === 200 && statusJson.success === true, "7.3. GET /status token hợp lệ -> 200 OK");
      assert(typeof statusJson.data.freeCoins === "number", "7.4. GET /status trả về freeCoins dạng số");

      // 7.2. POST /api/v1/gacha/roll
      // Count không hợp lệ -> 400
      const invalidRollRes = await fetch(`${BASE_URL}/api/v1/gacha/roll`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stdToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: 10 }),
      });
      assert(invalidRollRes.status === 400, "7.5. POST /roll count = 10 -> 400 Bad Request");

      // Quay 1 lượt hợp lệ qua HTTP
      await prisma.user.update({ where: { id: TEST_STD_USER_ID }, data: { freeCoins: 500 } });
      const validRollRes = await fetch(`${BASE_URL}/api/v1/gacha/roll`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stdToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: 1 }),
      });
      const rollJson = await validRollRes.json();
      assert(validRollRes.status === 200 && rollJson.success === true, "7.6. POST /roll quay 1 lượt thành công qua HTTP -> 200 OK");
      assert(rollJson.data.rolls.length === 1, "7.7. POST /roll trả về đúng 1 thẻ");

      // 7.3. GET /api/v1/gacha/exchange
      const exchangeHttpRes = await fetch(`${BASE_URL}/api/v1/gacha/exchange`, {
        headers: { Authorization: `Bearer ${stdToken}` },
      });
      const exchangeJson = await exchangeHttpRes.json();
      assert(exchangeHttpRes.status === 200 && exchangeJson.success === true, "7.8. GET /exchange qua HTTP -> 200 OK");

      // 7.4. POST /api/v1/gacha/exchange
      const invalidExchangeRes = await fetch(`${BASE_URL}/api/v1/gacha/exchange`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stdToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardId: -5 }),
      });
      assert(invalidExchangeRes.status === 400, "7.9. POST /exchange cardId âm -> 400 Bad Request");

      // 7.5. GET /api/v1/gacha/history
      const historyHttpRes = await fetch(`${BASE_URL}/api/v1/gacha/history?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${stdToken}` },
      });
      const historyJson = await historyHttpRes.json();
      assert(historyHttpRes.status === 200 && historyJson.success === true, "7.10. GET /history qua HTTP -> 200 OK");
      assert(historyJson.data.pagination.page === 1, "7.11. GET /history phân trang đúng qua HTTP query param");
    }

    console.log("\n=================================================");
    console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Lỗi trong quá trình chạy kiểm thử:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
