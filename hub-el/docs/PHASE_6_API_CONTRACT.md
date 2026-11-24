# PHASE 6 – API CONTRACT SPECIFICATION
## HUB-EL REST API FOR FLUTTER NATIVE

Tài liệu này đặc tả toàn bộ hợp đồng API (REST Contract) được triển khai trong Giai đoạn 6 – Bước 6.2 nhằm phục vụ ứng dụng Flutter Native kết nối với Backend Hub-EL.

---

## 1. YÊU CẦU CHUNG (GENERAL CONSTRAINTS)

- **Base URL:** `http://<backend-host>:3000/api/v1`
- **Xác thực:** Mọi request (trừ các endpoint công khai nếu có) bắt buộc truyền HTTP Header:
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  Content-Type: application/json
  ```
- **Chuẩn phản hồi chung (Common Response Schema):**
  - Thành công:
    ```json
    {
      "success": true,
      "data": { ... }
    }
    ```
  - Thất bại:
    ```json
    {
      "success": false,
      "error": "Thông điệp lỗi chi tiết"
    }
    ```

---

## 2. PHÂN HỆ 1: STORE & ECONOMY

### 2.1. Lấy thông tin Kho hàng & Số dư
- **Endpoint:** `GET /api/v1/store`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "balance": {
        "freeCoins": 1250,
        "aiTokens": 50,
        "premiumCoins": 100,
        "stardust": 25,
        "isPro": false,
        "premiumExpiresAt": null
      },
      "exchangeRules": [
        {
          "type": "GEM_TO_COIN",
          "name": "Đổi 50 Ngọc lấy 1,000 Xu",
          "costField": "premiumCoins",
          "cost": 50,
          "rewardField": "freeCoins",
          "reward": 1000
        },
        {
          "type": "COIN_TO_TOKEN",
          "name": "Đổi 500 Xu lấy 10 Token AI",
          "costField": "freeCoins",
          "cost": 500,
          "rewardField": "aiTokens",
          "reward": 10
        },
        {
          "type": "GEM_TO_TOKEN",
          "name": "Đổi 20 Ngọc lấy 15 Token AI",
          "costField": "premiumCoins",
          "cost": 20,
          "rewardField": "aiTokens",
          "reward": 15
        }
      ],
      "vipPlans": [
        {
          "id": "vip_1m",
          "name": "Gói VIP 1 Tháng",
          "amount": 49000,
          "days": 30,
          "description": "Mở khóa toàn bộ video, tính năng cao cấp & x2 EXP"
        },
        {
          "id": "vip_3m",
          "name": "Gói VIP 3 Tháng",
          "amount": 129000,
          "days": 90,
          "description": "Tiết kiệm 15% + Tặng 100 Ngọc"
        },
        {
          "id": "vip_1y",
          "name": "Gói VIP 1 Năm",
          "amount": 399000,
          "days": 365,
          "description": "Siêu tiết kiệm + Tặng 500 Ngọc & Huy hiệu VIP Vĩnh viễn"
        }
      ],
      "coinPackages": [
        { "id": "coin_10k", "name": "Túi Ngọc Nhỏ", "amount": 10000, "coins": 100 },
        { "id": "coin_50k", "name": "Túi Ngọc Vừa", "amount": 50000, "coins": 550 },
        { "id": "coin_100k", "name": "Rương Ngọc", "amount": 100000, "coins": 1200 },
        { "id": "coin_200k", "name": "Kho Ngọc", "amount": 200000, "coins": 2500 },
        { "id": "coin_500k", "name": "Đại Kho Ngọc", "amount": 500000, "coins": 6500 }
      ]
    }
  }
  ```

### 2.2. Quy đổi tài nguyên (Exchange)
- **Endpoint:** `POST /api/v1/store/exchange`
- **Request Body:**
  ```json
  {
    "type": "GEM_TO_COIN"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Giao dịch thành công!",
    "data": {
      "user": {
        "freeCoins": 2250,
        "aiTokens": 50,
        "premiumCoins": 50
      }
    }
  }
  ```

### 2.3. Khởi tạo thanh toán MoMo
- **Endpoint:** `POST /api/v1/store/momo/create`
- **Request Body:**
  ```json
  {
    "type": "VIP",
    "amount": 49000,
    "name": "Gói VIP 1 Tháng",
    "redirectUrl": "hubel://payment-callback"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "orderId": "HUBEL_1795253277991_w80o",
      "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?...",
      "deeplink": "momo://...",
      "qrCodeUrl": "https://..."
    }
  }
  ```

### 2.4. Kiểm tra trạng thái đơn hàng MoMo
- **Endpoint:** `POST /api/v1/store/momo/check-status`
- **Request Body:**
  ```json
  {
    "orderId": "HUBEL_1795253277991_w80o"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "orderId": "HUBEL_1795253277991_w80o",
      "status": "SUCCESS",
      "amount": 49000,
      "type": "VIP",
      "isPro": true,
      "premiumExpiresAt": "2026-12-21T09:27:58.000Z"
    }
  }
  ```

### 2.5. Lịch sử giao dịch
- **Endpoint:** `GET /api/v1/store/transactions?limit=10`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "orders": [
        {
          "id": "order_id_123",
          "orderCode": "HUBEL_1795253277991_w80o",
          "amount": 49000,
          "type": "VIP",
          "status": "SUCCESS",
          "createdAt": "2026-11-21T09:27:58.000Z"
        }
      ]
    }
  }
  ```

---

## 3. PHÂN HỆ 2: ACHIEVEMENTS (HỆ THỐNG DANH HIỆU)

### 3.1. Lấy danh sách Thành tựu, Tiến độ & Nhận thưởng
- **Endpoint:** `GET /api/v1/achievements`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "total": 64,
        "unlocked": 2,
        "percent": 3
      },
      "newlyUnlocked": [],
      "achievements": [
        {
          "id": "STR_1",
          "title": "Tập sự kiên trì I",
          "description": "Duy trì chuỗi học tập 3 ngày liên tiếp",
          "category": "STREAK",
          "tier": "BRONZE",
          "icon": "flame",
          "xpReward": 100,
          "coinReward": 50,
          "energyReward": 10,
          "maxProgress": 3,
          "progress": 3,
          "isUnlocked": true,
          "unlockedAt": "2026-11-21T08:00:00.000Z"
        }
      ]
    }
  }
  ```

---

## 4. PHÂN HỆ 3: VOCABULARY NOTEBOOK (KHO TỪ VỰNG CÁ NHÂN)

### 4.1. Danh sách từ vựng của người dùng
- **Endpoint:** `GET /api/v1/vocabulary?search=aro&language=en&sort=asc&page=1&limit=20`
- **Query Parameters:**
  - `search` *(optional)*: Chuỗi tìm kiếm theo từ vựng hoặc nghĩa tiếng Việt.
  - `language` *(optional)*: Lọc theo mã ngôn ngữ (`en`, `ja`, v.v.).
  - `sort` *(optional)*: `asc` (A-Z) hoặc `desc` (Z-A). Mặc định: `asc`.
  - `page` *(optional)*: Số trang (mặc định 1).
  - `limit` *(optional)*: Số lượng từ mỗi trang (mặc định 20, tối đa 100).
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "vocab_1",
          "word": "around",
          "meaning": "xung quanh, vòng quanh",
          "phonetic": "/əˈraʊnd/",
          "example": "He walked around the building.",
          "exampleMeaning": "Anh ấy đi dạo quanh tòa nhà.",
          "audioUrl": null,
          "cardId": "card_abc",
          "cardTitle": "Tsakkar",
          "cardImage": "https://..."
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "totalPages": 1
      }
    }
  }
  ```

### 4.2. Ngữ cảnh câu chuyện của thẻ bài
- **Endpoint:** `GET /api/v1/vocabulary/context?cardId=card_abc`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "cardId": "card_abc",
      "title": "Tsakkar",
      "contextStory": "Một câu chuyện mẫu trong ngữ cảnh bài đọc...",
      "simplifiedStory": "Tsakkar là một câu chuyện ngắn..."
    }
  }
  ```

---

## 5. PHÂN HỆ 4: SETTINGS, PROFILE & SECURITY

### 5.1. Lấy thông tin Hồ sơ
- **Endpoint:** `GET /api/v1/settings/profile`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "user_id_123",
      "name": "Hoàng Nhật Tâm",
      "username": "hoangtam",
      "email": "hoangtam4472@gmail.com",
      "image": "https://...",
      "bio": "Học tiếng Anh mỗi ngày",
      "interests": ["Công nghệ", "Âm nhạc"],
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  }
  ```

### 5.2. Cập nhật Hồ sơ cá nhân
- **Endpoint:** `PUT /api/v1/settings/profile`
- **Request Body:**
  ```json
  {
    "name": "Hoàng Nhật Tâm",
    "username": "hoangtam4472",
    "bio": "Keep moving forward",
    "interests": ["Anime", "Coding"]
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### 5.3. Cập nhật Ảnh đại diện (Avatar)
- **Endpoint:** `POST /api/v1/settings/avatar`
- **Request Body:**
  ```json
  {
    "avatar": "data:image/jpeg;base64,..."
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "imageUrl": "data:image/jpeg;base64,..."
    }
  }
  ```

### 5.4. Lấy trạng thái Bảo mật
- **Endpoint:** `GET /api/v1/settings/security`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "isOAuth": false,
      "email": "hoangtam4472@gmail.com"
    }
  }
  ```

### 5.5. Gửi mã OTP xác thực qua Email
- **Endpoint:** `POST /api/v1/settings/security/send-otp`
- **Request Body:** `{}` *(lấy email từ token xác thực)*
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Mã xác thực đã được gửi về email của bạn."
  }
  ```

### 5.6. Xác minh mã OTP
- **Endpoint:** `POST /api/v1/settings/security/verify-otp`
- **Request Body:**
  ```json
  {
    "otp": "123456"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Xác thực mã OTP thành công."
  }
  ```

### 5.7. Đổi mật khẩu
- **Endpoint:** `POST /api/v1/settings/security/change-password`
- **Request Body:**
  ```json
  {
    "oldPassword": "CurrentPassword123",
    "newPassword": "NewStrongPassword456"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Đổi mật khẩu thành công!"
  }
  ```

### 5.8. Cài đặt Quyền riêng tư
- **Endpoint:** `GET /api/v1/settings/privacy` & `PUT /api/v1/settings/privacy`
- **Request Body (cho PUT):**
  ```json
  {
    "showOnline": true,
    "allowFriendRequests": true,
    "showInventory": true,
    "showRank": true
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "showOnline": true,
      "allowFriendRequests": true,
      "showInventory": true,
      "showRank": true
    }
  }
  ```

### 5.9. Cài đặt Thông báo
- **Endpoint:** `GET /api/v1/settings/notifications` & `PUT /api/v1/settings/notifications`
- **Request Body (cho PUT):**
  ```json
  {
    "dailyReminder": true,
    "streakWarning": true,
    "friendActivities": false,
    "systemAnnouncements": true
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "dailyReminder": true,
      "streakWarning": true,
      "friendActivities": false,
      "systemAnnouncements": true
    }
  }
  ```

### 5.10. Gửi phản hồi / Góp ý (Feedback)
- **Endpoint:** `POST /api/v1/feedback`
- **Request Body:**
  ```json
  {
    "type": "BUG",
    "content": "Gặp sự cố khi tải danh sách từ vựng",
    "contact": "hoangtam4472@gmail.com"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Cảm ơn bạn đã đóng góp ý kiến!"
  }
  ```
