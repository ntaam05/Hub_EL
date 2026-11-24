# KẾ HOẠCH TRIỂN KHAI MODULE WIKI MANAGER (GIAI ĐOẠN 4 – BƯỚC 5A)

## 1. TỔNG QUAN

Tài liệu này xác định kiến trúc, kế hoạch chi tiết và bản đồ chuyển đổi 1:1 từ Mobile Web (`hub-el`) sang Flutter Native (`hub_el_mobile`) cho module **Wiki Manager – Quản lý Bộ sưu tập Thẻ bài**.

Tuân thủ nghiêm ngặt nguyên tắc: **Không tự thiết kế lại giao diện, không sử dụng WebView, tái sử dụng 100% dữ liệu nghiệp vụ và design tokens từ Mobile Web.**

---

## 2. SOURCE CODE MOBILE WEB THAM CHIẾU (`hub-el`)

| Mobile Web Component / File | Đường dẫn | Chức năng chính |
|---|---|---|
| `WikiManagerPage` | `src/app/(main)/wiki-manager/page.tsx` | Trang quản lý bài học thẻ Wiki, header, bộ lọc, sắp xếp, lưới thẻ bài. |
| `ManagerCardItem` | `src/app/(main)/wiki-manager/page.tsx` (L123-L177) | Item thẻ bài: Thumbnail 3D card, tiêu đề, nút Chi tiết, badge trạng thái, nút Học ngay, lịch sử thi gần đây. |
| `ReviewHistoryModal` | `src/app/(main)/wiki-manager/page.tsx` (L16-L121) | Modal xem lại bài làm chi tiết: Đoạn văn đọc, câu hỏi & đáp án, đáp án người dùng, đáp án chuẩn, AI giải thích. |
| `WikiCard3D` | `src/components/ui/wiki-card-3d.tsx` | Card 3D hiển thị độ hiếm (N, R, SR, SSR, UR, LR, MR), viền màu sắc, artwork, dàn sao thức tỉnh. |
| Server Action | `src/actions/wiki-manager.ts` | Hàm `getWikiManagementData(userId)` query `UserInventory` kèm `WikiCard` và `WikiQuizAttempt`. |

---

## 3. PRISMA MODELS & HỆ THỐNG CƠ SỞ DỮ LIỆU (SQL SERVER)

Tái sử dụng 3 models hiện có trong Prisma ORM (`prisma/schema.prisma`):

1. **`UserInventory`** (Tủ đồ người dùng):
   - `id`: Int (Khóa chính)
   - `userId`: String (Foreign key -> `User.id`)
   - `cardId`: Int (Foreign key -> `WikiCard.id`)
   - `acquiredAt`: DateTime
   - `isNew`: Boolean
   - `currentStar`: Int
   - `canShareCount`: Int
   - `source`: String
   - `isCompleted`: Boolean
   - Quan hệ: `card` (`WikiCard`)

2. **`WikiCard`** (Thẻ bài kiến thức Wikipedia):
   - `id`: Int
   - `wikiUrl`: String?
   - `title`: String
   - `rarity`: String (`N`, `R`, `SR`, `SSR`, `UR`, `LR`, `MR`)
   - `imageUrl`: String?
   - `aiContent`: String
   - `totalStars`: Int
   - `awakenedStars`: Int
   - `contentText`: String?
   - `chunkData`: String?
   - Quan hệ: `attempts` (`WikiQuizAttempt[]`)

3. **`WikiQuizAttempt`** (Lịch sử làm bài thi của thẻ bài):
   - `id`: Int
   - `userId`: String
   - `cardId`: Int
   - `score`: Float
   - `correctCount`: Int
   - `totalQuizzes`: Int
   - `createdAt`: DateTime
   - `userAnswers`: String (JSON array các đáp án user đã chọn)
   - `lessonSnapshot`: String (JSON snapshot chứa `simplifiedText`, `vocabularies`, `quizzes`)

---

## 4. THIẾT KẾ BACKEND API BRIDGE (`hub-el`)

Tạo Route Handler mới tại: `src/app/api/v1/wiki/inventory/route.ts`
- **Method:** `GET`
- **Authentication:** Bearer JWT Token trong Header `Authorization: Bearer <token>`.
- **Logic:**
  1. Xác thực Bearer Token qua `verifyToken(token)`.
  2. Lấy `userId` từ token payload.
  3. Gọi trực tiếp server action `getWikiManagementData(userId)`.
  4. Trả về format chuẩn:
     ```json
     {
       "success": true,
       "data": [
         {
           "id": 1,
           "userId": "cmw1tbh930001vclg2eud8m6h",
           "cardId": 54,
           "acquiredAt": "2026-05-13T04:24:02.300Z",
           "isNew": false,
           "currentStar": 1,
           "card": {
             "id": 54,
             "title": "Ferula gummosa",
             "rarity": "SSR",
             "imageUrl": "https://...",
             "totalStars": 4,
             "awakenedStars": 1,
             "attempts": [
               {
                 "id": 1,
                 "correctCount": 2,
                 "totalQuizzes": 3,
                 "createdAt": "2026-05-13T04:24:02.300Z",
                 "userAnswers": "[\"1\",\"0\",\"2\"]",
                 "lessonSnapshot": "{\"simplifiedText\":\"...\",\"quizzes\":[...]}"
               }
             ]
           }
         }
       ]
     }
     ```

---

## 5. BẢN ĐỒ CHUYỂN ĐỔI REACT COMPONENT SANG FLUTTER WIDGETS

| Next.js / React (Web) | Flutter Native Widget (`hub_el_mobile`) | Ghi chú thiết kế / Styling Tokens |
|---|---|---|
| `WikiManagerPage` | `WikiManagerScreen` | Header: icon `BookOpen`, title "Quản lý Bài Học", phụ đề; Quick buttons: "Kho Từ Vựng", "Nhận thêm thẻ"; Filter pills: `Tất cả`, `Đã học`, `Chưa học`; Sort pills: `Mới nhất`, `Độ hiếm`, `A-Z`; Search field; Grid/List layout. |
| `ManagerCardItem` | `WikiManagerCardItem` | Card nền bo góc `16px`, viền `slate-200`/`dark:slate-800`. Cột trái: `WikiCardWidget`. Cột phải: Tiêu đề, nút "Chi tiết" (mở browser), ngày sở hữu, badge trạng thái ("Bài học đã sẵn sàng" / "Chưa học lần nào"), nút "HỌC NGAY", horizontal scroll view lịch sử thi. |
| `WikiCard3D` | `WikiCardWidget` | Thẻ kích thước `280x420` scale xuống ~`0.5` (`140x210`). Viền màu theo độ hiếm (`N: #94a3b8`, `R: #3b82f6`, `SR: #a855f7`, `SSR: #eab308`, `UR: #ef4444`, `LR: #2dd4bf`, `MR: #ec4899`). Artwork hình ảnh, chữ độ hiếm nghiêng đậm, tên thẻ, dàn sao thức tỉnh ở đáy. |
| `ReviewHistoryModal` | `ReviewHistorySheet` | Modal Bottom Sheet cuộn: Header với ngày thi, số câu đúng/tổng; Box "Đoạn văn đã đọc"; Danh sách câu hỏi kèm type badge, các options (xanh lá nếu đúng, đỏ nếu sai), "AI Giải thích" viền xanh lam nhạt. |
| State Management | `WikiManagerBloc` | States: Initial, Loading, Loaded, Error. Events: `WikiInventoryFetchRequested`, `WikiFilterChanged`, `WikiSortChanged`, `WikiSearchChanged`. |

---

## 6. DANH SÁCH FILE CẦN TẠO VÀ CHỈNH SỬA

### A. Backend (`hub-el`)
- `src/app/api/v1/wiki/inventory/route.ts` *(Mới)*: GET endpoint cung cấp danh sách inventory thẻ bài cho user.

### B. Flutter Mobile (`hub_el_mobile`)
- **Domain Layer:**
  - `lib/features/wiki/domain/entities/wiki_card_entity.dart` *(Mới)*
  - `lib/features/wiki/domain/entities/user_inventory_entity.dart` *(Mới)*
  - `lib/features/wiki/domain/entities/wiki_quiz_attempt_entity.dart` *(Mới)*
  - `lib/features/wiki/domain/repositories/wiki_repository.dart` *(Mới)*
  - `lib/features/wiki/domain/usecases/get_wiki_inventory_usecase.dart` *(Mới)*
- **Data Layer:**
  - `lib/features/wiki/data/models/wiki_card_model.dart` *(Mới)*
  - `lib/features/wiki/data/models/user_inventory_model.dart` *(Mới)*
  - `lib/features/wiki/data/models/wiki_quiz_attempt_model.dart` *(Mới)*
  - `lib/features/wiki/data/datasources/wiki_remote_data_source.dart` *(Mới)*
  - `lib/features/wiki/data/repositories/wiki_repository_impl.dart` *(Mới)*
- **Presentation Layer:**
  - `lib/features/wiki/presentation/bloc/wiki_manager_bloc.dart` *(Mới)*
  - `lib/features/wiki/presentation/bloc/wiki_manager_event.dart` *(Mới)*
  - `lib/features/wiki/presentation/bloc/wiki_manager_state.dart` *(Mới)*
  - `lib/features/wiki/presentation/widgets/wiki_card_widget.dart` *(Mới)*
  - `lib/features/wiki/presentation/widgets/wiki_manager_card_item.dart` *(Mới)*
  - `lib/features/wiki/presentation/widgets/review_history_sheet.dart` *(Mới)*
  - `lib/features/wiki/presentation/screens/wiki_manager_screen.dart` *(Mới)*
- **App Integration:**
  - `lib/features/dashboard/presentation/screens/main_shell_screen.dart`: Tích hợp `WikiManagerScreen` vào Tab 1 (Luyện tập).
  - `lib/shared/widgets/mobile_header_bar.dart`: Liên kết nút "Wiki Tri Thức & Gacha" trong avatar menu mở `WikiManagerScreen`.
  - `lib/main.dart` / DI setup: Đăng ký Repository, UseCase, Bloc providers.
- **Testing:**
  - `test/features/wiki/wiki_manager_test.dart` *(Mới)*: Unit test data, domain, và bloc.

---

## 7. LUỒNG DỮ LIỆU TỪ FLUTTER ĐẾN SQL SERVER

```
[Flutter UI: WikiManagerScreen]
       │
       ▼ (Dispatch WikiInventoryFetchRequested)
[WikiManagerBloc]
       │
       ▼ (Execute GetWikiInventoryUseCase)
[WikiRepositoryImpl]
       │
       ▼ (Call IWikiRemoteDataSource.getInventory)
[DioClient] (Kèm Bearer Token trong Auth Header)
       │
       ▼ (HTTP GET /api/v1/wiki/inventory)
[Next.js API Route: src/app/api/v1/wiki/inventory/route.ts]
       │
       ▼ (verifyToken -> extract userId)
[Server Action: getWikiManagementData(userId)]
       │
       ▼ (Prisma ORM: findMany UserInventory with card and attempts)
[Microsoft SQL Server: HubEL Database]
       │
       ▼ (SQL Query execution)
[Prisma UserInventory & Nested WikiCard Entities]
       │
       ▼ (Return JSON Array)
[Flutter Data Layer: UserInventoryModel.fromJson]
       │
       ▼ (Emit WikiManagerLoaded(items, filteredItems))
[Flutter Presentation Layer: WikiManagerCardItem & WikiCardWidget]
```

---

## 8. TIÊU CHÍ HOÀN THÀNH (ACCEPTANCE CRITERIA)

1. Tái hiện chuẩn xác 1:1 Mobile Web giao diện Quản lý Bài Học Wiki.
2. Hệ thống độ hiếm và màu sắc chuẩn (N, R, SR, SSR, UR, LR, MR).
3. Đầy đủ các bộ lọc: Tất cả, Đã học, Chưa học.
4. Đầy đủ các tiêu chí sắp xếp: Mới nhất, Độ hiếm (MR -> N), Tên thẻ (A-Z).
5. Ô tìm kiếm lọc danh sách tức thì theo tên thẻ bài.
6. Lịch sử thi gần đây hiển thị dạng cuộn ngang, màu phân biệt đạt/không đạt.
7. Khi bấm vào 1 attempt thi, mở `ReviewHistorySheet` hiển thị snapshot đoạn văn đọc, danh sách câu hỏi, lựa chọn của user, đáp án đúng và AI giải thích.
8. Hoạt động trên Android Emulator kết nối backend thực tế, không dùng mock data.
9. `flutter analyze` đạt 0 issues, toàn bộ `flutter test` pass 100%.

