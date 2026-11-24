import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_result.dart';
import '../../domain/entities/search_user_entity.dart';
import '../../domain/entities/user_profile_entity.dart';
import '../../domain/repositories/friends_repository.dart';
import 'friends_state.dart';

class FriendsCubit extends Cubit<FriendsState> {
  final IFriendsRepository repository;
  Timer? _searchDebounceTimer;

  FriendsCubit({required this.repository}) : super(const FriendsState());

  @override
  Future<void> close() {
    _searchDebounceTimer?.cancel();
    return super.close();
  }

  /// Khởi tạo và tải dữ liệu ban đầu
  void init() {
    loadFriends();
    loadRequests();
  }

  /// Chuyển tab chính
  void changeTab(FriendsTab tab) {
    emit(state.copyWith(activeTab: tab));
    if (tab == FriendsTab.friends && state.friends.isEmpty) {
      loadFriends();
    } else if (tab == FriendsTab.requests &&
        state.incomingRequests.isEmpty &&
        state.sentRequests.isEmpty) {
      loadRequests();
    } else if (tab == FriendsTab.blocked && state.blockedUsers.isEmpty) {
      loadBlockedUsers();
    }
  }

  /// Chuyển tab con trong Lời mời (Nhận được / Đã gửi)
  void changeRequestsSubTab(RequestsSubTab subTab) {
    emit(state.copyWith(requestsSubTab: subTab));
  }

  /// Cập nhật từ khóa lọc nội bộ danh sách bạn bè
  void updateFriendsFilter(String query) {
    emit(state.copyWith(friendsFilterQuery: query));
  }

  /// Tải danh sách bạn bè
  Future<void> loadFriends({bool isRefresh = false}) async {
    if (!isRefresh) {
      emit(state.copyWith(isFriendsLoading: true, clearFriendsError: true));
    }

    final result = await repository.getFriendsList();

    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(
          friends: data,
          isFriendsLoading: false,
          clearFriendsError: true,
        ));
      case ApiFailure(:final message):
        emit(state.copyWith(
          isFriendsLoading: false,
          friendsError: message,
        ));
    }
  }

  /// Tìm kiếm người dùng có debounce 400ms
  void onSearchQueryChanged(String query) {
    emit(state.copyWith(searchQuery: query));
    _searchDebounceTimer?.cancel();

    if (query.trim().isEmpty) {
      emit(state.copyWith(
        searchResults: [],
        isSearching: false,
        clearSearchError: true,
      ));
      return;
    }

    _searchDebounceTimer = Timer(const Duration(milliseconds: 400), () {
      executeSearch(query.trim());
    });
  }

  /// Thực hiện gọi API tìm kiếm
  Future<void> executeSearch(String query) async {
    if (query.isEmpty) return;

    emit(state.copyWith(isSearching: true, clearSearchError: true));
    final result = await repository.searchUsers(query);

    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(
          searchResults: data,
          isSearching: false,
          clearSearchError: true,
        ));
      case ApiFailure(:final message):
        emit(state.copyWith(
          isSearching: false,
          searchError: message,
        ));
    }
  }

  /// Xóa ô tìm kiếm
  void clearSearch() {
    _searchDebounceTimer?.cancel();
    emit(state.copyWith(
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      clearSearchError: true,
    ));
  }

  /// Tải cả lời mời nhận được và lời mời đã gửi
  Future<void> loadRequests({bool isRefresh = false}) async {
    if (!isRefresh) {
      emit(state.copyWith(isRequestsLoading: true, clearRequestsError: true));
    }

    final incomingFuture = repository.getIncomingRequests();
    final sentFuture = repository.getSentRequests();

    final results = await Future.wait([incomingFuture, sentFuture]);
    final incomingResult = results[0];
    final sentResult = results[1];

    if (incomingResult is ApiSuccess && sentResult is ApiSuccess) {
      final inData = (incomingResult as ApiSuccess).data;
      final sentData = (sentResult as ApiSuccess).data;

      emit(state.copyWith(
        incomingRequests: inData,
        sentRequests: sentData,
        isRequestsLoading: false,
        clearRequestsError: true,
      ));
    } else {
      String errMsg = 'Lỗi khi tải danh sách lời mời.';
      if (incomingResult is ApiFailure) errMsg = (incomingResult as ApiFailure).message;
      if (sentResult is ApiFailure) errMsg = (sentResult as ApiFailure).message;

      emit(state.copyWith(
        isRequestsLoading: false,
        requestsError: errMsg,
      ));
    }
  }

  /// Tải danh sách người dùng bị chặn
  Future<void> loadBlockedUsers({bool isRefresh = false}) async {
    if (!isRefresh) {
      emit(state.copyWith(isBlockedLoading: true, clearBlockedError: true));
    }

    final result = await repository.getBlockedUsers();

    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(
          blockedUsers: data,
          isBlockedLoading: false,
          clearBlockedError: true,
        ));
      case ApiFailure(:final message):
        emit(state.copyWith(
          isBlockedLoading: false,
          blockedError: message,
        ));
    }
  }

  /// Gửi lời mời kết bạn
  Future<void> sendFriendRequest(String targetUserId) async {
    if (state.actionInProgressId != null) return;
    emit(state.copyWith(
      actionInProgressId: targetUserId,
      clearActionMessage: true,
      clearActionError: true,
    ));

    final result = await repository.sendFriendRequest(targetUserId);

    switch (result) {
      case ApiSuccess(:final data, :final message):
        // Đồng bộ trạng thái kết quả tìm kiếm
        final updatedSearch = state.searchResults.map((u) {
          if (u.id == targetUserId) {
            return u.copyWith(
              friendshipStatus: FriendshipStatus.pending,
              isSender: true,
            );
          }
          return u;
        }).toList();

        // Đồng bộ hồ sơ đang xem nếu có
        UserProfileEntity? updatedProfile = state.selectedProfile;
        if (updatedProfile != null && updatedProfile.id == targetUserId) {
          updatedProfile = updatedProfile.copyWith(
            friendshipStatus: FriendshipStatus.pending,
          );
        }

        emit(state.copyWith(
          clearActionInProgressId: true,
          actionMessage: message ?? data,
          searchResults: updatedSearch,
          selectedProfile: updatedProfile,
        ));

        // Tải lại danh sách lời mời gửi đi
        await loadRequests(isRefresh: true);

      case ApiFailure(:final message):
        emit(state.copyWith(
          clearActionInProgressId: true,
          actionError: message,
        ));
    }
  }

  /// Chấp nhận hoặc từ chối lời mời kết bạn
  Future<void> respondFriendRequest(int requestId, bool accept, {String? targetUserId}) async {
    final actionKey = 'req_$requestId';
    if (state.actionInProgressId != null) return;
    emit(state.copyWith(
      actionInProgressId: actionKey,
      clearActionMessage: true,
      clearActionError: true,
    ));

    final result = await repository.respondFriendRequest(requestId, accept);

    switch (result) {
      case ApiSuccess(:final data, :final message):
        final updatedIncoming = state.incomingRequests.where((r) => r.id != requestId).toList();

        final updatedSearch = state.searchResults.map((u) {
          if (targetUserId != null && u.id == targetUserId) {
            return u.copyWith(
              friendshipStatus: accept ? FriendshipStatus.accepted : FriendshipStatus.none,
              isSender: false,
            );
          }
          return u;
        }).toList();

        emit(state.copyWith(
          clearActionInProgressId: true,
          actionMessage: message ?? data,
          incomingRequests: updatedIncoming,
          searchResults: updatedSearch,
        ));

        if (accept) {
          await loadFriends(isRefresh: true);
        }

      case ApiFailure(:final message):
        emit(state.copyWith(
          clearActionInProgressId: true,
          actionError: message,
        ));
    }
  }

  /// Hủy lời mời kết bạn đã gửi
  Future<void> cancelFriendRequest(dynamic requestId, {String? targetUserId}) async {
    final actionKey = 'cancel_$requestId';
    if (state.actionInProgressId != null) return;
    emit(state.copyWith(
      actionInProgressId: actionKey,
      clearActionMessage: true,
      clearActionError: true,
    ));

    final result = await repository.cancelFriendRequest(requestId);

    switch (result) {
      case ApiSuccess(:final data, :final message):
        final updatedSent = state.sentRequests.where((r) => r.id != requestId).toList();

        final updatedSearch = state.searchResults.map((u) {
          if (targetUserId != null && u.id == targetUserId) {
            return u.copyWith(
              friendshipStatus: FriendshipStatus.none,
              isSender: false,
            );
          }
          return u;
        }).toList();

        UserProfileEntity? updatedProfile = state.selectedProfile;
        if (updatedProfile != null && updatedProfile.id == targetUserId) {
          updatedProfile = updatedProfile.copyWith(
            friendshipStatus: FriendshipStatus.none,
          );
        }

        emit(state.copyWith(
          clearActionInProgressId: true,
          actionMessage: message ?? data,
          sentRequests: updatedSent,
          searchResults: updatedSearch,
          selectedProfile: updatedProfile,
        ));

      case ApiFailure(:final message):
        emit(state.copyWith(
          clearActionInProgressId: true,
          actionError: message,
        ));
    }
  }

  /// Hủy kết bạn (Xóa bạn)
  Future<void> removeFriend(String targetUserId) async {
    if (state.actionInProgressId != null) return;
    emit(state.copyWith(
      actionInProgressId: targetUserId,
      clearActionMessage: true,
      clearActionError: true,
    ));

    final result = await repository.removeFriend(targetUserId);

    switch (result) {
      case ApiSuccess(:final data, :final message):
        final updatedFriends = state.friends.where((f) => f.id != targetUserId).toList();

        final updatedSearch = state.searchResults.map((u) {
          if (u.id == targetUserId) {
            return u.copyWith(
              friendshipStatus: FriendshipStatus.none,
            );
          }
          return u;
        }).toList();

        UserProfileEntity? updatedProfile = state.selectedProfile;
        if (updatedProfile != null && updatedProfile.id == targetUserId) {
          updatedProfile = updatedProfile.copyWith(
            friendshipStatus: FriendshipStatus.none,
            friendsCount: (updatedProfile.friendsCount > 0) ? updatedProfile.friendsCount - 1 : 0,
          );
        }

        emit(state.copyWith(
          clearActionInProgressId: true,
          actionMessage: message ?? data,
          friends: updatedFriends,
          searchResults: updatedSearch,
          selectedProfile: updatedProfile,
        ));

      case ApiFailure(:final message):
        emit(state.copyWith(
          clearActionInProgressId: true,
          actionError: message,
        ));
    }
  }

  /// Chặn người dùng
  Future<void> blockUser(String targetUserId) async {
    if (state.actionInProgressId != null) return;
    emit(state.copyWith(
      actionInProgressId: targetUserId,
      clearActionMessage: true,
      clearActionError: true,
    ));

    final result = await repository.blockUser(targetUserId);

    switch (result) {
      case ApiSuccess(:final data, :final message):
        final updatedFriends = state.friends.where((f) => f.id != targetUserId).toList();

        final updatedSearch = state.searchResults.map((u) {
          if (u.id == targetUserId) {
            return u.copyWith(
              friendshipStatus: FriendshipStatus.blocked,
              isBlockedByMe: true,
            );
          }
          return u;
        }).toList();

        UserProfileEntity? updatedProfile = state.selectedProfile;
        if (updatedProfile != null && updatedProfile.id == targetUserId) {
          updatedProfile = updatedProfile.copyWith(
            friendshipStatus: FriendshipStatus.blocked,
            isProfileHidden: true,
          );
        }

        emit(state.copyWith(
          clearActionInProgressId: true,
          actionMessage: message ?? data,
          friends: updatedFriends,
          searchResults: updatedSearch,
          selectedProfile: updatedProfile,
        ));

        await loadBlockedUsers(isRefresh: true);

      case ApiFailure(:final message):
        emit(state.copyWith(
          clearActionInProgressId: true,
          actionError: message,
        ));
    }
  }

  /// Bỏ chặn người dùng
  Future<void> unblockUser(String targetUserId) async {
    if (state.actionInProgressId != null) return;
    emit(state.copyWith(
      actionInProgressId: targetUserId,
      clearActionMessage: true,
      clearActionError: true,
    ));

    final result = await repository.unblockUser(targetUserId);

    switch (result) {
      case ApiSuccess(:final data, :final message):
        final updatedBlocked = state.blockedUsers.where((u) => u.id != targetUserId).toList();

        final updatedSearch = state.searchResults.map((u) {
          if (u.id == targetUserId) {
            return u.copyWith(
              friendshipStatus: FriendshipStatus.accepted,
              isBlockedByMe: false,
            );
          }
          return u;
        }).toList();

        emit(state.copyWith(
          clearActionInProgressId: true,
          actionMessage: message ?? data,
          blockedUsers: updatedBlocked,
          searchResults: updatedSearch,
        ));

        await loadFriends(isRefresh: true);

      case ApiFailure(:final message):
        emit(state.copyWith(
          clearActionInProgressId: true,
          actionError: message,
        ));
    }
  }

  /// Xem hồ sơ chi tiết người dùng
  Future<void> loadUserProfile(String targetUserId) async {
    emit(state.copyWith(
      isProfileLoading: true,
      clearProfileError: true,
      clearSelectedProfile: true,
    ));

    final result = await repository.getUserProfile(targetUserId);

    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(
          selectedProfile: data,
          isProfileLoading: false,
          clearProfileError: true,
        ));
      case ApiFailure(:final message):
        emit(state.copyWith(
          isProfileLoading: false,
          profileError: message,
        ));
    }
  }

  /// Đóng hồ sơ
  void clearProfile() {
    emit(state.copyWith(clearSelectedProfile: true, clearProfileError: true));
  }

  /// Xóa thông báo phản hồi thao tác
  void clearActionFeedback() {
    emit(state.copyWith(clearActionMessage: true, clearActionError: true));
  }
}
