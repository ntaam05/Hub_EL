import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";
import {
  searchUsersService,
  addFriendService,
  getPendingRequestsService,
  getSentRequestsService,
  respondFriendRequestService,
  cancelFriendRequestService,
  getFriendsListService,
  removeFriendService,
  blockUserService,
  unblockUserService,
  getBlockedUsersService,
  getOtherUserProfileService,
} from "../src/services/friends.service";
import {
  searchUsersAction,
  addFriendAction,
  getPendingRequestsAction,
  respondFriendRequestAction,
  getFriendsListAction,
  removeFriendAction,
  blockUserAction,
  unblockUserAction,
  getBlockedUsersAction,
  getOtherUserProfile,
} from "../src/actions/social/social";
import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "hub-el-secret-key-mobile-jwt-2026";
const BASE_URL = "http://localhost:3000";

const USER_A_ID = "test_friend_user_a_2026";
const USER_B_ID = "test_friend_user_b_2026";
const USER_C_ID = "test_friend_user_c_2026";

function generateTestToken(userId: string) {
  return jwt.sign(
    { id: userId, email: `${userId}@hubel.test`, type: "access" },
    AUTH_SECRET,
    { expiresIn: "1h" }
  );
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ FRIENDS SERVICE & REST API (5D.2)");
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

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP TEST USERS & CLEANUP DATABASE
    // -------------------------------------------------------------------------
    console.log("--- 1. CHUẨN BỊ TÀI KHOẢN & DỌN DẸP DỮ LIỆU CŨ ---");

    // Clean up any old test friendships
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId1: { in: [USER_A_ID, USER_B_ID, USER_C_ID] } },
          { userId2: { in: [USER_A_ID, USER_B_ID, USER_C_ID] } },
        ],
      },
    });

    // Create / Upsert User A (Alice)
    await prisma.user.upsert({
      where: { id: USER_A_ID },
      create: {
        id: USER_A_ID,
        email: "alice_tester@hubel.test",
        username: "alice_tester_2026",
        name: "Alice Tester",
        avatar: "https://i.pravatar.cc/150?u=alice",
        isActive: true,
        level: 5,
        xp: 1200,
        bio: "Xin chào, tôi là Alice Tester!",
      },
      update: {
        name: "Alice Tester",
        username: "alice_tester_2026",
        isActive: true,
        bio: "Xin chào, tôi là Alice Tester!",
      },
    });

    // Create / Upsert User B (Bob)
    await prisma.user.upsert({
      where: { id: USER_B_ID },
      create: {
        id: USER_B_ID,
        email: "bob_tester@hubel.test",
        username: "bob_tester_2026",
        name: "Bob Tester",
        avatar: "https://i.pravatar.cc/150?u=bob",
        isActive: true,
        level: 3,
        xp: 600,
        bio: "Học tập chăm chỉ mỗi ngày",
      },
      update: {
        name: "Bob Tester",
        username: "bob_tester_2026",
        isActive: true,
      },
    });

    // Create / Upsert User C (Charlie - Private Profile)
    await prisma.user.upsert({
      where: { id: USER_C_ID },
      create: {
        id: USER_C_ID,
        email: "charlie_tester@hubel.test",
        username: "charlie_tester_2026",
        name: "Charlie Tester",
        avatar: "https://i.pravatar.cc/150?u=charlie",
        isActive: true,
        level: 2,
        xp: 300,
        bio: "Tôi thích sự riêng tư",
        privacySettings: JSON.stringify({
          showOnline: false,
          onlineScope: "friends",
          publicProfile: false,
          profileScope: "friends",
        }),
      },
      update: {
        name: "Charlie Tester",
        username: "charlie_tester_2026",
        privacySettings: JSON.stringify({
          showOnline: false,
          onlineScope: "friends",
          publicProfile: false,
          profileScope: "friends",
        }),
      },
    });

    assert(true, "Tạo 3 tài khoản kiểm thử Alice (A), Bob (B), Charlie (C) thành công");

    const tokenA = generateTestToken(USER_A_ID);
    const tokenB = generateTestToken(USER_B_ID);
    const tokenC = generateTestToken(USER_C_ID);

    // -------------------------------------------------------------------------
    // 2. USER SEARCH TESTS (SERVICE & REST API)
    // -------------------------------------------------------------------------
    console.log("\n--- 2. KIỂM THỬ TÌM KIẾM NGƯỜI DÙNG (USER SEARCH) ---");

    // 2.1 Service search by name
    const searchByName = await searchUsersService("Bob Tester", USER_A_ID);
    assert(
      searchByName.success && searchByName.data?.length === 1 && searchByName.data[0].id === USER_B_ID,
      "Service: Tìm kiếm theo họ tên chính xác trả về đúng người dùng"
    );
    assert(
      searchByName.data?.[0].friendshipStatus === "NONE" && !searchByName.data?.[0].isSender,
      "Service: Người dùng chưa kết bạn có friendshipStatus là 'NONE'"
    );

    // 2.2 Service search by username
    const searchByUsername = await searchUsersService("bob_tester", USER_A_ID);
    assert(
      Boolean(searchByUsername.success && searchByUsername.data?.some((u) => u.id === USER_B_ID)),
      "Service: Tìm kiếm theo username trả về kết quả chính xác"
    );

    // 2.3 Service search empty query
    const searchEmpty = await searchUsersService("", USER_A_ID);
    assert(searchEmpty.success && searchEmpty.data?.length === 0, "Service: Tìm kiếm chuỗi rỗng trả về mảng trống");

    // 2.4 Service search does not return self
    const searchSelf = await searchUsersService("Alice", USER_A_ID);
    assert(
      searchSelf.success && !searchSelf.data?.some((u) => u.id === USER_A_ID),
      "Service: Tìm kiếm không bao giờ trả về chính người dùng đang tìm kiếm"
    );

    // 2.5 REST API: GET /api/v1/friends/search?q=Bob
    const resSearchApi = await fetch(`${BASE_URL}/api/v1/friends/search?q=Bob`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchApiData = await resSearchApi.json();
    assert(
      resSearchApi.status === 200 && searchApiData.success && searchApiData.data.length >= 1,
      "REST API: GET /api/v1/friends/search trả về HTTP 200 và danh sách kết quả"
    );
    assert(
      searchApiData.data[0].password === undefined && searchApiData.data[0].passwordHash === undefined,
      "Security: REST API tìm kiếm không để lộ mật khẩu hoặc hash nhạy cảm"
    );

    // -------------------------------------------------------------------------
    // 3. FRIEND REQUESTS (GỬI, NHẬN, TỪ CHỐI, HỦY, CHẤP NHẬN)
    // -------------------------------------------------------------------------
    console.log("\n--- 3. KIỂM THỬ LỜI MỜI KẾT BẠN (FRIEND REQUESTS) ---");

    // 3.1 Cannot send request to oneself
    const selfReq = await addFriendService(USER_A_ID, USER_A_ID);
    assert(!selfReq.success && selfReq.statusCode === 400, "Service: Chặn tự kết bạn với chính mình (HTTP 400)");

    // 3.2 REST API: Cannot send request to oneself
    const resSelfApi = await fetch(`${BASE_URL}/api/v1/friends/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ targetUserId: USER_A_ID }),
    });
    assert(resSelfApi.status === 400, "REST API: Chặn tự gửi lời mời kết bạn cho chính mình (HTTP 400)");

    // 3.3 Send request A -> B via REST API
    const resSendReq = await fetch(`${BASE_URL}/api/v1/friends/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ targetUserId: USER_B_ID }),
    });
    const sendReqData = await resSendReq.json();
    assert(
      resSendReq.status === 200 && sendReqData.success && sendReqData.data?.friendshipId,
      "REST API: Gửi lời mời kết bạn từ User A tới User B thành công"
    );
    const requestId = sendReqData.data.friendshipId;

    // 3.4 Duplicate request handled safely
    const resDupReq = await fetch(`${BASE_URL}/api/v1/friends/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ targetUserId: USER_B_ID }),
    });
    const dupData = await resDupReq.json();
    assert(
      resDupReq.status === 200 && dupData.message?.includes("trước đó"),
      "REST API: Gửi trùng lời mời kết bạn báo đã có lời mời trước đó, không tạo bản ghi rác"
    );

    // 3.5 Check sent requests from A
    const resSentReq = await fetch(`${BASE_URL}/api/v1/friends/requests/sent`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const sentData = await resSentReq.json();
    assert(
      resSentReq.status === 200 && sentData.data.some((r: any) => r.id === requestId && r.receiverId === USER_B_ID),
      "REST API: GET /api/v1/friends/requests/sent trả về lời mời User A vừa gửi"
    );

    // 3.6 Check received requests for B
    const resRecvReq = await fetch(`${BASE_URL}/api/v1/friends/requests`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const recvData = await resRecvReq.json();
    assert(
      resRecvReq.status === 200 && recvData.data.some((r: any) => r.id === requestId && r.senderId === USER_A_ID),
      "REST API: GET /api/v1/friends/requests trả về đúng lời mời User B nhận được"
    );

    // 3.7 Search now reflects PENDING status and isSender
    const searchAfterReqA = await searchUsersService("Bob Tester", USER_A_ID);
    assert(
      searchAfterReqA.data?.[0].friendshipStatus === "PENDING" && searchAfterReqA.data?.[0].isSender === true,
      "Service: User A tìm thấy User B với trạng thái PENDING và isSender=true"
    );
    const searchAfterReqB = await searchUsersService("Alice Tester", USER_B_ID);
    assert(
      searchAfterReqB.data?.[0].friendshipStatus === "PENDING" && searchAfterReqB.data?.[0].isSender === false,
      "Service: User B tìm thấy User A với trạng thái PENDING và isSender=false"
    );

    // 3.8 User C cannot respond to A's request to B (Authorization guard)
    const resUnauthorizedRespond = await fetch(`${BASE_URL}/api/v1/friends/requests/${requestId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ accept: true }),
    });
    assert(
      resUnauthorizedRespond.status === 403,
      "Security: Người thứ ba (User C) không thể chấp nhận lời mời kết bạn của người khác (HTTP 403)"
    );

    // 3.9 B rejects A's request
    const resReject = await fetch(`${BASE_URL}/api/v1/friends/requests/${requestId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ accept: false }),
    });
    assert(resReject.status === 200, "REST API: User B từ chối lời mời kết bạn thành công");

    // Verify friendship record deleted
    const countAfterReject = await prisma.friendship.count({
      where: {
        OR: [
          { userId1: USER_A_ID, userId2: USER_B_ID },
          { userId1: USER_B_ID, userId2: USER_A_ID },
        ],
      },
    });
    assert(countAfterReject === 0, "Database: Bản ghi lời mời bị xóa triệt để khi bị từ chối");

    // 3.10 A sends request to B again, then cancels it
    const req2 = await addFriendService(USER_A_ID, USER_B_ID);
    const req2Id = req2.data?.friendshipId!;

    // Cancel sent request via REST API
    const resCancel = await fetch(`${BASE_URL}/api/v1/friends/requests/${req2Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resCancel.status === 200, "REST API: User A hủy thành công lời mời đã gửi");

    // 3.11 A sends request to B and B accepts it
    const req3 = await addFriendService(USER_A_ID, USER_B_ID);
    const req3Id = req3.data?.friendshipId!;

    const resAccept = await fetch(`${BASE_URL}/api/v1/friends/requests/${req3Id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ accept: true }),
    });
    assert(resAccept.status === 200, "REST API: User B chấp nhận lời mời kết bạn thành công");

    // 3.12 Cannot send request to someone who is already accepted friend
    const resReqAlreadyFriends = await fetch(`${BASE_URL}/api/v1/friends/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ targetUserId: USER_B_ID }),
    });
    assert(resReqAlreadyFriends.status === 400, "REST API: Chặn gửi lời mời khi hai người đã là bạn bè (HTTP 400)");

    // -------------------------------------------------------------------------
    // 4. FRIENDS LIST TESTS (DANH SÁCH BẠN BÈ)
    // -------------------------------------------------------------------------
    console.log("\n--- 4. KIỂM THỬ DANH SÁCH BẠN BÈ (FRIENDS LIST) ---");

    // 4.1 A's friends list
    const resFriendsA = await fetch(`${BASE_URL}/api/v1/friends`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const friendsA = await resFriendsA.json();
    assert(
      resFriendsA.status === 200 && friendsA.data.some((f: any) => f.id === USER_B_ID && f.friendshipStatus === "ACCEPTED"),
      "REST API: User A thấy User B trong danh sách bạn bè với trạng thái ACCEPTED"
    );

    // 4.2 B's friends list (2-way check)
    const resFriendsB = await fetch(`${BASE_URL}/api/v1/friends`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const friendsB = await resFriendsB.json();
    assert(
      resFriendsB.status === 200 && friendsB.data.some((f: any) => f.id === USER_A_ID && f.friendshipStatus === "ACCEPTED"),
      "REST API: User B cũng thấy User A trong danh sách bạn bè (Quan hệ 2 chiều toàn vẹn)"
    );

    // 4.3 C has no friends
    const resFriendsC = await fetch(`${BASE_URL}/api/v1/friends`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    const friendsC = await resFriendsC.json();
    assert(resFriendsC.status === 200 && friendsC.data.length === 0, "REST API: User C chưa kết bạn ai có danh sách rỗng");

    // -------------------------------------------------------------------------
    // 5. BLOCK & UNBLOCK TESTS (CHẶN VÀ BỎ CHẶN)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. KIỂM THỬ CHẶN VÀ BỎ CHẶN (BLOCK & UNBLOCK) ---");

    // 5.1 Cannot block oneself
    const resBlockSelf = await fetch(`${BASE_URL}/api/v1/friends/${USER_A_ID}/block`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resBlockSelf.status === 400, "REST API: Chặn tự chặn chính mình (HTTP 400)");

    // 5.2 A blocks B
    const resBlockB = await fetch(`${BASE_URL}/api/v1/friends/${USER_B_ID}/block`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resBlockB.status === 200, "REST API: User A chặn User B thành công");

    // 5.3 Verify blocked state for A
    const listAfterBlockA = await getFriendsListService(USER_A_ID);
    const friendBInA = listAfterBlockA.data?.find((f) => f.id === USER_B_ID);
    assert(
      friendBInA?.friendshipStatus === "BLOCKED" && friendBInA?.isBlockedByMe === true && !friendBInA?.isBlockedByThem,
      "Service: User A thấy User B bị đánh dấu isBlockedByMe=true và isBlockedByThem=false"
    );

    // 5.4 Verify blocked state for B
    const listAfterBlockB = await getFriendsListService(USER_B_ID);
    const friendAInB = listAfterBlockB.data?.find((f) => f.id === USER_A_ID);
    assert(
      friendAInB?.friendshipStatus === "BLOCKED" && !friendAInB?.isBlockedByMe && friendAInB?.isBlockedByThem === true,
      "Service: User B thấy User A bị đánh dấu isBlockedByMe=false và isBlockedByThem=true"
    );

    // 5.5 Check blocked users list for A
    const resBlockedList = await fetch(`${BASE_URL}/api/v1/friends/blocked`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const blockedData = await resBlockedList.json();
    assert(
      resBlockedList.status === 200 && blockedData.data.some((u: any) => u.id === USER_B_ID),
      "REST API: GET /api/v1/friends/blocked trả về đúng User B trong danh sách người đã chặn"
    );

    // 5.6 A unblocks B
    const resUnblockB = await fetch(`${BASE_URL}/api/v1/friends/${USER_B_ID}/block`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resUnblockB.status === 200, "REST API: User A bỏ chặn User B thành công");

    // 5.7 Verify status after unblocking reverts to ACCEPTED (Web rule)
    const listAfterUnblock = await getFriendsListService(USER_A_ID);
    const friendBUnblocked = listAfterUnblock.data?.find((f) => f.id === USER_B_ID);
    assert(
      friendBUnblocked?.friendshipStatus === "ACCEPTED" && !friendBUnblocked?.isBlockedByMe,
      "Web Rule: Sau khi bỏ chặn, quan hệ tự động khôi phục về ACCEPTED"
    );

    // -------------------------------------------------------------------------
    // 6. OTHER USER PROFILE & PRIVACY SETTINGS
    // -------------------------------------------------------------------------
    console.log("\n--- 6. KIỂM THỬ XEM HỒ SƠ NGƯỜI DÙNG & QUYỀN RIÊNG TƯ ---");

    // 6.1 View profile of friend (A views B)
    const resProfileB = await fetch(`${BASE_URL}/api/v1/friends/profile/${USER_B_ID}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const profileBData = await resProfileB.json();
    assert(
      resProfileB.status === 200 && profileBData.success && profileBData.data.name === "Bob Tester",
      "REST API: User A xem được hồ sơ công khai của bạn bè (User B)"
    );

    // 6.2 View profile via alias /api/v1/users/[id]/profile
    const resProfileAlias = await fetch(`${BASE_URL}/api/v1/users/${USER_B_ID}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resProfileAlias.status === 200, "REST API Alias: GET /api/v1/users/[id]/profile hoạt động chuẩn xác");

    // 6.3 View profile of Charlie (C has private profile and not friend with A)
    const resProfileC = await fetch(`${BASE_URL}/api/v1/friends/profile/${USER_C_ID}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const profileCData = await resProfileC.json();
    assert(
      profileCData.data.isProfileHidden === true && profileCData.data.bio === null,
      "Privacy: Người dùng cài đặt riêng tư (Charlie) bị ẩn Bio và thông tin chi tiết đối với người chưa kết bạn"
    );

    // 6.4 When blocked, profile is completely hidden
    await blockUserService(USER_A_ID, USER_B_ID);
    const resProfileBWhenBlocked = await fetch(`${BASE_URL}/api/v1/friends/profile/${USER_B_ID}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const blockedProfileData = await resProfileBWhenBlocked.json();
    assert(
      blockedProfileData.data.isProfileHidden === true && blockedProfileData.data.isActive === false,
      "Privacy: Khi đang có trạng thái chặn, hồ sơ và trạng thái online bị ẩn hoàn toàn"
    );

    // Restore unblock
    await unblockUserService(USER_A_ID, USER_B_ID);

    // -------------------------------------------------------------------------
    // 7. REMOVE FRIEND (HỦY KẾT BẠN)
    // -------------------------------------------------------------------------
    console.log("\n--- 7. KIỂM THỬ HỦY KẾT BẠN (REMOVE FRIEND) ---");

    const resUnfriend = await fetch(`${BASE_URL}/api/v1/friends/${USER_B_ID}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resUnfriend.status === 200, "REST API: User A hủy kết bạn với User B thành công");

    const listAfterUnfriendA = await getFriendsListService(USER_A_ID);
    assert(
      !listAfterUnfriendA.data?.some((f) => f.id === USER_B_ID),
      "Database: User B không còn xuất hiện trong danh sách bạn bè của User A"
    );

    // -------------------------------------------------------------------------
    // 8. SECURITY & JWT AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log("\n--- 8. KIỂM THỬ BẢO MẬT & JWT AUTHENTICATION ---");

    // 8.1 Missing JWT Token
    const resNoAuth = await fetch(`${BASE_URL}/api/v1/friends`);
    assert(resNoAuth.status === 401, "Security: Request không có Header Authorization bị từ chối (HTTP 401)");

    // 8.2 Malformed JWT Token
    const resBadToken = await fetch(`${BASE_URL}/api/v1/friends`, {
      headers: { Authorization: "Bearer malformed.invalid.token" },
    });
    assert(resBadToken.status === 401, "Security: Token JWT giả mạo bị từ chối (HTTP 401)");

    // 8.3 Non-existent user profile
    const resNotFoundUser = await fetch(`${BASE_URL}/api/v1/friends/profile/non_existent_user_id_123`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resNotFoundUser.status === 404, "HTTP: Truy cập người dùng không tồn tại trả về HTTP 404");

    // -------------------------------------------------------------------------
    // 9. CONCURRENCY TESTING (XỬ LÝ ĐỒNG THỜI)
    // -------------------------------------------------------------------------
    console.log("\n--- 9. KIỂM THỬ ĐỒNG THỜI (CONCURRENCY HANDLING) ---");

    // 9.1 Two simultaneous friend requests between A and B
    const [concReq1, concReq2] = await Promise.all([
      addFriendService(USER_A_ID, USER_B_ID),
      addFriendService(USER_B_ID, USER_A_ID),
    ]);
    assert(
      concReq1.success && concReq2.success,
      "Concurrency: Hai yêu cầu kết bạn đối ứng cùng lúc được xử lý mượt mà, tự động kết nối"
    );

    // Verify only ONE friendship record exists in database
    const totalFriendships = await prisma.friendship.count({
      where: {
        OR: [
          { userId1: USER_A_ID, userId2: USER_B_ID },
          { userId1: USER_B_ID, userId2: USER_A_ID },
        ],
      },
    });
    assert(totalFriendships === 1, "Concurrency: Tuyệt đối không tạo bản ghi Friendship trùng lặp trong Database");

    // -------------------------------------------------------------------------
    // 10. SERVER ACTIONS REGRESSION TEST
    // -------------------------------------------------------------------------
    console.log("\n--- 10. KIỂM THỬ KHẢ NĂNG HỒI QUY CỦA SERVER ACTIONS ---");

    const saSearch = await searchUsersAction("Bob", USER_A_ID);
    assert(saSearch.success && saSearch.data?.length! >= 1, "Server Action: searchUsersAction hoạt động bình thường");

    const saFriends = await getFriendsListAction(USER_A_ID);
    assert(saFriends.success && saFriends.data?.length! >= 1, "Server Action: getFriendsListAction hoạt động bình thường");

    const saProfile = await getOtherUserProfile(USER_B_ID, USER_A_ID);
    assert(saProfile.success && saProfile.data?.name === "Bob Tester", "Server Action: getOtherUserProfile hoạt động bình thường");

    const saRemove = await removeFriendAction(USER_A_ID, USER_B_ID);
    assert(saRemove.success, "Server Action: removeFriendAction hoạt động bình thường");

    // Final cleanup of test data
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId1: { in: [USER_A_ID, USER_B_ID, USER_C_ID] } },
          { userId2: { in: [USER_A_ID, USER_B_ID, USER_C_ID] } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [USER_A_ID, USER_B_ID, USER_C_ID] } },
    });

    console.log("\n=================================================");
    console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ LỖI TRONG QUÁ TRÌNH THỰC THI KIỂM THỬ:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
