import 'package:equatable/equatable.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../../domain/entities/owned_wiki_card_entity.dart';

class ChatState extends Equatable {
  final List<ChatMessageEntity> messages;
  final bool isLoading;
  final bool isSending;
  final String? errorMessage;
  final ChatMessageEntity? replyingTo;
  final List<OwnedWikiCardEntity> ownedCards;
  final bool isLoadingCards;
  final int? claimingMessageId;
  final String? successMessage;

  const ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isSending = false,
    this.errorMessage,
    this.replyingTo,
    this.ownedCards = const [],
    this.isLoadingCards = false,
    this.claimingMessageId,
    this.successMessage,
  });

  ChatState copyWith({
    List<ChatMessageEntity>? messages,
    bool? isLoading,
    bool? isSending,
    String? errorMessage,
    bool clearError = false,
    ChatMessageEntity? replyingTo,
    bool clearReplying = false,
    List<OwnedWikiCardEntity>? ownedCards,
    bool? isLoadingCards,
    int? claimingMessageId,
    bool clearClaiming = false,
    String? successMessage,
    bool clearSuccess = false,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      replyingTo: clearReplying ? null : (replyingTo ?? this.replyingTo),
      ownedCards: ownedCards ?? this.ownedCards,
      isLoadingCards: isLoadingCards ?? this.isLoadingCards,
      claimingMessageId: clearClaiming
          ? null
          : (claimingMessageId ?? this.claimingMessageId),
      successMessage: clearSuccess
          ? null
          : (successMessage ?? this.successMessage),
    );
  }

  @override
  List<Object?> get props => [
        messages,
        isLoading,
        isSending,
        errorMessage,
        replyingTo,
        ownedCards,
        isLoadingCards,
        claimingMessageId,
        successMessage,
      ];
}

