import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/profile/domain/entities/user_profile_entity.dart';
import 'package:hub_el_mobile/features/profile/domain/repositories/profile_repository.dart';
import 'package:hub_el_mobile/features/profile/domain/usecases/profile_usecases.dart';
import 'package:hub_el_mobile/features/profile/presentation/cubit/profile_cubit.dart';
import 'package:hub_el_mobile/features/profile/presentation/cubit/profile_state.dart';

class MockProfileRepository implements ProfileRepository {
  UserProfileEntity? profileToReturn;
  bool shouldFail = false;
  String errorMessage = 'Lỗi kết nối máy chủ.';

  @override
  Future<ApiResult<UserProfileEntity>> getProfile() async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return ApiSuccess(
      profileToReturn ??
          const UserProfileEntity(
            id: 'mock-1',
            name: 'Hoàng Nhật Tâm',
            email: 'tam@example.com',
            level: 3,
            xp: 450,
          ),
    );
  }

  @override
  Future<ApiResult<UserProfileEntity>> updateProfile(UpdateProfileRequest request) async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return ApiSuccess(
      UserProfileEntity(
        id: 'mock-1',
        fullName: request.fullName ?? 'Hoàng Nhật Tâm',
        username: request.username ?? 'tamhoang',
        email: 'tam@example.com',
        bio: request.bio,
        interests: request.interests ?? [],
        level: 3,
        xp: 450,
      ),
      message: 'Cập nhật hồ sơ thành công!',
    );
  }

  @override
  Future<ApiResult<String>> updateAvatar(String base64Image) async {
    if (shouldFail) return ApiFailure(message: errorMessage);
    return const ApiSuccess('Cập nhật ảnh đại diện thành công!');
  }
}

void main() {
  group('ProfileCubit Unit Tests', () {
    late MockProfileRepository repository;
    late ProfileCubit cubit;

    setUp(() {
      repository = MockProfileRepository();
      cubit = ProfileCubit(
        getProfileUseCase: GetProfileUseCase(repository),
        updateProfileUseCase: UpdateProfileUseCase(repository),
        updateAvatarUseCase: UpdateAvatarUseCase(repository),
      );
    });

    tearDown(() {
      cubit.close();
    });

    test('Initial state is correct', () {
      expect(cubit.state.status, ProfileStatus.initial);
      expect(cubit.state.profile, isNull);
      expect(cubit.state.isBusy, false);
    });

    test('loadProfile emits [loading, loaded] on success', () async {
      await cubit.loadProfile();

      expect(cubit.state.status, ProfileStatus.loaded);
      expect(cubit.state.profile, isNotNull);
      expect(cubit.state.profile!.displayName, 'Hoàng Nhật Tâm');
    });

    test('loadProfile emits [loading, error] on failure', () async {
      repository.shouldFail = true;
      repository.errorMessage = 'Không tìm thấy người dùng.';

      await cubit.loadProfile();

      expect(cubit.state.status, ProfileStatus.error);
      expect(cubit.state.errorMessage, 'Không tìm thấy người dùng.');
    });

    test('updateProfile updates profile and emits success', () async {
      await cubit.loadProfile();

      const request = UpdateProfileRequest(
        fullName: 'Hoàng Nhật Tâm Mới',
        username: 'tam_new',
        bio: 'Tiểu sử mới cập nhật',
        interests: ['Tiếng Anh'],
      );

      final success = await cubit.updateProfile(request);

      expect(success, true);
      expect(cubit.state.status, ProfileStatus.success);
      expect(cubit.state.profile!.displayName, 'Hoàng Nhật Tâm Mới');
      expect(cubit.state.profile!.username, 'tam_new');
      expect(cubit.state.profile!.bio, 'Tiểu sử mới cập nhật');
    });

    test('updateAvatar uploads base64 image and updates avatar', () async {
      await cubit.loadProfile();

      const newAvatar = 'data:image/jpeg;base64,fakeimagebytes123';
      final success = await cubit.updateAvatar(newAvatar);

      expect(success, true);
      expect(cubit.state.status, ProfileStatus.success);
      expect(cubit.state.profile!.displayAvatar, newAvatar);
    });
  });
}
