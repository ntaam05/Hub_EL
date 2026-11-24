import '../../domain/entities/chat_message_entity.dart';

class ChatMessageModel extends ChatMessageEntity {
  const ChatMessageModel({
    required super.id,
    required super.senderId,
    super.receiverId,
    super.groupId,
    required super.content,
    super.messageType = 'TEXT',
    super.fileUrl,
    super.isGiftCard = false,
    required super.createdAt,
    super.senderName,
    super.senderAvatar,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    String? name;
    String? avatar;

    if (json['sender'] is Map<String, dynamic>) {
      final senderObj = json['sender'] as Map<String, dynamic>;
      name = senderObj['name'] as String?;
      avatar = (senderObj['avatar'] ?? senderObj['image']) as String?;
    } else {
      name = json['senderName'] as String?;
      avatar = (json['senderAvatar'] ?? json['avatar']) as String?;
    }

    DateTime parsedDate;
    if (json['createdAt'] != null) {
      parsedDate = DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now();
    } else {
      parsedDate = DateTime.now();
    }

    return ChatMessageModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      senderId: (json['senderId'] ?? '').toString(),
      receiverId: json['receiverId']?.toString(),
      groupId: json['groupId'] is int
          ? json['groupId']
          : int.tryParse(json['groupId']?.toString() ?? ''),
      content: (json['content'] ?? '').toString(),
      messageType: (json['messageType'] ?? 'TEXT').toString(),
      fileUrl: json['fileUrl']?.toString(),
      isGiftCard: json['isGiftCard'] == true,
      createdAt: parsedDate,
      senderName: name,
      senderAvatar: avatar,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'receiverId': receiverId,
      'groupId': groupId,
      'content': content,
      'messageType': messageType,
      'fileUrl': fileUrl,
      'isGiftCard': isGiftCard,
      'createdAt': createdAt.toIso8601String(),
      'senderName': senderName,
      'senderAvatar': senderAvatar,
    };
  }
}

