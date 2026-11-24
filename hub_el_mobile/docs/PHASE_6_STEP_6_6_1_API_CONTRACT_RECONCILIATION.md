# BÁO CÁO KIỂM TOÁN VÀ ĐỐI CHIẾU HỢP ĐỒNG API (API CONTRACT RECONCILIATION & SECURITY AUDIT)
## GIAI ĐOẠN 6 – BƯỚC 6.6.1

- **Dự án**: `hub-el` (Next.js Web Backend) ↔ `hub_el_mobile` (Flutter Native Client)
- **Giai đoạn**: Giai đoạn 6 – Hệ thống Kinh tế, Thành tựu & Cá nhân hóa
- **Mục tiêu**: Kiểm toán toàn diện đối chiếu API Contract, kiểm tra bảo mật (Avatar, OTP, Password, Auth) và khắc phục triệt để sai lệch giữa Backend và Flutter.
- **Ngày hoàn thành**: 24/11/2026
- **Trạng thái**: **HOÀN THÀNH 100% (Backend Tests: 50/50 PASS, Flutter Tests: 227/227 PASS, 0 Analyzer Errors trong Settings & Profile)**

---

## 1. BẢNG ĐỐI CHIẾU TỪNG API GIỮA BACKEND VÀ FLUTTER

| Nghiệp vụ | Backend Endpoint | HTTP Method Thực Tế | Request Body / Payload | Response Schema | Flutter Endpoint & Method | Trạng thái Đối chiếu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Lấy Hồ Sơ Cá Nhân** | `/api/v1/settings/profile` | `GET` | Không (Bearer JWT) | `{ success: true, data: { id, fullName, username, displayAvatar, bio, interests, socialLinks, privacySettings, notificationSettings, ... } }` | `ApiEndpoints.settingsProfile` (`GET`) | ✅ Khớp 100% |
| **Cập Nhật Hồ Sơ** | `/api/v1/settings/profile` | `PATCH` & `PUT` (Hỗ trợ cả hai) | `{ fullName, username, bio, interests, socialLinks }` | `{ success: true, message: string, data: { ... } }` | `ApiEndpoints.settingsProfile` (`PATCH`) | ✅ Khớp 100% |
| **Cập Nhật Avatar** | `/api/v1/settings/avatar` | `POST` | `{ image: string }` | `{ success: true, message: string }` | `ApiEndpoints.settingsAvatar` (`POST`) | ✅ Khớp 100% |
| **Lấy Trạng Thái Bảo Mật** | `/api/v1/settings/security` | `GET` | Không (Bearer JWT) | `{ success: true, data: { isOAuth: bool, email: string, hasPassword: bool } }` | `ApiEndpoints.settingsSecurity` (`GET`) | ✅ Khớp 100% |
| **Gửi OTP Xác Thực** | `/api/v1/settings/security/send-otp` | `POST` | Không cần body (lấy email chính chủ từ JWT) | `{ success: true, message: string }` | `ApiEndpoints.settingsSendOtp` (`POST`) | ✅ Khớp 100% |
| **Xác Minh OTP** | `/api/v1/settings/security/verify-otp` | `POST` | `{ code: string }` | `{ success: true, message: string }` | `ApiEndpoints.settingsVerifyOtp` (`POST`) | ✅ Khớp 100% |
| **Đổi Mật Khẩu** | `/api/v1/settings/security/change-password` | `POST` | `{ oldPassword: string, newPassword: string }` | `{ success: true, message: string }` | `ApiEndpoints.settingsChangePassword` (`POST`) | ✅ Khớp 100% |
| **Đặt Lại MK bằng OTP** | `/api/v1/settings/security/reset-password` | `POST` | `{ code: string, newPassword: string }` | `{ success: true, message: string }` | `ApiEndpoints.settingsResetPassword` (`POST`) | ✅ Khớp 100% |
| **Lấy Quyền Riêng Tư** | `/api/v1/settings/privacy` | `GET` | Không (Bearer JWT) | `{ success: true, data: { showOnline, onlineScope, publicProfile, profileScope, allowFriendRequests, showInventory, showRank } }` | `ApiEndpoints.settingsPrivacy` (`GET`) | ✅ Khớp 100% |
| **Lưu Quyền Riêng Tư** | `/api/v1/settings/privacy` | `PATCH` & `PUT` | Object JSON quyền riêng tư | `{ success: true, message: string }` | `ApiEndpoints.settingsPrivacy` (`PATCH`) | ✅ Khớp 100% |
| **Lấy Cài Đặt Thông Báo**| `/api/v1/settings/notifications` | `GET` | Không (Bearer JWT) | `{ success: true, data: { allowEmail, energy, friendReq, streak, wikiShare, dailyReminder, systemAnnouncements, ... } }` | `ApiEndpoints.settingsNotifications` (`GET`) | ✅ Khớp 100% |
| **Lưu Cài Đặt Thông Báo**| `/api/v1/settings/notifications` | `PATCH` & `PUT` | Object JSON cài đặt thông báo | `{ success: true, message: string }` | `ApiEndpoints.settingsNotifications` (`PATCH`) | ✅ Khớp 100% |
| **Góp Ý & Báo Lỗi** | `/api/v1/feedback` | `POST` | `{ content: string, category?: string }` | `{ success: true, message: string }` | `ApiEndpoints.feedback` (`POST`) | ✅ Khớp 100% |
| **Lấy 37 Tags Sở Thích** | `/api/v1/settings/interests` | `GET` | Không (Bearer JWT) | `{ success: true, data: string[] }` | `ApiEndpoints.settingsInterests` (`GET`) | ✅ Khớp 100% |
| **Xóa Tài Khoản Vĩnh Viễn**| `/api/v1/settings/security/delete-account` | `POST` | Không (Bearer JWT) | `{ success: true, message: string }` | `ApiEndpoints.settingsDeleteAccount` (`POST`) | ✅ Khớp 100% |

---

## 2. KẾT QUẢ KIỂM TRA PRIVACY & NOTIFICATION SETTINGS

### 2.1. Quyền Riêng Tư (Privacy Settings):
- **Cơ sở dữ liệu:** Cột `privacySettings NVARCHAR(MAX)` trong bảng `User` lưu trữ chuỗi JSON.
- **Trường cốt lõi trên Web:** `showOnline`, `onlineScope` (`everyone` \| `friends`), `publicProfile`, `profileScope` (`everyone` \| `friends`).
  - *Áp dụng thực tế:* Trong `src/services/friends.service.ts` (dòng 766-776), `canSeeOnline` và `canSeeProfile` được kiểm tra chặt chẽ dựa trên 4 trường này (bao gồm quy tắc bạn bè và chặn nhau).
- **Trường bổ sung:** `allowFriendRequests`, `showInventory`, `showRank`.
  - Backend `settings.service.ts` lưu trọn vẹn toàn bộ object JSON vào `user.privacySettings`, không làm mất hay lọc bỏ bất kỳ trường nào. Cả Web lẫn Flutter cùng truy cập và chia sẻ dữ liệu đồng nhất.

### 2.2. Cài Đặt Thông Báo (Notification Settings):
- **Cơ sở dữ liệu:** Cột `notificationSettings NVARCHAR(MAX)` trong bảng `User`.
- **Trường nghiệp vụ thực tế áp dụng trên Backend & Cron:**
  - `allowEmail` (boolean): Master switch bật/tắt toàn bộ email thông báo từ Hub-EL.
  - `streak` / `tasks` (boolean): Bật/tắt cảnh báo sắp mất chuỗi học tập hàng ngày qua email Cron Job (`src/app/api/cron/reminders/route.ts`).
  - `energy` (boolean): Bật/tắt email nhắc nhở khi năng lượng AI đạt mức tối đa (`src/app/api/cron/reminders/route.ts`).
  - `friendReq` (boolean): Bật/tắt email thông báo khi có người dùng gửi lời mời kết bạn mới (`src/services/friends.service.ts`).
  - `wikiShare` (boolean): Bật/tắt thông báo chia sẻ bài học hoặc thẻ tri thức.
  - `dailyReminder` & `systemAnnouncements`: Lưu giữ trạng thái thông báo sự kiện và nhắc nhở ôn tập.
- **Kết luận:** Mọi trường cấu hình đều được Backend lưu trữ bền vững (persistent), đồng bộ hoàn toàn giữa Web và Mobile Native.

---

## 3. KIỂM TOÁN AN NINH (SECURITY AUDIT)

### 3.1. Avatar Upload Security & Hardening:
- **Kiểm tra cũ:** Trước đây `updateAvatarService` chỉ kiểm tra chuỗi rỗng thô sơ.
- **Gia cố bảo mật mới (Hardening implemented):**
  1. **Giới hạn kích thước payload:** Chặn mọi payload vượt quá 5MB (`MAX_BASE64_SIZE = 5 * 1024 * 1024`), chống DoS bộ nhớ máy chủ.
  2. **Xác thực MIME type & Định dạng:** Bắt buộc chuỗi ảnh phải khớp biểu thức chính quy Base64 Data URI hợp lệ:
     `^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$` hoặc URL `http/https` an toàn.
  3. **Chống Script/HTML Injection:** Từ chối ngay lập tức các payload chứa script độc hại hoặc định dạng file không phải hình ảnh.
  4. **Quyền sở hữu (Ownership):** Avatar chỉ cập nhật cho `userId` được giải mã từ JWT Token đã xác thực, không thể giả mạo cập nhật cho người khác.

### 3.2. OTP Security & Anti-Brute-Force:
- **Thời hạn OTP:** Đúng 5 phút (`Date.now() + 5 * 60 * 1000`).
- **Cooldown gửi lại:** 60 giây (`Date.now() - 60 * 1000`), từ chối yêu cầu gửi liên tục.
- **Chống Brute-Force:**
  - Hệ thống đếm số lần thử thất bại `failedOtpAttempts` (tối đa 5 lần).
  - Sử dụng so sánh an toàn thời gian `crypto.timingSafeEqual` để chống tấn công Timing Attack.
  - Sau lần thử sai thứ 5, toàn bộ mã OTP của email bị hủy ngay lập tức và tài khoản bị khóa thử lại.
- **Single-Use OTP:** Mã OTP bị xóa vĩnh viễn khỏi DB ngay sau khi đổi/đặt lại mật khẩu thành công.
- **Nguồn danh tính Email:** Email được lấy 100% từ hồ sơ User gắn với JWT Bearer Token, Backend **hoàn toàn không tin tưởng** email do Client gửi trong body.
- **Bảo mật Logging:** Mã OTP, mật khẩu và JWT token không bao giờ bị in ra console/log.

### 3.3. Password Security:
- **Xác thực mật khẩu cũ:** So sánh qua `bcrypt.compare` với độ phức tạp cao (salt rounds 10).
- **Validation Backend:** Mật khẩu mới bắt buộc từ 8 ký tự trở lên.
- **Tài khoản Google OAuth:** Nhận diện chính xác `isOAuth = true` (không có password hoặc có tài khoản trong bảng `Account`), từ chối thao tác đổi mật khẩu trực tiếp và hướng dẫn người dùng sử dụng tính năng Đặt lại mật khẩu qua Email OTP để kích hoạt mật khẩu nội bộ mà không làm hỏng tài khoản Google.

### 3.4. Authorization & Input Validation:
- 100% các route `/api/v1/settings/*` và `/api/v1/feedback` đều được bảo vệ bởi hàm `authenticateApiRequest(req)` (yêu cầu Access Token JWT hợp lệ).
- Người dùng chỉ có thể đọc và sửa dữ liệu của chính mình (`auth.userId`).

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ

### 4.1. Backend Tests:
Chạy hai bộ kiểm thử chuyên sâu Backend:
1. `scripts/test_settings_backend.ts`:
   ```bash
   npx tsx scripts/test_settings_backend.ts
   ```
   **Kết quả:** **`20/20 PASSED (100%)`**
2. `scripts/test_phase6_security_audit.ts`:
   ```bash
   npx tsx scripts/test_phase6_security_audit.ts
   ```
   **Kết quả:** **`30/30 PASSED (100%)`**
   - Section I: Store & Economy Transaction Audit: 6/6 PASS.
   - Section II: MoMo Payment Security Audit: 10/10 PASS.
   - Section III: Achievements Reward Audit: 2/2 PASS.
   - Section IV: OTP & Password Security Audit: 12/12 PASS.

### 4.2. Flutter Native Tests:
```bash
flutter test test/features/settings/ test/features/profile/
```
**Kết quả:** **`23/23 Settings & Profile Tests PASSED (100%)`**
- `profile_model_test.dart`: 3 tests PASS.
- `profile_cubit_test.dart`: 5 tests PASS.
- `profile_screen_test.dart`: 1 test PASS.
- `settings_model_test.dart`: 4 tests PASS.
- `settings_cubit_test.dart`: 6 tests PASS.
- `settings_screen_test.dart`: 4 tests PASS.

Toàn bộ test suite toàn dự án:
```bash
flutter test
```
**Kết quả:** **`227/227 tests PASSED (100%)`** (Thời gian chạy: 11 giây).

### 4.3. Flutter Analyze:
```bash
flutter analyze lib/features/settings lib/features/profile lib/shared/widgets/mobile_header_bar.dart
```
**Kết quả:**
```
Analyzing 3 items...
No issues found! (ran in 6.8s)
```

---

## 5. KIỂM CHỨNG TRÊN LIVE ANDROID EMULATOR

Ứng dụng Flutter đã được xác minh trên Android Emulator Pixel (`emulator-5554`) kết nối trực tiếp với Next.js Backend daemon:
1. **Profile Menu Bar:** Chỉ hiển thị duy nhất mục "Hồ Sơ Cá Nhân" và "Đăng Xuất", 3 mục thừa đã được dọn sạch.
2. **Gacha Screen:** Lỗi tràn viền `RenderFlex overflowed by 14 pixels` đã được sửa hoàn toàn, nút quay hiển thị nhãn "Miễn phí hôm nay" cân đối trên màn hình.
3. **Cập nhật Avatar:** Chọn ảnh từ thư viện, chuyển đổi Base64 Data URI gửi lên API thành công và phản hồi tức thời.
4. **Bảo Mật & OTP:** Nhận diện đúng loại tài khoản Google OAuth, gửi OTP qua Email, đếm lùi 60 giây và cho phép xác thực/đặt lại mật khẩu mượt mà.
5. **Đồng bộ Dữ liệu:** Streak và Năng lượng động `113/115` hiển thị đồng bộ từ Database.

---

## 6. DANH SÁCH SAI LỆCH VÀ CÁC THAY ĐỔI MÃ NGUỒN ĐÃ THỰC HIỆN

| STT | Sai lệch / Rủi ro phát hiện | Mức độ | Khắc phục đã thực hiện |
| :--- | :--- | :--- | :--- |
| 1 | `updateAvatarService` thiếu kiểm tra kích thước payload và định dạng MIME Base64 | **Nghiêm trọng (Security)** | Đã thêm kiểm tra giới hạn 5MB và regex MIME Base64 Data URI (jpeg, png, webp, gif) an toàn |
| 2 | Route `/api/v1/feedback` khác với đường dẫn dự kiến `/api/v1/settings/feedback` trong tài liệu ban đầu | **Trung bình (Contract)** | Flutter `SettingsRemoteDataSource` đã dùng chuẩn `ApiEndpoints.feedback` (`/api/v1/feedback`), cả hai bên đã khớp 100% |
| 3 | Menu BottomSheet chứa các nút trùng lặp với màn hình Profile | **Thấp (UI/UX)** | Đã dọn sạch 3 mục thừa trong `mobile_header_bar.dart`, chỉ giữ "Hồ Sơ Cá Nhân" |
| 4 | Nút quay Gacha bị lỗi tràn viền 14px khi có lượt quay miễn phí | **Thấp (UI Bug)** | Đã bọc nút trong `Expanded` + `Align` và tinh chỉnh padding `16x10`, kích thước icon 24px |

---

## 7. KẾT LUẬN & ĐÁNH GIÁ SẴN SÀNG

- Hợp đồng API giữa `hub-el` và `hub_el_mobile` đã được đối chiếu, chuẩn hóa và khớp **100%**.
- Các lỗ hổng bảo mật tiềm ẩn về Avatar payload và OTP timing/brute-force đã được gia cố triệt để.
- Toàn bộ test suites Backend và Frontend đều đạt **100% PASS** mà không có bất kỳ regression error nào.
- Hệ thống hoàn toàn sẵn sàng và ổn định.

> [!IMPORTANT]
> **DỪNG LẠI CHỜ PHÊ DUYỆT**: Toàn bộ nội dung Phase 6 – Step 6.6.1 đã hoàn thành xuất sắc. Hệ thống dừng lại theo đúng nguyên tắc để chờ User xem xét và phê duyệt trước khi chuyển sang Phase 6 – Step 6.7.

