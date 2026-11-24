# BACKEND ANALYSIS & REUSABILITY REPORT - HUB-EL

> **Tài liệu phân tích hiện trạng Backend Next.js `hub-el`, khả năng tái sử dụng và lộ trình cầu nối API cho Flutter**  
> Dự án tham chiếu: `hub-el` (Next.js 16 + Prisma 6 + SQL Server + Socket.io)  
> Dự án áp dụng: `hub_el_mobile` (Flutter Mobile App)

---

## 1. Tổng Quan Kiến Trúc Backend Hiện Tại

Ứng dụng Web `hub-el` là một hệ thống Full-stack xây dựng trên Next.js 16 (App Router) với máy chủ tùy chỉnh `server.js` kết hợp HTTP Server của Node.js và Socket.io.

```
                    ┌──────────────────────────────────────────────┐
                    │               CLIENTS                        │
                    │   ┌───────────────┐      ┌───────────────┐   │
                    │   │ Next.js Web   │      │ Flutter App   │   │
                    │   │ (React 19)    │      │ (hub_el_mobile│   │
                    │   └───────┬───────┘      └───────┬───────┘   │
                    └───────────┼──────────────────────┼───────────┘
                                │                      │
                        RPC Action Call          HTTP REST & WS
                                │                      │
                    ┌───────────▼──────────────────────▼───────────┐
                    │       NODE.JS HTTP SERVER (server.js)        │
                    │  Port 3000 (Next.js Handler + Socket.io)     │
                    ├──────────────────────────────┬───────────────┤
                    │    Next.js App Router        │ Socket.io Svr │
                    │ ┌──────────────────────────┐ │ - join_room   │
                    │ │ API Routes (/api/*)      │ │ - send_msg    │
                    │ ├──────────────────────────┤ │ - friend_req  │
                    │ │ Server Actions (/actions)│ │               │
                    │ └────────────┬─────────────┘ └───────┬───────┘
                    └──────────────┼───────────────────────┼───────┘
                                   │                       │
                    ┌──────────────▼───────────────────────▼───────┐
                    │             BUSINESS LOGIC & DATA            │
                    │ ┌─────────────────┐   ┌────────────────────┐ │
                    │ │ Gemini AI       │   │ YouTube API v3     │ │
                    │ └─────────────────┘   └────────────────────┘ │
                    │ ┌──────────────────────────────────────────┐ │
                    │ │ Prisma ORM Client (6.19.3)               │ │
                    │ └────────────────────┬─────────────────────┘ │
                    └──────────────────────┼───────────────────────┘
                                           │
                    ┌──────────────────────▼───────────────────────┐
                    │   MICROSOFT SQL SERVER DATABASE              │
                    │   26 Relational Tables (Users, Quizzes...)   │
                    └──────────────────────────────────────────────┘
```

---

## 2. Phân Tích Chi Tiết Các Thành Phần Backend

### A. API Route Handlers Hiện Có (REST Endpoints)

Căn cứ từ thư mục [`hub-el/src/app/api`](file:///d:/Coder/Web/hub-el/src/app/api):

| Endpoint Route | HTTP Method | Mục Đích | Trạng Thái Với Flutter |
| :--- | :--- | :--- | :--- |
| `/api/auth/[...nextauth]` | `GET`, `POST` | Xử lý phiên NextAuth OAuth và Credentials Callback | **Khó tái sử dụng trực tiếp trên Mobile** do thiết kế quản lý phiên qua HttpOnly Cookie của trình duyệt Web. |
| `/api/momo/create` | `POST` | Khởi tạo giao dịch MoMo, sinh chữ ký HMAC SHA256 và URL thanh toán | **Tái sử dụng 100%**: Flutter chỉ cần gọi `POST` với JSON `{ type, amount, name }` để lấy `payUrl`. |
| `/api/momo/check-status`| `POST` | Kiểm tra trạng thái đơn hàng MoMo và cập nhật VIP/Ngọc vào DB | **Tái sử dụng 100%**: Flutter gọi khi hoàn tất thanh toán từ MoMo App / WebView. |
| `/api/momo/callback` | `POST` | Webhook IPN nhận tín hiệu thanh toán từ server MoMo | **Tái sử dụng 100%** (Server-to-Server). |
| `/api/upload/message` | `POST` | Upload file/ảnh tin nhắn (Multipart form-data) | **Tái sử dụng 100%**: Flutter dùng Dio FormData gửi file ảnh lên. |
| `/api/cron/reminders` | `GET` | Tác vụ nền gửi email nhắc nhở học tập | Tác vụ Server-side độc lập. |
| `/api/cron/wiki-crawl` | `GET` | Tác vụ cào bài viết Wikipedia định kỳ | Tác vụ Server-side độc lập. |

---

### B. Server Actions Hiện Có (`hub-el/src/actions/`)

Hệ thống Next.js hiện tại đặt toàn bộ business logic học tập, kinh tế, xã hội trong các Server Actions (`"use server"`):

| Nhóm Nghiệp Vụ | Tệp Mã Nguồn | Các Hàm Nghiệp Vụ Cốt Lõi | Đặc Điểm Logic & ACID |
| :--- | :--- | :--- | :--- |
| **Xác thực** | `src/actions/auth/*` | `registerUserAction`<br>`sendOtpResetAction`<br>`verifyOtpAndResetPassword` | Băm mật khẩu `bcryptjs`, quản lý mã OTP 6 số trong bảng `verification_codes`. |
| **Học viên & Stats** | `src/actions/user/*` | `getFreshUserStatsAction`<br>`updateProfileTabAction`<br>`updateSecurityPassword`<br>`getUserFavoritesAction` | Tính toán chỉ số thực tế, cập nhật thông tin cá nhân và cấu hình bảo mật. |
| **Video & Kiểm duyệt** | `src/actions/video/*` | `searchAdvancedAction`<br>`getRelatedVideosAction`<br>`checkEducationalVideoAction`<br>`updateVideoProgressAction` | Tìm kiếm YouTube Data API v3, thuật toán lọc Blacklist/Whitelist, lưu giây xem dở (`lastWatched`). |
| **Trắc nghiệm Video** | `src/actions/quiz/*` | `generateQuizFromVideoAction`<br>`submitQuizAttemptAction` | Bóc tách phụ đề (`youtube-transcript`), gọi Gemini AI sinh 5 câu trắc nghiệm, trừ năng lượng AI theo cấp độ và trạng thái PRO. |
| **Nhiệm vụ Ngày** | `src/actions/quests/*` | `updateTaskProgressAction`<br>`claimDailyRewardAction` | Cộng dồn tiến độ theo ngày (Chuẩn UTC 00:00:00 múi giờ Việt Nam), phân biệt Task Pro và Task Thường. |
| **Wiki Language** | `src/actions/quiz.ts`<br>`src/actions/wiki.ts` | `generateQuizFromWikiCard`<br>`addExpToUser`<br>`keepCardStar` | Cào Wikipedia, băm chunk văn bản, gọi Gemini tạo bài đọc và 5 dạng câu hỏi thích ứng (A1-C2), xử lý Thức tỉnh sao (+1 sao khi đậu, -1 sao khi trượt). |
| **Vòng quay Gacha** | `src/actions/gacha.ts` | `rollGacha`<br>`getGachaHistory`<br>`getExchangeData`<br>`exchangeCard` | Giao dịch nguyên tử (`prisma.$transaction`): Trừ 100 xu, tính tỷ lệ rơi 7 hạng thẻ (N đến MR), bộ đếm bảo hiểm Pity (10/50/120), tái chế thẻ trùng thành Bụi sao (+20% cho PRO). |
| **Cộng đồng & Chat** | `src/actions/social/*` | `searchUsersAction`<br>`addFriendAction`<br>`respondFriendRequestAction`<br>`getFriendsListAction`<br>`getChatHistoryAction`<br>`sendMessageAction` | Quản lý quan hệ bạn bè (PENDING, ACCEPTED, BLOCKED), lưu trữ tin nhắn 1-1 và chat nhóm, gửi email thông báo khi được kết bạn hoặc nhận thẻ quà tặng. |
| **Bảng Xếp Hạng** | `src/actions/leaderboard.ts`| `getLeaderboardData` | Truy vấn dữ liệu thực tế kết hợp hạt giống người dùng giả định (Mock Data Seed), xếp hạng 4 tiêu chí theo 4 khung thời gian. |
| **Thành Tựu** | `src/actions/achievements.ts`| `checkAndGetAchievements` | Quét 50+ điều kiện thành tựu (Streak, Cấp độ, Gacha, Kinh tế, Easter Eggs) và tự động trao thưởng XP/Xu/Năng lượng. |
| **Cửa Hàng** | `src/actions/store.ts` | `exchangeResources` | Quy đổi tài nguyên nguyên tử giữa Ngọc, Xu và Năng lượng. |

---

## 3. Lý Do Kỹ Thuật Flutter Không Thể Gọi Trực Tiếp Server Actions

1. **Giao thức đóng kín của React Server Components (RSC Wire Format):**
   - Next.js Server Actions được gọi thông qua một header đặc biệt (`Next-Action: <hash_id>`) và nội dung serialize dạng multipart stream của React 19.
   - Flutter không thể duy trì cơ chế hash tự động này khi build ứng dụng độc lập.
2. **Không kết nối trực tiếp đến Database từ Mobile:**
   - Việc nhúng Prisma Client hoặc driver SQL Server vào Flutter là vi phạm nghiêm trọng nguyên tắc an toàn thông tin (lộ Database Connection String, thiếu tường lửa nghiệp vụ, nguy cơ SQL Injection và phá vỡ kiến trúc mạng di động).
3. **Giải pháp kiến trúc chuẩn mực:**
   - **Tạo tầng API Controller mỏng (API Bridge) trên Next.js:** Đặt tại thư mục `hub-el/src/app/api/v1/...` để đóng gói (wrap) các Server Actions sẵn có thành JSON RESTful tiêu chuẩn.

---

## 4. Phân Loại Trạng Thái API Cho Ứng Dụng Flutter

### Nhóm 1: API Đã Có Sẵn - Tái Sử Dụng Ngay (100% Ready)
- `POST /api/momo/create`: Tạo giao dịch nạp tiền MoMo.
- `POST /api/momo/check-status`: Kiểm tra trạng thái giao dịch MoMo.
- `POST /api/upload/message`: Upload ảnh đính kèm trong tin nhắn chat.
- `WebSocket (Socket.io)` trên cổng `3000`: Kết nối realtime chat và thông báo kết bạn.

### Nhóm 2: API Cần Bổ Sung (Cần tạo API Bridge trên Backend Next.js)
Để phục vụ Flutter, các hàm Server Actions cần được phơi bày qua các endpoint RESTful sau:

1. **Authentication API:**
   - `POST /api/v1/auth/login`: Xác thực Email/Password, trả về JWT Access Token & thông tin User.
   - `POST /api/v1/auth/register`: Đăng ký tài khoản mới.
   - `POST /api/v1/auth/forgot-password`: Gửi mã OTP khôi phục mật khẩu.
   - `POST /api/v1/auth/verify-reset-password`: Xác thực OTP và đặt mật khẩu mới.
   - `GET /api/v1/auth/me`: Lấy thông tin tài khoản và chỉ số học tập hiện tại.
2. **Dashboard & Quests API:**
   - `GET /api/v1/dashboard/stats`: Lấy chỉ số cấp độ, XP, Streak, Năng lượng, Xu, Ngọc.
   - `GET /api/v1/dashboard/tasks`: Lấy danh sách nhiệm vụ ngày và tiến độ.
   - `POST /api/v1/dashboard/tasks/claim`: Nhận thưởng nhiệm vụ ngày.
3. **Video Learning & AI Quiz API:**
   - `POST /api/v1/video/search`: Tìm kiếm video có áp dụng màng lọc giáo dục.
   - `GET /api/v1/video/:videoId/related`: Lấy danh sách video liên quan.
   - `POST /api/v1/video/check-educational`: Kiểm tra tính giáo dục của URL YouTube dán vào.
   - `POST /api/v1/video/progress`: Lưu tiến độ giây xem dở dang.
   - `POST /api/v1/video/quiz/generate`: Tạo câu hỏi Quiz từ phụ đề video bằng Gemini.
   - `POST /api/v1/video/quiz/submit`: Nộp bài Quiz, chấm điểm, cộng XP và cập nhật Streak.
4. **Wiki Learning & Gacha API:**
   - `GET /api/v1/wiki/cards`: Lấy danh mục thẻ bài Wiki cá nhân và bộ lọc.
   - `GET /api/v1/wiki/cards/:cardId`: Lấy chi tiết thẻ bài, từ vựng và bài đọc AI.
   - `POST /api/v1/wiki/quiz/generate`: Cấu hình và sinh bài đọc thích ứng từ Wikipedia.
   - `POST /api/v1/wiki/quiz/submit`: Nộp bài thi Wiki, xử lý Thức tỉnh sao (+1 / -1 sao).
   - `POST /api/v1/wiki/card/keep-star`: Chi 50 Xu để cứu sao thẻ bài.
   - `POST /api/v1/gacha/roll`: Quay Gacha thẻ Wiki, trừ 100 Xu, tính bảo hiểm Pity.
   - `GET /api/v1/gacha/exchange`: Lấy số Bụi sao và danh sách thẻ đổi được.
   - `POST /api/v1/gacha/exchange`: Đổi Bụi sao lấy thẻ bài chưa sở hữu.
   - `GET /api/v1/vocabulary`: Lấy sổ tay từ vựng cá nhân đã học.
5. **Social & Chat API:**
   - `GET /api/v1/social/friends`: Danh sách bạn bè và trạng thái online.
   - `GET /api/v1/social/requests`: Danh sách lời mời kết bạn đang chờ.
   - `POST /api/v1/social/request`: Gửi lời mời kết bạn.
   - `POST /api/v1/social/respond`: Đồng ý hoặc từ chối kết bạn.
   - `GET /api/v1/social/chat/history`: Lấy lịch sử tin nhắn 1-1 hoặc nhóm.
   - `POST /api/v1/social/chat/send`: Gửi tin nhắn mới (text, ảnh, thẻ quà tặng).
6. **Leaderboard & Achievements API:**
   - `GET /api/v1/leaderboard`: Lấy bảng xếp hạng theo category (STREAK, GRINDER, TIME, AI_KILLER) và timeframe.
   - `GET /api/v1/achievements`: Quét và lấy danh sách thành tựu đã mở khóa / chưa mở khóa.
7. **Store API:**
   - `POST /api/v1/store/exchange`: Thực hiện đổi tài nguyên (Ngọc <-> Xu <-> Năng lượng).

---

## 5. Kết Luận & Khuyến Nghị Kỹ Thuật

1. **Bảo tồn toàn bộ Database & Logic cũ:**
   - Không cần thay đổi schema Prisma.
   - Không cần viết lại các thuật toán tính toán Cấp độ, Streak, Pity Gacha, hay Prompts của Gemini AI.
2. **Phương thức triển khai cầu nối (API Bridge):**
   - Viết các Route Handler mỏng tại `hub-el/src/app/api/v1/*` import trực tiếp các hàm từ `hub-el/src/actions/*`.
   - Mỗi route handler chỉ làm nhiệm vụ parse JSON request từ Flutter, gọi Server Action tương ứng, và trả về `NextResponse.json(...)`.
3. **Chuẩn bị trên Flutter:**
   - Xây dựng tầng Network với `dio`, cấu hình Base URL, Interceptor gắn Bearer Token hoặc Cookie xác thực, xử lý phân rã lỗi tập trung.

