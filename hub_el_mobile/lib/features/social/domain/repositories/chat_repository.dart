import '../../../../core/network/api_result.dart';
import '../entities/chat_message_entity.dart';
import '../entities/owned_wiki_card_entity.dart';

abstract class IChatRepository {
  /// Lấy toàn bộ lịch sử tin nhắn của cuộc trò chuyện (1-1 hoặc nhóm)
  Future<ApiResult<List<ChatMessageEntity>>> getChatHistory({
    required String targetId,
    bool isGroup = false,
  });

  /// Gửi tin nhắn mới
  Future<ApiResult<ChatMessageEntity>> sendMessage({
    String? receiverId,
    int? groupId,
    required String content,
    String messageType = 'TEXT',
    String? fileUrl,
    bool isGiftCard = false,
  });

  /// Mở hộp quà thẻ Wiki được tặng
  Future<ApiResult<ChatMessageEntity>> claimWikiGift(int messageId);

  /// Lấy danh sách thẻ bài Wiki sở hữu để làm quà tặng
  Future<ApiResult<List<OwnedWikiCardEntity>>> getOwnedWikiCards();
}

