# BÁO CÁO TRIỂN KHAI MODULE WIKI MANAGER (GIAI ĐOẠN 4 – BƯỚC 5A)

## 1. TỔNG QUAN KẾT QUẢ

- **Module triển khai:** Wiki Manager – Quản lý Bộ sưu tập Thẻ bài kiến thức Wikipedia (Bao gồm Thẻ đã sở hữu & Thẻ chưa sở hữu, Lọc, Tìm kiếm, Sắp xếp và Xem lại bài làm Quiz).
- **Dự án Flutter:** `hub_el_mobile`
- **Backend & Database:** Next.js App Router (`hub-el`), Microsoft SQL Server qua Prisma ORM.
- **Mục tiêu đạt được:** 
  - Tái hiện chuẩn xác 1:1 giao diện Mobile Web responsive từ `hub-el`.
  - Kết nối trực tiếp với database thực tế (80 thẻ bài trong hệ thống), không dùng WebView, không dùng mock data cho môi trường runtime.
  - Tuân thủ toàn diện các điều chỉnh kiến trúc bắt buộc tại Mục 12 (Tách `WikiService`, hiển thị cả thẻ sở hữu & chưa sở hữu, bảo mật Bearer JWT phân lập người dùng, giữ nguyên Main App Shell).
- **Chất lượng mã nguồn:**
  - `flutter analyze`: **0 issues** (không lỗi, không cảnh báo, không vi phạm lint).
  - `flutter test`: **62/62 tests passed 100%**.
  - Kiểm thử trực tiếp trên Android Emulator `Pixel_7` (`emulator-5554`): Xác minh đầy đủ các trạng thái và luồng nghiệp vụ thực tế.

---

## 2. KIẾN TRÚC VÀ FILE ĐÃ TRIỂN KHAI

### A. Backend API Bridge & Service Layer (`hub-el`)
- `src/services/wiki.service.ts`:
  - Hàm dùng chung `getWikiManagementService(userId)`.
  - Truy vấn toàn bộ 80 `WikiCard` trong SQL Server, kết hợp (join) với `UserInventory` của user đang đăng nhập.
  - Phân lập dữ liệu bảo mật (User Isolation): `attempts` chỉ truy vấn `where: { userId }`, không làm rò rỉ kết quả làm bài của User khác.
  - Xác định trạng thái sở hữu `isOwned`, ngày sở hữu `acquiredAt`, số sao thức tỉnh hiện tại `currentStar` từ `UserInventory` (hoặc `awakenedStars` từ thẻ).
- `src/actions/wiki-manager.ts`:
  - Refactor Server Action `getWikiManagementData(userId)` gọi trực tiếp `getWikiManagementService(userId)`.
- `src/app/api/v1/wiki/inventory/route.ts`:
  - Phương thức: `GET`
  - Xác thực: Bearer JWT Token (`verifyToken`), trích xuất `userId` từ token đã xác minh.
  - Không nhận `userId` từ query string hoặc body để đảm bảo tính an toàn.
  - Gọi `getWikiManagementService(userId)` và trả về cấu trúc DTO chuẩn.

### B. Flutter Mobile Architecture (`hub_el_mobile`)

```
lib/features/wiki/
├── data/
│   ├── datasources/
│   │   └── wiki_remote_data_source.dart         # IWikiRemoteDataSource & WikiRemoteDataSource (/api/v1/wiki/inventory)
│   ├── models/
│   │   ├── user_inventory_model.dart            # UserInventoryModel.fromJson (isOwned, currentStar, safe fallback)
│   │   ├── wiki_card_model.dart                 # WikiCardModel.fromJson (rarity, totalStars, awakenedStars, attempts)
│   │   └── wiki_quiz_attempt_model.dart         # Parse quiz attempts, userAnswers & lessonSnapshot (chống crash JSON lỗi)
│   └── repositories/
│       └── wiki_repository_impl.dart            # WikiRepositoryImpl kế thừa IWikiRepository
├── domain/
│   ├── entities/
│   │   ├── user_inventory_entity.dart           # UserInventoryEntity (isOwned, currentStar, canShareCount)
│   │   ├── wiki_card_entity.dart                # WikiCardEntity (rarityWeight, effectiveWikiUrl, isStudied)
│   │   └── wiki_quiz_attempt_entity.dart        # WikiQuizAttemptEntity & QuizQuestion
│   ├── repositories/
│   │   └── wiki_repository.dart                 # IWikiRepository
│   └── usecases/
│       └── get_wiki_inventory_usecase.dart      # GetWikiInventoryUseCase
└── presentation/
    ├── bloc/
    │   ├── wiki_manager_bloc.dart               # Quản lý state, search, filter (ALL/OWNED/UNOWNED/STUDIED/UNSTUDIED), sort
    │   ├── wiki_manager_event.dart              # FetchRequested, FilterChanged, RarityChanged, SortChanged, SearchChanged
    │   └── wiki_manager_state.dart              # Initial, Loading, Loaded, Error
    ├── screens/
    │   └── wiki_manager_screen.dart             # Màn hình Quản lý bài học 1:1 Mobile Web
    └── widgets/
        ├── review_history_sheet.dart            # Modal bottom sheet xem chi tiết bài làm
        ├── wiki_card_widget.dart                # Widget Card 3D native tái hiện WikiCard3D (hỗ trợ Lock icon khi chưa sở hữu)
        └── wiki_manager_card_item.dart          # Item thẻ bài trong danh sách (phân biệt Đã sở hữu / Chưa sở hữu)
```

---

## 3. BẢNG ĐỐI CHIẾU THIẾT KẾ 1:1 VỚI MOBILE WEB

| Thành phần UI Mobile Web (`hub-el`) | Tái hiện trên Flutter (`hub_el_mobile`) | Mức độ tương đồng |
|---|---|---|
| Header: Icon `BookOpen`, Title "QUẢN LÝ BÀI HỌC", phụ đề tiến độ sở hữu | `WikiManagerScreen` Header với bo góc, text gradient và typography chuẩn (`X sở hữu / Y tổng thẻ`) | 100% |
| Quick buttons: "Kho Từ Vựng" & "Nhận thêm thẻ" (Gradient tím/xanh) | Outlined button indigo & Gradient Elevated Button tím xanh với icon `Library` & `PlusCircle` | 100% |
| Thanh tìm kiếm thẻ bài theo tên | Search `TextField` với prefix icon `Search` và suffix icon `X` tự động xóa text | 100% |
| Bộ lọc trạng thái sở hữu & học tập | Horizontal filter pills: Tất cả (`Tất cả`), Đã sở hữu (`Đã sở hữu`), Chưa sở hữu (`Chưa sở hữu`), Đã học (`Đã học`), Chưa học (`Chưa học`) | 100% |
| Bộ lọc phẩm cấp (Rarity pills) | All, MR, LR, UR, SSR, SR, R, N với màu sắc đặc trưng từng bậc phẩm | 100% |
| Tiêu chí sắp xếp: Mới nhất (`NEWEST`), Độ hiếm (`RARITY`), Tên (`NAME`) | Sort buttons với logic định lượng `RARITY_WEIGHT` (MR: 7 > LR: 6 > UR: 5 > SSR: 4 > SR: 3 > R: 2 > N: 1) | 100% |
| Thẻ bài 3D `WikiCard3D` | `WikiCardWidget`: Kích thước tỷ lệ `280x420`, viền màu theo phẩm cấp (N, R, SR, SSR, UR, LR, MR), artwork nền, gradient che phủ, chữ độ hiếm nghiêng đậm, dàn sao thức tỉnh ở chân thẻ. Khi `isOwned == false`, phủ mờ gradient đen và icon Khóa `Lock` | 100% |
| Item thẻ `ManagerCardItem` (Đã sở hữu) | Thumbnail thẻ 3D, tiêu đề, nút "CHI TIẾT" (mở Wikipedia external), ngày sở hữu, badge "Bài học đã sẵn sàng" (xanh lá) / "Chưa học lần nào" (slate), nút "HỌC NGAY" | 100% |
| Item thẻ `ManagerCardItem` (Chưa sở hữu) | Thumbnail thẻ có icon Khóa, tiêu đề, nút "CHI TIẾT", text "Chưa có trong bộ sưu tập", badge "Chưa sở hữu" (xám), nút CTA "CHƯA SỞ HỮU" (bị vô hiệu hóa) | 100% |
| Dải lịch sử thi gần đây cuộn ngang | Horizontal `ListView` các chip điểm: màu xanh lá nếu đạt (`correctCount >= ceil(total/2)`), màu đỏ nếu không đạt, kèm ngày thi | 100% |
| Modal xem lại bài làm `ReviewHistoryModal` | `ReviewHistorySheet`: DraggableScrollableSheet hiển thị ngày thi, số câu đúng/tổng, đoạn văn đã đọc snapshot, danh sách câu hỏi trắc nghiệm/tự luận, so sánh đáp án người dùng vs đáp án chuẩn, và box "AI GIẢI THÍCH" | 100% |
| Trạng thái rỗng (Empty state) | Biểu tượng `Sparkles` mờ kèm text "Không có thẻ nào phù hợp." | 100% |

---

## 4. BẰNG CHỨNG KIỂM THỬ TRỰC TIẾP TRÊN ANDROID EMULATOR

Tất cả các ảnh chụp màn hình thực tế từ thiết bị `Pixel_7` (`emulator-5554`) đã được chụp và lưu trữ:

1. **Bảo toàn 100% Main App Shell & 5 Tab Navigation:**
   - Artifact: `main_shell_check.png` & `tab1_check.png`
   - Xác nhận: Tab 0 (Tổng quan), Tab 1 (Góc luyện tập - Placeholder nguyên bản), Tab 2 (Khóa học FAB), Tab 3 (Cộng đồng), Tab 4 (Xếp hạng) hoàn toàn nguyên vẹn.
2. **Truy cập Wiki Manager từ Avatar Menu ở Header:**
   - Artifact: `profile_menu.png` & `wiki_combined_screen.png`
   - Nhấn Avatar trên TopBar mở popup menu -> chọn "Wiki Tri Thức & Bài Học" -> mở `WikiManagerScreen` toàn màn hình với AppBar back button.
3. **Hiển thị danh sách kết hợp (Đã sở hữu & Chưa sở hữu):**
   - Artifact: `wiki_combined_screen.png`
   - Header hiển thị "4 sở hữu / 80 thẻ bài".
   - Danh sách thể hiện đầy đủ các thẻ đã sở hữu với trạng thái học tập và nút "HỌC NGAY".
4. **Bộ lọc "Chưa sở hữu" (Unowned Cards):**
   - Artifact: `wiki_unowned_view.png`
   - Danh sách hiển thị các thẻ chưa sở hữu (76 thẻ): Artwork bị phủ mờ kèm icon Khóa, badge trạng thái "Chưa sở hữu" màu xám, nút "CHƯA SỞ HỮU".
5. **Modal xem chi tiết bài làm (Review History Sheet):**
   - Artifact: `wiki_review_modal.png` và `wiki_review_scrolled.png`
   - Header "CHI TIẾT BÀI LÀM", badge "Đúng 2/3 câu", box "Đoạn văn đã đọc" trích xuất từ database snapshot, câu hỏi phân tích, đáp án sai hiển thị màu đỏ kèm icon (X), đáp án đúng hiển thị màu xanh lá kèm checkmark, box "AI GIẢI THÍCH" với lời giải thích chi tiết từ Gemini.
6. **Sắp xếp theo "Độ hiếm" (MR > LR > UR > SSR > SR > R > N):**
   - Artifact: `wiki_sort_rarity.png`
   - Thẻ Mythic Rare (`MR Circassian genocide`) lập tức được xếp lên đầu tiên.
7. **Tìm kiếm tức thì theo tên thẻ & Empty State:**
   - Artifact: `wiki_search.png` và `wiki_empty.png`
   - Tìm kiếm "Marc" -> Trả về thẻ Marc Rotenberg; Tìm từ khóa không tồn tại -> Hiển thị Empty state chuẩn.

---

## 5. KẾT LUẬN VÀ SẴN SÀNG CHO BƯỚC TIẾP THEO

- Toàn bộ các yêu cầu của **GIAI ĐOẠN 4 – BƯỚC 5A: WIKI MANAGER** và **MỤC 12: ĐIỀU CHỈNH KIẾN TRÚC BẮT BUỘC** đã được hoàn thành 100%.
- Không làm ảnh hưởng bất kỳ module nào đã hoàn thành trước đó (Authentication, Main App Shell, Dashboard, Learning & Video Quiz A–E).
- Hệ thống đã sẵn sàng cho bước tiếp theo: **GIAI ĐOẠN 4 – BƯỚC 5B: TRIỂN KHAI WIKI STUDY & STAR AWAKENING (Học bài theo thẻ và thức tỉnh sao)**.
