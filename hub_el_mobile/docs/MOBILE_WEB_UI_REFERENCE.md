# BÁO CÁO PHÂN TÍCH GIAO DIỆN MOBILE WEB (NEXT.JS) & TÀI LIỆU THAM CHIẾU MIGRATION FLUTTER

> **Tài liệu tham chiếu thiết kế UI/UX dành riêng cho `hub_el_mobile`**  
> **Nguồn phân tích (Single Source of Truth):** Source code Next.js responsive tại `hub-el/src`  
> **Dự án mục tiêu:** Flutter Mobile App tại `hub_el_mobile`  
> **Ngày lập:** 06/11/2026

---

## 1. TỔNG QUAN GIAO DIỆN MOBILE WEB (SINGLE SOURCE OF TRUTH)

Dự án website hiện tại (`hub-el`) được xây dựng trên **Next.js 15 (App Router)** và **Tailwind CSS v4**, đã tối ưu hóa hiển thị responsive toàn diện cho màn hình điện thoại (mobile viewport). 

Thay vì phát triển giao diện Flutter theo một phong cách mới lạ hoặc tự phỏng đoán, **toàn bộ trải nghiệm giao diện, bố cục thành phần, tỷ lệ visual và luồng tương tác trên Mobile Web của `hub-el` chính là nguồn tham chiếu chuẩn xác nhất (Ground Truth)**.

### Mục tiêu kiến trúc UI trên Flutter:
1. **Bảo toàn 100% nhận diện thương hiệu:** Màu sắc OKLCH/Hex, độ cong viền (`border-radius`), độ mờ kính (`backdrop-filter: blur`), đổ bóng (`box-shadow`), và gradient tương đương website.
2. **Trải nghiệm nhất quán (Consistency):** Người dùng khi chuyển từ web di động sang app Flutter không cảm thấy bỡ ngỡ về vị trí các nút, luồng bài học, hệ thống nhiệm vụ hay giao diện rút thẻ tri thức (Gacha).
3. **Tận dụng lợi thế Native:** Giữ trọn vẹn visual của Mobile Web nhưng nâng cấp độ mượt bằng Flutter Widgets native, xử lý an toàn vùng tai thỏ (`SafeArea`), phản hồi xúc giác (`HapticFeedback`) và lưu trữ mượt mà với `FlutterSecureStorage`.

---

## 2. RESPONSIVE BREAKPOINTS & CƠ CHẾ HIỂN THỊ TRÊN MOBILE

Trong hệ thống CSS của website (`src/app/globals.css` và quy chuẩn Tailwind), các ngưỡng responsive được quy định như sau:

| Breakpoint | Kích thước | Trạng thái hiển thị trên Web | Ứng dụng sang Flutter |
| :--- | :--- | :--- | :--- |
| **Mobile (`< md`)** | `< 768px` | **Chế độ Mobile hoàn toàn:** Ẩn Sidebar máy tính; hiển thị cố định `MobileNav` đáy; thu gọn Header; bố cục 1 cột cuộn dọc (`grid-cols-1`). | **Layout mặc định của Flutter Mobile App**. |
| **Tablet (`md` -> `lg`)** | `768px - 1023px` | Header bắt đầu mở rộng; hiển thị icon tìm kiếm rút gọn; Sidebar thu nhỏ hoặc dạng drawer. | Áp dụng cho Flutter Tablet / iPad nếu mở rộng sau này. |
| **Desktop (`>= lg`)** | `>= 1024px` | Sidebar cố định bên trái (`w-64`); Header tìm kiếm mở rộng; Dashboard chia cột 7:5 hoặc 8:4; Carousel hiển thị 3 item cùng lúc. | Không dùng trực tiếp trên Mobile App. |

### Các đặc điểm riêng biệt khi Viewport rơi vào Mobile:
- **`Sidebar` bị ẩn hoàn toàn:** `hidden md:flex` -> Flutter hoàn toàn không cần sidebar cố định, thay bằng `BottomNavigationBar` hoặc `CustomBottomNav`.
- **`MobileNav` xuất hiện cố định đáy:** `md:hidden fixed bottom-0 w-full h-16 border-t pb-safe z-40` -> Chân trang được neo cố định.
- **Header chuyển sang dạng Compact:** Ẩn thanh tìm kiếm dài, chỉ hiện icon kính lúp `Search` và logo `Hub-EL`. Khi bấm `Search`, mở một thanh tìm kiếm tràn màn hình dạng overlay.
- **Khoảng đệm an toàn chân trang (`pb-24` / `pb-safe`):** Vì `MobileNav` cao `h-16` (64px) và có bóng đổ nổi, toàn bộ màn hình mobile trên web đều có `pb-24 md:pb-12` để nội dung cuối trang không bị thanh navigation che mất.
- **Lưới hiển thị chuyển thành 1 cột:** `grid-cols-1 xl:grid-cols-12` -> Toàn bộ các khối `Tiếp tục học`, `Dành cho bạn`, `Nhiệm vụ hôm nay` và `Hoạt động gần đây` xếp chồng theo chiều dọc một cách mượt mà.

---

## 3. DANH SÁCH MÀN HÌNH VÀ CHI TIẾT COMPONENT MOBILE

### 3.1. Header di động (`src/components/layout/header.tsx`)
- **Kích thước & Background:** Chiều cao cố định `h-20` (80px), `sticky top-0`, `z-30`. Sử dụng hiệu ứng kính mờ `bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800`.
- **Cụm bên trái:**
  - Logo `Hub-EL` với mask vector màu xanh blue (`w-7 h-7 md:w-8 md:h-8`).
  - Text gradient thương hiệu `Hub-EL` (ẩn trên mobile nhỏ, chỉ hiện icon).
  - Nút kính lúp tròn `Search` (`p-2 bg-slate-100 dark:bg-slate-800/50 rounded-full`).
- **Thanh tìm kiếm mở rộng (Mobile Search Overlay):**
  - Khi bấm kính lúp: Mở overlay trượt từ trên xuống `absolute top-0 left-0 w-full p-4 bg-white dark:bg-[#0f172a] shadow-xl z-50`.
  - Hàng 1: Logo + Ô tìm kiếm khóa học (`input rounded-full`) + Nút đóng `X`.
  - Hàng 2: Ô dán link YouTube học tập trực tiếp (`Dán link YouTube...` + Nút `Play` xanh tím).
- **Cụm Badge tài nguyên (Top Right Resource Pills):**
  - **Streak (Chuỗi ngày):** Nút bo góc với icon `Flame` cam; bấm vào hiển thị popup Bảo vệ chuỗi (`streakFreezes/2`).
  - **AI Energy (Năng lượng AI):** Badge xanh dương icon `Zap` (`displayEnergy/maxEnergy`, ví dụ `20/50`).
  - **Free Coins (Xu vàng):** Badge vàng icon `Coins` (`freeCoins`).
  - **Premium Gems (Đá quý tím):** Badge tím icon `Gem` (`premiumCoins`).
- **Avatar & Dropdown Menu:**
  - Avatar tròn `w-8 h-8 rounded-full border-2`.
  - Khi chạm mở Popup Card `w-[220px] rounded-[24px] shadow-2xl` gồm:
    - Card thông tin Level & thanh tiến độ XP (`Cấp [level]`, `[xp]/[reqXp] XP`).
    - Nút `Wiki` (icon `BrainCircuit` tím).
    - Nút `Từ vựng` (icon `BookMarked` xanh).
    - Nút `Thành tựu` (icon `Award` vàng).
    - Đường chia mờ `h-px bg-slate-800/80`.
    - Nút `Quản lý tài khoản` (`/profile/[id]`).
    - Nút `Thống kê` (Mở modal `StatsModal`).
    - Nút `Cửa hàng` (icon `ShoppingCart` xanh ngọc).
    - Nút `Đăng xuất` (chữ đỏ icon `LogOut`).

---

### 3.2. Bottom Navigation di động (`src/components/layout/mobile-nav.tsx`)
- **Thiết kế tổng thể:** Chiều cao 64px (`h-16`), cố định đáy `fixed bottom-0 w-full z-40`, nền trắng hoặc `dark:bg-slate-900`, viền trên `border-t border-slate-200 dark:border-slate-800`, đổ bóng ngược lên `shadow-[0_-5px_15px_rgba(0,0,0,0.05)]`.
- **5 Tabs điều hướng:**
  1. **Tổng quan (Home):** Icon `Home` (20px) + Nhãn "Tổng quan" (`text-[10px] font-bold`).
  2. **Góc luyện tập (Quizzes):** Icon `Target` (20px) + Nhãn "Góc luyện tập".
  3. **Khóa học (Elevated FAB Nổi - Điểm nhấn chính):**
     - Nằm nhô cao hẳn lên khỏi thanh navigation: `relative -top-5 w-[72px]`.
     - Vòng tròn tròn lớn `p-3.5 rounded-full border-4 border-white dark:border-slate-900`.
     - Hiệu ứng Gradient rực rỡ: `bg-gradient-to-r from-blue-600 to-purple-600`.
     - Icon `Book` trắng 24px + Đổ bóng màu `shadow-[0_5px_15px_rgba(59,130,246,0.4)]`.
     - Nhãn "Khóa học" nằm dưới nút.
  4. **Cộng đồng (Social):** Icon `Users` (20px) + Nhãn "Cộng đồng".
  5. **Xếp hạng (Leaderboard):** Icon `Trophy` (20px) + Nhãn "Xếp hạng".
- **Trạng thái Active / Inactive:**
  - Active: Màu xanh chủ đạo `text-blue-600 dark:text-blue-400`.
  - Inactive: Màu xám bạc `text-slate-400 dark:text-slate-500`.

---

### 3.3. Dashboard di động (`src/app/(main)/dashboard/page.tsx`)
- **Header chào mừng:** "Chào mừng trở lại, [Name]! 👋" (Font đen đậm 24px, drop shadow nhẹ).
- **Khối "Tiếp tục học" (Continue Learning Card):**
  - Card kính mờ `bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-[2rem] border border-slate-700/50 p-5`.
  - Khung video thumbnail tỷ lệ 16:9 bo góc `rounded-2xl` kèm nút Play nổi bật ở tâm.
  - Tên chuyên mục khóa học (In hoa, xanh dương, `tracking-widest`).
  - Tiêu đề bài học (`line-clamp-2 font-black`).
  - Thanh tiến độ phần trăm `h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500` + chỉ số `%`.
  - Nút bấm chính "Vào học" màu đen/trắng bo góc lớn kèm icon `PlayCircle`.
  - Empty state (khi chưa có bài học dở): Khung viền nét đứt `border-dashed` với icon học tập và lời mời gọi bắt đầu.
- **Khối "Dành cho bạn" (Recommended Videos):**
  - Danh sách video đề xuất cuộn mượt mà.
  - Mỗi item dạng ngang: Thumbnail 16:9 (`w-[120px] rounded-lg`) + Tiêu đề video (2 dòng) + Kênh Youtube.
- **Khối "Video yêu thích" (Favorite Carousel):**
  - Hiển thị danh sách card video yêu thích với hiệu ứng hover/tap và nút chuyển trang tròn.
- **Khối "Nhiệm vụ hôm nay" (Daily Tasks Card):**
  - Card bo góc `rounded-[2rem]`, liệt kê 3 nhiệm vụ thường nhật (Xem video, Học tập theo thời gian, Hoàn thành Quiz).
  - Mỗi hàng: Icon màu tương ứng (Cam cho TV, Xanh lá cho Đồng hồ, Tím cho Hỏi đáp) + Tên nhiệm vụ + Thanh tiến độ nhỏ (`h-1.5`) + Tỷ lệ `current/max`.
  - Trạng thái nút:
    - Đang làm: Hiện badge phần thưởng `+XP`, `+Xu`.
    - Đã xong chưa nhận: Nút gradient vàng-cam `Nhận` phát sáng hoạt ảnh rung lắc (`animate-pulse`).
    - Đã nhận: Nút xám mờ `Đã nhận` kèm icon tích xanh.
- **Khối "Hoạt động gần đây" (Recent Activity Timeline):**
  - Danh sách hoạt động gần nhất với icon phân loại tương ứng: Video (`PlayCircle`), Quiz (`CheckCircle`), Retake (`RotateCcw`), Gacha (`Sparkles`), Wiki (`BookOpen`), Course (`GraduationCap`).
  - Hiển thị thời gian tương đối ("Vừa xong", "5 phút trước", "2 ngày trước").

---

### 3.4. Màn hình Học & Xem Video (`src/app/(main)/watch/[videoId]/page.tsx`)
- **Khung phát Video 16:9:**
  - Container tỷ lệ chuẩn 16:9, viền bo tròn nhẹ, nền đen chống lóa.
  - Hỗ trợ xem trực tiếp bài giảng Youtube.
- **Khu vực tương tác Video:**
  - Tiêu đề video kích thước lớn, tên kênh người tạo.
  - Các nút hành động nhanh: Nút Thích (icon `Heart` đổi màu đỏ khi liked), Nút Báo cáo (`Flag`), Nút Chia sẻ (`Share2`).
- **Khối Tạo bài tập tự động bằng AI (AI Quiz Generator):**
  - Card công nghệ viền xanh dương/tím.
  - Ô chọn số lượng câu hỏi trắc nghiệm (1 đến 20 câu) kèm chi phí Năng lượng AI (`aiTokens`).
  - Nút gradient "Tạo bài tập AI" có icon tia sét `Zap`.
- **Khu vực Luyện tập trắc nghiệm (Interactive Quiz Component):**
  - Câu hỏi hiển thị rõ ràng, 4 đáp án lựa chọn A, B, C, D dạng card nổi bo góc `rounded-xl`.
  - Phản hồi màu tức thì khi người học chọn đáp án (Xanh lá nếu đúng, Đỏ nếu sai kèm giải thích chi tiết).
  - Modal chúc mừng hoàn thành bài tập với phần thưởng XP và Xu.

---

### 3.5. Màn hình Rút Thẻ Tri Thức - Gacha (`src/app/(main)/gacha/page.tsx`)
- **Nền không gian Vũ trụ (Cosmic Canvas):**
  - Toàn màn hình tối sâu (`#020617` hoặc nền đen vũ trụ), có hạt bụi sao lơ lửng và đồ họa Cây Tri Thức (World Tree) phát sáng huyền ảo.
- **Cụm điều khiển trên đỉnh:**
  - Nút "Kho Thẻ" (Wiki Inventory) góc trái với logo Wikipedia trắng.
  - Các chỉ số Xu và Bụi sao hiện tại.
- **Khu vực Thẻ bài 3D tương tác (`WikiCard3D`):**
  - Thẻ bài 3D với hiệu ứng lật thẻ 3 giai đoạn:
    1. Vòng xoáy năng lượng gom tụ.
    2. Thẻ xoay tốc độ cao với ánh sáng trắng.
    3. Thẻ lật mở hiển thị hình ảnh, tên khái niệm Wikipedia, phẩm cấp độ hiếm (N, R, SR, SSR, UR, LR, MR) với viền phát sáng tương ứng.
  - Trên mobile: Tự động scale nhỏ vừa vặn (`transform: scale(0.65)` khi mở nhiều thẻ 10x).
- **Cụm nút điều khiển đáy (Elevated Bottom Controls):**
  - Cách đáy `bottom-20` (để tránh `MobileNav`).
  - Nút "Đổi bụi sao", Nút "Tỷ lệ & Chi tiết".
  - Nút rút thẻ chính phát sáng rực rỡ: "Tìm Tri Thức x1 (100 Xu)" hoặc "x10 (1000 Xu)".

---

### 3.6. Màn hình Góc Luyện Tập (`src/app/(main)/quizzes/page.tsx`)
- Header tiêu đề với icon `Target`, phân nhóm các đề mục bài thi theo chủ đề: Lập trình, Ngoại ngữ, Khoa học tự nhiên, Kỹ năng mềm.
- Danh sách lịch sử làm bài thi với điểm số phần trăm, ngày làm và nút "Làm lại bài" (`RotateCcw`).

---

### 3.7. Màn hình Cộng đồng (`src/app/(main)/social/page.tsx`)
- **Chế độ Mobile:**
  - Tab danh sách bạn bè & hội thoại gần nhất.
  - Màn hình chat trực tiếp: Bong bóng tin nhắn người gửi (xanh tím) / người nhận (xám tối), thanh nhập tin nhắn kèm đính kèm ảnh và tặng Thẻ Tri Thức.
  - Nút cài đặt hội thoại mở Slide Drawer / Bottom Sheet từ cạnh phải để xem thông tin cá nhân bạn chat, tắt thông báo, chặn người dùng.

---

### 3.8. Màn hình Bảng Xếp Hạng (`src/app/(main)/leaderboard/page.tsx`)
- **Thanh chuyển Tab danh mục:** "Bền Bỉ" (Streak), "Cày Cuốc" (XP), "Thời Gian Học", "Khắc Tinh AI" (Số câu trả lời đúng).
- **Bộ lọc thời gian:** "Hôm nay", "Tuần này", "Tháng này", "Mọi lúc".
- **Bục vinh danh Top 3 (Podium Component):**
  - 3 cột bục vinh quang hiển thị trực quan (Hạng 2 - Bạc bên trái, Hạng 1 - Vàng ở giữa nhô cao nhất có vương miện, Hạng 3 - Đồng bên phải).
  - Avatar có khung viền hào quang, tên và điểm số.
- **Danh sách xếp hạng (Hạng 4 đến 50):**
  - Dạng danh sách phẳng cuộn mượt: Số thứ tự rank, Avatar tròn, Tên, Cấp độ, Điểm số. Có viền nổi bật riêng cho dòng của chính người dùng hiện tại.

---

### 3.9. Các Dialog, Modal & Bottom Sheet trên Mobile
- **Streak Protection Modal:** Hiển thị số lượng băng tuyết bảo vệ chuỗi (`streakFreezes/2`) và nút kích hoạt.
- **Daily Task Claim Reward Dialog:** Popup chúc mừng rực rỡ với hiệu ứng pháo hoa, hiển thị số XP và Xu được nhận.
- **Stats Modal:** Thống kê tổng số giờ học, số từ vựng đã thuộc, số thẻ bài sưu tập được.
- **Notification Banner Tùy chỉnh:** Nằm cố định `fixed top-24 left-1/2 -translate-x-1/2` với viền xanh (thành công) hoặc đỏ (lỗi), tự tắt sau 4.5 giây.

---

## 4. DESIGN TOKENS CHI TIẾT (COLORS, TYPOGRAPHY, SPACING, RADIUS)

### 4.1. Bảng màu chuẩn (Color Palette)
Hệ màu từ `src/app/globals.css` và `tailwind.config` được trích xuất sang mã màu Hex / Flutter `Color`:

| Tên Token Web | Mã Hex tham chiếu | Flutter Color Code | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `background-dark` | `#020617` | `const Color(0xFF020617)` | Màu nền đen vũ trụ của toàn bộ app Dark Mode |
| `surface-dark` | `#0F172A` | `const Color(0xFF0F172A)` | Màu nền Header, Bottom Nav, Surface container |
| `card-dark` | `#151821` | `const Color(0xFF151821)` | Màu nền của các thẻ Card (với opacity 90%) |
| `card-border-dark`| `rgba(51, 65, 85, 0.5)`| `Color(0x80334155)` | Viền thẻ card bán trong suốt `slate-700/50` |
| `primary-blue` | `#2563EB` | `const Color(0xFF2563EB)` | Màu xanh chủ đạo thương hiệu Hub-EL |
| `primary-purple` | `#9333EA` | `const Color(0xFF9333EA)` | Màu tím bổ trợ trong dải Gradient |
| `accent-orange` | `#F97316` | `const Color(0xFFF97316)` | Màu Streak (Ngọn lửa), Cảnh báo, Đồng hồ |
| `accent-yellow` | `#EAB308` | `const Color(0xFFEAB308)` | Màu Xu (Coins), Vương miện, Thành tựu |
| `accent-emerald` | `#10B981` | `const Color(0xFF10B981)` | Màu Cửa hàng, Thành công, Quiz đúng |
| `accent-cyan` | `#06B6D4` | `const Color(0xFF06B6D4)` | Màu Năng lượng AI, Đề xuất cá nhân |
| `text-primary` | `#F8FAFC` | `const Color(0xFFF8FAFC)` | Chữ tiêu đề sáng rõ (`slate-100` / `white`) |
| `text-secondary` | `#94A3B8` | `const Color(0xFF94A3B8)` | Chữ mô tả phụ, thời gian (`slate-400`) |
| `text-muted` | `#64748B` | `const Color(0xFF64748B)` | Chữ mờ, placeholder (`slate-500`) |

### 4.2. Dải màu chuyển sắc (Gradients)
- **Gradient Chính (Primary Gradient):**
  - Web: `bg-gradient-to-r from-blue-600 to-purple-600`
  - Flutter: `LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF9333EA)])`
- **Gradient Nút Nhận Thưởng (Reward Pulse Gradient):**
  - Web: `bg-gradient-to-r from-yellow-400 to-orange-500`
  - Flutter: `LinearGradient(colors: [Color(0xFFFACC15), Color(0xFFF97316)])`
- **Gradient Cây Tri Thức (Cosmic Glow):**
  - Web: `radial-gradient(ellipse at center, rgba(37,99,235,0.15), transparent 70%)`
  - Flutter: `RadialGradient(colors: [Color(0x262563EB), Colors.transparent])`

### 4.3. Typography (Kiểu chữ & Phông chữ)
Website sử dụng font hình học hiện đại không chân (`font-sans`), với các cấp độ rõ ràng:
- **Heading 1 (Tiêu đề trang):** `text-2xl font-black tracking-tight` -> Flutter: `fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5`.
- **Heading 2 (Tiêu đề mục):** `text-sm font-black uppercase tracking-widest` -> Flutter: `fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.5`.
- **Card Title (Tiêu đề thẻ):** `text-base font-bold leading-tight` -> Flutter: `fontSize: 16, fontWeight: FontWeight.w700, height: 1.25`.
- **Body Regular:** `text-sm font-normal text-slate-300` -> Flutter: `fontSize: 14, fontWeight: FontWeight.w400`.
- **Caption / Badge:** `text-[10px] md:text-xs font-bold` -> Flutter: `fontSize: 10, fontWeight: FontWeight.w700`.

### 4.4. Bo góc viền (Border Radius)
Hệ thống web sử dụng góc bo rất rộng mang phong cách neo-morphism và futuristic:
- **Thẻ Card chính:** `rounded-[2rem]` (32px) -> Flutter: `BorderRadius.circular(32)`.
- **Avatar Menu & Modal:** `rounded-[24px]` (24px) -> Flutter: `BorderRadius.circular(24)`.
- **Nhiệm vụ, Nút hành động, Ô nhập liệu:** `rounded-2xl` (16px) hoặc `rounded-xl` (12px) -> Flutter: `BorderRadius.circular(16)`.
- **Pill Badges & Search bar:** `rounded-full` (9999px) -> Flutter: `BorderRadius.circular(999)`.

### 4.5. Đổ bóng (Shadows)
- **Card Shadow:** `shadow-[0_8px_30px_rgb(0,0,0,0.2)]` -> Flutter: `BoxShadow(color: Color(0x33000000), blurRadius: 30, offset: Offset(0, 8))`.
- **FAB Floating Glow:** `shadow-[0_5px_15px_rgba(59,130,246,0.4)]` -> Flutter: `BoxShadow(color: Color(0x663B82F6), blurRadius: 15, offset: Offset(0, 5))`.
- **Bottom Nav Inverted Shadow:** `shadow-[0_-5px_15px_rgba(0,0,0,0.05)]` -> Flutter: `BoxShadow(color: Color(0x0D000000), blurRadius: 15, offset: Offset(0, -5))`.

---

## 5. MOBILE NAVIGATION FLOW (LUỒNG ĐIỀU HƯỚNG DI ĐỘNG)

```
                            ┌────────────────────────┐
                            │    SPLASH / INIT       │
                            └───────────┬────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                 [Chưa đăng nhập]               [Đã đăng nhập]
                         │                             │
                         ▼                             ▼
                 ┌───────────────┐           ┌──────────────────┐
                 │  Login Screen │           │ Main Shell Nav   │
                 └───────┬───────┘           │ (Scaffold +      │
                         │                   │  CustomBottomNav)│
                         ▼                   └─────────┬────────┘
                 ┌───────────────┐                     │
                 │Register Screen│                     │
                 └───────────────┘                     │
                                                       │
         ┌───────────────────┬─────────────────────────┼────────────────────────┬───────────────────┐
         ▼                   ▼                         ▼                        ▼                   ▼
    [Tab 1]             [Tab 2]                     [Tab 3 - FAB]          [Tab 4]             [Tab 5]
  /dashboard           /quizzes                       /courses              /social          /leaderboard
 (Tổng quan)        (Góc luyện tập)                  (Khóa học)           (Cộng đồng)        (Bảng xếp hạng)
         │                   │                         │                        │                   │
         ├─ Tiếp tục học ──┐ ├─ Chi tiết Quiz ──────┐  ├─ Chi tiết Khóa ────┐   ├─ Cửa sổ Chat      └─ Hồ sơ User
         ├─ Đề xuất ───────┼─┼─ Làm lại bài ────────┤  ├─ Danh mục video ───┤   └─ Slide Drawer
         └─ Nhiệm vụ ngày  │ │                      │  └────────────────────┤
                           ▼ ▼                      ▼                       ▼
                     ┌────────────────────────────────────────────────────────┐
                     │           Màn hình Học & Xem Video /watch/:id          │
                     │  (16:9 Youtube Player + Tạo Quiz AI + Interactive Quiz) │
                     └────────────────────────────────────────────────────────┘
```

### Điều hướng qua Header Avatar Menu:
Tại bất kỳ màn hình nào thuộc Main Shell, bấm vào Avatar người dùng trên Header sẽ mở Modal / Drawer:
- **Rút Thẻ Tri Thức:** Điều hướng tới `/gacha` (Fullscreen Dark Cosmic view).
- **Kho Từ Vựng:** Điều hướng tới `/vocabulary`.
- **Thành Tựu:** Điều hướng tới `/achievements`.
- **Cửa Hàng:** Điều hướng tới `/store`.
- **Quản Lý Tài Khoản:** Điều hướng tới `/profile/:id`.
- **Đăng Xuất:** Xóa Token khỏi `FlutterSecureStorage` và trở về `LoginScreen`.

---

## 6. BẢNG MAPPING REACT / TAILWIND SANG FLUTTER WIDGETS

| Thành phần React / Tailwind trên Web | Flutter Widget tương ứng | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| `<div className="flex flex-col gap-4">` | `Column(spacing: 16)` hoặc `ListView.separated` | Xếp dọc với khoảng cách chuẩn |
| `<div className="flex items-center justify-between">` | `Row(mainAxisAlignment: MainAxisAlignment.spaceBetween)` | Xếp ngang dàn đều hai đầu |
| `backdrop-blur-xl bg-white/90 dark:bg-[#151821]/90` | `ClipRRect(child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20), child: Container(...)))` | Kính mờ hiệu ứng glassmorphism |
| `rounded-[2rem]` | `BorderRadius.circular(32)` | Góc bo cực đại đặc trưng |
| `aspect-video` | `AspectRatio(aspectRatio: 16 / 9, child: ...)` | Tỷ lệ chuẩn cho Video Thumbnail & Player |
| `line-clamp-2` | `Text(..., maxLines: 2, overflow: TextOverflow.ellipsis)` | Cắt ngắn văn bản 2 dòng kèm dấu chấm lửng |
| `active:scale-95 transition-transform` | `GestureDetector` / `InkWell` với `AnimatedScale` (scale = 0.95 khi chạm) | Phản hồi bấm tương tác mềm mại |
| `bg-gradient-to-r from-blue-600 to-purple-600` | `BoxDecoration(gradient: LinearGradient(...))` | Gradient thương hiệu |
| `shadow-[0_5px_15px_rgba(59,130,246,0.4)]` | `BoxShadow(color: Color(0x663B82F6), blurRadius: 15, offset: Offset(0, 5))` | Bóng đổ có màu (Colored glow) |
| `<input autoFocus ... className="rounded-full">` | `CustomTextField` hoặc `TextField` với `OutlineInputBorder(borderRadius: BorderRadius.circular(999))` | Ô tìm kiếm dạng con thoi |
| `animate-pulse` | `AnimationController` lặp lại opacity / scale | Hoạt ảnh nhấp nháy thu hút sự chú ý |
| `fixed bottom-0 w-full h-16 pb-safe` | `Scaffold.bottomNavigationBar` bọc trong `SafeArea(top: false)` | Neo đáy an toàn thanh điều hướng |

---

## 7. CÁC COMPONENT ĐÃ CÓ TỪ PHASE 2 CÓ THỂ TÁI SỬ DỤNG NGAY

Trong **Giai đoạn 2 (Phase 2 - Flutter UI Foundation)**, các widgets nền tảng đã được tạo sẵn trong `lib/shared/widgets/` và `lib/core/theme/`:

1. **`CustomButton` (`lib/shared/widgets/custom_button.dart`):**
   - Hỗ trợ đầy đủ các biến thể: `primary` (gradient xanh-tím), `secondary` (viền mỏng), `ghost`, `danger`.
   - Có sẵn trạng thái `isLoading`, tự hiển thị spinner nhỏ khi gọi API.
   - Sử dụng ngay cho: Nút "Vào học", Nút "Nhận thưởng", Nút "Tạo Quiz AI".
2. **`CustomCard` (`lib/shared/widgets/custom_card.dart`):**
   - Đã tích hợp sẵn màu nền `#151821`, viền mờ bán trong suốt `slate-700/50` và góc bo lớn `2rem` (32px).
   - Sử dụng ngay cho: Khối "Tiếp tục học", Khối "Nhiệm vụ hôm nay", Khối "Dành cho bạn".
3. **`CustomTextField` (`lib/shared/widgets/custom_text_field.dart`):**
   - Thiết kế chuẩn với icon tiền tố, icon hậu tố, màu nền tối và viền phát sáng khi focus.
   - Sử dụng ngay cho: Thanh tìm kiếm khóa học và Ô dán link YouTube.
4. **`ResourcePill` (`lib/shared/widgets/resource_pill.dart`):**
   - Đã chuẩn bị cấu trúc Pill badge hiển thị Streak ngọn lửa, Năng lượng sét, Xu vàng và Đá quý tím.
   - Sử dụng ngay cho: Thanh Header di động.
5. **`CustomAppBar` (`lib/shared/widgets/custom_app_bar.dart`):**
   - Chiều cao và layout linh hoạt, hỗ trợ title, leading icon và action buttons.
6. **`CustomDialog` (`lib/shared/widgets/custom_dialog.dart`):**
   - Dialog chuẩn phong cách glassmorphism với góc bo lớn và nút hành động.
   - Sử dụng ngay cho: Popup nhận thưởng nhiệm vụ ngày và Popup bảo vệ chuỗi Streak.
7. **`LoadingWidget`, `EmptyStateWidget`, `ErrorStateWidget`:**
   - Đã chuẩn hóa hiển thị các trạng thái chờ, dữ liệu trống và báo lỗi có nút thử lại ("Thử lại").

---

## 8. CÁC COMPONENT CHUYÊN BIỆT CẦN TRIỂN KHAI MỚI CHO FLUTTER

Để hoàn thiện giao diện di động chuẩn xác theo Mobile Web, cần xây dựng thêm các widget chuyên biệt sau:

1. **`CustomBottomNavWithFAB`:**
   - Scaffold Navigation Bar tùy chỉnh 5 vị trí với nút giữa nhô cao (`FloatingActionButtonLocation.centerDocked` hoặc tự custom với `Stack`).
   - Nút giữa có viền dày 4px màu nền để tạo khoảng cắt thẩm mỹ, bên trong là gradient xanh tím icon Book.
2. **`MobileHeaderBar`:**
   - Header compact cao 80px, tích hợp logo Hub-EL, nút tìm kiếm mở rộng (Overlay Search), 4 Resource Pills thu nhỏ và Avatar tròn.
3. **`DailyTaskItemTile`:**
   - Widget dòng nhiệm vụ: Icon vuông bo góc màu tương ứng, tiêu đề, thanh tiến độ mini, và nút "Nhận" có hiệu ứng nhấp nháy `PulseAnimation`.
4. **`PodiumWidget` (Bục vinh danh Bảng xếp hạng):**
   - Widget hiển thị 3 cột với độ cao khác nhau (Vàng #1 ở giữa, Bạc #2 bên trái, Đồng #3 bên phải), vương miện nổi và avatar lấp lánh.
5. **`WikiCard3DView`:**
   - Widget thẻ bài lật 3D dùng `Transform` kết hợp góc quay `rotationY`, hiệu ứng phát sáng Hologram theo phẩm cấp (SSR, UR...).
6. **`YoutubePlayerContainer`:**
   - Bộ bọc Video Player tỷ lệ 16:9 hỗ trợ phát mượt mà trên Android và iOS.

---

## 9. NHỮNG KHÁC BIỆT CẦN LƯU Ý GIỮA MOBILE WEB VÀ NATIVE APP

| Tiêu chí | Mobile Web (Next.js) | Native App (Flutter) | Giải pháp tối ưu trên Flutter |
| :--- | :--- | :--- | :--- |
| **Vùng an toàn (Safe Area)** | Dùng CSS env `pb-safe`, `pt-safe` | Widget `SafeArea` của Flutter | Bọc `Scaffold.body` trong `SafeArea(bottom: false)` và đặt khoảng đệm đáy `bottomPadding: 80` để nội dung không bị `BottomNav` che. |
| **Bàn phím ảo (Virtual Keyboard)** | Viewport co giãn hoặc đẩy toàn trang | `resizeToAvoidBottomInset: true` | Dùng `SingleChildScrollView` với `clamping` scroll physics để các trường nhập liệu trong modal không bị che khuất khi mở bàn phím. |
| **Cử chỉ vuốt (Gestures)** | Vuốt trình duyệt có thể bị xung đột back | Thao tác vuốt mượt mà | Dùng `WillPopScope` / `PopScope` và hỗ trợ cử chỉ vuốt cạnh trái để Back tự nhiên. |
| **Phản hồi xúc giác (Haptics)** | Hầu như không có trên web di động | Tích hợp sâu phần cứng | Bổ sung `HapticFeedback.lightImpact()` khi bấm nút Nhận thưởng, Đổi quà, hoặc Rút thẻ Gacha. |
| **Trình phát Video (Player)** | Nhúng iframe YouTube | Dùng thư viện Native (`youtube_player_flutter` hoặc `pod_player`) | Cho phép phát mượt mà, hỗ trợ chế độ toàn màn hình (Fullscreen rotation) tốt hơn Web. |
| **Lưu trữ phiên đăng nhập** | Next-Auth Session Cookie | `FlutterSecureStorage` + Token Interceptor | Lưu Access Token an toàn vào Keystore/Keychain, tự động đính kèm Header `Authorization: Bearer <token>`. |

---

## 10. THỨ TỰ ƯU TIÊN TRIỂN KHAI (ROADMAP GIAI ĐOẠN TIẾP THEO)

Theo phân tích kiến trúc và sự sẵn sàng của hệ thống, lộ trình triển khai UI Native Flutter được chia thành 4 bước tuần tự:

### Bước 1: Khung sườn điều hướng chính (Main App Shell) — Ưu tiên 1
- Xây dựng `MainShellScreen` gồm:
  - `MobileHeaderBar` với đầy đủ Resource Pills và Profile Menu Drawer.
  - `CustomBottomNavWithFAB` 5 tabs chuẩn visual web di động.
  - Tích hợp điều hướng giữa các màn hình gốc: Dashboard, Quizzes, Courses, Social, Leaderboard.

### Bước 2: Màn hình Tổng quan (Dashboard Screen) — Ưu tiên 2
- Triển khai toàn bộ các khối theo bố cục 1 cột:
  - Khối "Chào mừng" & Khối "Tiếp tục học" (Card 16:9 + Progress Bar).
  - Khối "Nhiệm vụ hôm nay" với logic nhận thưởng XP/Xu và hiệu ứng pulse.
  - Khối "Dành cho bạn" & "Video yêu thích".
  - Khối "Hoạt động gần đây".

### Bước 3: Màn hình Học & Chi tiết Video (Watch Screen & AI Quiz) — Ưu tiên 3
- Tích hợp Trình phát Video tỷ lệ 16:9.
- Giao diện Tạo bài tập bằng AI và danh sách câu hỏi trắc nghiệm tương tác chấm điểm trực tiếp.

### Bước 4: Các màn hình bổ trợ (Quizzes, Leaderboard, Gacha, Profile) — Ưu tiên 4
- Màn hình Bảng xếp hạng với Bục Podium Top 3.
- Màn hình Góc luyện tập và Lịch sử Quiz.
- Màn hình Rút Thẻ Tri Thức Gacha 3D.
- Màn hình Hồ sơ cá nhân và Cài đặt.

---
> **Kết luận:** Tài liệu này là căn cứ thiết kế và phát triển chính thức cho toàn bộ giai đoạn chuyển đổi giao diện sang Flutter của dự án `hub_el_mobile`. Mọi màn hình mới cần đối chiếu với các token màu, component mapping và responsive rules đã nêu trong tài liệu này trước khi tiến hành code.

