import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/settings/domain/entities/settings_entities.dart';
import 'package:hub_el_mobile/features/settings/domain/repositories/settings_repository.dart';
import 'package:hub_el_mobile/features/settings/domain/usecases/settings_usecases.dart';
import 'package:hub_el_mobile/features/settings/presentation/cubit/settings_cubit.dart';
import 'package:hub_el_mobile/features/settings/presentation/screens/security_screen.dart';
import 'package:hub_el_mobile/features/settings/presentation/screens/privacy_settings_screen.dart';
import 'package:hub_el_mobile/features/settings/presentation/screens/notification_settings_screen.dart';
import 'package:hub_el_mobile/features/settings/presentation/screens/feedback_screen.dart';

class MockSettingsRepoForWidgets implements SettingsRepository {
  @override
  Future<ApiResult<SecurityInfoEntity>> getSecurityInfo() async {
    return const ApiSuccess(
      SecurityInfoEntity(isOAuth: false, email: 'tam@hub-el.com', hasPassword: true),
    );
  }

  @override
  Future<ApiResult<String>> sendOtp() async => const ApiSuccess('OTP Sent');

  @override
  Future<ApiResult<String>> verifyOtp(String code) async => const ApiSuccess('OTP Verified');

  @override
  Future<ApiResult<String>> changePassword(String o, String n) async =>
      const ApiSuccess('Password Changed');

  @override
  Future<ApiResult<String>> resetPassword(String c, String n) async =>
      const ApiSuccess('Password Reset');

  @override
  Future<ApiResult<PrivacySettingsEntity>> getPrivacySettings() async {
    return const ApiSuccess(PrivacySettingsEntity(showOnline: true));
  }

  @override
  Future<ApiResult<String>> updatePrivacySettings(PrivacySettingsEntity s) async =>
      const ApiSuccess('Privacy Updated');

  @override
  Future<ApiResult<NotificationSettingsEntity>> getNotificationSettings() async {
    return const ApiSuccess(NotificationSettingsEntity(allowEmail: true));
  }

  @override
  Future<ApiResult<String>> updateNotificationSettings(NotificationSettingsEntity s) async =>
      const ApiSuccess('Notif Updated');

  @override
  Future<ApiResult<String>> submitFeedback(String c, {String? category}) async =>
      const ApiSuccess('Feedback Submitted');

  @override
  Future<ApiResult<String>> deleteAccount() async => const ApiSuccess('Account Deleted');

  @override
  Future<ApiResult<List<String>>> getInterestTags() async =>
      const ApiSuccess(['Tiếng Anh', 'Lập trình web']);
}

void main() {
  late SettingsCubit cubit;

  setUp(() {
    final repo = MockSettingsRepoForWidgets();
    cubit = SettingsCubit(
      getSecurityInfoUseCase: GetSecurityInfoUseCase(repo),
      sendSecurityOtpUseCase: SendSecurityOtpUseCase(repo),
      verifySecurityOtpUseCase: VerifySecurityOtpUseCase(repo),
      changePasswordUseCase: ChangePasswordUseCase(repo),
      resetPasswordWithOtpUseCase: ResetPasswordWithOtpUseCase(repo),
      getPrivacySettingsUseCase: GetPrivacySettingsUseCase(repo),
      updatePrivacySettingsUseCase: UpdatePrivacySettingsUseCase(repo),
      getNotificationSettingsUseCase: GetNotificationSettingsUseCase(repo),
      updateNotificationSettingsUseCase: UpdateNotificationSettingsUseCase(repo),
      submitFeedbackUseCase: SubmitFeedbackUseCase(repo),
    );
  });

  tearDown(() {
    cubit.close();
  });

  testWidgets('SecurityScreen renders change password tabs and form', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<SettingsCubit>.value(
          value: cubit,
          child: const SecurityScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Bảo Mật & Mật Khẩu'), findsOneWidget);
    expect(find.text('Đổi Mật Khẩu'), findsOneWidget);
    expect(find.text('Đặt Lại Bằng OTP'), findsOneWidget);
    expect(find.text('Mật khẩu hiện tại'), findsOneWidget);
    expect(find.text('Lưu Mật Khẩu Mới'), findsOneWidget);
  });

  testWidgets('PrivacySettingsScreen renders privacy switches', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<SettingsCubit>.value(
          value: cubit,
          child: const PrivacySettingsScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Quyền Riêng Tư'), findsOneWidget);
    expect(find.text('Hiển thị trạng thái Online'), findsOneWidget);
    expect(find.text('Cho phép nhận lời mời kết bạn'), findsOneWidget);
    expect(find.text('Hồ sơ công khai'), findsOneWidget);
    expect(find.text('Lưu Quyền Riêng Tư'), findsOneWidget);
  });

  testWidgets('NotificationSettingsScreen renders email notifications options', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<SettingsCubit>.value(
          value: cubit,
          child: const NotificationSettingsScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Cài Đặt Thông Báo'), findsOneWidget);
    expect(find.text('Nhận thông báo qua Email'), findsOneWidget);
    expect(find.text('Năng lượng AI đã nạp đầy'), findsOneWidget);
    expect(find.text('Cảnh báo sắp mất chuỗi học tập'), findsOneWidget);
    expect(find.text('Lưu Cài Đặt Thông Báo'), findsOneWidget);
  });

  testWidgets('FeedbackScreen renders category chips and feedback form', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<SettingsCubit>.value(
          value: cubit,
          child: const FeedbackScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Góp Ý & Báo Lỗi'), findsOneWidget);
    expect(find.text('Góp ý tính năng'), findsOneWidget);
    expect(find.text('Báo lỗi hệ thống'), findsOneWidget);
    expect(find.text('Gửi Phản Hồi'), findsOneWidget);
  });
}

