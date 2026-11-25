import 'package:flutter/foundation.dart';
// ignore: library_prefixes
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../../core/constants/app_environment.dart';
import '../../../../core/storage/token_storage_service.dart';

/// Dịch vụ kết nối Socket.IO Realtime cho Chat
class ChatSocketService {
  final ITokenStorageService? tokenStorage;
  IO.Socket? _socket;
  String? _connectedUserId;

  ChatSocketService({this.tokenStorage});

  bool get isConnected => _socket?.connected ?? false;

  /// Kết nối tới máy chủ Socket.IO và tham gia phòng cá nhân
  Future<void> connect(String currentUserId, {String? token}) async {
    if (_socket != null && _socket!.connected && _connectedUserId == currentUserId) {
      return;
    }
    if (_socket != null && _connectedUserId != currentUserId) {
      disconnect();
    }

    _connectedUserId = currentUserId;
    final serverUrl = AppConfig.webSocketUrl;
    final authToken = token ?? await tokenStorage?.getAccessToken();

    debugPrint('🔌 [Socket.IO] Đang kết nối tới: $serverUrl cho User: $currentUserId (HasToken: ${authToken != null})');

    final builder = IO.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .disableAutoConnect()
        .enableReconnection()
        .setReconnectionAttempts(10)
        .setReconnectionDelay(1000);

    if (authToken != null && authToken.isNotEmpty) {
      builder.setAuth({'token': authToken});
      builder.setExtraHeaders({'Authorization': 'Bearer $authToken'});
    }

    _socket = IO.io(serverUrl, builder.build());

    _socket!.onConnect((_) {
      debugPrint('🟢 [Socket.IO] Kết nối thành công! Socket ID: ${_socket!.id}');
      // Tham gia phòng nhận tin nhắn của chính mình
      _socket!.emit('join_room', currentUserId);
    });

    _socket!.onDisconnect((_) {
      debugPrint('🔴 [Socket.IO] Đã ngắt kết nối');
    });

    _socket!.onConnectError((err) {
      debugPrint('⚠️ [Socket.IO] Lỗi kết nối: $err');
    });

    _socket!.connect();
  }

  /// Tham gia phòng nhóm
  void joinGroup(int groupId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('join_room', 'group_$groupId');
    }
  }

  /// Phát tin nhắn vừa gửi lên Socket để đối phương nhận realtime
  void emitSendMessage({
    required String receiverId,
    required Map<String, dynamic> message,
  }) {
    if (_socket != null && _socket!.connected) {
      debugPrint('📤 [Socket.IO] Emit send_message tới: $receiverId');
      _socket!.emit('send_message', {
        'receiverId': receiverId,
        'message': message,
      });
    } else {
      debugPrint('⚠️ [Socket.IO] Không thể emit vì chưa kết nối socket');
    }
  }

  /// Đăng ký hàm lắng nghe tin nhắn mới nhận được từ Socket
  void onReceiveMessage(void Function(Map<String, dynamic> data) onMessage) {
    _socket?.off('receive_message');
    _socket?.on('receive_message', (data) {
      debugPrint('📥 [Socket.IO] Nhận tin nhắn mới realtime: $data');
      if (data is Map<String, dynamic>) {
        onMessage(data);
      } else if (data is Map) {
        onMessage(Map<String, dynamic>.from(data));
      }
    });
  }

  /// Đăng ký hàm lắng nghe cập nhật hồ sơ / ảnh đại diện realtime
  void onProfileUpdated(void Function(Map<String, dynamic> data) onUpdated) {
    _socket?.off('profile_updated');
    _socket?.on('profile_updated', (data) {
      debugPrint('📥 [Socket.IO] Nhận cập nhật hồ sơ realtime');
      if (data is Map<String, dynamic>) {
        onUpdated(data);
      } else if (data is Map) {
        onUpdated(Map<String, dynamic>.from(data));
      }
    });
  }

  /// Ngắt kết nối socket
  void disconnect() {
    _socket?.off('receive_message');
    _socket?.off('profile_updated');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connectedUserId = null;
    debugPrint('🛑 [Socket.IO] Đã giải phóng Socket');
  }
}
