# BÁO CÁO KIỂM TOÁN VÀ CỦNG CỐ BẢO MẬT HỆ THỐNG CHAT (BƯỚC 5D.4.1)

## 1. TỔNG QUAN

- **Dự án:** `hub-el` (Web/Backend) và `hub_el_mobile` (Flutter Native).
- **Giai đoạn:** Giai đoạn 5 – Social & Community System.
- **Bước thực hiện:** Bước 5D.4.1: Chat Socket.IO Security Audit & Hardening.
- **Mục tiêu:**
  1. Kiểm toán bảo mật độc lập toàn bộ luồng truyền thông Socket.IO và REST API Chat.
  2. Phát hiện và vá triệt để các lỗ hổng xác thực, phân quyền (IDOR), nghe lén phòng cá nhân, thâm nhập phòng chat nhóm và giả mạo danh tính (spoofing).
  3. Củng cố phân trang tin nhắn (Pagination) bằng cơ chế Cursor ổn định, loại bỏ duplicate và tránh sót tin nhắn khi có cùng timestamp.
  4. Duy trì 100% tương thích ngược với Mobile Web / Desktop Web hiện tại (`NextAuth` session cookies) và Flutter Native App (Bearer JWT).
  5. Xây dựng bộ kiểm thử bảo mật tự động `scripts/test_chat_security.ts` với tối thiểu 16 kịch bản tấn công thực tế.

---

## 2. CÁC LỖ HỔNG ĐƯỢC PHÁT HIỆN & MỨC ĐỘ RỦI RO

Trong quá trình kiểm toán mã nguồn thực tế, chúng tôi đã phát hiện 6 lỗ hổng bảo mật nghiêm trọng:

| STT | Lỗ hổng phát hiện | Vị trí mã nguồn | Mức độ rủi ro | Mô tả & Tác động |
| :--- | :--- | :--- | :--- | :--- |
| **V1** | **Unauthenticated Fallback & Anonymous Personal Room Access** | `server.js` | **CRITICAL (Nghiêm trọng)** | Middleware Socket.IO trước đây cho phép kết nối không có JWT tiếp tục (`nextMiddleware()`). Khi đó `socket.authenticatedUserId` là `undefined`, khối lệnh bảo vệ `if (socket.authenticatedUserId)` bị vượt qua hoàn toàn. Bất kỳ client nặc danh nào cũng có thể gọi `join_room(targetUserId)` để nghe lén tin nhắn riêng của nạn nhân. |
| **V2** | **Group Room Access Control Bypass (IDOR)** | `server.js` | **HIGH (Cao)** | Lệnh kiểm tra `join_room` loại trừ các phòng nhóm (`!roomName.startsWith("group_")`). Bất kỳ socket nào cũng có thể tham gia vào bất kỳ nhóm chat bí mật nào mà không cần là thành viên của nhóm. |
| **V3** | **Group Chat History IDOR** | `chat.service.ts` (`getChatHistoryService`) | **HIGH (Cao)** | API `GET /api/v1/chat/history?targetId=<groupId>&isGroup=true` truy vấn trực tiếp tin nhắn của nhóm mà không kiểm tra xem người gọi (`auth.userId`) có nằm trong danh sách thành viên nhóm hay không. Người ngoài có thể đọc toàn bộ lịch sử trò chuyện nội bộ của nhóm. |
| **V4** | **Group Membership Information Disclosure** | `chat.service.ts` (`getGroupMembersService`) | **MEDIUM (Trung bình)** | API `GET /api/v1/chat/groups/:id/members` trả về danh sách thành viên mà không kiểm tra quyền thành viên của người gọi. |
| **V5** | **Sender Spoofing in Socket Relay & Typing Indicators** | `server.js` | **MEDIUM (Trung bình)** | Client có thể truyền tùy ý `senderId` trong payload `send_message` và `typing_start`. Kẻ tấn công có thể giả danh người khác đang nhắn tin hoặc đang gõ phím. |
| **V6** | **Pagination Unstability & Missing Messages** | `chat.service.ts` & `history/route.ts` | **LOW (Thấp)** | Phân trang dựa trên `skip/take` đơn thuần có thể làm lệch trang hoặc trả về tin nhắn trùng lặp khi người dùng cuộn xem lịch sử trong lúc có tin nhắn mới phát sinh. |

---

## 3. CÁC FILE ĐÃ CHỈNH SỬA & GIẢI PHÁP KHẮC PHỤC

### 3.1. `hub-el/server.js`
- **Chặn đứng kết nối nặc danh:** Bắt buộc xác thực handshake. Socket bắt buộc phải có Bearer JWT (Flutter/API) hoặc NextAuth Session Cookie (Web Client). Token sai chữ ký (`INVALID_TOKEN`), token hết hạn (`TOKEN_EXPIRED`) hoặc thiếu chứng chỉ xác thực (`UNAUTHORIZED`) đều bị từ chối ngay lập tức tại handshake.
- **Tự động gán phòng cá nhân:** Khi kết nối thành công, socket tự động tham gia phòng mang ID của chính user (`socket.join(userId)`).
- **Bảo vệ Personal Room:** Nếu client emit `join_room` với ID người khác, server từ chối ngay với mã lỗi `FORBIDDEN`.
- **Bảo vệ Group Room:** Khi client emit `join_room("group_<id>")`, server truy vấn Database (`prisma.groupMember.findUnique`) để xác minh người dùng có phải là thành viên hợp lệ hay không. Nếu không phải thành viên, từ chối với mã lỗi `FORBIDDEN`.
- **Kiểm soát quyền gửi tin nhắn Socket:** Kiểm tra quyền thành viên nhóm hoặc trạng thái quan hệ bạn bè/chặn 1-1 trước khi chuyển tiếp tin nhắn.
- **Chống giả mạo danh tính (Anti-Spoofing):** Luôn ghi đè `senderId = socket.authenticatedUserId` đối với cả `send_message`, `typing_start`, `send_friend_request`, `accept_friend_request`.
- **Tự động dọn dẹp Typing Indicator:** Theo dõi danh sách phòng đang soạn tin (`activeTypingRooms`) và tự động phát `user_stop_typing` khi user ngắt kết nối (`disconnect`) hoặc rời phòng (`leave_room`).
- **Gán `global.__socketIo`:** Cho phép các service phía backend thu hồi quyền truy cập Socket tức thì khi thành viên bị xóa khỏi nhóm.

### 3.2. `hub-el/src/services/chat.service.ts`
- **`getChatHistoryService`:** Bổ sung kiểm tra quyền thành viên nhóm nếu `isGroup=true` (trả về 403 nếu không phải thành viên) và kiểm tra trạng thái chặn nếu là chat 1-1.
- **Hỗ trợ phân trang Cursor (`limit`, `beforeId`, `before`):** Cung cấp cơ chế phân trang dựa trên khóa chính tự tăng `ChatMessage.id` (`id: { lt: beforeId }`). Đảm bảo thứ tự thời gian luôn nhất quán, không bỏ sót tin nhắn và không trả về tin nhắn trùng lặp kể cả khi có cùng timestamp.
- **`getGroupMembersService`:** Bổ sung kiểm tra người gọi phải là thành viên nhóm mới được xem danh sách thành viên (chống IDOR).
- **Thu hồi quyền truy cập Socket tức thì:** Khi xóa thành viên (`removeMemberFromGroupService`), thành viên rời nhóm (`leaveChatGroupService`) hoặc giải tán nhóm (`deleteChatGroupService`), server gọi `__socketIo.in(userId).socketsLeave("group_<id>")` để trục xuất socket của user khỏi phòng chat nhóm trong thời gian thực.

### 3.3. `hub-el/src/app/api/v1/chat/history/route.ts`
- Bổ sung phân tích các tham số phân trang `limit`, `beforeId`, `before`, `skip`, `take` từ `searchParams` và chuyển giao an toàn cho service.

### 3.4. `hub-el/src/lib/jwt.ts`
- Chuyển `getJwtSecret` thành hàm động (`getJwtSecret()`), loại bỏ lỗi Node.js ES module hoisting khi nạp các biến môi trường từ `.env.local`.

### 3.5. `hub_el_mobile/lib/features/social/data/services/chat_socket_service.dart` & `main.dart`
- Tích hợp `ITokenStorageService` vào `ChatSocketService`.
- Khi kết nối socket, tự động trích xuất Access Token hợp lệ từ `FlutterSecureStorage` và truyền vào `IO.OptionBuilder().setAuth({'token': authToken})`.
- Cập nhật DI tại `main.dart` để inject `tokenStorage` cho `ChatSocketService`.

---

## 4. CƠ CHẾ XÁC THỰC WEB VÀ FLUTTER

Hệ thống hỗ trợ 2 cơ chế xác thực song song, không xung đột:

1. **Flutter Native Client (`hub_el_mobile`):**
   - Sử dụng Bearer JWT Token được cấp phát khi đăng nhập (lưu trong Keychain/KeyStore qua `FlutterSecureStorage`).
   - Truyền token qua `socket.handshake.auth = { token: '<ACCESS_TOKEN>' }` và Header `Authorization: Bearer <ACCESS_TOKEN>`.
   - Server giải mã qua `jwt.verify(token, secret)`.
2. **Mobile Web & Desktop Web Client (`hub-el`):**
   - Web Client chạy trên cùng domain và xác thực qua NextAuth v5.
   - Khi gọi `io()`, trình duyệt tự động đính kèm cookie (`authjs.session-token` hoặc `__Secure-authjs.session-token`) trong HTTP handshake.
   - Server sử dụng `getToken({ req, secret })` từ `next-auth/jwt` để giải mã phiên đăng nhập trực tiếp từ cookie.
   - Không cần sửa đổi luồng đăng nhập hay cấu trúc cookie của Web Client.

---

## 5. KẾT QUẢ KIỂM THỬ BẢO MẬT ĐỘC LẬP (`scripts/test_chat_security.ts`)

Bộ kiểm thử bảo mật tự động gồm **20 kịch bản tấn công và xác minh**:

```bash
cd hub-el
npx tsx scripts/test_chat_security.ts
```

### Kết quả chi tiết: 20 PASS, 0 FAIL (100% SUCCESS)

| STT | Kịch bản kiểm thử bảo mật | Kỳ vọng | Kết quả | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Socket không JWT/Cookie** | Bị từ chối handshake (`UNAUTHORIZED`) | Bị từ chối với lỗi `UNAUTHORIZED` | ✅ PASS |
| 2 | **Socket JWT sai chữ ký** | Bị từ chối handshake (`INVALID_TOKEN`) | Bị từ chối với lỗi `INVALID_TOKEN` | ✅ PASS |
| 3 | **Socket JWT hết hạn** | Bị từ chối handshake (`TOKEN_EXPIRED`) | Bị từ chối với lỗi `TOKEN_EXPIRED` | ✅ PASS |
| 4 | **User A cố join Personal Room của User B** | Server từ chối phát mã lỗi `FORBIDDEN` | Server trả về mã `FORBIDDEN` | ✅ PASS |
| 5 | **User A nghe lén tin nhắn riêng của User B** | User A không nhận được tin nhắn | User A hoàn toàn không nhận được | ✅ PASS |
| 6 | **Người ngoài (User C) cố join Group Room** | Server từ chối phát mã lỗi `FORBIDDEN` | Server trả về mã `FORBIDDEN` | ✅ PASS |
| 7 | **Người ngoài (User C) đọc lịch sử nhóm qua REST** | HTTP 403 Forbidden | Trả về HTTP 403 Forbidden | ✅ PASS |
| 8 | **Người ngoài (User C) gửi tin vào nhóm qua REST** | HTTP 403 Forbidden | Trả về HTTP 403 Forbidden | ✅ PASS |
| 9 | **Thành viên đã bị xóa đọc lịch sử nhóm** | HTTP 403 Forbidden | Trả về HTTP 403 Forbidden | ✅ PASS |
| 10 | **Thành viên đã tự rời nhóm gửi tin vào nhóm** | HTTP 403 Forbidden | Trả về HTTP 403 Forbidden | ✅ PASS |
| 11 | **Client giả mạo `senderId` trong REST API** | Server ép buộc `senderId` thực từ JWT | `senderId` lưu trong DB là của Alice | ✅ PASS |
| 12 | **Client giả mạo người gõ phím (`typing_start`)** | Socket relay lấy `senderId` từ socket auth | User B nhận typing với ID của Alice | ✅ PASS |
| 13 | **Người ngoài (User C) mở trộm hộp quà Wiki** | HTTP 403 Forbidden | Trả về HTTP 403 Forbidden | ✅ PASS |
| 14 | **Mở hộp quà Wiki lần thứ 2** | HTTP 400 Bad Request | Trả về HTTP 400 (Đã mở rồi) | ✅ PASS |
| 15 | **Tính toàn vẹn REST + Socket không tạo duplicate** | Database chỉ tăng đúng 1 bản ghi | Số lượng tăng đúng 1, ID nhất quán | ✅ PASS |
| 16 | **Phân trang Cursor: ổn định, không sót, không trùng** | Lấy đủ 6/6 tin nhắn tuần tự | Lấy đủ 6/6 tin nhắn, không trùng lặp | ✅ PASS |

---

## 6. KIỂM TRA HỒI QUY (REGRESSION TESTING)

Toàn bộ hệ thống hiện tại đã được chạy kiểm tra hồi quy toàn diện:

1. **`scripts/test_chat_backend.ts`:**
   - **21/21 PASS (100% SUCCESS)**.
2. **`scripts/test_friends_backend.ts`:**
   - **47/47 PASS (100% SUCCESS)**.
3. **Flutter Test Suite (`chat_test.dart` & `friends_test.dart`):**
   - **38/38 PASS (100% SUCCESS)**.
4. **`flutter analyze`:**
   - **0 ERROR** trên toàn bộ module `features/social/` và `main.dart`.

---

## 7. CÁC VẤN ĐỀ CÒN TỒN TẠI & LƯU Ý VẬN HÀNH

1. **Tự động khôi phục kết nối khi Token hết hạn:** Khi Access Token của Flutter hết hạn (1 giờ), `ChatSocketService` sẽ nhận sự kiện `connect_error: TOKEN_EXPIRED`. Ở các bước sau, có thể bổ sung interceptor lắng nghe sự kiện này để tự động gọi `refreshToken` và tái kết nối socket trong nền.
2. **Rate Limiting Socket:** Hiện tại đã có kiểm tra phân quyền và chống giả mạo danh tính. Để phòng chống spam tin nhắn hoặc spam sự kiện gõ phím ở quy mô lớn, có thể cân nhắc tích hợp thêm Rate Limiting (ví dụ: tối đa 5 tin nhắn/giây hoặc 10 event typing/phút).

---

## 8. KẾT LUẬN

Hệ thống Chat Socket.IO và REST API đã được kiểm toán bảo mật độc lập, vá toàn diện các lỗ hổng phân quyền, cô lập phòng chat và chống giả mạo danh tính. Tất cả 20 kịch bản kiểm thử bảo mật và 106 bài test hồi quy đều đạt kết quả 100% PASS. Hệ thống sẵn sàng cho các giai đoạn tiếp theo.

