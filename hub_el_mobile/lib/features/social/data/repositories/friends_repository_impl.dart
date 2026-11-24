import '../../../../core/network/api_result.dart';
import '../../domain/entities/blocked_user_entity.dart';
import '../../domain/entities/friend_request_entity.dart';
import '../../domain/entities/friend_user_entity.dart';
import '../../domain/entities/search_user_entity.dart';
import '../../domain/entities/user_profile_entity.dart';
import '../../domain/repositories/friends_repository.dart';
import '../datasources/friends_remote_data_source.dart';

class FriendsRepositoryImpl implements IFriendsRepository {
  final IFriendsRemoteDataSource remoteDataSource;

  FriendsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<List<FriendUserEntity>>> getFriendsList() async {
    final result = await remoteDataSource.getFriendsList();
    return result.map((list) => list.cast<FriendUserEntity>());
  }

  @override
  Future<ApiResult<List<SearchUserEntity>>> searchUsers(String query) async {
    final result = await remoteDataSource.searchUsers(query);
    return result.map((list) => list.cast<SearchUserEntity>());
  }

  @override
  Future<ApiResult<List<FriendRequestEntity>>> getIncomingRequests() async {
    final result = await remoteDataSource.getIncomingRequests();
    return result.map((list) => list.cast<FriendRequestEntity>());
  }

  @override
  Future<ApiResult<List<FriendRequestEntity>>> getSentRequests() async {
    final result = await remoteDataSource.getSentRequests();
    return result.map((list) => list.cast<FriendRequestEntity>());
  }

  @override
  Future<ApiResult<String>> sendFriendRequest(String targetUserId) {
    return remoteDataSource.sendFriendRequest(targetUserId);
  }

  @override
  Future<ApiResult<String>> respondFriendRequest(int requestId, bool accept) {
    return remoteDataSource.respondFriendRequest(requestId, accept);
  }

  @override
  Future<ApiResult<String>> cancelFriendRequest(dynamic requestId) {
    return remoteDataSource.cancelFriendRequest(requestId);
  }

  @override
  Future<ApiResult<String>> removeFriend(String targetUserId) {
    return remoteDataSource.removeFriend(targetUserId);
  }

  @override
  Future<ApiResult<String>> blockUser(String targetUserId) {
    return remoteDataSource.blockUser(targetUserId);
  }

  @override
  Future<ApiResult<String>> unblockUser(String targetUserId) {
    return remoteDataSource.unblockUser(targetUserId);
  }

  @override
  Future<ApiResult<List<BlockedUserEntity>>> getBlockedUsers() async {
    final result = await remoteDataSource.getBlockedUsers();
    return result.map((list) => list.cast<BlockedUserEntity>());
  }

  @override
  Future<ApiResult<UserProfileEntity>> getUserProfile(String targetUserId) async {
    final result = await remoteDataSource.getUserProfile(targetUserId);
    return result.map((profile) => profile as UserProfileEntity);
  }
}
