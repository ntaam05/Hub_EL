import 'package:equatable/equatable.dart';
import '../../domain/entities/blocked_user_entity.dart';
import '../../domain/entities/friend_request_entity.dart';
import '../../domain/entities/friend_user_entity.dart';
import '../../domain/entities/search_user_entity.dart';
import '../../domain/entities/user_profile_entity.dart';

enum FriendsTab {
  friends,
  requests,
  search,
  blocked,
}

enum RequestsSubTab {
  incoming,
  sent,
}

class FriendsState extends Equatable {
  final FriendsTab activeTab;
  final RequestsSubTab requestsSubTab;

  // Tab Bạn bè
  final List<FriendUserEntity> friends;
  final bool isFriendsLoading;
  final String? friendsError;
  final String friendsFilterQuery;

  // Tab Tìm kiếm
  final String searchQuery;
  final List<SearchUserEntity> searchResults;
  final bool isSearching;
  final String? searchError;

  // Tab Lời mời
  final List<FriendRequestEntity> incomingRequests;
  final List<FriendRequestEntity> sentRequests;
  final bool isRequestsLoading;
  final String? requestsError;

  // Tab Bị chặn
  final List<BlockedUserEntity> blockedUsers;
  final bool isBlockedLoading;
  final String? blockedError;

  // Thao tác đang thực hiện (chống double tap)
  final String? actionInProgressId;
  final String? actionMessage;
  final String? actionError;

  // Xem hồ sơ người dùng
  final UserProfileEntity? selectedProfile;
  final bool isProfileLoading;
  final String? profileError;

  const FriendsState({
    this.activeTab = FriendsTab.friends,
    this.requestsSubTab = RequestsSubTab.incoming,
    this.friends = const [],
    this.isFriendsLoading = false,
    this.friendsError,
    this.friendsFilterQuery = '',
    this.searchQuery = '',
    this.searchResults = const [],
    this.isSearching = false,
    this.searchError,
    this.incomingRequests = const [],
    this.sentRequests = const [],
    this.isRequestsLoading = false,
    this.requestsError,
    this.blockedUsers = const [],
    this.isBlockedLoading = false,
    this.blockedError,
    this.actionInProgressId,
    this.actionMessage,
    this.actionError,
    this.selectedProfile,
    this.isProfileLoading = false,
    this.profileError,
  });

  /// Danh sách bạn bè đã được lọc theo ô tìm kiếm nội bộ
  List<FriendUserEntity> get filteredFriends {
    if (friendsFilterQuery.trim().isEmpty) return friends;
    final q = friendsFilterQuery.toLowerCase().trim();
    return friends.where((f) {
      final nameMatch = f.name.toLowerCase().contains(q);
      final usernameMatch = f.username?.toLowerCase().contains(q) ?? false;
      return nameMatch || usernameMatch;
    }).toList();
  }

  FriendsState copyWith({
    FriendsTab? activeTab,
    RequestsSubTab? requestsSubTab,
    List<FriendUserEntity>? friends,
    bool? isFriendsLoading,
    String? friendsError,
    bool clearFriendsError = false,
    String? friendsFilterQuery,
    String? searchQuery,
    List<SearchUserEntity>? searchResults,
    bool? isSearching,
    String? searchError,
    bool clearSearchError = false,
    List<FriendRequestEntity>? incomingRequests,
    List<FriendRequestEntity>? sentRequests,
    bool? isRequestsLoading,
    String? requestsError,
    bool clearRequestsError = false,
    List<BlockedUserEntity>? blockedUsers,
    bool? isBlockedLoading,
    String? blockedError,
    bool clearBlockedError = false,
    String? actionInProgressId,
    bool clearActionInProgressId = false,
    String? actionMessage,
    bool clearActionMessage = false,
    String? actionError,
    bool clearActionError = false,
    UserProfileEntity? selectedProfile,
    bool clearSelectedProfile = false,
    bool? isProfileLoading,
    String? profileError,
    bool clearProfileError = false,
  }) {
    return FriendsState(
      activeTab: activeTab ?? this.activeTab,
      requestsSubTab: requestsSubTab ?? this.requestsSubTab,
      friends: friends ?? this.friends,
      isFriendsLoading: isFriendsLoading ?? this.isFriendsLoading,
      friendsError: clearFriendsError ? null : (friendsError ?? this.friendsError),
      friendsFilterQuery: friendsFilterQuery ?? this.friendsFilterQuery,
      searchQuery: searchQuery ?? this.searchQuery,
      searchResults: searchResults ?? this.searchResults,
      isSearching: isSearching ?? this.isSearching,
      searchError: clearSearchError ? null : (searchError ?? this.searchError),
      incomingRequests: incomingRequests ?? this.incomingRequests,
      sentRequests: sentRequests ?? this.sentRequests,
      isRequestsLoading: isRequestsLoading ?? this.isRequestsLoading,
      requestsError: clearRequestsError ? null : (requestsError ?? this.requestsError),
      blockedUsers: blockedUsers ?? this.blockedUsers,
      isBlockedLoading: isBlockedLoading ?? this.isBlockedLoading,
      blockedError: clearBlockedError ? null : (blockedError ?? this.blockedError),
      actionInProgressId: clearActionInProgressId
          ? null
          : (actionInProgressId ?? this.actionInProgressId),
      actionMessage: clearActionMessage ? null : (actionMessage ?? this.actionMessage),
      actionError: clearActionError ? null : (actionError ?? this.actionError),
      selectedProfile: clearSelectedProfile
          ? null
          : (selectedProfile ?? this.selectedProfile),
      isProfileLoading: isProfileLoading ?? this.isProfileLoading,
      profileError: clearProfileError ? null : (profileError ?? this.profileError),
    );
  }

  @override
  List<Object?> get props => [
        activeTab,
        requestsSubTab,
        friends,
        isFriendsLoading,
        friendsError,
        friendsFilterQuery,
        searchQuery,
        searchResults,
        isSearching,
        searchError,
        incomingRequests,
        sentRequests,
        isRequestsLoading,
        requestsError,
        blockedUsers,
        isBlockedLoading,
        blockedError,
        actionInProgressId,
        actionMessage,
        actionError,
        selectedProfile,
        isProfileLoading,
        profileError,
      ];
}

