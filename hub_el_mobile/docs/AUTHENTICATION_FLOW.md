# AUTHENTICATION & SESSION MANAGEMENT SPECIFICATION - HUB-EL

> **Tài liệu thiết kế chi tiết Luồng Xác Thực, Quản lý Token và Phiên Đăng Nhập cho Flutter Mobile**  
> Đối chiếu từ hệ thống NextAuth v5 tại [`hub-el/src/lib/auth.ts`](file:///d:/Coder/Web/hub-el/src/lib/auth.ts)

---

## 1. Phân Tích Hệ Thống Xác Thực Web Hiện Tại (NextAuth v5)

Căn cứ từ mã nguồn [`hub-el/src/lib/auth.ts`](file:///d:/Coder/Web/hub-el/src/lib/auth.ts):
- **Cấu hình phiên:** `session: { strategy: "jwt" }`.
- **Cơ chế lưu trữ Web:** Sử dụng HttpOnly Cookies (`authjs.session-token`). Trình duyệt Web tự động đính kèm cookie này trong mọi request.
- **Phương thức xác thực:**
  1. `CredentialsProvider`: So khớp email và mật khẩu mã hóa bằng `bcrypt.compare`.
  2. `Google`: Tích hợp Google OAuth2.
  3. `GitHub`: Tích hợp GitHub OAuth.
- **Chốt chặn phân quyền & Chặn tài khoản Banned:**
  - Chốt chặn 1 (`signIn` callback): Nếu `dbUser.role === 'banned'` $\rightarrow$ Trả về `false` hoặc điều hướng sang `/?error=banned`.
  - Chốt chặn 2 (`authorize` method): Ném lỗi `CustomAuthError("Tài khoản của bạn đã bị khóa!")`.
  - Chốt chặn 3 (`jwt` & `session` callbacks): Đóng gói `status: "BANNED"` và đẩy ra session để frontend đá văng người dùng.

---

## 2. Thách Thức Khi Chuyển Sang Mobile & Giải Pháp Kiến Trúc

| Thách Thức Kỹ Thuật Trên Mobile | Rủi Ro Nếu Giữ Nguyên Cơ Chế Web | Giải Pháp Chuẩn Hóa Cho Flutter |
| :--- | :--- | :--- |
| **HttpOnly Cookie:** Mobile App không phải là trình duyệt web chuẩn, cookie dễ bị mất khi app bị kill hoặc chạy ngầm. | Mất phiên đăng nhập liên tục, trải nghiệm người dùng kém. | **Chuyển sang cơ chế Bearer Token (JWT Access Token & Refresh Token)** chuẩn RESTful cho Mobile. |
| **Google OAuth qua WebView:** Google chặn không cho đăng nhập OAuth qua In-App WebView nhúng vì lý do an ninh (Disallowed User-Agent). | Người dùng không thể đăng nhập Google trên app mobile. | Sử dụng **Native Google Sign-In SDK** (`google_sign_in`), lấy `idToken` từ Google Play Services / iOS Keychain và gửi về Backend xác thực. |
| **Kiểm tra tài khoản bị cấm (Banned):** Web dùng cơ chế cookie để redirect. | App mobile không tự văng ra nếu token cũ chưa hết hạn. | `AuthInterceptor` trên Flutter bắt mã lỗi `403 Forbidden` hoặc trường `role: "banned"` để tự động xóa token và hiển thị Dialog khóa nick. |

---

## 3. Sơ Đồ Chi Tiết Các Luồng Xác Thực (Authentication Flowcharts)

### A. Luồng Đăng Nhập Bằng Email & Mật Khẩu (Credentials Login Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học Viên
    participant App as Flutter Mobile (hub_el_mobile)
    participant API as Backend Next.js (/api/v1/auth/login)
    participant DB as SQL Server (Prisma)
    participant Storage as FlutterSecureStorage

    User->>App: Nhập Email & Mật Khẩu -> Bấm Đăng Nhập
    App->>App: Kiểm tra Form Validation (Email hợp lệ, Pass >= 6 ký tự)
    App->>API: POST /api/v1/auth/login { email, password }
    
    API->>DB: prisma.user.findUnique({ where: { email } })
    DB-->>API: Trả về User Record
    
    alt Không tìm thấy User hoặc chưa có Password
        API-->>App: 400 Bad Request { error: "Sai tài khoản hoặc mật khẩu!" }
        App-->>User: Hiển thị lỗi trên ô nhập liệu
    else Kiểm tra Mật Khẩu (Bcrypt)
        API->>API: bcrypt.compare(password, user.password)
        alt Mật khẩu không khớp
            API-->>App: 400 Bad Request { error: "Sai tài khoản hoặc mật khẩu!" }
            App-->>User: Hiển thị lỗi sai mật khẩu
        else Tài khoản bị khóa (role == 'banned')
            API-->>App: 403 Forbidden { error: "Tài khoản của bạn đã bị khóa!", code: "USER_BANNED" }
            App-->>User: Bung CustomDialog thông báo tài khoản bị khóa
        else Xác thực thành công
            API->>API: Sinh JWT AccessToken (Hạn 7 ngày) & RefreshToken (Hạn 30 ngày)
            API-->>App: 200 OK { success: true, accessToken, refreshToken, user: {...} }
            App->>Storage: Lưu accessToken, refreshToken, userId
            App->>App: Cập nhật AuthBloc -> State: Authenticated
            App-->>User: Điều hướng vào Dashboard chính
        end
    end
```

---

### B. Luồng Đăng Nhập Google Native Trên Mobile (Google Sign-In Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học Viên
    participant App as Flutter Mobile
    participant GoogleSDK as Google Play Services / iOS SDK
    participant API as Backend Next.js (/api/v1/auth/oauth/google)
    participant DB as SQL Server (Prisma)
    participant Storage as FlutterSecureStorage

    User->>App: Bấm nút "Đăng nhập với Google"
    App->>GoogleSDK: GoogleSignIn().signIn()
    GoogleSDK-->>User: Hiển thị bảng chọn tài khoản Google trên hệ điều hành
    User->>GoogleSDK: Chọn tài khoản Google
    GoogleSDK-->>App: Trả về GoogleSignInAccount (idToken, email, displayName, photoUrl)
    
    App->>API: POST /api/v1/auth/oauth/google { idToken, email, name, image }
    API->>API: Xác thực chữ ký idToken qua Google API Client
    
    API->>DB: prisma.user.upsert(theo email)
    Note over API, DB: Nếu user mới: Tự động khởi tạo Level 1, 50 Năng lượng, 0 Xu, role student
    DB-->>API: Trả về User Record
    
    alt Tài khoản mang role == 'banned'
        API-->>App: 403 Forbidden { code: "USER_BANNED" }
        App-->>User: Báo tài khoản bị khóa
    else Thành công
        API->>API: Sinh JWT Access Token cho Mobile
        API-->>App: 200 OK { success: true, accessToken, user: {...} }
        App->>Storage: Lưu accessToken
        App-->>User: Điều hướng vào Dashboard
    end
```

---

### C. Luồng Quên Mật Khẩu & Xác Thực Mã OTP (Forgot Password & OTP Flow)

Căn cứ từ [`src/actions/auth/reset.ts`](file:///d:/Coder/Web/hub-el/src/actions/auth/reset.ts):

```mermaid
sequenceDiagram
    autonumber
    actor User as Học Viên
    participant App as Flutter Mobile
    participant API as Backend Next.js
    participant Mail as Nodemailer Service
    participant DB as SQL Server (verification_codes)

    User->>App: Nhập Email -> Bấm "Gửi mã xác nhận"
    App->>API: POST /api/v1/auth/forgot-password { email }
    API->>DB: prisma.user.findUnique({ where: { email } })
    
    alt Email không tồn tại
        API-->>App: 404 Not Found { error: "Email chưa được đăng ký trong hệ thống!" }
        App-->>User: Báo lỗi không tìm thấy email
    else Email hợp lệ
        API->>API: Sinh ngẫu nhiên mã OTP 6 số (VD: 839201)
        API->>DB: Lưu vào bảng verification_codes (Hạn 10 phút)
        API->>Mail: Gửi email chứa mã OTP và hướng dẫn bảo mật
        API-->>App: 200 OK { success: true, message: "Mã OTP đã được gửi về email của bạn." }
        App-->>User: Chuyển sang màn hình nhập OTP & Mật khẩu mới
    end

    User->>App: Nhập OTP (6 số) + Mật Khẩu Mới -> Bấm "Đổi mật khẩu"
    App->>API: POST /api/v1/auth/verify-reset-password { email, otp, newPassword }
    API->>DB: Kiểm tra OTP trong bảng verification_codes còn hạn không
    
    alt Sai mã OTP hoặc đã hết hạn
        API-->>App: 400 Bad Request { error: "Mã OTP không chính xác hoặc đã hết hạn!" }
        App-->>User: Báo lỗi mã OTP
    else OTP chính xác
        API->>API: bcrypt.hash(newPassword, 10)
        API->>DB: Cập nhật mật khẩu mới vào bảng users & Xóa mã OTP cũ
        API-->>App: 200 OK { success: true, message: "Đổi mật khẩu thành công!" }
        App-->>User: Bung Dialog thành công -> Chuyển về màn hình Đăng nhập
    end
```

---

### D. Luồng Tự Động Làm Mới Token & Hết Hạn Phiên (Token Refresh Interceptor Flow)

```mermaid
flowchart TD
    Request[Flutter App gửi HTTP Request bất kỳ] --> HasToken{Có Access Token trong SecureStorage?}
    
    HasToken -- Có --> Attach[Gắn Header Authorization: Bearer AccessToken]
    HasToken -- Không --> Direct[Gửi Request không kèm Token]

    Attach --> Send[Gửi Request tới Backend]
    Direct --> Send

    Send --> ResponseCheck{Mã phản hồi HTTP là gì?}
    
    ResponseCheck -- 200 OK --> Success[Xử lý Data bình thường]
    ResponseCheck -- 403 Forbidden --> CheckBan{Lỗi USER_BANNED?}
    
    CheckBan -- Có --> BanAction[Xóa toàn bộ Token<br>Hiển thị Dialog Tài khoản bị khóa<br>Đá về màn hình Đăng nhập]
    CheckBan -- Không --> PermissionError[Báo lỗi không có quyền truy cập]

    ResponseCheck -- 401 Unauthorized --> TokenExpired[Access Token đã hết hạn!]
    
    TokenExpired --> TryRefresh{Có Refresh Token hợp lệ?}
    
    TryRefresh -- Có --> CallRefresh[Gửi POST /api/v1/auth/refresh-token<br>kèm RefreshToken]
    
    CallRefresh --> RefreshResult{Refresh thành công?}
    RefreshResult -- Thành công --> SaveNew[Lưu Access Token mới vào SecureStorage<br>Tự động gửi lại Request ban đầu (Retry)]
    RefreshResult -- Thất bại --> Logout[Xóa sạch Session trong SecureStorage<br>Bắn sự kiện SessionExpired<br>Chuyển về màn hình Login]
    
    TryRefresh -- Không --> Logout
```

---

## 4. Quản Lý Thông Tin Phiên Tại Local Storage (Flutter)

### Bảng Lưu Trữ Bảo Mật (`FlutterSecureStorage`):
| Key Định Danh | Kiểu Giá Trị | Mục Đích Sử Dụng |
| :--- | :--- | :--- |
| `hubel_access_token` | `String` | JWT Bearer Token đính kèm mọi request cần xác thực. |
| `hubel_refresh_token`| `String` | Token dự phòng dùng xin cấp lại Access Token mới. |
| `hubel_user_id` | `String` | CUID người dùng, dùng định danh phòng Socket.io (`join_room`). |
| `hubel_user_email` | `String` | Email đăng nhập gần nhất (dùng tự động điền sẵn). |

### Bảng Cấu Hình Người Dùng (`SharedPreferences`):
| Key Định Danh | Kiểu Giá Trị | Giá Trị Mặc Định | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| `app_theme_mode` | `String` | `'SYSTEM'` | `'LIGHT'`, `'DARK'`, hoặc `'SYSTEM'`. |
| `target_language` | `String` | `'en'` | Ngôn ngữ đang theo học. |
| `language_level` | `String` | `'A2'` | Trình độ mong muốn để AI sinh bài đọc. |
| `has_seen_onboarding`| `bool` | `false` | Đã xem màn hình hướng dẫn ban đầu chưa. |

