import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/profile/domain/entities/user_profile_entity.dart';
import 'package:hub_el_mobile/features/profile/domain/repositories/profile_repository.dart';
import 'package:hub_el_mobile/features/profile/domain/usecases/profile_usecases.dart';
import 'package:hub_el_mobile/features/profile/presentation/cubit/profile_cubit.dart';
import 'package:hub_el_mobile/features/profile/presentation/screens/profile_screen.dart';

class MockProfileRepoForWidget implements ProfileRepository {
  @override
  Future<ApiResult<UserProfileEntity>> getProfile() async {
    return const ApiSuccess(
      UserProfileEntity(
        id: 'u-1',
        fullName: 'Hoàng Nhật Tâm',
        username: 'tamhoang',
        email: 'tam@hub-el.com',
        bio: 'Chào mừng bạn đến với Hub-EL Native',
        interests: ['Tiếng Anh', 'Lập trình', 'Khoa học'],
        level: 7,
        xp: 2400,
        isPro: true,
      ),
    );
  }

  @override
  Future<ApiResult<UserProfileEntity>> updateProfile(UpdateProfileRequest request) async {
    return ApiSuccess(
      UserProfileEntity(
        id: 'u-1',
        fullName: request.fullName ?? 'Hoàng Nhật Tâm',
        username: request.username ?? 'tamhoang',
        email: 'tam@hub-el.com',
        bio: request.bio,
        interests: request.interests ?? [],
        level: 7,
        xp: 2400,
      ),
    );
  }

  @override
  Future<ApiResult<String>> updateAvatar(String base64Image) async {
    return const ApiSuccess('Cập nhật thành công!');
  }
}

void main() {
  testWidgets('ProfileScreen renders user profile information properly', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final repo = MockProfileRepoForWidget();
    final cubit = ProfileCubit(
      getProfileUseCase: GetProfileUseCase(repo),
      updateProfileUseCase: UpdateProfileUseCase(repo),
      updateAvatarUseCase: UpdateAvatarUseCase(repo),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<ProfileCubit>.value(
          value: cubit,
          child: const ProfileScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Hồ Sơ Cá Nhân'), findsOneWidget);
    expect(find.text('Hoàng Nhật Tâm'), findsOneWidget);
    expect(find.text('@tamhoang'), findsOneWidget);
    expect(find.text('Cấp 7'), findsOneWidget);
    expect(find.text('2400 XP'), findsOneWidget);
    expect(find.text('PRO'), findsOneWidget);
    expect(find.text('Chào mừng bạn đến với Hub-EL Native'), findsOneWidget);
    expect(find.text('Tiếng Anh'), findsOneWidget);
    expect(find.text('Lập trình'), findsOneWidget);
    expect(find.text('Chỉnh sửa thông tin cá nhân'), findsOneWidget);
    expect(find.text('Bảo mật & Đổi mật khẩu'), findsOneWidget);
    expect(find.text('Cài đặt ứng dụng'), findsOneWidget);
  });
}

