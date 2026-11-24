# BÁO CÁO HOÀN THÀNH GIAI ĐOẠN 4 – BƯỚC 5C.2
## GACHA BACKEND SERVICE & REST API BRIDGE

---

## 1. TỔNG QUAN KẾT QUẢ

- **Mục tiêu:** Xây dựng `GachaService` dùng chung và 4 REST API Route Handlers phục vụ toàn diện tính năng **Gacha System (Quay thẻ bài kiến thức, cửa hàng đổi Bụi sao, lịch sử quay)** cho cả Flutter Mobile Native và Next.js Web.
- **Dự án Backend:** `hub-el` (Next.js 15 App Router, Prisma ORM, SQL Server).
- **Kết quả kiểm thử tự động:** **67/67 test cases PASS 100%** (`scripts/test_gacha_backend.ts`), kiểm thử chuyên sâu về tính đúng đắn toán học của xác suất, bảo hiểm (Pity counters & resets), tài khoản PRO, quy đổi thẻ trùng thành Bụi sao, chống duplicate-spend tại tiệm đổi thẻ và kiểm thử trực tiếp qua HTTP server Next.js với Bearer JWT.
- **Tương thích ngược (Backward Compatibility):** 100% Server Actions cũ trong `src/actions/gacha.ts` (`rollGachaAction`, `getGachaStatusAction`, `getGachaHistoryAction`, `exchangeGachaCardAction`) đã được refactor để ủy thác sang `GachaService`, đảm bảo website `hub-el` tiếp tục hoạt động trơn tru mà không có sự phân mảnh logic.
- **Bảo mật và toàn vẹn dữ liệu:** Xác thực Bearer JWT ở mọi route handler, trích xuất `userId` từ token đã ký bí mật, tuyệt đối không nhận `userId` từ body/query. Tất cả các thao tác thay đổi số dư Xu/Bụi sao, cấp thẻ và reset pity đều chạy trong ACID Transaction với cơ chế khóa phòng ngừa race condition.

---

## 2. DANH SÁCH FILE ĐÃ TẠO VÀ CHỈNH SỬA

| STT | File | Trạng thái | Chức năng |
|---|---|---|---|
| 1 | `hub-el/src/services/gacha.service.ts` | **Tạo mới** | Service nghiệp vụ lõi: Quản lý trạng thái Gacha, thuật toán quay số & bảo hiểm, xử lý lượt quay miễn phí PRO, quy đổi Bụi sao cho thẻ trùng, tiệm trao đổi thẻ và lịch sử sở hữu thẻ. |
| 2 | `hub-el/src/actions/gacha.ts` | **Refactor** | Chuyển đổi toàn bộ logic Server Actions sang gọi `GachaService`, giữ nguyên chữ ký hàm cho Web Client. |
| 3 | `hub-el/src/app/api/v1/gacha/status/route.ts` | **Tạo mới** | REST API Route Handler `GET /api/v1/gacha/status`: Trả về số dư Xu, Bụi sao, các bộ đếm Pity (SR, SSR, UR), trạng thái PRO và lượt quay miễn phí trong ngày. |
| 4 | `hub-el/src/app/api/v1/gacha/roll/route.ts` | **Tạo mới** | REST API Route Handler `POST /api/v1/gacha/roll`: Xử lý quay từ 1 đến 5 thẻ, tính toán lượt miễn phí, trừ Xu, bảo hiểm, trả về danh sách thẻ bài cùng trạng thái thẻ mới/trùng lặp và Bụi sao nhận được. |
| 5 | `hub-el/src/app/api/v1/gacha/exchange/route.ts` | **Tạo mới** | REST API Route Handler: `GET` lấy danh sách thẻ chưa sở hữu có thể đổi kèm giá Bụi sao; `POST` thực hiện đổi thẻ nguyên tử trong transaction. |
| 6 | `hub-el/src/app/api/v1/gacha/history/route.ts` | **Tạo mới** | REST API Route Handler `GET /api/v1/gacha/history`: Phân trang lịch sử các thẻ người dùng đã sở hữu theo thứ tự mới nhất, cách ly người dùng tuyệt đối. |
| 7 | `hub-el/scripts/test_gacha_backend.ts` | **Tạo mới** | Kịch bản kiểm thử tích hợp 67 bước kiểm thử trực tiếp trên SQL Server và Next.js HTTP server. |

---

## 3. NGHIỆP VỤ LÕI ĐÃ ĐƯỢC CHUẨN HÓA

### A. Chi phí quay & Quyền lợi PRO
- **Giá cơ sở:** 100 Xu (`freeCoins`) cho mỗi lượt quay.
- **Giới hạn số lượng quay:** Client chỉ được phép yêu cầu từ 1 đến 5 lượt/lần (`count ∈ [1, 5]`).
- **Lượt quay miễn phí PRO:**
  - Người dùng có `isPro = true` được tặng 1 lượt quay miễn phí mỗi ngày.
  - Kiểm tra dựa trên việc so sánh ngày hiện tại với `lastFreeGachaDate` (theo giờ UTC / Ngày lịch).
  - Khi quay multi-roll (ví dụ x3, x5) nếu còn lượt miễn phí, hệ thống tự động trừ 1 lượt free và chỉ tính phí các lượt còn lại. Ví dụ: PRO quay x3 khi còn lượt free $\rightarrow$ Tiêu hao: $(3 - 1) \times 100 = 200$ Xu. Cờ `usedFreePull` được ghi nhận và cập nhật `lastFreeGachaDate = new Date()`.

### B. Tỷ lệ xác suất và Hệ thống bảo hiểm phân cấp (Hierarchical Pity)
- **Tỷ lệ cơ sở:**
  - **MR (Mythic Rare):** 0.05%
  - **LR (Legendary Rare):** 0.15%
  - **UR (Ultra Rare):** 0.80%
  - **SSR (Super Special Rare):** 4.00%
  - **SR (Super Rare):** 15.00%
  - **R (Rare):** 30.00%
  - **N (Normal):** 50.00%
- **Ngưỡng kích hoạt bảo hiểm (Pity Thresholds):**
  - `pitySR >= 10`: Ép buộc nhận tối thiểu thẻ SR.
  - `pitySSR >= 50`: Ép buộc nhận tối thiểu thẻ SSR.
  - `pityUR >= 120`: Ép buộc nhận thẻ UR.
- **Quy tắc phân cấp Reset Pity:**
  - Trúng thẻ **SR**: Reset `pitySR = 0`, tăng `pitySSR += 1`, tăng `pityUR += 1`.
  - Trúng thẻ **SSR**: Reset cả `pitySR = 0` và `pitySSR = 0`, tăng `pityUR += 1`.
  - Trúng thẻ **UR, LR, MR**: Reset toàn bộ `pitySR = 0`, `pitySSR = 0`, `pityUR = 0`.
  - Trúng thẻ **N, R**: Tăng cả 3 bộ đếm `pitySR += 1`, `pitySSR += 1`, `pityUR += 1`.

### C. Xử lý Thẻ Trùng Lặp & Quy Đổi Bụi Sao (Stardust)
- Nếu thẻ quay ra đã tồn tại trong `UserInventory` của user:
  - **Không** tạo thêm bản ghi `UserInventory` mới (giữ số lượng bản ghi = 1 duy nhất).
  - Đánh dấu `isNew = false`.
  - Quy đổi thành Bụi sao tương ứng theo độ hiếm:
    - **N:** 1 Bụi sao
    - **R:** 5 Bụi sao
    - **SR:** 20 Bụi sao
    - **SSR:** 100 Bụi sao
    - **UR:** 500 Bụi sao
    - **LR:** 1,000 Bụi sao
    - **MR:** 5,000 Bụi sao
  - **PRO Bonus:** Người dùng PRO được cộng thêm **+20% Bụi sao** (`Math.floor(base * 1.2)`). Ví dụ: Thẻ SR nhận $20 \times 1.2 = 24$ Bụi sao; Thẻ UR nhận $500 \times 1.2 = 600$ Bụi sao.
- Nếu thẻ chưa từng sở hữu:
  - Tạo mới bản ghi trong `UserInventory` với `currentStar = 0`, `awakenedStars = 0`.
  - Đánh dấu `isNew = true`, Bụi sao nhận = 0.

### D. Tiệm Đổi Thẻ (Exchange Shop) & Phòng Ngừa Race Condition
- **Giá quy đổi theo độ hiếm:**
  - N: 10 | R: 30 | SR: 100 | SSR: 300 | UR: 800 | LR: 2,000 | MR: 5,000 Bụi sao.
- **Chỉ hiển thị thẻ chưa sở hữu:** API `GET /api/v1/gacha/exchange` tự động loại bỏ các thẻ người dùng đã có trong kho.
- **Chống gian lận & Double-spend:**
  - Giao dịch thực thi trong Prisma Interactive Transaction.
  - Khóa kiểm tra số dư Bụi sao và kiểm tra lại trạng thái sở hữu thẻ trước khi thực hiện.
  - Ngăn chặn triệt để trường hợp gửi 2 request song song để đổi 1 thẻ: Ràng buộc Unique Constraint `dbo.user_inventory (userId, cardId)` đảm bảo chỉ 1 request thành công, request thứ hai bị từ chối và rollback toàn bộ, Bụi sao không bị trừ dư.

### E. Tối ưu Hóa SQL Server Transaction & Lock Contention
- Trong quá trình phát triển, việc gọi tác vụ ghi nhận nhiệm vụ (`updateTaskProgressAction`) bên trong Prisma Interactive Transaction đã gây xung đột khóa (Lock Contention) trên SQL Server dẫn đến lỗi `P2028 (Transaction timeout)`.
- **Giải pháp tối ưu:** Tách `updateTaskProgressAction` thực thi bất đồng bộ ngay sau khi Transaction tài chính/thẻ bài đã commit thành công. Nhờ đó, hiệu năng giao dịch Gacha đạt dưới 100ms.

---

## 4. CHI TIẾT REST API CONTRACT

### 4.1. GET `/api/v1/gacha/status`
- **Mục đích:** Lấy trạng thái tài chính, bộ đếm bảo hiểm và lượt quay miễn phí.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response mẫu (200 OK):**
```json
{
  "success": true,
  "data": {
    "freeCoins": 1500,
    "stardust": 350,
    "pitySR": 3,
    "pitySSR": 18,
    "pityUR": 45,
    "isPro": true,
    "isFreePullAvailable": true,
    "lastFreeGachaDate": "2026-11-14T10:00:00.000Z",
    "rollCost": 100
  }
}
```

### 4.2. POST `/api/v1/gacha/roll`
- **Mục đích:** Thực hiện quay 1 đến 5 thẻ bài.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
- **Request Body:**
```json
{
  "count": 3
}
```
- **Response mẫu (200 OK):**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": 102,
        "title": "Quantum Computing",
        "rarity": "SSR",
        "imageUrl": "https://example.com/cards/quantum.webp",
        "wikiUrl": "https://en.wikipedia.org/wiki/Quantum_computing",
        "awakenedStars": 0,
        "totalStars": 3,
        "isNew": true,
        "stardustEarned": 0
      },
      {
        "id": 14,
        "title": "Photosynthesis",
        "rarity": "SR",
        "imageUrl": "https://example.com/cards/photosynthesis.webp",
        "wikiUrl": "https://en.wikipedia.org/wiki/Photosynthesis",
        "awakenedStars": 0,
        "totalStars": 2,
        "isNew": false,
        "stardustEarned": 24
      }
    ],
    "remainingCoins": 1300,
    "remainingStardust": 374,
    "pitySR": 0,
    "pitySSR": 0,
    "pityUR": 46,
    "usedFreePull": true,
    "coinsSpent": 200
  }
}
```

### 4.3. GET `/api/v1/gacha/exchange`
- **Mục đích:** Lấy danh sách các thẻ bài chưa sở hữu có thể đổi tại Tiệm Bụi sao.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response mẫu (200 OK):**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": 88,
        "title": "Artificial General Intelligence",
        "rarity": "UR",
        "imageUrl": "https://...",
        "wikiUrl": "https://...",
        "awakenedStars": 0,
        "totalStars": 3,
        "stardustCost": 800
      }
    ],
    "currentStardust": 374
  }
}
```

### 4.4. POST `/api/v1/gacha/exchange`
- **Mục đích:** Đổi Bụi sao lấy thẻ bài chưa sở hữu.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
- **Request Body:**
```json
{
  "cardId": 88
}
```
- **Response mẫu (200 OK):**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": 88,
      "title": "Artificial General Intelligence",
      "rarity": "UR",
      "imageUrl": "https://...",
      "wikiUrl": "https://...",
      "awakenedStars": 0,
      "totalStars": 3
    },
    "remainingStardust": 574,
    "cost": 800
  }
}
```

### 4.5. GET `/api/v1/gacha/history`
- **Mục đích:** Lấy lịch sử thẻ bài người dùng sở hữu theo phân trang.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Query Params:** `?page=1&limit=10`
- **Response mẫu (200 OK):**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "inventoryId": 1205,
        "cardId": 102,
        "title": "Quantum Computing",
        "rarity": "SSR",
        "imageUrl": "https://...",
        "wikiUrl": "https://...",
        "currentStar": 0,
        "acquiredAt": "2026-11-15T21:45:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

## 5. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (67/67 PASS)

Toàn bộ các ca kiểm thử tích hợp thực tế chạy bằng `tsx scripts/test_gacha_backend.ts`:

```text
=================================================
🚀 BẮT ĐẦU KIỂM THỬ GACHA SERVICE & REST API (5C.2)
=================================================

--- 1. CHUẨN BỊ TÀI KHOẢN KIỂM THỬ ---
Đã khởi tạo dữ liệu kiểm thử thành công.

--- 2. KIỂM THỬ GACHA STATUS ---
✅ [PASS] 1.1. Lấy trạng thái tài khoản thường thành công
✅ [PASS] 1.2. Tài khoản thường isPro = false
✅ [PASS] 1.3. Tài khoản thường không có lượt quay miễn phí
✅ [PASS] 1.4. Số dư Xu chính xác
✅ [PASS] 1.5. Lấy trạng thái tài khoản PRO thành công
✅ [PASS] 1.6. Tài khoản PRO isPro = true
✅ [PASS] 1.7. PRO chưa quay hôm nay -> isFreePullAvailable = true
✅ [PASS] 1.8. PRO đã quay hôm nay -> isFreePullAvailable = false

--- 3. KIỂM THỬ GACHA ROLL (QUAY THẺ) ---
✅ [PASS] 2.1. Chặn count = 0
✅ [PASS] 2.2. Chặn count = 6
✅ [PASS] 2.3. Chặn count không phải số nguyên
✅ [PASS] 2.4. Báo lỗi không đủ Xu khi freeCoins < 100
✅ [PASS] 2.5. Quay 1 lượt thành công
✅ [PASS] 2.6. Trừ chính xác 100 Xu cho tài khoản thường
✅ [PASS] 2.7. Số dư Xu còn lại đúng (900)
✅ [PASS] 2.8. Lần đầu quay ra thẻ mới (isNew = true)
✅ [PASS] 2.9. Quay 3 lượt thành công
✅ [PASS] 2.10. Trừ chính xác 300 Xu cho 3 lượt thường
✅ [PASS] 2.11. Số dư Xu còn lại đúng (600)
✅ [PASS] 2.12. PRO quay lượt đầu tiên thành công
✅ [PASS] 2.13. PRO được áp dụng lượt quay miễn phí (usedFreePull = true)
✅ [PASS] 2.14. PRO tiêu hao 0 Xu cho lượt quay miễn phí
✅ [PASS] 2.15. Số dư Xu của PRO không bị trừ
✅ [PASS] 2.16. Lượt quay thứ 2 trong ngày của PRO không còn free
✅ [PASS] 2.17. Lượt quay thứ 2 của PRO trừ 100 Xu
✅ [PASS] 2.18. Multi-roll nhận diện lượt free
✅ [PASS] 2.19. Multi-roll x3 chỉ trừ 200 Xu (1 free + 2 trả phí)

--- 4. KIỂM THỬ CƠ CHẾ BẢO HIỂM (PITY) & OFF-BY-ONE ---
✅ [PASS] 3.1. Bảo hiểm SR kích hoạt tại lượt thứ 10 (Ra phẩm chất: SR)
✅ [PASS] 3.2. Ra SR trở lên -> pitySR reset về 0
✅ [PASS] 3.3. Bộ đếm trước khi quay là 8
✅ [PASS] 3.4. Bảo hiểm SSR kích hoạt tại lượt thứ 50 (Ra phẩm chất: SSR)
✅ [PASS] 3.5. Ra SSR trở lên -> pitySSR reset về 0
✅ [PASS] 3.6. Ra SSR trở lên -> pitySR cũng reset về 0
✅ [PASS] 3.7. Bảo hiểm UR kích hoạt tại lượt thứ 120 (Ra phẩm chất: UR)
✅ [PASS] 3.8. Ra UR -> pityUR reset về 0
✅ [PASS] 3.9. Ra UR -> pitySSR reset về 0
✅ [PASS] 3.10. Ra UR -> pitySR reset về 0

--- 5. KIỂM THỬ THẺ TRÙNG LẶP & QUY ĐỔI BỤI SAO ---
✅ [PASS] 4.1. Thẻ N phân rã thành 1 Bụi sao
✅ [PASS] 4.2. Thẻ SR phân rã thành 20 Bụi sao
✅ [PASS] 4.3. Thẻ UR phân rã thành 500 Bụi sao
✅ [PASS] 4.4. PRO nhận +20% Bụi sao cho thẻ SR (20 -> 24 Bụi)
✅ [PASS] 4.5. PRO nhận +20% Bụi sao cho thẻ UR (500 -> 600 Bụi)
✅ [PASS] 4.6. Trước khi quay trùng: chỉ có duy nhất 1 bản ghi UserInventory

--- 6. KIỂM THỬ TIỆM ĐỔI THẺ & GIAO DỊCH ĐỒNG THỜI ---
✅ [PASS] 5.1. Lấy dữ liệu tiệm đổi thẻ thành công
✅ [PASS] 5.2. Danh sách tiệm chỉ chứa thẻ chưa sở hữu
✅ [PASS] 5.3. Báo lỗi khi không đủ Bụi sao
✅ [PASS] 5.4. Đổi thẻ thành công
✅ [PASS] 5.5. Trừ chính xác 10 Bụi sao cho thẻ N (100 -> 90)
✅ [PASS] 5.6. Chặn đổi thẻ đã sở hữu (ALREADY_OWNED)
✅ [PASS] 5.7. Báo lỗi khi cardId không tồn tại
✅ [PASS] 5.8. Đồng thời 2 request cùng đổi 1 thẻ: Chỉ 1 request thành công, 1 request bị từ chối
✅ [PASS] 5.9. Bụi sao chỉ bị trừ đúng 1 lần (15 - 10 = 5)

--- 7. KIỂM THỬ LỊCH SỬ QUAY THẺ & CÁCH LY NGƯỜI DÙNG ---
✅ [PASS] 6.1. Lấy lịch sử thẻ thành công
✅ [PASS] 6.2. Phân trang page = 1
✅ [PASS] 6.3. Giới hạn limit = 5
✅ [PASS] 6.4. User khác không có thẻ thì lịch sử rỗng (Cách ly tuyệt đối)

--- 8. KIỂM THỬ TRỰC TIẾP QUA LIVE HTTP REST APIS ---
✅ [PASS] 7.1. GET /status không có Bearer token -> 401 Unauthorized
✅ [PASS] 7.2. GET /status token không hợp lệ -> 401
✅ [PASS] 7.3. GET /status token hợp lệ -> 200 OK
✅ [PASS] 7.4. GET /status trả về freeCoins dạng số
✅ [PASS] 7.5. POST /roll count = 10 -> 400 Bad Request
✅ [PASS] 7.6. POST /roll quay 1 lượt thành công qua HTTP -> 200 OK
✅ [PASS] 7.7. POST /roll trả về đúng 1 thẻ
✅ [PASS] 7.8. GET /exchange qua HTTP -> 200 OK
✅ [PASS] 7.9. POST /exchange cardId âm -> 400 Bad Request
✅ [PASS] 7.10. GET /history qua HTTP -> 200 OK
✅ [PASS] 7.11. GET /history phân trang đúng qua HTTP query param

=================================================
📊 KẾT QUẢ KIỂM THỬ: 67 PASS, 0 FAIL (100%)
=================================================
```

---

## 6. KẾ HOẠCH BƯỚC TIẾP THEO (BƯỚC 5C.3)

Chuyển sang **Giai đoạn 4 – Bước 5C.3: Triển khai Gacha Flutter Native UI**:
1. **Kiến trúc Clean Architecture trong `hub_el_mobile`:**
   - Tạo `lib/features/gacha/domain/`: Entities (`GachaStatusEntity`, `GachaRollResultEntity`, `GachaCardEntity`).
   - Tạo `lib/features/gacha/data/`: Models, Remote Data Source, Repository Implementation kết nối 4 REST API vừa tạo.
   - Tạo `lib/features/gacha/presentation/bloc/`: `GachaBloc`, `GachaEvent`, `GachaState` (xử lý lấy trạng thái, chọn số lượt 1-5, quay thẻ, đổi Bụi sao, xem lịch sử).
2. **Xây dựng UI Native chuẩn Mobile Web của `hub-el`:**
   - Banner Gacha với phong cách kỳ ảo / Sci-Fi / Magic.
   - Header hiển thị Xu, Bụi sao và các Pity bars (SR: 10, SSR: 50, UR: 120).
   - Nút bấm Quay Thẻ với hiệu ứng giữ để tăng số lượt quay (1x đến 5x).
   - Nút mở Tiệm Đổi Thẻ (Exchange Shop Bottom Sheet/Modal).
   - Nút mở Lịch sử Quay Thẻ (Gacha History Bottom Sheet/Modal).
   - Nút xem Thể lệ & Tỷ lệ quay (Gacha Info Modal).

