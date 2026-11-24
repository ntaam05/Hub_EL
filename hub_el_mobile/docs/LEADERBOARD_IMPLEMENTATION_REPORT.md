# BÁO CÁO TRIỂN KHAI BƯỚC 5D.6: LEADERBOARD BACKEND SERVICE & FLUTTER NATIVE

**Dự án:** `hub-el` (Backend / Web) & `hub_el_mobile` (Flutter Native Android)  
**Giai đoạn:** 5 – Social & Community  
**Bước:** 5D.6  
**Ngày thực hiện:** 21/11/2026  
**Trạng thái:** ✅ **HOÀN THÀNH TOÀN DIỆN (100% SUCCESS)**

---

## 1. TỔNG QUAN VÀ MỤC TIÊU

Triển khai hoàn chỉnh tính năng Bảng xếp hạng (Leaderboard) theo kiến trúc dùng chung đa nền tảng:
1. **Backend Service (`src/services/leaderboard.service.ts`):** Bảo tồn nguyên vẹn 100% công thức tính toán, quy tắc xếp hạng, phân loại thời gian và cơ chế tie-break hiện tại từ Web.
2. **REST API Bridge (`GET /api/v1/leaderboard`):** Xác thực an toàn bằng JWT Bearer Token, chống IDOR, trả dữ liệu chuẩn hóa cho thiết bị di động.
3. **Web Server Action Refactor (`src/actions/leaderboard.ts`):** Chuyển đổi gọi hàm qua shared service mà không gây bất kỳ ảnh hưởng nào đến Desktop/Mobile Web.
4. **Flutter Native Module (`lib/features/leaderboard/`):** Xây dựng theo Feature-First Clean Architecture + BLoC/Cubit, giao diện bám sát Mobile Web với Bục vinh danh (Top 3 Podium: Quán quân Vàng có vương miện ở giữa, Á quân Bạc bên trái, Quý quân Đồng bên phải), danh sách thứ hạng 4–50 và thanh ghim thứ hạng cá nhân (`StickyCurrentUserRank`).
5. **Tích hợp Shell Navigation:** Thay thế hoàn toàn màn hình giữ chỗ tại Tab 4 (Xếp hạng) trong `MainShellScreen`.

---

## 2. KIẾN TRÚC BACKEND SERVICE & CÔNG THỨC XẾP HẠNG

### 2.1. Phân loại Category & Timeframe
Bảng xếp hạng hỗ trợ 4 hạng mục (`Category`) và 4 khung thời gian (`Timeframe`):
- **Hạng mục (`category`):**
  - `GRINDER` (Cày cuốc): Xếp hạng theo lượng Kinh nghiệm (XP) tích lũy.
  - `STREAK` (Chuỗi ngày): Xếp hạng theo chuỗi ngày học liên tục (`streakCount`).
  - `TIME` (Chăm chỉ): Xếp hạng theo thời lượng học tập tính bằng phút (`timeSpentMinutes`).
  - `AI_KILLER` (Sát thủ AI): Xếp hạng theo số lượng trùm AI đã đánh bại hoặc số câu hỏi trả lời đúng.
- **Khung thời gian (`timeframe`):**
  - `DAY`: Tính trong ngày hiện tại.
  - `WEEK`: Tính từ đầu tuần (Thứ 2) đến hiện tại.
  - `MONTH`: Tính từ đầu tháng đến hiện tại.
  - `ALL`: Toàn bộ thời gian (Lifetime).

### 2.2. Xử lý chuẩn hóa múi giờ SQL Server `@db.Date`
Trường `date` trong bảng `DailyStat` được khai báo dạng `@db.Date` trong SQL Server (chỉ lưu phần ngày YYYY-MM-DD không lưu giờ). Để tránh chênh lệch -7 giờ khi dùng `new Date().setHours(0,0,0,0)` ở múi giờ Việt Nam (UTC+7), service sử dụng công thức chuẩn hóa:
```typescript
const now = new Date();
const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
const startOfToday = new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate()));
```

### 2.3. Quy tắc Tie-break và Giới hạn Top 50
- **Ưu tiên xếp hạng:** `scoreValue` (Giảm dần) ➔ `level` (Giảm dần) ➔ `userId` (Tăng dần - xác định ổn định tuyệt đối).
- **Quyền riêng tư & Bảo mật:**
  - Không để lộ thông tin nhạy cảm (`passwordHash`, `email`, token...).
  - Chỉ trả về: `id`, `name`, `image`, `level`, `isPro`, `score`, `rank`, `isCurrentUser`.
  - Tính toán chính xác vị trí của người dùng hiện tại (`currentUser`) bất kể người đó nằm trong Top 50 hay ở ngoài Top 50.

---

## 3. THIẾT KẾ REST API BRIDGE

- **Endpoint:** `GET /api/v1/leaderboard?category=GRINDER&range=WEEK`
- **Xác thực:** Header `Authorization: Bearer <jwt_access_token>`.
- **Response Format:**
```json
{
  "success": true,
  "data": {
    "category": "GRINDER",
    "range": "WEEK",
    "generatedAt": "2026-11-21T06:30:00.000Z",
    "topPlayers": [
      {
        "id": "u1",
        "name": "Nguyễn Văn A",
        "image": "https://...",
        "level": 15,
        "isPro": true,
        "score": "1,250 XP",
        "scoreValue": 1250,
        "rank": 1,
        "isCurrentUser": false
      }
    ],
    "currentUser": {
      "id": "my_uid",
      "name": "Tôi",
      "level": 5,
      "isPro": false,
      "score": "320 XP",
      "scoreValue": 320,
      "rank": 8,
      "isCurrentUser": true
    }
  }
}
```

---

## 4. KIẾN TRÚC FLUTTER NATIVE (`hub_el_mobile`)

Module được cấu trúc chuẩn hóa theo Feature-First Clean Architecture tại `lib/features/leaderboard/`:

```
lib/features/leaderboard/
├── data/
│   ├── datasources/
│   │   └── leaderboard_remote_data_source.dart  # Gọi REST API qua DioClient
│   ├── models/
│   │   └── leaderboard_model.dart               # Parse JSON -> Entity
│   └── repositories/
│       └── leaderboard_repository_impl.dart     # Triển khai Repository
├── domain/
│   ├── entities/
│   │   └── leaderboard_entity.dart              # Entities & Enums (Category, Timeframe)
│   ├── repositories/
│   │   └── leaderboard_repository.dart          # Contract Repository
│   └── usecases/
│       └── get_leaderboard_use_case.dart        # UseCase tải bảng xếp hạng
└── presentation/
    ├── cubit/
    │   ├── leaderboard_cubit.dart               # Quản lý state chuyển đổi tab, refresh
    │   └── leaderboard_state.dart               # Trạng thái Immutable
    ├── screens/
    │   └── leaderboard_screen.dart              # Màn hình chính CustomScrollView + Sliver
    └── widgets/
        ├── category_selector_widget.dart        # Thanh chọn 4 danh mục ngang (Pills)
        ├── timeframe_selector_widget.dart       # Bộ chọn 4 khung thời gian (Segmented)
        ├── podium_widget.dart                   # Bục vinh danh Top 3 (Hạng 1 ở giữa, cao nhất)
        ├── leaderboard_row_item.dart            # Dòng hiển thị thứ hạng 4 đến 50
        └── sticky_current_user_rank.dart        # Thẻ ghim vị trí cá nhân cố định ở đáy
```

### Điểm nổi bật UI:
- **Top 3 Podium:**
  - Hạng 1 (Quán quân): Nằm ở giữa, bục cao nhất (140px), vương miện vàng (`LucideIcons.crown`), viền phát sáng Amber.
  - Hạng 2 (Á quân): Nằm bên trái, bục cao 100px, huy hiệu bạc Slate.
  - Hạng 3 (Quý quân): Nằm bên phải, bục cao 85px, huy hiệu đồng Orange/Amber.
- **Thanh ghim thứ hạng cá nhân (`StickyCurrentUserRank`):** Hiển thị cố định phía trên Bottom Navigation, viền Indigo/Blue, làm nổi bật ngay tức thì thứ hạng của bạn dù bạn đang cuộn danh sách ở bất kỳ vị trí nào.

---

## 5. KẾT QUẢ KIỂM THỬ VÀ XÁC MINH

### 5.1. Backend Service & REST API Test Suite (`test_leaderboard_backend.ts`)
- Đã chạy 29 kịch bản kiểm thử toàn diện:
  - 16/16 Matrix kết hợp (4 Category × 4 Timeframe).
  - Kiểm tra thứ hạng Top 3 và tie-break.
  - Kiểm tra quyền riêng tư (không rò rỉ password/email).
  - Kiểm tra thứ hạng người dùng hiện tại (`currentUser`).
  - Kiểm tra bảo mật REST API (yêu cầu Bearer Token, từ chối không có token 401).
  - Kiểm tra tương thích ngược Server Action `getLeaderboardData`.
- **Kết quả:** **29/29 PASS (100%)**.

### 5.2. Flutter Unit & Widget Test Suite (`leaderboard_test.dart`)
- Kiểm thử phân tích Model và Entity JSON.
- Kiểm thử BLoC/Cubit chuyển đổi trạng thái khi chọn Category và Timeframe.
- Kiểm thử Widget rendering: `CategorySelectorWidget`, `TimeframeSelectorWidget`, `PodiumWidget`, `LeaderboardRowItem`, `StickyCurrentUserRank`.
- Kiểm thử hồi quy (`friends_test.dart`, `chat_test.dart`).
- **Kết quả:** **50/50 Tests PASS (100%)**.

### 5.3. Flutter Code Analysis
- `flutter analyze lib/features/leaderboard/ lib/main.dart lib/features/dashboard/`
- **Kết quả:** `No issues found! (0 errors, 0 warnings)`.

---

## 6. KẾT LUẬN

Bước 5D.6 đã hoàn thành xuất sắc toàn bộ các tiêu chí đề ra. Toàn bộ tính năng Bảng xếp hạng đã sẵn sàng, vận hành ổn định trên cả Backend Web lẫn Flutter Native Android.

