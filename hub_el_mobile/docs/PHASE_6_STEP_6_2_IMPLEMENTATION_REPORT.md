# BÁO CÁO TRIỂN KHAI GIAI ĐOẠN 6 – BƯỚC 6.2
## SHARED SERVICES & REST API BRIDGES (HUB-EL WEB ↔ FLUTTER NATIVE)

**Dự án:** `hub-el` (Next.js Web) & `hub_el_mobile` (Flutter Native)  
**Ngày hoàn thành:** 21/11/2026  
**Trạng thái:** ✅ HOÀN THÀNH 100% BƯỚC 6.2  

---

### 1. TỔNG QUAN MỤC TIÊU BƯỚC 6.2

Triển khai tầng Backend dùng chung (Single Source of Truth) cho 4 phân hệ còn lại của hệ thống Hub-EL:
1. **Store & Economy:** Quy đổi tài nguyên, nạp VIP & Ngọc qua MoMo Sandbox HMAC-SHA256, kiểm tra trạng thái thanh toán, lịch sử giao dịch.
2. **Achievements:** Hệ thống 64 danh hiệu phân bổ qua 6 tiers, tự động đồng bộ và tính toán tiến độ dựa trên 14 chỉ số hoạt động, cơ chế trao thưởng (XP, Coins, Energy) chống nhận trùng (Idempotent).
3. **Vocabulary Notebook:** Kho từ vựng cá nhân trích xuất từ thẻ bài người dùng sở hữu trong kho lưu trữ, tra cứu, lọc ngôn ngữ, sắp xếp A-Z / Z-A, phân trang, xem chi tiết và ngữ cảnh câu chuyện từ bài học.
4. **Settings, Profile & Security:** Quản lý hồ sơ cá nhân (username, display name, bio, interests), avatar base64, bảo mật đổi mật khẩu có xác thực OTP Gmail (rate limit 60s, expiry 5 phút), cài đặt quyền riêng tư, cài đặt thông báo, gửi phản hồi/báo lỗi.

Tất cả Server Actions của Website cũ được refactor để gọi trực tiếp các Shared Services này. Toàn bộ REST API routes mới được bảo vệ qua JWT Bearer Token (`src/lib/api-auth.ts`).

---

### 2. DANH SÁCH FILE ĐÃ TẠO VÀ CẬP NHẬT

#### A. Backend Shared Services (`d:\Coder\Web\hub-el\src\services\`)
- `store.service.ts`: Toàn bộ logic giao dịch, quy đổi, chữ ký MoMo HMAC-SHA256, cập nhật trạng thái đơn hàng và kích hoạt VIP.
- `achievements.service.ts`: Khởi tạo 64 danh hiệu, đo lường tiến độ 14 nhóm hành vi, trao thưởng và cập nhật `UserAchievement`.
- `vocabulary.service.ts`: Flatten từ vựng từ `UserInventory` -> `WikiCard.vocabularies`, tìm kiếm, lọc, phân trang và trích xuất ngữ cảnh.
- `settings.service.ts`: Quản lý hồ sơ, bảo mật OTP, đổi mật khẩu bcrypt, quyền riêng tư, thông báo và phản hồi người dùng.

#### B. Refactored Web Server Actions (`d:\Coder\Web\hub-el\src\actions\`)
- `src/actions/store.ts`: Chuyển sang gọi `exchangeResourcesService`.
- `src/actions/achievements.ts`: Chuyển sang gọi `getAchievementsService`.
- `src/actions/vocabulary.ts`: Chuyển sang gọi `getUserVocabularyService`.
- `src/actions/user/settings.ts`: Chuyển sang gọi `getUserSettingsProfileService` & `updatePersonalProfileService`.
- `src/actions/user/security.ts`: Chuyển sang gọi các hàm bảo mật trong `settings.service.ts`.
- `src/actions/user/feedback.ts`: Chuyển sang gọi `submitFeedbackService`.

#### C. REST API Endpoints (`d:\Coder\Web\hub-el\src\app\api\v1\`)
1. **Store:**
   - `GET /api/v1/store`: Lấy catalog và số dư.
   - `POST /api/v1/store/exchange`: Quy đổi tài nguyên.
   - `POST /api/v1/store/momo/create`: Khởi tạo thanh toán MoMo.
   - `POST /api/v1/store/momo/check-status`: Kiểm tra trạng thái đơn hàng.
   - `GET /api/v1/store/transactions`: Lịch sử giao dịch.
2. **Achievements:**
   - `GET /api/v1/achievements`: Lấy danh sách 64 danh hiệu, tiến độ và phần thưởng mới.
3. **Vocabulary:**
   - `GET /api/v1/vocabulary`: Danh sách từ vựng cá nhân có lọc, tìm kiếm, sắp xếp, phân trang.
   - `GET /api/v1/vocabulary/context`: Ngữ cảnh bài đọc của thẻ bài.
   - `GET /api/v1/vocabulary/[id]`: Chi tiết từ vựng theo ID.
4. **Settings, Profile & Security:**
   - `GET /api/v1/settings/profile`: Lấy thông tin hồ sơ.
   - `PUT /api/v1/settings/profile`: Cập nhật hồ sơ.
   - `POST /api/v1/settings/avatar`: Cập nhật ảnh đại diện.
   - `GET /api/v1/settings/security`: Thông tin bảo mật (OAuth / Password).
   - `POST /api/v1/settings/security/send-otp`: Gửi OTP qua Gmail.
   - `POST /api/v1/settings/security/verify-otp`: Kiểm tra tính hợp lệ của mã OTP.
   - `POST /api/v1/settings/security/change-password`: Đổi mật khẩu tài khoản thường.
   - `POST /api/v1/settings/security/reset-password`: Đặt lại mật khẩu bằng mã OTP.
   - `GET /api/v1/settings/privacy`: Lấy cài đặt riêng tư.
   - `PUT /api/v1/settings/privacy`: Cập nhật quyền riêng tư.
   - `GET /api/v1/settings/notifications`: Lấy cài đặt thông báo.
   - `PUT /api/v1/settings/notifications`: Cập nhật thông báo.
   - `POST /api/v1/feedback`: Gửi phản hồi / đóng góp ý kiến.

#### D. Flutter API Endpoints Constant
- `d:\Coder\hub_el_mobile\lib\core\constants\api_endpoints.dart`: Đã bổ sung đầy đủ tất cả URL endpoints tương ứng.

#### E. Test Suites (`d:\Coder\Web\hub-el\scripts\`)
- `scripts/test_store_backend.ts`
- `scripts/test_achievements_backend.ts`
- `scripts/test_vocabulary_backend.ts`
- `scripts/test_settings_backend.ts`

---

### 3. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Tất cả các kịch bản kiểm thử đã được chạy thực tế trên cơ sở dữ liệu và môi trường Node.js Backend:

```
==================================================
🧪 STORE & ECONOMY BACKEND TESTS: 16 PASSED, 0 FAILED (100%)
==================================================
✅ [PASS] Get Store Catalog Success
✅ [PASS] VIP Plans count is 3
✅ [PASS] Coin Packages count is 5
✅ [PASS] Exchange Rules count is 3
✅ [PASS] User FreeCoins balance exists
✅ [PASS] Invalid Exchange Type rejected
✅ [PASS] Exchange GEM_TO_COIN successful
✅ [PASS] Rewarded 1000 FreeCoins correctly
✅ [PASS] Insufficient balance rejected properly
✅ [PASS] Tampered price rejected by server
✅ [PASS] Valid MoMo order creation initiated
✅ [PASS] Generated Order ID correctly
✅ [PASS] Checked and activated MoMo order successfully
✅ [PASS] Order marked SUCCESS
✅ [PASS] Get user transactions history success
✅ [PASS] Orders list is an array

==================================================
🧪 ACHIEVEMENTS BACKEND TESTS: 14 PASSED, 0 FAILED (100%)
==================================================
✅ [PASS] Get Achievements Service Success
✅ [PASS] Total achievements count equals 64
✅ [PASS] List length equals 64
✅ [PASS] Unlocked count is valid number
✅ [PASS] Progress percent calculated
✅ [PASS] Achievement has ID STR_1
✅ [PASS] Achievement has Group ID STREAK
✅ [PASS] Achievement has Tier
✅ [PASS] Achievement has Progress value
✅ [PASS] Achievement has isUnlocked flag
✅ [PASS] Second call success
✅ [PASS] No duplicate XP awarded on second call (Idempotent)
✅ [PASS] No duplicate newly unlocked items on second call
✅ [PASS] Invalid user ID handled gracefully

==================================================
🧪 VOCABULARY BACKEND TESTS: 12 PASSED, 0 FAILED (100%)
==================================================
✅ [PASS] Get User Vocabulary Success
✅ [PASS] Items is an array
✅ [PASS] Total vocabularies: 11
✅ [PASS] Pagination query success
✅ [PASS] Page size respected (<= 3)
✅ [PASS] Pagination limit metadata correct
✅ [PASS] Default sorting is A-Z
✅ [PASS] Search filter query success
✅ [PASS] Search found matches for 'aro'
✅ [PASS] Get Vocabulary Context success
✅ [PASS] Context returns card title
✅ [PASS] Unowned card context access blocked properly

==================================================
🧪 SETTINGS & PROFILE BACKEND TESTS: 20 PASSED, 0 FAILED (100%)
==================================================
✅ [PASS] Get Settings Profile Success
✅ [PASS] Email present
✅ [PASS] Interests parsed as Array
✅ [PASS] Password is NOT exposed
✅ [PASS] Update Profile success
✅ [PASS] Username conflict rejected properly
✅ [PASS] Update Avatar success
✅ [PASS] Get Security Info success
✅ [PASS] isOAuth flag is boolean
✅ [PASS] Send OTP success
✅ [PASS] Rate-limit triggers within 60s for OTP
✅ [PASS] Verify valid OTP code success
✅ [PASS] Verify invalid OTP rejected properly
✅ [PASS] Get Privacy Settings success
✅ [PASS] showOnline flag exists
✅ [PASS] Update Privacy Settings success
✅ [PASS] Get Notification Settings success
✅ [PASS] Update Notification Settings success
✅ [PASS] Submit Feedback success
✅ [PASS] Empty Feedback rejected properly
```

**Tổng cộng:** **62/62 Test Cases Đạt 100% [PASS]**.

---

### 4. BẢO MẬT VÀ TOÀN VẸN GIAO DỊCH (SECURITY & INTEGRITY)

1. **Chống gian lận tiền tệ (Server-side Validation):**
   - Giá tiền của gói VIP và gói Nạp Ngọc không được tin tưởng từ Client; Server luôn đối chiếu `amount` và `type` với bảng định cấu hình tĩnh trước khi tạo đơn hàng.
   - Thao tác trừ tiền và cộng tài nguyên trong `exchangeResourcesService` được bọc toàn bộ trong `prisma.$transaction` để chống race condition.
2. **MoMo HMAC-SHA256 Signature Verification:**
   - Bộ khóa Sandbox được kiểm soát chặt chẽ, tạo chữ ký chuẩn theo RFC-2104 SHA256 cho `payWithMethod`.
3. **Mã hóa và xác thực OTP:**
   - Mã OTP được tạo ngẫu nhiên 6 chữ số qua `crypto.randomInt`, lưu vào bảng `VerificationCode` kèm thời hạn 5 phút.
   - Có cơ chế chống spam OTP: từ chối nếu có yêu cầu trong vòng 60 giây.
   - Mật khẩu người dùng được băm qua thư viện `bcryptjs` với salt rounds chuẩn.
4. **Quyền riêng tư từ vựng (Vocabulary Privacy & Ownership):**
   - Người dùng chỉ xem được các từ vựng thuộc về các thẻ bài mà họ thực sự sở hữu trong `UserInventory`. Bất kỳ yêu cầu truy cập ngữ cảnh nào từ thẻ bài không thuộc sở hữu đều bị Server chặn ngay lập tức.
5. **Không làm lộ dữ liệu nhạy cảm:**
   - Các API Profile và Settings hoàn toàn ẩn các trường nhạy cảm (`password`, `sessionToken`, `accounts`).

---

### 5. SẴN SÀNG CHO CÁC BƯỚC TIẾP THEO (GIAI ĐOẠN 6.3 - 6.6)

Tầng Backend và API Bridges đã sẵn sàng phục vụ cho việc xây dựng Native UI trên Flutter:
- **Bước 6.3:** Store & Economy UI (Catalog, Exchange modal, MoMo webview/app-switch, Transaction history).
- **Bước 6.4:** Achievements UI (64 Huy hiệu, 6 Tiers, Progress bar, Claim animations).
- **Bước 6.5:** Vocabulary Notebook UI (Từ điển cá nhân, Text-to-Speech audio, Filter, Luyện thẻ bài).
- **Bước 6.6:** Settings, Profile & Security UI (Edit profile, Avatar cropper/uploader, Đổi mật khẩu OTP Gmail, Privacy & Notification toggles).

