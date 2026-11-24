# BÁO CÁO TRIỂN KHAI PHÂN HỆ XÁC THỰC (AUTHENTICATION MODULE)
## Dự án: Hub-EL Mobile (Flutter Android) & Next.js Backend Bridge

**Thời điểm hoàn thành:** 04/11/2026  
**Trạng thái kiểm thử:** Vượt qua 100% Unit Test, Flutter Analyze và chạy thử nghiệm thực tế thành công trên Android Emulator kết nối Database SQL Server thật.

---

## 1. Những chức năng đã hoàn thành

1. **Đăng nhập người dùng (Login):**
   - Đăng nhập bảo mật qua Email và Mật khẩu.
   - Mã hóa mật khẩu so khớp qua thư viện `bcryptjs` tương thích hoàn toàn với tài khoản hiện có trên Website Next.js.
   - Chức năng "Ghi nhớ tôi" (Remember me).
   - Ẩn/hiện mật khẩu trực quan.
   - Xác thực trạng thái khóa tài khoản (`USER_BANNED`): Tự động phát hiện, chặn đăng nhập và hiển thị thông báo lỗi rõ ràng.

2. **Đăng ký tài khoản (Register):**
   - Đăng ký tài khoản mới gồm Họ tên, Email, Mật khẩu, Xác nhận mật khẩu.
   - Khởi tạo tài khoản trực tiếp trên CSDL SQL Server với cơ chế thưởng tân thủ (100 Xu Gacha, 20 Năng lượng AI, Level 1).
   - Tích hợp tùy chọn gửi OTP xác thực qua Email.
   - Kiểm tra điều khoản dịch vụ và chính sách bảo mật trước khi gửi yêu cầu.

3. **Khôi phục mật khẩu (Forgot Password & OTP):**
   - Giao diện 2 bước chuyên nghiệp: Nhập Email -> Gửi OTP -> Xác thực 6 số OTP & Đặt mật khẩu mới.
   - Bộ đếm ngược 60 giây có cơ chế gửi lại OTP.
   - Tái sử dụng logic Server Action `sendResetPasswordCodeAction` và `resetPasswordAction`.

4. **Đăng nhập Google (Google Sign-In):**
   - Tích hợp package native `google_sign_in` (v6.2.2).
   - Endpoint Backend `/api/v1/auth/google` tiếp nhận thông tin người dùng Google, tự động liên kết hoặc tạo tài khoản mới nếu lần đầu truy cập.

5. **Duy trì phiên đăng nhập & Tự động khôi phục (Session Persistence):**
   - Lưu trữ an toàn Access Token, Refresh Token và User ID trong `FlutterSecureStorage` (Hardware KeyStore / Keychain).
   - Khi khởi động lại ứng dụng, tự động kiểm tra token qua `/api/v1/auth/me` để phục hồi phiên đăng nhập mà người dùng không cần đăng nhập lại.

6. **Đăng xuất an toàn (Logout):**
   - Gửi yêu cầu thông báo tới Backend `/api/v1/auth/logout`.
   - Xóa sạch toàn bộ Token và ID khỏi Secure Storage trên máy.
   - Reset trạng thái BLoC về `Unauthenticated` và điều hướng về màn hình Login.

---

## 2. Những màn hình UI đã tạo và hoàn thiện

Tất cả các màn hình tuân thủ tuyệt đối **Design System, Typography (Inter/Plus Jakarta Sans) và Dark Theme không gian** đồng bộ từ website cũ:

| Tên màn hình | File Path | Chức năng chi tiết |
|---|---|---|
| **LoginScreen** | `lib/features/authentication/presentation/screens/login_screen.dart` | Form đăng nhập chuẩn, icon nhận diện thương hiệu Hub-EL gradient, nút Google Sign-In, điều hướng Register / Forgot Password, dialog chặn tài khoản Banned. |
| **RegisterScreen** | `lib/features/authentication/presentation/screens/register_screen.dart` | Form tạo tài khoản học tập, input Họ tên, Email, 2 lớp mật khẩu, ô nhập OTP tùy chọn, checkbox điều khoản dịch vụ. |
| **ForgotPasswordScreen** | `lib/features/authentication/presentation/screens/forgot_password_screen.dart` | Form 2 bước khôi phục mật khẩu: Nhập email gửi OTP, đếm ngược 60s, xác thực mã 6 số và cập nhật mật khẩu mới. |
| **AuthenticatedHomeScreen** | `lib/features/authentication/presentation/screens/authenticated_home_screen.dart` | Màn hình chào mừng sau khi đăng nhập thành công: hiển thị thông tin học viên, cấp độ, XP, Xu Gacha, Năng lượng AI, thanh trạng thái Resource Pills và nút Đăng xuất. |
| **SocialLoginButton** | `lib/features/authentication/presentation/widgets/social_login_button.dart` | Widget nút bấm đăng nhập mạng xã hội (Google vẽ vector chuẩn 4 màu chính hãng). |

---

## 3. Những API Backend đã triển khai trên Next.js (`hub-el`)

Các API Route Handlers chuyên biệt cho Mobile được đặt tại `src/app/api/v1/auth/` trong dự án `hub-el`, tuyệt đối không phá vỡ NextAuth Cookie Session của website:

| Method | Endpoint | Chức năng | Cơ chế bảo mật |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Đăng nhập bằng Email & Mật khẩu | So khớp `bcryptjs`, kiểm tra Ban, cấp Access & Refresh JWT |
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới | Validate dữ liệu, băm `bcrypt` salt 12, tạo user Prisma, cấp JWT |
| `GET` | `/api/v1/auth/me` | Lấy profile & gamification | Xác minh Bearer JWT trong Header `Authorization`, kiểm tra Ban |
| `POST` | `/api/v1/auth/refresh` | Cấp mới Access Token | Xác minh Refresh Token còn hạn, cấp cặp token mới |
| `POST` | `/api/v1/auth/logout` | Thông báo đăng xuất | Thu hồi phiên làm việc |
| `POST` | `/api/v1/auth/forgot-password` | Gửi mã OTP khôi phục mật khẩu | Sinh mã 6 số ngẫu nhiên, lưu `VerificationCode`, gửi Nodemailer |
| `POST` | `/api/v1/auth/verify-reset-password` | Xác thực OTP & đổi mật khẩu | Kiểm tra OTP còn hạn (<15p), băm mật khẩu mới bằng `bcryptjs` |
| `POST` | `/api/v1/auth/google` | Đăng nhập Google Mobile | Tiếp nhận email/idToken từ Google, đồng bộ user Prisma |

---

## 4. Những Service và UseCase đã tạo (Clean Architecture)

### Domain Layer
- **Entity:** `UserEntity` (`lib/features/authentication/domain/entities/user_entity.dart`).
- **Repository Interface:** `IAuthRepository` (`lib/features/authentication/domain/repositories/auth_repository.dart`).
- **UseCases:**
  1. `LoginUseCase`
  2. `RegisterUseCase`
  3. `CheckAuthStatusUseCase`
  4. `LogoutUseCase`
  5. `ForgotPasswordUseCase`
  6. `VerifyResetPasswordUseCase`
  7. `GoogleSignInUseCase`

### Data Layer
- **Model:** `UserModel`, `AuthModel`.
- **Remote Data Source:** `AuthRemoteDataSource` tích hợp `DioClient`.
- **Repository Implementation:** `AuthRepositoryImpl` tích hợp `TokenStorageService` & `AuthRemoteDataSource`.

### Presentation Layer
- **State Management:** `AuthBloc`, `AuthEvent`, `AuthState`.

---

## 5. Cơ chế Access Token và Refresh Token

1. **Access Token:**
   - Thời hạn: 1 giờ (`expiresIn: "1h"`).
   - Truyền qua Header: `Authorization: Bearer <access_token>`.
   - Ký bằng thuật toán HMAC-SHA256 (`jsonwebtoken`).

2. **Refresh Token:**
   - Thời hạn: 30 ngày (`expiresIn: "30d"`).
   - Dùng để làm mới Access Token mà không làm gián đoạn người dùng.

3. **Cơ chế chống vòng lặp và concurrency trong `AuthInterceptor`:**
   - Khi nhận mã lỗi HTTP 401: Interceptor tự động tạm dừng các request đồng thời bằng `Completer<bool>`.
   - Chỉ có 1 request duy nhất thực hiện gọi endpoint `/api/v1/auth/refresh`.
   - Nếu refresh thành công: Lưu token mới vào `TokenStorageService`, cập nhật lại header của request bị lỗi và tự động gửi lại (`re-fetch`).
   - Nếu refresh thất bại: Xóa toàn bộ token khỏi `FlutterSecureStorage` và kích hoạt callback `onSessionExpired` để chuyển người dùng về màn hình Login.

---

## 6. Những package đã cài

```yaml
dependencies:
  dio: ^5.11.1
  flutter_secure_storage: ^11.2.0
  flutter_bloc: ^9.1.1
  bloc: ^9.2.1
  google_sign_in: ^6.2.2
```

---

## 7. Kết quả Flutter Analyze

```bash
$ flutter analyze
Analyzing hub_el_mobile...
No issues found! (ran in 3.0s)
```
*Kết quả: 0 error, 0 warning, 0 info.*

---

## 8. Kết quả Flutter Test (Kiểm thử tự động)

Đã chạy thành công bộ 31 bài test (bao gồm 16 kịch bản xác thực nghiệp vụ của Task 8):

```text
00:00 +0: DioClient & Network Configuration Tests 1. DioClient khởi tạo thành công với cấu hình Base URL
00:00 +1: DioClient & Network Configuration Tests 2. Thay đổi Base URL động thành công
00:00 +2: DioClient & Network Configuration Tests 3. ApiResult: ApiSuccess & ApiFailure đóng gói chính xác
00:00 +3: DioClient & Network Configuration Tests 4. AuthInterceptor tự động gắn Bearer Token khi có token trong SecureStorage
00:00 +4: DioClient & Network Configuration Tests 5. AuthInterceptor bỏ qua gắn token khi request có requiresAuth = false
00:00 +5: HTTP Error Handling & Interceptor Tests 1. Xử lý HTTP 401: AuthInterceptor xóa token và gọi onSessionExpired
00:00 +6: HTTP Error Handling & Interceptor Tests 2. Xử lý HTTP 403 USER_BANNED: AuthInterceptor xóa token và kích hoạt onUserBanned
00:00 +7: HTTP Error Handling & Interceptor Tests 3. Xử lý HTTP 404: ErrorInterceptor tạo NotFoundException
00:00 +8: HTTP Error Handling & Interceptor Tests 4. Xử lý HTTP 500: ErrorInterceptor tạo ServerException
00:00 +9: HTTP Error Handling & Interceptor Tests 5. Xử lý Lỗi Mạng Connection Timeout -> NetworkException
00:00 +10: HTTP Error Handling & Interceptor Tests 6. Xử lý Lỗi Thiếu Năng Lượng -> InsufficientResourceException
00:00 +11: TokenStorageService Tests 1. Ban đầu chưa có token -> hasAccessToken trả về false
00:00 +12: TokenStorageService Tests 2. Lưu token thành công và đọc lại chính xác
00:00 +13: TokenStorageService Tests 3. Xóa token (khi đăng xuất / hết hạn phiên) thành công
00:00 +14: Task 8: 1. Đăng ký thành công -> Lưu token và phát ra Authenticated
00:00 +15: Task 8: 2. Email đã tồn tại -> Trả về lỗi EMAIL_EXISTS
00:00 +16: Task 8: 3. Email không hợp lệ -> Báo lỗi INVALID_EMAIL
00:00 +17: Task 8: 4. Password không đạt yêu cầu (< 6 ký tự) -> Báo lỗi WEAK_PASSWORD
00:00 +18: Task 8: 5. Đăng nhập thành công -> Lưu Access & Refresh Token
00:00 +19: Task 8: 6. Sai mật khẩu -> Báo lỗi INVALID_CREDENTIALS
00:00 +20: Task 8: 7. Tài khoản không tồn tại -> Báo lỗi USER_NOT_FOUND
00:00 +21: Task 8: 8. Tài khoản bị khóa USER_BANNED -> Phát ra AuthBanned state
00:00 +22: Task 8: 9. Access Token hết hạn -> Interceptor kích hoạt session expired
00:00 +23: Task 8: 10. Refresh Token hết hạn hoặc tài khoản bị ban -> AuthUserBannedReceived
00:00 +24: Task 8: 11. Đăng xuất -> Xóa sạch Token và phát ra Unauthenticated
00:00 +25: Task 8: 12. Khởi động lại app và duy trì phiên -> Đọc token thành công -> Authenticated
00:00 +26: Task 8: 13. Gửi OTP -> Phát ra AuthOtpSentState
00:00 +27: Task 8: 14. OTP không hợp lệ -> Báo lỗi INVALID_OTP
00:00 +28: Task 8: 15. OTP hết hạn -> Báo lỗi EXPIRED_OTP
00:00 +29: Task 8: 16. Đổi mật khẩu thành công -> Phát ra AuthPasswordResetSuccess
00:01 +30: HubElApp smoke test
00:01 +31: All tests passed!
```
*Kết quả: 31/31 bài test vượt qua (100%).*

---

## 9. Kết quả kiểm thử trực tiếp trên Android Emulator (`emulator-5554`)

Đã tiến hành cài đặt file APK Debug (`app-debug.apk`) và chạy thử nghiệm trực tiếp trên thiết bị `emulator-5554` (Android 17, API 37) kết nối với Backend Next.js qua `http://10.0.2.2:3000`:

1. **Khởi chạy ứng dụng:**
   - Ứng dụng khởi động mượt mà, hiển thị màn hình Login theo giao diện Dark Space chuẩn phong cách website Hub-EL.
2. **Kiểm thử Đăng ký tài khoản mới:**
   - Nhập thông tin: `Họ tên: Nguyen Van Emulator`, `Email: emulator_user_2026@hubel.test`, `Mật khẩu: password123`.
   - Bấm nút "TẠO TÀI KHOẢN".
   - **Kết quả:** Tài khoản được tạo thành công ngay lập tức, lưu trực tiếp vào CSDL SQL Server với thông tin: `FOUND_IN_DB: Nguyen Van Emulator | Coins: 100`.
   - Ứng dụng tự động chuyển sang màn hình Authenticated, hiển thị đúng Avatar chữ 'N', Email, Level 1, 100 Xu Gacha, 20 Năng lượng.
3. **Kiểm thử Đóng ứng dụng và Duy trì phiên:**
   - Đã chạy lệnh dừng ép buộc (`am force-stop com.example.hub_el_mobile`) để tắt ứng dụng hoàn toàn.
   - Khởi động lại ứng dụng: BLoC đã đọc Token từ Secure Storage, gọi `GET /api/v1/auth/me` và tự động hiển thị màn hình Authenticated mà không đòi đăng nhập lại.
4. **Kiểm thử Đăng xuất:**
   - Bấm nút "ĐĂNG XUẤT".
   - Token bị xóa sạch khỏi KeyStore thiết bị và ứng dụng trở về màn hình Đăng nhập ngay lập tức.
5. **Kiểm thử Đăng nhập lại:**
   - Nhập lại email `emulator_user_2026@hubel.test` và mật khẩu `password123`.
   - Bấm "ĐĂNG NHẬP": Hệ thống xác thực thành công trong chưa đầy 1 giây và hiển thị lại trang tài khoản của người dùng.

---

## 10. Những chức năng chưa hoàn thành và lý do

- **Google Sign-In trên máy thật / production:**
  Code native `google_sign_in` và backend bridge `/api/v1/auth/google` đã được hoàn thiện đầy đủ. Tuy nhiên, việc đăng nhập với tài khoản Google thật trên Android đòi hỏi phải đăng ký chứng chỉ SHA-1/SHA-256 của máy lập trình viên lên Google Cloud Console (OAuth Client ID). Hiện tại mã nguồn đã sẵn sàng kích hoạt ngay khi cấu hình Google Cloud Console được cung cấp.

---
*Báo cáo được lập đầy đủ theo đúng yêu cầu nghiệp vụ Giai đoạn 4 - Bước 2.*

