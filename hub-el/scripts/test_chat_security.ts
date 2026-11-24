/**
 * BỘ KIỂM THỬ BẢO MẬT TOÀN DIỆN CHAT SOCKET.IO & REST API (BƯỚC 5D.4.1)
 * File: scripts/test_chat_security.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { io, Socket } from "socket.io-client";
import { prisma } from "../src/lib/prisma";
import { signAccessToken, getJwtSecret } from "../src/lib/jwt";
import jwt from "jsonwebtoken";

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

async function runSecurityAudit() {
  console.log("=================================================");
  console.log("🛡️ BẮT ĐẦU KIỂM TOÁN BẢO MẬT CHAT SOCKET.IO & REST API (5D.4.1)");
  console.log("=================================================\n");

  // 1. Chuẩn bị 3 tài khoản kiểm thử
  console.log("--- 1. THIẾT LẬP MÔI TRƯỜNG & TÀI KHOẢN AUDIT ---");
  let userA = await prisma.user.findFirst({ where: { email: "alice.test@hubel.com" } });
  if (!userA) {
    userA = await prisma.user.create({
      data: {
        email: "alice.test@hubel.com",
        name: "Alice Security Test",
        username: "alice_audit",
        role: "student",
      },
    });
  }

  let userB = await prisma.user.findFirst({ where: { email: "bob.test@hubel.com" } });
  if (!userB) {
    userB = await prisma.user.create({
      data: {
        email: "bob.test@hubel.com",
        name: "Bob Security Test",
        username: "bob_audit",
        role: "student",
      },
    });
  }

  let userC = await prisma.user.findFirst({ where: { email: "charlie.outsider@hubel.com" } });
  if (!userC) {
    userC = await prisma.user.create({
      data: {
        email: "charlie.outsider@hubel.com",
        name: "Charlie Outsider",
        username: "charlie_audit",
        role: "student",
      },
    });
  }

  // Đảm bảo quan hệ bạn bè giữa A và B, C là outsider
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { userId1: userA.id }, { userId2: userA.id },
        { userId1: userB.id }, { userId2: userB.id },
        { userId1: userC.id }, { userId2: userC.id },
      ],
    },
  });

  await prisma.friendship.create({
    data: {
      userId1: userA.id,
      userId2: userB.id,
      status: "ACCEPTED",
    },
  });

  const tokenA = signAccessToken({ id: userA.id, email: userA.email });
  const tokenB = signAccessToken({ id: userB.id, email: userB.email });
  const tokenC = signAccessToken({ id: userC.id, email: userC.email });

  assert(true, "Tạo 3 tài khoản kiểm thử (Alice, Bob, Charlie) thành công");

  // 2. Test Cases 1, 2, 3: JWT Handshake Security
  console.log("\n--- 2. KIỂM THỬ XÁC THỰC HANDSHAKE SOCKET.IO ---");

  // Test Case 1: Socket không JWT bị từ chối
  await new Promise<void>((resolve) => {
    const unauthSocket = io(BASE_URL, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 3000,
    });

    unauthSocket.on("connect_error", (err) => {
      assert(err.message.includes("UNAUTHORIZED"), "Test 1: Socket không JWT bị từ chối kết nối handshake", err.message);
      unauthSocket.disconnect();
      resolve();
    });

    unauthSocket.on("connect", () => {
      assert(false, "Test 1: Socket không JWT không được phép kết nối thành công!");
      unauthSocket.disconnect();
      resolve();
    });
  });

  // Test Case 2: JWT sai chữ ký bị từ chối
  await new Promise<void>((resolve) => {
    const fakeToken = jwt.sign({ id: userA!.id, email: userA!.email }, "WRONG_SECRET_KEY_123");
    const badSocket = io(BASE_URL, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 3000,
      auth: { token: fakeToken },
    });

    badSocket.on("connect_error", (err) => {
      assert(err.message.includes("INVALID_TOKEN"), "Test 2: JWT sai chữ ký bị từ chối kết nối handshake", err.message);
      badSocket.disconnect();
      resolve();
    });

    badSocket.on("connect", () => {
      assert(false, "Test 2: Socket với JWT giả mạo không được phép kết nối!");
      badSocket.disconnect();
      resolve();
    });
  });

  // Test Case 3: JWT hết hạn bị từ chối
  await new Promise<void>((resolve) => {
    const expiredToken = jwt.sign(
      { id: userA!.id, email: userA!.email },
      getJwtSecret(),
      { expiresIn: -10 } // Expired 10 seconds ago
    );

    const expiredSocket = io(BASE_URL, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 3000,
      auth: { token: expiredToken },
    });

    expiredSocket.on("connect_error", (err) => {
      assert(err.message.includes("TOKEN_EXPIRED"), "Test 3: JWT hết hạn bị từ chối kết nối handshake", err.message);
      expiredSocket.disconnect();
      resolve();
    });

    expiredSocket.on("connect", () => {
      assert(false, "Test 3: Socket với JWT hết hạn không được phép kết nối!");
      expiredSocket.disconnect();
      resolve();
    });
  });

  // 3. Kết nối Socket A và Socket B với JWT hợp lệ
  const socketA = io(BASE_URL, {
    transports: ["websocket"],
    reconnection: false,
    auth: { token: tokenA },
  });

  const socketB = io(BASE_URL, {
    transports: ["websocket"],
    reconnection: false,
    auth: { token: tokenB },
  });

  socketA.on("connect_error", (e) => console.error("❌ Socket A connect_error:", e.message));
  socketB.on("connect_error", (e) => console.error("❌ Socket B connect_error:", e.message));

  await Promise.all([
    new Promise<void>((r, rej) => {
      socketA.on("connect", () => r());
      socketA.on("connect_error", (e) => rej(e));
    }),
    new Promise<void>((r, rej) => {
      socketB.on("connect", () => r());
      socketB.on("connect_error", (e) => rej(e));
    }),
  ]);
  await new Promise((r) => setTimeout(r, 200));

  // 4. Test Cases 4 & 5: Personal Room Security
  console.log("\n--- 3. KIỂM THỬ BẢO MẬT PHÒNG CÁ NHÂN (PERSONAL ROOM) ---");

  // Test Case 4: User A không thể join personal room User B
  await new Promise<void>((resolve) => {
    socketA.once("error", (err: any) => {
      assert(err.code === "FORBIDDEN", "Test 4: User A cố join personal room của User B bị từ chối", JSON.stringify(err));
      resolve();
    });
    socketA.emit("join_room", userB!.id);
  });

  // Test Case 5: User A không thể nghe tin nhắn riêng gửi tới User B
  let userAListenedMessage = false;
  socketA.on("receive_message", () => {
    userAListenedMessage = true;
  });

  // Gửi tin nhắn trực tiếp tới User B
  socketB.emit("send_message", {
    receiverId: userB!.id,
    message: { id: 99999, content: "Tin nhắn bí mật của User B" },
  });
  await new Promise((r) => setTimeout(r, 400));
  assert(!userAListenedMessage, "Test 5: User A hoàn toàn không nghe lén được tin nhắn gửi riêng cho User B");

  // 5. Test Cases 6, 7, 8: Group Room Security với người ngoài nhóm (User C)
  console.log("\n--- 4. KIỂM THỬ BẢO MẬT CHAT NHÓM (GROUP ROOM) ---");

  // Tạo nhóm chat kiểm thử gồm User A và User B (User C không có trong nhóm)
  const groupRes = await fetch(`${BASE_URL}/api/v1/chat/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: "Nhóm Bảo Mật Kín",
      memberIds: [userB!.id],
    }),
  });
  const groupData = await groupRes.json();
  const testGroup = groupData.data;

  // Kết nối Socket C (User C)
  const socketC = io(BASE_URL, {
    transports: ["websocket"],
    reconnection: false,
    auth: { token: tokenC },
  });
  await new Promise<void>((r) => socketC.on("connect", () => r()));
  await new Promise((r) => setTimeout(r, 200));

  // Test Case 6: Người ngoài nhóm không thể join group room
  await new Promise<void>((resolve) => {
    socketC.once("error", (err: any) => {
      assert(err.code === "FORBIDDEN", "Test 6: Người ngoài nhóm (User C) cố join group room bị từ chối", JSON.stringify(err));
      resolve();
    });
    socketC.emit("join_room", `group_${testGroup.id}`);
  });

  // Test Case 7: Người ngoài nhóm không thể đọc lịch sử nhóm
  const historyCRes = await fetch(
    `${BASE_URL}/api/v1/chat/history?targetId=${testGroup.id}&isGroup=true`,
    {
      headers: { Authorization: `Bearer ${tokenC}` },
    }
  );
  assert(historyCRes.status === 403, "Test 7: Người ngoài nhóm gọi REST API đọc lịch sử nhóm bị chặn (HTTP 403)");

  // Test Case 8: Người ngoài nhóm không thể gửi tin nhắn nhóm
  const sendCRes = await fetch(`${BASE_URL}/api/v1/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenC}`,
    },
    body: JSON.stringify({
      groupId: testGroup.id,
      content: "Hacker C cố chen vào nhóm",
    }),
  });
  assert(sendCRes.status === 403, "Test 8: Người ngoài nhóm gửi tin nhắn vào nhóm qua REST API bị chặn (HTTP 403)");

  // 6. Test Cases 9 & 10: Xử lý thành viên bị xóa & tự rời nhóm
  console.log("\n--- 5. KIỂM THỬ THÀNH VIÊN BỊ XÓA & TỰ RỜI NHÓM ---");

  // Test Case 9: Thành viên đã bị xóa không thể tiếp tục truy cập nhóm
  const removeRes = await fetch(
    `${BASE_URL}/api/v1/chat/groups/${testGroup.id}/members/${userB!.id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    }
  );
  assert(removeRes.status === 200, "Admin (User A) xóa User B khỏi nhóm thành công");

  const historyBAfterKick = await fetch(
    `${BASE_URL}/api/v1/chat/history?targetId=${testGroup.id}&isGroup=true`,
    {
      headers: { Authorization: `Bearer ${tokenB}` },
    }
  );
  assert(historyBAfterKick.status === 403, "Test 9: Thành viên đã bị xóa không thể đọc lịch sử nhóm (HTTP 403)");

  // Thêm lại User B để test rời nhóm
  await fetch(`${BASE_URL}/api/v1/chat/groups/${testGroup.id}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ targetUserId: userB!.id }),
  });

  // Test Case 10: User B tự rời nhóm không thể tiếp tục truy cập
  const leaveRes = await fetch(`${BASE_URL}/api/v1/chat/groups/${testGroup.id}/leave`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(leaveRes.status === 200, "User B tự rời khỏi nhóm thành công");

  const sendBAfterLeave = await fetch(`${BASE_URL}/api/v1/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      groupId: testGroup.id,
      content: "Tôi đã rời nhóm rồi",
    }),
  });
  assert(sendBAfterLeave.status === 403, "Test 10: User đã rời nhóm không thể gửi tin nhắn vào nhóm (HTTP 403)");

  // 7. Test Cases 11 & 12: Chống giả mạo SenderId và Typing Indicator
  console.log("\n--- 6. KIỂM THỬ CHỐNG GIẢ MẠO DANH TÍNH (SPOOFING PREVENTION) ---");

  // Test Case 11: senderId giả mạo không có tác dụng trong REST API
  const spoofMsgRes = await fetch(`${BASE_URL}/api/v1/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      receiverId: userB!.id,
      content: "Tin nhắn từ Alice nhưng body giả dạng Bob",
      senderId: userB!.id, // Fake senderId
    }),
  });
  const spoofMsgData = await spoofMsgRes.json();
  assert(
    spoofMsgData.data?.senderId === userA!.id,
    "Test 11: Server ghi đè senderId giả mạo bằng danh tính JWT thực tế của Alice",
    `SenderId ghi nhận: ${spoofMsgData.data?.senderId}`
  );

  // Test Case 12: Typing event không thể giả mạo người gửi
  await new Promise<void>((resolve) => {
    socketB.once("user_typing", (data: any) => {
      assert(
        data.senderId === userA!.id,
        "Test 12: Sự kiện typing_start buộc lấy senderId từ socket identity, client không thể mạo danh",
        JSON.stringify(data)
      );
      resolve();
    });

    socketA.emit("typing_start", {
      receiverId: userB!.id,
      senderId: "fake_spoofed_user_id",
    });
  });

  // 8. Test Cases 13 & 14: Wiki Gift Authorization & Transaction Guard
  console.log("\n--- 7. KIỂM THỬ BẢO MẬT & TRANSACTION HỘP QUÀ WIKI ---");

  // Lấy hoặc tạo thẻ bài cho User A
  let sampleCard = await prisma.wikiCard.findFirst();
  if (!sampleCard) {
    sampleCard = await prisma.wikiCard.create({
      data: {
        title: "Thẻ Thần Thoại",
        rarity: "SSR",
        imageUrl: "https://example.com/card.png",
      },
    });
  }

  // Cấp thẻ cho User A
  await prisma.userInventory.deleteMany({ where: { userId: userA!.id } });
  await prisma.userInventory.create({
    data: { userId: userA!.id, cardId: sampleCard.id, source: "GACHA" },
  });

  // User A tặng thẻ cho User B
  const giftCardPayload = {
    id: sampleCard.id,
    title: sampleCard.title,
    rarity: sampleCard.rarity,
    imageUrl: sampleCard.imageUrl,
    claimed: false,
  };
  const giftMsgRes = await fetch(`${BASE_URL}/api/v1/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      receiverId: userB!.id,
      content: "Tặng bạn thẻ quý",
      messageType: "WIKI_CARD",
      fileUrl: JSON.stringify(giftCardPayload),
      isGiftCard: true,
    }),
  });
  const giftMsgData = await giftMsgRes.json();
  const giftMessageId = giftMsgData.data.id;

  // Test Case 13: User C (người ngoài) không thể nhận trộm hộp quà
  const stealRes = await fetch(`${BASE_URL}/api/v1/chat/claim-gift`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenC}`,
    },
    body: JSON.stringify({ messageId: giftMessageId }),
  });
  assert(stealRes.status === 403, "Test 13: Người ngoài (User C) cố mở trộm hộp quà bị từ chối (HTTP 403)");

  // User B mở quà lần 1
  const claimRes1 = await fetch(`${BASE_URL}/api/v1/chat/claim-gift`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ messageId: giftMessageId }),
  });
  assert(claimRes1.status === 200, "User B mở nhận hộp quà lần 1 thành công (HTTP 200)");

  // Test Case 14: User B mở quà lần 2 bị từ chối
  const claimRes2 = await fetch(`${BASE_URL}/api/v1/chat/claim-gift`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ messageId: giftMessageId }),
  });
  assert(claimRes2.status === 400, "Test 14: Mở hộp quà lần 2 bị chặn triệt để (HTTP 400)");

  // 9. Test Case 15: REST và Socket không tạo duplicate message
  console.log("\n--- 8. KIỂM THỬ KHÔNG TRÙNG LẶP TIN NHẮN (NO DUPLICATE) ---");
  const countBefore = await prisma.chatMessage.count({
    where: { senderId: userA!.id, receiverId: userB!.id },
  });

  const sendMsgOnce = await fetch(`${BASE_URL}/api/v1/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      receiverId: userB!.id,
      content: "Tin nhắn kiểm tra tính đơn nhất",
    }),
  });
  const sentData = await sendMsgOnce.json();

  // Socket relay cùng message đó
  socketA.emit("send_message", {
    receiverId: userB!.id,
    message: sentData.data,
  });
  await new Promise((r) => setTimeout(r, 200));

  const countAfter = await prisma.chatMessage.count({
    where: { senderId: userA!.id, receiverId: userB!.id },
  });
  assert(
    countAfter === countBefore + 1,
    "Test 15: Luồng REST + Socket chỉ tạo đúng 1 bản ghi trong DB, không có duplicate",
    `Trước: ${countBefore}, Sau: ${countAfter}`
  );

  // 10. Test Case 16: Pagination Cursor ổn định, không sót, không trùng tin nhắn
  console.log("\n--- 9. KIỂM THỬ PHÂN TRANG (PAGINATION STABILITY) ---");

  // Dọn dẹp tin nhắn cũ giữa A và B để test phân trang chuẩn xác
  await prisma.chatMessage.deleteMany({
    where: {
      OR: [
        { senderId: userA!.id, receiverId: userB!.id },
        { senderId: userB!.id, receiverId: userA!.id },
      ],
    },
  });

  // Chèn tuần tự 6 tin nhắn
  const insertedIds: number[] = [];
  for (let i = 1; i <= 6; i++) {
    const m = await prisma.chatMessage.create({
      data: {
        senderId: userA!.id,
        receiverId: userB!.id,
        content: `Tin nhắn tuần tự #${i}`,
      },
    });
    insertedIds.push(m.id);
  }

  // Trang 1: Lấy 2 tin nhắn mới nhất
  const page1Res = await fetch(
    `${BASE_URL}/api/v1/chat/history?targetId=${userB!.id}&limit=2`,
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  const page1Data = await page1Res.json();
  const page1Msgs: any[] = page1Data.data;

  // Trang 2: Lấy 2 tin nhắn trước tin nhắn cũ nhất của trang 1
  const oldestIdPage1 = page1Msgs[0].id;
  const page2Res = await fetch(
    `${BASE_URL}/api/v1/chat/history?targetId=${userB!.id}&limit=2&beforeId=${oldestIdPage1}`,
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  const page2Data = await page2Res.json();
  const page2Msgs: any[] = page2Data.data;

  // Trang 3: Lấy 2 tin nhắn trước tin nhắn cũ nhất của trang 2
  const oldestIdPage2 = page2Msgs[0].id;
  const page3Res = await fetch(
    `${BASE_URL}/api/v1/chat/history?targetId=${userB!.id}&limit=2&beforeId=${oldestIdPage2}`,
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  const page3Data = await page3Res.json();
  const page3Msgs: any[] = page3Data.data;

  const allFetchedIds = [
    ...page3Msgs.map((m) => m.id),
    ...page2Msgs.map((m) => m.id),
    ...page1Msgs.map((m) => m.id),
  ];

  const uniqueFetchedIds = Array.from(new Set(allFetchedIds));
  const hasNoDuplicates = allFetchedIds.length === uniqueFetchedIds.length;
  const hasAllMessages =
    uniqueFetchedIds.length === 6 &&
    insertedIds.every((id) => uniqueFetchedIds.includes(id));

  assert(
    hasNoDuplicates && hasAllMessages,
    "Test 16: Phân trang Cursor lấy đủ 6/6 tin nhắn, không trùng lặp và không bỏ sót",
    `Thu được: [${allFetchedIds.join(", ")}], Kỳ vọng: [${insertedIds.join(", ")}]`
  );

  // Dọn dẹp sockets
  socketA.disconnect();
  socketB.disconnect();
  socketC.disconnect();

  console.log("\n=================================================");
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedCount} PASS, ${failedCount} FAIL`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityAudit().catch((err) => {
  console.error("FATAL ERROR TRONG QUÁ TRÌNH AUDIT:", err);
  process.exit(1);
});
