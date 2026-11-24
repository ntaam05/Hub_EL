import '../../../../core/network/api_result.dart';
import '../entities/friend_user_entity.dart';
import '../entities/search_user_entity.dart';
import '../entities/friend_request_entity.dart';
import '../entities/blocked_user_entity.dart';
import '../entities/user_profile_entity.dart';

/// Hợp đồng Repository cho nghiệp vụ Friends & Social Profile
abstract class IFriendsRepository {
  /// Lấy danh sách bạn bè
  Future<ApiResult<List<FriendUserEntity>>> getFriendsList();

  /// Tìm kiếm người dùng theo tên hoặc username
  Future<ApiResult<List<SearchUserEntity>>> searchUsers(String query);

  /// Lấy danh sách lời mời kết bạn nhận được
  Future<ApiResult<List<FriendRequestEntity>>> getIncomingRequests();

  /// Lấy danh sách lời mời kết bạn đã gửi
  Future<ApiResult<List<FriendRequestEntity>>> getSentRequests();

  /// Gửi lời mời kết bạn
  Future<ApiResult<String>> sendFriendRequest(String targetUserId);

  /// Chấp nhận (accept=true) hoặc từ chối (accept=false) lời mời kết bạn
  Future<ApiResult<String>> respondFriendRequest(int requestId, bool accept);

  /// Hủy lời mời kết bạn đã gửi
  Future<ApiResult<String>> cancelFriendRequest(dynamic requestId);

  /// Hủy kết bạn với một người dùng
  Future<ApiResult<String>> removeFriend(String targetUserId);

  /// Chặn một người dùng
  Future<ApiResult<String>> blockUser(String targetUserId);

  /// Bỏ chặn một người dùng
  Future<ApiResult<String>> unblockUser(String targetUserId);

  /// Lấy danh sách người dùng đã bị chặn
  Future<ApiResult<List<BlockedUserEntity>>> getBlockedUsers();

  /// Lấy hồ sơ chi tiết người dùng khác kèm quyền riêng tư
  Future<ApiResult<UserProfileEntity>> getUserProfile(String targetUserId);
}

