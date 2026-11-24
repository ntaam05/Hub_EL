import 'dart:convert';
import 'package:equatable/equatable.dart';

/// Thông tin trích xuất từ tin nhắn Reply
class ReplyInfo extends Equatable {
  final String senderId;
  final String replyText;
  final String actualContent;

  const ReplyInfo({
    required this.senderId,
    required this.replyText,
    required this.actualContent,
  });

  @override
  List<Object?> get props => [senderId, replyText, actualContent];
}

/// Thông tin trích xuất từ thẻ Wiki quà tặng
class WikiGiftInfo extends Equatable {
  final int id;
  final String title;
  final String rarity;
  final String? imageUrl;
  final bool claimed;

  const WikiGiftInfo({
    required this.id,
    required this.title,
    required this.rarity,
    this.imageUrl,
    required this.claimed,
  });

  @override
  List<Object?> get props => [id, title, rarity, imageUrl, claimed];
}

/// Thực thể đại diện cho một tin nhắn Chat
class ChatMessageEntity extends Equatable {
  final int id;
  final String senderId;
  final String? receiverId;
  final int? groupId;
  final String content;
  final String messageType; // TEXT | IMAGE | WIKI_CARD | SHARE_VIDEO
  final String? fileUrl;
  final bool isGiftCard;
  final DateTime createdAt;
  final String? senderName;
  final String? senderAvatar;

  const ChatMessageEntity({
    required this.id,
    required this.senderId,
    this.receiverId,
    this.groupId,
    required this.content,
    this.messageType = 'TEXT',
    this.fileUrl,
    this.isGiftCard = false,
    required this.createdAt,
    this.senderName,
    this.senderAvatar,
  });

  /// Kiểm tra tin nhắn hệ thống
  bool get isSystem => content.startsWith('[SYS:');

  /// Lấy nội dung hiển thị cho tin nhắn hệ thống
  String get systemMessageContent {
    if (!isSystem) return content;
    final endIdx = content.indexOf(']');
    if (endIdx != -1) {
      return content.substring(endIdx + 1).trim();
    }
    return content;
  }

  /// Phân tích tin nhắn reply (định dạng [REPLY:senderId]cũ[/REPLY]mới)
  ReplyInfo? get replyInfo {
    if (!content.startsWith('[REPLY:')) return null;
    final idEndIdx = content.indexOf(']');
    if (idEndIdx == -1) return null;
    final senderId = content.substring(7, idEndIdx);

    final textEndIdx = content.indexOf('[/REPLY]');
    if (textEndIdx == -1) return null;
    final replyText = content.substring(idEndIdx + 1, textEndIdx);
    final actual = content.substring(textEndIdx + 8);

    return ReplyInfo(
      senderId: senderId,
      replyText: replyText,
      actualContent: actual,
    );
  }

  /// Phân tích thông tin thẻ Wiki (nếu là WIKI_CARD)
  WikiGiftInfo? get wikiGiftInfo {
    if (messageType != 'WIKI_CARD' || fileUrl == null || fileUrl!.isEmpty) {
      return null;
    }
    try {
      final map = jsonDecode(fileUrl!) as Map<String, dynamic>;
      return WikiGiftInfo(
        id: map['id'] is int ? map['id'] : int.tryParse(map['id'].toString()) ?? 0,
        title: map['title'] ?? 'Thẻ Wiki',
        rarity: map['rarity'] ?? 'N',
        imageUrl: map['imageUrl'],
        claimed: map['claimed'] == true,
      );
    } catch (_) {
      return null;
    }
  }

  ChatMessageEntity copyWith({
    int? id,
    String? senderId,
    String? receiverId,
    int? groupId,
    String? content,
    String? messageType,
    String? fileUrl,
    bool? isGiftCard,
    DateTime? createdAt,
    String? senderName,
    String? senderAvatar,
  }) {
    return ChatMessageEntity(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      receiverId: receiverId ?? this.receiverId,
      groupId: groupId ?? this.groupId,
      content: content ?? this.content,
      messageType: messageType ?? this.messageType,
      fileUrl: fileUrl ?? this.fileUrl,
      isGiftCard: isGiftCard ?? this.isGiftCard,
      createdAt: createdAt ?? this.createdAt,
      senderName: senderName ?? this.senderName,
      senderAvatar: senderAvatar ?? this.senderAvatar,
    );
  }

  @override
  List<Object?> get props => [
        id,
        senderId,
        receiverId,
        groupId,
        content,
        messageType,
        fileUrl,
        isGiftCard,
        createdAt,
        senderName,
        senderAvatar,
      ];
}

