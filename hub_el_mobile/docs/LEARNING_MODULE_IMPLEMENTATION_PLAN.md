# KẾ HOẠCH TRIỂN KHAI MODULE LEARNING & VIDEO QUIZ (FLUTTER)

> **Căn cứ phân tích:** Source code Next.js responsive tại `hub-el/src` và tài liệu tham chiếu `docs/MOBILE_WEB_UI_REFERENCE.md`  
> **Dự án mục tiêu:** Flutter Mobile App tại `hub_el_mobile`  
> **Phiên bản:** 1.0 — Ngày lập: 07/11/2026

---

## 1. TỔNG QUAN KIẾN TRÚC TỔNG THỂ

Module **Learning & Video Quiz** được xây dựng theo mô hình **Feature-First Clean Architecture** nghiêm ngặt:

```
lib/features/learning/
├── data/
│   ├── datasources/
│   │   └── learning_remote_data_source.dart   # Gọi REST API Next.js Backend
│   ├── models/
│   │   ├── video_model.dart                   # Video & Search result DTO
│   │   ├── learning_progress_model.dart       # Watch time & sync DTO
│   │   └── quiz_model.dart                    # AI Quiz questions & attempt DTO
│   └── repositories/
│       └── learning_repository_impl.dart      # Hiện thực hoá LearningRepository
├── domain/
│   ├── entities/
│   │   ├── video_entity.dart                  # Thực thể Video & Channel
│   │   ├── learning_progress_entity.dart      # Thực thể tiến độ học
│   │   └── quiz_entity.dart                   # Thực thể câu hỏi & đáp án AI Quiz
│   ├── repositories/
│   │   └── learning_repository.dart           # Giao diện Domain Repository
│   └── usecases/
│       ├── search_videos_usecase.dart         # Tìm kiếm video YouTube có lọc
│       ├── check_video_link_usecase.dart      # Kiểm tra link & kiểm duyệt AI
│       ├── get_video_detail_usecase.dart      # Lấy chi tiết & video liên quan
│       ├── sync_learning_progress_usecase.dart# Đồng bộ thời gian học
│       ├── generate_ai_quiz_usecase.dart      # Sinh bài tập trắc nghiệm qua Gemini
│       └── submit_quiz_attempt_usecase.dart   # Nộp bài, chấm điểm & nhận thưởng
└── presentation/
    ├── bloc/
    │   ├── search/                            # Quản lý tìm kiếm video
    │   └── watch/                             # Quản lý phát video, timer, quiz
    ├── screens/
    │   ├── explore_screen.dart                # Giao diện tìm kiếm (tương đương /explore)
    │   └── watch_screen.dart                  # Giao diện xem video & làm quiz (/watch/[id])
    └── widgets/
        ├── youtube_player_widget.dart         # Bộ bọc YouTube IFrame Native
        ├── video_info_card.dart               # Tiêu đề, kênh, nút Like/Report/Share
        ├── related_videos_list.dart           # Danh sách video liên quan
        ├── ai_quiz_generator_card.dart        # Khung tạo câu hỏi AI & chọn số lượng
        ├── quiz_question_card.dart            # Câu hỏi, 4 đáp án A/B/C/D, giải thích
        └── quiz_reward_dialog.dart            # Dialog chúc mừng thưởng XP và Xu
```

---

## 2. SƠ ĐỒ LUỒNG DỮ LIỆU (DATA FLOW)

```
[Người dùng tìm kiếm / Dán URL]
       │
       ▼
[Validate từ khóa & Link kiểm duyệt] ── (Blacklist/Whitelist/Gemini) ──> [Bị từ chối: Banner Lỗi]
       │ (Hợp lệ)
       ▼
[Mở WatchScreen (/watch/:videoId)]
       │
       ├──> [Khởi tạo YouTube Player Native (16:9)]
       ├──> [Kiểm tra Video có bị Quản trị viên khóa (@moderated_videos)]
       ├──> [Lấy danh sách Video Đề Xuất liên quan (Related Videos)]
       │
       ▼
[Theo dõi thời gian xem Video]
       │ ── (Mỗi 60s) ──> [Đồng bộ StudyTime & Task "WATCH_MINUTE" lên Backend]
       │ ── (Đạt 60s đầu) ──> [Đánh dấu Hoàn thành Video + Task "WATCH_COUNT"]
       │
       ▼
[Bấm Tạo Bài Tập AI (AI Quiz Generator)]
       │ ── (Trừ Năng Lượng AI) ──> [Gọi Backend Next.js -> Gemini API]
       ▼
[Hiển thị Interactive Quiz Component]
       │ ── (Chọn đáp án A/B/C/D)
       │ ── (Nộp bài & Chấm điểm tức thì)
       ▼
[Backend Lưu Lịch Sử @quiz_attempts + Cộng XP/Xu + Cập nhật Quests]
       │
       ▼
[Popup Thưởng Tuyệt Vời + Cập nhật Real-time lên Main Shell & Dashboard]
```

---

## 3. DANH SÁCH REST API CẦN BỔ SUNG TRÊN NEXT.JS BACKEND (`/api/v1/videos`)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/videos/search?q={query}&pageToken={token}` | Bearer Token | Tìm kiếm video YouTube qua Server Action `searchAdvancedAction` có áp dụng bộ lọc từ khóa. |
| `POST` | `/api/v1/videos/check` | Bearer Token | Kiểm tra URL YouTube (OEmbed) và xác minh tính giáo dục qua `checkEducationalVideoAction`. |
| `GET` | `/api/v1/videos/[id]` | Bearer Token | Lấy chi tiết trạng thái kiểm duyệt (`ModeratedVideo`) của video. |
| `GET` | `/api/v1/videos/[id]/related` | Bearer Token | Lấy danh sách video liên quan qua `getRelatedVideosAction`. |
| `POST` | `/api/v1/videos/progress/sync` | Bearer Token | Đồng bộ giây học xem dở qua `syncStudyTimeAction` & cập nhật task `WATCH_MINUTE`. |
| `POST` | `/api/v1/videos/progress/complete`| Bearer Token | Đánh dấu hoàn thành video qua `markVideoCompletedAction` & task `WATCH_COUNT`. |
| `POST` | `/api/v1/videos/quiz/generate` | Bearer Token | Sinh câu hỏi trắc nghiệm qua Gemini `generateQuizFromVideoAction`. |
| `POST` | `/api/v1/videos/quiz/submit` | Bearer Token | Lưu kết quả làm bài qua `saveQuizAttemptAction` và tính thưởng XP/Xu. |

---

## 4. DANH SÁCH PRISMA DATABASE MODELS LIÊN QUAN

1. **`Video` (`videos`):** Lưu trữ metadata video YouTube đã học (videoId, title, channelName, thumbnail, duration).
2. **`UserProgress` (`user_progress`):** Lưu tiến độ xem theo giây (`lastWatched`), cờ `isCompleted`, ngày xem gần nhất.
3. **`StudyTime` / `DailyTask`:** Ghi nhận thời gian học tích lũy và cập nhật nhiệm vụ ngày (`WATCH_MINUTE`, `WATCH_COUNT`).
4. **`FavoriteVideo` (`favorite_videos`):** Quản lý danh sách video yêu thích (thả tim).
5. **`ModeratedVideo` (`moderated_videos`):** Danh sách video bị cấm (`BANNED`) hoặc miễn duyệt (`APPROVED`).
6. **`FilterKeyword` (`filter_keywords`):** Danh sách từ khóa cấm (`BLACKLIST`) hoặc từ khóa học tập (`WHITELIST`).
7. **`QuizAttempt` (`quiz_attempts`):** Lưu trữ điểm số, danh sách câu hỏi và đáp án người dùng đã làm.

---

## 5. BẢN ĐỒ ĐỐI CHIẾU REACT COMPONENTS SANG FLUTTER WIDGETS

| React Component trên Web di động | Flutter Widget tương ứng | Đặc tả giao diện & Hành vi |
| :--- | :--- | :--- |
| `ExploreContent` (`explore/page.tsx`) | `ExploreScreen` | Tiêu đề kết quả `text-xl font-bold`, ô tìm kiếm, loader `Loader2`, danh sách dạng cuộn dọc. |
| Thumbnail ngang kết quả tìm kiếm (`w-[140px] aspect-video`) | `VideoSearchTile` | Thumbnail 16:9 bo góc `rounded-xl`, overlay nút Play mờ, tiêu đề `line-clamp-2`, tên kênh có icon người dùng. |
| `iframe#yt-player` (`aspect-video bg-black`) | `YoutubePlayerWidget` | Tỷ lệ chuẩn 16:9, nền đen, tích hợp `youtube_player_flutter` lắng nghe sự kiện Ready và StateChange. |
| Cụm nút Like, Report, Share (`rounded-full border p-3`) | `VideoActionsRow` | 3 nút tròn bo viền mỏng: Heart (đỏ khi liked), Flag (cam báo cáo), Share2 (chia sẻ). |
| Input số lượng câu hỏi & Nút `Tạo bài tập AI` | `AiQuizGeneratorCard` | Ô nhập số lượng (1-20), nút gradient Indigo-Blue, icon `Sparkles`, nhãn tốn Năng lượng AI (`Zap`). |
| Danh sách câu hỏi AI (`space-y-6`) | `QuizQuestionCard` | Tiêu đề "Câu X", 4 nút đáp án A/B/C/D bo góc `rounded-xl`, đổi màu xanh lá khi đúng, đỏ khi sai. |
| Card giải thích đáp án | `QuizExplanationBox` | Bo viền xanh lá/đỏ mờ, icon `CheckCircle`/`XCircle`, text giải thích `text-sm leading-relaxed`. |
| `rewardData` Popup Modal | `QuizRewardDialog` | Modal nền tối bo góc 32px, icon huy chương `Award` xanh lá, badge `+XP` xanh dương, `+XU` vàng, nút "Tiếp Tục Học". |
| Danh sách Video Đề Xuất (`w-[140px] aspect-video`) | `RelatedVideosSection` | Tiêu đề "Video Đề Xuất", danh sách thẻ video nhỏ xếp dọc bên dưới trên giao diện điện thoại. |
| Modal khóa video cấm (`Ban` icon) | `VideoBannedDialog` | Khóa toàn màn hình với nền mờ `black/80`, thông báo vi phạm và nút "Đồng ý (Quay về Trang chủ)". |

---

## 6. LỘ TRÌNH TRIỂN KHAI 5 PHẦN TUẦN TỰ

- **PHẦN A — YOUTUBE INTEGRATION (ĐANG THỰC HIỆN BƯỚC NÀY):**
  1. Thêm dependency `youtube_player_flutter` vào Flutter.
  2. Bổ sung API endpoints `/api/v1/videos/search`, `/api/v1/videos/check`, `/api/v1/videos/[id]`, `/api/v1/videos/[id]/related` trên Next.js backend.
  3. Xây dựng Data & Domain Layer (`VideoModel`, `VideoEntity`, `LearningRemoteDataSource`, `LearningRepository`).
  4. Xây dựng `ExploreScreen` (Tìm kiếm video YouTube có màng lọc từ khóa chuẩn Mobile Web).
  5. Xây dựng `WatchScreen` với Native YouTube Player, thông tin video, kiểm tra video bị cấm và danh sách video liên quan.
  6. Kết nối từ Header (Search Overlay & Dán URL) và Dashboard (Click thumbnail) chuyển thẳng vào `WatchScreen`.
  7. Kiểm thử trực tiếp trên Android Emulator và tạo báo cáo `YOUTUBE_INTEGRATION_REPORT.md`.
- **PHẦN B — LEARNING PROGRESS (Sau khi Phần A nghiệm thu):**
  - Đồng bộ thời gian học tích lũy mỗi 60 giây, tự động đánh dấu hoàn thành bài học, khôi phục thời gian xem dở.
- **PHẦN C — AI QUIZ GENERATOR (Sau khi Phần B nghiệm thu):**
  - Tích hợp gọi sinh câu hỏi trắc nghiệm tự động bằng Gemini, trừ Năng lượng AI.
- **PHẦN D — INTERACTIVE QUIZ (Sau khi Phần C nghiệm thu):**
  - Giao diện làm bài thi trực tiếp dưới video, chọn đáp án, phản hồi màu sắc, hiện giải thích chi tiết.
- **PHẦN E — REWARDS & STATISTICS (Sau khi Phần D nghiệm thu):**
  - Nộp bài chấm điểm, nhận thưởng XP và Xu, cập nhật Daily Tasks và thống kê Profile.

