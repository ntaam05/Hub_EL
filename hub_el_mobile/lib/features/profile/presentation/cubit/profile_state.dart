import 'package:equatable/equatable.dart';
import '../../domain/entities/user_profile_entity.dart';

enum ProfileStatus {
  initial,
  loading,
  loaded,
  updating,
  avatarUploading,
  success,
  error,
}

class ProfileState extends Equatable {
  final ProfileStatus status;
  final UserProfileEntity? profile;
  final String? message;
  final String? errorMessage;

  const ProfileState({
    this.status = ProfileStatus.initial,
    this.profile,
    this.message,
    this.errorMessage,
  });

  bool get isLoading => status == ProfileStatus.loading;
  bool get isUpdating => status == ProfileStatus.updating;
  bool get isAvatarUploading => status == ProfileStatus.avatarUploading;
  bool get isBusy => isLoading || isUpdating || isAvatarUploading;

  ProfileState copyWith({
    ProfileStatus? status,
    UserProfileEntity? profile,
    String? message,
    String? errorMessage,
  }) {
    return ProfileState(
      status: status ?? this.status,
      profile: profile ?? this.profile,
      message: message,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, profile, message, errorMessage];
}

