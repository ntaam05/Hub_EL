import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../domain/entities/chat_message_entity.dart';

class ChatBubble extends StatelessWidget {
  final ChatMessageEntity message;
  final bool isMe;
  final bool isClaiming;
  final VoidCallback? onReply;
  final VoidCallback? onClaimGift;

  const ChatBubble({
    super.key,
    required this.message,
    required this.isMe,
    this.isClaiming = false,
    this.onReply,
    this.onClaimGift,
  });

  Color _getRarityColor(String rarity) {
    switch (rarity.toUpperCase()) {
      case 'N':
        return Colors.blueGrey;
      case 'R':
        return const Color(0xFF3B82F6);
      case 'SR':
        return const Color(0xFFA855F7);
      case 'SSR':
        return const Color(0xFFF59E0B);
      case 'UR':
        return const Color(0xFFEF4444);
      case 'LR':
        return const Color(0xFF06B6D4);
      case 'MR':
        return const Color(0xFF10B981);
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    // 1. Tin nhắn hệ thống (System Message)
    if (message.isSystem) {
      return Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Text(
            message.systemMessageContent,
            style: GoogleFonts.plusJakartaSans(
              color: const Color(0xFF94A3B8),
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
    }

    final reply = message.replyInfo;
    final timeStr = DateFormat('HH:mm').format(message.createdAt.toLocal());

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Avatar người gửi (nếu không phải là mình)
          if (!isMe) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: const Color(0xFF334155),
              backgroundImage: safeGetImageProvider(message.senderAvatar),
              child: message.senderAvatar == null || message.senderAvatar!.isEmpty
                  ? const Icon(LucideIcons.user, size: 14, color: Colors.white70)
                  : null,
            ),
            const SizedBox(width: 8),
          ],

          // Khung bong bóng tin nhắn
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                // Tên người gửi nếu là tin nhắn trong nhóm
                if (!isMe && message.groupId != null && message.senderName != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 2),
                    child: Text(
                      message.senderName!,
                      style: GoogleFonts.plusJakartaSans(
                        color: const Color(0xFF94A3B8),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),

                GestureDetector(
                  onLongPress: onReply,
                  child: Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75,
                    ),
                    decoration: BoxDecoration(
                      color: isMe
                          ? const Color(0xFF2563EB)
                          : const Color(0xFF1E293B),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: isMe ? const Radius.circular(18) : const Radius.circular(4),
                        bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(18),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isMe
                              ? const Color(0xFF2563EB).withValues(alpha: 0.2)
                              : Colors.black.withValues(alpha: 0.15),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Trích dẫn Reply
                        if (reply != null) ...[
                          Container(
                            margin: const EdgeInsets.only(top: 8, left: 8, right: 8, bottom: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isMe
                                  ? Colors.blue.shade800.withValues(alpha: 0.6)
                                  : const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(10),
                              border: Border(
                                left: BorderSide(
                                  color: isMe ? Colors.white70 : const Color(0xFF38BDF8),
                                  width: 3,
                                ),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      LucideIcons.reply,
                                      size: 11,
                                      color: isMe ? Colors.white70 : const Color(0xFF38BDF8),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      isMe ? 'Bạn đã trả lời' : 'Đã trả lời',
                                      style: GoogleFonts.plusJakartaSans(
                                        color: isMe ? Colors.white70 : const Color(0xFF38BDF8),
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  reply.replyText,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.plusJakartaSans(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        // Nội dung chính theo kiểu tin nhắn
                        _buildMessageContent(context, reply),
                      ],
                    ),
                  ),
                ),

                // Dòng thời gian và nút Trả lời
                Padding(
                  padding: const EdgeInsets.only(top: 2, left: 4, right: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        timeStr,
                        style: GoogleFonts.plusJakartaSans(
                          color: const Color(0xFF64748B),
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: onReply,
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(LucideIcons.reply, size: 12, color: Color(0xFF64748B)),
                              const SizedBox(width: 4),
                              Text(
                                'Trả lời',
                                style: GoogleFonts.plusJakartaSans(
                                  color: const Color(0xFF64748B),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageContent(BuildContext context, ReplyInfo? reply) {
    // 2. Tin nhắn Thẻ Wiki (Hộp quà hoặc Thẻ)
    if (message.messageType == 'WIKI_CARD') {
      final cardInfo = message.wikiGiftInfo;
      if (cardInfo != null) {
        // Hộp quà chưa mở
        if (message.isGiftCard && !cardInfo.claimed) {
          return GestureDetector(
            onTap: (!isMe && !isClaiming) ? onClaimGift : null,
            child: Container(
              width: 190,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isClaiming)
                    const SizedBox(
                      width: 36,
                      height: 36,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                    )
                  else
                    const Icon(LucideIcons.gift, size: 40, color: Colors.white),
                  const SizedBox(height: 8),
                  Text(
                    isMe ? 'Hộp Quà Thẻ Wiki' : 'Nhấn để mở quà!',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isMe ? 'Chờ đối phương mở quà' : 'Chứa 1 Thẻ Tri Thức ngẫu nhiên',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      color: Colors.white70,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        // Thẻ Wiki đã mở hoặc chia sẻ thông thường
        final rarityColor = _getRarityColor(cardInfo.rarity);
        return Container(
          width: 200,
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: rarityColor.withValues(alpha: 0.5)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                child: cardInfo.imageUrl != null && cardInfo.imageUrl!.isNotEmpty
                    ? Image.network(
                        cardInfo.imageUrl!,
                        height: 120,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          height: 120,
                          color: const Color(0xFF1E293B),
                          child: const Center(
                            child: Icon(LucideIcons.sparkles, color: Colors.white30, size: 36),
                          ),
                        ),
                      )
                    : Container(
                        height: 120,
                        color: const Color(0xFF1E293B),
                        child: const Center(
                          child: Icon(LucideIcons.sparkles, color: Colors.white30, size: 36),
                        ),
                      ),
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: rarityColor,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            cardInfo.rarity,
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        if (cardInfo.claimed)
                          Row(
                            children: [
                              const Icon(LucideIcons.checkCircle2, size: 12, color: Color(0xFF22C55E)),
                              const SizedBox(width: 4),
                              Text(
                                'Đã nhận',
                                style: GoogleFonts.plusJakartaSans(
                                  color: const Color(0xFF22C55E),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      cardInfo.title,
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      message.isGiftCard ? 'Đã lưu vào bộ sưu tập' : 'Thẻ Tri Thức Wiki',
                      style: GoogleFonts.plusJakartaSans(
                        color: const Color(0xFF94A3B8),
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }
    }

    // 3. Tin nhắn hình ảnh (IMAGE - hỗ trợ Base64 & Network URL)
    if (message.messageType == 'IMAGE' && message.fileUrl != null && message.fileUrl!.isNotEmpty) {
      final url = message.fileUrl!;
      Widget imageWidget;
      if (url.startsWith('data:image')) {
        try {
          final base64String = url.split(',').last;
          final bytes = base64Decode(base64String);
          imageWidget = Image.memory(
            bytes,
            width: 220,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => const Padding(
              padding: EdgeInsets.all(12),
              child: Text('Lỗi tải ảnh', style: TextStyle(color: Colors.white70)),
            ),
          );
        } catch (_) {
          imageWidget = const Padding(
            padding: EdgeInsets.all(12),
            child: Text('Lỗi định dạng ảnh', style: TextStyle(color: Colors.white70)),
          );
        }
      } else {
        imageWidget = Image.network(
          url,
          width: 220,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => const Padding(
            padding: EdgeInsets.all(12),
            child: Text('Lỗi tải ảnh', style: TextStyle(color: Colors.white70)),
          ),
        );
      }

      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: imageWidget,
      );
    }

    // 4. Tin nhắn văn bản thông thường (TEXT)
    final textToShow = reply != null ? reply.actualContent : message.content;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Text(
        textToShow,
        style: GoogleFonts.plusJakartaSans(
          color: Colors.white,
          fontSize: 14,
          height: 1.35,
        ),
      ),
    );
  }
}
