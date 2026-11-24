# BÁO CÁO HOÀN THÀNH GIAI ĐOẠN 4 – BƯỚC 5B.2
## WIKI STUDY SERVICE & REST API BRIDGE

---

## 1. TỔNG QUAN KẾT QUẢ

- **Mục tiêu:** Xây dựng `WikiStudyService` dùng chung và 4 REST API Route Handlers phục vụ module **Wiki Study & Star Awakening (Học bài theo thẻ và thức tỉnh sao)** cho Flutter Mobile và Web Next.js.
- **Dự án backend:** `hub-el` (Next.js 15 App Router, Prisma ORM, SQL Server, Google Gemini 2.5 Flash).
- **Kết quả kiểm thử tự động:** **26/26 test cases PASS 100%** (`scripts/test_wiki_study_backend.ts`), bao gồm toàn bộ kiểm thử nghiệp vụ, bảo mật, chống gian lận và HTTP REST API thực tế với Bearer JWT.
- **Tương thích ngược (Backward Compatibility):** 100% Server Actions cũ (`generateQuizFromWikiCard`, `addExpToUser`, `keepCardStar`, `saveWikiQuizHistory`) và giao diện Web Mobile tiếp tục hoạt động mượt mà.
- **Chất lượng mã nguồn Flutter:** `flutter analyze` đạt **0 issues found**. Không can thiệp UI Flutter trong bước này theo đúng quy định.

---

## 2. DANH SÁCH FILE ĐÃ TẠO VÀ CHỈNH SỬA

| STT | File | Trạng thái | Chức năng |
|---|---|---|---|
| 1 | `hub-el/src/services/wiki-study.service.ts` | **Tạo mới** | Service nghiệp vụ lõi: Kiểm tra quyền truy cập thẻ, gọi Gemini 2.5 Flash sinh bài học, quản lý session chống gian lận, chấm điểm server-side, thức tỉnh sao, tính XP/Xu/Streak/DailyStat, cứu sao (Keep Star). |
| 2 | `hub-el/src/app/api/v1/wiki/cards/[id]/route.ts` | **Tạo mới** | REST API Route Handler `GET /api/v1/wiki/cards/:id` (xác thực Bearer JWT, kiểm tra quyền sở hữu trong `UserInventory`, trả về thông số thẻ & cấu hình user). |
| 3 | `hub-el/src/app/api/v1/wiki/study/generate/route.ts` | **Tạo mới** | REST API Route Handler `POST /api/v1/wiki/study/generate` (sinh bài đọc & câu hỏi AI, ẩn đáp án chuẩn cho Mobile, trừ năng lượng AI). |
| 4 | `hub-el/src/app/api/v1/wiki/study/finish/route.ts` | **Tạo mới** | REST API Route Handler `POST /api/v1/wiki/study/finish` (nộp bài, chấm điểm server-side, cập nhật thức tỉnh sao, XP, Xu, streak, lưu attempt). |
| 5 | `hub-el/src/app/api/v1/wiki/study/keep-star/route.ts` | **Tạo mới** | REST API Route Handler `POST /api/v1/wiki/study/keep-star` (cứu sao với 50 Xu trong 1 transaction an toàn, chống cứu trùng). |
| 6 | `hub-el/src/actions/quiz.ts` | **Cập nhật** | Refactor các Server Actions (`generateQuizFromWikiCard`, `addExpToUser`, `keepCardStar`, `saveWikiQuizHistory`) để ủy thác sang `WikiStudyService` dùng chung. |
| 7 | `hub-el/scripts/test_wiki_study_backend.ts` | **Tạo mới** | Kịch bản kiểm thử tích hợp 26 kịch bản bao phủ trọn vẹn nghiệp vụ và API thực tế. |

---

## 3. CÁC NGHIỆP VỤ TÁI SỬ DỤNG VÀ NÂNG CẤP

1. **Gemini AI Integration (`gemini-2.5-flash`):**
   - Đã nâng cấp tương thích với endpoint `gemini-2.5-flash:generateContent` đang hoạt động của Google AI API (kèm cơ chế tự động fallback `gemini-flash-latest`).
   - Tái sử dụng trọn vẹn thuật toán cắt khối Wikipedia ($\le 2000$ ký tự), xáo trộn ngẫu nhiên và prompt giáo dục phân hóa theo trình độ A1–C2, ngôn ngữ mục tiêu và số từ bài đọc.
2. **Hệ thống Năng lượng AI & Tự động nạp mới hàng ngày:**
   - Chi phí cố định: 10 Năng lượng (hoặc 7 Năng lượng nếu tài khoản PRO - ưu đãi giảm 30%).
   - Tự động kiểm tra mốc thời gian `lastDailyCoinGrant`, nạp đầy bình năng lượng theo cấp độ người dùng (`getMaxEnergy(user.level, user.isPro)`) khi bước sang ngày mới.
3. **Cơ chế Gamification, Leveling & Streak:**
   - Tái sử dụng `addExpAndRewards` từ `@/lib/leveling` để tính toán đường cong XP bậc 2, điểm thưởng PRO, buff cấp độ và thăng hạng cấp độ (hỗ trợ nhảy nhiều cấp độ cùng lúc).
   - Tự động duy trì chuỗi ngày học (`currentStreak`, `highestStreak`, `lastStudyDate`) và cập nhật thống kê hàng ngày `DailyStat` và `UserStats`.

---

## 4. DANH SÁCH REST API & REQUEST/RESPONSE MẪU

### A. GET `/api/v1/wiki/cards/:id`
- **Mục đích:** Lấy thông tin thẻ bài để cấu hình bài học và kiểm tra quyền sở hữu trong tủ đồ (`UserInventory`).
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response mẫu (200 OK):**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": 1,
      "title": "Tanquary Fiord Airport",
      "rarity": "N",
      "imageUrl": "https://...",
      "wikiUrl": "https://en.wikipedia.org/wiki/...",
      "totalStars": 1,
      "awakenedStars": 0
    },
    "inventory": {
      "id": 102,
      "currentStar": 0,
      "isCompleted": false,
      "acquiredAt": "2026-11-10T12:00:00.000Z"
    },
    "user": {
      "level": 5,
      "xp": 450,
      "freeCoins": 150,
      "aiTokens": 70,
      "maxEnergy": 70,
      "isPro": false,
      "targetLanguage": "Tiếng Anh",
      "languageLevel": "A2",
      "energyCost": 10
    }
  }
}
```

### B. POST `/api/v1/wiki/study/generate`
- **Mục đích:** Tạo bài đọc và câu hỏi trắc nghiệm/suy luận qua Gemini AI.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
- **Request mẫu:**
```json
{
  "cardId": 1,
  "language": "Tiếng Anh",
  "level": "A2",
  "numQs": 3,
  "timeLimit": 15,
  "wordMin": 150,
  "wordMax": 200,
  "quizTypes": ["multiple_choice", "true_false", "main_idea"]
}
```
- **Response mẫu (200 OK - Ẩn đáp án chuẩn để chống gian lận trên mobile):**
```json
{
  "success": true,
  "data": {
    "sessionId": "wiki_study_1763214567890_a1b2c3d4",
    "sessionToken": "eyJkYXRhIjoie1wic2Vzc2lvbklkXCI6...fQ==",
    "card": {
      "id": 1,
      "title": "Tanquary Fiord Airport",
      "rarity": "N",
      "totalStars": 1,
      "awakenedStars": 0
    },
    "timeLimit": 15,
    "simplifiedText": "Tanquary Fiord Airport is located in Nunavut, Canada...",
    "vocabularies": [
      {
        "word": "located",
        "pos": "V",
        "meaning": "nằm ở, tọa lạc",
        "englishDesc": "[ləʊˈkeɪtɪd]-/lâu-kây-tịt/\nSituated in a particular place.",
        "language": "Tiếng Anh"
      }
    ],
    "quizzes": [
      {
        "index": 0,
        "type": "multiple_choice",
        "question": "Where is Tanquary Fiord Airport located?",
        "options": ["Nunavut, Canada", "Alaska, USA", "Greenland", "Norway"]
      }
    ],
    "aiEnergySpent": 10,
    "remainingEnergy": 60
  }
}
```

### C. POST `/api/v1/wiki/study/finish`
- **Mục đích:** Nộp bài làm, chấm điểm server-side, cập nhật thức tỉnh sao, tính thưởng XP và trả về đầy đủ đáp án chuẩn & giải thích.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
- **Request mẫu:**
```json
{
  "sessionId": "wiki_study_1763214567890_a1b2c3d4",
  "sessionToken": "eyJkYXRhIjoie1wic2Vzc2lvbklkXCI6...fQ==",
  "answers": [0, "Đúng", 1]
}
```
- **Response mẫu (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": 45,
    "cardId": 1,
    "score": 3,
    "correctCount": 3,
    "totalQuizzes": 3,
    "isPass": true,
    "expGained": 30,
    "gainedCoins": 10,
    "newAwakenedStars": 1,
    "currentStar": 1,
    "isLostStar": false,
    "leveledUp": false,
    "newLevel": 5,
    "currentStreak": 3,
    "quizzes": [
      {
        "index": 0,
        "type": "multiple_choice",
        "question": "Where is Tanquary Fiord Airport located?",
        "options": ["Nunavut, Canada", "Alaska, USA", "Greenland", "Norway"],
        "userAnswer": "Nunavut, Canada",
        "correctAnswers": ["Nunavut, Canada"],
        "isCorrect": true,
        "explanation": "Đoạn 1 nêu rõ sân bay tọa lạc tại Nunavut, Canada."
      }
    ]
  }
}
```

### D. POST `/api/v1/wiki/study/keep-star`
- **Mục đích:** Sử dụng 50 Xu để bảo vệ và khôi phục 1 sao thức tỉnh khi làm bài thi bị trượt.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
- **Request mẫu:**
```json
{
  "attemptId": 45
}
```
- **Response mẫu (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": 45,
    "cardId": 1,
    "newAwakenedStars": 1,
    "currentStar": 1,
    "remainingCoins": 100,
    "message": "Bảo vệ sao thành công! Đã phục hồi +1 Sao cho thẻ bài."
  },
  "message": "Bảo vệ sao thành công! Đã phục hồi +1 Sao cho thẻ bài."
}
```

---

## 5. CƠ CHẾ BẢO MẬT & CHỐNG GIAN LẬN (ANTI-CHEAT)

1. **Xác thực JWT nghiêm ngặt:**
   - Trích xuất `userId` từ token đã xác minh qua `verifyToken(token)`. Không bao giờ tin cậy hoặc nhận `userId` từ request body/query để xác định quyền hạn.
2. **Chấm điểm độc lập tại Server (Server-Side Grading):**
   - Không nhận `score`, `correctCount` hay đáp án chuẩn từ client gửi lên.
   - Khi tạo bài học, bộ câu hỏi chuẩn kèm đáp án được lưu trong session server (có TTL) và ký số HMAC SHA-256 (`sessionToken`).
   - Server tự đối chiếu mảng `answers` của client với `quiz.correctAnswers` để tính điểm khách quan.
3. **Chống nộp trùng (Anti-Double Submit):**
   - Đánh dấu cờ `submitted = true` ngay khi phiên làm bài được nộp lần đầu. Bất kỳ request nộp lại cùng `sessionId` đều bị từ chối với lỗi `ALREADY_SUBMITTED` (HTTP 400).
4. **Chống cứu sao trùng (Anti-Double Rescue):**
   - Trong `WikiQuizAttempt.lessonSnapshot`, lưu trữ trạng thái `isRescued: true` cùng timestamp cứu sao.
   - Nếu gọi API cứu sao lần thứ hai trên cùng một `attemptId`, hệ thống lập tức chặn lại với mã lỗi `ALREADY_RESCUED` (HTTP 400).
5. **Giao dịch ACID (Database Transactions):**
   - Mọi thao tác biến động tài nguyên (trừ năng lượng AI, trừ 50 Xu, cộng sao, cập nhật `userStats`) đều được gói trọn vẹn trong `prisma.$transaction`. Nếu có lỗi xảy ra giữa chừng, toàn bộ giao dịch được rollback an toàn.

---

## 6. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG THỰC TẾ

Toàn bộ 26 kịch bản kiểm thử đã chạy thành công qua script [test_wiki_study_backend.ts](file:///D:/Coder/Web/hub-el/scripts/test_wiki_study_backend.ts) kết nối trực tiếp với SQL Server và Next.js server (`http://localhost:3000`):

```
=================================================
🚀 BẮT ĐẦU KIỂM THỬ WIKI STUDY SERVICE & REST API
=================================================

📌 Test User: cmw1tbh930001vclg2eud8m6h
📌 Thẻ đã sở hữu: Card #1 (Tanquary Fiord Airport)
📌 Thẻ chưa sở hữu: Card #4 (Diocese of Cyprus and the Gulf)

--- 1. KIỂM THỬ getWikiStudyCardService ---
✅ [PASS] 1.1 Lấy thẻ hợp lệ thành công
✅ [PASS] 1.2 Trả về thông tin năng lượng và quyền lợi user
✅ [PASS] 1.3 Từ chối truy cập thẻ chưa sở hữu (CARD_NOT_OWNED)
✅ [PASS] 1.4 Báo lỗi khi thẻ không tồn tại (CARD_NOT_FOUND)

--- 2. KIỂM THỬ generateWikiStudyService ---
✅ [PASS] 2.1 Bắt buộc chọn ít nhất 2 kỹ năng bài tập
⏳ Đang gọi Gemini AI tạo bài học thực tế (vui lòng chờ)...
✅ [PASS] 2.2 Sinh bài học Gemini AI thành công, cấp sessionId
✅ [PASS] 2.3 Đúng số lượng câu hỏi yêu cầu (2 câu)
✅ [PASS] 2.4 Đã ẩn đáp án chuẩn cho REST API Mobile (Anti-Cheat)
✅ [PASS] 2.5 Chặn tạo bài khi thiếu Năng lượng AI

--- 3. KIỂM THỬ finishWikiStudyService ---
✅ [PASS] 3.1 Chặn User B nộp bài của User A (FORBIDDEN)
✅ [PASS] 3.2 Nộp bài thành công, chấm điểm server-side và lưu attempt
✅ [PASS] 3.3 Xác định kết quả đậu/trượt theo quy tắc 50%
✅ [PASS] 3.4 Tính toán XP và cộng vào hệ thống
✅ [PASS] 3.5 Trả về đầy đủ đáp án chuẩn & giải thích sau khi nộp bài
✅ [PASS] 3.6 Chống nộp lại session đã hoàn tất (ALREADY_SUBMITTED)

--- 4. KIỂM THỬ keepWikiCardStarService ---
✅ [PASS] 4.1 Chặn User B cứu sao trên lượt thi của User A (FORBIDDEN)
✅ [PASS] 4.2 Từ chối cứu sao trên bài thi đã đậu (NOT_FAILED)
✅ [PASS] 4.3 Chặn cứu sao khi không đủ 50 Xu (INSUFFICIENT_COINS)
✅ [PASS] 4.4 Cứu sao thành công, trừ đúng 50 Xu trong cùng transaction
✅ [PASS] 4.5 Chống cứu sao lần 2 trên cùng lượt thi (ALREADY_RESCUED)

--- 5. KIỂM THỬ THỰC TẾ REST API HTTP ---
✅ [PASS] 5.1 GET /api/v1/wiki/cards/:id không có token -> 401 Unauthorized
✅ [PASS] 5.2 GET /api/v1/wiki/cards/:id trả về 200 OK với dữ liệu chuẩn
✅ [PASS] 5.3 GET /api/v1/wiki/cards/:id thẻ chưa sở hữu -> 403 Forbidden
✅ [PASS] 5.4 POST /api/v1/wiki/study/keep-star thực tế thành công qua HTTP (200 OK)
⏳ Gọi HTTP POST /api/v1/wiki/study/generate...
✅ [PASS] 5.5 POST /api/v1/wiki/study/generate thực tế thành công qua HTTP (200 OK)
✅ [PASS] 5.6 POST /api/v1/wiki/study/finish thực tế thành công qua HTTP (200 OK)

=================================================
🎉 KẾT QUẢ KIỂM THỬ: 26 PASS, 0 FAIL
=================================================
```

---

## 7. KẾT LUẬN VÀ BƯỚC TIẾP THEO

- Toàn bộ backend service và hệ thống REST API Bridge cho **Giai đoạn 4, Bước 5B.2** đã hoàn thành đạt chuẩn 100%, bảo mật cao và chạy ổn định với cơ sở dữ liệu SQL Server và mô hình Gemini AI thực tế.
- Hệ thống đã sẵn sàng cho bước tiếp theo: **GIAI ĐOẠN 4 – BƯỚC 5B.3: TRIỂN KHAI WIKI STUDY FLUTTER CLIENT UI (Màn hình cấu hình học, đọc bài, làm bài thi và thức tỉnh sao)**.

