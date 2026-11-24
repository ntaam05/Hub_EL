import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/blocked_user_model.dart';
import '../models/friend_request_model.dart';
import '../models/friend_user_model.dart';
import '../models/search_user_model.dart';
import '../models/user_profile_model.dart';

abstract class IFriendsRemoteDataSource {
  Future<ApiResult<List<FriendUserModel>>> getFriendsList();
  Future<ApiResult<List<SearchUserModel>>> searchUsers(String query);
  Future<ApiResult<List<FriendRequestModel>>> getIncomingRequests();
  Future<ApiResult<List<FriendRequestModel>>> getSentRequests();
  Future<ApiResult<String>> sendFriendRequest(String targetUserId);
  Future<ApiResult<String>> respondFriendRequest(int requestId, bool accept);
  Future<ApiResult<String>> cancelFriendRequest(dynamic requestId);
  Future<ApiResult<String>> removeFriend(String targetUserId);
  Future<ApiResult<String>> blockUser(String targetUserId);
  Future<ApiResult<String>> unblockUser(String targetUserId);
  Future<ApiResult<List<BlockedUserModel>>> getBlockedUsers();
  Future<ApiResult<UserProfileModel>> getUserProfile(String targetUserId);
}

class FriendsRemoteDataSource implements IFriendsRemoteDataSource {
  final DioClient dioClient;

  FriendsRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<List<FriendUserModel>>> getFriendsList() async {
    return dioClient.get<List<FriendUserModel>>(
      ApiEndpoints.friendsList,
      fromJson: (json) {
        if (json is List) {
          return json
              .map((item) => FriendUserModel.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        return [];
      },
    );
  }

  @override
  Future<ApiResult<List<SearchUserModel>>> searchUsers(String query) async {
    return dioClient.get<List<SearchUserModel>>(
      ApiEndpoints.friendsSearch,
      queryParameters: {'q': query},
      fromJson: (json) {
        if (json is List) {
          return json
              .map((item) => SearchUserModel.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        return [];
      },
    );
  }

  @override
  Future<ApiResult<List<FriendRequestModel>>> getIncomingRequests() async {
    return dioClient.get<List<FriendRequestModel>>(
      ApiEndpoints.friendRequests,
      fromJson: (json) {
        if (json is List) {
          return json
              .map((item) => FriendRequestModel.fromJson(
                    item as Map<String, dynamic>,
                    isIncoming: true,
                  ))
              .toList();
        }
        return [];
      },
    );
  }

  @override
  Future<ApiResult<List<FriendRequestModel>>> getSentRequests() async {
    return dioClient.get<List<FriendRequestModel>>(
      ApiEndpoints.friendSentRequests,
      fromJson: (json) {
        if (json is List) {
          return json
              .map((item) => FriendRequestModel.fromJson(
                    item as Map<String, dynamic>,
                    isIncoming: false,
                  ))
              .toList();
        }
        return [];
      },
    );
  }

  @override
  Future<ApiResult<String>> sendFriendRequest(String targetUserId) async {
    final result = await dioClient.post<dynamic>(
      ApiEndpoints.sendFriendRequest,
      data: {'targetUserId': targetUserId},
    );

    return switch (result) {
      ApiSuccess(:final message) => ApiSuccess<String>(message ?? 'Đã gửi lời mời kết bạn.', message: message),
      ApiFailure(:final message, :final code, :final statusCode, :final details, :final exception) =>
        ApiFailure<String>(message: message, code: code, statusCode: statusCode, details: details, exception: exception),
    };
  }

  @override
  Future<ApiResult<String>> respondFriendRequest(int requestId, bool accept) async {
    final result = await dioClient.post<dynamic>(
      ApiEndpoints.respondFriendRequest(requestId),
      data: {'accept': accept},
    );

    return switch (result) {
      ApiSuccess(:final message) => ApiSuccess<String>(
          message ?? (accept ? 'Đã chấp nhận kết bạn.' : 'Đã xóa lời mời.'),
          message: message,
        ),
      ApiFailure(:final message, :final code, :final statusCode, :final details, :final exception) =>
        ApiFailure<String>(message: message, code: code, statusCode: statusCode, details: details, exception: exception),
    };
  }

  @override
  Future<ApiResult<String>> cancelFriendRequest(dynamic requestId) async {
    final result = await dioClient.delete<dynamic>(
      ApiEndpoints.cancelFriendRequest(requestId),
    );

    return switch (result) {
      ApiSuccess(:final message) => ApiSuccess<String>(message ?? 'Đã hủy lời mời kết bạn.', message: message),
      ApiFailure(:final message, :final code, :final statusCode, :final details, :final exception) =>
        ApiFailure<String>(message: message, code: code, statusCode: statusCode, details: details, exception: exception),
    };
  }

  @override
  Future<ApiResult<String>> removeFriend(String targetUserId) async {
    final result = await dioClient.delete<dynamic>(
      ApiEndpoints.removeFriend(targetUserId),
    );

    return switch (result) {
      ApiSuccess(:final message) => ApiSuccess<String>(message ?? 'Đã hủy kết bạn.', message: message),
      ApiFailure(:final message, :final code, :final statusCode, :final details, :final exception) =>
        ApiFailure<String>(message: message, code: code, statusCode: statusCode, details: details, exception: exception),
    };
  }

  @override
  Future<ApiResult<String>> blockUser(String targetUserId) async {
    final result = await dioClient.post<dynamic>(
      ApiEndpoints.blockUser(targetUserId),
    );

    return switch (result) {
      ApiSuccess(:final message) => ApiSuccess<String>(message ?? 'Đã chặn người dùng.', message: message),
      ApiFailure(:final message, :final code, :final statusCode, :final details, :final exception) =>
        ApiFailure<String>(message: message, code: code, statusCode: statusCode, details: details, exception: exception),
    };
  }

  @override
  Future<ApiResult<String>> unblockUser(String targetUserId) async {
    final result = await dioClient.delete<dynamic>(
      ApiEndpoints.unblockUser(targetUserId),
    );

    return switch (result) {
      ApiSuccess(:final message) => ApiSuccess<String>(message ?? 'Đã bỏ chặn người dùng.', message: message),
      ApiFailure(:final message, :final code, :final statusCode, :final details, :final exception) =>
        ApiFailure<String>(message: message, code: code, statusCode: statusCode, details: details, exception: exception),
    };
  }

  @override
  Future<ApiResult<List<BlockedUserModel>>> getBlockedUsers() async {
    return dioClient.get<List<BlockedUserModel>>(
      ApiEndpoints.blockedUsers,
      fromJson: (json) {
        if (json is List) {
          return json
              .map((item) => BlockedUserModel.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        return [];
      },
    );
  }

  @override
  Future<ApiResult<UserProfileModel>> getUserProfile(String targetUserId) async {
    return dioClient.get<UserProfileModel>(
      ApiEndpoints.userProfile(targetUserId),
      fromJson: (json) {
        if (json is Map<String, dynamic>) {
          return UserProfileModel.fromJson(json);
        }
        throw Exception('Dữ liệu hồ sơ người dùng không hợp lệ');
      },
    );
  }
}
