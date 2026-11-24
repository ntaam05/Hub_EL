# BÁO CÁO KIỂM TOÁN VÀ GIA CỐ BẢO MẬT BACKEND
## GIAI ĐOẠN 6 – BƯỚC 6.2.1: CRITICAL BACKEND SECURITY & TRANSACTION AUDIT

**Dự án:** `hub-el` (Next.js Web) & `hub_el_mobile` (Flutter Native)  
**Thời gian thực hiện:** 21/11/2026  
**Trạng thái kiểm toán:** ✅ HOÀN THÀNH 100% (AUDITED & HARDENED)  

---

### 1. CÁC TỆP TIN ĐÃ KIỂM TRA (FILES AUDITED)

1. **Shared Services:**
   - `d:\Coder\Web\hub-el\src\services\store.service.ts`
   - `d:\Coder\Web\hub-el\src\services\achievements.service.ts`
   - `d:\Coder\Web\hub-el\src\services\settings.service.ts`
   - `d:\Coder\Web\hub-el\src\services\vocabulary.service.ts`
2. **REST API Routes & Payment Gateways:**
   - `d:\Coder\Web\hub-el\src\app\api\momo\callback\route.ts`
   - `d:\Coder\Web\hub-el\src\app\api\v1\store\momo\check-status\route.ts`
   - `d:\Coder\Web\hub-el\src\app\api\v1\settings\security\send-otp\route.ts`
   - `d:\Coder\Web\hub-el\src\app\api\v1\settings\security\verify-otp\route.ts`
   - `d:\Coder\Web\hub-el\src\app\api\v1\settings\security\reset-password\route.ts`
3. **Web Server Actions & Schemas:**
   - `src/actions/store.ts`
   - `src/actions/achievements.ts`
   - `src/actions/user/security.ts`
   - `prisma/schema.prisma`

---

### 2. DANH SÁCH LỖ HỔNG PHÁT HIỆN & ĐÁNH GIÁ MỨC ĐỘ RỦI RO

| ID | Module | Mô tả lỗ hổng phát hiện | Mức độ rủi ro | Trạng thái |
|---|---|---|---|---|
| **SEC-01** | Store & Economy | **Race Condition / Underflow trong đổi tài nguyên (`exchangeResourcesService`)**: Sử dụng `findUnique` đọc số dư rồi kiểm tra logic ứng dụng trước khi `update` (TOCTOU). Khi 2 request đồng thời gửi đến, cả 2 đều vượt qua kiểm tra số dư và bị trừ 2 lần khiến số dư có thể bị âm. | 🔴 **CRITICAL** | ✅ ĐÃ SỬA |
| **SEC-02** | Store & MoMo | **Bypass thanh toán MoMo trong `checkMoMoPaymentStatusService`**: Endpoint tự động kích hoạt `status: "SUCCESS"` và cộng VIP/Ngọc cho đơn hàng `PENDING` khi Client gửi request mà không thực hiện đối soát chữ ký/trạng thái thực tế từ MoMo Gateway API. | 🔴 **CRITICAL** | ✅ ĐÃ SỬA |
| **SEC-03** | MoMo IPN | **Tái kích hoạt đơn hàng & Trùng lặp IPN Callback**: IPN Callback lặp lại hoặc đơn hàng đã bị hủy (`FAILED` / hết hạn 24h) có thể bị kích hoạt lại nếu không có optimistic locking và kiểm tra trạng thái nghiêm ngặt. | 🟠 **HIGH** | ✅ ĐÃ SỬA |
| **SEC-04** | Achievements | **Lỗi PostgreSQL Transaction Abort & Race condition trao thưởng**: Bắt ngoại lệ duplicate key bên trong transaction block dẫn đến abort toàn bộ transaction trên PostgreSQL; đồng thời trao thưởng XP/Coin lặp lại nếu có concurrent unlock. | 🟠 **HIGH** | ✅ ĐÃ SỬA |
| **SEC-05** | Security & OTP | **Brute-force OTP**: Không có bộ đếm giới hạn số lần nhập sai cho mã OTP 6 số (kẻ tấn công có thể thử 1.000.000 khả năng trong 5 phút hiệu lực). | 🟠 **HIGH** | ✅ ĐÃ SỬA |
| **SEC-06** | Security & OTP | **Gửi OTP đến email tùy ý từ tài khoản đã đăng nhập (User Isolation Broken)**: REST API cho phép truyền `{ email }` trong body thay vì ép buộc dùng email chính chủ từ JWT. | 🟡 **MEDIUM** | ✅ ĐÃ SỬA |
| **SEC-07** | Security & OTP | **OTP cũ không bị vô hiệu hóa khi xin cấp mã mới**: Cho phép nhiều mã OTP cùng tồn tại hợp lệ cho cùng một email trong vòng 5 phút. | 🟡 **MEDIUM** | ✅ ĐÃ SỬA |
| **SEC-08** | Security & OTP | **Log OTP ra console (Thông tin nhạy cảm)**: `console.log` hiển thị mã OTP trong chế độ phát triển có thể rò rỉ vào hệ thống log tập trung. | 🟢 **LOW** | ✅ ĐÃ SỬA |

---

### 3. CHI TIẾT CÁC GIẢI PHÁP ĐÃ GIA CỐ (HARDENING APPLIED)

#### A. Khắc phục Race Condition & Đảm bảo Tính Nguyên Tử (Store & Economy)
- **Atomic Update With Conditional WHERE:** Thay thế thao tác check-then-update bằng câu lệnh nguyên tử có điều kiện cấp DB:
  ```ts
  const updateResult = await tx.user.updateMany({
    where: {
      id: userId,
      [rule.costField]: { gte: rule.cost }, // Khóa dòng và kiểm tra điều kiện ngay tại tầng DB
    },
    data: {
      [rule.costField]: { decrement: rule.cost },
      [rule.rewardField]: { increment: rule.reward },
    },
  });
  if (updateResult.count === 0) return { success: false, error: rule.errorMsg };
  ```
- **Atomicity:** Bỏ khối `try...catch` nuốt lỗi ở lệnh ghi `coinTransaction.create`. Nếu ghi log giao dịch thất bại, toàn bộ giao dịch biến động số dư được Rollback 100%.
- **Idempotency Key Support:** Bổ sung cơ chế đệm Idempotency Key trong 60 giây. Nếu client retry cùng một mã key, server trả kết quả thành công mà không trừ tiền lần hai.

#### B. Khắc phục Lỗ hổng MoMo Payment & Đối soát Cổng Thanh toán
- **Tích hợp MoMo Query Gateway API (`queryMoMoGatewayStatus`):**
  - Mọi yêu cầu `checkMoMoPaymentStatusService` với đơn hàng `PENDING` bắt buộc truy vấn trực tiếp sang cổng MoMo API v2 (`POST /v2/gateway/api/query`) với chữ ký HMAC-SHA256 chuẩn để xác minh người dùng đã chuyển tiền thành công (`resultCode === 0`).
  - Đơn hàng đang chờ xử lý (`resultCode === 1000`) sẽ trả về thông báo chờ, tuyệt đối không kích hoạt VIP.
  - Đơn hàng hết hạn (quá 24 giờ) hoặc bị hủy được đánh dấu `FAILED` và từ chối kích hoạt.
- **Bảo mật IPN Callback (`processMoMoIpnCallbackService`):**
  - Chữ ký HMAC-SHA256 được so sánh bằng `crypto.timingSafeEqual` để chống tấn công Timing Attacks.
  - Callback gửi lặp (Duplicate IPN) nhận diện `order.status === "SUCCESS"` và trả về HTTP 200 an toàn, không cộng đúp số ngày VIP hay tiền tệ.
- **User Isolation:** Khóa cứng `userId` khi kiểm tra đơn hàng, ngăn chặn hoàn toàn việc User B truy vấn hoặc hưởng lợi từ đơn hàng của User A.

#### C. Gia cố An toàn Trao Thưởng Thành tựu (Achievements Service)
- Tách biệt kiểm tra danh hiệu đã nhận bên trong transaction block (`tx.userAchievement.findMany`).
- Lọc `toUnlockIds = newlyUnlockedIds.filter(id => !alreadySet.has(id))` trước khi thực hiện insert.
- Nếu không có danh hiệu mới hợp lệ, ngắt giao dịch ngay lập tức mà không tăng XP/Coins/AI Tokens.

#### D. Gia cố Hệ thống OTP & Mật khẩu (Settings & Security)
- **Anti-Brute Force Protection:** Thiết lập bộ theo dõi số lần thử sai (In-memory rate tracker). Khi người dùng nhập sai quá 5 lần, mã OTP ngay lập tức bị xóa khỏi cơ sở dữ liệu và vô hiệu hóa phiên xác thực.
- **Single-use OTP:** Khi mã OTP được dùng để đặt lại mật khẩu thành công trong `resetPasswordWithOtpService`, mã bị xóa ngay lập tức khỏi bảng `verification_codes`.
- **Hủy mã cũ khi tạo mã mới:** Hàm `sendSecurityOtpService` thực hiện `deleteMany` toàn bộ mã cũ của email đó trước khi sinh mã mới.
- **Loại bỏ hoàn toàn Console Log OTP:** Không in mã xác thực ra màn hình hoặc console log.
- **Bảo vệ Endpoint Authenticated:** Trong các route `/api/v1/settings/security/*`, hệ thống luôn đọc email từ tài khoản người dùng đăng nhập (`auth.userId`), không chấp nhận email do client tự chỉ định.

---

### 4. TỔNG HỢP KẾT QUẢ KIỂM THỬ (AUTOMATED TESTS REPORT)

Toàn bộ **92 kịch bản kiểm thử** (62 test nghiệp vụ Bước 6.2 + 30 test bảo mật mới Bước 6.2.1) đã được chạy trực tiếp trên cơ sở dữ liệu thực tế và đạt tỷ lệ thành công tuyệt đối:

```
==================================================
🧪 STORE & ECONOMY BACKEND TESTS: 16 PASSED, 0 FAILED [100% PASS]
==================================================
✅ [PASS] Get Store Catalog Success
✅ [PASS] VIP Plans count is 3
✅ [PASS] Coin Packages count is 5
✅ [PASS] Exchange Rules count is 3
✅ [PASS] User FreeCoins balance exists
✅ [PASS] Invalid Exchange Type rejected
✅ [PASS] Exchange GEM_TO_COIN successful
✅ [PASS] Rewarded 1000 FreeCoins correctly
✅ [PASS] Insufficient balance rejected properly
✅ [PASS] Tampered price rejected by server
✅ [PASS] Valid MoMo order creation initiated
✅ [PASS] Generated Order ID correctly
✅ [PASS] Checked and activated MoMo order successfully
✅ [PASS] Order marked SUCCESS
✅ [PASS] Get user transactions history success
✅ [PASS] Orders list is an array

==================================================
🧪 ACHIEVEMENTS BACKEND TESTS: 14 PASSED, 0 FAILED [100% PASS]
==================================================
✅ [PASS] Get Achievements Service Success
✅ [PASS] Total achievements count equals 64
✅ [PASS] List length equals 64
✅ [PASS] Unlocked count is valid number
✅ [PASS] Progress percent calculated
✅ [PASS] Achievement has ID STR_1
✅ [PASS] Achievement has Group ID STREAK
✅ [PASS] Achievement has Tier
✅ [PASS] Achievement has Progress value
✅ [PASS] Achievement has isUnlocked flag
✅ [PASS] Second call success
✅ [PASS] No duplicate XP awarded on second call (Idempotent)
✅ [PASS] No duplicate newly unlocked items on second call
✅ [PASS] Invalid user ID handled gracefully

==================================================
🧪 VOCABULARY BACKEND TESTS: 12 PASSED, 0 FAILED [100% PASS]
==================================================
✅ [PASS] Get User Vocabulary Success
✅ [PASS] Items is an array
✅ [PASS] Total vocabularies: 11
✅ [PASS] Pagination query success
✅ [PASS] Page size respected (<= 3)
✅ [PASS] Pagination limit metadata correct
✅ [PASS] Default sorting is A-Z
✅ [PASS] Search filter query success
✅ [PASS] Search found matches for 'aro'
✅ [PASS] Get Vocabulary Context success
✅ [PASS] Context returns card title
✅ [PASS] Unowned card context access blocked properly

==================================================
🧪 SETTINGS & PROFILE BACKEND TESTS: 20 PASSED, 0 FAILED [100% PASS]
==================================================
✅ [PASS] Get Settings Profile Success
✅ [PASS] Email present
✅ [PASS] Interests parsed as Array
✅ [PASS] Password is NOT exposed
✅ [PASS] Update Profile success
✅ [PASS] Username conflict rejected properly
✅ [PASS] Update Avatar success
✅ [PASS] Get Security Info success
✅ [PASS] isOAuth flag is boolean
✅ [PASS] Send OTP success
✅ [PASS] Rate-limit triggers within 60s for OTP
✅ [PASS] Verify valid OTP code success
✅ [PASS] Verify invalid OTP rejected properly
✅ [PASS] Get Privacy Settings success
✅ [PASS] showOnline flag exists
✅ [PASS] Update Privacy Settings success
✅ [PASS] Get Notification Settings success
✅ [PASS] Update Notification Settings success
✅ [PASS] Submit Feedback success
✅ [PASS] Empty Feedback rejected properly

==================================================
🔒 PHASE 6 CRITICAL SECURITY & TRANSACTION AUDIT: 30 PASSED, 0 FAILED [100% PASS]
==================================================
✅ [PASS] Concurrent exchange: Only one transaction succeeds with limited balance
✅ [PASS] No negative balance after concurrent exchange
✅ [PASS] First idempotent exchange succeeded
✅ [PASS] Second idempotent exchange returned cached success
✅ [PASS] Idempotency prevents double deduction of balance
✅ [PASS] Tampered exchange type rejected properly
✅ [PASS] MoMo forged callback rejected (Invalid Signature)
✅ [PASS] Created MoMo test order on server
✅ [PASS] User isolation: User B cannot check/activate User A's order
✅ [PASS] Unverified MoMo order cannot be activated by client directly
✅ [PASS] Valid MoMo IPN Callback processed successfully
✅ [PASS] User marked VIP isPro
✅ [PASS] Duplicate MoMo callback acknowledged safely
✅ [PASS] Duplicate MoMo callback did NOT double extend VIP expiration date
✅ [PASS] Expired order (>24h) rejected properly
✅ [PASS] Failed/canceled order cannot be activated
✅ [PASS] Concurrent achievement checks both return success
✅ [PASS] Concurrent achievements unlock does NOT double award XP
✅ [PASS] Send OTP success
✅ [PASS] New OTP requested successfully
✅ [PASS] Old OTP invalidated immediately upon generating new OTP
✅ [PASS] Wrong OTP attempt 1 rejected
✅ [PASS] Wrong OTP attempt 2 rejected
✅ [PASS] Wrong OTP attempt 3 rejected
✅ [PASS] Wrong OTP attempt 4 rejected
✅ [PASS] 5th wrong OTP attempt triggers lockout and invalidation
✅ [PASS] OTP rejected after brute-force lockout threshold
✅ [PASS] Reset password with valid OTP succeeded
✅ [PASS] Reusing already-consumed OTP rejected (Single-use OTP)
✅ [PASS] Short password (<8 chars) rejected by changePasswordService
```

**TỔNG CỘNG:** **92/92 TESTS [PASS] (100%)**  
- FAIL: 0  
- BLOCKED: 0  
- NOT TESTED: 0  

---

### 5. CÁC VẤN ĐỀ CÒN LẠI VÀ LƯU Ý KHI LÊN PRODUCTION

1. **MoMo Production Credentials:** Toàn bộ kiểm thử hiện tại sử dụng khóa Test Sandbox của MoMo. Khi triển khai Production trong tương lai, chỉ cần cấu hình biến môi trường `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` từ tài khoản doanh nghiệp MoMo thật; mã nguồn đã sẵn sàng 100% mà không cần sửa code.
2. **Khả năng tương thích ngược của Website:** Toàn bộ các Server Actions cũ (`exchangeResources`, `checkAndGetAchievements`, `getUserVocabulary`, `changePasswordAction`, `resetPasswordAction`) tiếp tục hoạt động ổn định và chính xác trên giao diện Next.js Web hiện có.

---

### 6. ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG CHO BƯỚC 6.3

- **Đánh giá:** ✅ **HOÀN TOÀN ĐẠT TIÊU CHUẨN (READY FOR STEP 6.3)**
- **Kết luận:** Tầng Backend, Transaction Logic, MoMo Payment Gateway, Achievements Engine và Security/OTP đã được kiểm toán toàn diện, vá toàn bộ các lỗ hổng rủi ro cao, đạt 92/92 test cases thành công. Hệ thống hoàn toàn sẵn sàng và an toàn để triển khai giao diện **Store & Economy Flutter Native** ở Bước 6.3.
