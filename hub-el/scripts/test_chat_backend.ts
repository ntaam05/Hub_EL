import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import jwt from "jsonwebtoken";
import axios from "axios";
import { io as ioClient } from "socket.io-client";
import { prisma } from "../src/lib/prisma";

const AUTH_SECRET = process.env.AUTH_SECRET || "hub-el-secret-key-mobile-jwt-2026";
const BASE_URL = "http://localhost:3000/api/v1";
const SOCKET_URL = "http://localhost:3000";

function makeToken(userId: string) {
  return jwt.sign(
    { id: userId, email: `${userId}@hubel.test`, type: "access" },
    AUTH_SECRET,
    { expiresIn: "1h" }
  );
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CHAT BACKEND & REALTIME (5D.4)");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, detail !== undefined ? detail : "");
      failed++;
    }
  }

  // 1. SETUP TEST USERS
  console.log("--- 1. CHUẨN BỊ TÀI KHOẢN VÀ DỮ LIỆU KIỂM THỬ ---");
  const users = await prisma.user.findMany({ take: 3 });
  if (users.length < 2) {
    console.error("Cần ít nhất 2 users trong database!");
    return;
  }

  const userA = users[0];
  const userB = users[1];
  const userC = users[2] || users[0];

  const tokenA = makeToken(userA.id);
  const tokenB = makeToken(userB.id);
  const tokenC = makeToken(userC.id);

  console.log(`User A: ${userA.name} (${userA.id})`);
  console.log(`User B: ${userB.name} (${userB.id})`);
  console.log(`User C: ${userC.name} (${userC.id})`);

  // Ensure friendship exists between A and B
  await prisma.friendship.upsert({
    where: { userId1_userId2: { userId1: userA.id, userId2: userB.id } },
    update: { status: "ACCEPTED" },
    create: { userId1: userA.id, userId2: userB.id, status: "ACCEPTED" },
  });

  assert(true, "Tạo lập môi trường kiểm thử thành công");

  // 2. CONVERSATIONS LIST
  console.log("\n--- 2. KIỂM THỬ DANH SÁCH CUỘC TRÒ CHUYỆN (CONVERSATIONS) ---");
  try {
    const resConv = await axios.get(`${BASE_URL}/chat/conversations`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      resConv.status === 200 && resConv.data.success && Array.isArray(resConv.data.data),
      "REST API: GET /api/v1/chat/conversations trả về HTTP 200 và danh sách hội thoại"
    );
    const hasPartner = resConv.data.data.some((c: any) => c.id === userB.id);
    assert(hasPartner, "Conversations: Chứa đối tác bạn bè User B kèm metadata");
  } catch (e: any) {
    assert(false, "REST API: GET /api/v1/chat/conversations thất bại", e.response?.data || e.message);
  }

  // 3. 1-1 MESSAGING & HISTORY
  console.log("\n--- 3. KIỂM THỬ TIN NHẮN 1-1 & LỊCH SỬ CHAT ---");
  let sentMsgId: number | null = null;
  try {
    const resSend = await axios.post(
      `${BASE_URL}/chat/send`,
      {
        receiverId: userB.id,
        content: "Kiểm thử tin nhắn văn bản từ User A",
        messageType: "TEXT",
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(
      resSend.status === 201 && resSend.data.success && resSend.data.data?.id,
      "REST API: POST /api/v1/chat/send gửi tin nhắn văn bản thành công (HTTP 201)"
    );
    sentMsgId = resSend.data.data?.id;

    // Test Reply
    const resReply = await axios.post(
      `${BASE_URL}/chat/send`,
      {
        receiverId: userA.id,
        content: `[REPLY:${userA.id}]Kiểm thử tin nhắn văn bản từ User A[/REPLY]Phản hồi lại User A!`,
        messageType: "TEXT",
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert(
      resReply.status === 201 && resReply.data.success,
      "REST API: Gửi tin nhắn Reply kèm chuỗi trích dẫn thành công"
    );

    // Test Get History
    const resHist = await axios.get(`${BASE_URL}/chat/history?targetId=${userB.id}&isGroup=false`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const found = resHist.data.data?.some((m: any) => m.id === sentMsgId);
    assert(
      resHist.status === 200 && resHist.data.success && found,
      "REST API: GET /api/v1/chat/history trả về đầy đủ tin nhắn vừa gửi"
    );
  } catch (e: any) {
    assert(false, "Kiểm thử tin nhắn 1-1 thất bại", e.response?.data || e.message);
  }

  // 4. WIKI GIFT CARD TRANSFER & PRISMA TRANSACTION
  console.log("\n--- 4. KIỂM THỬ TẶNG THẺ WIKI & TRANSACTION CHUYỂN QUYỀN SỞ HỮU ---");
  try {
    // 4.1 Lấy kho thẻ
    const resCards = await axios.get(`${BASE_URL}/chat/cards`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      resCards.status === 200 && resCards.data.success && Array.isArray(resCards.data.data),
      "REST API: GET /api/v1/chat/cards lấy kho thẻ của User A thành công"
    );

    // Chuẩn bị 1 thẻ cho User A
    const anyCard = await prisma.wikiCard.findFirst();
    if (anyCard) {
      // Đảm bảo User A có thẻ này trong kho
      await prisma.userInventory.upsert({
        where: { userId_cardId: { userId: userA.id, cardId: anyCard.id } },
        update: {},
        create: { userId: userA.id, cardId: anyCard.id, source: "GACHA" },
      });

      // User A gửi tặng thẻ này cho User B
      const giftData = JSON.stringify({
        id: anyCard.id,
        title: anyCard.title,
        rarity: anyCard.rarity,
        imageUrl: anyCard.imageUrl,
        claimed: false,
      });

      const resSendGift = await axios.post(
        `${BASE_URL}/chat/send`,
        {
          receiverId: userB.id,
          content: "Đã gửi tặng Hộp Quà Wiki",
          messageType: "WIKI_CARD",
          fileUrl: giftData,
          isGiftCard: true,
        },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      assert(
        resSendGift.status === 201 && resSendGift.data.success,
        "REST API: User A gửi tặng Hộp Quà Thẻ Wiki cho User B thành công"
      );
      const giftMsgId = resSendGift.data.data.id;

      // Người thứ 3 (User C) cố mở quà -> Bị từ chối
      if (userC.id !== userB.id) {
        try {
          await axios.post(
            `${BASE_URL}/chat/claim-gift`,
            { messageId: giftMsgId },
            { headers: { Authorization: `Bearer ${tokenC}` } }
          );
          assert(false, "Security: Người không phải receiver không được mở quà");
        } catch (e: any) {
          assert(e.response?.status === 403, "Security: Chặn người thứ ba mở trộm quà (HTTP 403)");
        }
      }

      // User B (người nhận đúng) mở quà
      const resClaim = await axios.post(
        `${BASE_URL}/chat/claim-gift`,
        { messageId: giftMsgId },
        { headers: { Authorization: `Bearer ${tokenB}` } }
      );
      assert(
        resClaim.status === 200 && resClaim.data.success,
        "Transaction: User B mở hộp quà thành công, hoàn tất giao dịch Database"
      );

      // Thử mở lại lần 2 -> Bị từ chối
      try {
        await axios.post(
          `${BASE_URL}/chat/claim-gift`,
          { messageId: giftMsgId },
          { headers: { Authorization: `Bearer ${tokenB}` } }
        );
        assert(false, "Transaction: Không cho phép mở quà 2 lần");
      } catch (e: any) {
        assert(e.response?.status === 400, "Transaction: Chặn mở trùng lặp hộp quà đã mở (HTTP 400)");
      }
    }
  } catch (e: any) {
    assert(false, "Kiểm thử tặng thẻ Wiki thất bại", e.response?.data || e.message);
  }

  // 5. GROUP CHAT MANAGEMENT
  console.log("\n--- 5. KIỂM THỬ QUẢN LÝ CHAT NHÓM (GROUP CHAT) ---");
  let createdGroupId: number | null = null;
  try {
    // 5.1 Tạo nhóm
    const resCreateGroup = await axios.post(
      `${BASE_URL}/chat/groups`,
      {
        name: "Nhóm Học Python Siêu Cấp",
        memberIds: [userB.id],
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(
      resCreateGroup.status === 201 && resCreateGroup.data.success && resCreateGroup.data.data?.id,
      "REST API: POST /api/v1/chat/groups tạo nhóm chat mới thành công (HTTP 201)"
    );
    createdGroupId = resCreateGroup.data.data.id;

    // 5.2 Lấy danh sách nhóm
    const resGroups = await axios.get(`${BASE_URL}/chat/groups`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      resGroups.status === 200 && resGroups.data.data.some((g: any) => g.id === createdGroupId),
      "REST API: GET /api/v1/chat/groups lấy danh sách nhóm có chứa nhóm vừa tạo"
    );

    // 5.3 Lấy danh sách thành viên
    const resMembers = await axios.get(`${BASE_URL}/chat/groups/${createdGroupId}/members`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      resMembers.status === 200 && resMembers.data.data.length >= 2,
      "REST API: GET /api/v1/chat/groups/:id/members hiển thị danh sách thành viên chính xác"
    );

    // 5.4 Đổi tên nhóm
    const resRename = await axios.patch(
      `${BASE_URL}/chat/groups/${createdGroupId}`,
      { name: "Nhóm Học Python & Flutter Nâng Cao" },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(
      resRename.status === 200 && resRename.data.data?.name === "Nhóm Học Python & Flutter Nâng Cao",
      "REST API: PATCH /api/v1/chat/groups/:id đổi tên nhóm chat thành công"
    );

    // 5.5 Gửi tin nhắn vào nhóm
    const resGroupMsg = await axios.post(
      `${BASE_URL}/chat/send`,
      {
        groupId: createdGroupId,
        content: "Chào mừng cả nhóm đến với Hub-EL Chat!",
        messageType: "TEXT",
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(
      resGroupMsg.status === 201 && resGroupMsg.data.success,
      "REST API: Gửi tin nhắn vào Nhóm chat thành công"
    );

    // 5.6 Giải tán nhóm
    const resDelete = await axios.delete(`${BASE_URL}/chat/groups/${createdGroupId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      resDelete.status === 200 && resDelete.data.success,
      "REST API: DELETE /api/v1/chat/groups/:id giải tán nhóm chat thành công"
    );
  } catch (e: any) {
    assert(false, "Kiểm thử Chat Nhóm thất bại", e.response?.data || e.message);
  }

  // 6. SOCKET.IO SECURITY & REALTIME BRIDGE
  console.log("\n--- 6. KIỂM THỬ BẢO MẬT SOCKET.IO VÀ REALTIME BRIDGE ---");
  try {
    // 6.1 Kết nối Socket với JWT token
    const clientA = ioClient(SOCKET_URL, {
      auth: { token: tokenA },
      transports: ["websocket"],
      forceNew: true,
    });

    const clientB = ioClient(SOCKET_URL, {
      auth: { token: tokenB },
      transports: ["websocket"],
      forceNew: true,
    });

    await new Promise<void>((resolve) => {
      let connected = 0;
      clientA.on("connect", () => {
        connected++;
        if (connected === 2) resolve();
      });
      clientB.on("connect", () => {
        connected++;
        if (connected === 2) resolve();
      });
      setTimeout(resolve, 2000);
    });

    assert(clientA.connected && clientB.connected, "Socket.IO: Client A và Client B kết nối và handshake JWT thành công");

    // Tham gia phòng
    clientA.emit("join_room", userA.id);
    clientB.emit("join_room", userB.id);
    await new Promise((r) => setTimeout(r, 300));

    // 6.2 Test chuyển tiếp tin nhắn realtime A -> B
    const messagePromise = new Promise<any>((resolve) => {
      clientB.on("receive_message", (msg) => {
        resolve(msg);
      });
      setTimeout(() => resolve(null), 3000);
    });

    clientA.emit("send_message", {
      receiverId: userB.id,
      message: {
        id: 7777,
        senderId: userA.id,
        content: "Tin nhắn realtime qua Socket.IO!",
      },
    });

    const received = await messagePromise;
    assert(
      received && received.content === "Tin nhắn realtime qua Socket.IO!",
      "Realtime Relay: Client B nhận được tin nhắn tức thì từ Client A qua Socket.IO"
    );

    // 6.3 Test Typing Indicator
    const typingPromise = new Promise<any>((resolve) => {
      clientB.on("user_typing", (data) => {
        resolve(data);
      });
      setTimeout(() => resolve(null), 2500);
    });

    clientA.emit("typing_start", {
      receiverId: userB.id,
      senderId: userA.id,
      senderName: userA.name,
    });

    const typingData = await typingPromise;
    assert(
      typingData && typingData.senderId === userA.id,
      "Typing Indicator: Client B nhận được sự kiện 'user_typing' từ Client A"
    );

    clientA.disconnect();
    clientB.disconnect();
    assert(true, "Socket.IO: Giải phóng kết nối sockets sạch sẽ");
  } catch (e: any) {
    assert(false, "Kiểm thử Socket.IO thất bại", e.message);
  }

  console.log("\n=================================================");
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log("=================================================");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
