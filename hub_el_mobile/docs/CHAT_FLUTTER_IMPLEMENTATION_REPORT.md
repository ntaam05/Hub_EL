# BÁO CÁO TRIỂN KHAI HỆ THỐNG CHAT & REALTIME MESSAGING FLUTTER NATIVE

**Dự án:** `hub_el_mobile` (Flutter Native Client)  
**Backend:** `hub-el` (Next.js REST API + Socket.IO + SQL Server)  
**Ngày hoàn thành:** 20/11/2026  
**Trạng thái:** ✅ **HOÀN THÀNH 100% – ĐÃ KIỂM THỬ TOÀN DIỆN & XÁC MINH TRÊN EMULATOR**

---

## 1. TỔNG QUAN & PHÂN TÍCH GIAO DIỆN CHAT MOBILE WEB

Theo yêu cầu của người dùng, giao diện khung chat qua lại thời gian thực (Realtime Chat Box) trên Flutter Native đã được hiện thực hóa dựa trên mã nguồn Web Mobile gốc tại `hub-el/src/app/(main)/social/page.tsx`, `ChatRightSidebar.tsx`, `chat-message.tsx` và `server.js`.

### Các đặc tính giao diện & nghiệp vụ Mobile Web đã tái hiện:
1. **Header cuộc trò chuyện (Chat Header):**
   - Nút quay lại (Back arrow).
   - Avatar người bạn kèm chấm trạng thái Online (chấm xanh lá) / Offline (chấm xám).
   - Tên hiển thị (DisplayName) và trạng thái hoạt động ("Đang hoạt động" / "Ngoại tuyến" / "Nhóm học tập").
2. **Khung tin nhắn (Message Stream & Bubbles):**
   - **Tin nhắn của bản thân (Me):** Nằm bên phải màn hình, bong bóng màu xanh dương (`#2563EB`), bo góc cong mềm mại (góc dưới phải bo nhọn đặc trưng).
   - **Tin nhắn của đối phương:** Nằm bên trái màn hình, bong bóng màu xám đen (`#1E293B`), hiển thị avatar nhỏ phía trước.
   - **Tin nhắn trả lời (Reply Message):** Khung trích dẫn mờ phía trên nội dung tin nhắn có dải viền màu xanh (`#38BDF8`), hiển thị nhãn "Đã trả lời" và nội dung tin nhắn gốc.
   - **Hộp quà Thẻ Tri Thức Wiki (Gift Card SSR):**
     - Khi chưa mở: Khung thẻ gradient tím - chàm (`#8B5CF6` $\rightarrow$ `#6366F1`) có biểu tượng Hộp Quà, ghi chú "Nhấn để mở quà!" (đối với người nhận) hoặc "Chờ đối phương mở quà" (đối với người gửi).
     - Khi đã mở hoặc chia sẻ thẻ thông thường: Hiển thị hình ảnh thẻ bài, huy hiệu phẩm chất (N, R, SR, SSR, UR, LR, MR) với màu sắc đặc trưng, tên thẻ và trạng thái "Đã nhận".
   - **Chia sẻ Video & Liên kết (Links / Videos):** Tự động phát hiện URL và format card xem trước video YouTube (`https://img.youtube.com/vi/{id}/mqdefault.jpg`).
   - **Tin nhắn hệ thống (`[SYS:...`):** Hiển thị dạng viên thuốc (pill) căn giữa màn hình với màu chữ xám mờ.
   - **Thời gian gửi & Tương tác:** Hiển thị giờ gửi (`HH:mm`), nút "Trả lời" nhanh dưới mỗi tin nhắn và hỗ trợ nhấn giữ (Long press) bong bóng để phản hồi.
3. **Thanh nhập tin nhắn (Input Bar):**
   - Nút **Tặng Thẻ Wiki** (Biểu tượng lấp lánh ✨ màu tím) mở modal trượt chọn thẻ từ kho đồ cá nhân.
   - Ô nhập văn bản bo tròn 24px với placeholder "Nhập tin nhắn...".
   - Nút **Gửi** hình tròn màu xanh dương với biểu tượng Send.
   - Thanh thông tin tin nhắn đang trả lời (Replying Bar) xuất hiện phía trên ô nhập kèm nút hủy (✕).
4. **Điểm truy cập từ màn hình Bạn bè (Friends Screen):**
   - Nút nhắn tin nhanh (Icon Message Circle màu xanh lam) đặt ngay trên mỗi thẻ bạn bè (`FriendCard`).
   - Mục "Nhắn tin" trong menu 3 chấm của mỗi bạn bè.
   - Nút "Nhắn tin" màu xanh dương nổi bật trong Bottom Sheet hồ sơ người dùng (`UserProfileBottomSheet`).

---

## 2. KIẾN TRÚC TRIỂN KHAI (CLEAN ARCHITECTURE)

```mermaid
flowchart TD
    subgraph Presentation Layer
        ChatScr[ChatScreen]
        Bubble[ChatBubble Component]
        Sheet[WikiGiftPickerSheet]
        Cubit[ChatCubit & ChatState]
    end

    subgraph Domain Layer
        Entities[ChatMessageEntity & OwnedWikiCardEntity]
        IRepo[IChatRepository Interface]
    end

    subgraph Data Layer
        Models[ChatMessageModel & OwnedWikiCardModel]
        RepoImpl[ChatRepositoryImpl]
        RemoteDS[ChatRemoteDataSource via DioClient]
        SocketService[ChatSocketService via socket_io_client]
    end

    subgraph Backend Server (hub-el)
        REST["REST API /api/v1/chat/*"]
        SocketIO["Socket.IO Server (server.js - port 3000)"]
        ChatService["src/services/chat.service.ts"]
        DB[(SQL Server via Prisma)]
    end

    ChatScr --> Cubit
    Bubble --> Cubit
    Sheet --> Cubit
    Cubit --> IRepo
    Cubit --> SocketService
    IRepo -.-> RepoImpl
    RepoImpl --> RemoteDS
    RemoteDS --> REST
    SocketService --> SocketIO
    REST --> ChatService
    ChatService --> DB
```

---

## 3. DANH SÁCH TỆP TIN ĐÃ TẠO VÀ CHỈNH SỬA

| STT | Vị trí tệp | Mô tả |
|---|---|---|
| 1 | `hub-el/src/services/chat.service.ts` | Backend Service xử lý lấy lịch sử chat, gửi tin nhắn, mở hộp quà thẻ Wiki và lấy kho thẻ sở hữu |
| 2 | `hub-el/src/app/api/v1/chat/history/route.ts` | REST Route Handler lấy lịch sử tin nhắn 1-1 hoặc nhóm |
| 3 | `hub-el/src/app/api/v1/chat/send/route.ts` | REST Route Handler gửi tin nhắn văn bản, ảnh, quà tặng thẻ Wiki |
| 4 | `hub-el/src/app/api/v1/chat/claim-gift/route.ts` | REST Route Handler mở hộp quà tặng và chuyển quyền sở hữu thẻ |
| 5 | `hub-el/src/app/api/v1/chat/cards/route.ts` | REST Route Handler lấy kho thẻ bài của người dùng để tặng quà |
| 6 | `hub-el/scripts/test_chat_backend.ts` | Script kiểm thử tích hợp 4 endpoint Chat Backend |
| 7 | `hub_el_mobile/lib/core/constants/api_endpoints.dart` | Bổ sung các hằng số endpoint `/api/v1/chat/*` |
| 8 | `hub_el_mobile/lib/features/social/domain/entities/chat_message_entity.dart` | Thực thể tin nhắn chat, hỗ trợ phân tích Reply, System message, WikiGift |
| 9 | `hub_el_mobile/lib/features/social/domain/entities/owned_wiki_card_entity.dart` | Thực thể thẻ Wiki dùng để tặng quà |
| 10 | `hub_el_mobile/lib/features/social/domain/repositories/chat_repository.dart` | Interface `IChatRepository` |
| 11 | `hub_el_mobile/lib/features/social/data/models/chat_message_model.dart` | Data Model tin nhắn ánh xạ JSON linh hoạt |
| 12 | `hub_el_mobile/lib/features/social/data/models/owned_wiki_card_model.dart` | Data Model thẻ Wiki sở hữu |
| 13 | `hub_el_mobile/lib/features/social/data/services/chat_socket_service.dart` | Dịch vụ Socket.IO client (kết nối, join room, emit, receive message) |
| 14 | `hub_el_mobile/lib/features/social/data/datasources/chat_remote_data_source.dart` | Gọi REST API qua `DioClient` |
| 15 | `hub_el_mobile/lib/features/social/data/repositories/chat_repository_impl.dart` | Hiện thực repository kết nối data source |
| 16 | `hub_el_mobile/lib/features/social/presentation/cubit/chat_state.dart` | Quản lý state tin nhắn, trạng thái gửi, reply, quà tặng |
| 17 | `hub_el_mobile/lib/features/social/presentation/cubit/chat_cubit.dart` | Điều phối luồng tin nhắn, deduplication realtime và mở quà |
| 18 | `hub_el_mobile/lib/features/social/presentation/widgets/chat_bubble.dart` | Widget bong bóng chat (Text, Reply, Wiki Gift Card, Base64/Network Image) |
| 19 | `hub_el_mobile/lib/features/social/presentation/widgets/wiki_gift_picker_sheet.dart` | Bottom Sheet chọn thẻ bài Wiki từ kho đồ để tặng |
| 20 | `hub_el_mobile/lib/features/social/presentation/screens/chat_screen.dart` | Màn hình Chat hoàn chỉnh với Header, List, Input bar |
| 21 | `hub_el_mobile/lib/features/social/presentation/widgets/friend_card.dart` | Thêm nút nhắn tin nhanh và tùy chọn menu vào thẻ bạn bè |
| 22 | `hub_el_mobile/lib/features/social/presentation/widgets/user_profile_bottom_sheet.dart` | Thêm nút "Nhắn tin" lớn vào hồ sơ bạn bè |
| 23 | `hub_el_mobile/lib/main.dart` | Đăng ký `ChatSocketService`, `ChatRepositoryImpl`, `ChatCubit` |
| 24 | `hub_el_mobile/test/features/social/chat_test.dart` | Bộ test suite 15 kịch bản kiểm thử Chat |

---

## 4. KẾT QUẢ KIỂM THỬ

### 4.1. Kiểm thử tự động trên Flutter
Chạy lệnh `flutter test test/features/social/friends_test.dart test/features/social/chat_test.dart`:
```text
00:01 +38: All tests passed!
```
- **38/38 Tests PASS (100%):**
  - **15/15 Tests Chat (`chat_test.dart`):** Phân tích JSON, Reply, Gift Card, Tin nhắn hệ thống, State Cubit, Realtime Socket Deduplication, mở quà Wiki, Widget ChatBubble & PickerSheet.
  - **23/23 Tests Friends (`friends_test.dart`):** Toàn bộ chức năng Bạn bè không bị ảnh hưởng.

### 4.2. Kiểm thử Backend REST API (`scripts/test_chat_backend.ts`)
```text
=== BẮT ĐẦU TEST CHAT BACKEND ===
✅ 1. GET /api/v1/chat/cards: PASS (Số thẻ: 31)
✅ 2. POST /api/v1/chat/send: PASS (Message ID: 31)
✅ 3. GET /api/v1/chat/history: PASS (Tổng tin nhắn: 16)
✅ 4. POST /api/v1/chat/send (Reply): PASS
=== KẾT THÚC TEST CHAT BACKEND ===
```

### 4.3. Xác minh trực quan trên Android Emulator (`emulator-5554`)
1. **Truy cập Chat:**
   - Bấm nút icon tin nhắn màu xanh cyan trên `FriendCard` hoặc bấm "Nhắn tin" trong Bottom Sheet hồ sơ bạn bè.
   - Màn hình `ChatScreen` mở ra ngay lập tức với tiêu đề tên bạn bè và trạng thái.
2. **Tải & Hiển thị lịch sử tin nhắn thật:**
   - Lịch sử trò chuyện giữa 2 tài khoản tải thành công từ SQL Server.
   - Tin nhắn hiển thị đúng vị trí (bản thân màu xanh bên phải, đối phương màu đen xám bên trái).
   - Tin nhắn trả lời (Reply) hiển thị trích dẫn có viền cyan nổi bật.
   - Tin nhắn Hộp Quà Wiki hiển thị thẻ gradient tím sang trọng.
3. **Gửi tặng Thẻ Wiki trực tiếp:**
   - Bấm nút icon lấp lánh (✨) $\rightarrow$ Mở Bottom Sheet danh sách thẻ bài thật từ kho đồ người dùng (`Federal Hotel`, `Gloucestershire`, `Still River Baptist`,...).
   - Bấm chọn 1 thẻ $\rightarrow$ Gửi thành công, hiện SnackBar xanh lá *"Đã gửi Hộp Quà Thẻ Wiki thành công! ✨"*, và tin nhắn hộp quà xuất hiện ngay trong cuộc trò chuyện.
4. **Hỗ trợ ảnh Base64:**
   - Xử lý trích xuất và giải mã chuỗi Base64 (`data:image/jpeg;base64,...`) qua `Image.memory`, không làm gián đoạn hiển thị.

