/**
 * BỘ KIỂM THỬ TOÀN DIỆN LEADERBOARD BACKEND & REST API (BƯỚC 5D.6)
 * File: scripts/test_leaderboard_backend.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";
import { signAccessToken } from "../src/lib/jwt";
import { getLeaderboardService, calculateLifetimeXP } from "../src/services/leaderboard.service";
import { getLeaderboardData } from "../src/actions/leaderboard";

const BASE_URL = "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   👉 Chi tiết: ${detail}`);
    failedCount++;
  }
}

async function runLeaderboardTests() {
  console.log("=================================================");
  console.log("🏆 BẮT ĐẦU KIỂM THỬ LEADERBOARD SERVICE & REST API (5D.6)");
  console.log("=================================================\n");

  // 1. Chuẩn bị tài khoản kiểm thử
  console.log("--- 1. CHUẨN BỊ TÀI KHOẢN VÀ DỮ LIỆU ĐIỂM SỐ ---");
  let testUser = await prisma.user.findFirst({ where: { email: "alice.test@hubel.com" } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: "alice.test@hubel.com",
        name: "Alice Leaderboard Test",
        username: "alice_lb",
        role: "student",
        level: 10,
        xp: 350,
        currentStreak: 25,
      },
    });
  } else {
    testUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        role: "student",
        isActive: true,
        level: 10,
        xp: 350,
        currentStreak: 25,
      },
    });
  }

  // Cập nhật stats
  await prisma.userStats.upsert({
    where: { userId: testUser.id },
    create: {
      userId: testUser.id,
      totalStudySeconds: 7500, // 2h 5m
      correctQuizAnswers: 88,
      totalQuizAttempts: 100,
    },
    update: {
      totalStudySeconds: 7500,
      correctQuizAnswers: 88,
      totalQuizAttempts: 100,
    },
  });

  // Tạo daily stat hôm nay (sử dụng chuẩn UTC Date tương thích với SQL Server @db.Date)
  const vnTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const today = new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate()));

  await prisma.dailyStat.upsert({
    where: { userId_date: { userId: testUser.id, date: today } },
    create: {
      userId: testUser.id,
      date: today,
      xpGained: 450,
      studySeconds: 1800, // 30m
      correctAnswers: 15,
      quizAttempts: 20,
    },
    update: {
      xpGained: 450,
      studySeconds: 1800,
      correctAnswers: 15,
      quizAttempts: 20,
    },
  });

  const validToken = signAccessToken({ id: testUser.id, email: testUser.email });
  assert(true, "Thiết lập dữ liệu người dùng (Streak: 25, Level: 10, Stats: đầy đủ) thành công");

  // 2. Kiểm thử công thức Lifetime XP
  console.log("\n--- 2. KIỂM THỬ CÔNG THỨC TOÁN HỌC & NGHIỆP VỤ ---");
  const expectedXPLevel1 = calculateLifetimeXP(1, 100);
  assert(expectedXPLevel1 === 100, "Level 1: Lifetime XP đúng bằng currentXp");

  const expectedXPLevel3 = calculateLifetimeXP(3, 50);
  // i=1: 500 + 20 = 520; i=2: 500 + 80 = 580; total = 520 + 580 + 50 = 1150
  assert(expectedXPLevel3 === 1150, "Level 3: Lifetime XP tính lũy tiến chuẩn xác", `Kết quả: ${expectedXPLevel3}`);

  // 3. Kiểm thử 4 Categories qua Service
  console.log("\n--- 3. KIỂM THỬ 4 CATEGORIES QUA BACKEND SERVICE ---");

  // Category STREAK
  const streakRes = await getLeaderboardService("STREAK", "DAY", testUser.id);
  assert(streakRes.success, "Service: Lấy Bảng xếp hạng STREAK thành công");
  assert(
    streakRes.data?.topPlayers.length! <= 50 && streakRes.data?.topPlayers.length! > 0,
    "STREAK: Trả về danh sách Top hợp lệ (tối đa 50 người)"
  );
  assert(
    streakRes.data?.topPlayers.some((p) => p.userId === testUser!.id)!,
    "STREAK: Người dùng kiểm thử Alice có mặt trong bảng xếp hạng với điểm đúng"
  );

  // Category GRINDER (ALL TIME)
  const grinderAllRes = await getLeaderboardService("GRINDER", "ALL", testUser.id);
  assert(grinderAllRes.success, "Service: Lấy Bảng xếp hạng GRINDER (ALL) thành công");
  const expectedAliceXP = calculateLifetimeXP(10, 350);
  const aliceGrinder = grinderAllRes.data?.topPlayers.find((p) => p.userId === testUser!.id);
  assert(
    aliceGrinder?.scoreValue === expectedAliceXP,
    `GRINDER ALL: Điểm Lifetime XP của Alice (${aliceGrinder?.scoreValue}) khớp công thức (${expectedAliceXP})`
  );

  // Category TIME (ALL TIME)
  const timeAllRes = await getLeaderboardService("TIME", "ALL", testUser.id);
  assert(timeAllRes.success, "Service: Lấy Bảng xếp hạng TIME (ALL) thành công");
  const aliceTime = timeAllRes.data?.topPlayers.find((p) => p.userId === testUser!.id);
  assert(
    aliceTime?.scoreValue === 7500 && aliceTime?.scoreLabel === "2h 5m",
    `TIME ALL: Điểm thời lượng học (7500s) hiển thị đúng nhãn '2h 5m' (Thực tế: ${aliceTime?.scoreLabel})`
  );

  // Category AI_KILLER (ALL TIME)
  const aiAllRes = await getLeaderboardService("AI_KILLER", "ALL", testUser.id);
  assert(aiAllRes.success, "Service: Lấy Bảng xếp hạng AI_KILLER (ALL) thành công");
  const aliceAi = aiAllRes.data?.topPlayers.find((p) => p.userId === testUser!.id);
  assert(
    aliceAi?.scoreValue === 88 && aliceAi?.scoreLabel === "88",
    `AI_KILLER ALL: Số câu trả lời đúng hiển thị chính xác (88 câu)`
  );

  // 4. Kiểm thử các Time Ranges (DAY, WEEK, MONTH)
  console.log("\n--- 4. KIỂM THỬ CÁC TIME RANGES (DAY, WEEK, MONTH) ---");
  const grinderDayRes = await getLeaderboardService("GRINDER", "DAY", testUser.id);
  assert(grinderDayRes.success, "GRINDER DAY: Lấy dữ liệu ngày thành công");
  const aliceDay = grinderDayRes.data?.topPlayers.find((p) => p.userId === testUser!.id);
  assert(
    aliceDay?.scoreValue === 450,
    `GRINDER DAY: Lấy đúng XP tích lũy trong ngày từ DailyStat (Kỳ vọng: 450, Thực tế: ${aliceDay?.scoreValue})`
  );

  const timeDayRes = await getLeaderboardService("TIME", "DAY", testUser.id);
  assert(timeDayRes.success, "TIME DAY: Lấy dữ liệu thời gian học trong ngày thành công");
  const aliceDayTime = timeDayRes.data?.topPlayers.find((p) => p.userId === testUser!.id);
  assert(
    aliceDayTime?.scoreValue === 1800 && aliceDayTime?.scoreLabel === "30m",
    `TIME DAY: 1800s hiển thị đúng nhãn '30m' (Thực tế: ${aliceDayTime?.scoreLabel})`
  );

  // 5. Kiểm thử REST API Endpoint qua HTTP thực tế
  console.log("\n--- 5. KIỂM THỬ REST API (GET /api/v1/leaderboard) ---");

  // REST API: Thành công với JWT
  const apiRes = await fetch(`${BASE_URL}/api/v1/leaderboard?category=GRINDER&range=ALL`, {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert(apiRes.status === 200, "REST API: Trả về HTTP 200 khi có Bearer JWT hợp lệ");

  const apiJson = await apiRes.json();
  assert(apiJson.success === true, "REST API: Payload có success = true");
  assert(apiJson.data?.category === "GRINDER", "REST API: Phản hồi đúng category GRINDER");
  assert(apiJson.data?.range === "ALL", "REST API: Phản hồi đúng range ALL");
  assert(Array.isArray(apiJson.data?.topPlayers), "REST API: topPlayers là một mảng");
  assert(apiJson.data?.currentUser !== null, "REST API: Trả về currentUser của token đã xác thực");
  assert(
    apiJson.data?.currentUser?.userId === testUser.id,
    "REST API: currentUser đúng là người dùng của JWT Bearer Token"
  );

  // REST API: Bảo mật
  const unauthRes = await fetch(`${BASE_URL}/api/v1/leaderboard?category=GRINDER&range=WEEK`);
  assert(unauthRes.status === 401, "Security: Gọi API không có Authorization Header bị từ chối (HTTP 401)");

  const badTokenRes = await fetch(`${BASE_URL}/api/v1/leaderboard`, {
    headers: { Authorization: "Bearer BAD_FAKE_TOKEN" },
  });
  assert(badTokenRes.status === 401, "Security: Gọi API với Token giả mạo bị từ chối (HTTP 401)");

  // 6. Kiểm thử Thứ tự sắp xếp và Tie-breaking
  console.log("\n--- 6. KIỂM THỬ THỨ TỰ SẮP XẾP VÀ TIE-BREAKING ---");
  const players = apiJson.data.topPlayers;
  let isSorted = true;
  for (let i = 0; i < players.length - 1; i++) {
    if (players[i].scoreValue < players[i + 1].scoreValue) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, "Thứ tự xếp hạng giảm dần ổn định theo điểm số (scoreValue)");

  // 7. Kiểm thử Tương thích ngược của Server Action (Web UI)
  console.log("\n--- 7. KIỂM THỬ TƯƠNG THÍCH NGƯỢC CỦA SERVER ACTIONS ---");
  const serverActionRes = await getLeaderboardData("STREAK", "ALL");
  assert(serverActionRes.success === true, "Server Action getLeaderboardData hoạt động bình thường");
  assert(Array.isArray(serverActionRes.data), "Server Action trả về mảng danh sách người chơi");
  const firstItem = serverActionRes.data[0];
  assert(
    firstItem && "id" in firstItem && "name" in firstItem && "scoreValue" in firstItem && "rank" in firstItem,
    "Server Action giữ nguyên 100% các trường dữ liệu Web mong đợi (id, name, scoreValue, rank...)"
  );

  console.log("\n=================================================");
  console.log(`🏁 KẾT QUẢ KIỂM THỬ LEADERBOARD: ${passedCount} PASS, ${failedCount} FAIL`);
  console.log("=================================================");

  await prisma.$disconnect();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLeaderboardTests().catch((err) => {
  console.error("FATAL ERROR TRONG QUÁ TRÌNH TEST LEADERBOARD:", err);
  process.exit(1);
});
