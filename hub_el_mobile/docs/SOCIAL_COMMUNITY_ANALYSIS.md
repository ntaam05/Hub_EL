# BÁO CÁO PHÂN TÍCH TOÀN DIỆN SOCIAL & COMMUNITY (GIAI ĐOẠN 5 – BƯỚC 5D.1)

> **Dự án:** Hub-EL (Next.js 14 + Socket.IO + SQL Server + Prisma) & Hub-EL Mobile (Flutter Native)  
> **Thời gian phân tích:** 16/11/2026  
> **Mục tiêu:** Phân tích toàn diện hiện trạng hệ thống Bạn bè, Nhắn tin (1-1 & Nhóm), Bảng xếp hạng và Realtime Socket.IO để chuẩn bị chuyển đổi sang Flutter Native mà không thay đổi cấu trúc Database và nghiệp vụ Web gốc.

---

## 1. TỔNG QUAN KIẾN TRÚC SOCIAL HIỆN TẠI

Hệ thống Social & Community trên Web `hub-el` bao gồm 3 phân hệ chính:
1. **Friends System (Hệ thống Bạn bè):** Quản lý kết bạn 2 chiều, lời mời kết bạn, danh sách bạn bè, tìm kiếm người dùng, chặn/bỏ chặn và xem hồ sơ công khai kèm thiết lập quyền riêng tư.
2. **Chat System (Hệ thống Nhắn tin):** Nhắn tin trực tiếp 1-1 và Nhắn tin nhóm (Group Chat). Hỗ trợ nhiều loại tin nhắn: Tin nhắn văn bản (Text), Trả lời tin nhắn (Reply), Ảnh đính kèm (Image Base64), và tính năng đặc thù **Tặng Thẻ Tri Thức Wiki (Gift Card SSR)** với cơ chế chuyển nhượng quyền sở hữu thẻ và phân rã thành Bụi sao.
3. **Leaderboard System (Bảng Xếp Hạng):** Vinh danh người học theo 4 danh mục thi đua (Chuỗi bền bỉ, Cày cuốc XP, Thời gian học, Khắc tinh AI) trên 4 khung thời gian (Ngày, Tuần, Tháng, Toàn thời gian) với bục vinh danh Podium Top 3 và danh sách Top 50.

### Hiện trạng hạ tầng kỹ thuật:
- **Web App:** Next.js 16 (App Router) chạy trên Custom Server Node.js (`server.js`).
- **Realtime Server:** Socket.IO Server v4.8.3 được khởi tạo trực tiếp bọc chung cổng HTTP với Next.js (port 3000).
- **Database:** SQL Server qua Prisma ORM v6.19.
- **Backend Handlers:** Hiện tại Web chủ yếu sử dụng Next.js **Server Actions** (`src/actions/social/social.ts` gồm 21 hàm, `src/actions/leaderboard.ts`). Duy nhất chức năng upload ảnh chat đang sử dụng REST Route Handler tại `src/app/api/upload/message/route.ts`.
- **Flutter App hiện tại:** Đã có sẵn Network Client (`DioClient`), JWT Auth Interceptor, cấu trúc Clean Architecture, và 2 Tab Placeholder trong `MainShellScreen` (Tab 3: *Cộng đồng*, Tab 4: *Bảng xếp hạng*).

---

## 2. PHÂN TÍCH FRIENDS SYSTEM (HỆ THỐNG BẠN BÈ)

### 2.1. Nghiệp vụ chi tiết từ mã nguồn gốc (`src/actions/social/social.ts`)

| Chức năng | Phương thức / Action | Logic xử lý nghiệp vụ | Ghi chú & Ràng buộc |
| :--- | :--- | :--- | :--- |
| **Tìm kiếm người dùng** | `searchUsersAction(query, currentUserId)` | Tìm theo `name`, `username` hoặc `id` chính xác (loại trừ `currentUserId`), giới hạn `take: 10`. Truy vấn tiếp trạng thái quan hệ 2 chiều (`Friendship`) để trả về `friendshipStatus` (`NONE`, `PENDING`, `ACCEPTED`, `BLOCKED`) và cờ `isSender`. | Bỏ lọc người đã chặn: người dùng vẫn thấy nhau trong tìm kiếm nhưng không thể tương tác. |
| **Gửi lời mời kết bạn** | `addFriendAction(currentUserId, targetUserId)` | Kiểm tra không thể tự kết bạn. Kiểm tra quan hệ 2 chiều đã tồn tại: nếu `ACCEPTED` $\rightarrow$ báo lỗi; nếu `PENDING` $\rightarrow$ báo đã có lời mời. Tạo bản ghi mới với `status: "PENDING"`. Đọc `notificationSettings` của đối phương, nếu cho phép thì gửi email thông báo qua `sendEmail`. | Gửi email nền không chặn flow chính (`.catch(console.error)`). |
| **Danh sách lời mời chờ** | `getPendingRequestsAction(userId)` | Tìm trong bảng `friendships` với điều kiện `userId2 == userId` và `status == "PENDING"`. Include thông tin người gửi `user1` (`id`, `name`, `image`, `avatar`). | Trả về danh sách lời mời nhận được (chưa có tab xem lời mời đã gửi). |
| **Phản hồi lời mời** | `respondFriendRequestAction(friendshipId, accept)` | - Nếu `accept == true`: cập nhật `status = "ACCEPTED"`.<br>- Nếu `accept == false`: xóa hẳn bản ghi khỏi bảng `friendships`. | Khi chấp nhận, trả về `senderId` để client có thể phát realtime event qua Socket. |
| **Danh sách bạn bè** | `getFriendsListAction(userId)` | Lấy tất cả quan hệ mà `userId1 == userId` hoặc `userId2 == userId`, có `status in ["ACCEPTED", "BLOCKED"]`. Xác định `targetUser` (người kia), kiểm tra `isBlockedByMe` (`status == "BLOCKED" && userId1 == userId`), `isBlockedByThem`. Trả về trạng thái `isOnline` dựa vào `targetUser.isActive`. | Cần cải tiến: `isActive` trong DB hiện tại là cờ tài khoản hoạt động, chưa phải trạng thái Online realtime từ Socket. |
| **Hủy kết bạn** | `removeFriendAction(currentUserId, friendId)` | Xóa triệt để bản ghi trong bảng `friendships` theo cả 2 chiều (`userId1-userId2` hoặc `userId2-userId1`). | Xóa sạch quan hệ, cho phép gửi lại lời mời sau này. |
| **Chặn người dùng** | `blockUserAction(currentUserId, targetUserId)` | Nếu đã có bản ghi trong `friendships`: cập nhật `status = "BLOCKED"`, hoán đổi để `userId1 = currentUserId` (người bấm chặn), `userId2 = targetUserId`. Nếu chưa có: tạo mới bản ghi `status: "BLOCKED"`. | Đảm bảo `userId1` luôn đại diện cho người chủ động chặn. |
| **Bỏ chặn người dùng** | `unblockUserAction(currentUserId, targetUserId)` | Cập nhật lại các bản ghi có `userId1 == currentUserId && userId2 == targetUserId && status == "BLOCKED"` trở về `status: "ACCEPTED"`. | Giữ lại tình trạng bạn bè sau khi bỏ chặn. |
| **Xem hồ sơ người khác** | `getOtherUserProfile(targetUserId, currentUserId)` | Lấy thông tin chi tiết user (`bio`, `interests`, `socialLinks`, `achievements`, danh sách bạn bè). Kiểm tra cấu hình `privacySettings` (`showOnline`, `publicProfile`, `profileScope`). Nếu đối phương đang chặn nhau (`isBlocked == true`), ẩn toàn bộ thông tin profile. | Trả về cờ `isProfileHidden` để UI hiển thị trạng thái riêng tư. |

### 2.2. Database Schema liên quan đến Bạn bè

```prisma
model Friendship {
  id          Int      @id @default(autoincrement())
  userId1     String                                    // Người gửi lời mời (hoặc người chủ động chặn)
  userId2     String                                    // Người nhận lời mời (hoặc người bị chặn)
  status      String   @default("PENDING")              // PENDING | ACCEPTED | BLOCKED
  createdAt   DateTime @default(now())
  
  user1       User     @relation("User1", fields: [userId1], references: [id], onDelete: NoAction, onUpdate: NoAction)
  user2       User     @relation("User2", fields: [userId2], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  @@unique([userId1, userId2])
  @@map("friendships")
}
```

---

## 3. PHÂN TÍCH CHAT SYSTEM (HỆ THỐNG NHẮN TIN)

### 3.1. Nghiệp vụ chi tiết từ mã nguồn gốc

#### A. Chat cá nhân 1-1 và Chat Nhóm
- **Lấy lịch sử tin nhắn (`getChatHistoryAction`):**
  - Chat 1-1: Lấy tin nhắn giữa 2 người dùng (`senderId/receiverId` đối xứng cả 2 chiều), sắp xếp `createdAt: 'asc'`.
  - Chat nhóm: Lấy tin nhắn theo `groupId`, include thông tin người gửi `sender` (`id`, `name`, `avatar`, `image`).
- **Gửi tin nhắn (`sendMessageAction`):**
  - Tạo bản ghi trong `ChatMessage` với các trường: `senderId`, `receiverId` (null nếu là nhóm), `groupId` (null nếu là 1-1), `content`, `messageType` (`TEXT`, `IMAGE`, `WIKI_CARD`, `SHARE_VIDEO`), `fileUrl`, `isGiftCard`.
- **Cấu trúc Reply tin nhắn:**
  - Được format bằng chuỗi đánh dấu đặc biệt trong trường `content`:
    `[REPLY:senderId]Nội dung tin nhắn gốc[/REPLY]Nội dung tin nhắn trả lời mới`.
  - Web phân tích chuỗi regex này ở tầng UI để hiển thị bong bóng trích dẫn phía trên tin nhắn.
- **Hệ thống Chat Nhóm (Group Chat):**
  - Quản lý qua model `ChatGroup` và `GroupMember`.
  - `createChatGroupAction`: Tạo nhóm chat với người tạo là `leaderId` và danh sách thành viên ban đầu.
  - `renameChatGroupAction`: Đổi tên nhóm chat.
  - `updateGroupAvatarAction`: Cập nhật ảnh đại diện nhóm.
  - `getGroupMembersAction`: Lấy danh sách thành viên trong nhóm kèm thông tin vai trò.
  - `addMemberToGroupAction`: Chỉ `leaderId` mới có quyền thêm thành viên mới.
  - `removeGroupMemberAction`: Trưởng nhóm có quyền xóa thành viên (đồng thời phát tin nhắn hệ thống realtime `[SYS:KICK:userId]`).
  - `transferLeadershipAction`: Trưởng nhóm chuyển giao quyền quản trị cho thành viên khác.
  - `leaveChatGroupAction`: Thành viên tự rời nhóm (bắt buộc Trưởng nhóm phải chuyển quyền trước khi rời).
  - `deleteChatGroupAction`: Trưởng nhóm giải tán toàn bộ nhóm.
- **Upload File / Ảnh Chat (`src/app/api/upload/message/route.ts`):**
  - Nhận payload JSON `{ senderId, receiverId, groupId, fileUrl }` với `fileUrl` là chuỗi Base64 DataURL.
  - Giới hạn kích thước tối đa 5MB (chặn chuỗi độ dài > 7,000,000 ký tự).
  - Lưu trực tiếp chuỗi Base64 vào cột `fileUrl` (`@db.NVarChar(Max)`).

#### B. Nghiệp vụ độc thù: Tặng Hộp Quà Thẻ Tri Thức Wiki
- **Gửi tặng thẻ (`handleSendWikiCard`):**
  - Người dùng chọn 1 thẻ từ kho thẻ sở hữu của mình (`getOwnedWikiCardsAction`).
  - Hệ thống đóng gói thông tin thẻ dạng JSON `{ id, title, rarity, imageUrl, claimed: false }` lưu vào `fileUrl`, đánh dấu `isGiftCard: true`, `messageType: "WIKI_CARD"`.
- **Mở hộp quà và chuyển nhượng quyền sở hữu (`claimWikiGiftAction`):**
  - Thực thi trong một **Prisma Database Transaction** (`tx`):
    1. Kiểm tra hộp quà tồn tại và đúng `receiverId` của người đang mở.
    2. Kiểm tra `claimed == false` (chưa từng được mở).
    3. Xác minh người gửi còn sở hữu thẻ đó trong `userInventory` hay không. Nếu người gửi đã phân rã hoặc mất thẻ $\rightarrow$ đánh dấu hỏng hộp quà.
    4. Xóa thẻ khỏi kho đồ (`userInventory`) của người gửi.
    5. Kiểm tra kho đồ người nhận:
       - Nếu **chưa có**: Thêm thẻ vào `userInventory` với nguồn gốc `source: "SHARED"`.
       - Nếu **đã có thẻ này rồi**: Tự động phân rã thành **Bụi Sao (Stardust)** theo bảng quy đổi:  
         `N: 1 | R: 5 | SR: 20 | SSR: 100 | UR: 500 | LR: 1000 | MR: 5000`.  
         Cộng trực tiếp vào tài khoản người nhận (`user.stardust`).
    6. Cập nhật `claimed: true` và sửa nội dung tin nhắn thành *"Bạn đã nhận một thẻ Wiki!"*.

### 3.2. Database Schema liên quan đến Chat & Nhóm

```prisma
model ChatMessage {
  id              Int        @id @default(autoincrement())
  senderId        String
  receiverId      String?
  groupId         Int?
  content         String     @db.NVarChar(Max)
  isGiftCard      Boolean    @default(false)
  createdAt       DateTime   @default(now())
  messageType     String     @default("TEXT") // TEXT | IMAGE | WIKI_CARD | SHARE_VIDEO
  fileUrl         String?    @db.NVarChar(Max)
  
  sender          User       @relation("SentMessages", fields: [senderId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  receiver        User?      @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  group           ChatGroup? @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  @@map("chat_messages")
}

model ChatGroup {
  id           Int           @id @default(autoincrement())
  name         String        @db.NVarChar(255)
  avatar       String?       @db.NVarChar(Max)
  leaderId     String?
  isVideoGroup Boolean       @default(false)
  videoId      Int?
  
  video        Video?        @relation(fields: [videoId], references: [id], onDelete: Cascade)
  members      GroupMember[]
  messages     ChatMessage[]
  
  @@map("chat_groups")
}

model GroupMember {
  id       Int       @id @default(autoincrement())
  groupId  Int
  userId   String
  joinedAt DateTime  @default(now())
  
  group    ChatGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user     User      @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  @@unique([groupId, userId])
  @@map("group_members")
}
```

---

## 4. PHÂN TÍCH REALTIME VÀ SOCKET.IO

### 4.1. Cấu hình Socket.IO Server (`server.js`)

Socket.IO Server được tích hợp trực tiếp vào Custom HTTP Server của Node.js:
- Port: `3000` (dùng chung với ứng dụng Next.js).
- Đường dẫn mặc định: `/socket.io/`.
- Flutter Native kết nối trực tiếp đến: `http://<backend-host>:3000` (hoặc `http://10.0.2.2:3000` trên Android Emulator).

### 4.2. Bảng kê Socket Events hiện có

| Tên Event | Chiều truyền | Payload | Mục đích nghiệp vụ | Hiện trạng xác thực |
| :--- | :---: | :--- | :--- | :--- |
| `connection` | Client $\leftrightarrow$ Server | Socket instance | Kết nối socket mở | Chưa kiểm tra JWT |
| `join_room` | Client $\rightarrow$ Server | `userId: string` hoặc `group_${groupId}` | Tham gia kênh nhận tin cá nhân hoặc kênh nhóm | Cho phép tự do join ID bất kỳ (RỦI RO BẢO MẬT) |
| `send_message` | Client $\rightarrow$ Server | `{ receiverId: string, message: object }` | Client gửi tin nhắn vừa tạo thành công lên socket | Nhận payload và emit ngay |
| `receive_message` | Server $\rightarrow$ Client | `newMessage: object` | Chuyển tiếp tin nhắn đến phòng người nhận | Chuyển tiếp nguyên văn |
| `send_friend_request` | Client $\rightarrow$ Server | `{ receiverId: string, senderName: string, ... }` | Báo có lời mời kết bạn mới | Gửi đến room người nhận |
| `receive_friend_request` | Server $\rightarrow$ Client | `{ senderId, senderName, ... }` | Client người nhận kích hoạt reload danh sách lời mời | Tải lại danh sách |
| `accept_friend_request` | Client $\rightarrow$ Server | `{ receiverId: string, senderName: string }` | Báo đối phương đã chấp nhận kết bạn | Gửi đến room người gửi |
| `friend_request_accepted` | Server $\rightarrow$ Client | `{ senderName: string }` | Hiển thị Toast thông báo *"X đã chấp nhận kết bạn"* | Client hiển thị Toast |
| `disconnect` | Client $\leftrightarrow$ Server | None | Ngắt kết nối socket | Chỉ log ra console |

### 4.3. Đánh giá kỹ thuật & Các hạn chế của Realtime hiện tại
1. **Thiếu JWT Handshake Authentication:** Socket Server hiện tại không kiểm tra Token trong `handshake.auth` hoặc `handshake.headers`. Bất kỳ client nào biết `userId` đều có thể gọi `join_room(userId)` để nghe trộm tin nhắn của người khác.
2. **Thiếu Room Leave Cleanup:** Khi chuyển giữa các cuộc trò chuyện hoặc bị kích khỏi nhóm chat, client chưa có event `leave_room`.
3. **Chưa có Typing Indicator & Trạng thái Đang Nhập:** Web chưa triển khai event `typing_start` và `typing_stop`.
4. **Tránh trùng lặp tin nhắn (Deduplication):** Khi gửi tin nhắn qua REST API / Action, client Web tự thêm tin nhắn đó vào state local (`setMessages(prev => [...prev, res.data])`), đồng thời socket emit `receive_message`. Web xử lý deduplication bằng kiểm tra `if (prev.find(m => m.id === newMessage.id)) return prev;`. Cơ chế này hoạt động tốt và cần được áp dụng chính xác cho BLoC trên Flutter.

---

## 5. PHÂN TÍCH BẢNG XẾP HẠNG (LEADERBOARD)

### 5.1. Nghiệp vụ & Danh mục Xếp Hạng (`src/actions/leaderboard.ts`)

Bảng xếp hạng hỗ trợ 4 Danh mục thi đua và 4 Khung thời gian:

#### A. 4 Danh mục thi đua (Categories)
1. **`STREAK` (Bền Bỉ – Top Chuỗi Lửa):**
   - Tiêu chí: `currentStreak` giảm dần từ bảng `users`.
   - Điều kiện: `role == "student"`, `isActive == true`, `currentStreak > 0`.
   - Khung thời gian: **Bắt buộc cố định là `ALL`** (không chia theo ngày/tuần/tháng).
2. **`GRINDER` (Cày Cuốc – Top XP):**
   - Toàn thời gian (`ALL`): Xếp hạng theo **Lifetime XP** tính toán từ `level` và `xp` hiện tại.
   - Theo ngày / tuần / tháng: Xếp hạng theo tổng `xpGained` từ bảng `daily_stats`.
3. **`TIME` (Thời Gian – Top Giờ Học):**
   - Toàn thời gian (`ALL`): Xếp hạng theo `totalStudySeconds` từ bảng `user_stats`.
   - Theo ngày / tuần / tháng: Xếp hạng theo tổng `studySeconds` từ bảng `daily_stats`.
   - Hiển thị: Định dạng trực quan `${h}h ${m}m`.
4. **`AI_KILLER` (Khắc Tinh AI – Top Câu Đúng):**
   - Toàn thời gian (`ALL`): Xếp hạng theo `correctQuizAnswers` từ bảng `user_stats`.
   - Theo ngày / tuần / tháng: Xếp hạng theo tổng `correctAnswers` từ bảng `daily_stats`.

#### B. 4 Khung thời gian (Timeframes)
- `DAY`: Lọc dữ liệu `date >= 00:00:00` của ngày hôm nay.
- `WEEK`: Lọc dữ liệu từ ngày đầu tuần (Thứ Hai) đến hiện tại.
- `MONTH`: Lọc dữ liệu từ ngày 1 của tháng hiện tại.
- `ALL`: Lấy số liệu lũy kế toàn thời gian từ bảng `users` và `user_stats`.

#### C. Công thức tính toán chính thức
- **Công thức tính Lifetime XP:**
  ```typescript
  function calculateLifetimeXP(level: number, currentXp: number): number {
    let totalXP = 0;
    for (let i = 1; i < level; i++) {
      totalXP += Math.floor(500 + Math.pow(i, 2) * 20);
    }
    return totalXP + currentXp;
  }
  ```
- **Quy tắc xếp hạng & Xử lý Mock Data:**
  - Web hiện tại kết hợp dữ liệu Database thực với danh sách **8 Bot người dùng giả định (`MOCK_USERS`)** được tính điểm ngẫu nhiên có hạt giống cố định (`generateMockData`).
  - Hàm `processAndCombine(realData, mockData)` tiến hành gộp cả hai mảng, sắp xếp giảm dần theo `scoreValue`, lấy tối đa 50 người (`slice(0, 50)`) và gán lại `rank` từ 1 đến N.
  - Vị trí người dùng hiện tại (`currentUserRank`): Tìm trong danh sách sau khi đã gộp và đánh rank.

### 5.2. Database Schema liên quan đến Bảng Xếp Hạng

```prisma
model DailyStat {
  id                 Int      @id @default(autoincrement())
  userId             String
  date               DateTime @db.Date // Chỉ lưu Ngày (yyyy-MM-dd) phục vụ group by
  xpGained           Int      @default(0)
  studySeconds       Int      @default(0)
  correctAnswers     Int      @default(0)
  quizAttempts       Int      @default(0)

  user               User     @relation("UserDailyStats", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([date])
  @@map("daily_stats")
}

model UserStats {
  id                 Int      @id @default(autoincrement())
  userId             String   @unique
  totalStudySeconds  Int      @default(0)
  correctQuizAnswers Int      @default(0)
  totalQuizAttempts  Int      @default(0)
  // ...
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("user_stats")
}
```

---

## 6. PHÂN TÍCH GIAO DIỆN MOBILE WEB (UI/UX REFERENCE)

### 6.1. Giao diện Cộng đồng & Chat (`src/app/(main)/social/page.tsx`)
- **Bố cục chính:**
  - **Cột Danh sách Bạn bè & Nhóm (Left Sidebar):**
    - Header: Ô tìm kiếm nhanh bạn bè, nút mở modal thêm bạn (+ Thêm bạn), nút tạo nhóm (+ Tạo nhóm), nút mở danh sách lời mời kết bạn có badge số lượng.
    - Danh sách Chat: Avatar tròn (có cờ online chấm xanh, badge PRO nếu có), Tên hiển thị, Tin nhắn gần nhất, cờ phân biệt nhóm chat (icon Users) hoặc chat 1-1.
  - **Khung Chat Trực Tiếp (Center Area):**
    - Chat Header: Avatar bạn chat / nhóm, Tên, Trạng thái (Đang hoạt động / Ngoại tuyến / Số lượng thành viên), nút mở thanh Cài đặt hội thoại.
    - Danh sách tin nhắn: Bong bóng người gửi (Màu xanh dương/tím gradient góc bo cong lệch), người nhận (Màu xám đen slate-800 viền mờ).
    - Hộp quà Thẻ Wiki: Thẻ SSR màu vàng viền sáng lấp lánh có hình minh họa thẻ bài, độ hiếm, nút "Mở quà ngay" hoặc "Đã mở quà".
    - Khung nhập tin nhắn (Input Bar): Nút đính kèm ảnh (icon Image), nút đính kèm Thẻ Wiki (icon Sparkles), ô nhập văn bản bo tròn 24px, nút Gửi (icon Send màu xanh gradient).
  - **Cột Cài đặt Cuộc trò chuyện (Right Drawer / Bottom Sheet trên Mobile):**
    - Xem chi tiết hồ sơ đối phương.
    - Tắt / Bật thông báo (Mute notifications).
    - Xem danh sách File phương tiện (ảnh) và Link liên kết đã chia sẻ trong đoạn chat.
    - Quản lý nhóm (Đổi tên nhóm, Đổi ảnh nhóm, Danh sách thành viên, Trao quyền trưởng nhóm, Kích thành viên, Rời nhóm, Giải tán nhóm).
    - Chặn người dùng / Xóa kết bạn.

### 6.2. Giao diện Bảng Xếp Hạng (`src/app/(main)/leaderboard/page.tsx`)
- **Thanh Danh mục (Category Tabs):** 4 pill buttons ngang: `Bền Bỉ 🔥`, `Cày Cuốc ⚔️`, `Thời Gian ⏱️`, `Khắc Tinh AI 🎯`.
- **Thanh Khung thời gian (Timeframe Filter):** Segmented control 4 nút: `Hôm nay`, `Tuần này`, `Tháng này`, `Mọi lúc`.
- **Bục Vinh Danh Top 3 (Podium Component):**
  - **Hạng 1 (Chính giữa):** Cột cao nhất (tỷ lệ 55% + dynamic factor), viền vàng kim hoàng gia `border-yellow-400`, vương miện chuyển động nhấp nhô phía trên avatar, badge vàng số 1.
  - **Hạng 2 (Bên trái):** Cột nhì (tỷ lệ 35%), viền bạc `border-slate-300`, badge bạc số 2.
  - **Hạng 3 (Bên phải):** Cột ba (tỷ lệ 20%), viền đồng `border-orange-400`, badge đồng số 3.
- **Danh sách Hạng 4 đến 50:**
  - Card bo góc 16px, nền `slate-900/60` viền `slate-800`.
  - Hiển thị thứ hạng `#4`, `#5`,...
  - Avatar, Tên, huy hiệu `PRO`, nhãn phụ (`Cấp X`, `Thu thập được`), điểm số nổi bật bên phải.
  - Hàng của chính người dùng (`isMe`): Highlight viền xanh dương rực rỡ kèm hiệu ứng bóng đổ glow `shadow-blue-500/20`.
- **Thanh Vị trí của bạn (Floating Sticky Bar):**
  - Cố định ở đáy màn hình nếu người dùng không nằm trong Top 3.
  - Hiển thị nhanh thứ hạng của mình và điểm số để kích thích động lực học tập.

---

## 7. ĐỐI CHIẾU VỚI KIẾN TRÚC FLUTTER NATIVE (`hub_el_mobile`)

### 7.1. Các thành phần tái sử dụng sẵn có
- **`DioClient` & `AuthInterceptor`:** Tự động đính kèm `Authorization: Bearer <accessToken>`, xử lý tự động Refresh Token và điều hướng phiên khi hết hạn.
- **`TokenStorageService`:** Lấy nhanh access token để sử dụng cho Socket Handshake Authorization.
- **`MobileHeaderBar` & `CustomBottomNav`:** Điều hướng trực tiếp sang Tab 3 (Social) và Tab 4 (Leaderboard).
- **`AppColors` & Design System:** Tái sử dụng bảng màu `primaryGradient`, `darkCard`, màu phẩm chất thẻ Wiki, và kiểu dáng avatar chuẩn.

### 7.2. Đề xuất cấu trúc thư mục Feature-First Clean Architecture

Được tổ chức trong thư mục mới: `lib/features/social/` với 3 sub-modules độc lập:

```text
lib/features/social/
├── friends/
│   ├── data/
│   │   ├── datasources/friends_remote_data_source.dart
│   │   ├── models/friend_model.dart, friend_request_model.dart, user_profile_model.dart
│   │   └── repositories/friends_repository_impl.dart
│   ├── domain/
│   │   ├── entities/friend_entity.dart, friend_request_entity.dart, user_profile_entity.dart
│   │   ├── repositories/friends_repository.dart
│   │   └── usecases/get_friends_usecase.dart, add_friend_usecase.dart, respond_request_usecase.dart,...
│   └── presentation/
│       ├── bloc/friends_bloc.dart, friends_event.dart, friends_state.dart
│       ├── screens/friends_screen.dart, user_profile_screen.dart
│       └── widgets/friend_tile.dart, friend_request_tile.dart, user_search_sheet.dart
│
├── chat/
│   ├── data/
│   │   ├── datasources/chat_remote_data_source.dart, socket_chat_service.dart
│   │   ├── models/chat_message_model.dart, chat_group_model.dart, conversation_model.dart
│   │   └── repositories/chat_repository_impl.dart
│   ├── domain/
│   │   ├── entities/chat_message_entity.dart, chat_group_entity.dart, conversation_entity.dart
│   │   ├── repositories/chat_repository.dart
│   │   └── usecases/get_chat_history_usecase.dart, send_message_usecase.dart, claim_wiki_gift_usecase.dart,...
│   └── presentation/
│       ├── bloc/chat_bloc.dart, chat_event.dart, chat_state.dart
│       ├── screens/chat_list_screen.dart, conversation_screen.dart
│       └── widgets/chat_bubble.dart, gift_card_bubble.dart, chat_input_bar.dart, chat_settings_sheet.dart
│
└── leaderboard/
    ├── data/
    │   ├── datasources/leaderboard_remote_data_source.dart
    │   ├── models/leaderboard_item_model.dart
    │   └── repositories/leaderboard_repository_impl.dart
    ├── domain/
    │   ├── entities/leaderboard_item_entity.dart
    │   ├── repositories/leaderboard_repository.dart
    │   └── usecases/get_leaderboard_usecase.dart
    └── presentation/
        ├── bloc/leaderboard_bloc.dart, leaderboard_event.dart, leaderboard_state.dart
        ├── screens/leaderboard_screen.dart
        └── widgets/podium_widget.dart, leaderboard_tile.dart, user_rank_bar.dart
```

---

## 8. ĐÁNH GIÁ BẢO MẬT & HIỆU NĂNG (SECURITY & PERFORMANCE)

### 8.1. Bảo mật Friends & Social
1. **Chống mạo danh người gửi lời mời:** REST API phải lấy `currentUserId` từ JWT Token đã xác thực, tuyệt đối không nhận `currentUserId` từ Request Body / Query.
2. **Ủy quyền phản hồi lời mời:** Khi gọi `respondFriendRequestAction`, phải xác minh `friendship.userId2 == token.userId` (chỉ người nhận mới có quyền chấp nhận hoặc từ chối).
3. **Ủy quyền hủy kết bạn và chặn:** Chỉ các bên tham gia trong mối quan hệ mới có quyền thao tác với quan hệ đó.

### 8.2. Bảo mật Chat & Realtime
1. **Kiểm tra quyền truy cập hội thoại:**
   - Đối với chat 1-1: Chỉ cho phép người dùng đọc tin nhắn nếu `senderId == currentUserId || receiverId == currentUserId`.
   - Đối với chat nhóm: Người dùng bắt buộc phải là bản ghi hợp lệ trong `group_members` của `groupId` đó.
2. **Xác thực kết nối Socket.IO (Socket Auth Handshake):**
   - Socket server cần middleware xác thực JWT Bearer Token gửi kèm trong `auth.token` lúc kết nối.
   - Gắn `socket.userId = decoded.userId`. Chỉ cho phép socket tham gia phòng `socket.join(socket.userId)` và các nhóm mà user đó thực sự là thành viên.
3. **Bảo mật chuyển nhượng Thẻ Wiki Gift Card:**
   - Giữ nguyên cơ chế **Prisma Transaction** để tránh hiện tượng Race Condition (nhấn nhận thẻ 2 lần hoặc người gửi chuyển thẻ đi nơi khác trước khi người nhận mở).

### 8.3. Hiệu năng & Rò rỉ tài nguyên
1. **Phân trang tin nhắn Chat:** Hiện tại Web dùng `findMany` toàn bộ tin nhắn. Cần bổ sung phân trang (`cursor` hoặc `skip/take` 30 tin nhắn gần nhất) để tránh làm nghẽn RAM khi đoạn chat có hàng nghìn tin nhắn.
2. **Quản lý Vòng đời Socket Client trong Flutter:**
   - Khởi tạo Socket Client Singleton hoặc Scoped Service, tự động ngắt kết nối khi người dùng Đăng xuất.
   - Tránh đăng ký nhiều listener trùng lặp khi người dùng chuyển tab qua lại.
   - Xử lý cơ chế Reconnect tự động với Exponential Backoff khi thiết bị di động mất sóng 4G/Wifi.

---

## 9. ĐÁNH GIÁ KHOẢNG CÁCH (GAP ANALYSIS)

| Chức năng | Web hiện tại | Backend hiện tại | Flutter hiện tại | Khoảng cách & Công việc cần triển khai |
| :--- | :---: | :---: | :---: | :--- |
| **Tìm kiếm bạn bè** | Hoàn thiện | Server Action | Chưa có | Tạo `FriendsService` + REST API `GET /api/v1/social/search` + Flutter UI Search Sheet. |
| **Gửi/Nhận lời mời kết bạn** | Hoàn thiện | Server Action | Chưa có | Tạo REST API `GET /api/v1/social/requests`, `POST /api/v1/social/friends/request`, `POST /api/v1/social/friends/respond`. |
| **Danh sách bạn bè & Hồ sơ** | Hoàn thiện | Server Action | Chưa có | Tạo REST API `GET /api/v1/social/friends`, `GET /api/v1/social/profile/[id]` + BLoC + Màn hình Native. |
| **Lịch sử tin nhắn 1-1 & Nhóm** | Hoàn thiện | Server Action | Chưa có | Tạo `ChatService` + REST API `GET /api/v1/social/chat/messages` (hỗ trợ phân trang). |
| **Gửi tin nhắn Text & Reply** | Hoàn thiện | Server Action | Chưa có | Tạo REST API `POST /api/v1/social/chat/send` + Xử lý định dạng `[REPLY:...]` trong Flutter. |
| **Upload & Gửi ảnh chat** | Hoàn thiện | Route Handler | Chưa có | Tái sử dụng `/api/upload/message` (hoặc chuẩn hóa vào v1) + Flutter Image Picker & hiển thị ảnh. |
| **Tặng & Mở Hộp Quà Thẻ Wiki** | Hoàn thiện | Server Action | Chưa có | Tạo REST API `POST /api/v1/social/chat/gift/claim` + Native Widget Hộp quà phát sáng SSR. |
| **Chat Nhóm & Quản trị Nhóm** | Hoàn thiện | Server Action | Chưa có | Tạo các REST API quản lý nhóm (`/api/v1/social/groups/...`) + Modals quản trị thành viên. |
| **Realtime Socket.IO** | Hoàn thiện | `server.js` | Chưa có | Bổ sung JWT Handshake Auth vào `server.js` + Tích hợp `socket_io_client` vào Flutter. |
| **Bảng Xếp Hạng (Leaderboard)** | Hoàn thiện | Server Action | Chưa có | Tạo `LeaderboardService` + REST API `GET /api/v1/leaderboard` + Native Podium Top 3 Widget. |

---

## 10. LỘ TRÌNH TRIỂN KHAI ĐỀ XUẤT (GIAI ĐOẠN 5)

Để đảm bảo tính độc lập, dễ kiểm thử và không làm gián đoạn hệ thống đang chạy, lộ trình triển khai chi tiết gồm các bước:

### 🔹 Bước 5D.2: Friends Backend Service & REST API Bridge
- Xây dựng `src/services/friends.service.ts` tách biệt nghiệp vụ khỏi Server Actions.
- Xây dựng các REST Route Handlers chuẩn JWT Bearer:
  - `GET /api/v1/social/friends`
  - `GET /api/v1/social/requests`
  - `GET /api/v1/social/search`
  - `POST /api/v1/social/friends/request`
  - `POST /api/v1/social/friends/respond`
  - `DELETE /api/v1/social/friends/[id]`
  - `POST /api/v1/social/friends/block`
  - `GET /api/v1/social/profile/[id]`
- Kiểm thử toàn diện Backend Friends bằng Postman / curl / test script.

### 🔹 Bước 5D.3: Flutter Friends Native UI & Logic
- Tạo Clean Architecture module `lib/features/social/friends/`.
- Triển khai Remote Data Source, Repository, UseCases, `FriendsBloc`.
- Xây dựng giao diện: Danh sách bạn bè, Tab lời mời chờ, Thanh tìm kiếm người dùng và Màn hình xem Hồ sơ người dùng khác.
- Kiểm thử tương tác trực tiếp trên Android Emulator.

### 🔹 Bước 5D.4: Chat Backend Service, REST API & Socket.IO Security
- Xây dựng `src/services/chat.service.ts`.
- Xây dựng các REST Route Handlers:
  - `GET /api/v1/social/chat/conversations`
  - `GET /api/v1/social/chat/messages`
  - `POST /api/v1/social/chat/send`
  - `POST /api/v1/social/chat/gift/claim`
  - Nhóm API quản lý Chat Group (`create`, `rename`, `members`, `leave`, `delete`).
- Tăng cường bảo mật cho `server.js`: Bổ sung Middleware kiểm tra JWT trên Socket handshake connection.
- Kiểm thử bảo mật Socket và các flow chuyển nhượng Thẻ Wiki.

### 🔹 Bước 5D.5: Flutter Chat Native & Realtime Integration
- Cài đặt và cấu hình thư viện `socket_io_client` trong `hub_el_mobile`.
- Xây dựng `SocketChatService` quản lý kết nối, tự động reconnect và lắng nghe sự kiện.
- Tạo Clean Architecture module `lib/features/social/chat/`.
- Xây dựng giao diện:
  - Danh sách cuộc trò chuyện gần nhất (Chat List).
  - Cửa sổ nhắn tin trực tiếp (Conversation Screen) với Bong bóng chat, Trích dẫn trả lời, Hộp quà SSR, Thanh gửi tin nhắn và Đính kèm ảnh.
  - Bottom Sheet cài đặt cuộc trò chuyện và quản trị nhóm.

### 🔹 Bước 5D.6: Leaderboard Backend Service & Flutter UI
- Xây dựng `src/services/leaderboard.service.ts` và REST API `GET /api/v1/leaderboard`.
- Tạo Clean Architecture module `lib/features/social/leaderboard/`.
- Xây dựng `LeaderboardBloc` và giao diện Native:
  - Thanh Tab 4 danh mục thi đua + Bộ lọc 4 khung thời gian.
  - Widget Bục vinh quang Top 3 (Podium) chuyển động mượt mà với hiệu ứng vương miện và màu sắc chuẩn.
  - Danh sách Top 4 đến 50 và Thanh cố định hiển thị thứ hạng cá nhân.

### 🔹 Bước 5D.7: Kiểm thử Tổng thể & Hoàn thiện Toàn diện Social
- Kiểm thử tích hợp chéo (End-to-End) giữa 2 tài khoản trên Android Emulator và trình duyệt Web:
  - Tài khoản A gửi lời mời kết bạn $\rightarrow$ Tài khoản B nhận thông báo realtime và chấp nhận.
  - Tài khoản A gửi tin nhắn và tặng thẻ bài Wiki $\rightarrow$ Tài khoản B nhận tức thì qua Socket, mở hộp quà và kiểm tra kho thẻ.
  - Kiểm tra bảng xếp hạng cập nhật điểm số sau khi học hoặc làm Quiz.
  - Kiểm tra memory leak, hủy socket listeners an toàn khi thoát app.
- Lập tài liệu bàn giao `docs/SOCIAL_TESTING_AND_POLISH_REPORT.md`.

---

## 11. KẾT LUẬN

Hệ thống Social & Community trên Web `hub-el` đã có nền tảng CSDL và nghiệp vụ rất phong phú, bao gồm đầy đủ cả Bạn bè, Nhắn tin 1-1, Nhắn tin nhóm, Tặng thẻ bài Wiki và Bảng xếp hạng 4 danh mục.

Việc chuyển đổi sang Flutter Native hoàn toàn khả thi và nhất quán bằng cách:
1. Đóng gói logic hiện tại thành các **Services dùng chung** trên Backend.
2. Mở rộng hệ thống **REST API v1** chuẩn JWT Bearer.
3. Bổ sung lớp bảo vệ **JWT Handshake** cho Socket.IO Server.
4. Tái hiện chuẩn xác 100% giao diện Mobile Web bằng các Native Widgets hiệu năng cao.

