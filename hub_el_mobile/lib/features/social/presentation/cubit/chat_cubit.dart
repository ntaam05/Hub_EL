import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_result.dart';
import '../../data/models/chat_message_model.dart';
import '../../data/services/chat_socket_service.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../../domain/entities/owned_wiki_card_entity.dart';
import '../../domain/repositories/chat_repository.dart';
import 'chat_state.dart';

class ChatCubit extends Cubit<ChatState> {
  final IChatRepository repository;
  final ChatSocketService socketService;

  String? _currentUserId;
  String? _partnerId;
  bool _isGroup = false;

  ChatCubit({
    required this.repository,
    required this.socketService,
  }) : super(const ChatState());

  /// Khởi tạo phiên chat với một người bạn hoặc một nhóm
  Future<void> initChat({
    required String currentUserId,
    required String partnerId,
    bool isGroup = false,
  }) async {
    _currentUserId = currentUserId;
    _partnerId = partnerId;
    _isGroup = isGroup;

    emit(state.copyWith(isLoading: true, clearError: true));

    // Kết nối Socket.IO
    socketService.connect(currentUserId);
    if (isGroup) {
      final grpId = int.tryParse(partnerId);
      if (grpId != null) socketService.joinGroup(grpId);
    }

    // Lắng nghe tin nhắn realtime
    socketService.onReceiveMessage(_handleIncomingSocketMessage);

    // Tải lịch sử tin nhắn từ Backend REST API
    await loadMessages();
  }

  /// Tải lại lịch sử tin nhắn
  Future<void> loadMessages() async {
    if (_partnerId == null) return;

    final result = await repository.getChatHistory(
      targetId: _partnerId!,
      isGroup: _isGroup,
    );

    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(messages: data, isLoading: false));
      case ApiFailure(:final message):
        emit(state.copyWith(
          errorMessage: 'Không thể tải lịch sử trò chuyện: $message',
          isLoading: false,
        ));
    }
  }

  /// Xử lý khi nhận được tin nhắn realtime từ Socket.IO
  void _handleIncomingSocketMessage(Map<String, dynamic> data) {
    try {
      final newMsg = ChatMessageModel.fromJson(data);

      // Kiểm tra xem tin nhắn có thuộc về cuộc trò chuyện hiện tại không
      bool isRelevant = false;
      if (_isGroup) {
        final grpId = int.tryParse(_partnerId ?? '');
        isRelevant = newMsg.groupId != null && newMsg.groupId == grpId;
      } else {
        isRelevant = (newMsg.senderId == _partnerId && newMsg.receiverId == _currentUserId) ||
            (newMsg.senderId == _currentUserId && newMsg.receiverId == _partnerId);
      }

      if (!isRelevant) return;

      // Tránh trùng lặp tin nhắn (Deduplication)
      if (state.messages.any((m) => m.id == newMsg.id && newMsg.id != 0)) {
        return;
      }

      final updatedList = List<ChatMessageEntity>.from(state.messages)..add(newMsg);
      emit(state.copyWith(messages: updatedList));
    } catch (_) {
      // Bỏ qua nếu dữ liệu không phải format tin nhắn hợp lệ
    }
  }

  /// Thiết lập tin nhắn đang reply
  void setReplyingTo(ChatMessageEntity? message) {
    if (message == null) {
      emit(state.copyWith(clearReplying: true));
    } else {
      emit(state.copyWith(replyingTo: message));
    }
  }

  /// Gửi tin nhắn văn bản (hỗ trợ Reply)
  Future<void> sendTextMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || _currentUserId == null || _partnerId == null || state.isSending) {
      return;
    }

    String finalContent = trimmed;
    if (state.replyingTo != null) {
      final replyTarget = state.replyingTo!;
      final replySender = replyTarget.senderId == _currentUserId
          ? _currentUserId!
          : replyTarget.senderId;
      finalContent = '[REPLY:$replySender]${replyTarget.content}[/REPLY]$trimmed';
    }

    emit(state.copyWith(isSending: true, clearReplying: true));

    final int? groupId = _isGroup ? int.tryParse(_partnerId!) : null;
    final String? receiverId = _isGroup ? null : _partnerId;

    final result = await repository.sendMessage(
      receiverId: receiverId,
      groupId: groupId,
      content: finalContent,
      messageType: 'TEXT',
    );

    switch (result) {
      case ApiSuccess(:final data):
        // Thêm vào danh sách tin nhắn cục bộ
        final updated = List<ChatMessageEntity>.from(state.messages)..add(data);
        emit(state.copyWith(messages: updated, isSending: false));

        // Phát Socket realtime cho đối phương
        socketService.emitSendMessage(
          receiverId: _isGroup ? 'group_$groupId' : _partnerId!,
          message: (data as ChatMessageModel).toJson(),
        );
      case ApiFailure(:final message):
        emit(state.copyWith(
          errorMessage: 'Gửi tin nhắn thất bại: $message',
          isSending: false,
        ));
    }
  }

  /// Tải danh sách thẻ bài Wiki sở hữu để làm quà tặng
  Future<void> loadOwnedCards() async {
    emit(state.copyWith(isLoadingCards: true));
    final result = await repository.getOwnedWikiCards();
    switch (result) {
      case ApiSuccess(:final data):
        emit(state.copyWith(ownedCards: data, isLoadingCards: false));
      case ApiFailure(:final message):
        emit(state.copyWith(
          errorMessage: 'Không thể tải kho thẻ: $message',
          isLoadingCards: false,
        ));
    }
  }

  /// Gửi tặng thẻ bài Wiki (Hộp Quà SSR)
  Future<void> sendWikiGift(OwnedWikiCardEntity card) async {
    if (_currentUserId == null || _partnerId == null || state.isSending) return;

    emit(state.copyWith(isSending: true));

    final cardDataMap = {
      'id': card.id,
      'title': card.title,
      'rarity': card.rarity,
      'imageUrl': card.imageUrl,
      'claimed': false,
    };
    final cardDataStr = jsonEncode(cardDataMap);

    final int? groupId = _isGroup ? int.tryParse(_partnerId!) : null;
    final String? receiverId = _isGroup ? null : _partnerId;

    final result = await repository.sendMessage(
      receiverId: receiverId,
      groupId: groupId,
      content: 'Đã gửi tặng Hộp Quà Wiki',
      messageType: 'WIKI_CARD',
      fileUrl: cardDataStr,
      isGiftCard: true,
    );

    switch (result) {
      case ApiSuccess(:final data):
        final updated = List<ChatMessageEntity>.from(state.messages)..add(data);
        emit(state.copyWith(
          messages: updated,
          isSending: false,
          successMessage: 'Đã gửi Hộp Quà Thẻ Wiki thành công! ✨',
        ));

        // Phát Socket realtime
        socketService.emitSendMessage(
          receiverId: _isGroup ? 'group_$groupId' : _partnerId!,
          message: (data as ChatMessageModel).toJson(),
        );
      case ApiFailure(:final message):
        emit(state.copyWith(
          errorMessage: 'Không thể gửi quà tặng: $message',
          isSending: false,
        ));
    }
  }

  /// Mở hộp quà thẻ Wiki
  Future<void> claimGift(int messageId) async {
    emit(state.copyWith(claimingMessageId: messageId));

    final result = await repository.claimWikiGift(messageId);

    switch (result) {
      case ApiSuccess(:final data):
        // Cập nhật lại tin nhắn đó trong danh sách local
        final updated = state.messages.map((m) {
          if (m.id == messageId) {
            return data;
          }
          return m;
        }).toList();

        emit(state.copyWith(
          messages: updated,
          clearClaiming: true,
          successMessage: 'Mở quà thành công! Thẻ đã được chuyển vào kho đồ của bạn!',
        ));

        // Báo cho người gửi qua Socket
        socketService.emitSendMessage(
          receiverId: _isGroup ? 'group_$_partnerId' : _partnerId!,
          message: (data as ChatMessageModel).toJson(),
        );
      case ApiFailure(:final message):
        emit(state.copyWith(
          errorMessage: message,
          clearClaiming: true,
        ));
    }
  }

  void clearNotifications() {
    emit(state.copyWith(clearError: true, clearSuccess: true));
  }
}

