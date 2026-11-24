# Hub-EL — Nền Tảng Học Tập Trực Tuyến Tương Tác & Gamification

Dự án monorepo chứa toàn bộ mã nguồn của hệ sinh thái **Hub-EL**, bao gồm ứng dụng Web/Backend (Next.js 15) và ứng dụng di động Native (Flutter 3).

---

## 📁 Cấu Trúc Dự Án

```tree
hub_elearning/
├── hub-el/                 # Ứng dụng Web & REST API Backend (Next.js 15, Prisma, Socket.IO)
│   ├── src/                # Mã nguồn Next.js (App Router, Services, Components)
│   ├── prisma/             # Schema & Migrations cho cơ sở dữ liệu SQL Server
│   ├── scripts/            # Kịch bản kiểm thử tự động Backend (281 test cases)
│   ├── docs/               # Báo cáo kỹ thuật, API Contract & Kiến trúc hệ thống
│   ├── package.json        # Dependencies Node.js
│   └── .env.example        # Mẫu biến môi trường mẫu
│
├── hub_el_mobile/          # Ứng dụng di động Flutter Native (Clean Architecture, BLoC)
│   ├── lib/                # Mã nguồn Flutter (core, features, shared)
│   ├── test/               # Bộ kiểm thử tự động Flutter (227 test cases)
│   ├── android/            # Cấu hình Native Android (Kotlin, Gradle)
│   ├── docs/               # Tài liệu kiểm thử, UI screenshots & nghiệm thu
│   └── pubspec.yaml        # Dependencies Flutter
│
├── .gitignore              # Bộ lọc Git bỏ qua thư mục build và dependencies
└── README.md               # Tài liệu hướng dẫn cài đặt & khởi chạy dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Backend & Web (`hub-el`)

#### Yêu cầu hệ thống:
- Node.js >= 18.18.0
- Microsoft SQL Server (cổng 1433)

#### Cài đặt và chạy:
```bash
cd hub-el

# 1. Cài đặt dependencies
npm install

# 2. Thiết lập biến môi trường
cp .env.example .env
# (Cập nhật DATABASE_URL, GEMINI_API_KEYS, AUTH_SECRET vào .env)

# 3. Đồng bộ cơ sở dữ liệu Prisma
npx prisma generate
npx prisma db push

# 4. Khởi chạy máy chủ (kèm Socket.IO Realtime)
node server.js
```
Máy chủ sẽ hoạt động tại `http://localhost:3000`.

---

### 2. Mobile App Native (`hub_el_mobile`)

#### Yêu cầu hệ thống:
- Flutter SDK >= 3.24.0
- Android Studio / Android SDK (cho Android Emulator hoặc thiết bị thật)

#### Cài đặt và chạy:
```bash
cd hub_el_mobile

# 1. Tải dependencies Flutter
flutter pub get

# 2. Chạy ứng dụng trên thiết bị / Android Emulator
flutter run
```

---

## 🧪 Kiểm Thử Hệ Thống (Automated Tests)

- **Backend Tests (281/281 PASS):**
  ```bash
  cd hub-el
  npx tsx scripts/test_phase6_security_audit.ts
  npx tsx scripts/test_store_backend.ts
  npx tsx scripts/test_achievements_backend.ts
  npx tsx scripts/test_vocabulary_backend.ts
  npx tsx scripts/test_settings_backend.ts
  npx tsx scripts/test_wiki_study_backend.ts
  npx tsx scripts/test_friends_backend.ts
  npx tsx scripts/test_gacha_backend.ts
  npx tsx scripts/test_leaderboard_backend.ts
  npx tsx scripts/test_chat_security.ts
  ```

- **Mobile App Tests (227/227 PASS):**
  ```bash
  cd hub_el_mobile
  flutter test
  ```

---

## 🛡️ Bản Quyền & Giấy Phép
...
