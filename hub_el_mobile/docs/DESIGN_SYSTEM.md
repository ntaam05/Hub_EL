# DESIGN SYSTEM & UI GUIDELINES - HUB-EL

> **Tài liệu đặc tả toàn diện Hệ thống Thiết kế (Design System) của Web Hub-EL**  
> Dùng làm chuẩn mực để chuyển đổi chính xác từng pixel và phong cách sang Flutter Mobile `hub_el_mobile`.

---

## 1. Bảng Màu Hệ Thống (Color Palette & Tokens)

Căn cứ từ [`src/app/globals.css`](file:///d:/Coder/Web/hub-el/src/app/globals.css) và [`tailwind.config`](file:///d:/Coder/Web/hub-el/package.json):

### A. Màu Nền & Màu Bề Mặt (Background & Surface)

| Token Tên gọi | Web Light Mode (Hex / Class) | Web Dark Mode (Hex / Class) | Flutter Theme Mapped |
| :--- | :--- | :--- | :--- |
| **Scaffold Background** | `#F8FAFC` (`slate-50`) | `#020617` / `#0F172A` (`slate-950`) | `Theme.of(context).scaffoldBackgroundColor` |
| **Card / Surface** | `#FFFFFF` (`white`) | `#1E293B` (`slate-800` / `#0f172a`) | `Theme.of(context).cardColor` |
| **Border / Divider** | `#E2E8F0` (`slate-200`) | `#334155` / `#1E293B` (`slate-700`) | `Theme.of(context).dividerColor` |
| **Text Primary (Foreground)**| `#0F172A` (`slate-900`) | `#F8FAFC` (`slate-50`) | `colorScheme.onSurface` |
| **Text Secondary (Muted)**| `#64748B` (`slate-500`) | `#94A3B8` (`slate-400`) | `colorScheme.onSurfaceVariant` |

---

### B. Bảng Màu Thương Hiệu & Gamification (Brand & Feature Colors)

Hub-EL sử dụng các gam màu tươi sáng, bão hòa cao mang tính Game/EdTech hiện đại:

| Tính Năng / Ý Nghĩa | Tên Màu | Hex Mã Màu | Lớp Nền Phụ (Soft Pill / Badge) | Ứng Dụng Trong Giao Diện |
| :--- | :--- | :--- | :--- | :--- |
| **Màu Nhận Diện Chính** | `Primary Blue` | `#2563EB` | `rgba(37, 99, 235, 0.1)` | Logo, nút bấm chính, tab đang chọn, link kích hoạt |
| **Dải Gradient Thương Hiệu**| `Blue-to-Purple` | `#3B82F6` $\rightarrow$ `#9333EA` | Gradient fill | Avatar mặc định, logo text `Hub-EL`, nút CTA Khóa học |
| **Chuỗi Học Tập (Streak)**| `Flame Orange` | `#F97316` | `rgba(249, 115, 22, 0.1)` | Biểu tượng Ngọn Lửa 🔥, số ngày Streak, card cảnh báo |
| **Năng Lượng AI (Energy)**| `Energy Blue/Cyan`| `#0EA5E9` | `rgba(14, 165, 233, 0.1)` | Biểu tượng Tia Sét ⚡, bình năng lượng $50/50$ |
| **Xu Gacha (Coins)** | `Gacha Gold` | `#EAB308` | `rgba(234, 179, 8, 0.1)` | Biểu tượng Đồng Xu 🪙, phần thưởng nhiệm vụ ngày |
| **Ngọc Nạp (Gems)** | `Gem Purple` | `#A855F7` | `rgba(168, 85, 247, 0.1)` | Biểu tượng Viên Ngọc 💎, gói nạp tiền MoMo |
| **Hội Viên VIP (Pro)** | `Crown Gold` | `#F59E0B` | Gradient vàng kim hoàng gia | Tag `PRO` bo góc, viền avatar người dùng VIP |
| **Cửa Hàng (Store)** | `Emerald Green` | `#10B981` | `rgba(16, 185, 129, 0.1)` | Nút Cửa Hàng, thông báo thanh toán thành công |
| **Nguy Hiểm / Sai (Alert)**| `Destructive Red`| `#EF4444` | `rgba(239, 68, 68, 0.1)` | Báo lỗi, câu trả lời Quiz sai, nút Đăng xuất |

---

### C. Bảng Màu Độ Hiếm Thẻ Wiki (Wiki Card Rarity Colors)

Căn cứ từ [`src/config/achievements.ts`](file:///d:/Coder/Web/hub-el/src/config/achievements.ts#L4-L11) và [`src/components/ui/wiki-card-3d.tsx`](file:///d:/Coder/Web/hub-el/src/components/ui/wiki-card-3d.tsx):

| Hạng Thẻ | Tên Độ Hiếm | Mã Màu Viền & Hiệu Ứng | Số Sao Tối Đa | Tỷ Lệ Gacha |
| :--- | :--- | :--- | :--- | :--- |
| **N** | Normal | Xám bạc `#94A3B8` | 1 ⭐ | 50.0% |
| **R** | Rare | Xanh dương `#3B82F6` | 2 ⭐ | 30.0% |
| **SR** | Super Rare | Tím `#8B5CF6` | 3 ⭐ | 15.0% |
| **SSR** | Super Super Rare | Vàng kim `#F59E0B` | 4 ⭐ | 4.0% |
| **UR** | Ultra Rare | Hồng ánh tím `#EC4899` | 5 ⭐ | 0.8% |
| **LR** | Legendary Rare | Xanh ngọc phát quang `#06B6D4` | 6 ⭐ | 0.15% |
| **MR** | Mythic Rare | Cầu vồng lấp lánh (Rainbow Gradient) | 7 ⭐ | 0.05% |

---

## 2. Hệ Thống Typography (Font & Scale)

Căn cứ từ [`src/app/layout.tsx`](file:///d:/Coder/Web/hub-el/src/app/layout.tsx#L24-L28):
- **Font Gia Đình Chính:** `Inter` (Hỗ trợ ký tự tiếng Việt chuẩn và số học rõ ràng).
- **Font Phụ (Mã nguồn / Số liệu):** `Geist Mono` / `ui-monospace`.

### Bảng Thước Đo Kiểu Chữ (Type Scale):

| Cấp Bậc (Scale) | Size (px) | Weight | Line Height | Ứng Dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `24px - 32px` | `900 (Black)` | `1.2` | Tên app `Hub-EL`, Tiêu đề trang Dashboard |
| **Heading 1 (H1)** | `20px` | `800 (Extra Bold)` | `1.3` | Tiêu đề khối Nhiệm vụ, Tên bài học |
| **Heading 2 (H2)** | `16px` | `700 (Bold)` | `1.4` | Tên khóa học, Tên thẻ Wiki |
| **Body Large** | `15px` | `500 (Medium)` | `1.5` | Nội dung đoạn văn bài đọc AI |
| **Body Regular** | `14px` | `400 (Normal)` / `500` | `1.5` | Câu hỏi Quiz, tin nhắn trong chat |
| **Caption / Subtitle**| `12px` | `600 (Semi-bold)` | `1.4` | Chỉ số XP/ReqXP, nhãn phụ, ngày gửi tin |
| **Micro Badge** | `10px - 11px` | `800 (Bold)` | `1.2` | Nhãn `PRO`, nhãn Bottom Navigation |

---

## 3. Bo Góc & Đổ Bóng (Border Radius & Elevations)

Căn cứ từ [`src/app/globals.css`](file:///d:/Coder/Web/hub-el/src/app/globals.css#L44-L50):

### A. Bo Góc (Radius Scale)
- **`radius-md` (8px):** Nút phụ, input tìm kiếm nhỏ.
- **`radius-lg` (10px):** Pill chỉ số Streak, Năng lượng, Xu trên Header.
- **`radius-xl` (14px):** Khối bài tập, hộp chat message.
- **`radius-2xl` (18px - 20px):** Thẻ bài Wiki, Modal Popup, Card Dashboard.
- **`radius-full` (9999px):** Avatar tròn, nút hành động nổi bật (FAB), viên thuốc Theme Toggle.

### B. Đổ Bóng & Hiệu Ứng Chiều Sâu (Elevations & Shadows)
- **Soft Glow (Ánh sáng tỏa):**
  - Pro Badge: `box-shadow: 0 0 10px rgba(234, 179, 8, 0.35)`
  - Active Nav Button: `box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4)`
- **Backdrop Blur:** `backdrop-filter: blur(12px)` trên thanh Header để tạo hiệu ứng kính mờ (Frosted Glass).

---

## 4. Ngôn Ngữ Giao Diện Đặc Trưng Của Hub-EL

### A. Thanh Chỉ Số Trên Cùng (Header Pill Bar)
Căn cứ [`src/components/layout/header.tsx`](file:///d:/Coder/Web/hub-el/src/components/layout/header.tsx#L349-L380):
- Mỗi chỉ số tài nguyên được bọc trong một **"viên thuốc" (Pill Container)** gồm:
  - Viền mờ (`border 1px`) cùng tông màu với icon.
  - Nền trong suốt pha màu 10% (`color/10`).
  - Icon kích thước 16x16 px kèm số lượng hiển thị bằng font `Extra Bold` (`font-black text-sm`).

### B. Thanh Điều Hướng Đáy Điện Thoại (Floating Bottom Navigation)
Căn cứ [`src/components/layout/mobile-nav.tsx`](file:///d:/Coder/Web/hub-el/src/components/layout/mobile-nav.tsx#L23-L60):
- Thanh đáy cao 64px, cố định dưới cùng (`fixed bottom-0`).
- **Nút Trung Tâm Nổi Bật (Floating Action Center):** Nút "Khóa học" được thiết kế nhô cao lên khỏi thanh điều hướng (`relative -top-5`), bọc viền trắng 4px, đổ bóng tỏa xanh dương-tím để thu hút người học nhấn vào.

```
       [   ]        [   ]        (  ★  )        [   ]        [   ]
     Tổng quan    Luyện tập     Khóa học      Cộng đồng     Xếp hạng
                               (Nhô cao)
```

### C. Thẻ Bài 3D & Lật Thẻ (Wiki Card 3D)
- Mặt trước: Hình ảnh chủ đề, khung viền theo độ hiếm, số sao thức tỉnh.
- Mặt sau: Tóm tắt bài học tiếng nước ngoài, các từ vựng nổi bật.
- Animation: Lật 180 độ mượt mà khi người dùng chạm vào thẻ.

### D. Hiệu Ứng Chuyển Động (Animations & Feedback)
1. **Streak Bumping Animation:** Khi hoàn thành bài học, số Streak giật to (`zoom-in-50 duration-300`) đổi màu cam rực để chúc mừng.
2. **Confetti Celebration:** Pháo hoa chúc mừng bung nở khi học viên hoàn thành thẻ bài lên mức Full Sao hoặc mở khóa thành tựu mới.
3. **Smooth Progress Bar:** Thanh XP cấp độ có hiệu ứng chuyển màu gradient chạy mượt mà từ xanh sang tím.

