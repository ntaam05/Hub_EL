# MOBILE DATA FLOW & LIFECYCLE SPECIFICATION - HUB-EL

> **Tài liệu đặc tả toàn diện Luồng Dữ Liệu (Data Flow) xuyên suốt các tầng kiến trúc trong ứng dụng Flutter Mobile**  
> Định hướng tích hợp mượt mà giữa Presentation Layer, BLoC, Domain, Data và Backend API.

---

## 1. Chu Trình Luân Chuyển Dữ Liệu Chuẩn (Standard Unidirectional Data Flow)

Trong `hub_el_mobile`, dữ liệu luôn luân chuyển theo một chiều duy nhất (Unidirectional Data Flow - UDF):

```
┌─────────────────┐       Tương tác (Tap, Input)       ┌─────────────────┐
│                 ├───────────────────────────────────►│                 │
│  UI Presentation│                                    │  BLoC / Cubit   │
│  (Screen/Widget)│◄───────────────────────────────────┤                 │
└─────────────────┘        State Update (Rebuild)      └────────┬────────┘
                                                                │
                                                  Thực thi      │ Gọi UseCase
                                                                ▼
┌─────────────────┐        ApiResult<Entity>           ┌─────────────────┐
│                 ├───────────────────────────────────►│                 │
│ Repository Impl │                                    │ Domain UseCase  │
│                 │◄───────────────────────────────────┤                 │
└────────┬────────┘        Truy vấn nghiệp vụ          └─────────────────┘
         │
         ├─────────────────────────────────┐
         │ Gọi Remote API                  │ Đọc/Ghi Bộ Nhớ
         ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐
│ Remote DataSrc  │               │ Local DataSrc   │
│ (Dio / Socket)  │               │ (SecureStorage) │
└─────────────────┘               └─────────────────┘
```

---

## 2. Chi Tiết Các Kịch Bản Luồng Dữ Liệu Cốt Lõi (Core Scenario Flows)

### Kịch Bản 1: Tải Trang Chủ Dashboard & Đồng Bộ Nhiệm Vụ Ngày

```mermaid
sequenceDiagram
    autonumber
    actor User as Học Viên
    participant Screen as DashboardScreen
    participant Bloc as DashboardBloc
    participant UseCase as GetDashboardDataUseCase
    participant Repo as DashboardRepository
    participant API as DioClient (/api/v1/dashboard/*)

    User->>Screen: Mở App / Chuyển sang Tab Tổng quan
    Screen->>Bloc: add(DashboardStartedEvent())
    Note over Bloc: State: DashboardLoading()
    Bloc->>Screen: Hiển thị Shimmer Skeleton Loading

    Bloc->>UseCase: execute()
    par Tải song song Chỉ số & Nhiệm vụ
        UseCase->>Repo: getFreshUserStats()
        Repo->>API: GET /api/v1/dashboard/stats
        API-->>Repo: 200 OK { level, xp, streak, energy, coins, isPro }
    and
        UseCase->>Repo: getDailyTasks()
        Repo->>API: GET /api/v1/dashboard/tasks
        API-->>Repo: 200 OK [ TaskList ]
    end

    Repo-->>UseCase: Trả về DashboardCompositeData
    UseCase-->>Bloc: Trả về ApiSuccess(data)
    
    Note over Bloc: State: DashboardLoaded(userStats, dailyTasks)
    Bloc->>Screen: Render Header Pills, Thanh Cấp độ XP và Danh sách Nhiệm vụ
```

---

### Kịch Bản 2: Xem Video YouTube & Tạm Dừng Hiện Popup Quiz AI

```mermaid
sequenceDiagram
    autonumber
    actor User as Học Viên
    participant Screen as WatchScreen
    participant Player as YoutubePlayerController
    participant Bloc as VideoQuizBloc
    participant API as Backend (/api/v1/video/*)

    User->>Screen: Chọn Video bài học -> Bắt đầu phát
    Screen->>Bloc: add(LoadVideoQuizEvent(videoId))
    Bloc->>API: POST /api/v1/video/quiz/generate { videoId, count: 5 }
    API-->>Bloc: 200 OK [ QuizList với triggerAtSecond: 120, 300... ]
    Bloc->>Screen: Gắn bộ lắng nghe thời gian phát của Video

    loop Lắng nghe từng giây phát (Player Listener)
        Player->>Screen: player.currentPosition
        alt Video chạm mốc triggerAtSecond (VD: 120s)
            Screen->>Player: player.pause() (Tạm dừng phát video)
            Screen->>Screen: Trượt Popup Quiz lên đè màn hình (Overlay)
            Screen->>User: Rung nhẹ máy (HapticFeedback.mediumImpact())
        end
    end

    User->>Screen: Chọn đáp án A -> Bấm "Xác nhận câu trả lời"
    Screen->>Screen: Đổi màu viền Xanh (Đúng) hoặc Đỏ (Sai) kèm giải thích AI
    
    User->>Screen: Bấm "Tiếp tục bài học"
    Screen->>Screen: Đóng Popup Quiz
    Screen->>Player: player.play() (Video tiếp tục chạy)

    Screen->>API: POST /api/v1/video/progress { videoId, lastWatchedSeconds: 125 }
```

---

### Kịch Bản 3: Sinh Bài Đọc Wiki AI Thích Ứng & Thức Tỉnh Sao

```mermaid
sequenceDiagram
    autonumber
    actor User as Học Viên
    participant Screen as StudyReaderScreen
    participant Bloc as WikiStudyBloc
    participant API as Backend (/api/v1/wiki/*)

    User->>Screen: Mở Thẻ Wiki -> Cấu hình học (Trình độ B1, 250 từ, 5 câu hỏi)
    User->>Screen: Bấm "Bắt đầu học ngay"
    Screen->>Bloc: add(GenerateLessonEvent(cardId, config))
    Note over Bloc: State: WikiGeneratingLesson() (Hiệu ứng con quay sách lật)
    
    Bloc->>API: POST /api/v1/wiki/cards/:id/generate-lesson { config }
    API-->>Bloc: 200 OK { simplifiedText, vocabularies, quizzes, energyCost: 7 }
    Note over Bloc: State: WikiLessonReady(...)
    Bloc->>Screen: Hiển thị bài đọc song ngữ & Danh mục từ vựng mới

    User->>Screen: Đọc xong đoạn văn -> Bắt đầu làm 5 câu trắc nghiệm
    User->>Screen: Hoàn thành bài thi (Đúng 4/5 câu -> ĐẬU)
    Screen->>Bloc: add(SubmitWikiQuizEvent(cardId, correct: 4, isPass: true))

    Bloc->>API: POST /api/v1/wiki/cards/:id/submit-quiz { isPass: true }
    API-->>Bloc: 200 OK { expGained: 40, gainedCoins: 10, newAwakenedStars: 3 }
    
    Note over Bloc: State: WikiQuizPassed(...)
    Bloc->>Screen: Bung pháo hoa Confetti + Ngôi sao thứ 3 bừng sáng lấp lánh
    Bloc->>Screen: Header Pill cập nhật: +10 Xu, +40 XP
```

---

### Kịch Bản 4: Quay Vòng Gacha, Kiểm Tra Pity & Tái Chế Thẻ Trùng

```mermaid
sequenceDiagram
    autonumber
    actor User as Học Viên
    participant Screen as GachaScreen
    participant Bloc as GachaBloc
    participant API as Backend (/api/v1/gacha/roll)

    User->>Screen: Bấm nút "Quay 1 lần (100 Xu)"
    Screen->>Bloc: add(RollGachaPressedEvent())
    Note over Bloc: State: GachaRolling()
    Bloc->>Screen: Kích hoạt hiệu ứng Vòng tròn ma thuật xoay & âm thanh

    Bloc->>API: POST /api/v1/gacha/roll
    API-->>Bloc: 200 OK { card: { title: "Cơ Học Lượng Tử", rarity: "UR" }, isDuplicate: true, stardustGained: 600 }

    Note over Bloc: State: GachaResult(card, isDuplicate, stardustGained)
    Bloc->>Screen: Nổ hiệu ứng ánh sáng màu Hồng Tím (Độ hiếm UR)
    Bloc->>Screen: Rung mạnh điện thoại (HapticFeedback.heavyImpact())
    Bloc->>Screen: Hiện thông báo: "Trùng thẻ! Tự động chuyển thành +600 Bụi Sao"
    Bloc->>Screen: Cập nhật số Xu còn lại và số Bụi sao trên UI
```

---

### Kịch Bản 5: Nhắn Tin Thời Gian Thực & Vòng Đời Kết Nối Socket.io

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Học Viên A (App)
    participant Socket as SocketClient (socket_io_client)
    participant Server as Socket.io Server (Node.js)
    actor Bob as Học Viên B (App)

    Note over Alice, Socket: Khi mở App (Foreground / Resume)
    Alice->>Socket: socket.connect()
    Socket->>Server: Gửi gói tin bắt tay WebSocket
    Server-->>Socket: onConnect
    Socket->>Server: emit('join_room', userIdAlice)

    Note over Alice, Bob: Gửi Tin Nhắn Chat
    Alice->>Socket: emit('send_message', { receiverId: userIdBob, message: msgData })
    Server->>Bob: to(userIdBob).emit('receive_message', msgData)
    Bob-->>Bob: Rung thông báo & hiển thị tin nhắn mới ngay trên màn hình chat

    Note over Alice, Socket: Khi người dùng chuyển App chạy ngầm (AppLifecycleState.paused)
    Alice->>Socket: socket.disconnect() (Chủ động ngắt WebSocket tiết kiệm pin)
```

---

### Kịch Bản 6: Thanh Toán MoMo In-App Deep Link & Polling

```mermaid
sequenceDiagram
    autonumber
    actor User as Học Viên
    participant App as Flutter Mobile
    participant Launcher as UrlLauncher
    participant MoMoApp as Ứng Dụng MoMo
    participant API as Backend Next.js (/api/momo/*)

    User->>App: Mở Cửa Hàng -> Chọn "Gói VIP 1 Tháng (49k)" -> Bấm Mua
    App->>API: POST /api/momo/create { type: "VIP", amount: 49000 }
    API-->>App: 200 OK { payUrl: "https://test-payment.momo.vn/...", orderId: "HUBEL_1714800000" }

    App->>Launcher: canLaunchUrl("momo://...")
    alt Máy Đã Cài Ứng Dụng MoMo
        App->>Launcher: launchUrl("momo://app?action=pay&...", mode: externalApplication)
        Launcher->>MoMoApp: Mở App MoMo lên màn hình thanh toán
        User->>MoMoApp: Xác thực vân tay / PIN thanh toán 49,000 đ
        MoMoApp-->>User: Thanh toán thành công
        MoMoApp->>App: Điều hướng về App qua Deep Link hubel://payment-callback
    else Máy Chưa Cài App MoMo
        App->>Launcher: Mở payUrl trong InAppWebView
        User->>App: Nhập thẻ / quét mã QR trong WebView
    end

    Note over App: App quay lại màn hình chính (Foreground)
    App->>API: POST /api/momo/check-status { orderId: "HUBEL_1714800000" }
    API-->>App: 200 OK { success: true }
    App->>App: Cập nhật Header Pill: Hiện Tag PRO vàng kim + Tặng 2 Thẻ Đóng Băng
    App-->>User: Bung CustomDialog chúc mừng kích hoạt VIP thành công!
```

---

## 3. Quản Lý Lỗi & Truyền Dẫn Lỗi (Error Propagation Pipeline)

Khi gặp sự cố mạng hoặc lỗi nghiệp vụ, lỗi được đóng gói và hiển thị theo quy tắc:

```
[Mạng Chập Chờn / Quá Giờ 15s]
        ▼
DioException (connectTimeout)
        ▼
ErrorInterceptor bóc tách thành NetworkException
        ▼
Repository trả về: ApiFailure(message: "Không thể kết nối máy chủ...")
        ▼
Bloc phát State: FeatureFailure(message)
        ▼
UI hiển thị: ErrorStateWidget (màn hình đầy đủ) HOẶC Toastification / SnackBar (hành động nhanh)
```

