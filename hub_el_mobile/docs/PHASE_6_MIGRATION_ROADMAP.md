# LỘ TRÌNH CHUYỂN ĐỔI CHI TIẾT
# PHASE 6 – MIGRATION ROADMAP
**Dự án:** Chuyển đổi toàn diện Hub-EL từ Next.js Web sang Flutter Native App  
**Tài liệu tham chiếu:** `docs/PHASE_6_REMAINING_FEATURES_AUDIT.md`  
**Ngày lập:** 21/11/2026  
**Trạng thái:** Kế hoạch thực thi (Actionable Plan)

---

## 1. MỤC TIÊU TỔNG QUÁT CỦA GIAI ĐOẠN 6

Hoàn thiện 100% các tính năng người dùng còn lại của hệ thống Hub-EL trên nền tảng **Flutter Native**, bao gồm:
1. **Cửa hàng & Kinh tế (Store & Economy)**: Đổi tài nguyên tức thì, Gói VIP PRO, Nạp Ngọc MoMo.
2. **Hệ thống Thành tựu (Achievements System)**: 64 huy hiệu, 6 Tier, tự động tính tiến độ và nhận thưởng.
3. **Kho Từ Vựng Cá Nhân (Vocabulary Notebook)**: Tra cứu A-Z, lọc ngôn ngữ, phát âm TTS, xem ngữ cảnh bài học gốc.
4. **Cài đặt, Hồ sơ & Bảo mật (Settings & Account Management)**: Chỉnh sửa thông tin, đổi avatar, đổi mật khẩu / OTP Gmail, quyền riêng tư, thông báo, góp ý.
5. **Kiểm toán tích hợp toàn diện (Final System Integration & Polish)**.

---

## 2. NGUYÊN TẮC BẮT BUỘC TRONG SUỐT GIAI ĐOẠN 6

1. **Flutter Native hoàn toàn:** Tuyệt đối không dùng WebView để hiển thị giao diện Store, Achievements hay Settings. Toàn bộ UI phải viết bằng widget Flutter Native chuẩn Dark Theme / Tailwind palette.
2. **Feature-First Clean Architecture:** Mỗi module tách bạch `data/`, `domain/`, `presentation/` với BLoC/Cubit tương ứng.
3. **JWT Bearer Authentication:** Mọi yêu cầu gọi từ Flutter đều thông qua `DioClient` với Bearer Token được ký bằng `JWT_SECRET`. Không tin tưởng `userId` do client truyền lên; luôn lấy danh tính từ JWT.
4. **Bảo tồn cơ sở dữ liệu:** Không tự ý thay đổi `prisma/schema.prisma` hoặc tạo bảng mới. Tận dụng 100% các bảng và trường hiện có (`orders`, `coin_transactions`, `achievements`, `user_achievements`, `verification_codes`, `feedbacks`...).
5. **Dùng chung Shared Service:** Viết các Shared Services tại `src/services/` trong Backend `hub-el`, dùng chung cho cả Server Actions (Web) và REST Route Handlers (Flutter).
6. **Thanh toán MoMo:** Sử dụng deep link mở ứng dụng MoMo trên thiết bị hoặc fallback sang Web Checkout nếu chưa cài ứng dụng, kèm cơ chế kiểm tra đơn hàng tự động để cộng tài nguyên an toàn.

---

## 3. LỘ TRÌNH TRIỂN KHAI TỪNG BƯỚC

```
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 6.2: Shared Services & REST API Bridges                           │
│ (Store, Achievements, Vocabulary, Settings)                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 6.3: Store & Economy Flutter Native                                │
│ (Đổi tài nguyên, Gói VIP PRO, Nạp Ngọc MoMo, Deeplink)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 6.4: Achievements System Flutter Native                           │
│ (64 Huy hiệu, 6 Tier, Tabs Tiến độ / Đã mở khóa, Popup phần thưởng)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 6.5: Vocabulary Notebook (Kho Từ Vựng) Flutter Native             │
│ (Danh sách từ vựng cá nhân, Tra cứu A-Z, Phát âm TTS, Ngữ cảnh)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 6.6: Settings, Profile & Security Flutter Native                  │
│ (Sửa hồ sơ, Đổi avatar, Đổi mật khẩu / OTP Gmail, Quyền riêng tư)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 6.7: Final Regression, Performance & System Integration Audit     │
│ (Kiểm thử hồi quy toàn diện, dọn dẹp tài nguyên, đóng gói hoàn chỉnh) │
└────────────────────────────────────────────────────────────────────────┘
```

---

### BƯỚC 6.2: SHARED SERVICES & REST API BRIDGES
* **Mục tiêu:** Xây dựng tầng dịch vụ nghiệp vụ dùng chung và các REST API endpoints chuẩn hóa cho 4 module còn thiếu.
* **Công việc cụ thể:**
  1. Tạo `src/services/store.service.ts`:
     - Xử lý đổi tài nguyên với `prisma.$transaction`.
     - Tạo đơn thanh toán MoMo và kiểm tra trạng thái đơn hàng.
  2. Tạo `src/services/achievements.service.ts`:
     - Logic kiểm tra 64 thành tựu theo `ACHIEVEMENT_LIST`, cộng thưởng XP/Xu/Energy tự động.
  3. Tạo `src/services/vocabulary.service.ts`:
     - Lấy danh sách từ vựng cá nhân từ `user_inventory`, trích xuất ngữ cảnh bài học.
  4. Tạo `src/services/settings.service.ts`:
     - Cập nhật profile, avatar base64, gửi OTP qua nodemailer, đổi mật khẩu bcrypt, quyền riêng tư, thông báo, góp ý.
  5. Xây dựng Route Handlers:
     - `/api/v1/store/packages`, `/api/v1/store/exchange`, `/api/v1/store/momo/create`, `/api/v1/store/momo/check-status`.
     - `/api/v1/achievements`.
     - `/api/v1/vocabulary`, `/api/v1/vocabulary/context`.
     - `/api/v1/settings/profile`, `/api/v1/settings/avatar`, `/api/v1/settings/security/*`, `/api/v1/settings/privacy`, `/api/v1/settings/notifications`, `/api/v1/feedback`.
* **Tiêu chí nghiệm thu (DoD):**
  - Mọi API đều trả về format chuẩn `{ "success": true, "data": ... }`.
  - Kiểm thử curl/script thành công 100% với JWT Bearer token của user test.
  - Server Actions cũ của Website không bị ảnh hưởng.

---

### BƯỚC 6.3: STORE & ECONOMY FLUTTER NATIVE UI
* **Mục tiêu:** Xây dựng màn hình Cửa hàng bản địa trên Flutter thay thế placeholder hiện tại.
* **Công việc cụ thể:**
  1. Tạo `features/store/data`: Models `StorePackageModel`, `ExchangeRuleModel`, DataSources, Repositories.
  2. Tạo `features/store/presentation/cubit/store_cubit.dart`: Quản lý số dư ví, danh sách gói, trạng thái thanh toán.
  3. Tạo `features/store/presentation/screens/store_screen.dart`:
     - Tab 1: **Đổi Tài Nguyên** (Ngọc -> Năng lượng/Xu, Xu -> Năng lượng) với hộp thoại xác nhận số lượng và hiệu ứng thành công.
     - Tab 2: **Gói VIP PRO** (1 tháng / 6 tháng / 1 năm) kèm danh sách 6 đặc quyền VIP, nút bấm mua qua MoMo.
     - Tab 3: **Nạp Ngọc** (Các mệnh giá từ 20k đến 500k).
  4. Tích hợp thanh toán MoMo:
     - Gọi API tạo đơn lấy `payUrl`.
     - Sử dụng `url_launcher` mở MoMo App hoặc trình duyệt.
     - Lắng nghe khi app resume để tự động gọi API kiểm tra trạng thái đơn và cập nhật ngay lập tức các chỉ số trên Header bar.
  5. Kết nối chuyển trang từ menu profile trong `MobileHeaderBar`.
* **Tiêu chí nghiệm thu (DoD):**
  - Đổi tài nguyên thành công, số dư cập nhật ngay trên Header Bar mà không cần tải lại app.
  - Xử lý an toàn khi không đủ số dư (báo lỗi rõ ràng).
  - Khởi tạo đơn MoMo và mở liên kết thanh toán thành công.

---

### BƯỚC 6.4: ACHIEVEMENTS SYSTEM FLUTTER NATIVE UI
* **Mục tiêu:** Xây dựng màn hình vinh danh 64 thành tựu với giao diện rực rỡ, gamification cao.
* **Công việc cụ thể:**
  1. Tạo `features/achievements/data`: Models `AchievementModel`, parsing nhóm, cấp bậc tier, điều kiện, phần thưởng.
  2. Tạo `features/achievements/presentation/cubit/achievements_cubit.dart`.
  3. Tạo `features/achievements/presentation/screens/achievements_screen.dart`:
     - Thanh tổng tiến độ: Số lượng đã mở khóa / 64, % hoàn thành.
     - Bộ lọc Tab: **Đang tiến hành** (nhóm theo 14 nhóm, hiển thị mốc gần nhất cần đạt) vs **Đã mở khóa** (sắp xếp theo Tier từ cao xuống thấp).
     - Card thành tựu hiển thị Icon theo từng nhóm (Lửa, Vương miện, Sách, Bộ não, Kim cương...), Khung viền và dải màu theo 6 Tier (Đồng, Bạc, Vàng, Cyan, Tím, Hồng).
     - Hiển thị thanh tiến trình của từng thành tựu (ví dụ: `23 / 50 câu đúng`).
  4. Modal Chúc Mừng Phần Thưởng (`AchievementRewardModal`):
     - Khi phát hiện có thành tựu mới hoàn thành, tự động bật popup chúc mừng hiển thị số XP, Xu, Năng lượng nhận được kèm hiệu ứng sao bay rực rỡ.
     - Tự động cộng chỉ số vào tài khoản người dùng.
  5. Mở màn hình từ mục "Thành Tựu" trong menu profile.
* **Tiêu chí nghiệm thu (DoD):**
  - Hiển thị đầy đủ danh sách 64 thành tựu với tiến độ chính xác từ dữ liệu thực tế của học viên.
  - Phân loại rõ ràng giữa các thành tựu đã nhận và chưa nhận.

---

### BƯỚC 6.5: VOCABULARY NOTEBOOK (KHO TỪ VỰNG) FLUTTER NATIVE
* **Mục tiêu:** Xây dựng cuốn sổ tay từ vựng thông minh cho học viên, đồng bộ với các thẻ bài Wiki đã sở hữu.
* **Công việc cụ thể:**
  1. Tạo `features/vocabulary/data`: Models `VocabularyModel`, `VocabularyContextModel`.
  2. Tạo `features/vocabulary/presentation/cubit/vocabulary_cubit.dart`.
  3. Tạo `features/vocabulary/presentation/screens/vocabulary_screen.dart`:
     - Ô tìm kiếm từ vựng theo thời gian thực (Search bar).
     - Hàng chip lọc ngôn ngữ: Tất cả, Tiếng Anh, Tiếng Nhật, Tiếng Hàn, Tiếng Trung, Tiếng Pháp, Tiếng Đức.
     - Thẻ từ vựng hiển thị: Từ gốc, Phiên âm IPA, Loại từ, Nghĩa tiếng Việt, Thẻ bài nguồn.
     - Nút Loa phát âm: Tích hợp `flutter_tts` phát âm chuẩn theo ngôn ngữ đích tương ứng.
  4. Modal Ngữ Cảnh Bài Học (`VocabularyContextDialog`):
     - Khi bấm vào thẻ từ, mở hộp thoại hiển thị đoạn văn bài học gốc trích từ thẻ bài Wiki mà học viên từng học từ đó, với từ vựng mục tiêu được bôi vàng nổi bật.
  5. Mở màn hình từ mục "Kho Từ Vựng" trong menu profile.
* **Tiêu chí nghiệm thu (DoD):**
  - Tải đầy đủ danh sách từ vựng cá nhân theo thứ tự A-Z.
  - Chức năng tìm kiếm và lọc ngôn ngữ phản hồi ngay lập tức.
  - Nút phát âm hoạt động mượt mà.
  - Mở xem đoạn văn ngữ cảnh gốc chuẩn xác.

---

### BƯỚC 6.6: SETTINGS, PROFILE & SECURITY FLUTTER NATIVE
* **Mục tiêu:** Cung cấp đầy đủ quyền tự chủ tài khoản và bảo mật cho người dùng ngay trên app.
* **Công việc cụ thể:**
  1. Tạo `features/settings/data`: Models, Repositories cho Profile, Security, Privacy, Notifications.
  2. Tạo `features/settings/presentation/cubit/settings_cubit.dart`.
  3. Tạo `features/settings/presentation/screens/settings_screen.dart` với 4 Tab:
     - **Tab 1 - Hồ Sơ Cá Nhân:** Chỉnh sửa Họ tên, Biệt danh (Username), Tiểu sử (Bio), Danh sách sở thích, Liên kết mạng xã hội (Facebook, Github, Youtube, LinkedIn). Đổi ảnh đại diện (chọn ảnh từ thư viện hoặc Base64).
     - **Tab 2 - Bảo Mật & Đăng Nhập:** Hiển thị loại tài khoản (Google OAuth hoặc Mật khẩu thường). Đổi mật khẩu trực tiếp (yêu cầu mật khẩu cũ + mật khẩu mới). Nút "Quên mật khẩu / Xác thực OTP": Gửi mã OTP 6 số qua Gmail, nhập mã xác thực và đặt mật khẩu mới.
     - **Tab 3 - Quyền Riêng Tư:** Toggle hiển thị hồ sơ cá nhân công khai, toggle xuất hiện trên Bảng xếp hạng.
     - **Tab 4 - Thông Báo:** Toggle nhận email nhắc nhở chuỗi học, email báo cáo tuần.
  4. Hộp thoại Đóng Góp Ý Kiến (`FeedbackDialog`): Form nhập nội dung góp ý gửi đến hệ thống hỗ trợ.
  5. Kết nối chuyển trang từ menu profile và thêm nút icon Bánh răng Cài đặt tiện ích.
* **Tiêu chí nghiệm thu (DoD):**
  - Sửa thông tin cá nhân và avatar -> Header, Dashboard và Leaderboard cập nhật tức thì.
  - Đổi mật khẩu và gửi OTP Gmail hoạt động trơn tru.
  - Toggle quyền riêng tư và thông báo lưu thành công vào CSDL.

---

### BƯỚC 6.7: FINAL SYSTEM INTEGRATION, PERFORMANCE & REGRESSION AUDIT
* **Mục tiêu:** Kiểm toán toàn diện hệ thống sau khi chuyển đổi 100% các tính năng, đảm bảo tính ổn định, tốc độ và bảo mật trước khi bàn giao.
* **Kịch bản kiểm thử:**
  1. **Luồng người dùng mới (End-to-End User Journey):**
     - Đăng ký tài khoản -> Đăng nhập -> Làm bài kiểm tra Youtube -> Nhận XP/Xu -> Quay Gacha -> Mở thẻ Wiki -> Vào phòng đọc học từ vựng -> Mở Kho từ vựng ôn tập -> Nhận thưởng Thành tựu mới mở khóa -> Vào Cửa hàng đổi tài nguyên -> Kết bạn và Chat tặng thẻ cho bạn bè -> Kiểm tra vị trí trên Bảng xếp hạng -> Vào Cài đặt đổi avatar và mật khẩu.
  2. **Kiểm tra tương thích & không suy thoái (Non-Regression Test):**
     - Xác minh Website Next.js (Desktop & Mobile Web) hoạt động hoàn hảo song song với Flutter Native.
     - Xác minh Database SQL Server không phát sinh lỗi khóa bảng (Deadlock) hay rò rỉ dữ liệu.
     - Xác minh Socket.IO không bị ngắt kết nối khi chuyển qua lại giữa các màn hình.
  3. **Kiểm tra hiệu năng:**
     - `flutter analyze` đạt 0 lỗi, 0 cảnh báo quan trọng.
     - Tốc độ chuyển tab < 100ms, bộ nhớ RAM ổn định.
* **Kết quả đầu ra:** Báo cáo tổng kết dự án chuyển đổi hoàn chỉnh Hub-EL sang Flutter Native App.

---

## 4. MA TRẬN TIÊU CHÍ NGHIỆM THU TỔNG THỂ (ACCEPTANCE CHECKLIST)

- [ ] **Store:** Đổi tài nguyên thành công, giao dịch an toàn bọc Transaction, mở link nạp tiền MoMo mượt mà.
- [ ] **Achievements:** Tải đủ 64 huy hiệu, hiển thị đúng 6 Tier, claim thưởng XP/Xu/Energy tự động.
- [ ] **Vocabulary:** Danh sách từ vựng A-Z, lọc ngôn ngữ, phát âm TTS, xem ngữ cảnh bài học gốc.
- [ ] **Settings:** Cập nhật hồ sơ, đổi avatar, đổi mật khẩu, OTP Gmail, quyền riêng tư, gửi góp ý.
- [ ] **Architecture:** Feature-First Clean Architecture, BLoC/Cubit, Dio Interceptors, không dùng WebView.
- [ ] **Regression:** Bản Web Next.js giữ nguyên 100% tính toàn vẹn và nghiệp vụ.

