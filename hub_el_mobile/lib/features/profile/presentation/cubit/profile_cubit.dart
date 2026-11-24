import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/user_profile_entity.dart';
import '../../domain/usecases/profile_usecases.dart';
import 'profile_state.dart';

class ProfileCubit extends Cubit<ProfileState> {
  final GetProfileUseCase getProfileUseCase;
  final UpdateProfileUseCase updateProfileUseCase;
  final UpdateAvatarUseCase updateAvatarUseCase;

  ProfileCubit({
    required this.getProfileUseCase,
    required this.updateProfileUseCase,
    required this.updateAvatarUseCase,
  }) : super(const ProfileState());

  /// Tải thông tin chi tiết hồ sơ
  Future<void> loadProfile() async {
    emit(state.copyWith(status: ProfileStatus.loading, errorMessage: null));
    final result = await getProfileUseCase();
    result.fold(
      onSuccess: (profile, _) {
        emit(state.copyWith(
          status: ProfileStatus.loaded,
          profile: profile,
          errorMessage: null,
        ));
      },
      onFailure: (failure) {
        emit(state.copyWith(
          status: ProfileStatus.error,
          errorMessage: failure.message,
        ));
      },
    );
  }

  /// Cập nhật thông tin cá nhân
  Future<bool> updateProfile(UpdateProfileRequest request) async {
    emit(state.copyWith(status: ProfileStatus.updating, errorMessage: null));
    final result = await updateProfileUseCase(request);
    return result.fold(
      onSuccess: (updatedProfile, message) {
        emit(state.copyWith(
          status: ProfileStatus.success,
          profile: updatedProfile,
          message: message ?? 'Cập nhật hồ sơ thành công!',
          errorMessage: null,
        ));
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          status: ProfileStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }

  /// Cập nhật ảnh đại diện
  Future<bool> updateAvatar(String base64Image) async {
    emit(state.copyWith(status: ProfileStatus.avatarUploading, errorMessage: null));
    final result = await updateAvatarUseCase(base64Image);
    return result.fold(
      onSuccess: (_, message) {
        if (state.profile != null) {
          final updated = state.profile!.copyWith(displayAvatar: base64Image);
          emit(state.copyWith(
            status: ProfileStatus.success,
            profile: updated,
            message: message ?? 'Cập nhật ảnh đại diện thành công!',
            errorMessage: null,
          ));
        } else {
          emit(state.copyWith(
            status: ProfileStatus.success,
            message: message ?? 'Cập nhật ảnh đại diện thành công!',
            errorMessage: null,
          ));
        }
        return true;
      },
      onFailure: (failure) {
        emit(state.copyWith(
          status: ProfileStatus.error,
          errorMessage: failure.message,
        ));
        return false;
      },
    );
  }
}

