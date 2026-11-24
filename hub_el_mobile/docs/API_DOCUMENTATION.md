# API & REALTIME SPECIFICATION - HUB-EL

> **Tài liệu đặc tả toàn bộ Giao diện lập trình ứng dụng (API) và Socket.io Realtime của Hub-EL**  
> Dùng làm tài liệu tích hợp mạng (Networking) cho ứng dụng Flutter Mobile `hub_el_mobile`.

---

## 1. REST API Route Handlers Hiện Có

Các endpoint API độc lập chạy dưới thư mục [`src/app/api`](file:///d:/Coder/Web/hub-el/src/app/api):

### A. Nhóm API Thanh toán MoMo Gateway

#### 1. Tạo Giao Dịch Thanh Toán MoMo
- **Endpoint:** `POST /api/momo/create`
- **Tập tin:** [`src/app/api/momo/create/route.ts`](file:///d:/Coder/Web/hub-el/src/app/api/momo/create/route.ts)
- **Xác thực:** Yêu cầu User Session (Cookie/Token)
- **Request Body (JSON):**
  ```json
  {
    "type": "VIP",       // "VIP" hoặc "COIN"
    "amount": 49000,     // Số tiền VND (49000, 249000, 399000...)
    "name": "Gói VIP 1 Tháng"
  }
  ```
- **Response Thành Công (`200 OK`):**
  ```json
  {
    "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?s=..."
  }
  ```
- **Xử lý trên Mobile:** Mở `payUrl` trong In-App WebView hoặc Deep Link trực tiếp sang App MoMo (`momo://...`).

---

#### 2. Kiểm Tra Trạng Thái Đơn Hàng (Polling Check Status)
- **Endpoint:** `POST /api/momo/check-status`
- **Tập tin:** [`src/app/api/momo/check-status/route.ts`](file:///d:/Coder/Web/hub-el/src/app/api/momo/check-status/route.ts)
- **Request Body (JSON):**
  ```json
  {
    "orderId": "HUBEL_1714800000_1234"
  }
  ```
- **Response Thành Công (`200 OK`):**
  ```json
  {
    "success": true
  }
  ```

---

#### 3. Webhook MoMo IPN Callback
- **Endpoint:** `POST /api/momo/callback`
- **Tập tin:** [`src/app/api/momo/callback/route.ts`](file:///d:/Coder/Web/hub-el/src/app/api/momo/callback/route.ts)
- **Mô tả:** Webhook từ máy chủ MoMo gửi về khi khách hàng thanh toán xong, kiểm tra chữ ký HMAC SHA256 và kích hoạt gói VIP / cộng Ngọc.

---

### B. Nhóm API Tải Lên Tập Tin (Upload)

#### Upload File / Ảnh Đính Kèm Tin Nhắn Chat
- **Endpoint:** `POST /api/upload/message`
- **Tập tin:** [`src/app/api/upload/message/route.ts`](file:///d:/Coder/Web/hub-el/src/app/api/upload/message/route.ts)
- **Headers:** `Content-Type: multipart/form-data`
- **Request Body:** Form data chứa field `file` (ảnh png, jpg, webp...)
- **Response Thành Công (`200 OK`):**
  ```json
  {
    "success": true,
    "url": "https://.../uploads/messages/filename.jpg"
  }
  ```

---

### C. Nhóm API Tác Vụ Tự Động (Cron Jobs)
- `GET /api/cron/reminders`: Quét học viên sắp đứt chuỗi Streak để gửi email nhắc nhở ([`src/app/api/cron/reminders/route.ts`](file:///d:/Coder/Web/hub-el/src/app/api/cron/reminders/route.ts)).
- `GET /api/cron/wiki-crawl`: Tự động cào danh mục bài viết từ Wikipedia ([`src/app/api/cron/wiki-crawl/route.ts`](file:///d:/Coder/Web/hub-el/src/app/api/cron/wiki-crawl/route.ts)).

---

## 2. Danh mục Server Actions Cần Chuyển Đổi Thành API Cho Mobile

Do ứng dụng Flutter gọi Backend qua giao thức HTTP tiêu chuẩn, toàn bộ các hàm Server Actions tại `src/actions/` cần được đóng gói qua REST API:

### A. Nhóm Xác Thực & Tài Khoản (Auth & Profile)

| Server Action | Tập tin nguồn | Input Parameters | Kết quả trả về |
| :--- | :--- | :--- | :--- |
| `registerUserAction` | [`src/actions/auth/register.ts`](file:///d:/Coder/Web/hub-el/src/actions/auth/register.ts) | `{ email, password, name }` | `{ success, user, message }` |
| `sendOtpResetAction` | [`src/actions/auth/reset.ts`](file:///d:/Coder/Web/hub-el/src/actions/auth/reset.ts) | `{ email }` | `{ success, message }` |
| `verifyOtpAndResetPassword`| [`src/actions/auth/reset.ts`](file:///d:/Coder/Web/hub-el/src/actions/auth/reset.ts) | `{ email, otp, newPassword }` | `{ success, message }` |
| `getFreshUserStatsAction`| [`src/actions/user/learning.ts`](file:///d:/Coder/Web/hub-el/src/actions/user/learning.ts)| `userId: string` | `{ level, xp, freeCoins, aiTokens, premiumCoins, currentStreak, highestStreak, isPro, streakFreezes }` |
| `updateProfileTabAction` | [`src/actions/user/settings.ts`](file:///d:/Coder/Web/hub-el/src/actions/user/settings.ts) | `{ userId, name, bio, image }` | `{ success, data }` |
| `updateSecurityPassword` | [`src/actions/user/security.ts`](file:///d:/Coder/Web/hub-el/src/actions/user/security.ts) | `{ userId, oldPass, newPass }`| `{ success, message }` |

---

### B. Nhóm Video & Trắc Nghiệm AI (Video & Quiz)

| Server Action | Tập tin nguồn | Input Parameters | Kết quả trả về |
| :--- | :--- | :--- | :--- |
| `searchAdvancedAction` | [`src/actions/video/video.ts`](file:///d:/Coder/Web/hub-el/src/actions/video/video.ts) | `request: SearchRequest, pageToken?` | `{ success, data: { items, nextPageToken } }` |
| `getRelatedVideosAction`| [`src/actions/video/video.ts`](file:///d:/Coder/Web/hub-el/src/actions/video/video.ts) | `videoId: string` | `{ success, data: VideoDTO[] }` |
| `checkEducationalVideoAction`| [`src/actions/video/video.ts`](file:///d:/Coder/Web/hub-el/src/actions/video/video.ts)| `title, channelName` | `{ success, isEducational, reason }` |
| `updateVideoProgressAction`| [`src/actions/video/progress.ts`](file:///d:/Coder/Web/hub-el/src/actions/video/progress.ts)| `userId, videoId, lastWatched, isCompleted`| `{ success }` |
| `generateQuizFromVideoAction`| [`src/actions/quiz/ai.ts`](file:///d:/Coder/Web/hub-el/src/actions/quiz/ai.ts)| `userId, videoId, count` | `{ success, data: QuizData }` |
| `submitQuizAttemptAction`| [`src/actions/quiz/attempt.ts`](file:///d:/Coder/Web/hub-el/src/actions/quiz/attempt.ts)| `userId, videoId, answers, score, correctCount`| `{ success, xpGained, leveledUp }` |

---

### C. Nhóm Thẻ Wiki & Vòng Quay Gacha (Wiki & Gacha)

| Server Action | Tập tin nguồn | Input Parameters | Kết quả trả về |
| :--- | :--- | :--- | :--- |
| `rollGacha` | [`src/actions/gacha.ts`](file:///d:/Coder/Web/hub-el/src/actions/gacha.ts) | `userId: string` | `{ success, card, message }` |
| `getGachaHistory` | [`src/actions/gacha.ts`](file:///d:/Coder/Web/hub-el/src/actions/gacha.ts) | `userId: string` | `UserInventoryItem[]` |
| `getExchangeData` | [`src/actions/gacha.ts`](file:///d:/Coder/Web/hub-el/src/actions/gacha.ts) | `userId: string` | `{ success, stardust, unownedCards }` |
| `exchangeCard` | [`src/actions/gacha.ts`](file:///d:/Coder/Web/hub-el/src/actions/gacha.ts) | `userId, cardId, cost` | `{ success, message }` |
| `generateQuizFromWikiCard`| [`src/actions/quiz.ts`](file:///d:/Coder/Web/hub-el/src/actions/quiz.ts) | `userId, cardId, config: QuizConfig`| `{ success, data: { simplifiedText, vocabularies, quizzes } }` |
| `addExpToUser` | [`src/actions/quiz.ts`](file:///d:/Coder/Web/hub-el/src/actions/quiz.ts) | `userId, cardId, correctCount, isPass`| `{ success, expGained, gainedCoins, newAwakenedStars, isLostStar, leveledUp }` |
| `keepCardStar` | [`src/actions/quiz.ts`](file:///d:/Coder/Web/hub-el/src/actions/quiz.ts) | `userId, cardId` | `{ success, message }` |
| `exchangeResources` | [`src/actions/store.ts`](file:///d:/Coder/Web/hub-el/src/actions/store.ts) | `type: string` | `{ success, message, data }` |

---

### D. Nhóm Xã Hội & Bạn Bè (Social)

| Server Action | Tập tin nguồn | Input Parameters | Kết quả trả về |
| :--- | :--- | :--- | :--- |
| `searchUsersAction` | [`src/actions/social/social.ts`](file:///d:/Coder/Web/hub-el/src/actions/social/social.ts) | `query: string, currentUserId: string` | `{ success, data: UserFriendDTO[] }` |
| `addFriendAction` | [`src/actions/social/social.ts`](file:///d:/Coder/Web/hub-el/src/actions/social/social.ts) | `currentUserId, targetUserId` | `{ success, message }` |
| `getPendingRequestsAction`| [`src/actions/social/social.ts`](file:///d:/Coder/Web/hub-el/src/actions/social/social.ts)| `userId: string` | `{ success, data: PendingRequestDTO[] }` |
| `respondFriendRequestAction`| [`src/actions/social/social.ts`](file:///d:/Coder/Web/hub-el/src/actions/social/social.ts)| `friendshipId, accept: boolean` | `{ success, message, senderId }` |
| `getFriendsListAction` | [`src/actions/social/social.ts`](file:///d:/Coder/Web/hub-el/src/actions/social/social.ts) | `userId: string` | `{ success, data: FriendListItemDTO[] }` |
| `getChatHistoryAction` | [`src/actions/social/social.ts`](file:///d:/Coder/Web/hub-el/src/actions/social/social.ts) | `currentUserId, targetId, isGroup?` | `{ success, data: ChatMessageDTO[] }` |
| `sendMessageAction` | [`src/actions/social/social.ts`](file:///d:/Coder/Web/hub-el/src/actions/social/social.ts) | `senderId, receiverId, content, type, fileUrl, isGiftCard, groupId?` | `{ success, data: ChatMessage }` |

---

### E. Nhóm Xếp Hạng & Thành Tựu (Leaderboard & Achievements)

| Server Action | Tập tin nguồn | Input Parameters | Kết quả trả về |
| :--- | :--- | :--- | :--- |
| `getLeaderboardData` | [`src/actions/leaderboard.ts`](file:///d:/Coder/Web/hub-el/src/actions/leaderboard.ts) | `category: string, timeframe: string` | `LeaderboardUserDTO[]` |
| `checkAndGetAchievements`| [`src/actions/achievements.ts`](file:///d:/Coder/Web/hub-el/src/actions/achievements.ts)| `userId: string` | `{ success, newlyUnlocked, totalXpBonus, totalCoinsBonus, totalEnergyBonus }` |
| `updateTaskProgressAction`| [`src/actions/quests/progress.ts`](file:///d:/Coder/Web/hub-el/src/actions/quests/progress.ts)| `userId, taskType, amount` | `{ success }` |

---

## 3. Đặc tả Kỹ thuật Socket.io Realtime

Căn cứ từ máy chủ Socket tại [`hub-el/server.js`](file:///d:/Coder/Web/hub-el/server.js):

### A. Kết nối (Connection)
- **URL Socket:** `http://<SERVER_IP>:3000`
- **Transport:** WebSocket (`transports: ['websocket']`)

### B. Bảng Sự Kiện Socket (Events Specification)

| Tên Sự Kiện | Chiều (Direction) | Payload Schema | Ý nghĩa & Hành vi |
| :--- | :--- | :--- | :--- |
| `join_room` | Client $\rightarrow$ Server | `userId: string` | Gắn kết kết nối của client vào Room cá nhân theo ID của chính mình để nhận tin nhắn/thông báo riêng. |
| `send_message` | Client $\rightarrow$ Server | `{"receiverId": "string", "message": Object}` | Client gửi gói tin nhắn tới Server, kèm ID người nhận. |
| `receive_message` | Server $\rightarrow$ Client | `ChatMessageObject` | Server chuyển tiếp tin nhắn vào Room `receiverId`. |
| `send_friend_request` | Client $\rightarrow$ Server | `{"receiverId": "string", "sender": Object}` | Client báo Server vừa gửi lời mời kết bạn. |
| `receive_friend_request`| Server $\rightarrow$ Client | `{"sender": Object, "requestId": number}` | Server đẩy thông báo realtime tới máy người nhận. |
| `accept_friend_request` | Client $\rightarrow$ Server | `{"receiverId": "string", "acceptedBy": Object}`| Báo cho người gửi lời mời biết rằng họ đã được chấp nhận. |
| `friend_request_accepted`| Server $\rightarrow$ Client| `{"acceptedBy": Object}` | Thông báo realtime chúc mừng 2 bạn đã kết nối. |
| `disconnect` | Hai chiều | Tự động ngắt kết nối | Dọn dẹp tài nguyên socket trên máy chủ. |

---

## 4. Hướng dẫn Tích hợp Mạng cho Flutter Mobile

```dart
// Ví dụ cấu hình Dio client cho Flutter:
class ApiClient {
  static final Dio dio = Dio(
    BaseOptions(
      baseUrl: 'http://10.0.2.2:3000', // Dành cho Android Emulator
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  );
}

// Ví dụ cấu hình Socket.io client cho Flutter:
import 'package:socket_io_client/socket_io_client.dart' as IO;

IO.Socket initSocket(String userId) {
  IO.Socket socket = IO.io('http://10.0.2.2:3000', <String, dynamic>{
    'transports': ['websocket'],
    'autoConnect': true,
  });

  socket.onConnect((_) {
    socket.emit('join_room', userId);
  });

  return socket;
}
```

