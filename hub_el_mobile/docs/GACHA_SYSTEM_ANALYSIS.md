# BÁO CÁO PHÂN TÍCH HỆ THỐNG GACHA (BƯỚC 5C.1)
## GACHA SYSTEM ARCHITECTURE & BUSINESS RULES SPECIFICATION

> **Dự án tham chiếu:** `hub-el` (Next.js App Router, Prisma ORM, SQL Server)  
> **Dự án triển khai:** `hub_el_mobile` (Flutter Native Android)  
> **Mục tiêu:** Phân tích trọn vẹn nghiệp vụ, cấu trúc dữ liệu, tỷ lệ quay, hệ thống bảo hiểm (pity), tiền tệ, cửa hàng đổi bụi sao và giao diện Mobile Web trước khi lập trình Backend Service và Flutter Native UI.

---

### 1. KIẾN TRÚC DỮ LIỆU PRISMA DATABASE

Trong cơ sở dữ liệu `prisma/schema.prisma` hiện tại, hệ thống Gacha gắn kết chặt chẽ với 4 bảng:

#### 1.1. Model `User` (Thông tin tài khoản & Bộ đếm Pity)
```prisma
model User {
  id                String    @id @default(cuid())
  freeCoins         Int       @default(0)     // [1] Xu Gacha: Tiêu hao 100 Xu / lượt quay
  stardust          Int       @default(0)     // [2] Bụi Sao: Nhận được khi trùng thẻ, dùng đổi thẻ
  pitySR            Int       @default(0)     // Đếm bảo hiểm SR (đạt 10 -> ra SR)
  pitySSR           Int       @default(0)     // Đếm bảo hiểm SSR (đạt 50 -> ra SSR)
  pityUR            Int       @default(0)     // Đếm bảo hiểm UR (đạt 120 -> ra UR)
  isPro             Boolean   @default(false) // Đặc quyền VIP: 1 lượt quay miễn phí/ngày, +20% Bụi sao
  lastFreeGachaDate DateTime?                 // Mốc thời gian đã nhận lượt quay free hôm nay
  inventory         UserInventory[]
  stats             UserStats?
}
```

#### 1.2. Model `WikiCard` (Thẻ bài kiến thức)
```prisma
model WikiCard {
  id            Int             @id @default(autoincrement())
  title         String          // Tên bài học / chủ đề Wikipedia
  rarity        String          // 'N', 'R', 'SR', 'SSR', 'UR', 'LR', 'MR'
  imageUrl      String?         // Link ảnh minh họa
  wikiUrl       String?         // Link bài viết Wikipedia
  totalStars    Int             @default(1)
  awakenedStars Int             @default(0)
  owners        UserInventory[]
}
```

#### 1.3. Model `UserInventory` (Tủ đồ sở hữu thẻ)
```prisma
model UserInventory {
  id             Int      @id @default(autoincrement())
  userId         String
  cardId         Int
  acquiredAt     DateTime @default(now())   // Ngày giờ nhận thẻ (dùng cho lịch sử)
  isNew          Boolean  @default(true)    // Đánh dấu thẻ mới
  currentStar    Int      @default(0)       // Tiến độ học
  source         String   @default("GACHA") // "GACHA" hoặc "SHARED" hoặc "EXCHANGE"
  isCompleted    Boolean  @default(false)
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  card           WikiCard @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@unique([userId, cardId]) // Chống trùng lặp: mỗi user chỉ giữ 1 bản ghi của thẻ
}
```

#### 1.4. Model `UserStats` (Thống kê tích lũy)
```prisma
model UserStats {
  id              Int    @id @default(autoincrement())
  userId          String @unique
  totalGachaPulls Int    @default(0) // Tổng số lần quay
  totalCoinsSpent Int    @default(0) // Tổng số Xu đã tiêu
}
```

---

### 2. CƠ CHẾ TIỀN TỆ & QUYỀN LỢI VIP (PRO)

1. **Phí Quay Gacha**:
   - `ROLL_COST = 100 Xu` (`freeCoins`).
   - Kiểm tra số dư: Người dùng phải có đủ `user.freeCoins >= 100`.
2. **Đặc quyền PRO (VIP)**:
   - **Quay miễn phí hàng ngày (Daily Free Roll)**:
     - Nếu `user.isPro = true` và `lastFreeGachaDate` khác ngày hôm nay -> Lượt quay đầu tiên tiêu tốn **0 Xu** (`isFreePull = true`).
     - Cập nhật `lastFreeGachaDate = new Date()`.
   - **Tặng thêm Bụi Sao (+20% Bụi Sao)**:
     - Khi quay trùng thẻ, lượng bụi sao nhận được sẽ tăng thêm 20%: `stardust = Math.floor(stardustValue * 1.2)`.

---

### 3. TỶ LỆ XÁC SUẤT QUAY THƯỞNG (GACHA RATES)

Thuật toán sinh số ngẫu nhiên `roll = Math.random() * 100` phân bổ theo 7 bậc độ hiếm:

| Độ Hiếm | Tên Bậc | Khoảng Xác Suất | Tỉ Lệ (%) | Phân Loại & Mô Tả | Màu Sắc Đại Diện |
|:---:|:---|:---:|:---:|:---|:---|
| **MR** | Master Rare | `0.00 <= roll < 0.05` | **0.05%** | Cực kỳ dài (Đỉnh cao) | Gradient 3 màu Đỏ - Vàng - Tím |
| **LR** | Legendary Rare | `0.05 <= roll < 0.20` | **0.15%** | Siêu dài | Hồng / Xanh ngọc (`#14b8a6`) |
| **UR** | Ultra Rare | `0.20 <= roll < 1.00` | **0.80%** | Rất dài | Đỏ tươi (`#ef4444`) |
| **SSR** | Super Special Rare | `1.00 <= roll < 5.00` | **4.00%** | Dài | Vàng hổ phách (`#f59e0b`) |
| **SR** | Super Rare | `5.00 <= roll < 20.00` | **15.00%** | Khá dài | Tím thạch anh (`#a855f7`) |
| **R** | Rare | `20.00 <= roll < 50.00` | **30.00%** | Trung bình | Xanh dương (`#3b82f6`) |
| **N** | Normal | `50.00 <= roll < 100.00` | **50.00%** | Cơ bản | Xám / Bạc (`#94a3b8`) |

---

### 4. CƠ CHẾ BẢO HIỂM BẢO ĐẢM (PITY SYSTEM)

Hệ thống bảo hiểm ngăn ngừa vận rủi dài ngày với 3 mốc độc lập:

1. **Bảo hiểm SR (`pitySR >= 10`)**:
   - Nếu sau 9 lượt quay liên tiếp không ra SR hoặc cao hơn, lượt thứ 10 **chắc chắn ra SR**.
2. **Bảo hiểm SSR (`pitySSR >= 50`)**:
   - Nếu sau 49 lượt quay liên tiếp không ra SSR hoặc cao hơn, lượt thứ 50 **chắc chắn ra SSR**.
3. **Bảo hiểm UR (`pityUR >= 120`)**:
   - Nếu sau 119 lượt quay liên tiếp không ra UR hoặc cao hơn, lượt thứ 120 **chắc chắn ra UR**.

#### Quy tắc Reset Bộ Đếm Pity:
- Khi nhận được thẻ có phẩm chất tương đương hoặc cao hơn, bộ đếm tương ứng sẽ **reset về 0**:
  - Nhận **SR**: Reset `pitySR = 0` (giữ nguyên `pitySSR`, `pityUR`).
  - Nhận **SSR**: Reset `pitySR = 0`, `pitySSR = 0` (giữ nguyên `pityUR`).
  - Nhận **UR**, **LR**, **MR**: Reset toàn bộ `pitySR = 0`, `pitySSR = 0`, `pityUR = 0`.

---

### 5. QUY TẮC PHÂN RÃ TRÙNG THẺ & BỤI SAO (STARDUST)

Khi người dùng quay trúng thẻ đã sở hữu trong `UserInventory`:
- Thẻ không tạo bản ghi mới (do ràng buộc `@@unique([userId, cardId])`).
- Hệ thống tự động phân rã thẻ thành **Bụi Sao (`stardust`)** tỉ lệ thuận theo phẩm chất:

| Phẩm Chất | Bụi Sao Thường | Bụi Sao PRO VIP (+20%) |
|:---:|:---:|:---:|
| **N** | +1 Bụi | +1 Bụi |
| **R** | +5 Bụi | +6 Bụi |
| **SR** | +20 Bụi | +24 Bụi |
| **SSR** | +100 Bụi | +120 Bụi |
| **UR** | +500 Bụi | +600 Bụi |
| **LR** | +1,000 Bụi | +1,200 Bụi |
| **MR** | +5,000 Bụi | +6,000 Bụi |

---

### 6. CỬA HÀNG ĐỔI THẺ BẰNG BỤI SAO (EXCHANGE SHOP)

Người dùng có thể dùng Bụi Sao để chuộc/đổi trực tiếp các thẻ mình **chưa sở hữu**:
- Giá đổi thẻ theo bảng `RARITY_COST`:
  - **MR**: `5,000 Bụi sao`
  - **LR**: `2,000 Bụi sao`
  - **UR**: `800 Bụi sao`
  - **SSR**: `300 Bụi sao`
  - **SR**: `100 Bụi sao`
  - **R**: `30 Bụi sao`
  - **N**: `10 Bụi sao`
- Danh sách thẻ trong tiệm chỉ bao gồm thẻ **User chưa sở hữu** (`NOT: { owners: { some: { userId: userId } } }`), gom nhóm theo Tier từ MR xuống N.
- Đổi thẻ thực hiện bằng **Prisma Transaction ACID**: Trừ `stardust` của User và `create` bản ghi mới trong `UserInventory`.

---

### 7. LỊCH SỬ QUAY THẺ & SỔ SƯU TẬP (INVENTORY BOOK)

- Truy vấn `getGachaHistory(userId)`: Lấy các thẻ đã quay theo thứ tự `acquiredAt desc` (giới hạn 1000 bản ghi để tối ưu hiệu năng).
- Trên Mobile Web: Hiển thị dạng **Sổ Sưu Tập Wiki** phong cách trang sách 2 mặt (8 thẻ/trang: 4 trái, 4 phải).
- Người dùng có thể nhấn vào thẻ trong sổ để mở hộp thoại chuyển nhanh sang phòng học AI (`Khai phá tri thức -> Học ngay`).

---

### 8. LUỒNG QUAY THẺ & GIAO DIỆN MOBILE WEB (UI/UX)

#### 8.1. Cơ chế Multi-roll (Quay x1 đến x5)
- Nút bấm chính "Tìm Tri Thức":
  - **Nhấn một lần (Tap)**: Quay x1 thẻ (100 Xu).
  - **Nhấn giữ (Hold / Press & Hold)**: Bộ đếm `rollCount` tăng dần từ 1 lên tối đa 5 (mỗi 250ms tăng 1 nấc). Nhả tay sẽ bắt đầu quay với số lượng tương ứng.

#### 8.2. Cỗ máy trạng thái Animation 4 Giai đoạn:
1. `idle`: Màn hình chờ với khung cảnh thiên nhiên, cây thần fractal phát sáng, sao/mây trôi, nút quay và các nút phụ.
2. `drawing`: 
   - Vẽ khung ánh sáng vector bao quanh thẻ (`CardFrameSVG` viền neon phát sáng).
   - Lá cây fractal thu về 4 góc của khung thẻ.
3. `spinning`:
   - Thẻ trắng xoay 3D (`whiteCardSpin`) phát sáng hào quang 360 độ trong 0.8s.
4. `revealed`:
   - Lật ra thẻ thật (`WikiCard3D`).
   - Nếu là thẻ mới: Hiển thị huy hiệu `NEW!` viền đỏ nảy động (bounce).
   - Nếu là thẻ trùng: Hiển thị thông báo màu cam `Trùng lặp (+... Bụi sao)`.
   - Chạm vào màn hình để đóng và quay lại `idle`.

#### 8.3. Ba Modal Chức Năng:
- **`InfoModal`**: Bảng xác suất triệu hồi, cơ chế bảo hiểm Pity và quy tắc bụi sao.
- **`ExchangeModal`**: Tiệm đổi thẻ bằng bụi sao, chọn thẻ -> xác nhận -> animation lật thẻ thành công.
- **`InventoryModal`**: Sổ lật trang lịch sử thẻ đã nhận.

---

### 9. KẾ HOẠCH TRIỂN KHAI CÁC BƯỚC TIẾP THEO

- **Bước 5C.2: Xây dựng Backend Service & REST API**:
  - Tạo `src/services/gacha.service.ts` dùng chung giữa Web Server Actions và REST API.
  - Tạo 3 REST route handlers:
    1. `GET /api/v1/gacha/status`: Lấy số Xu, Bụi sao, Pity hiện tại, quyền PRO và lượt quay free.
    2. `POST /api/v1/gacha/roll`: Xử lý quay thẻ (hỗ trợ count 1..5), trừ Xu, tính Pity, phân rã Bụi Sao.
    3. `GET /api/v1/gacha/exchange`: Lấy số Bụi Sao và danh sách thẻ chưa sở hữu phân theo bậc.
    4. `POST /api/v1/gacha/exchange`: Đổi thẻ bằng Bụi Sao (ACID transaction).
    5. `GET /api/v1/gacha/history`: Lấy lịch sử sở hữu thẻ.
  - Viết script test độc lập kiểm chứng 100% các API.
- **Bước 5C.3: Triển khai Gacha Flutter Native UI**:
  - Clean Architecture Feature-First (`lib/features/gacha/`).
  - BLoC điều phối trạng thái tiền tệ, Pity, Multi-roll và Modals.
  - Màn hình Gacha chính với giao diện Mobile Web chuẩn mực.
- **Bước 5C.4: Animation quay thưởng, kết quả và kiểm thử**:
  - Vẽ khung ánh sáng vector, thẻ xoay 3D lật mặt.
  - Modal Đổi Bụi Sao, Modal Chi Tiết Tỷ Lệ, Modal Sổ Sưu Tập.
  - Kiểm thử `flutter test` và quay video/chụp ảnh trên Android Emulator.

