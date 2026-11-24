// scripts/test_settings_backend.ts
import { prisma } from '../src/lib/prisma';
import {
  getUserSettingsProfileService,
  updatePersonalProfileService,
  updateAvatarService,
  getSecurityInfoService,
  sendSecurityOtpService,
  verifySecurityOtpService,
  changePasswordService,
  getPrivacySettingsService,
  updatePrivacySettingsService,
  getNotificationSettingsService,
  updateNotificationSettingsService,
  submitFeedbackService,
} from '../src/services/settings.service';

async function runSettingsTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING SETTINGS & PROFILE BACKEND TESTS');
  console.log('==================================================');

  const userId = 'cmp2zxzh80001vcv44u74w80o'; // Hoàng Nhật Tâm
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${detail}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail}`);
      failCount++;
    }
  }

  // 1. Test Get Profile
  const profile = await getUserSettingsProfileService(userId);
  assert(profile.success, 'Get Settings Profile Success');
  assert(!!profile.data?.email, 'Email present', profile.data?.email);
  assert(Array.isArray(profile.data?.interests), 'Interests parsed as Array');
  assert((profile.data as any)?.password === undefined, 'Password is NOT exposed');

  // 2. Test Update Profile
  const updateRes = await updatePersonalProfileService(userId, {
    bio: 'Kiểm thử cập nhật tiểu sử tự động từ Antigravity Phase 6',
    interests: ['Lập trình', 'Khoa học', 'Tiếng Anh'],
  });
  assert(updateRes.success, 'Update Profile success');

  // 3. Test Username Conflict
  const otherUser = await prisma.user.findFirst({
    where: { id: { not: userId }, username: { not: null } }
  });
  if (otherUser?.username) {
    const conflictRes = await updatePersonalProfileService(userId, {
      username: otherUser.username
    });
    assert(!conflictRes.success, 'Username conflict rejected properly', conflictRes.error);
  }

  // 4. Test Update Avatar
  const avatarRes = await updateAvatarService(userId, 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/1AAA');
  assert(avatarRes.success, 'Update Avatar success');

  // 5. Test Security Info
  const secInfo = await getSecurityInfoService(userId);
  assert(secInfo.success, 'Get Security Info success');
  assert(typeof secInfo.data?.isOAuth === 'boolean', 'isOAuth flag is boolean');

  // 6. Test OTP Generation & Rate Limit
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.email) {
    // Xóa mã OTP cũ để test sạch không vướng rate-limit ban đầu
    await prisma.verificationCode.deleteMany({ where: { email: user.email } });

    const otpRes = await sendSecurityOtpService(user.email);
    assert(otpRes.success, 'Send OTP success');

    // Immediately requesting another OTP should trigger rate limit
    const spamOtp = await sendSecurityOtpService(user.email);
    assert(!spamOtp.success, 'Rate-limit triggers within 60s for OTP', spamOtp.error);

    // Verify OTP with latest code in DB
    const latestCode = await prisma.verificationCode.findFirst({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' }
    });
    if (latestCode) {
      const verifyRes = await verifySecurityOtpService(user.email, latestCode.code);
      assert(verifyRes.success, 'Verify valid OTP code success');

      const verifyBad = await verifySecurityOtpService(user.email, '999999');
      assert(!verifyBad.success, 'Verify invalid OTP rejected properly');
    }
  }

  // 7. Test Privacy Settings
  const privRes = await getPrivacySettingsService(userId);
  assert(privRes.success, 'Get Privacy Settings success');
  assert(typeof privRes.data?.showOnline === 'boolean', 'showOnline flag exists');

  const updatePriv = await updatePrivacySettingsService(userId, {
    showOnline: true,
    onlineScope: 'everyone',
    publicProfile: true,
    profileScope: 'friends',
  });
  assert(updatePriv.success, 'Update Privacy Settings success');

  // 8. Test Notification Settings
  const notifRes = await getNotificationSettingsService(userId);
  assert(notifRes.success, 'Get Notification Settings success');

  const updateNotif = await updateNotificationSettingsService(userId, {
    allowEmail: true,
    energy: true,
    friendReq: true,
    streak: true,
    wikiShare: false,
  });
  assert(updateNotif.success, 'Update Notification Settings success');

  // 9. Test Submit Feedback
  const fbRes = await submitFeedbackService(userId, 'Hoàng Nhật Tâm', 'Hệ thống học tập Hub-EL rất xuất sắc!');
  assert(fbRes.success, 'Submit Feedback success');

  const emptyFb = await submitFeedbackService(userId, 'Hoàng Nhật Tâm', '   ');
  assert(!emptyFb.success, 'Empty Feedback rejected properly');

  console.log(`\n📊 SETTINGS TESTS RESULT: ${passCount} PASSED, ${failCount} FAILED\n`);
}

runSettingsTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
