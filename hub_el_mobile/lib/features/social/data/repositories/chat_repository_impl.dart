import '../../../../core/network/api_result.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../../domain/entities/owned_wiki_card_entity.dart';
import '../../domain/repositories/chat_repository.dart';
import '../datasources/chat_remote_data_source.dart';

class ChatRepositoryImpl implements IChatRepository {
  final IChatRemoteDataSource remoteDataSource;

  ChatRepositoryImpl({required this.remoteDataSource});

  @override
  Future<ApiResult<List<ChatMessageEntity>>> getChatHistory({
    required String targetId,
    bool isGroup = false,
  }) async {
    final result = await remoteDataSource.getChatHistory(
      targetId: targetId,
      isGroup: isGroup,
    );
    switch (result) {
      case ApiSuccess(:final data):
        return ApiSuccess(data);
      case ApiFailure(:final message, :final statusCode):
        return ApiFailure(message: message, statusCode: statusCode);
    }
  }

  @override
  Future<ApiResult<ChatMessageEntity>> sendMessage({
    String? receiverId,
    int? groupId,
    required String content,
    String messageType = 'TEXT',
    String? fileUrl,
    bool isGiftCard = false,
  }) async {
    final result = await remoteDataSource.sendMessage(
      receiverId: receiverId,
      groupId: groupId,
      content: content,
      messageType: messageType,
      fileUrl: fileUrl,
      isGiftCard: isGiftCard,
    );
    switch (result) {
      case ApiSuccess(:final data):
        return ApiSuccess(data);
      case ApiFailure(:final message, :final statusCode):
        return ApiFailure(message: message, statusCode: statusCode);
    }
  }

  @override
  Future<ApiResult<ChatMessageEntity>> claimWikiGift(int messageId) async {
    final result = await remoteDataSource.claimWikiGift(messageId);
    switch (result) {
      case ApiSuccess(:final data):
        return ApiSuccess(data);
      case ApiFailure(:final message, :final statusCode):
        return ApiFailure(message: message, statusCode: statusCode);
    }
  }

  @override
  Future<ApiResult<List<OwnedWikiCardEntity>>> getOwnedWikiCards() async {
    final result = await remoteDataSource.getOwnedWikiCards();
    switch (result) {
      case ApiSuccess(:final data):
        return ApiSuccess(data);
      case ApiFailure(:final message, :final statusCode):
        return ApiFailure(message: message, statusCode: statusCode);
    }
  }
}
