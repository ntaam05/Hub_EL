import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/network/dio_client.dart';
import '../models/chat_message_model.dart';
import '../models/owned_wiki_card_model.dart';

abstract class IChatRemoteDataSource {
  Future<ApiResult<List<ChatMessageModel>>> getChatHistory({
    required String targetId,
    bool isGroup = false,
  });

  Future<ApiResult<ChatMessageModel>> sendMessage({
    String? receiverId,
    int? groupId,
    required String content,
    String messageType = 'TEXT',
    String? fileUrl,
    bool isGiftCard = false,
  });

  Future<ApiResult<ChatMessageModel>> claimWikiGift(int messageId);

  Future<ApiResult<List<OwnedWikiCardModel>>> getOwnedWikiCards();
}

class ChatRemoteDataSource implements IChatRemoteDataSource {
  final DioClient dioClient;

  ChatRemoteDataSource({required this.dioClient});

  @override
  Future<ApiResult<List<ChatMessageModel>>> getChatHistory({
    required String targetId,
    bool isGroup = false,
  }) async {
    return dioClient.get<List<ChatMessageModel>>(
      ApiEndpoints.chatHistory,
      queryParameters: {
        'targetId': targetId,
        'isGroup': isGroup.toString(),
      },
      fromJson: (json) {
        if (json is List) {
          return json
              .map((item) => ChatMessageModel.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        return [];
      },
    );
  }

  @override
  Future<ApiResult<ChatMessageModel>> sendMessage({
    String? receiverId,
    int? groupId,
    required String content,
    String messageType = 'TEXT',
    String? fileUrl,
    bool isGiftCard = false,
  }) async {
    return dioClient.post<ChatMessageModel>(
      ApiEndpoints.chatSend,
      data: {
        'receiverId': receiverId,
        'groupId': groupId,
        'content': content,
        'messageType': messageType,
        'fileUrl': fileUrl,
        'isGiftCard': isGiftCard,
      },
      fromJson: (json) => ChatMessageModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<ChatMessageModel>> claimWikiGift(int messageId) async {
    return dioClient.post<ChatMessageModel>(
      ApiEndpoints.chatClaimGift,
      data: {'messageId': messageId},
      fromJson: (json) => ChatMessageModel.fromJson(json as Map<String, dynamic>),
    );
  }

  @override
  Future<ApiResult<List<OwnedWikiCardModel>>> getOwnedWikiCards() async {
    return dioClient.get<List<OwnedWikiCardModel>>(
      ApiEndpoints.chatCards,
      fromJson: (json) {
        if (json is List) {
          return json
              .map((item) => OwnedWikiCardModel.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        return [];
      },
    );
  }
}

