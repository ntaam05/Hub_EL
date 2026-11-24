# BÁO CÁO HOÀN THÀNH GIAI ĐOẠN 6 – BƯỚC 6.6
## SETTINGS, PROFILE & SECURITY FLUTTER NATIVE IMPLEMENTATION REPORT

- **Dự án**: `hub-el` (Next.js Web Backend) ↔ `hub_el_mobile` (Flutter Native Client)
- **Giai đoạn**: Giai đoạn 6 – Hệ thống Kinh tế, Thành tựu & Cá nhân hóa
- **Bước triển khai**: Bước 6.6 – Cài Đặt, Hồ Sơ & Bảo Mật (Settings, Profile & Security Flutter Native)
- **Thời gian hoàn thành**: 23/11/2026
- **Trạng thái**: **HOÀN THÀNH 100% (TESTS PASS: 23/23 Settings & Profile Tests, 227/227 Toàn bộ Flutter Tests PASS, 0 Analyzer Errors, Live Emulator Verified)**

---

## 1. TỔNG QUAN VÀ MỤC TIÊU ĐẠT ĐƯỢC

Bước 6.6 hoàn tất việc xây dựng toàn bộ hệ thống quản lý tài khoản, hồ sơ người dùng, bảo mật đăng nhập, quyền riêng tư, thông báo và kênh góp ý báo lỗi trên Flutter Native theo chuẩn **Feature-First Clean Architecture**. Hệ thống kết nối đồng bộ trực tiếp với Shared Service Backend `settings.service.ts` và hệ thống 8 REST API routes đã được kiểm định bảo mật nghiêm ngặt.

### Các Phân Hệ Đã Triển Khai Hoàn Hảo:

1. **Phân hệ Quản Lý Hồ Sơ Cá Nhân (Profile Management)**:
   - **Màn hình Tổng Quan Hồ Sơ (`ProfileScreen`)**:
     - Hiển thị thông tin thực tế từ backend: Avatar người dùng (kèm badge trạng thái online màu xanh ngọc), Họ tên, Biệt danh `@username`, Huy hiệu Cấp độ VIP/PRO (`PRO` gold badge), Cấp độ hiện tại và điểm kinh nghiệm (`Cấp 4 | 465 XP`).
     - Hiển thị tiểu sử (Bio) đầy đủ định dạng văn bản.
     - Hiển thị danh sách các chủ đề quan tâm (Interests) dạng chip tag màu tím/xanh hiện đại.
     - **Thẻ Liên Kết Ngoài (Social Links Card)**: Hiển thị danh sách liên kết mạng xã hội (GitHub, Facebook, YouTube, LinkedIn, Portfolio Website...) với icon nhận diện thông minh và khả năng mở liên kết ra trình duyệt ngoài thiết bị qua `url_launcher`.
   - **Hộp thoại Chỉnh Sửa Thông Tin (`EditProfileDialog`)**:
     - Cho phép cập nhật Họ và tên, Biệt danh (Username với kiểm tra độ dài 3-30 ký tự, ký tự hợp lệ, và xử lý lỗi trùng username từ backend).
     - Cho phép cập nhật Tiểu sử (Bio) với bộ đếm ký tự tức thời (tối đa 200 ký tự).
     - **Đồng bộ toàn bộ 37 Chủ đề quan tâm (Interests)**: Lấy chuẩn từ bảng `InterestTag` của CSDL Web (bao gồm API Development, Backend Development, Blockchain, C, C++, Competitive Programming, CSS, Data Science, DevOps, Docker, Frontend Development, Fullstack Development, Git, GitHub, Golang, HTML, Java, JavaScript, Lập trình game, Lập trình mobile, Lập trình web, MySQL, Next.js, Node.js, Phát triển Android, Phát triển iOS, PostgreSQL, Python, React, SQL, Thiết kế đồ họa, Thiết kế UI/UX, Tiếng Anh, Tiếng Hàn, Tiếng Nhật, Tiếng Trung, TypeScript) kèm tính năng tìm kiếm tức thì và nút "Xóa hết".
     - **Quản lý Liên Kết Ngoài (Social Links Management)**: Cho phép thêm tối đa 5 liên kết mạng xã hội, sửa URL trực tiếp, và nút xóa thùng rác tiện lợi.
   - **Quản lý Avatar (`AvatarPreviewDialog` & `image_picker`)**:
     - Tích hợp thư viện `image_picker: ^1.2.4` mở bộ sưu tập (Gallery) thiết bị di động.
     - Hiển thị hộp thoại xem trước avatar tròn với hiệu ứng viền gradient trước khi người dùng xác nhận tải lên.
     - Chuyển đổi ảnh sang Base64 Data URI (`data:image/jpeg;base64,...`) và gửi đến API `POST /api/v1/settings/avatar`.
     - Đồng bộ tức thì với `AuthBloc` thông qua sự kiện `AuthUserRefreshed`, cập nhật trực tiếp avatar trên thanh `MobileHeaderBar` mà không cần đăng nhập lại.

2. **Phân hệ Bảo Mật Tài Khoản (`SecurityScreen`)**:
   - **Thẻ Thông Tin Bảo Mật Thực Tế**:
     - Nhận diện loại tài khoản (Google OAuth hay tài khoản Mật khẩu Hub-EL nội bộ).
     - Hiển thị email liên kết và trạng thái mật khẩu (Đã thiết lập hay chưa thiết lập).
   - **Tab 1: Đổi Mật Khẩu (Change Password)**:
     - Form nhập Mật khẩu hiện tại, Mật khẩu mới (tối thiểu 8 ký tự), và Xác nhận mật khẩu mới.
     - Hỗ trợ nút bật/tắt ẩn hiện mật khẩu (Show/Hide Password) độc lập từng trường.
     - Kết nối API `POST /api/v1/settings/security/change-password` với đầy đủ thông báo lỗi nghiệp vụ.
     - Tự động hiển thị hướng dẫn thân thiện đối với tài khoản đăng nhập qua Google OAuth.
   - **Tab 2: Đặt Lại Mật Khẩu Qua Mã OTP (OTP Reset Flow)**:
     - Nút "Gửi mã xác thực OTP" đến email đã đăng ký.
     - Tích hợp bộ đếm thời gian thực (60s countdown timer) ngăn chặn gửi spam OTP.
     - Ô nhập mã OTP 6 chữ số với nút "Xác thực" (`POST /api/v1/settings/security/verify-otp`).
     - Tự động mở form đặt mật khẩu mới sau khi xác thực thành công OTP (`POST /api/v1/settings/security/reset-password`).
   - **Vùng Nguy Hiểm & Xóa Tài Khoản Vĩnh Viễn (Danger Zone)**:
     - Bổ sung thẻ cảnh báo nguy hiểm viền đỏ nổi bật.
     - Nút "Xóa tài khoản vĩnh viễn" hiển thị hộp thoại xác nhận với cảnh báo không thể khôi phục.
     - Kết nối API `POST /api/v1/settings/security/delete-account` cascading xóa toàn bộ 18 quan hệ dữ liệu trong cơ sở dữ liệu và tự động đăng xuất, chuyển hướng về màn hình đăng nhập.

2.1. **Cơ Chế Đồng Bộ Streak & Tính Năng Năng Lượng Động (Streak & Energy Sync)**:
   - **Đồng bộ Streak Thời Gian Thực**:
     - Phát hiện nguyên nhân Streak bị lệch: Web chạy logic kiểm tra `diffDays > 1` so với `lastStudyDate` theo múi giờ `Asia/Ho_Chi_Minh` để reset Streak = 0, trong khi Mobile API `GET /api/v1/auth/me` trước đó chỉ select đơn thuần mà chưa gọi hàm đồng bộ này.
     - Đã tạo helper dùng chung `syncUserStatus(userId)` tại Backend (`src/lib/user-sync.ts`) và tích hợp vào `GET /api/v1/auth/me`. Khi app mở hoặc người dùng bấm vào Streak trên header bar, backend tự động kiểm tra và đồng bộ chuẩn xác tức thì.
   - **Giới Hạn Năng Lượng Động (Dynamic Max Energy 115)**:
     - Thay thế giá trị hardcode cũ (`50`) bằng công thức chuẩn của hệ thống:
       $$\text{maxEnergy} = 50 + (\text{level} - 1) \times 5 + (\text{isPro} ? 50 : 0)$$
     - Với tài khoản Cấp độ 4 và PRO: $50 + (4 - 1) \times 5 + 50 = 115$.
     - Đã đồng bộ hiển thị `113/115` trên cả thanh `MobileHeaderBar` ngoài trang chủ lẫn màn hình `StoreScreen`.

3. **Phân hệ Cài Đặt Quyền Riêng Tư (`PrivacySettingsScreen`)**:
   - Quản lý trạng thái hoạt động:
     - Bật/tắt hiển thị Online (chấm xanh).
     - Lựa chọn phạm vi hiển thị Online qua thẻ lựa chọn: "Mọi người" (`everyone`) hoặc "Chỉ bạn bè" (`friends`).
   - Quản lý tương tác xã hội & hiển thị hồ sơ:
     - Cho phép nhận lời mời kết bạn (`allowFriendRequests`).
     - Hồ sơ công khai (`publicProfile`).
     - Cho phép bạn bè xem kho đồ thẻ bài tri thức (`showInventory`).
     - Cho phép hiển thị thứ hạng trên Bảng xếp hạng (`showRank`).
   - Tự động lưu cấu hình qua `PATCH /api/v1/settings/privacy` với thanh SnackBar thông báo thành công.

4. **Phân hệ Cài Đặt Thông Báo (`NotificationSettingsScreen`)**:
   - Công tắc tổng (Master Switch): Bật/tắt toàn bộ thông báo Email (`allowEmail`).
   - Các công tắc chi tiết (tự động vô hiệu hóa trực quan khi công tắc tổng tắt):
     - `energy`: Thông báo khi bình năng lượng AI hồi phục 100%.
     - `streak`: Cảnh báo sắp mất chuỗi học tập (Streak).
     - `friendReq`: Thông báo khi có lời mời kết bạn mới.
     - `wikiShare`: Thông báo khi bạn bè chia sẻ bài học hoặc câu đố.
     - `dailyReminder`: Nhắc nhở ôn luyện từ vựng hàng ngày theo lịch.
     - `systemAnnouncements`: Thông báo tính năng mới, sự kiện gacha và ưu đãi VIP.
   - Lưu cấu hình qua `PATCH /api/v1/settings/notifications`.

5. **Phân hệ Góp Ý & Báo Lỗi (`FeedbackScreen`)**:
   - Thẻ danh mục góp ý trực quan: "Góp ý tính năng", "Báo lỗi hệ thống", "Yêu cầu hỗ trợ", "Khác".
   - Khung soạn thảo nội dung nhiều dòng với bộ đếm ký tự (tối đa 2000 ký tự).
   - Kiểm tra rỗng và giới hạn độ dài trước khi gửi.
   - Gửi phản hồi qua API `POST /api/v1/feedback`.
   - Hiển thị hộp thoại xác nhận cảm ơn người dùng và tự động làm sạch biểu mẫu sau khi gửi thành công.

6. **Trung Tâm Cài Đặt Tập Trung (`SettingsHubScreen`)**:
   - Nhóm danh mục khoa học theo chuẩn thiết kế Hub-EL:
     - **Tài khoản & Bảo mật**: Bảo mật & Đổi mật khẩu, Quyền riêng tư.
     - **Tùy chọn ứng dụng**: Cài đặt thông báo Email, Góp ý & Báo Lỗi.
   - Hiển thị thông tin phiên bản ứng dụng (`Hub-EL Native Mobile App v1.0.0 Phase 6 Final`).
   - Nút lối tắt cài đặt tích hợp sẵn trên AppBar của ProfileScreen (`LucideIcons.settings`).

7. **Tích Hợp Điều Hướng & Profile Menu**:
   - Cập nhật menu người dùng trên `MobileHeaderBar`:
     - Hồ Sơ Cá Nhân $\rightarrow$ `ProfileScreen`
     - Bảo Mật & Mật Khẩu $\rightarrow$ `SecurityScreen`
     - Cài Đặt Ứng Dụng $\rightarrow$ `SettingsHubScreen`
     - Góp Ý & Báo Lỗi $\rightarrow$ `FeedbackScreen`

---

## 2. CẤU TRÚC THƯ MỤC & FILE ĐÃ TRIỂN KHAI

```
hub_el_mobile/lib/features/
├── profile/
│   ├── data/
│   │   ├── datasources/
│   │   │   └── profile_remote_data_source.dart      # Remote data source gọi DioClient API
│   │   ├── models/
│   │   │   └── user_profile_model.dart              # UserProfileModel JSON mapping
│   │   └── repositories/
│   │       └── profile_repository_impl.dart         # Triển khai ProfileRepository
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user_profile_entity.dart             # UserProfileEntity, UpdateProfileRequest
│   │   ├── repositories/
│   │   │   └── profile_repository.dart              # IProfileRepository interface
│   │   └── usecases/
│   │       └── profile_usecases.dart                # GetProfileUseCase, UpdateProfileUseCase, UpdateAvatarUseCase
│   └── presentation/
│       ├── cubit/
│       │   ├── profile_state.dart                   # ProfileState với copyWith & getters
│       │   └── profile_cubit.dart                   # ProfileCubit quản lý tải hồ sơ, sửa hồ sơ, upload avatar
│       ├── widgets/
│       │   ├── avatar_preview_dialog.dart           # Hộp thoại preview avatar Base64
│       │   └── edit_profile_dialog.dart             # Biểu mẫu modal sửa họ tên, username, bio, sở thích
│       └── screens/
│           └── profile_screen.dart                  # Màn hình chính Hồ sơ cá nhân
└── settings/
    ├── data/
    │   ├── datasources/
    │   │   └── settings_remote_data_source.dart     # Remote data source cho 8 API Settings & Feedback
    │   ├── models/
    │   │   └── settings_models.dart                 # SecurityInfoModel, PrivacySettingsModel, NotificationSettingsModel, FeedbackModel
    │   └── repositories/
    │       └── settings_repository_impl.dart        # Triển khai SettingsRepository
    ├── domain/
    │   ├── entities/
    │   │   └── settings_entities.dart               # Các entities đại diện cho cấu hình hệ thống
    │   ├── repositories/
    │   │   └── settings_repository.dart             # ISettingsRepository interface
    │   └── usecases/
    │       └── settings_usecases.dart               # 10 UseCases: Security, OTP, Privacy, Notifications, Feedback
    └── presentation/
        ├── cubit/
        │   ├── settings_state.dart                  # SettingsState với 60s OTP countdown timer
        │   └── settings_cubit.dart                  # SettingsCubit quản lý toàn bộ logic Settings
        └── screens/
            ├── settings_hub_screen.dart             # Trung tâm điều hướng cài đặt
            ├── security_screen.dart                 # Màn hình đổi mật khẩu & đặt lại bằng OTP
            ├── privacy_settings_screen.dart         # Màn hình cấu hình quyền riêng tư
            ├── notification_settings_screen.dart    # Màn hình cấu hình thông báo email
            └── feedback_screen.dart                 # Màn hình gửi góp ý báo lỗi
```

---

## 3. DANH SÁCH API REST ĐƯỢC KẾT NỐI

Tất cả các API được bảo vệ bởi Bearer JWT Authentication, xử lý thông qua `DioClient`:

| STT | Phương thức | API Endpoint | Chức năng nghiệp vụ | Response Dữ Liệu |
|---|---|---|---|---|
| 1 | `GET` | `/api/v1/settings/profile` | Lấy thông tin hồ sơ người dùng | `success: true, data: UserProfile` |
| 2 | `PATCH` | `/api/v1/settings/profile` | Cập nhật họ tên, username, bio, sở thích | `success: true, data: UserProfile` |
| 3 | `POST` | `/api/v1/settings/avatar` | Cập nhật ảnh đại diện dạng Base64 Data URI | `success: true, data: { avatar: string }` |
| 4 | `GET` | `/api/v1/settings/security` | Lấy thông tin bảo mật tài khoản & loại Auth | `success: true, data: SecurityInfo` |
| 5 | `POST` | `/api/v1/settings/security/change-password` | Đổi mật khẩu trực tiếp | `success: true, message: string` |
| 6 | `POST` | `/api/v1/settings/security/send-otp` | Gửi mã OTP xác nhận đến email | `success: true, message: string` |
| 7 | `POST` | `/api/v1/settings/security/verify-otp` | Xác thực mã OTP 6 số | `success: true, data: { verified: true }` |
| 8 | `POST` | `/api/v1/settings/security/reset-password` | Đặt mật khẩu mới sau khi xác thực OTP | `success: true, message: string` |
| 9 | `GET` | `/api/v1/settings/privacy` | Lấy cài đặt quyền riêng tư | `success: true, data: PrivacySettings` |
| 10 | `PATCH` | `/api/v1/settings/privacy` | Cập nhật cài đặt quyền riêng tư | `success: true, data: PrivacySettings` |
| 11 | `GET` | `/api/v1/settings/notifications` | Lấy cài đặt nhận thông báo | `success: true, data: NotificationSettings` |
| 12 | `PATCH` | `/api/v1/settings/notifications` | Cập nhật cài đặt nhận thông báo | `success: true, data: NotificationSettings` |
| 13 | `POST` | `/api/v1/feedback` | Gửi góp ý / báo lỗi hệ thống | `success: true, data: Feedback` |

---

## 4. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITES)

Hệ thống kiểm thử đã được xây dựng hoàn chỉnh với 23 bài test mới cho Profile & Settings, kết hợp toàn bộ bài test các module trước đó:

### Chi tiết 23 Tests Mới Được Thêm Vào:
1. `test/features/profile/profile_model_test.dart` (3 tests):
   - Chuyển đổi JSON từ backend sang UserProfileModel chuẩn xác.
   - Xử lý các giá trị null an toàn (null bio, null username, null interests).
   - Chuyển đổi UpdateProfileRequest sang payload JSON gửi lên backend.
2. `test/features/profile/profile_cubit_test.dart` (5 tests):
   - Khởi tạo trạng thái ban đầu `ProfileStatus.initial`.
   - Xử lý tải thông tin hồ sơ thành công và phát trạng thái `loaded`.
   - Xử lý lỗi khi API backend gặp sự cố và phát trạng thái `error`.
   - Cập nhật thông tin profile thành công và cập nhật lại state.
   - Cập nhật avatar thành công và cập nhật url mới vào profile state.
3. `test/features/profile/profile_screen_test.dart` (1 test):
   - Widget test render `ProfileScreen` với thông tin người dùng, cấp độ, bio, và các nút điều hướng.
4. `test/features/settings/settings_model_test.dart` (4 tests):
   - Serialization & Deserialization `SecurityInfoModel`.
   - Serialization & Deserialization `PrivacySettingsModel`.
   - Serialization & Deserialization `NotificationSettingsModel`.
   - Serialization & Deserialization `FeedbackModel`.
5. `test/features/settings/settings_cubit_test.dart` (6 tests):
   - Khởi tạo ban đầu với các trạng thái cấu hình rỗng.
   - Tải thông tin bảo mật thành công.
   - Tải và cập nhật cài đặt quyền riêng tư thành công.
   - Tải và cập nhật cài đặt thông báo thành công.
   - Quy trình gửi OTP, xác thực OTP và kích hoạt countdown timer 60s.
   - Gửi phản hồi feedback thành công.
6. `test/features/settings/settings_screen_test.dart` (4 tests):
   - Widget test render `SettingsHubScreen` với đầy đủ các section và item.
   - Widget test render `SecurityScreen` với cả hai Tab "Đổi Mật Khẩu" và "Đặt Lại Bằng OTP".
   - Widget test render `PrivacySettingsScreen` với các công tắc và choice chips.
   - Widget test render `FeedbackScreen` với danh mục chips và text counter.

### Kết Quả Chạy Toàn Bộ Test Suite Dự Án:
```bash
flutter test
```
**Kết quả**:
```
00:19 +227: All tests passed!
```
- **Tổng số tests**: 227 tests
- **Tỉ lệ đạt**: **100% (227/227 PASS)**
- **Thời gian chạy**: ~19 giây

### Kiểm Tra Static Analysis:
```bash
flutter analyze
```
**Kết quả**:
```
Analyzing hub_el_mobile...
No issues found! (ran in 5.3s)
```

---

## 5. HÌNH ẢNH KIỂM CHỨNG TRÊN ANDROID EMULATOR (LIVE EVIDENCE)

Các màn hình đã được kiểm tra trực tiếp trên Android Emulator Pixel (`emulator-5554`) kết nối trực tiếp với Next.js Backend daemon:

1. **Menu Cài Đặt Hồ Sơ Trong Profile Bottom Sheet**:
   - Minh chứng: `docs/screenshots/screen_step3_menu.png`
   - Hiển thị đầy đủ 4 tùy chọn mới: "Hồ Sơ Cá Nhân", "Bảo Mật & Mật Khẩu", "Cài Đặt Ứng Dụng", "Góp Ý & Báo Lỗi".
2. **Màn Hình Hồ Sơ Cá Nhân (`ProfileScreen`)**:
   - Minh chứng: `docs/screenshots/screen_profile_view.png`
   - Hiển thị avatar tròn, chấm online xanh ngọc, tên Hoàng Nhật Tâm, badge PRO, `@ntaam`, Cấp 4 465 XP, tiểu sử, chủ đề quan tâm, các menu liên kết.
3. **Modal Chỉnh Sửa Thông Tin (`EditProfileDialog`)**:
   - Minh chứng: `docs/screenshots/screen_profile_edit_dialog.png`
   - Biểu mẫu chỉnh sửa họ tên, biệt danh, tiểu sử có bộ đếm ký tự 56/200, và bộ chọn chủ đề FilterChips.
4. **Màn Hình Bảo Mật & Đổi Mật Khẩu (`SecurityScreen`)**:
   - Minh chứng: `docs/screenshots/screen_security_view.png`
   - Nhận diện tài khoản Google OAuth, email đăng ký, tab Đổi Mật Khẩu.
5. **Màn Hình Đặt Lại Mật Khẩu Bằng OTP (`SecurityScreen` Tab 2)**:
   - Minh chứng: `docs/screenshots/screen_security_otp.png`
   - Nút gửi mã OTP đến email và ô nhập mã xác thực OTP 6 số.
6. **Màn Hình Trung Tâm Cài Đặt (`SettingsHubScreen`)**:
   - Minh chứng: `docs/screenshots/screen_settings_hub.png`
   - Danh mục cài đặt phân nhóm trực quan, thẻ phiên bản ứng dụng.
7. **Màn Hình Cài Đặt Quyền Riêng Tư (`PrivacySettingsScreen`)**:
   - Minh chứng: `docs/screenshots/screen_privacy_view.png`
   - Công tắc hiển thị online, phạm vi Mọi người/Chỉ bạn bè, các công tắc nhận lời mời kết bạn, hồ sơ công khai, hiển thị kho đồ, hiển thị thứ hạng.
8. **Màn Hình Cài Đặt Thông Báo (`NotificationSettingsScreen`)**:
   - Minh chứng: `docs/screenshots/screen_notifications_view.png`
   - Master switch nhận thông báo qua email và 6 công tắc cấu hình chi tiết.
9. **Màn Hình Góp Ý & Báo Lỗi (`FeedbackScreen`)**:
   - Minh chứng: `docs/screenshots/screen_feedback_view.png`
   - Bộ chọn danh mục góp ý, ô nhập nội dung với bộ đếm 0/2000 ký tự.

---

## 6. KẾT LUẬN & ĐÁNH GIÁ SẴN SÀNG CHO GIAI ĐOẠN TIẾP THEO

- **Tiêu chuẩn kiến trúc**: Đáp ứng 100% chuẩn Feature-First Clean Architecture.
- **Tính toàn vẹn nghiệp vụ**: Dùng chung 100% Business Logic và API với Next.js Web, cơ chế bảo mật xác thực đồng nhất.
- **Trải nghiệm người dùng**: Giao diện chuẩn Native Dark Theme theo bảng màu Hub-EL, phản hồi tức thì, không gây giật lag.
- **Tính tương thích ngược**: Toàn bộ hệ thống xác thực cũ, tính năng đăng nhập Google OAuth, các module Store, Achievements, Vocabulary, Wiki, Gacha, Learning, Social, Chat đều hoạt động ổn định và bảo lưu 100% test case.

Bước 6.6 đã hoàn tất xuất sắc và toàn diện. Dự án hoàn toàn sẵn sàng cho **Bước 6.7: Final Regression Testing, UI Polish & Hoàn Thiện Dự Án**.

