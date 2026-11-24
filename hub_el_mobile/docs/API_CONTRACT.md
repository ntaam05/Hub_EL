# REST API CONTRACT SPECIFICATION - HUB-EL

> **Hợp đồng Giao diện Lập trình Ứng dụng (API Contract) giữa Backend Next.js và Flutter Mobile**  
> Định dạng trao đổi dữ liệu: `application/json`  
> Mã hóa ký tự: `UTF-8`

---

## 1. Chuẩn Hóa Khung Phản Hồi Dữ Liệu (Standard Response Envelopes)

Mọi phản hồi từ máy chủ Next.js về ứng dụng Flutter đều tuân thủ cấu trúc đồng nhất:

### A. Phản Hồi Thành Công (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Thông điệp phản hồi (tùy chọn)",
  "data": { ... } // Đối tượng hoặc mảng dữ liệu thực tế
}
```

### B. Phản Hồi Thất Bại (`400`, `401`, `403`, `404`, `500`)
```json
{
  "success": false,
  "error": "Thông báo lỗi hiển thị cho người dùng",
  "code": "MÃ_LỖI_HỆ_THỐNG", // Ví dụ: "USER_BANNED", "INSUFFICIENT_ENERGY"
  "details": null
}
```

---

## 2. Chi Tiết API Contract Theo Từng Phân Hệ Nghiệp Vụ

### MODULE 1: AUTHENTICATION & USER SESSION (XÁC THỰC)

---

#### 1.1 Đăng nhập bằng Email & Mật khẩu
- **Trạng thái:** `API CẦN BỔ SUNG TRÊN BACKEND` (Bridge gói từ `src/lib/auth.ts`)
- **Endpoint:** `POST /api/v1/auth/login`
- **Yêu cầu xác thực:** Không (Public)
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123@"
  }
  ```
- **Response Thành Công (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "d8f3b2a1c4e5...",
      "user": {
        "id": "cm123abc456",
        "email": "user@example.com",
        "name": "Hoàng Nhật Tâm",
        "avatar": "https://.../avatar.jpg",
        "role": "student",
        "level": 12,
        "xp": 450,
        "freeCoins": 1250,
        "aiTokens": 45,
        "premiumCoins": 300,
        "currentStreak": 7,
        "highestStreak": 15,
        "streakFreezes": 1,
        "isPro": true,
        "premiumExpiresAt": "2026-12-31T23:59:59.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"success": false, "error": "Sai tài khoản hoặc mật khẩu!", "code": "INVALID_CREDENTIALS"}`
  - `403 Forbidden`: `{"success": false, "error": "Tài khoản của bạn đã bị khóa!", "code": "USER_BANNED"}`

---

#### 1.2 Đăng ký tài khoản mới
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge gói từ `src/actions/auth/register.ts`)
- **Endpoint:** `POST /api/v1/auth/register`
- **Request Body:**
  ```json
  {
    "email": "newuser@example.com",
    "password": "Password123@",
    "name": "Nguyễn Văn A"
  }
  ```
- **Response Thành Công (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Đăng ký tài khoản thành công!",
    "data": {
      "user": {
        "id": "cm456def789",
        "email": "newuser@example.com",
        "name": "Nguyễn Văn A",
        "level": 1,
        "freeCoins": 0,
        "aiTokens": 50,
        "isPro": false
      }
    }
  }
  ```
- **Error Responses:**
  - `409 Conflict`: `{"success": false, "error": "Email này đã được sử dụng!"}`

---

#### 1.3 Quên mật khẩu & Gửi mã OTP
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/auth/reset.ts`)
- **Endpoint:** `POST /api/v1/auth/forgot-password`
- **Request Body:** `{"email": "user@example.com"}`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Mã xác thực 6 số đã được gửi tới email của bạn."
  }
  ```

---

#### 1.4 Xác thực OTP & Đặt mật khẩu mới
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/auth/reset.ts`)
- **Endpoint:** `POST /api/v1/auth/verify-reset-password`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "839201",
    "newPassword": "NewPassword123@"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Mật khẩu của bạn đã được cập nhật thành công!"
  }
  ```

---

#### 1.5 Đăng nhập bằng Google Token (Native Mobile)
- **Trạng thái:** `API CẦN BỔ SUNG`
- **Endpoint:** `POST /api/v1/auth/oauth/google`
- **Request Body:**
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "email": "user@gmail.com",
    "name": "User Name",
    "image": "https://lh3.googleusercontent.com/..."
  }
  ```
- **Response (`200 OK`):** Trả về `accessToken` và đối tượng `user` tương tự Login thông thường.

---

### MODULE 2: DASHBOARD & NHIỆM VỤ NGÀY (DASHBOARD & QUESTS)

---

#### 2.1 Lấy chỉ số tài nguyên thời gian thực (User Fresh Stats)
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/user/learning.ts`)
- **Endpoint:** `GET /api/v1/dashboard/stats`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "level": 12,
      "xp": 450,
      "reqXp": 3380,
      "xpPercentage": 13.3,
      "freeCoins": 1250,
      "aiTokens": 45,
      "maxEnergy": 155,
      "premiumCoins": 300,
      "stardust": 120,
      "currentStreak": 7,
      "highestStreak": 15,
      "streakFreezes": 1,
      "isPro": true,
      "isStudiedToday": true
    }
  }
  ```

---

#### 2.2 Lấy danh sách nhiệm vụ ngày
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/quests/progress.ts`)
- **Endpoint:** `GET /api/v1/dashboard/tasks`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "taskId": 101,
        "taskDesc": "Xem hoàn thành 1 Video bài học",
        "taskType": "WATCH",
        "target": 1,
        "current": 1,
        "rewardCoins": 10,
        "rewardXp": 50,
        "isClaimed": false,
        "isProOnly": false
      },
      {
        "id": 2,
        "taskId": 102,
        "taskDesc": "Quay Gacha 1 lần (Đặc quyền VIP)",
        "taskType": "ROLL_GACHA",
        "target": 1,
        "current": 0,
        "rewardCoins": 20,
        "rewardXp": 100,
        "isClaimed": false,
        "isProOnly": true
      }
    ]
  }
  ```

---

#### 2.3 Nhận thưởng nhiệm vụ ngày
- **Trạng thái:** `API CẦN BỔ SUNG`
- **Endpoint:** `POST /api/v1/dashboard/tasks/:taskId/claim`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Đã nhận thưởng +10 Xu và +50 XP!",
    "data": {
      "rewardCoins": 10,
      "rewardXp": 50,
      "newCoins": 1260,
      "newXp": 500,
      "leveledUp": false
    }
  }
  ```

---

### MODULE 3: VIDEO LEARNING & TRẮC NGHIỆM AI (LEARNING)

---

#### 3.1 Tìm kiếm video giáo dục có màng lọc
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/video/video.ts`)
- **Endpoint:** `POST /api/v1/video/search`
- **Headers:** `Authorization: Bearer <TOKEN>` (tùy chọn)
- **Request Body:**
  ```json
  {
    "keyword": "lập trình flutter căn bản",
    "pageToken": "CAUQAA" // Tùy chọn (phân trang)
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "videoId": "abc123xyz89",
          "type": "video",
          "title": "Tự học Flutter trong 24 giờ cho người mới bắt đầu",
          "channelTitle": "Lập Trình Di Động",
          "thumbnailUrl": "https://img.youtube.com/vi/abc123xyz89/maxresdefault.jpg",
          "viewCount": 25400,
          "duration": 3600
        }
      ],
      "nextPageToken": "CBQQAA"
    }
  }
  ```

---

#### 3.2 Kiểm tra URL YouTube dán vào có hợp lệ & giáo dục hay không
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/video/video.ts`)
- **Endpoint:** `POST /api/v1/video/validate-link`
- **Request Body:** `{"youtubeUrl": "https://www.youtube.com/watch?v=abc123xyz89"}`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "isEducational": true,
    "data": {
      "videoId": "abc123xyz89",
      "title": "Khóa học Nhập môn Trí tuệ Nhân tạo",
      "channelTitle": "AI Academy",
      "thumbnailUrl": "https://img.youtube.com/vi/abc123xyz89/maxresdefault.jpg"
    }
  }
  ```

---

#### 3.3 Sinh bài tập trắc nghiệm AI từ Video phụ đề
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/quiz/ai.ts`)
- **Endpoint:** `POST /api/v1/video/quiz/generate`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
  ```json
  {
    "videoId": "abc123xyz89",
    "count": 5
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "energyCost": 4, // PRO được giảm 30%
    "remainingEnergy": 41,
    "data": [
      {
        "id": 1,
        "triggerAtSecond": 120,
        "question": "Widget nào trong Flutter là cơ bản nhất để hiển thị văn bản?",
        "options": [
          {"id": 10, "content": "Text", "isCorrect": true},
          {"id": 11, "content": "Label", "isCorrect": false},
          {"id": 12, "content": "Span", "isCorrect": false},
          {"id": 13, "content": "Typography", "isCorrect": false}
        ],
        "explanation": "Trong Flutter, Text là widget cốt lõi dùng để render chuỗi ký tự lên màn hình."
      }
    ]
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"success": false, "error": "Bạn không đủ năng lượng! Cần 4⚡ để tạo câu hỏi.", "code": "INSUFFICIENT_ENERGY"}`

---

#### 3.4 Cập nhật tiến độ xem Video
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/video/progress.ts`)
- **Endpoint:** `POST /api/v1/video/progress`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
  ```json
  {
    "videoId": "abc123xyz89",
    "lastWatchedSeconds": 245,
    "isCompleted": false
  }
  ```
- **Response (`200 OK`):** `{"success": true}`

---

### MODULE 4: NGOẠI NGỮ VỚI WIKI & VÒNG QUAY GACHA (WIKI & GACHA)

---

#### 4.1 Lấy danh sách thẻ bài Wiki cá nhân
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/wiki-manager.ts`)
- **Endpoint:** `GET /api/v1/wiki/inventory`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Query Parameters:** `?rarity=SSR&isCompleted=false`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "inventoryId": 501,
        "cardId": 12,
        "title": "Thuyết Tương Đối Hẹp",
        "rarity": "SSR",
        "imageUrl": "https://.../relativity.jpg",
        "totalStars": 4,
        "awakenedStars": 2,
        "currentStar": 2,
        "canShareCount": 1,
        "isCompleted": false,
        "isNew": false,
        "vocabCount": 8
      }
    ]
  }
  ```

---

#### 4.2 Sinh bài đọc AI thích ứng theo cấp độ (A1-C2) từ Thẻ Wiki
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/quiz.ts`)
- **Endpoint:** `POST /api/v1/wiki/cards/:cardId/generate-lesson`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
  ```json
  {
    "numQs": 5,
    "wordMin": 150,
    "wordMax": 300,
    "targetLanguage": "English",
    "languageLevel": "B1",
    "types": ["multiple_choice", "true_false", "guess_meaning"]
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "energyCost": 7, // 7 NL cho PRO, 10 NL cho thường
    "data": {
      "simplifiedText": "Albert Einstein developed the theory of special relativity in 1905...",
      "vocabularies": [
        {
          "word": "relativity",
          "pos": "N",
          "meaning": "Thuyết tương đối",
          "englishDesc": "[ˌrel.əˈtɪv.ə.ti] - /re-lơ-ti-vi-ti/\nThe state of something depending on something else.",
          "language": "English"
        }
      ],
      "quizzes": [
        {
          "type": "multiple_choice",
          "question": "When was the theory published?",
          "options": ["1905", "1915", "1895", "1920"],
          "correctAnswers": ["1905"],
          "explanation": "Theo bài đọc, Einstein công bố lý thuyết này vào năm 1905."
        }
      ]
    }
  }
  ```

---

#### 4.3 Nộp bài thi Wiki & Cập nhật Thức tỉnh sao
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/quiz.ts`)
- **Endpoint:** `POST /api/v1/wiki/cards/:cardId/submit-quiz`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
  ```json
  {
    "correctCount": 4,
    "totalCount": 5,
    "isPass": true
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "expGained": 40,
    "gainedCoins": 10,
    "newAwakenedStars": 3,
    "isLostStar": false,
    "leveledUp": false,
    "currentStreak": 8
  }
  ```

---

#### 4.4 Cứu sao thẻ bài bị rớt (Chi 50 Xu)
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/quiz.ts`)
- **Endpoint:** `POST /api/v1/wiki/cards/:cardId/keep-star`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Đã cứu thành công 1 sao!",
    "cost": 50,
    "remainingCoins": 1210,
    "newAwakenedStars": 2
  }
  ```

---

#### 4.5 Quay Vòng Gacha Thẻ Bài
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/gacha.ts`)
- **Endpoint:** `POST /api/v1/gacha/roll`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "isFreePull": false,
    "cost": 100,
    "card": {
      "id": 88,
      "title": "Cơ Học Lượng Tử",
      "rarity": "UR",
      "imageUrl": "https://.../quantum.jpg",
      "totalStars": 5
    },
    "isDuplicate": true,
    "stardustGained": 600, // 500 + 20% bonus VIP
    "pity": {
      "pitySR": 0,
      "pitySSR": 0,
      "pityUR": 0
    },
    "message": "Trùng thẻ! Nhận được +600 Bụi Sao."
  }
  ```

---

#### 4.6 Đổi Bụi sao lấy Thẻ bài chưa sở hữu
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/gacha.ts`)
- **Endpoint:** `POST /api/v1/gacha/exchange`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
  ```json
  {
    "cardId": 45,
    "cost": 500
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Đổi thẻ thành công!",
    "remainingStardust": 220
  }
  ```

---

### MODULE 5: SOCIAL & REALTIME CHAT (CỘNG ĐỒNG)

---

#### 5.1 Danh sách Bạn bè & Trạng thái Online
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/social/social.ts`)
- **Endpoint:** `GET /api/v1/social/friends`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cm789userb",
        "name": "Trần Thị B",
        "avatar": "https://.../avatar_b.jpg",
        "isOnline": true,
        "isBlockedByMe": false,
        "isBlockedByThem": false,
        "lastMsg": "Hôm nay bạn học bài chưa?"
      }
    ]
  }
  ```

---

#### 5.2 Gửi lời mời kết bạn
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/social/social.ts`)
- **Endpoint:** `POST /api/v1/social/friends/request`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:** `{"targetUserId": "cm789userb"}`
- **Response (`200 OK`):** `{"success": true, "message": "Đã gửi lời mời kết bạn!"}`

---

#### 5.3 Lấy lịch sử chat
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/social/social.ts`)
- **Endpoint:** `GET /api/v1/social/chat/history`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Query Parameters:** `?targetId=cm789userb&isGroup=false`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1001,
        "senderId": "cm123me",
        "receiverId": "cm789userb",
        "content": "Mình vừa quay trúng thẻ SSR này!",
        "messageType": "WIKI_CARD",
        "fileUrl": "https://.../card_url",
        "isGiftCard": true,
        "createdAt": "2026-11-04T12:00:00.000Z"
      }
    ]
  }
  ```

---

#### 5.4 Tải lên ảnh đính kèm chat (Upload File)
- **Trạng thái:** `API ĐÃ CÓ SẴN (100% REUSABLE)`
- **Endpoint:** `POST /api/upload/message`
- **Headers:** `Content-Type: multipart/form-data`
- **Request Body:** Form data chứa file `file` (ảnh png/jpg).
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "url": "https://hub-el.com/uploads/messages/photo_123.jpg"
  }
  ```

---

### MODULE 6: CỬA HÀNG & THANH TOÁN MOMO (STORE & MOMO)

---

#### 6.1 Tạo đơn hàng thanh toán MoMo
- **Trạng thái:** `API ĐÃ CÓ SẴN (100% REUSABLE)`
- **Endpoint:** `POST /api/momo/create`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body (JSON):**
  ```json
  {
    "type": "VIP", // Hoặc "COIN"
    "amount": 49000,
    "name": "Gói VIP 1 Tháng Hub-EL"
  }
  ```
- **Response Thành Công (`200 OK`):**
  ```json
  {
    "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?s=123456789abc"
  }
  ```

---

#### 6.2 Kiểm tra trạng thái đơn hàng MoMo (Polling)
- **Trạng thái:** `API ĐÃ CÓ SẴN (100% REUSABLE)`
- **Endpoint:** `POST /api/momo/check-status`
- **Request Body:** `{"orderId": "HUBEL_1714800000_1234"}`
- **Response (`200 OK`):**
  ```json
  {
    "success": true
  }
  ```

---

#### 6.3 Đổi tài nguyên trong Cửa Hàng
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/store.ts`)
- **Endpoint:** `POST /api/v1/store/exchange`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:** `{"type": "GEM_TO_ENERGY"}` // Hoặc 'GEM_TO_COIN', 'COIN_TO_ENERGY'
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Giao dịch thành công!",
    "data": {
      "costField": "premiumCoins",
      "cost": 50,
      "rewardField": "aiTokens",
      "reward": 50
    }
  }
  ```

---

### MODULE 7: BẢNG XẾP HẠNG & THÀNH TỰU (LEADERBOARD & ACHIEVEMENTS)

---

#### 7.1 Lấy dữ liệu Bảng Xếp Hạng
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/leaderboard.ts`)
- **Endpoint:** `GET /api/v1/leaderboard`
- **Query Parameters:** `?category=STREAK&timeframe=WEEK`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cm123abc",
        "rank": 1,
        "name": "Nguyễn Văn A (Bot)",
        "avatar": "https://i.pravatar.cc/150?u=1",
        "isPro": true,
        "scoreValue": 45,
        "scoreLabel": "45 Ngày",
        "subLabel": "Chuỗi liên tục"
      }
    ]
  }
  ```

---

#### 7.2 Quét và Lấy Danh sách Thành Tựu
- **Trạng thái:** `API CẦN BỔ SUNG` (Bridge từ `src/actions/achievements.ts`)
- **Endpoint:** `GET /api/v1/achievements`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "newlyUnlocked": [
      {
        "id": "STR_1",
        "title": "Mới vào nghề",
        "desc": "Đạt chuỗi học 3 ngày liên tiếp.",
        "rewardXp": 100,
        "rewardEnergy": 10
      }
    ],
    "totalXpBonus": 100,
    "totalCoinsBonus": 0,
    "totalEnergyBonus": 10
  }
  ```

