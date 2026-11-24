# BÁO CÁO HOÀN THÀNH GIAI ĐOẠN 4 – BƯỚC 5C.3
## TRIỂN KHAI GACHA FLUTTER NATIVE UI & API INTEGRATION

---

## 1. TỔNG QUAN KẾT QUẢ

- **Mục tiêu:** Xây dựng hoàn chỉnh module **Cầu Nguyện Tri Thức (Gacha System)** trên ứng dụng Flutter Native `hub_el_mobile`, kết nối trực tiếp với hệ thống Backend REST API tại `hub-el`.
- **Nguyên tắc cốt lõi:**
  - 100% Flutter Native Widgets, tuyệt đối không dùng WebView.
  - Tái hiện sát phong cách thiết kế không gian kỳ ảo / Mobile Web của `hub-el`: Cây thần phát sáng dạng Fractal, mây trôi, bụi sao lấp lánh, hiệu ứng vẽ viền thẻ năng lượng (`CardFrameSVG`), hiệu ứng thẻ trắng xoay 3D (`whiteCardSpin`) và lật thẻ thật.
  - Sử dụng 100% dữ liệu thật từ Backend (SQL Server qua Next.js HTTP API), không sinh kết quả hoặc phần thưởng giả định.
  - Đồng bộ trạng thái toàn diện với tủ đồ thẻ bài Wiki (`WikiManagerScreen`).
- **Kết quả kiểm thử tự động:**
  - **82/82 tests PASS 100%** (bao gồm 13 test cases mới cho Gacha Data Layer, UseCases, BLoC State Machine và Presentation Widgets).
  - `flutter analyze --no-fatal-infos`: **0 errors, 0 warnings**.
- **Kiểm thử trên Android Emulator thực tế (`emulator-5554`):**
  - Chạy mượt mà toàn bộ các luồng: Xem trạng thái, mở Info Modal xem thể lệ/tỷ lệ, xem Tiệm Đổi Thẻ, xem Lịch sử quay thẻ, quay thẻ đơn x1 (nhận thẻ mới `NEW!`), nhấn giữ nút để quay đa thẻ x4 (`Multi-roll`), phân rã thẻ trùng nhận Bụi sao, và chuyển đổi qua lại mượt mà giữa Gacha và Wiki Manager.

---

## 2. KIẾN TRÚC MODULE CLEAN ARCHITECTURE

Module được đặt tại `lib/features/gacha/`:

```text
lib/features/gacha/
├── domain/
│   ├── entities/
│   │   ├── gacha_status_entity.dart         # Trạng thái Xu, Bụi sao, Pity SR/SSR/UR, PRO
│   │   ├── gacha_card_entity.dart           # Thông tin thẻ bài nhận được, isNew, stardustEarned
│   │   ├── gacha_roll_result_entity.dart    # Kết quả lượt quay (danh sách thẻ, số dư mới)
│   │   ├── gacha_exchange_entity.dart       # Danh sách thẻ tiệm đổi & giá Bụi sao
│   │   └── gacha_history_entity.dart        # Lịch sử sở hữu thẻ & phân trang
│   ├── repositories/
│   │   └── gacha_repository.dart            # Contract IGachaRepository
│   └── usecases/
│       ├── get_gacha_status_usecase.dart    # Lấy thông tin tài nguyên & pity
│       ├── roll_gacha_usecase.dart          # Quay 1..5 lượt (chặn count < 1 hoặc > 5)
│       ├── get_exchange_cards_usecase.dart  # Lấy danh sách thẻ chưa sở hữu
│       ├── exchange_card_usecase.dart       # Đổi thẻ bằng Bụi sao
│       └── get_gacha_history_usecase.dart   # Lịch sử quay thẻ phân trang
├── data/
│   ├── models/
│   │   ├── gacha_status_model.dart          # Parse JSON status
│   │   ├── gacha_card_model.dart            # Parse JSON thẻ bài
│   │   ├── gacha_roll_result_model.dart     # Parse JSON roll & summary từ service
│   │   ├── gacha_exchange_model.dart        # Parse JSON tiệm đổi thẻ
│   │   └── gacha_history_model.dart         # Parse JSON lịch sử
│   ├── datasources/
│   │   └── gacha_remote_data_source.dart    # Gọi 4 REST API qua DioClient
│   └── repositories/
│       └── gacha_repository_impl.dart       # Cung cấp dữ liệu cho Domain qua ApiResult
└── presentation/
    ├── bloc/
    │   ├── gacha_event.dart                 # Các sự kiện Fetch, Roll, Step, Exchange, History
    │   ├── gacha_state.dart                 # Trạng thái Loading, Loaded, Error, Animation State
    │   └── gacha_bloc.dart                  # State Machine điều khiển luồng quay & hiệu ứng
    ├── screens/
    │   └── gacha_screen.dart                # Màn hình chính Gacha
    └── widgets/
        ├── gacha_header_widget.dart         # Thanh hiển thị Xu, Bụi sao, PRO, 3 thanh Pity
        ├── gacha_sacred_tree_widget.dart    # Cây thần Fractal & bụi sao phát sáng (CustomPainter)
        ├── gacha_card_frame_widget.dart     # Khung vector ánh sáng vẽ bao quanh thẻ 280x420
        ├── gacha_spinning_card_widget.dart  # Thẻ trắng xoay 3D 360 độ
        ├── gacha_result_view.dart           # Hiển thị kết quả thẻ thật (NEW! / Duplicate)
        ├── gacha_roll_button.dart           # Nút quay tương tác (Chạm: x1, Nhấn giữ: tăng 1..5)
        ├── gacha_info_modal.dart            # Modal thể lệ, cơ chế Pity & xác suất chi tiết
        ├── gacha_exchange_modal.dart        # Modal Tiệm đổi Bụi sao gom nhóm theo độ hiếm
        └── gacha_history_modal.dart         # Modal Lịch sử sở hữu thẻ phân trang
```

---

## 3. DANH SÁCH FILE ĐÃ TẠO VÀ CHỈNH SỬA

| STT | File | Trạng thái | Chức năng |
|---|---|---|---|
| 1 | `lib/core/constants/api_endpoints.dart` | Cập nhật | Bổ sung `gachaStatus = '/api/v1/gacha/status'`. |
| 2 | `lib/features/gacha/domain/entities/...` (5 files) | **Tạo mới** | Định nghĩa Domain Entities cho Gacha Status, Card, Roll Result, Exchange, History. |
| 3 | `lib/features/gacha/domain/repositories/gacha_repository.dart` | **Tạo mới** | Interface chuẩn cho Repository. |
| 4 | `lib/features/gacha/domain/usecases/...` (5 files) | **Tạo mới** | UseCases nghiệp vụ lõi (có validation count 1..5 và cardId). |
| 5 | `lib/features/gacha/data/models/...` (5 files) | **Tạo mới** | Data Models tương thích 100% với REST API DTOs của Backend. |
| 6 | `lib/features/gacha/data/datasources/gacha_remote_data_source.dart` | **Tạo mới** | Remote Data Source kết nối DioClient dùng chung. |
| 7 | `lib/features/gacha/data/repositories/gacha_repository_impl.dart` | **Tạo mới** | Repository Implementation chuyển đổi model sang entity. |
| 8 | `lib/features/gacha/presentation/bloc/gacha_event.dart` | **Tạo mới** | Bộ sự kiện Gacha. |
| 9 | `lib/features/gacha/presentation/bloc/gacha_state.dart` | **Tạo mới** | Trạng thái Gacha và Animation State (`idle`, `drawing`, `spinning`, `revealed`). |
| 10 | `lib/features/gacha/presentation/bloc/gacha_bloc.dart` | **Tạo mới** | Xử lý logic nghiệp vụ và điều phối nhịp độ Animation. |
| 11 | `lib/features/gacha/presentation/widgets/gacha_header_widget.dart` | **Tạo mới** | Thanh thông số Xu, Bụi sao, PRO badge và 3 Pity bars (SR, SSR, UR). |
| 12 | `lib/features/gacha/presentation/widgets/gacha_sacred_tree_widget.dart` | **Tạo mới** | CustomPainter vẽ cây tri thức Fractal phát sáng, sao trời và bụi sao rơi. |
| 13 | `lib/features/gacha/presentation/widgets/gacha_card_frame_widget.dart` | **Tạo mới** | CustomPainter vẽ khung vector viền ánh sáng chạy từ 4 góc về cạnh. |
| 14 | `lib/features/gacha/presentation/widgets/gacha_spinning_card_widget.dart` | **Tạo mới** | Thẻ trắng xoay 3D 360 độ quanh trục Y trong 800ms. |
| 15 | `lib/features/gacha/presentation/widgets/gacha_result_view.dart` | **Tạo mới** | Hiển thị thẻ kết quả, huy hiệu NEW!, phần thưởng Bụi sao cho thẻ trùng. |
| 16 | `lib/features/gacha/presentation/widgets/gacha_roll_button.dart` | **Tạo mới** | Nút tương tác chạm hoặc giữ để tăng số lượt quay từ 1x đến 5x. |
| 17 | `lib/features/gacha/presentation/widgets/gacha_info_modal.dart` | **Tạo mới** | Modal thể lệ, Pity rules và bảng tỷ lệ N..MR khớp 100% Web. |
| 18 | `lib/features/gacha/presentation/widgets/gacha_exchange_modal.dart` | **Tạo mới** | Tiệm đổi Bụi sao gom nhóm theo Rarity, xác nhận giao dịch. |
| 19 | `lib/features/gacha/presentation/widgets/gacha_history_modal.dart` | **Tạo mới** | Lịch sử sở hữu thẻ kèm ảnh, độ hiếm và phân trang. |
| 20 | `lib/features/gacha/presentation/screens/gacha_screen.dart` | **Tạo mới** | Màn hình Gacha tích hợp toàn diện. |
| 21 | `lib/main.dart` | Cập nhật | Khởi tạo DI cho `gachaRemoteDataSource`, `gachaRepository` và cung cấp qua `MultiRepositoryProvider`. |
| 22 | `lib/shared/widgets/mobile_header_bar.dart` | Cập nhật | Thêm mục menu "Cầu Nguyện Tri Thức (Gacha)" trong Drawer người dùng. |
| 23 | `lib/features/wiki/presentation/screens/wiki_manager_screen.dart` | Cập nhật | Nút "Nhận thêm thẻ" mở trực tiếp `GachaScreen` và tự động làm mới kho thẻ khi quay về. |
| 24 | `test/features/gacha/gacha_test.dart` | **Tạo mới** | Bộ kiểm thử tự động 13 test cases bao phủ Models, UseCases, BLoC và Widgets. |

---

## 4. CHI TIẾT TÍCH HỢP REST API THỰC TẾ

Ứng dụng Flutter kết nối trực tiếp với 4 HTTP endpoints backend:

| API | Phương thức | Dữ liệu gửi đi | Xử lý trên Flutter |
|---|---|---|---|
| `/api/v1/gacha/status` | `GET` | Bearer JWT | Hiển thị Xu, Bụi sao, bộ đếm Pity SR (10), SSR (50), UR (120), trạng thái PRO và lượt quay miễn phí hàng ngày. |
| `/api/v1/gacha/roll` | `POST` | `{"count": 1..5}` | Nhận kết quả `rolls` & `summary`, tự động cập nhật số dư, chuyển tiếp Animation State Machine và hiển thị thẻ kết quả. |
| `/api/v1/gacha/exchange` | `GET` | Bearer JWT | Lấy danh sách thẻ chưa sở hữu, phân nhóm theo MR, LR, UR, SSR, SR, R, N kèm giá Bụi sao. |
| `/api/v1/gacha/exchange` | `POST` | `{"cardId": id}` | Giao dịch nguyên tử đổi Bụi sao lấy thẻ, tự động cập nhật số dư và danh sách sau khi đổi. |
| `/api/v1/gacha/history` | `GET` | `?page=1&limit=10` | Lấy danh sách các thẻ người dùng đã sở hữu, thời gian nhận và điều hướng phân trang. |

---

## 5. ANIMATION STATE MACHINE ĐÃ TRIỂN KHAI

Hệ thống hoạt họa quay thẻ tuân thủ state machine:

$$\text{idle} \longrightarrow \text{drawing} \longrightarrow \text{spinning} \longrightarrow \text{revealed} \longrightarrow \text{idle}$$

1. **`idle`:**
   - Cây Tri Thức Fractal phát sáng (`GachaSacredTreeWidget`), các ngôi sao lấp lánh và bụi sao xanh ngọc chuyển động rơi nhẹ.
   - Header hiển thị đầy đủ tài nguyên và Pity bars.
   - Nút quay hiển thị `Tìm Tri Thức x1` (`100 Xu`) hoặc `Miễn phí hôm nay` (nếu tài khoản PRO còn lượt free).
2. **`drawing` (1.2 giây):**
   - Lớp phủ mờ tối xuất hiện.
   - Vector `GachaCardFrameWidget` (khung ánh sáng 280x420) chạy viền xanh ngọc từ 4 góc về phía các cạnh với lõi trắng rực rỡ.
3. **`spinning` (0.8 giây):**
   - Thẻ trắng phát sáng xoay 3D 360 độ quanh trục Y (`GachaSpinningCardWidget`) với hiệu ứng perspective và hào quang xanh cyan.
4. **`revealed`:**
   - Hiển thị thẻ bài thật bằng `WikiCardWidget`.
   - Nếu thẻ mới: Huy hiệu đỏ `NEW!` rực rỡ ở góc phải trên.
   - Nếu thẻ trùng: Huy hiệu xanh ngọc hiển thị rõ số Bụi sao nhận được (`+X Bụi sao`).
   - Hỗ trợ Multi-roll (x2 đến x5): Hiển thị danh sách thẻ trượt ngang mượt mà.
   - Banner thông báo ở trên: "Nhận được thẻ mới!" hoặc "Đã rút X thẻ: Y Mới, Z Trùng".
   - Chạm vào bất kỳ vị trí nào trên màn hình để đóng và quay về trạng thái `idle`.

---

## 6. KẾT QUẢ KIỂM THỬ TRÊN ANDROID EMULATOR

### A. Ảnh chụp màn hình kiểm chứng

1. **Màn hình chính Gacha (`gacha_screen_fixed.png`):**
   - Cây thần Fractal, sao trời, bụi sao xanh.
   - Header: 1000 Xu, 500 Bụi sao, Pity SR 1/10, SSR 1/50, UR 1/120.
   - Các nút tiện ích: `Đổi thẻ`, `Chi tiết`, `Lịch sử` và nút `Tìm Tri Thức x1`.
2. **Modal Thể lệ & Tỷ lệ (`gacha_info_modal.png`):**
   - Cơ chế bảo hiểm 10 (SR), 50 (SSR), 120 (UR).
   - Quy tắc phân rã thẻ trùng và +20% Bụi sao cho PRO.
   - Bảng tỷ lệ: MR 0.05%, LR 0.15%, UR 0.80%, SSR 4.00%, SR 15.0%, R 30.0%, N 50.0%.
3. **Modal Tiệm đổi thẻ Bụi sao (`gacha_exchange_modal.png`):**
   - Hiển thị số dư Bụi sao.
   - Danh sách thẻ chưa sở hữu hoặc thông báo khi đã sở hữu toàn bộ.
4. **Modal Lịch sử thẻ bài (`gacha_history_with_card.png`):**
   - Hiển thị danh sách thẻ đã nhận theo thứ tự mới nhất kèm hình ảnh, độ hiếm và thời gian nhận thực tế.
5. **Kết quả quay thẻ đơn x1 (`gacha_roll_result_card.png`):**
   - Banner "Nhận được thẻ mới!".
   - Thẻ `N | Wielka Wieś, Pomeranian Voivodeship` kèm hình ảnh từ Wikipedia và huy hiệu `NEW!`.
   - Xu tự động trừ 100 Xu (1000 $\rightarrow$ 900), Pity counters tăng lên 2.
6. **Kết quả quay đa thẻ x4 Multi-roll (`gacha_multi_roll_result.png`):**
   - Nhấn giữ nút quay 800ms kích hoạt quay x4.
   - Banner "Đã rút 4 thẻ: 2 Mới, 2 Trùng".
   - Thẻ mới hiển thị `NEW!`, thẻ trùng hiển thị `+1 Bụi sao`.
   - Xu trừ 400 Xu (900 $\rightarrow$ 500), Bụi sao cộng 2 (500 $\rightarrow$ 502), Pity tăng lên 6/10, 6/50, 6/120.
7. **Đồng bộ với Wiki Manager (`gacha_to_wiki_manager2.png`):**
   - Mở Wiki Manager: Thẻ vừa quay được xuất hiện ngay lập tức ở vị trí đầu danh sách.
   - Nút "Nhận thêm thẻ" tại Wiki Manager mở lại Gacha Screen tức thì.

---

## 7. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

- Chạy `flutter test test/features/gacha/gacha_test.dart`: **13/13 test cases PASS (100%)**.
- Chạy toàn bộ test suite `flutter test`: **82/82 test cases PASS (100%)**.
- Chạy `flutter analyze --no-fatal-infos`: **0 errors**.

