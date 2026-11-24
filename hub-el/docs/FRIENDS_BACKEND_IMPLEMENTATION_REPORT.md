# BÁO CÁO HOÀN THÀNH GIAI ĐOẠN 5 – BƯỚC 5D.2
## FRIENDS BACKEND SERVICE & REST API BRIDGE

---

## 1. TỔNG QUAN KẾT QUẢ

- **Mục tiêu:** Xây dựng `FriendsService` dùng chung và hệ thống 10 REST API Route Handlers chuẩn hóa, phục vụ toàn diện tính năng **Friends & Social Profile** (Tìm kiếm người dùng, gửi/hủy/chấp nhận/từ chối lời mời kết bạn, danh sách bạn bè, hủy kết bạn, chặn/bỏ chặn người dùng, xem hồ sơ cá nhân và kiểm tra quyền riêng tư) cho cả ứng dụng Flutter Mobile Native (`hub_el_mobile`) và ứng dụng Web Next.js (`hub-el`).
- **Dự án Backend:** `hub-el` (Next.js 15 App Router, Prisma ORM, SQL Server).
- **Kết quả kiểm thử tự động:** **47/47 test cases PASS 100%** (`scripts/test_friends_backend.ts`), kiểm thử chuyên sâu về tính đúng đắn của quan hệ bạn bè 2 chiều, trạng thái chặn (Block/Unblock), quyền riêng tư theo scope (`PUBLIC`, `FRIENDS`, `PRIVATE`), bảo mật JWT Bearer Token, kiểm thử race condition đồng thời và kiểm thử hồi quy các Server Actions.
- **Tương thích ngược (Backward Compatibility):** 100% Server Actions liên quan đến bạn bè trong `src/actions/social/social.ts` (10 hàm) đã được refactor để ủy thác trực tiếp sang `FriendsService`, kết hợp cơ chế `safeRevalidatePath` an toàn khi chạy ngoài Next.js HTTP runtime, giữ nguyên chữ ký hàm cho Web Client.
- **Bảo mật và toàn vẹn dữ liệu:** Toàn bộ REST API Route Handlers đều xác thực Bearer JWT thông qua `authenticateApiRequest`, lấy `userId` từ token đã giải mã (`verifyToken`), tuyệt đối không tin cậy `userId` do client gửi lên. Mọi thao tác kết bạn/chặn/hủy kết bạn đều đảm bảo toàn vẹn dữ liệu hai chiều và bảo vệ chống tạo bản ghi rác.

---

## 2. DANH SÁCH FILE ĐÃ TẠO VÀ CHỈNH SỬA

| STT | File | Trạng thái | Chức năng |
|---|---|---|---|
| 1 | `hub-el/src/services/friends.service.ts` | **Tạo mới** | Service nghiệp vụ lõi (12 phương thức): Tìm kiếm, kết bạn, quản lý lời mời gửi/nhận, danh sách bạn bè, chặn/bỏ chặn, xem hồ sơ kèm kiểm tra quyền riêng tư. |
| 2 | `hub-el/src/lib/api-auth.ts` | **Tạo mới** | Module xác thực Bearer JWT token dùng chung cho REST Route Handlers, trả về `userId` đã giải mã hoặc `NextResponse` lỗi chuẩn (401). |
| 3 | `hub-el/src/actions/social/social.ts` | **Refactor** | Ủy thác 10 Server Actions bạn bè sang `friends.service.ts`, giữ nguyên logic web, bổ sung `safeRevalidatePath`. |
| 4 | `hub-el/src/app/api/v1/friends/route.ts` | **Tạo mới** | Route Handler `GET /api/v1/friends`: Lấy danh sách bạn bè của người dùng đang đăng nhập. |
| 5 | `hub-el/src/app/api/v1/friends/search/route.ts` | **Tạo mới** | Route Handler `GET /api/v1/friends/search?q=...`: Tìm kiếm người dùng theo tên hoặc username, tự động gắn cờ `friendshipStatus`. |
| 6 | `hub-el/src/app/api/v1/friends/requests/route.ts` | **Tạo mới** | Route Handler `GET` lấy danh sách lời mời nhận được; `POST` gửi lời mời kết bạn mới. |
| 7 | `hub-el/src/app/api/v1/friends/requests/sent/route.ts` | **Tạo mới** | Route Handler `GET /api/v1/friends/requests/sent`: Lấy danh sách lời mời kết bạn người dùng đã gửi. |
| 8 | `hub-el/src/app/api/v1/friends/requests/[id]/route.ts` | **Tạo mới** | Route Handler `DELETE /api/v1/friends/requests/[id]`: Hủy lời mời kết bạn đã gửi (hỗ trợ cả Friendship ID số hoặc Target User ID). |
| 9 | `hub-el/src/app/api/v1/friends/requests/[id]/respond/route.ts` | **Tạo mới** | Route Handler `POST /api/v1/friends/requests/[id]/respond`: Chấp nhận (`accept: true`) hoặc từ chối (`accept: false`) lời mời kết bạn. |
| 10 | `hub-el/src/app/api/v1/friends/[id]/route.ts` | **Tạo mới** | Route Handler `DELETE /api/v1/friends/[id]`: Hủy kết bạn với một người dùng (xóa bản ghi kết nối 2 chiều). |
| 11 | `hub-el/src/app/api/v1/friends/[id]/block/route.ts` | **Tạo mới** | Route Handler `POST` chặn người dùng (`BLOCKED`); `DELETE` bỏ chặn người dùng (khôi phục trạng thái bạn bè). |
| 12 | `hub-el/src/app/api/v1/friends/blocked/route.ts` | **Tạo mới** | Route Handler `GET /api/v1/friends/blocked`: Lấy danh sách những người dùng đã bị chặn bởi người dùng hiện tại. |
| 13 | `hub-el/src/app/api/v1/friends/profile/[id]/route.ts` | **Tạo mới** | Route Handler `GET /api/v1/friends/profile/[id]`: Xem hồ sơ chi tiết của người dùng khác kèm lọc quyền riêng tư. |
| 14 | `hub-el/src/app/api/v1/users/[id]/profile/route.ts` | **Tạo mới** | Route Handler Alias `GET /api/v1/users/[id]/profile`: Đồng bộ định tuyến xem profile người dùng. |
| 15 | `hub_el_mobile/lib/core/constants/api_endpoints.dart` | **Cập nhật** | Bổ sung đầy đủ 12 endpoint constants cho Friends & Social Profile. |
| 16 | `hub-el/scripts/test_friends_backend.ts` | **Tạo mới** | Bộ kịch bản kiểm thử tích hợp 47 scenarios trên SQL Server và Next.js HTTP server. |

---

## 3. KIẾN TRÚC VÀ NGHIỆP VỤ LÕI CỦA FRIENDS SERVICE

Dựa trên cấu trúc Prisma Schema hiện tại:
- Bảng `Friendship` lưu quan hệ giữa 2 người dùng (`userId1`, `userId2`) kèm `status` (`PENDING`, `ACCEPTED`, `BLOCKED`).
- Chỉ mục unique: `@@unique([userId1, userId2])`.

### 12 Phương thức trong `FriendsService`:

1. **`searchUsersService(query, currentUserId)`**:
   - Tìm kiếm người dùng theo tên (`name`) hoặc username (`username`) dạng không phân biệt hoa thường (`mode: 'insensitive'`).
   - Loại trừ hoàn toàn chính người dùng đang tìm kiếm (`id != currentUserId`).
   - Tự động tra cứu quan hệ giữa `currentUserId` và từng người trong kết quả để gắn `friendshipStatus`:
     - `'ACCEPTED'`: Đã là bạn bè.
     - `'PENDING'`: Đang có lời mời chờ duyệt (gắn kèm `isSender: true/false` và `friendshipId`).
     - `'BLOCKED'`: Đang bị chặn (gắn cờ `isBlockedByMe` và `isBlockedByThem`).
     - `'NONE'`: Chưa có quan hệ.
   - Ẩn hoàn toàn email/mật khẩu và lọc trạng thái online theo cài đặt riêng tư của từng đối tượng.

2. **`addFriendService(currentUserId, targetUserId)`**:
   - Kiểm tra chặn tự gửi lời mời cho chính mình (`currentUserId === targetUserId` $\rightarrow$ 400).
   - Kiểm tra quan hệ hiện có giữa 2 người dùng.
   - Nếu đã là bạn bè (`ACCEPTED`) $\rightarrow$ báo lỗi không thể gửi lời mời.
   - Nếu đang bị chặn (`BLOCKED`) $\rightarrow$ từ chối.
   - Nếu đã có lời mời do đối phương gửi trước đó $\rightarrow$ tự động chấp nhận kết bạn (`ACCEPTED`), tạo trải nghiệm kết nối tức thì không gây lỗi.
   - Nếu đã gửi trước đó $\rightarrow$ báo đã gửi, không tạo bản ghi trùng lặp.
   - Tạo bản ghi `Friendship` với `userId1 = currentUserId`, `userId2 = targetUserId`, `status = "PENDING"`.
   - Gửi thông báo email nền (không chặn luồng - non-blocking).

3. **`getPendingRequestsService(currentUserId)`**:
   - Truy vấn các bản ghi `Friendship` có `userId2 = currentUserId` và `status = "PENDING"`.
   - Trả về thông tin người gửi (`User1`) gồm ID, tên, username, avatar, level, và thời gian gửi.

4. **`getSentRequestsService(currentUserId)`**:
   - Truy vấn các bản ghi `Friendship` có `userId1 = currentUserId` và `status = "PENDING"`.
   - Trả về thông tin người nhận (`User2`) kèm ID lời mời để phục vụ tính năng hủy lời mời từ phía người gửi.

5. **`respondFriendRequestService(friendshipId, currentUserId, accept)`**:
   - Tìm bản ghi `Friendship` theo ID.
   - **Bảo mật phân quyền:** Xác thực người nhận `friendship.userId2 === currentUserId`. Tuyệt đối chặn người thứ ba duyệt lời mời của người khác (HTTP 403).
   - Nếu `accept = true`: Cập nhật `status = "ACCEPTED"`.
   - Nếu `accept = false`: Xóa vĩnh viễn bản ghi `Friendship` khỏi Database theo đúng hành vi Web hiện tại.

6. **`cancelFriendRequestService(identifier, currentUserId)`**:
   - Hỗ trợ cả 2 cách hủy: truyền `friendshipId` (dạng số) hoặc `targetUserId` (dạng chuỗi ID người nhận).
   - Xác thực người gửi `friendship.userId1 === currentUserId`.
   - Xóa bản ghi `Friendship` khi đang ở trạng thái `PENDING`.

7. **`getFriendsListService(currentUserId)`**:
   - Truy vấn toàn bộ các bản ghi `Friendship` có `status = "ACCEPTED"` mà `currentUserId` là `userId1` hoặc `userId2`.
   - Tách lấy đối tượng bạn bè (nếu `currentUserId === userId1` thì lấy `User2` và ngược lại).
   - Tính toán trạng thái `isOnline` dựa trên `lastActive` (trong vòng 5 phút) kết hợp cài đặt riêng tư `showOnline` và `onlineScope`.

8. **`removeFriendService(currentUserId, friendId)`**:
   - Tìm bản ghi `Friendship` có `status = "ACCEPTED"` giữa 2 người dùng.
   - Xóa bản ghi kết nối. Quan hệ 2 chiều được dọn dẹp hoàn toàn trong 1 thao tác.

9. **`blockUserService(currentUserId, targetUserId)`**:
   - Kiểm tra chặn tự chặn chính mình.
   - Nếu đã có quan hệ bạn bè/lời mời trước đó: Cập nhật bản ghi thành `userId1 = currentUserId`, `userId2 = targetUserId`, `status = "BLOCKED"`.
   - Nếu chưa có quan hệ: Tạo mới bản ghi `Friendship` với `status = "BLOCKED"`.

10. **`unblockUserService(currentUserId, targetUserId)`**:
    - Tìm bản ghi `Friendship` mà `userId1 = currentUserId`, `userId2 = targetUserId`, và `status = "BLOCKED"`.
    - Khôi phục trạng thái thành `status = "ACCEPTED"` theo đúng quy chuẩn nghiệp vụ của Mobile Web `hub-el`.

11. **`getBlockedUsersService(currentUserId)`**:
    - Lấy danh sách người dùng bị chặn bởi `currentUserId` (`userId1 = currentUserId` và `status = "BLOCKED"`).
    - Trả về danh sách thông tin người bị chặn (`User2`).

12. **`getOtherUserProfileService(targetUserId, currentUserId)`**:
    - Lấy thông tin chi tiết của người dùng: tên, username, avatar, bio, level, streak, XP, danh sách bạn bè chung.
    - Áp dụng các quy tắc quyền riêng tư theo cài đặt `privacySettings`:
      - Nếu đang có trạng thái chặn giữa 2 người: Ẩn hoàn toàn profile (`isProfileHidden = true`, ẩn bio, danh sách bạn bè rỗng, ẩn trạng thái online).
      - Nếu `publicProfile = false` hoặc `profileScope = "FRIENDS"` mà chưa phải bạn bè: Giới hạn thông tin trả về, đánh dấu `isProfileHidden = true`.
      - Ngược lại: Hiển thị đầy đủ thông tin hồ sơ và danh sách bạn bè công khai.

---

## 4. TÀI LIỆU CHI TIẾT REST API BRIDGE

Tất cả các endpoint đều yêu cầu Header:
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

### 4.1. Danh sách bạn bè
- **Endpoint:** `GET /api/v1/friends`
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1userb0002...",
      "name": "Bob Tester",
      "username": "bob_tester",
      "image": "/avatars/avatar1.png",
      "isOnline": true,
      "level": 3,
      "streak": 5,
      "friendshipId": 142
    }
  ]
}
```

### 4.2. Tìm kiếm người dùng
- **Endpoint:** `GET /api/v1/friends/search?q={keyword}`
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1userb0002...",
      "name": "Bob Tester",
      "username": "bob_tester",
      "image": "/avatars/avatar1.png",
      "level": 3,
      "isOnline": true,
      "friendshipStatus": "PENDING",
      "isSender": true,
      "friendshipId": 143,
      "isBlockedByMe": false,
      "isBlockedByThem": false
    }
  ]
}
```

### 4.3. Gửi lời mời kết bạn
- **Endpoint:** `POST /api/v1/friends/requests`
- **Body:**
```json
{
  "targetUserId": "cm1userb0002..."
}
```
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "message": "Đã gửi lời mời kết bạn thành công."
}
```

### 4.4. Lấy danh sách lời mời nhận được
- **Endpoint:** `GET /api/v1/friends/requests`
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 143,
      "sender": {
        "id": "cm1usera0001...",
        "name": "Alice Tester",
        "username": "alice_tester",
        "image": null,
        "level": 1
      },
      "createdAt": "2026-11-16T12:43:00.000Z"
    }
  ]
}
```

### 4.5. Lấy danh sách lời mời đã gửi
- **Endpoint:** `GET /api/v1/friends/requests/sent`
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 143,
      "receiver": {
        "id": "cm1userb0002...",
        "name": "Bob Tester",
        "username": "bob_tester",
        "image": null,
        "level": 3
      },
      "createdAt": "2026-11-16T12:43:00.000Z"
    }
  ]
}
```

### 4.6. Phản hồi lời mời kết bạn (Chấp nhận / Từ chối)
- **Endpoint:** `POST /api/v1/friends/requests/{id}/respond`
- **Body:**
```json
{
  "accept": true
}
```
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "message": "Đã chấp nhận lời mời kết bạn."
}
```

### 4.7. Hủy lời mời kết bạn đã gửi
- **Endpoint:** `DELETE /api/v1/friends/requests/{id}`
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "message": "Đã hủy lời mời kết bạn."
}
```

### 4.8. Hủy kết bạn (Xóa bạn)
- **Endpoint:** `DELETE /api/v1/friends/{id}`
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "message": "Đã hủy kết bạn."
}
```

### 4.9. Chặn và Bỏ chặn người dùng
- **Chặn:** `POST /api/v1/friends/{id}/block`
  - Phản hồi: `{"success": true, "message": "Đã chặn người dùng."}`
- **Bỏ chặn:** `DELETE /api/v1/friends/{id}/block`
  - Phản hồi: `{"success": true, "message": "Đã bỏ chặn người dùng."}`

### 4.10. Danh sách người đã chặn
- **Endpoint:** `GET /api/v1/friends/blocked`
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1userb0002...",
      "name": "Bob Tester",
      "username": "bob_tester",
      "image": null
    }
  ]
}
```

### 4.11. Xem hồ sơ người dùng khác
- **Endpoint:** `GET /api/v1/friends/profile/{id}` (hoặc alias `GET /api/v1/users/{id}/profile`)
- **Mã phản hồi thành công:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "cm1userb0002...",
    "name": "Bob Tester",
    "username": "bob_tester",
    "image": null,
    "bio": "Học tiếng Anh mỗi ngày",
    "level": 3,
    "streak": 5,
    "experience": 1250,
    "isOnline": true,
    "friendshipStatus": "ACCEPTED",
    "isProfileHidden": false,
    "friendsCount": 12,
    "mutualFriendsCount": 3
  }
}
```

---

## 5. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (47/47 PASS)

Bộ kịch bản kiểm thử toàn diện `scripts/test_friends_backend.ts` đã được thực thi trực tiếp trên hệ thống SQL Server và Next.js HTTP Server (`http://localhost:3000`).

```text
=================================================
🚀 KẾT QUẢ KIỂM THỬ FRIENDS SERVICE & REST API (5D.2)
=================================================

--- 1. CHUẨN BỊ TÀI KHOẢN & DỌN DẸP DỮ LIỆU CŨ ---
✅ [PASS] Tạo 3 tài khoản kiểm thử Alice (A), Bob (B), Charlie (C) thành công

--- 2. KIỂM THỬ TÌM KIẾM NGƯỜI DÙNG (USER SEARCH) ---
✅ [PASS] Service: Tìm kiếm theo họ tên chính xác trả về đúng người dùng
✅ [PASS] Service: Người dùng chưa kết bạn có friendshipStatus là 'NONE'
✅ [PASS] Service: Tìm kiếm theo username trả về kết quả chính xác
✅ [PASS] Service: Tìm kiếm chuỗi rỗng trả về mảng trống
✅ [PASS] Service: Tìm kiếm không bao giờ trả về chính người dùng đang tìm kiếm
✅ [PASS] REST API: GET /api/v1/friends/search trả về HTTP 200 và danh sách kết quả
✅ [PASS] Security: REST API tìm kiếm không để lộ mật khẩu hoặc hash nhạy cảm

--- 3. KIỂM THỬ LỜI MỜI KẾT BẠN (FRIEND REQUESTS) ---
✅ [PASS] Service: Chặn tự kết bạn với chính mình (HTTP 400)
✅ [PASS] REST API: Chặn tự gửi lời mời kết bạn cho chính mình (HTTP 400)
✅ [PASS] REST API: Gửi lời mời kết bạn từ User A tới User B thành công
✅ [PASS] REST API: Gửi trùng lời mời kết bạn báo đã có lời mời trước đó, không tạo bản ghi rác
✅ [PASS] REST API: GET /api/v1/friends/requests/sent trả về lời mời User A vừa gửi
✅ [PASS] REST API: GET /api/v1/friends/requests trả về đúng lời mời User B nhận được
✅ [PASS] Service: User A tìm thấy User B với trạng thái PENDING và isSender=true
✅ [PASS] Service: User B tìm thấy User A với trạng thái PENDING và isSender=false
✅ [PASS] Security: Người thứ ba (User C) không thể chấp nhận lời mời kết bạn của người khác (HTTP 403)
✅ [PASS] REST API: User B từ chối lời mời kết bạn thành công
✅ [PASS] Database: Bản ghi lời mời bị xóa triệt để khi bị từ chối
✅ [PASS] REST API: User A hủy thành công lời mời đã gửi
✅ [PASS] REST API: User B chấp nhận lời mời kết bạn thành công
✅ [PASS] REST API: Chặn gửi lời mời khi hai người đã là bạn bè (HTTP 400)

--- 4. KIỂM THỬ DANH SÁCH BẠN BÈ (FRIENDS LIST) ---
✅ [PASS] REST API: User A thấy User B trong danh sách bạn bè với trạng thái ACCEPTED
✅ [PASS] REST API: User B cũng thấy User A trong danh sách bạn bè (Quan hệ 2 chiều toàn vẹn)
✅ [PASS] REST API: User C chưa kết bạn ai có danh sách rỗng

--- 5. KIỂM THỬ CHẶN VÀ BỎ CHẶN (BLOCK & UNBLOCK) ---
✅ [PASS] REST API: Chặn tự chặn chính mình (HTTP 400)
✅ [PASS] REST API: User A chặn User B thành công
✅ [PASS] Service: User A thấy User B bị đánh dấu isBlockedByMe=true và isBlockedByThem=false
✅ [PASS] Service: User B thấy User A bị đánh dấu isBlockedByMe=false và isBlockedByThem=true
✅ [PASS] REST API: GET /api/v1/friends/blocked trả về đúng User B trong danh sách người đã chặn
✅ [PASS] REST API: User A bỏ chặn User B thành công
✅ [PASS] Web Rule: Sau khi bỏ chặn, quan hệ tự động khôi phục về ACCEPTED

--- 6. KIỂM THỬ XEM HỒ SƠ NGƯỜI DÙNG & QUYỀN RIÊNG TƯ ---
✅ [PASS] REST API: User A xem được hồ sơ công khai của bạn bè (User B)
✅ [PASS] REST API Alias: GET /api/v1/users/[id]/profile hoạt động chuẩn xác
✅ [PASS] Privacy: Người dùng cài đặt riêng tư (Charlie) bị ẩn Bio và thông tin chi tiết đối với người chưa kết bạn
✅ [PASS] Privacy: Khi đang có trạng thái chặn, hồ sơ và trạng thái online bị ẩn hoàn toàn

--- 7. KIỂM THỬ HỦY KẾT BẠN (REMOVE FRIEND) ---
✅ [PASS] REST API: User A hủy kết bạn với User B thành công
✅ [PASS] Database: User B không còn xuất hiện trong danh sách bạn bè của User A

--- 8. KIỂM THỬ BẢO MẬT & JWT AUTHENTICATION ---
✅ [PASS] Security: Request không có Header Authorization bị từ chối (HTTP 401)
✅ [PASS] Security: Token JWT giả mạo bị từ chối (HTTP 401)
✅ [PASS] HTTP: Truy cập người dùng không tồn tại trả về HTTP 404

--- 9. KIỂM THỬ ĐỒNG THỜI (CONCURRENCY HANDLING) ---
✅ [PASS] Concurrency: Hai yêu cầu kết bạn đối ứng cùng lúc được xử lý mượt mà, tự động kết nối
✅ [PASS] Concurrency: Tuyệt đối không tạo bản ghi Friendship trùng lặp trong Database

--- 10. KIỂM THỬ KHẢ NĂNG HỒI QUY CỦA SERVER ACTIONS ---
✅ [PASS] Server Action: searchUsersAction hoạt động bình thường
✅ [PASS] Server Action: getFriendsListAction hoạt động bình thường
✅ [PASS] Server Action: getOtherUserProfile hoạt động bình thường
✅ [PASS] Server Action: removeFriendAction hoạt động bình thường

=================================================
🏁 KẾT QUẢ KIỂM THỬ: 47 PASS, 0 FAIL (100% SUCCESS)
=================================================
```

---

## 6. HƯỚNG DẪN KẾT NỐI CHO FLUTTER NATIVE (BƯỚC 5D.3)

Để chuẩn bị triển khai giao diện Friends Native ở Bước 5D.3 trong `hub_el_mobile`:

### 1. Endpoint Constants
Đã hoàn thành thêm trong `lib/core/constants/api_endpoints.dart`:
- `ApiEndpoints.friendsList`
- `ApiEndpoints.friendsSearch`
- `ApiEndpoints.friendRequests`
- `ApiEndpoints.friendSentRequests`
- `ApiEndpoints.sendFriendRequest`
- `ApiEndpoints.respondFriendRequest(id)`
- `ApiEndpoints.cancelFriendRequest(id)`
- `ApiEndpoints.removeFriend(id)`
- `ApiEndpoints.blockUser(id)`
- `ApiEndpoints.unblockUser(id)`
- `ApiEndpoints.blockedUsers`
- `ApiEndpoints.userProfile(id)`

### 2. Cấu trúc Data Models & Entities cần tạo
- `FriendUserEntity` / `FriendUserModel`: `id`, `name`, `username`, `image`, `isOnline`, `level`, `streak`, `friendshipId`.
- `FriendRequestEntity` / `FriendRequestModel`: `id`, `sender` / `receiver`, `createdAt`.
- `FriendshipStatus`: `none`, `pending`, `accepted`, `blocked`.
- `OtherUserProfileEntity`: thông tin mở rộng, trạng thái bạn bè, bio, số bạn chung, cờ ẩn hồ sơ.

### 3. Cấu trúc State Management (BLoC)
- `FriendsBloc` & `FriendsEvent` / `FriendsState`:
  - `LoadFriendsList`, `SearchFriends`, `SendFriendRequest`, `RespondFriendRequest`, `CancelFriendRequest`, `RemoveFriend`, `BlockUser`, `UnblockUser`.
  - Quản lý tab danh sách bạn bè, tab tìm kiếm, tab lời mời chờ duyệt và danh sách chặn.

---

## 7. KẾT LUẬN

Bước 5D.2 đã hoàn thành 100% mục tiêu:
1. Tạo `FriendsService` toàn diện, an toàn và đúng nghiệp vụ.
2. Cung cấp 10 REST API chuẩn hóa cho Flutter Native với Bearer JWT Authentication.
3. Bảo toàn 100% tính tương thích ngược cho Website Web/Mobile Web hiện tại.
4. Vượt qua 47/47 bài test tự động nghiêm ngặt không có bất kỳ lỗi nào.
5. Sẵn sàng 100% để bước sang **Bước 5D.3 – Triển khai Friends Flutter Native UI**.
