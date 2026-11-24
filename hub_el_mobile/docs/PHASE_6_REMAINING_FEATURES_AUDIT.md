# BÁO CÁO KIỂM KÊ TÍNH NĂNG & ĐỐI CHIẾU HỆ THỐNG
# PHASE 6 – REMAINING FEATURES AUDIT
**Dự án:** Chuyển đổi toàn diện Hub-EL từ Next.js Web sang Flutter Native App  
**Ngày thực hiện:** 21/11/2026  
**Trạng thái:** Hoàn thành kiểm toán (Audit Complete)

---

## 1. TỔNG QUAN KIẾN TRÚC HIỆN TẠI

Hệ thống **Hub-EL** đang vận hành song song trên 2 nền tảng:
- **Backend / Web:** Next.js (App Router), Prisma ORM kết nối Microsoft SQL Server, NextAuth (Auth.js v5), Socket.IO server tích hợp (`server.js`), Nodemailer (Gmail SMTP), MoMo Payment Gateway.
- **Mobile Native Client (`hub_el_mobile`):** Flutter 3.x, Feature-First Clean Architecture, Quản lý trạng thái BLoC/Cubit, Mạng Dio (JWT Bearer Auth, Refresh Token tự động), Socket.IO client, Giao diện chuẩn Native (không dùng WebView).

```
                      ┌────────────────────────────────────────┐
                      │        DATABASE (MS SQL Server)        │
                      └───────────────────▲────────────────────┘
                                          │ (Prisma ORM)
                      ┌───────────────────┴────────────────────┐
                      │         NEXT.JS BACKEND CORE           │
                      │ ────────────────────────────────────── │
                      │ - Auth.js / JWT Handshake              │
                      │ - Server Actions (Web UI)              │
                      │ - Shared Services (*.service.ts)       │
                      │ - REST API Bridges (/api/v1/*)         │
                      │ - Realtime Socket.IO Server            │
                      └───────────▲──────────────────▲─────────┘
                                  │                  │
                (Session Cookie / Actions)    (JWT Bearer / Dio / Sockets)
                                  │                  │
               ┌──────────────────┴──┐    ┌──────────┴───────────────┐
               │    NEXT.JS WEB UI   │    │    FLUTTER NATIVE APP    │
               │  (Desktop + Mobile) │    │     (Android / iOS)      │
               └─────────────────────┘    └──────────────────────────┘
```

---

## 2. DANH SÁCH TOÀN BỘ TÍNH NĂNG WEBSITE (`hub-el`)

Dựa trên khảo sát cấu trúc route `src/app`, `src/actions`, `src/services`, `prisma/schema.prisma` và `src/components`:

| STT | Phân hệ (Module) | Đường dẫn Web | Chức năng chi tiết trên Web |
|---|---|---|---|
| 1 | **Xác thực (Auth)** | `/(auth)/login`, `register`, `/forgot-password` | Đăng nhập Email/Pass, Đăng ký, Quên mật khẩu gửi OTP Gmail, Đăng nhập Google OAuth. |
| 2 | **Dashboard (Tổng quan)** | `/(main)/dashboard` | Thông tin tài khoản, Cấp độ/XP, Streak lửa, Nhiệm vụ hàng ngày (Quest Claim), Video đề xuất, Hoạt động gần đây, Video yêu thích. |
| 3 | **Khám phá & Video** | `/(main)/explore`, `/watch/[videoId]` | Tìm kiếm Youtube, Crawl dữ liệu video, Xem video, Tạo AI Quiz (3/5/10 câu), Đồng bộ tiến độ xem, Thả tim video yêu thích. |
| 4 | **Luyện tập (Practice)** | `/(main)/historyquizz`, `/quizzes/review` | Xem lịch sử các bài trắc nghiệm đã làm, Ôn tập chi tiết từng câu hỏi, đáp án đúng, giải thích. |
| 5 | **Khóa học (Courses)** | `/(main)/courses`, `/playlist/[playlistId]` | Quản lý danh sách playlist video đã lưu, Thống kê điểm số/xếp loại, Xem danh sách bài học trong playlist. |
| 6 | **Wiki Tri Thức** | `/(main)/wiki-manager`, `/wiki/[id]` | Bộ sưu tập thẻ bài Wiki, Lọc độ hiếm (MR->N), Xoay 3D thẻ, Cấu hình học, AI sinh bài đọc đơn giản hóa, Tra từ vựng chạm phát âm, Quiz đọc hiểu, Giữ sao/Thức tỉnh sao. |
| 7 | **Cầu Nguyện (Gacha)** | `/(main)/gacha` | Quay thẻ x1, x10, Hệ thống bảo hiểm Pity (UR/SSR/SR), Chuyển hóa thẻ trùng thành Bụi sao, Đổi thẻ UR bằng Bụi sao, Lịch sử quay thẻ, Lượt quay Free mỗi ngày cho VIP. |
| 8 | **Bạn bè & Cộng đồng** | `/(main)/social` | Danh sách bạn bè, Tìm kiếm người dùng, Lời mời kết bạn (gửi/nhận), Chấp nhận/Từ chối/Hủy, Xóa bạn, Chặn/Bỏ chặn, Xem hồ sơ công khai của người khác. |
| 9 | **Tin nhắn Realtime** | `/(main)/social` (Khung chat) | Nhắn tin 1-1 và Nhóm thời gian thực qua Socket.IO, Gửi/nhận tin nhắn văn bản, Trích dẫn/Trả lời tin nhắn, Tặng thẻ Wiki cho bạn bè, Nhận thẻ bài quà tặng. |
| 10 | **Bảng Xếp Hạng** | `/(main)/leaderboard` | Xếp hạng theo 4 nhóm: Bền bỉ (Streak), Cày cuốc (XP), Thời gian học, Diệt AI (Quiz đúng); 4 mốc thời gian: Hôm nay, Tuần này, Tháng này, Mọi lúc; Bục vinh quang Top 3 & Danh sách Top 50; Thẻ cá nhân cố định. |
| 11 | **Thống kê Học tập** | Modal Thống kê trên Web | Báo cáo chi tiết 3 nhóm: Tổng quan (Chuỗi, Thời gian, Độ chính xác, Phong độ gần nhất); Học tập & Tiến độ (Hồ sơ học, Ngôn ngữ, Nhiệm vụ ngày); Gacha & Xã hội (Bộ sưu tập thẻ, Bụi sao, Pity, Ví tiền tệ, Bạn bè). |
| 12 | **Cửa hàng & Kinh tế (Store)** | `/(main)/store` | 3 Tab: Gói VIP PRO (Thanh toán MoMo), Nạp Ngọc (MoMo), Đổi tài nguyên (Ngọc -> Năng lượng/Xu, Xu -> Năng lượng). Lịch sử đơn hàng MoMo callback. |
| 13 | **Thành tựu (Achievements)** | `/(main)/achievements` | 64 thành tựu phân 14 nhóm (Streak, Level, Video, Quiz, Vocab, Gacha, Stardust, Share, Friend, Chat, Chi tiêu, Cú đêm...). 6 cấp bậc Tier. Tự động kiểm tra điều kiện, nhận thưởng XP, Xu Gacha, Năng lượng AI. |
| 14 | **Kho Từ Vựng (Vocabulary)** | `/(main)/vocabulary` | Toàn bộ từ vựng đã tích lũy từ các thẻ Wiki sở hữu; Sắp xếp A-Z; Lọc theo ngôn ngữ; Phát âm giọng đọc chuẩn (TTS); Mở Modal tra cứu ngữ cảnh đoạn văn gốc của bài học đã học từ đó. |
| 15 | **Cài đặt & Tài khoản (Settings)** | `/(main)/settings` | 4 Tab: (1) Thông tin cá nhân (Họ tên, username, bio, sở thích, link MXH, đổi avatar base64); (2) Bảo mật & Đăng nhập (Check OAuth, Gửi OTP Gmail, Đổi mật khẩu); (3) Quyền riêng tư; (4) Cài đặt thông báo Email. |
| 16 | **Góp ý người dùng (Feedback)** | Form góp ý / Hỗ trợ | Người dùng gửi ý kiến đóng góp, phản hồi về lỗi hoặc đề xuất tính năng lưu vào bảng `feedbacks`. |
| 17 | **Hệ thống Quản trị (Admin)** | `/admin/*` | Crawl thẻ, duyệt thẻ, kiểm duyệt video vi phạm, quản lý từ khóa cấm, quản lý người dùng & phân quyền, quản lý đơn hàng MoMo, quản lý nhiệm vụ hệ thống, báo cáo tổng hợp. |

---

## 3. DANH SÁCH TÍNH NĂNG FLUTTER NATIVE (`hub_el_mobile`)

Cấu trúc hiện có trong `hub_el_mobile/lib`:

```
lib/
├── core/                  # Theme, Colors, Spacing, Network (Dio, AuthInterceptor), Constants (Endpoints), Utils
├── features/
│   ├── authentication/    # Đăng nhập, Đăng ký, Quên mật khẩu, Refresh token, BLoC (21 files)
│   ├── dashboard/         # Shell 5 tab, Header bar, Streak Dialog, Quest Progress (17 files)
│   ├── learning/          # Explore, Video Watch, AI Quiz generate/submit, Favorite video (40 files)
│   ├── practice/          # Quiz History categorized, Question Review Screen (3 files)
│   ├── courses/           # Saved Playlists, Playlist detail & videos, Toggle save course (3 files)
│   ├── wiki/              # Wiki Manager, 3D Tilt Card, Study passage, Inline vocab, Star retention (36 files)
│   ├── gacha/             # Praying screen, 1x/10x Pulls, Pity UR/SSR/SR, Exchange, History, Clean UI (31 files)
│   ├── social/            # Friends list, Requests, Search, Block, Other User Profile, Chat 1-1, Groups, Gift Cards (35 files)
│   ├── leaderboard/       # 4 Categories, 4 Timeframes, Top 50 podium, Real XP sticky card (14 files)
│   ├── profile/           # [Trống - 0 files]
│   ├── settings/          # [Trống - 0 files]
│   └── store/             # [Trống - 0 files]
└── shared/widgets/        # MobileHeaderBar, CustomBottomNav, StatsDialog (3 tabs), ResourcePill, BaseModal
```

---

## 4. BẢNG ĐỐI CHIẾU WEB & FLUTTER

Dưới đây là ma trận đối chiếu trạng thái chi tiết theo 6 tiêu chí phân loại:

| Tính năng / Nghiệp vụ | Trạng thái hiện tại | Vị trí Web (`hub-el`) | Vị trí Mobile (`hub_el_mobile`) | Ghi chú & Đánh giá |
|---|---|---|---|---|
| **1. Đăng nhập / Đăng ký / Quên MK** | **ĐÃ HOÀN THÀNH** | `/(auth)/*` | `features/authentication` | JWT Bearer, Token Refresh tự động qua Interceptor. |
| **2. Header Bar & Chỉ số Tài nguyên** | **ĐÃ HOÀN THÀNH** | `components/layout/Header` | `shared/widgets/mobile_header_bar.dart` | Avatar base64/URL, Streak, Energy, Coin, Gem pills. |
| **3. Bottom Navigation Shell** | **ĐÃ HOÀN THÀNH** | Menu Web / Mobile Nav | `shared/widgets/custom_bottom_nav.dart` | Chuẩn 5 tab: Tổng quan, Luyện tập, Khóa học (FAB), Cộng đồng, Xếp hạng. |
| **4. Trang chủ & Nhiệm vụ hàng ngày** | **ĐÃ HOÀN THÀNH** | `/(main)/dashboard` | `features/dashboard` | Thẻ học tiếp, Nhận thưởng quest, Video yêu thích, Hoạt động gần đây. |
| **5. Khám phá & Học Video Youtube** | **ĐÃ HOÀN THÀNH** | `/(main)/explore`, `/watch` | `features/learning` | Tìm kiếm, Player native, Đồng bộ thời gian học (Heartbeat 15s). |
| **6. Tạo & Làm Quiz AI từ Video** | **ĐÃ HOÀN THÀNH** | `actions/quiz.ts` | `features/learning` | Chọn 3/5/10 câu, trừ Energy, chấm điểm, nhận XP/Xu, mở khóa bài. |
| **7. Lưu Video Yêu Thích** | **ĐÃ HOÀN THÀNH** | `actions/user/favorites.ts` | `WatchScreen` & `DashboardScreen` | Nút tim đổi trạng thái, API `/api/v1/videos/favorite`. |
| **8. Góc Luyện Tập & Ôn Lại Bài Thi** | **ĐÃ HOÀN THÀNH** | `/(main)/historyquizz` | `features/practice` (Tab 1) | Lịch sử phân nhóm, Review câu hỏi, đáp án đúng, giải thích. |
| **9. Quản Lý Khóa Học & Playlist** | **ĐÃ HOÀN THÀNH** | `/(main)/courses`, `/playlist` | `features/courses` (Tab 2) | Danh sách playlist đã lưu, Xếp loại, Chi tiết bài học, Nút Lưu khóa học. |
| **10. Quản Lý Thẻ Wiki Tri Thức** | **ĐÃ HOÀN THÀNH** | `/(main)/wiki-manager` | `features/wiki` | Lọc độ hiếm, Trạng thái sở hữu, Hiệu ứng thẻ 3D, Đã fix lỗi ảnh Wikimedia. |
| **11. Phòng Luyện Đọc & Học Thẻ Wiki** | **ĐÃ HOÀN THÀNH** | `/(main)/wiki/[id]` | `features/wiki` | Cấu hình học, Đoạn văn AI, Chạm dịch từ vựng, Trắc nghiệm, Thức tỉnh sao. |
| **12. Hệ Thống Quay Gacha Tri Thức** | **ĐÃ HOÀN THÀNH** | `/(main)/gacha` | `features/gacha` | Roll x1/x10, Pity UR/SSR/SR, Bụi sao, Đổi thẻ, Hàng nút icon ngang chuẩn đẹp. |
| **13. Bạn Bè & Cộng Đồng** | **ĐÃ HOÀN THÀNH** | `/(main)/social` | `features/social` (Tab 3) | Lọc bạn trùng, Gửi/nhận lời mời, Chặn/Bỏ chặn, Xem profile người khác. |
| **14. Nhắn Tin Realtime & Tặng Thẻ** | **ĐÃ HOÀN THÀNH** | `actions/social`, Socket.IO | `features/social` | Chat 1-1, Chat nhóm, Gửi thẻ Wiki quà tặng, Claim thẻ, Trả lời tin nhắn. |
| **15. Bảng Vàng Xếp Hạng** | **ĐÃ HOÀN THÀNH** | `/(main)/leaderboard` | `features/leaderboard` (Tab 4) | 4 nhóm xếp hạng, 4 mốc thời gian, Rank thật bản thân (#2 với 2.045 XP). |
| **16. Thống Kê Học Tập (Stats Dialog)** | **ĐÃ HOÀN THÀNH** | Modal Web | `shared/widgets/stats_dialog.dart` | 3 Tab đầy đủ: Tổng quan, Học tập & Tiến độ, Gacha & Xã hội. |
| **17. Cửa Hàng Vật Phẩm & Kinh Tế** | **MỚI CÓ BACKEND / CHƯA CHUYỂN ĐỔI** | `/(main)/store`, `actions/store.ts`, `/api/momo/*` | `features/store` (Trống) | Web có đổi tài nguyên, nạp Ngọc qua MoMo, mua VIP. Flutter hiện chỉ có placeholder. |
| **18. Hệ Thống 64 Thành Tựu** | **MỚI CÓ BACKEND / CHƯA CHUYỂN ĐỔI** | `/(main)/achievements`, `actions/achievements.ts` | Chưa có thư mục (`placeholder`) | Web có 64 huy hiệu, claim XP/Xu/Energy tự động. Flutter chưa có giao diện. |
| **19. Kho Từ Vựng Cá Nhân (Notebook)** | **MỚI CÓ BACKEND / CHƯA CHUYỂN ĐỔI** | `/(main)/vocabulary`, `actions/vocabulary.ts` | `wiki_vocabulary_sheet.dart` (chỉ dùng nội bộ wiki) | Web có tra cứu A-Z, lọc ngôn ngữ, phát âm TTS, xem ngữ cảnh bài học. |
| **20. Cài Đặt Hồ Sơ & Đổi Avatar** | **MỚI CÓ BACKEND / CHƯA CHUYỂN ĐỔI** | `/(main)/settings` (Tab Profile) | `features/settings` (Trống) | Chưa có màn hình chỉnh sửa Họ tên, Username, Bio, Sở thích, Social Links, Avatar. |
| **21. Bảo Mật Tài Khoản & Đổi Mật Khẩu** | **MỚI CÓ BACKEND / CHƯA CHUYỂN ĐỔI** | `/(main)/settings` (Tab Security) | `features/settings` (Trống) | Chưa có chức năng gửi OTP Gmail, Đổi mật khẩu có mật khẩu cũ hoặc qua OTP. |
| **22. Cài Đặt Quyền Riêng Tư & Thông Báo** | **MỚI CÓ BACKEND / CHƯA CHUYỂN ĐỔI** | `/(main)/settings` (Tab Privacy/Notif) | `features/settings` (Trống) | Lưu JSON privacySettings, notificationSettings. |
| **23. Góp Ý & Phản Hồi (Feedback)** | **MỚI CÓ BACKEND / CHƯA CHUYỂN ĐỔI** | `actions/user/feedback.ts` | Chưa có | Form gửi góp ý của người dùng vào hệ thống. |
| **24. Toàn bộ Phân Hệ Admin** | **KHÔNG CẦN CHUYỂN SANG MOBILE** | `/admin/*` | Không triển khai | Phân hệ quản trị dành riêng cho Ban quản trị trên Desktop Web. |

---

## 5. CHI TIẾT CÁC TÍNH NĂNG CHƯA HOÀN THÀNH (PHẠM VI PHASE 6)

Từ bảng đối chiếu, 4 khối tính năng người dùng cốt lõi còn thiếu cần triển khai trong Giai đoạn 6 bao gồm:

### Module 6A: Cửa Hàng & Kinh Tế (Store & Economy)
* **Thực trạng Web:** 
  * Tab 1: **Gói VIP PRO** (1 tháng: 49k, 6 tháng: 249k, 1 năm: 399k) -> Kích hoạt tag VIP vàng, tăng tối đa năng lượng, tăng 20% XP & Xu, tặng thẻ đóng băng.
  * Tab 2: **Nạp Ngọc (MoMo)** (20k = 200 ngọc, 50k = 525 ngọc, 100k = 1.100 ngọc, 200k = 2.300 ngọc, 500k = 6.000 ngọc).
  * Tab 3: **Đổi Tài Nguyên** (Ngọc -> 50 Năng lượng, Ngọc -> 1.000 Xu, 200 Xu -> 10 Năng lượng). Xử lý an toàn qua DB Transaction chống race condition.
* **Thực trạng Flutter:** Thư mục `features/store` đang trống. Bấm vào Cửa Hàng ở Menu Profile chỉ hiện SnackBar.
* **Cần bổ sung:**
  1. Shared Service: `store.service.ts` chuẩn hóa các hành vi đổi tiền và tạo giao dịch.
  2. REST API: `POST /api/v1/store/exchange`, `GET /api/v1/store/packages`, `POST /api/v1/store/momo/create`, `GET /api/v1/store/momo/status`.
  3. Flutter Native UI: `StoreScreen` với 3 Tab (Đổi tài nguyên, Gói VIP PRO, Nạp Ngọc MoMo). Deeplink thanh toán MoMo App-to-App (`url_launcher`).

### Module 6B: Hệ Thống Thành Tựu (Achievements System)
* **Thực trạng Web:**
  * Có 64 thành tựu định nghĩa trong `src/config/achievements.ts`, chia làm 14 nhóm và 6 cấp bậc Tier (Đồng, Bạc, Vàng, Kim cương, Huyền thoại, Thần thánh).
  * Hàm `checkAndGetAchievements(userId)` tự động so sánh số liệu thực tế của học viên (Streak, Level, Video watched, Quiz correct, Quiz total, Vocab, Gacha, Stardust...) với mốc yêu cầu.
  * Khi hoàn thành thành tựu mới, tự động ghi nhận vào `UserAchievement`, cộng dồn thưởng XP, Xu Gacha, Năng lượng AI và hiển thị Popup chúc mừng rực rỡ.
* **Thực trạng Flutter:** Chưa có module `features/achievements`. Menu Profile hiện đang hiển thị SnackBar tạm thời.
* **Cần bổ sung:**
  1. Shared Service: `achievements.service.ts`.
  2. REST API: `GET /api/v1/achievements` (trả về danh sách thành tựu, tiến độ % của từng huy hiệu, danh sách huy hiệu mới mở khóa kèm phần thưởng cộng thêm).
  3. Flutter Native UI: `AchievementsScreen` với 2 chế độ xem (Tất cả / Đang tiến hành vs Đã mở khóa), Thanh tổng tiến độ (ví dụ 1/64), Badge huy hiệu với viền màu theo 6 Tier, Modal chúc mừng mở khóa thành tựu mới.

### Module 6C: Kho Từ Vựng Cá Nhân (Vocabulary Notebook)
* **Thực trạng Web:**
  * `getUserVocabulary(userId)` lấy tất cả từ vựng thuộc các thẻ Wiki mà người dùng đang sở hữu trong `user_inventory`, trải phẳng mảng và sắp xếp thứ tự A-Z.
  * Trang `src/app/(main)/vocabulary/page.tsx` cho phép tìm kiếm theo từ khóa, lọc theo ngôn ngữ đích (Tiếng Anh, Nhật, Hàn, Trung, Pháp, Đức), nút Loa phát âm chuẩn bản ngữ (Web Speech API).
  * Đặc biệt có tính năng **Ngữ cảnh bài học**: Khi bấm vào xem chi tiết từ vựng, hệ thống mở modal hiển thị trích đoạn bài văn đơn giản hóa (Simplified text) mà người dùng từng gặp từ vựng đó khi học thẻ Wiki.
* **Thực trạng Flutter:** Chỉ có một bottom sheet nhỏ phụ vụ lúc đang làm bài học Wiki. Chưa có màn hình tra cứu từ vựng độc lập.
* **Cần bổ sung:**
  1. Shared Service: `vocabulary.service.ts`.
  2. REST API: `GET /api/v1/vocabulary` (danh sách từ vựng từ thẻ đã có), `GET /api/v1/vocabulary/context?cardId=...&word=...` (ngữ cảnh bài học trích xuất).
  3. Flutter Native UI: `VocabularyScreen` hoàn chỉnh, tích hợp bộ tìm kiếm, chip lọc ngôn ngữ, phát âm TTS thông qua package `flutter_tts`, modal xem ngữ cảnh bài đọc gốc.

### Module 6D: Cài Đặt, Hồ Sơ & Bảo Mật (Settings, Profile & Security)
* **Thực trạng Web:**
  * `src/app/(main)/settings` chia làm 4 tab:
    1. **Hồ sơ:** Sửa Họ tên, Username, Tiểu sử (Bio), Danh sách sở thích (`interests`), Các liên kết mạng xã hội (`socialLinks`), Đổi ảnh đại diện (Upload hoặc chọn Base64).
    2. **Bảo mật:** Kiểm tra loại tài khoản (Google OAuth hay Mật khẩu), Gửi mã xác thực OTP qua Gmail (Nodemailer), Đổi mật khẩu khi nhớ mật khẩu cũ, Đổi mật khẩu qua OTP khi quên.
    3. **Quyền riêng tư:** Tùy chọn bật/tắt hiển thị hồ sơ cá nhân với cộng đồng, hiển thị trên bảng xếp hạng.
    4. **Thông báo:** Tùy chọn nhận email nhắc học, báo cáo tuần.
  * Góp ý: `submitFeedbackAction` gửi phản hồi về hệ thống.
* **Thực trạng Flutter:** `features/settings` và `features/profile` đang trống. Người dùng chưa thể tự sửa thông tin cá nhân hay đổi mật khẩu ngay trên app.
* **Cần bổ sung:**
  1. Shared Service: `settings.service.ts`.
  2. REST API:
     - `GET & PUT /api/v1/settings/profile` (lấy và cập nhật thông tin cá nhân, avatar).
     - `GET /api/v1/settings/security` (kiểm tra trạng thái bảo mật).
     - `POST /api/v1/settings/security/send-otp` (gửi mã OTP về Gmail).
     - `POST /api/v1/settings/security/change-password` (đổi mật khẩu).
     - `PUT /api/v1/settings/privacy` (quyền riêng tư).
     - `PUT /api/v1/settings/notifications` (cài đặt thông báo).
     - `POST /api/v1/feedback` (gửi góp ý).
  3. Flutter Native UI: `SettingsScreen` với 4 tab giao diện Native mượt mà, `FeedbackDialog` cho người dùng đóng góp ý kiến.

---

## 6. DANH SÁCH REST API CẦN BỔ SUNG (PHASE 6)

Tất cả các Endpoint đều bắt buộc bảo vệ bằng `api-auth.ts` (JWT Bearer Token):

| Phân hệ | Phương thức | Endpoint REST API | Mục đích nghiệp vụ |
|---|---|---|---|
| **Store** | `GET` | `/api/v1/store/packages` | Lấy danh sách gói VIP và gói Nạp Ngọc |
| **Store** | `POST` | `/api/v1/store/exchange` | Thực hiện đổi tài nguyên (Ngọc -> Năng lượng/Xu, Xu -> Năng lượng) |
| **Store** | `POST` | `/api/v1/store/momo/create` | Khởi tạo đơn thanh toán MoMo và lấy deep link / payUrl |
| **Store** | `POST` | `/api/v1/store/momo/check-status`| Kiểm tra trạng thái đơn hàng MoMo và cộng tài nguyên tức thì |
| **Achievements** | `GET` | `/api/v1/achievements` | Kiểm tra điều kiện, trả về 64 thành tựu, tiến độ và thưởng mở khóa mới |
| **Vocabulary** | `GET` | `/api/v1/vocabulary` | Lấy danh sách từ vựng cá nhân tích lũy từ thẻ bài sở hữu |
| **Vocabulary** | `GET` | `/api/v1/vocabulary/context` | Lấy đoạn văn ngữ cảnh gốc nơi từ vựng xuất hiện trong bài học Wiki |
| **Settings** | `GET` | `/api/v1/settings/profile` | Lấy chi tiết hồ sơ cá nhân đầy đủ (bio, interests, socialLinks) |
| **Settings** | `PUT` | `/api/v1/settings/profile` | Cập nhật hồ sơ cá nhân (tên, username, bio, sở thích, socialLinks) |
| **Settings** | `POST` | `/api/v1/settings/avatar` | Cập nhật ảnh đại diện người dùng |
| **Settings** | `GET` | `/api/v1/settings/security` | Kiểm tra loại tài khoản (OAuth hay Password) |
| **Settings** | `POST` | `/api/v1/settings/security/send-otp` | Gửi mã OTP xác thực 6 số qua Gmail |
| **Settings** | `POST` | `/api/v1/settings/security/change-password` | Đổi mật khẩu tài khoản |
| **Settings** | `PUT` | `/api/v1/settings/privacy` | Cập nhật cài đặt quyền riêng tư |
| **Settings** | `PUT` | `/api/v1/settings/notifications` | Cập nhật cài đặt nhận thông báo |
| **Feedback** | `POST` | `/api/v1/feedback` | Gửi phản hồi, góp ý của học viên |

---

## 7. CÁC SHARED SERVICES CẦN BỔ SUNG TRÊN BACKEND

Để tuân thủ nguyên tắc không viết lại nghiệp vụ và đảm bảo cả Server Actions (Web) lẫn Route Handlers (Flutter REST API) dùng chung 1 nguồn chân lý (Single Source of Truth), cần tạo 4 Shared Services tại `src/services/`:
1. `src/services/store.service.ts`:
   - `getStorePackagesService()`
   - `exchangeResourcesService(userId, type)`
   - `createMoMoOrderService(userId, type, amount, name)`
   - `checkMoMoOrderStatusService(orderId)`
2. `src/services/achievements.service.ts`:
   - `checkAndGetAchievementsService(userId)`
3. `src/services/vocabulary.service.ts`:
   - `getUserVocabularyService(userId)`
   - `getVocabularyContextService(userId, cardId, word)`
4. `src/services/settings.service.ts`:
   - `getUserSettingsProfileService(userId)`
   - `updatePersonalProfileService(userId, data)`
   - `updateAvatarService(userId, base64Image)`
   - `getSecurityInfoService(userId)`
   - `sendSecurityOtpService(email)`
   - `changePasswordService(userId, oldPass, newPass)`
   - `updatePrivacyService(userId, privacyData)`
   - `updateNotificationSettingsService(userId, notifData)`
   - `submitFeedbackService(userId, userName, content)`

---

## 8. CÁC PRISMA MODEL LIÊN QUAN

Tất cả các Model cơ sở dữ liệu đã tồn tại đầy đủ trong `prisma/schema.prisma`, **tuyệt đối không cần sửa đổi hay tạo thêm bảng**:
- `User` (tiểu sử, mạng xã hội, sở thích, số dư ví, tag PRO, hạn VIP).
- `UserStats` (tổng thời gian học, tổng video, số câu đúng, từ vựng tích lũy, số lần quay gacha, tổng chi tiêu).
- `UserInventory` & `WikiCard` & `Vocabulary` (kho thẻ và từ vựng liên quan).
- `Achievement` & `UserAchievement` (danh mục thành tựu và bảng quan hệ học viên - huy hiệu).
- `Order`, `SubscriptionPlan`, `CoinPackage`, `CoinTransaction` (đơn hàng MoMo, gói VIP, gói Xu, biến động số dư).
- `VerificationCode` (lưu trữ mã OTP 6 số gửi qua Gmail).
- `Feedback` (góp ý người dùng).

---

## 9. MỨC ĐỘ PHỤ THUỘC GIỮA CÁC MODULE (DEPENDENCY MATRIX)

```
[Store / Kinh tế]  <──────  Cộng tiền/trừ tiền  ──────>  [Header & Stats Dialog]
       ▲
       │ Cung cấp Năng lượng & Xu
       │
[Achievements]  ─────────  Thưởng XP, Xu, Năng lượng  ───>  [User Gamification]
       ▲
       │ Đọc chỉ số từ
       │
[Learning, Gacha, Social, Vocabulary]

[Vocabulary]  <──────────  Trích xuất từ thẻ bài  ───────  [Wiki Cards Inventory]

[Settings / Profile]  ───  Cập nhật định danh & avatar  ─>  [Header, Social, Leaderboard]
```

---

## 10. ĐÁNH GIÁ RỦI RO KỸ THUẬT & PHƯƠNG ÁN XỬ LÝ

| Rủi ro kỹ thuật | Mức độ | Hậu quả tiềm ẩn | Phương án giải quyết an toàn |
|---|:---:|---|---|
| **Thanh toán MoMo trên Mobile** | Cao | MoMo Web QR không tối ưu trên điện thoại | Tận dụng URL Scheme `momo://` hoặc `app-to-app deeplink` của MoMo bằng `url_launcher`. Nếu không có app MoMo, tự động fallback sang MoMo Web Gateway. |
| **Gửi OTP Gmail bằng SMTP** | Trung bình | Email bị rơi vào Spam hoặc chậm | Sử dụng `VerificationCode` với hạn 5 phút. Cấu hình log OTP rõ ràng ở chế độ DEV để phục vụ test trên emulator. |
| **Phát âm TTS đa ngôn ngữ** | Thấp | Không phải máy Android nào cũng cài đủ voicepack (Pháp, Đức, Hàn...) | Sử dụng `flutter_tts`, kiểm tra ngôn ngữ khả dụng trên thiết bị trước khi phát âm, fallback sang tiếng Anh hoặc báo lỗi thân thiện. |
| **Race condition khi đổi tài nguyên** | Cao | Trừ xu 2 lần hoặc bug nhân đôi năng lượng | Toàn bộ logic cộng/trừ tài nguyên phải bọc trong `prisma.$transaction` với khóa dòng độc quyền (Pessimistic / Transaction Isolation). |

---

## 11. ĐỀ XUẤT THỨ TỰ TRIỂN KHAI

Để đảm bảo các module có tính phụ thuộc cao được hoàn thiện trước, thứ tự triển khai Phase 6 được khuyến nghị như sau:
1. **Bước 6.2:** Xây dựng Shared Services & REST API Bridges cho toàn bộ 4 module (Store, Achievements, Vocabulary, Settings).
2. **Bước 6.3:** Triển khai **Store & Economy** trên Flutter Native (Đổi tài nguyên, Gói VIP PRO, Nạp Ngọc MoMo).
3. **Bước 6.4:** Triển khai **Achievements System** trên Flutter Native (64 huy hiệu, Danh mục, Claim phần thưởng tự động).
4. **Bước 6.5:** Triển khai **Vocabulary Notebook (Kho Từ Vựng)** trên Flutter Native (Tra cứu A-Z, TTS phát âm, Ngữ cảnh bài học).
5. **Bước 6.6:** Triển khai **Settings, Profile & Security** trên Flutter Native (Sửa hồ sơ, Đổi mật khẩu qua OTP, Quyền riêng tư, Góp ý).
6. **Bước 6.7:** **Final System Audit, Regression Test & Performance Polish** (Kiểm tra hồi quy toàn diện, dọn dẹp log, đo tải).

