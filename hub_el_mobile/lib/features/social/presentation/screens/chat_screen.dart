import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../../authentication/presentation/bloc/auth_bloc.dart';
import '../../../authentication/presentation/bloc/auth_state.dart';
import '../cubit/chat_cubit.dart';
import '../cubit/chat_state.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/wiki_gift_picker_sheet.dart';

class ChatScreen extends StatefulWidget {
  final String partnerId;
  final String partnerName;
  final String? partnerAvatar;
  final bool isOnline;
  final bool isGroup;
  final String? currentUserId;

  const ChatScreen({
    super.key,
    required this.partnerId,
    required this.partnerName,
    this.partnerAvatar,
    this.isOnline = false,
    this.isGroup = false,
    this.currentUserId,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late String _myId;

  @override
  void initState() {
    super.initState();

    // Lấy currentUserId
    if (widget.currentUserId != null && widget.currentUserId!.isNotEmpty) {
      _myId = widget.currentUserId!;
    } else {
      final authState = context.read<AuthBloc>().state;
      if (authState is Authenticated) {
        _myId = authState.user.id;
      } else {
        _myId = '';
      }
    }

    // Khởi tạo ChatCubit
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_myId.isNotEmpty) {
        context.read<ChatCubit>().initChat(
              currentUserId: _myId,
              partnerId: widget.partnerId,
              isGroup: widget.isGroup,
            );
      }
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage() {
    final text = _textController.text;
    if (text.trim().isEmpty) return;
    _textController.clear();
    context.read<ChatCubit>().sendTextMessage(text);
    _scrollToBottom();
  }

  void _openGiftSheet(ChatCubit cubit, ChatState state) {
    cubit.loadOwnedCards();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return BlocBuilder<ChatCubit, ChatState>(
          bloc: cubit,
          builder: (ctx, sheetState) {
            return WikiGiftPickerSheet(
              cards: sheetState.ownedCards,
              isLoading: sheetState.isLoadingCards,
              onSelectCard: (card) {
                cubit.sendWikiGift(card);
                _scrollToBottom();
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<ChatCubit>();

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 1,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 19,
                  backgroundColor: const Color(0xFF334155),
                  backgroundImage: safeGetImageProvider(widget.partnerAvatar),
                  child: widget.partnerAvatar == null || widget.partnerAvatar!.isEmpty
                      ? const Icon(LucideIcons.user, size: 20, color: Colors.white70)
                      : null,
                ),
                if (widget.isOnline && !widget.isGroup)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 11,
                      height: 11,
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF0F172A), width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.partnerName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    widget.isGroup
                        ? 'Nhóm học tập'
                        : (widget.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'),
                    style: GoogleFonts.plusJakartaSans(
                      color: widget.isOnline
                          ? const Color(0xFF22C55E)
                          : const Color(0xFF94A3B8),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: BlocConsumer<ChatCubit, ChatState>(
        listener: (context, state) {
          if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: Colors.red.shade700,
              ),
            );
            cubit.clearNotifications();
          }
          if (state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage!),
                backgroundColor: const Color(0xFF059669),
              ),
            );
            cubit.clearNotifications();
          }
          _scrollToBottom();
        },
        builder: (context, state) {
          return Column(
            children: [
              // 1. Danh sách tin nhắn
              Expanded(
                child: state.isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
                      )
                    : state.messages.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 64,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E293B),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    LucideIcons.messageCircle,
                                    size: 32,
                                    color: Color(0xFF38BDF8),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Hãy gửi lời chào đến ${widget.partnerName}! 👋',
                                  style: GoogleFonts.plusJakartaSans(
                                    color: const Color(0xFF94A3B8),
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                            itemCount: state.messages.length,
                            itemBuilder: (context, index) {
                              final msg = state.messages[index];
                              final isMe = msg.senderId == _myId;
                              final isClaiming = state.claimingMessageId == msg.id;

                              return ChatBubble(
                                key: ValueKey('msg_${msg.id}_$index'),
                                message: msg,
                                isMe: isMe,
                                isClaiming: isClaiming,
                                onReply: () => cubit.setReplyingTo(msg),
                                onClaimGift: () => cubit.claimGift(msg.id),
                              );
                            },
                          ),
              ),

              // 2. Thanh hiển thị tin nhắn đang trả lời (Reply Bar)
              if (state.replyingTo != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E293B),
                    border: Border(
                      top: BorderSide(color: Color(0xFF334155)),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 3,
                        height: 28,
                        color: const Color(0xFF38BDF8),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              state.replyingTo!.senderId == _myId
                                  ? 'Đang trả lời chính mình'
                                  : 'Đang trả lời ${widget.partnerName}',
                              style: GoogleFonts.plusJakartaSans(
                                color: const Color(0xFF38BDF8),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              state.replyingTo!.content,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.plusJakartaSans(
                                color: const Color(0xFF94A3B8),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.x, size: 16, color: Color(0xFF94A3B8)),
                        onPressed: () => cubit.setReplyingTo(null),
                      ),
                    ],
                  ),
                ),
              ],

              // 3. Thanh nhập tin nhắn (Input Bar)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: const BoxDecoration(
                  color: Color(0xFF0F172A),
                  border: Border(top: BorderSide(color: Color(0xFF1E293B))),
                ),
                child: SafeArea(
                  top: false,
                  child: Row(
                    children: [
                      // Nút Tặng Thẻ Wiki
                      IconButton(
                        icon: const Icon(LucideIcons.sparkles, color: Color(0xFFA855F7)),
                        tooltip: 'Tặng Thẻ Wiki',
                        onPressed: () => _openGiftSheet(cubit, state),
                      ),

                      // Ô nhập tin nhắn
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: const Color(0xFF334155)),
                          ),
                          child: TextField(
                            controller: _textController,
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Nhập tin nhắn...',
                              hintStyle: GoogleFonts.plusJakartaSans(
                                color: const Color(0xFF64748B),
                                fontSize: 14,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                            onSubmitted: (_) => _sendMessage(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Nút Gửi
                      Container(
                        decoration: const BoxDecoration(
                          color: Color(0xFF2563EB),
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: state.isSending
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(LucideIcons.send, size: 18, color: Colors.white),
                          onPressed: state.isSending ? null : _sendMessage,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
