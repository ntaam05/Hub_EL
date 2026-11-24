# BÁO CÁO KẾT QUẢ GIAI ĐOẠN 4 – BƯỚC 4: PHẦN C (AI QUIZ GENERATOR)

> **Mã công việc:** Phase 4 - Step 4 - Part C: AI Quiz Generator (Gemini Integration)  
> **Dự án:** `hub_el_mobile` (Flutter Android) & `hub-el` (Next.js Backend)  
> **Trạng thái:** Hoàn thành 100% – Đã xác thực thực tế trên Android Emulator & Gemini API  
> **Thời gian:** 10/11/2026  

---

## 1. MỤC TIÊU PHẦN C

Triển khai tính năng **Tạo bài tập AI (AI Quiz Generator)** đồng bộ 1:1 với giao diện Mobile Web của Hub-EL:
- Tích hợp Google Gemini 2.5 Flash thông qua Backend API Next.js (`POST /api/v1/videos/quiz/generate`).
- Hệ thống trừ Năng lượng thông minh (`user.aiTokens`), có hỗ trợ đặc quyền VIP PRO (giảm 30% năng lượng).
- Tùy chọn linh hoạt số lượng câu hỏi: 3 câu, 5 câu, 10 câu.
- Cào phụ đề video YouTube và tổng hợp prompt phân loại môn học (Lập trình IT, Ngoại ngữ, Môn khác).
- Trình bày danh sách câu hỏi AI sinh ra đẹp mắt, hỗ trợ chọn đáp án (A, B, C, D) với hiệu ứng kích hoạt xanh dương đặc trưng của Design System.
- Nút "Nộp bài & Chấm điểm" sẵn sàng kết nối sang Phần D (Interactive Quiz & Auto-grading).

---

## 2. KIẾN TRÚC & CÁC THÀNH PHẦN ĐÃ TRIỂN KHAI

### 2.1. Backend API Bridge (`hub-el`)
- **Tập tin:** `src/app/api/v1/videos/quiz/generate/route.ts`
- **Method:** `POST /api/v1/videos/quiz/generate`
- **Bảo mật:** Bearer JWT Token xác thực `extractUserId(req)` từ `Authorization: Bearer <token>`.
- **Nghiệp vụ:** Gọi `generateQuizFromVideoAction(userId, videoId, count)`:
  - Kiểm tra năng lượng còn lại của người dùng (`user.aiTokens`).
  - Trừ năng lượng tương ứng với số câu (và giảm 30% nếu có cờ `isPro`).
  - Lấy phụ đề transcript video YouTube (`getVideoContext`).
  - Gọi Google Gemini API (`generateQuizService`) sinh mảng JSON câu hỏi trắc nghiệm tiếng Việt chuẩn format.
  - Phục hồi lại năng lượng nếu quá trình cào phụ đề hoặc gọi AI thất bại.

### 2.2. Domain Layer (`hub_el_mobile`)
- **Entities:**
  - `QuizQuestionEntity`: Thuộc tính `questionText`, `optionA`, `optionB`, `optionC`, `optionD`, `correctAnswer`, `explanation`.
  - `QuizGeneratedEntity`: Thuộc tính `videoId`, `questionCount`, `questions`.
- **Repository Interface:**
  - `ILearningRepository.generateQuiz({required String videoId, int count = 5})`
- **Use Cases:**
  - `GenerateQuizUseCase`: Nhận `videoId` và `count`, tương tác với `ILearningRepository`.

### 2.3. Data Layer (`hub_el_mobile`)
- **Models:**
  - `QuizQuestionModel`: Chuyển đổi linh hoạt từ các định dạng key JSON trả về từ AI (`questionText`, `optionA`... hoặc `question`, `A`...).
  - `QuizGeneratedModel`: Parse danh sách câu hỏi và đóng gói `QuizGeneratedEntity`.
- **Data Source:**
  - `LearningRemoteDataSource.generateQuiz`: Gửi request `POST` qua `DioClient` với `receiveTimeout: 90s` (hỗ trợ các tác vụ AI phân tích transcript video dài).

### 2.4. Presentation Layer (`hub_el_mobile`)
- **State Management:**
  - `QuizBloc`, `QuizEvent` (`GenerateQuizRequested`, `QuizAnswerSelected`, `QuizResetRequested`), `QuizState` (`QuizInitial`, `QuizGenerating`, `QuizLoaded`, `QuizError`).
- **UI Components:**
  - `AiQuizGeneratorCard`:
    - Biểu tượng `sparkles` hiệu ứng gradient màu tím - xanh dương.
    - Bộ chọn số lượng câu hỏi linh hoạt (`[3 câu]`, `[5 câu]`, `[10 câu]`).
    - Tính toán năng lượng tiêu hao theo thời gian thực (`⚡ Tốn 3 ⚡`, `⚡ Tốn 5 ⚡`, `⚡ Tốn 10 ⚡`).
    - Nút gradient hành động với spinner `CircularProgressIndicator` khi đang phân tích video.
    - Banner cảnh báo lỗi màu đỏ nếu xảy ra sự cố mạng hoặc thiếu năng lượng.
  - `GeneratedQuizView`:
    - Header tiêu đề `Bài Tập AI Sinh Ra (X câu)` kèm nút Refresh tạo lại.
    - Danh sách thẻ câu hỏi với format code monospace `\n` rõ ràng.
    - 4 ô lựa chọn A, B, C, D có hiệu ứng border xanh `Colors.blueAccent` khi chọn.
    - Nút chính `Nộp bài & Chấm điểm` nổi bật phía chân bài tập.
  - `WatchScreen`: Tích hợp trực quan bên dưới thanh công cụ video và tự động reset trạng thái Quiz khi đổi sang video khác.

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

### 3.1. Kiểm thử Tự động (Automated Tests)
- **Unit & BLoC Tests:**
  - Bổ sung 7 kịch bản kiểm thử chi tiết cho Phần C trong [learning_test.dart](file:///d:/Coder/hub_el_mobile/test/features/learning/learning_test.dart):
    1. Parse `QuizQuestionModel.fromJson` với các key dữ liệu thô.
    2. Parse `QuizGeneratedModel.fromJson` với danh sách câu hỏi.
    3. `GenerateQuizUseCase` trả về `ApiSuccess` khi tạo thành công.
    4. `GenerateQuizUseCase` trả về `ApiFailure` khi không đủ năng lượng.
    5. `QuizBloc` phát chuỗi state `QuizGenerating` -> `QuizLoaded`.
    6. `QuizBloc` phát `QuizError` khi xảy ra lỗi.
    7. `QuizBloc` cập nhật `userAnswers` khi người dùng chọn đáp án và reset khi gọi `QuizResetRequested`.
- **Kết quả chạy kiểm thử toàn dự án:**
  - **47/47 tests passed (100%)** trên toàn bộ test suite (Authentication, Dashboard, Network, Storage, Learning Module Part A, B, C).
  - **`flutter analyze`:** Hoàn tất trong 5.0 giây với **0 errors, 0 warnings, 0 issues**.

### 3.2. Kiểm thử Tích hợp Trực tiếp trên Android Emulator (`emulator-5554`)
1. **Khởi tạo và tính toán chi phí:**
   - Người dùng `Nguyen Van Emulator` vào video `"Java Full Course for Beginners"` (Mosh Hamedani).
   - Card AI Quiz hiển thị đầy đủ, chọn `3 câu` -> Chi phí cập nhật ngay lập tức thành `⚡ Tốn 3 ⚡`.
2. **Kích hoạt tạo bài tập AI:**
   - Nhấn nút "Tạo bài tập AI", `DioClient` gửi request `POST http://10.0.2.2:3000/api/v1/videos/quiz/generate`.
   - Backend cào thành công phụ đề YouTube 130.531 ký tự.
   - Gemini API 2.5 Flash xử lý trong 16.8 giây và trả về 3 câu hỏi trắc nghiệm chuyên sâu về lập trình Java (sửa lỗi code, biến String trong Java, vòng lặp for).
   - Năng lượng người dùng được khấu trừ chính xác từ 20 -> 17 năng lượng.
3. **Hiển thị & Tương tác:**
   - Ứng dụng render ngay lập tức `GeneratedQuizView`.
   - Người dùng nhấp chọn đáp án A của Câu 1 -> ô đáp án được bao viền xanh neon và huy hiệu A sáng màu chuẩn Design System.
   - Cuộn xuống xem Câu 2, Câu 3 và nút "Nộp bài & Chấm điểm" sẵn sàng.

