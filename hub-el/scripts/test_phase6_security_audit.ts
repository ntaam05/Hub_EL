// scripts/test_phase6_security_audit.ts
import { prisma } from "../src/lib/prisma";
import crypto from "crypto";
import {
  exchangeResourcesService,
  createMoMoPaymentService,
  checkMoMoPaymentStatusService,
  processMoMoIpnCallbackService,
} from "../src/services/store.service";
import { getAchievementsService } from "../src/services/achievements.service";
import {
  sendSecurityOtpService,
  verifySecurityOtpService,
  resetPasswordWithOtpService,
  changePasswordService,
} from "../src/services/settings.service";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, extraInfo?: any) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`, extraInfo ? `(${extraInfo})` : "");
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}`, extraInfo ? `(${extraInfo})` : "");
    failCount++;
  }
}

async function runSecurityAuditTests() {
  console.log("==================================================");
  console.log("🔒 RUNNING PHASE 6 CRITICAL SECURITY & TRANSACTION AUDIT TESTS");
  console.log("==================================================\n");

  const user = await prisma.user.findFirst({
    where: { email: "hoangtam4472@gmail.com" },
  });

  if (!user) {
    throw new Error("Không tìm thấy user test hoangtam4472@gmail.com");
  }
  const userId = user.id;

  // ==========================================
  // SECTION I: STORE & ECONOMY TRANSACTION AUDIT
  // ==========================================
  console.log("\n--- SECTION I: STORE & ECONOMY TRANSACTION AUDIT ---");

  // Đặt lại số dư premiumCoins về chính xác 100 Ngọc (vừa đủ đúng 1 lần giao dịch GEM_TO_COIN)
  await prisma.user.update({
    where: { id: userId },
    data: { premiumCoins: 100 },
  });

  // 1. Concurrent Exchange Requests: 2 request đồng thời chỉ có 50 Ngọc (Cần 50 Ngọc mỗi giao dịch)
  // Chỉ 1 request được phép thành công, request kia phải bị từ chối
  const [res1, res2] = await Promise.all([
    exchangeResourcesService(userId, "GEM_TO_COIN"),
    exchangeResourcesService(userId, "GEM_TO_COIN"),
  ]);

  const oneSucceeded = (res1.success && !res2.success) || (!res1.success && res2.success);
  assert(oneSucceeded, "Concurrent exchange: Only one transaction succeeds with limited balance");

  // Kiểm tra số dư sau race condition không bao giờ bị âm
  const userAfterRace = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumCoins: true },
  });
  assert((userAfterRace?.premiumCoins || 0) >= 0, "No negative balance after concurrent exchange", userAfterRace?.premiumCoins);

  // 2. Idempotency test: gửi cùng 1 idempotencyKey
  await prisma.user.update({
    where: { id: userId },
    data: { premiumCoins: 100 },
  });
  const idemKey = `IDEM_${Date.now()}_ABC`;
  const idemFirst = await exchangeResourcesService(userId, "GEM_TO_COIN", idemKey);
  assert(idemFirst.success, "First idempotent exchange succeeded");

  const userAfterFirst = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumCoins: true },
  });

  const idemSecond = await exchangeResourcesService(userId, "GEM_TO_COIN", idemKey);
  assert(idemSecond.success, "Second idempotent exchange returned cached success");

  const userAfterSecond = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumCoins: true },
  });
  assert(
    userAfterFirst?.premiumCoins === userAfterSecond?.premiumCoins,
    "Idempotency prevents double deduction of balance",
    `First: ${userAfterFirst?.premiumCoins}, Second: ${userAfterSecond?.premiumCoins}`
  );

  // 3. Client tampering price or quantity rejected
  const fakeExchange = await exchangeResourcesService(userId, "HACK_INFINITE_COINS");
  assert(!fakeExchange.success, "Tampered exchange type rejected properly");

  // ==========================================
  // SECTION II: MOMO PAYMENT SECURITY AUDIT
  // ==========================================
  console.log("\n--- SECTION II: MOMO PAYMENT SECURITY AUDIT ---");

  // 1. Callback with forged/invalid signature rejected
  const fakeCallback = await processMoMoIpnCallbackService({
    partnerCode: "MOMO",
    orderId: "FAKE_ORDER_999",
    requestId: "FAKE_ORDER_999",
    amount: 49000,
    orderInfo: "pay with MoMo",
    orderType: "momo_wallet",
    transId: 123456789,
    resultCode: 0,
    message: "Success",
    payType: "qr",
    responseTime: Date.now(),
    extraData: "",
    signature: "tampered_fake_signature_abc1234567890abcdef",
  });
  assert(!fakeCallback.success, "MoMo forged callback rejected (Invalid Signature)");

  // 2. Tạo đơn hàng MoMo thật trên server
  const testOrder = await createMoMoPaymentService(userId, {
    type: "VIP",
    amount: 49000,
    name: "Gói VIP 1 Tháng",
  });
  assert(testOrder.success && !!testOrder.data?.orderId, "Created MoMo test order on server");
  const orderCode = testOrder.data!.orderId;

  // 3. User Isolation: User khác không thể truy vấn hoặc kích hoạt đơn hàng của người này
  const fakeUserStatusCheck = await checkMoMoPaymentStatusService(orderCode, "other_user_id_xyz");
  assert(!fakeUserStatusCheck.success, "User isolation: User B cannot check/activate User A's order");

  // 4. Client không thể tự gửi check-status để kích hoạt khi chưa có thanh toán thực trên MoMo
  const unverifiedCheck = await checkMoMoPaymentStatusService(orderCode, userId);
  assert(!unverifiedCheck.success, "Unverified MoMo order cannot be activated by client directly");

  // 5. Valid MoMo IPN Callback test (Kích hoạt đơn hàng qua chữ ký hợp lệ)
  const accessKey = "F8BBA842ECF85";
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const partnerCode = "MOMO";
  const amount = "49000";
  const extraData = "";
  const message = "Success";
  const orderInfo = "pay with MoMo";
  const orderType = "momo_wallet";
  const payType = "qr";
  const requestId = orderCode;
  const responseTime = Date.now();
  const resultCode = 0;
  const transId = 987654321;

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderCode}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  const validSignature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

  const validCallback = await processMoMoIpnCallbackService({
    partnerCode,
    orderId: orderCode,
    requestId,
    amount: Number(amount),
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature: validSignature,
  });
  assert(validCallback.success, "Valid MoMo IPN Callback processed successfully");

  // 6. Duplicate Callback must NOT double-credit (Idempotency)
  const userVipAfterFirst = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumExpiresAt: true, isPro: true },
  });
  assert(userVipAfterFirst?.isPro === true, "User marked VIP isPro");

  const duplicateCallback = await processMoMoIpnCallbackService({
    partnerCode,
    orderId: orderCode,
    requestId,
    amount: Number(amount),
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature: validSignature,
  });
  assert(duplicateCallback.success, "Duplicate MoMo callback acknowledged safely");

  const userVipAfterSecond = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumExpiresAt: true },
  });
  assert(
    userVipAfterFirst?.premiumExpiresAt?.getTime() === userVipAfterSecond?.premiumExpiresAt?.getTime(),
    "Duplicate MoMo callback did NOT double extend VIP expiration date"
  );

  // 7. Expired order (>24h) cannot be activated
  const expiredOrder = await prisma.order.create({
    data: {
      orderCode: `EXPIRED_${Date.now()}`,
      userId,
      amount: 49000,
      type: "VIP",
      status: "PENDING",
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    },
  });
  const expiredCheck = await checkMoMoPaymentStatusService(expiredOrder.orderCode, userId);
  assert(!expiredCheck.success, "Expired order (>24h) rejected properly");

  // 8. Canceled/Failed order cannot be activated
  const failedOrder = await prisma.order.create({
    data: {
      orderCode: `FAILED_${Date.now()}`,
      userId,
      amount: 49000,
      type: "VIP",
      status: "FAILED",
    },
  });
  const failedCheck = await checkMoMoPaymentStatusService(failedOrder.orderCode, userId);
  assert(!failedCheck.success, "Failed/canceled order cannot be activated");

  // ==========================================
  // SECTION III: ACHIEVEMENTS REWARD AUDIT
  // ==========================================
  console.log("\n--- SECTION III: ACHIEVEMENTS REWARD AUDIT ---");

  // Concurrent unlock requests: 2 request đồng thời chỉ được trao thưởng 1 lần duy nhất
  const [achRes1, achRes2] = await Promise.all([
    getAchievementsService(userId),
    getAchievementsService(userId),
  ]);
  assert(achRes1.success && achRes2.success, "Concurrent achievement checks both return success");

  // Nếu cả 2 cùng chạy, không thể cả 2 cùng nhận phần thưởng cho cùng một thành tựu
  if (achRes1.data && achRes2.data) {
    const doubleAward = achRes1.data.earnedXP > 0 && achRes2.data.earnedXP > 0;
    assert(!doubleAward, "Concurrent achievements unlock does NOT double award XP");
  }

  // ==========================================
  // SECTION IV: OTP & PASSWORD SECURITY AUDIT
  // ==========================================
  console.log("\n--- SECTION IV: OTP & PASSWORD SECURITY AUDIT ---");

  await prisma.verificationCode.deleteMany({ where: { email: user.email } });

  // 1. Send OTP creates valid code
  const otpRes = await sendSecurityOtpService(user.email);
  assert(otpRes.success, "Send OTP success");

  // 2. Invalidation of old OTP: gửi mã mới sẽ xóa mã cũ
  // Tạm bypass 60s rate limit trong DB bằng cách update createdAt lùi về 61s trước
  await prisma.verificationCode.updateMany({
    where: { email: user.email },
    data: { createdAt: new Date(Date.now() - 65 * 1000) },
  });
  const oldCodeRecord = await prisma.verificationCode.findFirst({
    where: { email: user.email },
  });
  const oldCode = oldCodeRecord?.code;

  const newOtpRes = await sendSecurityOtpService(user.email);
  assert(newOtpRes.success, "New OTP requested successfully");

  // Mã cũ phải không còn tồn tại trong DB
  const oldCodeCheck = await prisma.verificationCode.findFirst({
    where: { email: user.email, code: oldCode },
  });
  assert(!oldCodeCheck, "Old OTP invalidated immediately upon generating new OTP");

  // 3. Anti-brute force: 5 lần nhập sai sẽ khóa và xóa mã OTP
  const currentCodeRecord = await prisma.verificationCode.findFirst({
    where: { email: user.email },
  });
  const currentCode = currentCodeRecord?.code;

  for (let i = 1; i <= 4; i++) {
    const wrongAttempt = await verifySecurityOtpService(user.email, `00000${i}`);
    assert(!wrongAttempt.success, `Wrong OTP attempt ${i} rejected`);
  }
  // Lần thứ 5 sai -> Lockout và xóa mã
  const fifthAttempt = await verifySecurityOtpService(user.email, "000005");
  assert(!fifthAttempt.success, "5th wrong OTP attempt triggers lockout and invalidation");

  // Bây giờ ngay cả nhập đúng mã cũ cũng phải bị từ chối
  if (currentCode) {
    const postLockoutAttempt = await verifySecurityOtpService(user.email, currentCode);
    assert(!postLockoutAttempt.success, "OTP rejected after brute-force lockout threshold");
  }

  // 4. Single-use OTP: Sau khi dùng để reset mật khẩu, OTP bị xóa hoàn toàn
  await prisma.verificationCode.deleteMany({ where: { email: user.email } });
  const freshOtpRes = await sendSecurityOtpService(user.email);
  const singleUseRecord = await prisma.verificationCode.findFirst({
    where: { email: user.email },
  });

  if (singleUseRecord) {
    const resetRes = await resetPasswordWithOtpService(
      user.email,
      singleUseRecord.code,
      "NewSecurePassword123@"
    );
    assert(resetRes.success, "Reset password with valid OTP succeeded", resetRes.error);

    // Thử dùng lại mã đó lần thứ hai
    const reuseRes = await resetPasswordWithOtpService(
      user.email,
      singleUseRecord.code,
      "AnotherPassword456@"
    );
    assert(!reuseRes.success, "Reusing already-consumed OTP rejected (Single-use OTP)");
  } else {
    assert(false, "Reset password with valid OTP succeeded", `Failed to generate OTP: ${freshOtpRes.error}`);
  }

  // 5. Password length check (phải >= 8 ký tự)
  const shortPassRes = await changePasswordService(userId, "oldPass", "short");
  assert(!shortPassRes.success, "Short password (<8 chars) rejected by changePasswordService");

  console.log(`\n==================================================`);
  console.log(`📊 SECURITY AUDIT TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`==================================================\n`);
}

runSecurityAuditTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
