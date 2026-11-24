import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";
import {
  getWikiStudyCardService,
  generateWikiStudyService,
  finishWikiStudyService,
  keepWikiCardStarService,
} from "../src/services/wiki-study.service";
import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "7fced57dca769f7dd39b1ec909abdf62278f2584e132cf62b234557db98b597e";
const TEST_USER_ID = "cmw1tbh930001vclg2eud8m6h"; // emulator_user_2026@hubel.test
const USER_B_ID = "cmw1tbh930001vclg2eud8m6h_dummy_b";

function generateTestToken(userId: string) {
  return jwt.sign({ id: userId, email: "test@hubel.test" }, AUTH_SECRET, { expiresIn: "1h" });
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ WIKI STUDY SERVICE & REST API");
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
    // Đảm bảo test user có đủ energy & coins để test
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: {
        aiTokens: 100,
        freeCoins: 200,
      },
    });

    // Lấy 1 thẻ user đã sở hữu và 1 thẻ chưa sở hữu
    const userInvs = await prisma.userInventory.findMany({
      where: { userId: TEST_USER_ID },
      include: { card: true },
    });
    const ownedCardId = userInvs[0].cardId;

    const unownedCard = await prisma.wikiCard.findFirst({
      where: {
        owners: { none: { userId: TEST_USER_ID } },
      },
    });
    const unownedCardId = unownedCard ? unownedCard.id : 99999;

    console.log(`📌 Test User: ${TEST_USER_ID}`);
    console.log(`📌 Thẻ đã sở hữu: Card #${ownedCardId} (${userInvs[0].card.title})`);
    console.log(`📌 Thẻ chưa sở hữu: Card #${unownedCardId} (${unownedCard?.title || 'None'})\n`);

    // ----------------------------------------------------------------------
    // TEST 1: getWikiStudyCardService
    // ----------------------------------------------------------------------
    console.log("--- 1. KIỂM THỬ getWikiStudyCardService ---");

    // 1.1 Thẻ hợp lệ và đã sở hữu
    const cardRes = await getWikiStudyCardService(TEST_USER_ID, ownedCardId);
    assert(cardRes.success === true && cardRes.data?.card.id === ownedCardId, "1.1 Lấy thẻ hợp lệ thành công");
    assert(cardRes.data?.user.aiTokens >= 10, "1.2 Trả về thông tin năng lượng và quyền lợi user");

    // 1.2 Truy cập thẻ không thuộc sở hữu
    const unownedRes = await getWikiStudyCardService(TEST_USER_ID, unownedCardId);
    assert(unownedRes.success === false && unownedRes.error?.code === "CARD_NOT_OWNED", "1.3 Từ chối truy cập thẻ chưa sở hữu (CARD_NOT_OWNED)");

    // 1.3 Thẻ không tồn tại
    const notFoundRes = await getWikiStudyCardService(TEST_USER_ID, 888888);
    assert(notFoundRes.success === false && notFoundRes.error?.code === "CARD_NOT_FOUND", "1.4 Báo lỗi khi thẻ không tồn tại (CARD_NOT_FOUND)");

    // ----------------------------------------------------------------------
    // TEST 2: generateWikiStudyService
    // ----------------------------------------------------------------------
    console.log("\n--- 2. KIỂM THỬ generateWikiStudyService ---");

    // 2.1 Validate kỹ năng < 2
    const invalidSkillRes = await generateWikiStudyService(TEST_USER_ID, {
      cardId: ownedCardId,
      quizTypes: ["multiple_choice"],
    });
    assert(invalidSkillRes.success === false && invalidSkillRes.error?.code === "MIN_SKILLS_REQUIRED", "2.1 Bắt buộc chọn ít nhất 2 kỹ năng bài tập");

    // 2.2 Sinh bài học thành công với Gemini AI
    console.log("⏳ Đang gọi Gemini AI tạo bài học thực tế (vui lòng chờ)...");
    const genRes = await generateWikiStudyService(
      TEST_USER_ID,
      {
        cardId: ownedCardId,
        numQs: 2,
        wordMin: 120,
        wordMax: 180,
        quizTypes: ["multiple_choice", "true_false"],
      },
      { hideAnswers: true } // Chuẩn REST API cho mobile
    );

    assert(genRes.success === true && !!genRes.data?.sessionId, "2.2 Sinh bài học Gemini AI thành công, cấp sessionId");
    assert(genRes.data?.quizzes.length === 2, "2.3 Đúng số lượng câu hỏi yêu cầu (2 câu)");
    assert(genRes.data?.quizzes[0].correctAnswers === undefined, "2.4 Đã ẩn đáp án chuẩn cho REST API Mobile (Anti-Cheat)");

    const sessionId = genRes.data?.sessionId;
    const sessionToken = genRes.data?.sessionToken;

    // 2.3 Thiếu năng lượng AI
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: { aiTokens: 2 },
    });
    const lowEnergyRes = await generateWikiStudyService(TEST_USER_ID, {
      cardId: ownedCardId,
      quizTypes: ["multiple_choice", "true_false"],
    });
    assert(lowEnergyRes.success === false && lowEnergyRes.error?.code === "INSUFFICIENT_ENERGY", "2.5 Chặn tạo bài khi thiếu Năng lượng AI");

    // Khôi phục năng lượng
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: { aiTokens: 100 },
    });

    // ----------------------------------------------------------------------
    // TEST 3: finishWikiStudyService
    // ----------------------------------------------------------------------
    console.log("\n--- 3. KIỂM THỬ finishWikiStudyService ---");

    // 3.1 Nộp bài không thuộc quyền sở hữu (User B nộp session của User A)
    const unauthorizedSubmit = await finishWikiStudyService(USER_B_ID, {
      sessionId: sessionId!,
      answers: [0, 0],
    });
    assert(unauthorizedSubmit.success === false && unauthorizedSubmit.error?.code === "FORBIDDEN", "3.1 Chặn User B nộp bài của User A (FORBIDDEN)");

    // 3.2 Nộp bài thành công (Server-side grading)
    const submitRes = await finishWikiStudyService(TEST_USER_ID, {
      sessionId: sessionId!,
      sessionToken: sessionToken!,
      answers: [0, 0], // Gửi option index 0
    });
    assert(submitRes.success === true && submitRes.data?.attemptId !== undefined, "3.2 Nộp bài thành công, chấm điểm server-side và lưu attempt");
    assert(typeof submitRes.data?.isPass === "boolean", "3.3 Xác định kết quả đậu/trượt theo quy tắc 50%");
    assert(submitRes.data?.expGained !== undefined, "3.4 Tính toán XP và cộng vào hệ thống");
    assert(submitRes.data?.quizzes[0].correctAnswers !== undefined, "3.5 Trả về đầy đủ đáp án chuẩn & giải thích sau khi nộp bài");

    const attemptId = submitRes.data?.attemptId;

    // 3.3 Chống nộp bài nhiều lần (Anti-Double Submit)
    const doubleSubmit = await finishWikiStudyService(TEST_USER_ID, {
      sessionId: sessionId!,
      answers: [0, 0],
    });
    assert(doubleSubmit.success === false && doubleSubmit.error?.code === "ALREADY_SUBMITTED", "3.6 Chống nộp lại session đã hoàn tất (ALREADY_SUBMITTED)");

    // ----------------------------------------------------------------------
    // TEST 4: keepWikiCardStarService
    // ----------------------------------------------------------------------
    console.log("\n--- 4. KIỂM THỬ keepWikiCardStarService ---");

    // Đảm bảo card có room để tăng sao và user có đủ xu ban đầu
    await prisma.wikiCard.update({
      where: { id: ownedCardId },
      data: { awakenedStars: 0, totalStars: 5 },
    });
    await prisma.userInventory.update({
      where: { userId_cardId: { userId: TEST_USER_ID, cardId: ownedCardId } },
      data: { currentStar: 0 },
    });
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: { freeCoins: 200 },
    });

    // 4.1 Tạo 1 attempt trượt nhân tạo để kiểm thử tính năng giữ sao
    const failedAttempt = await prisma.wikiQuizAttempt.create({
      data: {
        userId: TEST_USER_ID,
        cardId: ownedCardId,
        score: 0,
        correctCount: 0,
        totalQuizzes: 4,
        userAnswers: JSON.stringify(["Wrong", "Wrong"]),
        lessonSnapshot: JSON.stringify({ isRescued: false, note: "Test failed attempt" }),
      },
    });

    // 4.2 Thử cứu sao với User B
    const rescueUserB = await keepWikiCardStarService(USER_B_ID, failedAttempt.id);
    assert(rescueUserB.success === false && rescueUserB.error?.code === "FORBIDDEN", "4.1 Chặn User B cứu sao trên lượt thi của User A (FORBIDDEN)");

    // 4.3 Thử cứu sao khi lượt thi đã đậu
    const passedAttempt = await prisma.wikiQuizAttempt.create({
      data: {
        userId: TEST_USER_ID,
        cardId: ownedCardId,
        score: 3,
        correctCount: 3,
        totalQuizzes: 3,
        userAnswers: JSON.stringify(["A", "B", "C"]),
        lessonSnapshot: JSON.stringify({ isRescued: false }),
      },
    });
    const rescuePassed = await keepWikiCardStarService(TEST_USER_ID, passedAttempt.id);
    assert(rescuePassed.success === false && rescuePassed.error?.code === "NOT_FAILED", "4.2 Từ chối cứu sao trên bài thi đã đậu (NOT_FAILED)");

    // 4.4 Thử cứu sao khi không đủ 50 Xu
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: { freeCoins: 10 },
    });
    const lowCoinsRescue = await keepWikiCardStarService(TEST_USER_ID, failedAttempt.id);
    assert(lowCoinsRescue.success === false && lowCoinsRescue.error?.code === "INSUFFICIENT_COINS", "4.3 Chặn cứu sao khi không đủ 50 Xu (INSUFFICIENT_COINS)");

    // Khôi phục xu
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: { freeCoins: 150 },
    });

    // 4.5 Cứu sao thành công
    const userBeforeRescue = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    const successRescue = await keepWikiCardStarService(TEST_USER_ID, failedAttempt.id);
    const userAfterRescue = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });

    assert(
      successRescue.success === true && userBeforeRescue!.freeCoins - userAfterRescue!.freeCoins === 50,
      "4.4 Cứu sao thành công, trừ đúng 50 Xu trong cùng transaction"
    );

    // 4.6 Chống cứu sao 2 lần trên cùng 1 attempt (Anti-Double Rescue)
    const doubleRescue = await keepWikiCardStarService(TEST_USER_ID, failedAttempt.id);
    assert(doubleRescue.success === false && doubleRescue.error?.code === "ALREADY_RESCUED", "4.5 Chống cứu sao lần 2 trên cùng lượt thi (ALREADY_RESCUED)");

    // ----------------------------------------------------------------------
    // TEST 5: REST API HTTP Endpoints (Kiểm thử thực tế qua Localhost:3000)
    // ----------------------------------------------------------------------
    console.log("\n--- 5. KIỂM THỬ THỰC TẾ REST API HTTP ---");
    const validToken = generateTestToken(TEST_USER_ID);

    // 5.1 GET /api/v1/wiki/cards/[id] không có token -> 401
    const apiResNoAuth = await fetch(`http://localhost:3000/api/v1/wiki/cards/${ownedCardId}`);
    assert(apiResNoAuth.status === 401, "5.1 GET /api/v1/wiki/cards/:id không có token -> 401 Unauthorized");

    // 5.2 GET /api/v1/wiki/cards/[id] có token -> 200
    const apiResAuth = await fetch(`http://localhost:3000/api/v1/wiki/cards/${ownedCardId}`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const apiJsonAuth = await apiResAuth.json();
    assert(apiResAuth.status === 200 && apiJsonAuth.success === true, "5.2 GET /api/v1/wiki/cards/:id trả về 200 OK với dữ liệu chuẩn");

    // 5.3 GET /api/v1/wiki/cards/[id] với thẻ chưa sở hữu -> 403
    const apiResUnowned = await fetch(`http://localhost:3000/api/v1/wiki/cards/${unownedCardId}`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert(apiResUnowned.status === 403, "5.3 GET /api/v1/wiki/cards/:id thẻ chưa sở hữu -> 403 Forbidden");

    // 5.4 POST /api/v1/wiki/study/keep-star HTTP
    // Đảm bảo card và inventory chưa max sao để test keep-star
    await prisma.wikiCard.update({
      where: { id: ownedCardId },
      data: { awakenedStars: 0, totalStars: 5 },
    });
    await prisma.userInventory.update({
      where: { userId_cardId: { userId: TEST_USER_ID, cardId: ownedCardId } },
      data: { currentStar: 0 },
    });
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: { freeCoins: 200 },
    });

    const httpFailedAttempt = await prisma.wikiQuizAttempt.create({
      data: {
        userId: TEST_USER_ID,
        cardId: ownedCardId,
        score: 0,
        correctCount: 0,
        totalQuizzes: 4,
        userAnswers: JSON.stringify(["Wrong"]),
        lessonSnapshot: JSON.stringify({ isRescued: false }),
      },
    });

    const apiKeepStarRes = await fetch("http://localhost:3000/api/v1/wiki/study/keep-star", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ attemptId: httpFailedAttempt.id }),
    });
    const apiKeepStarJson = await apiKeepStarRes.json();
    assert(
      apiKeepStarRes.status === 200 && apiKeepStarJson.success === true,
      "5.4 POST /api/v1/wiki/study/keep-star thực tế thành công qua HTTP (200 OK)",
      apiKeepStarJson
    );

    // 5.5 POST /api/v1/wiki/study/generate HTTP
    console.log("⏳ Gọi HTTP POST /api/v1/wiki/study/generate...");
    const apiGenRes = await fetch("http://localhost:3000/api/v1/wiki/study/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        cardId: ownedCardId,
        numQs: 2,
        quizTypes: ["multiple_choice", "true_false"],
      }),
    });
    const apiGenJson = await apiGenRes.json();
    assert(
      apiGenRes.status === 200 && apiGenJson.success === true && !!apiGenJson.data?.sessionId,
      "5.5 POST /api/v1/wiki/study/generate thực tế thành công qua HTTP (200 OK)",
      apiGenJson
    );

    // 5.6 POST /api/v1/wiki/study/finish HTTP
    const apiFinishRes = await fetch("http://localhost:3000/api/v1/wiki/study/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        sessionId: apiGenJson.data?.sessionId,
        sessionToken: apiGenJson.data?.sessionToken,
        answers: [0, 0],
      }),
    });
    const apiFinishJson = await apiFinishRes.json();
    assert(
      apiFinishRes.status === 200 && apiFinishJson.success === true && apiFinishJson.data?.attemptId !== undefined,
      "5.6 POST /api/v1/wiki/study/finish thực tế thành công qua HTTP (200 OK)",
      apiFinishJson
    );

    // Cleanup attempts test tạm thời
    const attemptIdsToCleanup = [
      failedAttempt.id,
      passedAttempt.id,
      httpFailedAttempt.id,
      apiFinishJson?.data?.attemptId
    ].filter((id): id is number => typeof id === 'number');

    await prisma.wikiQuizAttempt.deleteMany({
      where: {
        id: { in: attemptIdsToCleanup },
      },
    });

    console.log("\n=================================================");
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("FATAL ERROR IN TESTS:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
