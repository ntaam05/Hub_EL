# BÁO CÁO TRIỂN KHAI BACKEND SERVICE & REALTIME BRIDGE CHO HỆ THỐNG CHAT (BƯỚC 5D.4)

## 1. TỔNG QUAN

- **Giai đoạn:** Giai đoạn 5 – Social & Community System.
- **Bước thực hiện:** Bước 5D.4: Chat Backend Service & Realtime Bridge.
- **Mục tiêu:**
  1. Xây dựng dịch vụ dùng chung `src/services/chat.service.ts` cho nghiệp vụ Chat 1-1, Chat Nhóm, gửi/nhận tin nhắn, xem lịch sử trò chuyện và tặng thẻ bài Wiki (kèm transaction bảo đảm tính toàn vẹn).
  2. Tạo đầy đủ REST API Handlers chuẩn RESTful v1 cho Flutter Native Client (`hub_el_mobile`) xác thực qua JWT Bearer Token.
  3. Củng cố bảo mật và mở rộng Socket.IO Server trong `server.js` (xác thực handshake JWT, cô lập room cá nhân, hỗ trợ typing indicator và rời phòng sạch sẽ).
  4. Duy trì tương thích 100% với Mobile Web & Desktop Web hiện tại (`hub-el`), không làm ảnh hưởng các module đã hoàn thiện (Wiki, Gacha, Friends, Auth).

---

## 2. KIẾN TRÚC & CÁC THÀNH PHẦN ĐÃ TRIỂN KHAI

### 2.1. Chat Service (`src/services/chat.service.ts`)
Tách rời logic nghiệp vụ khỏi UI và Socket Server, đảm bảo tái sử dụng hoàn toàn cho cả REST API và Socket.IO:

| Tên Service Function | Nhiệm vụ chính |
| :--- | :--- |
| `getConversationsService(userId)` | Tổng hợp danh sách đối tác 1-1 (từ danh sách bạn bè) và các nhóm chat mà user tham gia, kèm tin nhắn cuối cùng (snippet), đếm tin nhắn chưa đọc và sắp xếp theo thời gian mới nhất. |
| `getChatHistoryService(userId, targetId, isGroup, options)` | Lấy lịch sử tin nhắn tuần tự (phân trang theo limit/before), nạp thông tin sender và bảo mật kiểm tra quyền thành viên. |
| `sendMessageService(params)` | Kiểm tra quyền (chặn 1-1, thành viên nhóm), lưu trữ tin nhắn vào Database (hỗ trợ text, image base64/url, audio, reply quote, wiki card gift). |
| `getOwnedWikiCardsService(userId)` | Lấy kho thẻ bài Wiki người dùng đang sở hữu để phục vụ tính năng tặng thẻ trong chat. |
| `claimWikiGiftService(messageId, currentUserId)` | **Prisma Transaction:** Kiểm tra người nhận quà, chuyển nhượng thẻ từ người tặng sang người nhận. Nếu người nhận đã sở hữu thẻ cùng phẩm chất, tự động chuyển đổi thành Tinh Hoa Bụi Sao (Stardust) theo đúng tỷ lệ (`N:1, R:5, SR:20, SSR:100, UR:500, LR:1000, MR:5000`) và cập nhật trạng thái tin nhắn `[WIKI_GIFT_CLAIMED]`. |
| `getChatGroupsService(userId)` | Lấy danh sách nhóm chat của user. |
| `createChatGroupService(userId, name, memberIds)` | Tạo nhóm chat mới và tự động thêm creator làm `ADMIN`. |
| `getGroupMembersService(userId, groupId)` | Lấy danh sách thành viên nhóm chat kèm vai trò. |
| `addMemberToGroupService(userId, groupId, targetUserId)` | Thêm thành viên vào nhóm chat (kiểm tra quyền Admin). |
| `removeMemberFromGroupService(userId, groupId, targetMemberId)` | Xóa thành viên khỏi nhóm chat (quyền Admin hoặc chính user). |
| `renameChatGroupService(userId, groupId, newName)` | Đổi tên nhóm chat. |
| `leaveChatGroupService(userId, groupId)` | Tự rời nhóm chat (tự động chuyển quyền Admin nếu cần). |
| `deleteChatGroupService(userId, groupId)` | Giải tán nhóm chat (chỉ Admin). |

---

### 2.2. REST API Route Handlers (`src/app/api/v1/chat/*`)

Tất cả các route handlers đều yêu cầu Header: `Authorization: Bearer <JWT_ACCESS_TOKEN>`. Lấy định danh từ JWT qua `verifyAuthToken(request)`, tuyệt đối không tin cậy client-provided `userId`.

1. **`GET /api/v1/chat/conversations`**:
   - Trả về danh sách cuộc trò chuyện 1-1 và Nhóm chat kèm trạng thái online, tin nhắn gần nhất.
2. **`GET /api/v1/chat/history?targetId=<ID>&isGroup=<true|false>&limit=50&before=<TIMESTAMP>`**:
   - Lấy lịch sử tin nhắn chi tiết.
3. **`POST /api/v1/chat/send`**:
   - Gửi tin nhắn mới. Body: `{ receiverId, groupId, content, type, replyToId, wikiCardId }`.
4. **`GET /api/v1/chat/cards`**:
   - Lấy kho thẻ Wiki để chọn thẻ tặng.
5. **`POST /api/v1/chat/claim-gift`**:
   - Mở nhận hộp quà thẻ bài trong tin nhắn. Body: `{ messageId }`.
6. **`GET /api/v1/chat/groups`** & **`POST /api/v1/chat/groups`**:
   - Lấy danh sách nhóm chat / Tạo nhóm chat mới.
7. **`PATCH /api/v1/chat/groups/[id]`** & **`DELETE /api/v1/chat/groups/[id]`**:
   - Đổi tên nhóm chat / Giải tán nhóm chat.
8. **`GET /api/v1/chat/groups/[id]/members`** & **`POST /api/v1/chat/groups/[id]/members`**:
   - Xem danh sách thành viên / Thêm thành viên vào nhóm.
9. **`DELETE /api/v1/chat/groups/[id]/members/[memberId]`**:
   - Xóa thành viên khỏi nhóm.
10. **`POST /api/v1/chat/groups/[id]/leave`**:
    - Rời khỏi nhóm chat.

---

### 2.3. Socket.IO Realtime Bridge Security (`server.js`)

Máy chủ Socket.IO được nâng cấp bảo mật và tính năng:
1. **JWT Handshake Middleware:**
   - Trích xuất token từ `socket.handshake.auth.token` hoặc `socket.handshake.headers.authorization`.
   - Xác thực token bằng `jose.jwtVerify` và bí mật `JWT_SECRET`.
   - Gán `socket.authenticatedUserId` cho socket session.
   - Vẫn hỗ trợ fallback không ném lỗi cho client Web cũ chưa truyền token để đảm bảo tương thích ngược 100%.
2. **Room Security Isolation:**
   - Khi client gọi `join_room(userId)`, nếu socket đã xác thực JWT, server kiểm tra nghiêm ngặt `targetRoom === socket.authenticatedUserId` (tránh việc nghe lén room tin nhắn riêng của người dùng khác).
3. **Typing Indicator Relay:**
   - Hỗ trợ sự kiện `typing_start` -> phát `user_typing` tới đối tác trong phòng.
   - Hỗ trợ sự kiện `typing_stop` -> phát `user_stop_typing` tới đối tác trong phòng.
4. **Clean Room Departure:**
   - Hỗ trợ sự kiện `leave_room(roomId)` để rời phòng cleanly khi back màn hình.

---

## 3. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

Kịch bản kiểm thử toàn diện được thực thi qua `scripts/test_chat_backend.ts`:

```bash
cd hub-el
npx tsx scripts/test_chat_backend.ts
```

### Kết quả chi tiết (21/21 PASS - 100% SUCCESS):
1. **Tạo lập tài khoản & môi trường kiểm thử:** ✅ PASS
2. **REST API: GET `/api/v1/chat/conversations`:** ✅ PASS
3. **Conversations: Chứa đối tác bạn bè User B kèm metadata:** ✅ PASS
4. **REST API: POST `/api/v1/chat/send` gửi tin nhắn văn bản (HTTP 201):** ✅ PASS
5. **REST API: Gửi tin nhắn Reply kèm chuỗi trích dẫn thành công:** ✅ PASS
6. **REST API: GET `/api/v1/chat/history` lấy đầy đủ tin nhắn:** ✅ PASS
7. **REST API: GET `/api/v1/chat/cards` lấy kho thẻ Wiki:** ✅ PASS
8. **REST API: Gửi tặng Hộp Quà Thẻ Wiki:** ✅ PASS
9. **Security: Chặn người thứ ba mở trộm quà (HTTP 403):** ✅ PASS
10. **Transaction: Nhận quà và chuyển giao thẻ thành công trong DB:** ✅ PASS
11. **Transaction: Chặn mở trùng lặp hộp quà đã nhận (HTTP 400):** ✅ PASS
12. **REST API: POST `/api/v1/chat/groups` tạo nhóm chat mới (HTTP 201):** ✅ PASS
13. **REST API: GET `/api/v1/chat/groups` lấy danh sách nhóm:** ✅ PASS
14. **REST API: GET `/api/v1/chat/groups/:id/members` danh sách thành viên:** ✅ PASS
15. **REST API: PATCH `/api/v1/chat/groups/:id` đổi tên nhóm chat:** ✅ PASS
16. **REST API: Gửi tin nhắn vào Nhóm chat:** ✅ PASS
17. **REST API: DELETE `/api/v1/chat/groups/:id` giải tán nhóm chat:** ✅ PASS
18. **Socket.IO: Client A và Client B handshake JWT thành công:** ✅ PASS
19. **Realtime Relay: Client B nhận tin nhắn tức thì từ Client A:** ✅ PASS
20. **Typing Indicator: Client B nhận sự kiện `user_typing`:** ✅ PASS
21. **Socket.IO: Giải phóng kết nối sockets an toàn:** ✅ PASS

### Kiểm tra hồi quy hệ thống Friends (Bước 5D.2):
- `scripts/test_friends_backend.ts`: **47/47 PASS (100% SUCCESS)**, không có bất kỳ xung đột hay hồi quy nào.

### Kiểm tra Flutter Test Suite:
- `flutter test test/features/social/chat_test.dart test/features/social/friends_test.dart`: **38/38 PASS (100% SUCCESS)**.

---

## 4. KẾT LUẬN

Hệ thống Chat Backend Service và Realtime Bridge (Bước 5D.4) đã được triển khai hoàn chỉnh, đạt 100% tiêu chí kỹ thuật và bảo mật, sẵn sàng cung cấp dữ liệu ổn định cho Flutter Native App và các bước tiếp theo.

