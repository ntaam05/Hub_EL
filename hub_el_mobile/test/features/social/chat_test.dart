import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/social/data/models/chat_message_model.dart';
import 'package:hub_el_mobile/features/social/data/models/owned_wiki_card_model.dart';
import 'package:hub_el_mobile/features/social/data/services/chat_socket_service.dart';
import 'package:hub_el_mobile/features/social/domain/entities/chat_message_entity.dart';
import 'package:hub_el_mobile/features/social/domain/entities/owned_wiki_card_entity.dart';
import 'package:hub_el_mobile/features/social/domain/repositories/chat_repository.dart';
import 'package:hub_el_mobile/features/social/presentation/cubit/chat_cubit.dart';
import 'package:hub_el_mobile/features/social/presentation/cubit/chat_state.dart';
import 'package:hub_el_mobile/features/social/presentation/widgets/chat_bubble.dart';
import 'package:hub_el_mobile/features/social/presentation/widgets/wiki_gift_picker_sheet.dart';

// Mock Socket Service
class MockChatSocketService extends ChatSocketService {
  void Function(Map<String, dynamic>)? onMessageCallback;
  final List<Map<String, dynamic>> emittedMessages = [];

  @override
  Future<void> connect(String currentUserId, {String? token}) async {}

  @override
  void onReceiveMessage(void Function(Map<String, dynamic> data) onMessage) {
    onMessageCallback = onMessage;
  }

  @override
  void emitSendMessage({
    required String receiverId,
    required Map<String, dynamic> message,
  }) {
    emittedMessages.add({'receiverId': receiverId, 'message': message});
  }

  @override
  void disconnect() {}
}

// Mock Chat Repository
class MockChatRepository implements IChatRepository {
  List<ChatMessageEntity> mockHistory = [];
  List<OwnedWikiCardEntity> mockCards = [];
  bool shouldFail = false;

  @override
  Future<ApiResult<List<ChatMessageEntity>>> getChatHistory({
    required String targetId,
    bool isGroup = false,
  }) async {
    if (shouldFail) {
      return const ApiFailure(message: 'Lỗi nạp tin nhắn', statusCode: 500);
    }
    return ApiSuccess(mockHistory);
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
    if (shouldFail) {
      return const ApiFailure(message: 'Lỗi gửi tin', statusCode: 400);
    }
    final msg = ChatMessageModel(
      id: 999,
      senderId: 'user_a',
      receiverId: receiverId,
      groupId: groupId,
      content: content,
      messageType: messageType,
      fileUrl: fileUrl,
      isGiftCard: isGiftCard,
      createdAt: DateTime.now(),
    );
    return ApiSuccess(msg);
  }

  @override
  Future<ApiResult<ChatMessageEntity>> claimWikiGift(int messageId) async {
    if (shouldFail) {
      return const ApiFailure(message: 'Lỗi mở quà', statusCode: 400);
    }
    final msg = ChatMessageModel(
      id: messageId,
      senderId: 'user_b',
      receiverId: 'user_a',
      content: 'Bạn đã nhận một thẻ Wiki!',
      messageType: 'WIKI_CARD',
      fileUrl: '{"id":10,"title":"Thẻ Rồng","rarity":"SSR","claimed":true}',
      isGiftCard: true,
      createdAt: DateTime.now(),
    );
    return ApiSuccess(msg);
  }

  @override
  Future<ApiResult<List<OwnedWikiCardEntity>>> getOwnedWikiCards() async {
    if (shouldFail) {
      return const ApiFailure(message: 'Lỗi nạp thẻ', statusCode: 500);
    }
    return ApiSuccess(mockCards);
  }
}

void main() {
  group('1. Data Models & Entity Parsing Tests', () {
    test('ChatMessageModel parses JSON accurately with sender details', () {
      final json = {
        'id': 101,
        'senderId': 'user_1',
        'receiverId': 'user_2',
        'content': 'Xin chào bạn nhé!',
        'messageType': 'TEXT',
        'createdAt': '2026-11-20T12:00:00.000Z',
        'sender': {
          'id': 'user_1',
          'name': 'Hoàng Tâm',
          'image': 'https://hub-el.com/avatar.png',
        },
      };

      final model = ChatMessageModel.fromJson(json);
      expect(model.id, 101);
      expect(model.senderId, 'user_1');
      expect(model.receiverId, 'user_2');
      expect(model.content, 'Xin chào bạn nhé!');
      expect(model.senderName, 'Hoàng Tâm');
      expect(model.senderAvatar, 'https://hub-el.com/avatar.png');
      expect(model.isSystem, false);
      expect(model.replyInfo, isNull);
    });

    test('ChatMessageEntity correctly extracts ReplyInfo format', () {
      final model = ChatMessageModel(
        id: 102,
        senderId: 'user_1',
        receiverId: 'user_2',
        content: '[REPLY:user_2]Bạn đang ở đâu?[/REPLY]Mình đang ở trường nè!',
        createdAt: DateTime.now(),
      );

      final reply = model.replyInfo;
      expect(reply, isNotNull);
      expect(reply!.senderId, 'user_2');
      expect(reply.replyText, 'Bạn đang ở đâu?');
      expect(reply.actualContent, 'Mình đang ở trường nè!');
    });

    test('ChatMessageEntity correctly extracts WikiGiftInfo format', () {
      final model = ChatMessageModel(
        id: 103,
        senderId: 'user_2',
        receiverId: 'user_1',
        content: 'Đã gửi tặng Hộp Quà Wiki',
        messageType: 'WIKI_CARD',
        fileUrl: '{"id":42,"title":"Hoa Anh Đào","rarity":"SSR","imageUrl":"https://hub-el.com/card.png","claimed":false}',
        isGiftCard: true,
        createdAt: DateTime.now(),
      );

      final gift = model.wikiGiftInfo;
      expect(gift, isNotNull);
      expect(gift!.id, 42);
      expect(gift.title, 'Hoa Anh Đào');
      expect(gift.rarity, 'SSR');
      expect(gift.claimed, false);
    });

    test('ChatMessageEntity correctly identifies System Message', () {
      final model = ChatMessageModel(
        id: 104,
        senderId: 'system',
        content: '[SYS:KICK:user_3] Tâm đã xóa Hùng khỏi nhóm',
        createdAt: DateTime.now(),
      );

      expect(model.isSystem, true);
      expect(model.systemMessageContent, 'Tâm đã xóa Hùng khỏi nhóm');
    });

    test('OwnedWikiCardModel parses JSON properly', () {
      final json = {
        'id': 7,
        'title': 'Văn hóa Trà Đạo',
        'rarity': 'UR',
        'imageUrl': 'https://hub-el.com/tea.png',
      };
      final model = OwnedWikiCardModel.fromJson(json);
      expect(model.id, 7);
      expect(model.title, 'Văn hóa Trà Đạo');
      expect(model.rarity, 'UR');
      expect(model.imageUrl, 'https://hub-el.com/tea.png');
    });
  });

  group('2. ChatCubit State Transitions & Realtime Tests', () {
    late MockChatRepository repository;
    late MockChatSocketService socketService;
    late ChatCubit cubit;

    setUp(() {
      repository = MockChatRepository();
      socketService = MockChatSocketService();
      cubit = ChatCubit(repository: repository, socketService: socketService);
    });

    tearDown(() {
      cubit.close();
    });

    test('Initial state is clean', () {
      expect(cubit.state, const ChatState());
    });

    test('initChat loads history and joins socket', () async {
      repository.mockHistory = [
        ChatMessageModel(
          id: 1,
          senderId: 'partner_1',
          receiverId: 'my_id',
          content: 'Hello!',
          createdAt: DateTime.now(),
        ),
      ];

      await cubit.initChat(currentUserId: 'my_id', partnerId: 'partner_1');

      expect(cubit.state.messages.length, 1);
      expect(cubit.state.messages.first.content, 'Hello!');
      expect(cubit.state.isLoading, false);
    });

    test('sendTextMessage adds to state and emits socket event', () async {
      await cubit.initChat(currentUserId: 'my_id', partnerId: 'partner_1');

      await cubit.sendTextMessage('Tin nhắn phản hồi từ app');

      expect(cubit.state.messages.length, 1);
      expect(cubit.state.messages.first.content, 'Tin nhắn phản hồi từ app');
      expect(socketService.emittedMessages.length, 1);
      expect(socketService.emittedMessages.first['receiverId'], 'partner_1');
    });

    test('sendTextMessage with reply quotes original message', () async {
      await cubit.initChat(currentUserId: 'my_id', partnerId: 'partner_1');

      final originalMsg = ChatMessageModel(
        id: 50,
        senderId: 'partner_1',
        receiverId: 'my_id',
        content: 'Bạn ăn cơm chưa?',
        createdAt: DateTime.now(),
      );

      cubit.setReplyingTo(originalMsg);
      expect(cubit.state.replyingTo, originalMsg);

      await cubit.sendTextMessage('Mình ăn rồi nhé!');
      expect(cubit.state.replyingTo, isNull);
      expect(cubit.state.messages.first.content, contains('[REPLY:partner_1]Bạn ăn cơm chưa?[/REPLY]Mình ăn rồi nhé!'));
    });

    test('Incoming socket message appends to state and deduplicates', () async {
      await cubit.initChat(currentUserId: 'my_id', partnerId: 'partner_1');

      // Giả lập Socket nhận tin nhắn từ đối phương
      socketService.onMessageCallback?.call({
        'id': 200,
        'senderId': 'partner_1',
        'receiverId': 'my_id',
        'content': 'Tin nhắn realtime nhận được!',
        'messageType': 'TEXT',
        'createdAt': DateTime.now().toIso8601String(),
      });

      expect(cubit.state.messages.length, 1);
      expect(cubit.state.messages.first.content, 'Tin nhắn realtime nhận được!');

      // Gửi lại tin nhắn trùng ID -> không được nhân đôi
      socketService.onMessageCallback?.call({
        'id': 200,
        'senderId': 'partner_1',
        'receiverId': 'my_id',
        'content': 'Tin nhắn realtime nhận được!',
        'messageType': 'TEXT',
        'createdAt': DateTime.now().toIso8601String(),
      });

      expect(cubit.state.messages.length, 1);
    });

    test('loadOwnedCards updates ownedCards list in state', () async {
      repository.mockCards = [
        const OwnedWikiCardEntity(id: 1, title: 'Thẻ 1', rarity: 'SSR'),
        const OwnedWikiCardEntity(id: 2, title: 'Thẻ 2', rarity: 'UR'),
      ];

      await cubit.loadOwnedCards();
      expect(cubit.state.ownedCards.length, 2);
      expect(cubit.state.isLoadingCards, false);
    });

    test('claimGift updates message in state on success', () async {
      repository.mockHistory = [
        ChatMessageModel(
          id: 55,
          senderId: 'partner_1',
          receiverId: 'my_id',
          content: 'Đã gửi tặng Hộp Quà Wiki',
          messageType: 'WIKI_CARD',
          fileUrl: '{"id":10,"title":"Thẻ Rồng","rarity":"SSR","claimed":false}',
          isGiftCard: true,
          createdAt: DateTime.now(),
        ),
      ];

      await cubit.initChat(currentUserId: 'my_id', partnerId: 'partner_1');
      await cubit.claimGift(55);

      expect(cubit.state.messages.first.wikiGiftInfo?.claimed, true);
      expect(cubit.state.successMessage, contains('Mở quà thành công'));
    });
  });

  group('3. Chat UI Widget Tests', () {
    testWidgets('ChatBubble renders text for my message and other message', (tester) async {
      final msg = ChatMessageModel(
        id: 1,
        senderId: 'user_me',
        receiverId: 'user_them',
        content: 'Nội dung tin nhắn test',
        createdAt: DateTime.now(),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ChatBubble(message: msg, isMe: true),
          ),
        ),
      );

      expect(find.text('Nội dung tin nhắn test'), findsOneWidget);
    });

    testWidgets('ChatBubble renders unopened Gift Card with tap prompt', (tester) async {
      final giftMsg = ChatMessageModel(
        id: 2,
        senderId: 'user_them',
        receiverId: 'user_me',
        content: 'Đã gửi tặng Hộp Quà Wiki',
        messageType: 'WIKI_CARD',
        fileUrl: '{"id":99,"title":"Thần Long","rarity":"SSR","claimed":false}',
        isGiftCard: true,
        createdAt: DateTime.now(),
      );

      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ChatBubble(
              message: giftMsg,
              isMe: false,
              onClaimGift: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Nhấn để mở quà!'), findsOneWidget);
      await tester.tap(find.text('Nhấn để mở quà!'));
      expect(tapped, true);
    });

    testWidgets('WikiGiftPickerSheet renders cards and selects on tap', (tester) async {
      const cards = [
        OwnedWikiCardEntity(id: 10, title: 'Mặt Trời Đỏ', rarity: 'UR'),
        OwnedWikiCardEntity(id: 20, title: 'Núi Phú Sĩ', rarity: 'SSR'),
      ];

      OwnedWikiCardEntity? selected;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              height: 600,
              child: WikiGiftPickerSheet(
                cards: cards,
                isLoading: false,
                onSelectCard: (c) => selected = c,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Mặt Trời Đỏ'), findsOneWidget);
      expect(find.text('Núi Phú Sĩ'), findsOneWidget);

      await tester.tap(find.text('Mặt Trời Đỏ'), warnIfMissed: false);
      await tester.pumpAndSettle();
      expect(selected?.id, 10);
    });
  });
}
