import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/social/data/models/blocked_user_model.dart';
import 'package:hub_el_mobile/features/social/data/models/friend_request_model.dart';
import 'package:hub_el_mobile/features/social/data/models/friend_user_model.dart';
import 'package:hub_el_mobile/features/social/data/models/search_user_model.dart';
import 'package:hub_el_mobile/features/social/data/models/user_profile_model.dart';
import 'package:hub_el_mobile/features/social/domain/entities/blocked_user_entity.dart';
import 'package:hub_el_mobile/features/social/domain/entities/friend_request_entity.dart';
import 'package:hub_el_mobile/features/social/domain/entities/friend_user_entity.dart';
import 'package:hub_el_mobile/features/social/domain/entities/search_user_entity.dart';
import 'package:hub_el_mobile/features/social/domain/entities/user_profile_entity.dart';
import 'package:hub_el_mobile/features/social/domain/repositories/friends_repository.dart';
import 'package:hub_el_mobile/features/social/presentation/cubit/friends_cubit.dart';
import 'package:hub_el_mobile/features/social/presentation/cubit/friends_state.dart';
import 'package:hub_el_mobile/features/social/presentation/screens/friends_screen.dart';
import 'package:hub_el_mobile/features/social/presentation/widgets/blocked_user_card.dart';
import 'package:hub_el_mobile/features/social/presentation/widgets/confirm_action_dialog.dart';
import 'package:hub_el_mobile/features/social/presentation/widgets/friend_card.dart';
import 'package:hub_el_mobile/features/social/presentation/widgets/friend_request_card.dart';
import 'package:hub_el_mobile/features/social/presentation/widgets/search_user_card.dart';

class FakeFriendsRepository implements IFriendsRepository {
  ApiResult<List<FriendUserEntity>> friendsListResult = const ApiSuccess([]);
  ApiResult<List<SearchUserEntity>> searchResult = const ApiSuccess([]);
  ApiResult<List<FriendRequestEntity>> incomingRequestsResult = const ApiSuccess([]);
  ApiResult<List<FriendRequestEntity>> sentRequestsResult = const ApiSuccess([]);
  ApiResult<String> sendRequestResult = const ApiSuccess('Đã gửi lời mời kết bạn.');
  ApiResult<String> respondRequestResult = const ApiSuccess('Đã chấp nhận kết bạn.');
  ApiResult<String> cancelRequestResult = const ApiSuccess('Đã hủy lời mời kết bạn.');
  ApiResult<String> removeFriendResult = const ApiSuccess('Đã hủy kết bạn.');
  ApiResult<String> blockUserResult = const ApiSuccess('Đã chặn người dùng.');
  ApiResult<String> unblockUserResult = const ApiSuccess('Đã bỏ chặn người dùng.');
  ApiResult<List<BlockedUserEntity>> blockedUsersResult = const ApiSuccess([]);
  ApiResult<UserProfileEntity> userProfileResult = const ApiSuccess(
    UserProfileEntity(id: 'user_1', name: 'Tester', level: 2),
  );

  @override
  Future<ApiResult<List<FriendUserEntity>>> getFriendsList() async => friendsListResult;

  @override
  Future<ApiResult<List<SearchUserEntity>>> searchUsers(String query) async => searchResult;

  @override
  Future<ApiResult<List<FriendRequestEntity>>> getIncomingRequests() async => incomingRequestsResult;

  @override
  Future<ApiResult<List<FriendRequestEntity>>> getSentRequests() async => sentRequestsResult;

  @override
  Future<ApiResult<String>> sendFriendRequest(String targetUserId) async => sendRequestResult;

  @override
  Future<ApiResult<String>> respondFriendRequest(int requestId, bool accept) async => respondRequestResult;

  @override
  Future<ApiResult<String>> cancelFriendRequest(dynamic requestId) async => cancelRequestResult;

  @override
  Future<ApiResult<String>> removeFriend(String targetUserId) async => removeFriendResult;

  @override
  Future<ApiResult<String>> blockUser(String targetUserId) async => blockUserResult;

  @override
  Future<ApiResult<String>> unblockUser(String targetUserId) async => unblockUserResult;

  @override
  Future<ApiResult<List<BlockedUserEntity>>> getBlockedUsers() async => blockedUsersResult;

  @override
  Future<ApiResult<UserProfileEntity>> getUserProfile(String targetUserId) async => userProfileResult;
}

void main() {
  group('1. Data Models JSON Parsing Tests', () {
    test('FriendUserModel parses JSON accurately', () {
      final json = {
        'id': 'user_123',
        'name': 'Bob Tester',
        'username': 'bob_tester',
        'image': 'https://example.com/avatar.png',
        'isOnline': true,
        'level': 5,
        'streak': 12,
        'friendshipId': 42,
      };

      final model = FriendUserModel.fromJson(json);

      expect(model.id, 'user_123');
      expect(model.name, 'Bob Tester');
      expect(model.username, 'bob_tester');
      expect(model.image, 'https://example.com/avatar.png');
      expect(model.isOnline, true);
      expect(model.level, 5);
      expect(model.streak, 12);
      expect(model.friendshipId, 42);

      final exported = model.toJson();
      expect(exported['id'], 'user_123');
      expect(exported['streak'], 12);
    });

    test('SearchUserModel parses status and flags', () {
      final json = {
        'id': 'user_456',
        'name': 'Alice Wonder',
        'username': 'alice_w',
        'displayAvatar': 'https://example.com/alice.png',
        'level': 3,
        'isOnline': false,
        'friendshipStatus': 'PENDING',
        'isSender': true,
        'friendshipId': 88,
        'isBlockedByMe': false,
        'isBlockedByThem': false,
      };

      final model = SearchUserModel.fromJson(json);

      expect(model.id, 'user_456');
      expect(model.name, 'Alice Wonder');
      expect(model.image, 'https://example.com/alice.png');
      expect(model.friendshipStatus, FriendshipStatus.pending);
      expect(model.isSender, true);
      expect(model.friendshipId, 88);
    });

    test('FriendRequestModel parses incoming and sent formats', () {
      final incomingJson = {
        'id': 101,
        'sender': {
          'id': 'user_789',
          'name': 'Charlie',
          'username': 'charlie_dev',
          'avatar': 'https://example.com/c.png',
          'level': 4,
        },
        'createdAt': '2026-11-20T10:00:00.000Z',
      };

      final incoming = FriendRequestModel.fromJson(incomingJson, isIncoming: true);
      expect(incoming.id, 101);
      expect(incoming.userId, 'user_789');
      expect(incoming.name, 'Charlie');
      expect(incoming.level, 4);
      expect(incoming.isIncoming, true);

      final sentJson = {
        'id': 102,
        'receiver': {
          'id': 'user_999',
          'name': 'Dave',
          'username': 'dave_it',
          'image': null,
          'level': 2,
        },
        'createdAt': '2026-11-20T11:00:00.000Z',
      };

      final sent = FriendRequestModel.fromJson(sentJson, isIncoming: false);
      expect(sent.id, 102);
      expect(sent.userId, 'user_999');
      expect(sent.name, 'Dave');
      expect(sent.isIncoming, false);
    });

    test('BlockedUserModel parses correctly', () {
      final json = {
        'id': 'user_blocked_1',
        'name': 'Spammer',
        'username': 'spammer99',
        'image': null,
      };

      final model = BlockedUserModel.fromJson(json);
      expect(model.id, 'user_blocked_1');
      expect(model.name, 'Spammer');
    });

    test('UserProfileModel parses full profile and privacy flags', () {
      final json = {
        'id': 'user_profile_1',
        'name': 'Emma Watson',
        'username': 'emma_w',
        'image': 'https://example.com/emma.png',
        'bio': 'English enthusiast & traveler',
        'level': 8,
        'streak': 45,
        'experience': 5600,
        'isOnline': true,
        'friendshipStatus': 'ACCEPTED',
        'isProfileHidden': false,
        'friendsCount': 28,
        'mutualFriendsCount': 5,
      };

      final model = UserProfileModel.fromJson(json);
      expect(model.id, 'user_profile_1');
      expect(model.name, 'Emma Watson');
      expect(model.bio, 'English enthusiast & traveler');
      expect(model.streak, 45);
      expect(model.experience, 5600);
      expect(model.friendshipStatus, FriendshipStatus.accepted);
      expect(model.isProfileHidden, false);
      expect(model.friendsCount, 28);
      expect(model.mutualFriendsCount, 5);
    });
  });

  group('2. FriendsCubit State Transitions & Action Tests', () {
    late FakeFriendsRepository repo;
    late FriendsCubit cubit;

    setUp(() {
      repo = FakeFriendsRepository();
      cubit = FriendsCubit(repository: repo);
    });

    tearDown(() {
      cubit.close();
    });

    test('Initial state is correct', () {
      expect(cubit.state.activeTab, FriendsTab.friends);
      expect(cubit.state.requestsSubTab, RequestsSubTab.incoming);
      expect(cubit.state.friends, isEmpty);
      expect(cubit.state.isFriendsLoading, false);
    });

    test('changeTab switches main tabs and loads data', () async {
      repo.blockedUsersResult = const ApiSuccess([
        BlockedUserEntity(id: 'b1', name: 'Blocked One'),
      ]);

      cubit.changeTab(FriendsTab.blocked);
      expect(cubit.state.activeTab, FriendsTab.blocked);

      await Future.delayed(const Duration(milliseconds: 50));
      expect(cubit.state.blockedUsers.length, 1);
    });

    test('loadFriends updates state on success and failure', () async {
      repo.friendsListResult = const ApiSuccess([
        FriendUserEntity(id: 'f1', name: 'Friend One', level: 3, isOnline: true),
        FriendUserEntity(id: 'f2', name: 'Friend Two', level: 1, isOnline: false),
      ]);

      await cubit.loadFriends();
      expect(cubit.state.friends.length, 2);
      expect(cubit.state.isFriendsLoading, false);
      expect(cubit.state.friendsError, isNull);

      // Test internal filter
      cubit.updateFriendsFilter('Two');
      expect(cubit.state.filteredFriends.length, 1);
      expect(cubit.state.filteredFriends.first.name, 'Friend Two');

      // Failure
      repo.friendsListResult = const ApiFailure(message: 'Lỗi máy chủ');
      await cubit.loadFriends();
      expect(cubit.state.friendsError, 'Lỗi máy chủ');
    });

    test('executeSearch updates searchResults', () async {
      repo.searchResult = const ApiSuccess([
        SearchUserEntity(id: 's1', name: 'Search Guy', level: 2),
      ]);

      await cubit.executeSearch('Search');
      expect(cubit.state.searchResults.length, 1);
      expect(cubit.state.searchResults.first.name, 'Search Guy');
      expect(cubit.state.isSearching, false);

      cubit.clearSearch();
      expect(cubit.state.searchResults, isEmpty);
      expect(cubit.state.searchQuery, isEmpty);
    });

    test('sendFriendRequest updates search status to PENDING and triggers request reload', () async {
      cubit.emit(cubit.state.copyWith(
        searchResults: const [
          SearchUserEntity(id: 'target_1', name: 'Target User', friendshipStatus: FriendshipStatus.none),
        ],
      ));

      repo.sendRequestResult = const ApiSuccess('Đã gửi lời mời thành công.');

      await cubit.sendFriendRequest('target_1');

      expect(cubit.state.searchResults.first.friendshipStatus, FriendshipStatus.pending);
      expect(cubit.state.searchResults.first.isSender, true);
      expect(cubit.state.actionMessage, 'Đã gửi lời mời thành công.');
      expect(cubit.state.actionInProgressId, isNull);
    });

    test('respondFriendRequest accept=true removes request and reloads friends', () async {
      cubit.emit(cubit.state.copyWith(
        incomingRequests: const [
          FriendRequestEntity(id: 10, userId: 'u10', name: 'User 10', isIncoming: true),
        ],
      ));

      repo.respondRequestResult = const ApiSuccess('Đã chấp nhận kết bạn.');
      repo.friendsListResult = const ApiSuccess([
        FriendUserEntity(id: 'u10', name: 'User 10'),
      ]);

      await cubit.respondFriendRequest(10, true, targetUserId: 'u10');

      expect(cubit.state.incomingRequests, isEmpty);
      expect(cubit.state.friends.length, 1);
      expect(cubit.state.actionMessage, 'Đã chấp nhận kết bạn.');
    });

    test('cancelFriendRequest removes from sentRequests', () async {
      cubit.emit(cubit.state.copyWith(
        sentRequests: const [
          FriendRequestEntity(id: 20, userId: 'u20', name: 'User 20', isIncoming: false),
        ],
      ));

      repo.cancelRequestResult = const ApiSuccess('Đã hủy lời mời.');

      await cubit.cancelFriendRequest(20, targetUserId: 'u20');

      expect(cubit.state.sentRequests, isEmpty);
      expect(cubit.state.actionMessage, 'Đã hủy lời mời.');
    });

    test('removeFriend removes from friends list', () async {
      cubit.emit(cubit.state.copyWith(
        friends: const [
          FriendUserEntity(id: 'f1', name: 'Friend One'),
          FriendUserEntity(id: 'f2', name: 'Friend Two'),
        ],
      ));

      repo.removeFriendResult = const ApiSuccess('Đã hủy kết bạn.');

      await cubit.removeFriend('f1');

      expect(cubit.state.friends.length, 1);
      expect(cubit.state.friends.first.id, 'f2');
      expect(cubit.state.actionMessage, 'Đã hủy kết bạn.');
    });

    test('blockUser removes from friends and reloads blocked', () async {
      cubit.emit(cubit.state.copyWith(
        friends: const [
          FriendUserEntity(id: 'f1', name: 'Friend One'),
        ],
      ));

      repo.blockUserResult = const ApiSuccess('Đã chặn người dùng.');
      repo.blockedUsersResult = const ApiSuccess([
        BlockedUserEntity(id: 'f1', name: 'Friend One'),
      ]);

      await cubit.blockUser('f1');

      expect(cubit.state.friends, isEmpty);
      expect(cubit.state.blockedUsers.length, 1);
      expect(cubit.state.actionMessage, 'Đã chặn người dùng.');
    });

    test('unblockUser removes from blocked and reloads friends', () async {
      cubit.emit(cubit.state.copyWith(
        blockedUsers: const [
          BlockedUserEntity(id: 'b1', name: 'Blocked User'),
        ],
      ));

      repo.unblockUserResult = const ApiSuccess('Đã bỏ chặn người dùng.');
      repo.friendsListResult = const ApiSuccess([
        FriendUserEntity(id: 'b1', name: 'Blocked User'),
      ]);

      await cubit.unblockUser('b1');

      expect(cubit.state.blockedUsers, isEmpty);
      expect(cubit.state.friends.length, 1);
      expect(cubit.state.actionMessage, 'Đã bỏ chặn người dùng.');
    });

    test('loadUserProfile updates selectedProfile on success', () async {
      repo.userProfileResult = const ApiSuccess(
        UserProfileEntity(
          id: 'u_prof',
          name: 'Professional Learner',
          bio: 'Study hard',
          level: 10,
          streak: 100,
        ),
      );

      await cubit.loadUserProfile('u_prof');

      expect(cubit.state.selectedProfile, isNotNull);
      expect(cubit.state.selectedProfile!.name, 'Professional Learner');
      expect(cubit.state.selectedProfile!.streak, 100);

      cubit.clearProfile();
      expect(cubit.state.selectedProfile, isNull);
    });
  });

  group('3. Social Widget Tests', () {
    testWidgets('FriendCard renders display info and online dot', (tester) async {
      const friend = FriendUserEntity(
        id: 'user_1',
        name: 'Nguyen Van A',
        username: 'nguyenvana',
        level: 4,
        streak: 7,
        isOnline: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: FriendCard(
              friend: friend,
              onTap: () {},
              onRemove: () {},
              onBlock: () {},
            ),
          ),
        ),
      );

      expect(find.text('Nguyen Van A'), findsOneWidget);
      expect(find.text('@nguyenvana'), findsOneWidget);
      expect(find.text('Lv.4'), findsOneWidget);
      expect(find.text('7d'), findsOneWidget);
      expect(find.text('Đang hoạt động'), findsOneWidget);
    });

    testWidgets('SearchUserCard renders proper button for NONE status', (tester) async {
      const user = SearchUserEntity(
        id: 'user_search',
        name: 'Tran Thi B',
        username: 'tranthib',
        level: 2,
        friendshipStatus: FriendshipStatus.none,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SearchUserCard(
              user: user,
              onTap: () {},
              onAddFriend: () {},
              onCancelRequest: () {},
              onAcceptRequest: () {},
            ),
          ),
        ),
      );

      expect(find.text('Tran Thi B'), findsOneWidget);
      expect(find.text('Kết bạn'), findsOneWidget);
    });

    testWidgets('SearchUserCard renders Đã gửi for PENDING & isSender', (tester) async {
      const user = SearchUserEntity(
        id: 'user_pending',
        name: 'Le Van C',
        level: 3,
        friendshipStatus: FriendshipStatus.pending,
        isSender: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SearchUserCard(
              user: user,
              onTap: () {},
              onAddFriend: () {},
              onCancelRequest: () {},
              onAcceptRequest: () {},
            ),
          ),
        ),
      );

      expect(find.text('Đã gửi'), findsOneWidget);
    });

    testWidgets('FriendRequestCard renders action buttons for incoming', (tester) async {
      const request = FriendRequestEntity(
        id: 99,
        userId: 'req_sender',
        name: 'Pham D',
        level: 1,
        isIncoming: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: FriendRequestCard(
              request: request,
              onTap: () {},
              onAccept: () {},
              onDecline: () {},
            ),
          ),
        ),
      );

      expect(find.text('Pham D'), findsOneWidget);
      expect(find.text('Xác nhận'), findsOneWidget);
      expect(find.text('Xóa'), findsOneWidget);
    });

    testWidgets('BlockedUserCard renders Bỏ chặn button', (tester) async {
      const blocked = BlockedUserEntity(
        id: 'b_user',
        name: 'Toxic User',
        username: 'toxic',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BlockedUserCard(
              user: blocked,
              onUnblock: () {},
            ),
          ),
        ),
      );

      expect(find.text('Toxic User'), findsOneWidget);
      expect(find.text('Bỏ chặn'), findsOneWidget);
    });

    testWidgets('ConfirmActionDialog confirms on click', (tester) async {
      bool confirmed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ConfirmActionDialog(
              title: 'Xác nhận xóa?',
              content: 'Hành động này không thể hoàn tác.',
              confirmLabel: 'Xóa ngay',
              isDestructive: true,
              onConfirm: () {
                confirmed = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('Xác nhận xóa?'), findsOneWidget);
      expect(find.text('Xóa ngay'), findsOneWidget);

      await tester.tap(find.text('Xóa ngay'));
      expect(confirmed, true);
    });

    testWidgets('FriendsScreen renders tabs and switches properly', (tester) async {
      final repo = FakeFriendsRepository();
      repo.friendsListResult = const ApiSuccess([
        FriendUserEntity(id: 'f1', name: 'Best Friend', level: 5),
      ]);
      final cubit = FriendsCubit(repository: repo);

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider.value(
            value: cubit,
            child: const FriendsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Bạn bè'), findsWidgets);
      expect(find.text('Lời mời'), findsOneWidget);
      expect(find.text('Tìm kiếm'), findsOneWidget);
      expect(find.text('Đã chặn'), findsOneWidget);
      expect(find.text('Best Friend'), findsOneWidget);

      // Tap on Tab "Tìm kiếm"
      await tester.tap(find.text('Tìm kiếm'));
      await tester.pumpAndSettle();

      expect(find.text('Tìm kiếm bạn bè'), findsOneWidget);

      cubit.close();
    });
  });
}

