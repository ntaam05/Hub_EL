# BÁO CÁO TOÀN DIỆN KIỂM TOÁN TÍCH HỢP HỆ THỐNG VÀ HỒI QUY CUỐI CÙNG
## GIAI ĐOẠN 5 – BƯỚC 5D.7: FINAL REGRESSION & SYSTEM INTEGRATION AUDIT
**Dự án:** `hub-el` (Next.js Web & Backend Service) & `hub_el_mobile` (Flutter Native Android)  
**Ngày thực hiện:** 21/11/2026  
**Người thực hiện:** Antigravity Integration & QA Agent  
**Kết quả tổng quan:** ✅ **PASS TOÀN DIỆN (100% SẴN SÀNG NGHIỆM THU)**

---

## 1. TỔNG QUAN GIAI ĐOẠN 5

Giai đoạn 5 là cột mốc chuyển đổi và hoàn thiện toàn bộ hệ sinh thái **Social & Community (Cộng đồng, Bạn bè, Nhắn tin thời gian thực và Bảng xếp hạng)** từ Website `hub-el` sang ứng dụng Flutter Native `hub_el_mobile`.

Mục tiêu cốt lõi của bước **5D.7**:
- Thực hiện kiểm toán độc lập, đối chiếu mã nguồn thực tế giữa Website `hub-el` và Mobile `hub_el_mobile`.
- Đảm bảo tính nhất quán của API Contract, xác thực bảo mật đa tầng (JWT Bearer, Socket.IO Handshake, Cookie Web).
- Chạy toàn bộ hệ thống kiểm thử tự động (Unit, Integration, Security, Regression) trên cả Backend và Flutter Native.
- Kiểm thử thực tế đầu cuối (End-to-End) trên thiết bị Android Emulator để xác minh trải nghiệm người dùng, khả năng phản hồi thời gian thực và độ ổn định tổng thể.

---

## 2. DANH SÁCH MODULE ĐÃ KIỂM TRA

1. **Hệ thống Bạn bè & Hồ sơ Cộng đồng (Friends System):**
   - Service: `src/services/friends.service.ts`
   - Route Handlers: `/api/v1/friends/*`, `/api/v1/users/[id]/profile`
   - Mobile: `lib/features/social/` (Danh sách bạn bè, tìm kiếm người dùng, lời mời nhận/gửi, danh sách chặn, xem hồ sơ, hủy kết bạn, chặn/bỏ chặn).
2. **Hệ thống Nhắn tin Realtime (Chat & Socket.IO System):**
   - Service: `src/services/chat.service.ts`
   - Server Socket: `server.js` (Handshake JWT, Personal Rooms, Group Rooms, Event Relays).
   - Route Handlers: `/api/v1/chat/*`
   - Mobile: `lib/features/social/data/services/chat_socket_service.dart`, `ChatCubit`, `ChatScreen`, `ChatBubble`, `WikiGiftPickerSheet`.
3. **Hệ thống Bảng xếp hạng (Leaderboard System):**
   - Service: `src/services/leaderboard.service.ts`
   - Route Handlers: `/api/v1/leaderboard`
   - Server Action: `src/actions/leaderboard.ts` (Tương thích ngược Web).
   - Mobile: `lib/features/leaderboard/` (4 Hạng mục, 4 Khung thời gian, Bục vinh danh Top 3 Podium, Danh sách Top 4–50, Thẻ ghim thứ hạng cá nhân).
4. **Các module liên đới & nền tảng (Shared Platform):**
   - Authentication & Token Storage (`AuthInterceptor`, `TokenStorageService`, JWT verification).
   - Main Navigation Shell (5 tabs trong `MainShellScreen`, `CustomBottomNav`).
   - Wiki & Gacha Modules (Kiểm tra hồi quy giao dịch tặng thẻ Wiki và quy đổi Bụi sao).

---

## 3. PHẦN A – BACKEND INTEGRATION AUDIT

### 3.1. Shared Services (`friends.service.ts`, `chat.service.ts`, `leaderboard.service.ts`)
- **Tập trung hóa Business Logic:** Cả 3 service đóng vai trò tầng nghiệp vụ duy nhất (Single Source of Truth). Server Actions của Web và Route Handlers của Mobile đều gọi qua shared service này, xóa bỏ hoàn toàn hiện tượng lệch logic tính toán giữa Web và Mobile.
- **Tối ưu hóa Truy vấn Prisma:** Các truy vấn đã được kiểm toán:
  - Bạn bè: Sử dụng điều kiện kép `OR: [{ userId: id1, friendId: id2 }, { userId: id2, friendId: id1 }]` với quan hệ `ACCEPTED`.
  - Chat: Lọc tin nhắn kèm quan hệ `sender`, `card` và `replyToMessage`, áp dụng cursor pagination (`take: limit`, `skip: 1`, `cursor: { id }`).
  - Leaderboard: Tích hợp gom nhóm `groupBy` và aggregate `_sum` từ bảng `DailyStat` và `User`, không kéo toàn bộ bảng về bộ nhớ.
- **Transaction Safety:**
  - Giao dịch tặng và nhận hộp quà Wiki được bảo vệ bằng `prisma.$transaction(async (tx) => { ... })` đảm bảo tính nguyên tử (Atomic). Nếu chuyển quyền sở hữu thẻ thất bại, toàn bộ cập nhật tin nhắn bị rollback, ngăn chặn mất thẻ hoặc tạo quà ảo.
- **Bảo mật Dữ liệu (No Sensitive Data Leak):**
  - Mọi hàm trả dữ liệu người dùng đều áp dụng `select` hoặc lược bỏ tường minh `passwordHash`, `email` (nếu không phải chính chủ), `refreshTokenHash`.

### 3.2. REST API Contract Audit
Đã đối chiếu chi tiết giữa Endpoint backend và Flutter Remote Data Sources:

| Endpoint | Method | Params / Body | Xác thực | Trạng thái Contract |
| :--- | :---: | :--- | :---: | :---: |
| `/api/v1/friends` | `GET` | Không | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/search` | `GET` | `?query=string` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/requests` | `GET` | Không | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/requests/sent`| `GET` | Không | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/request` | `POST` | `{ targetUserId }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/request/accept`| `POST` | `{ requesterId }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/request/decline`| `POST`| `{ requesterId }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/request/cancel`| `POST` | `{ targetUserId }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/remove` | `POST` | `{ friendId }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/block` | `POST` | `{ targetUserId }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/unblock` | `POST` | `{ targetUserId }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/friends/blocked` | `GET` | Không | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/users/:id/profile` | `GET` | Route Param `:id` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/chat/conversations` | `GET` | Không | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/chat/history` | `GET` | `?partnerId=&groupId=&cursor=&limit=` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/chat/send` | `POST` | `{ content, type, recipientId, groupId, replyToId, metadata }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/chat/cards` | `GET` | Không | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/chat/claim-gift` | `POST` | `{ messageId }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/chat/groups` | `GET`, `POST`| `{ name, memberIds }` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/chat/groups/:id/members`| `GET` | Route Param `:id` | Bearer JWT | ✅ Hoàn toàn khớp |
| `/api/v1/leaderboard` | `GET` | `?category=&range=` | Bearer JWT | ✅ Hoàn toàn khớp |

### 3.3. Authentication & Authorization Audit
- **JWT Verification:** Mọi request không kèm Bearer Token hoặc token sai chữ ký đều bị từ chối với mã lỗi `401 Unauthorized`.
- **IDOR Protection:** Backend tuyệt đối không tin cậy `userId` do client gửi lên trong query/body để quyết định quyền tác vụ cá nhân. Định danh luôn được trích xuất từ JWT hợp lệ (`req.user.id`).
- **Quyền Truy cập Riêng tư & Chặn:**
  - Nếu User A chặn User B, User B gửi tin nhắn sẽ bị backend từ chối `403 Forbidden` (`USER_BLOCKED`).
  - Người dùng cài đặt quyền riêng tư `PRIVATE` hoặc `FRIENDS` sẽ được ẩn Bio/Level đối với người chưa kết bạn.
  - Người thứ 3 không thể chấp nhận hoặc từ chối lời mời kết bạn của người khác.

### 3.4. Socket.IO Security Audit
- **Handshake Authentication:** Bắt buộc có JWT Token hợp lệ trong `socket.handshake.auth.token` (cho Mobile) hoặc Cookie xác thực (cho Web). Sockets không xác thực bị ngắt kết nối ngay lập tức tại middleware.
- **Phòng Cá nhân (Personal Room Isolation):**
  - Room `user:${userId}` chỉ được cấp quyền tham gia cho chính người dùng sở hữu token tương ứng.
  - Chặn hoàn toàn việc client tự phát sự kiện `join_room` để nghe lén tin nhắn người khác.
- **Phòng Nhóm (Group Room Membership):**
  - Chỉ thành viên đang có mặt trong bảng `ChatGroupMember` mới được phép join phòng `group:${groupId}`. Khi bị admin xóa khỏi nhóm, server lập tức phát sự kiện xóa room socket của thành viên đó.

---

## 4. PHẦN B – BUSINESS LOGIC REGRESSION

### 4.1. Hệ thống Bạn bè (Friends)
- Thao tác gửi, chấp nhận, từ chối, hủy lời mời, chặn và bỏ chặn đã được đối chiếu 100% khớp với Web.
- Sau khi bỏ chặn người trước đó là bạn bè, quan hệ tự động khôi phục về trạng thái `ACCEPTED` (đúng chuẩn quy tắc của Web).
- Trạng thái 2 chiều: User A thấy User B là bạn thì User B cũng thấy User A là bạn.

### 4.2. Hệ thống Nhắn tin (Chat)
- **Tin nhắn 1-1 & Tin nhắn Nhóm:** Hỗ trợ tin nhắn văn bản, tin nhắn trả lời (`REPLY`), tin nhắn hình ảnh (`IMAGE` - Base64 và URL) và Hộp quà thẻ bài Wiki (`WIKI_CARD_GIFT`).
- **Transaction Quà tặng & Quy đổi Bụi sao:**
  - Người nhận mở quà: Thẻ tự động chuyển vào kho đồ `UserInventory` của người nhận.
  - Nếu người nhận đã sở hữu thẻ: Thẻ tự động phân rã thành Bụi sao (`stardust`) theo đúng tỷ lệ phẩm chất (N: 1, SR: 20, SSR: 100, UR: 500) kèm thưởng +20% nếu là thành viên PRO.
  - Hộp quà chỉ mở được duy nhất 1 lần (Idempotent). Mở lần thứ 2 trả lỗi `ALREADY_CLAIMED` (HTTP 400).

### 4.3. Hệ thống Bảng xếp hạng (Leaderboard)
- **Công thức tính điểm:** Bảo toàn 100% công thức tính Lifetime XP lũy tiến theo cấp độ:
  $$\text{Base XP} = \text{currentXp} + \sum_{i=1}^{\text{level}-1} (i \times 100)$$
- **Múi giờ UTC+7:** Căn chỉnh chính xác ngày bắt đầu của `DAY`, `WEEK`, `MONTH` theo giờ Việt Nam, tương thích hoàn toàn với trường `@db.Date` trong SQL Server.
- **Tie-break:** Thứ hạng được phân định ổn định: `scoreValue DESC` ➔ `level DESC` ➔ `userId ASC`.

---

## 5. PHẦN C – FLUTTER NATIVE INTEGRATION AUDIT

### 5.1. Kiến trúc Clean Architecture & BLoC/Cubit
- **Quản lý Vòng đời State (Lifecycle):**
  - `ChatCubit`: Khi người dùng thoát khỏi màn hình chat, `close()` tự động hủy lắng nghe các sự kiện socket, tránh rò rỉ bộ nhớ (Memory Leak) và tránh cập nhật UI khi Widget đã unmount.
  - `FriendsCubit`: Quản lý các tab Bạn bè, Tìm kiếm, Lời mời và Đã chặn; tự động đồng bộ khi có thao tác chấp nhận hoặc xóa bạn.
  - `LeaderboardCubit`: Xử lý mượt mà việc chuyển đổi giữa 4 Category và 4 Timeframe, có debounce và cờ `isLoading` bảo vệ race condition.
- **Tích hợp Shell Navigation (Tab 3 & Tab 4):**
  - Tab 3: Mở màn hình `FriendsScreen`.
  - Tab 4: Mở màn hình `LeaderboardScreen`.
  - Cả 5 tab trong `CustomBottomNav` và `MainShellScreen` hoạt động ổn định, không làm xáo trộn các tab Tổng quan, Luyện tập, Khóa học.

---

## 6. PHẦN D – UI/UX & ADAPTIVE AUDIT

- **Hỗ trợ Dark Theme:** Toàn bộ bảng màu tuân thủ `AppColors.darkBackground` (`#0B0F17`), `AppColors.darkCard` (`#111827`), viền `AppColors.darkBorder` (`#1F2937`).
- **An toàn Render Avatar (`safeGetImageProvider` & `buildSafeAvatarImage`):**
  - Khắc phục hoàn toàn lỗi crash khi avatar là chuỗi Data URI Base64 (`data:image/webp;base64,...`).
  - Tự động nhận diện: Base64 -> `MemoryImage`, HTTP/HTTPS -> `NetworkImage`, rỗng/lỗi -> Fallback chữ cái đầu hoặc Icon.
- **Top 3 Podium Vinh Danh:**
  - Quán quân (Hạng 1): Nằm chính giữa, bục cao nhất (140px), có vương miện vàng (`LucideIcons.crown`), viền phát sáng Amber.
  - Á quân (Hạng 2): Nằm bên trái, bục cao 100px, viền Slate/Bạc.
  - Quý quân (Hạng 3): Nằm bên phải, bục cao 85px, viền Bronze/Đồng.
- **Thanh Ghim Thứ Hạng Cá Nhân (`StickyCurrentUserRank`):** Hiển thị cố định nổi trên thanh điều hướng, cho phép người dùng thấy ngay thứ hạng `#X` và điểm số của mình dù cuộn danh sách ở bất kỳ đâu.

---

## 7. PHẦN E – KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

### 7.1. Backend Test Suites (Node.js / tsx)
1. **Friends Backend (`test_friends_backend.ts`):** **47/47 PASS (100%)**
2. **Chat Backend (`test_chat_backend.ts`):** **21/21 PASS (100%)**
3. **Chat Security Audit (`test_chat_security.ts`):** **20/20 PASS (100%)**
4. **Leaderboard Backend (`test_leaderboard_backend.ts`):** **29/29 PASS (100%)**
5. **Gacha Module Regression (`test_gacha_backend.ts`):** **67/67 PASS (100%)**
- 👉 **Tổng cộng Backend Tests: 184 PASS, 0 FAIL (100% SUCCESS)**.

### 7.2. Flutter Native Test Suites (`flutter test`)
- Đã chạy kiểm thử toàn dự án `hub_el_mobile`:
  - `test/core/network/dio_client_test.dart`
  - `test/core/network/error_handling_test.dart`
  - `test/core/storage/token_storage_service_test.dart`
  - `test/features/authentication/auth_test.dart`
  - `test/features/social/friends_test.dart`
  - `test/features/social/chat_test.dart`
  - `test/features/leaderboard/leaderboard_test.dart`
  - `test/features/gacha/gacha_test.dart`
  - `test/features/wiki/wiki_test.dart`
  - `test/widget_test.dart`
- 👉 **Kết quả:** **135/135 Tests PASS (100% SUCCESS)**.

### 7.3. Mã nguồn & Flutter Code Analysis (`flutter analyze`)
- Đã phân tích `lib/features/social/`, `lib/features/leaderboard/`, `lib/core/utils/` và toàn bộ test:
- 👉 **Kết quả:** **0 errors, 0 warnings (100% CLEAN)**.

---

## 8. PHẦN F – ANDROID EMULATOR END-TO-END TEST

Đã thực hiện kịch bản kiểm thử toàn diện trên thiết bị thực tế **Pixel 9 Pro XL API 35 (emulator-5554)**:

1. **Kiểm thử Bảng xếp hạng (Leaderboard):**
   - Chuyển tab Xếp hạng tại thanh điều hướng đáy.
   - Thử nghiệm bấm chuyển đổi cả 4 hạng mục: `STREAK` ➔ `GRINDER` ➔ `TIME` ➔ `AI_KILLER`.
   - Thử nghiệm 4 khung thời gian: `DAY`, `WEEK`, `MONTH`, `ALL`.
   - Kết quả: Dữ liệu tải nhanh chóng, Bục vinh danh Top 3 và danh sách Top 4–50 render chuẩn; thanh ghim thứ hạng cá nhân hiển thị chính xác vị trí `#10 Hoàng Nhật Tâm (2 Ngày - Chuỗi liên tục)`.
   - Ảnh chụp minh chứng: `docs/screenshots/audit/audit_leaderboard_grinder.png`
2. **Kiểm thử Bạn bè (Friends):**
   - Chuyển sang Tab Cộng đồng (Social).
   - Danh sách bạn bè hiển thị đầy đủ thẻ bạn bè kèm nút tác vụ "Nhắn tin" và menu tùy chọn.
   - Ảnh chụp minh chứng: `docs/screenshots/audit/audit_social_friends.png`
3. **Kiểm thử Nhắn tin Realtime (Chat):**
   - Bấm nút "Nhắn tin" trên thẻ bạn bè `ntaam`.
   - Màn hình chat mở tức thì kèm lịch sử tin nhắn trước đó.
   - Nhập nội dung `"Hello_from_5D7_Audit"` và bấm Gửi: Tin nhắn hiển thị ngay trong danh sách bong bóng chat.
   - Ảnh chụp minh chứng: `docs/screenshots/audit/audit_chat_sent.png`
4. **Kiểm thử Hồi quy Dashboard (Home):**
   - Bấm Back quay lại Social, bấm Tab 0 (Tổng quan).
   - Màn hình Dashboard hiển thị đầy đủ thông tin năng lượng, xu, chuỗi streak và nhiệm vụ hàng ngày mà không gặp bất kỳ lỗi nào.
   - Ảnh chụp minh chứng: `docs/screenshots/audit/audit_dashboard.png`

---

## 9. CÁC LỖI ĐÃ PHÁT HIỆN VÀ ĐÃ KHẮC PHỤC

1. **Lỗi Border không đồng nhất màu trong `PodiumWidget`:**
   - *Phát hiện:* Flutter ném exception khi `borderRadius` đi kèm với `Border(top, left, right)` có màu/độ mờ khác nhau.
   - *Khắc phục:* Chuyển sang `Border.all(color: borderColor.withValues(alpha: 0.6), width: 1.5)`.
2. **Lỗi Crash khi Avatar là Data URI Base64:**
   - *Phát hiện:* Một số avatar người dùng là chuỗi Base64 (`data:image/webp;base64,...`), `NetworkImage` ném lỗi `No host specified in URI`.
   - *Khắc phục:* Tạo tiện ích tập trung `lib/core/utils/avatar_image_helper.dart` với hai hàm `safeGetImageProvider` và `buildSafeAvatarImage`, xử lý an toàn cả MemoryImage, NetworkImage và Fallback.
3. **Lỗi Timezone SQL Server `@db.Date`:**
   - *Phát hiện:* Chênh lệch -7 giờ giữa Date cục bộ và UTC khiến các truy vấn theo `DAY`, `WEEK` trong `leaderboard.service.ts` bị lệch 1 ngày.
   - *Khắc phục:* Đồng bộ công thức chuẩn hóa múi giờ Việt Nam UTC+7: `Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate())`.
4. **Cảnh báo Linter & Unused Import:**
   - *Phát hiện:* 1 unused import trong `leaderboard_test.dart` và một số cú pháp wildcard cũ.
   - *Khắc phục:* Đã dọn dẹp sạch sẽ, `flutter analyze` báo `No issues found!`.

---

## 10. NHỮNG GIỚI HẠN KIẾN TRÚC ĐƯỢC GHI NHẬN (ARCHITECTURAL LIMITATIONS)

1. **Socket.IO Single-Instance Architecture:**
   - Hệ thống hiện tại lưu instance Socket.IO trong `global.__socketIo` phục vụ chạy đơn server. Nếu triển khai Scale-out trên nhiều container/instance trong môi trường Production quy mô lớn, cần tích hợp Redis Adapter (`@socket.io/redis-adapter`) để truyền phát tin nhắn realtime giữa các node server. Hiện tại kiến trúc đơn server đáp ứng hoàn hảo yêu cầu dự án.
2. **Web Push / FCM Background Notifications:**
   - Hệ thống thông báo tin nhắn và lời mời kết bạn hiện đang hoạt động trực tiếp qua Socket.IO và REST API. Khi ứng dụng Flutter bị đóng hoàn toàn (Killed state), việc nhận thông báo đẩy sẽ phụ thuộc vào dịch vụ Firebase Cloud Messaging (FCM) được định hướng tích hợp ở giai đoạn phát hành (Release Phase).

---

## 11. BẢNG TỔNG HỢP KẾT QUẢ NGHIỆM THU

| Hạng mục | Kết quả | Trạng thái |
| :--- | :---: | :---: |
| **Friends Backend** | 47/47 Tests PASS | ✅ PASS |
| **Friends Flutter** | UI, Cubit & Repository hoạt động mượt mà | ✅ PASS |
| **Chat Backend** | 21/21 Tests PASS | ✅ PASS |
| **Chat Security** | 20/20 Tests PASS | ✅ PASS |
| **Chat Flutter** | Socket.IO, Tin nhắn, Reply, Quà tặng hoạt động tốt | ✅ PASS |
| **Leaderboard Backend** | 29/29 Tests PASS | ✅ PASS |
| **Leaderboard Flutter** | 4 Categories, 4 Timeframes, Top 3 Podium chuẩn xác | ✅ PASS |
| **API Contract** | 100% Endpoint đồng nhất Request/Response | ✅ PASS |
| **Navigation** | 5 Tab Shell & Deep navigation ổn định | ✅ PASS |
| **UI/UX** | Dark Theme, Responsive, Safe Avatar, bám sát Mobile Web | ✅ PASS |
| **Automated Tests** | 184 Backend Tests + 135 Flutter Tests PASS | ✅ PASS |
| **Emulator E2E** | Xác minh thành công trên Pixel 9 Pro XL API 35 | ✅ PASS |

---

## 12. KẾT LUẬN

Giai đoạn 5 (**Social & Community: Friends, Chat, Socket.IO, Leaderboard**) đã hoàn thành việc tích hợp và kiểm toán toàn diện với chất lượng xuất sắc:
- Không còn bất kỳ lỗi hồi quy hay xung đột nào đối với các phân hệ hoàn thành trước đó (Authentication, Dashboard, Learning, Video Quiz, Wiki, Gacha).
- Toàn bộ 319 bài kiểm thử tự động (184 Backend + 135 Flutter) đều đạt kết quả **100% PASS**.
- Hệ sinh thái Web và Mobile đã kết nối thông suốt, an toàn và sẵn sàng cho giai đoạn phát triển tiếp theo.

