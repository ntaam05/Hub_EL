import 'package:equatable/equatable.dart';

/// Thông tin trạng thái bảo mật của tài khoản
class SecurityInfoEntity extends Equatable {
  final bool isOAuth;
  final String email;
  final bool hasPassword;

  const SecurityInfoEntity({
    required this.isOAuth,
    required this.email,
    required this.hasPassword,
  });

  @override
  List<Object?> get props => [isOAuth, email, hasPassword];
}

/// Cài đặt quyền riêng tư
class PrivacySettingsEntity extends Equatable {
  final bool showOnline;
  final String onlineScope; // 'everyone' | 'friends'
  final bool publicProfile;
  final String profileScope; // 'everyone' | 'friends'
  final bool allowFriendRequests;
  final bool showInventory;
  final bool showRank;

  const PrivacySettingsEntity({
    this.showOnline = true,
    this.onlineScope = 'everyone',
    this.publicProfile = true,
    this.profileScope = 'everyone',
    this.allowFriendRequests = true,
    this.showInventory = true,
    this.showRank = true,
  });

  PrivacySettingsEntity copyWith({
    bool? showOnline,
    String? onlineScope,
    bool? publicProfile,
    String? profileScope,
    bool? allowFriendRequests,
    bool? showInventory,
    bool? showRank,
  }) {
    return PrivacySettingsEntity(
      showOnline: showOnline ?? this.showOnline,
      onlineScope: onlineScope ?? this.onlineScope,
      publicProfile: publicProfile ?? this.publicProfile,
      profileScope: profileScope ?? this.profileScope,
      allowFriendRequests: allowFriendRequests ?? this.allowFriendRequests,
      showInventory: showInventory ?? this.showInventory,
      showRank: showRank ?? this.showRank,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'showOnline': showOnline,
      'onlineScope': onlineScope,
      'publicProfile': publicProfile,
      'profileScope': profileScope,
      'allowFriendRequests': allowFriendRequests,
      'showInventory': showInventory,
      'showRank': showRank,
    };
  }

  @override
  List<Object?> get props => [
        showOnline,
        onlineScope,
        publicProfile,
        profileScope,
        allowFriendRequests,
        showInventory,
        showRank,
      ];
}

/// Cài đặt nhận thông báo
class NotificationSettingsEntity extends Equatable {
  final bool allowEmail;
  final bool energy;
  final bool friendReq;
  final bool streak;
  final bool wikiShare;
  final bool dailyReminder;
  final bool streakWarning;
  final bool friendActivities;
  final bool systemAnnouncements;

  const NotificationSettingsEntity({
    this.allowEmail = true,
    this.energy = true,
    this.friendReq = true,
    this.streak = true,
    this.wikiShare = true,
    this.dailyReminder = true,
    this.streakWarning = true,
    this.friendActivities = true,
    this.systemAnnouncements = true,
  });

  NotificationSettingsEntity copyWith({
    bool? allowEmail,
    bool? energy,
    bool? friendReq,
    bool? streak,
    bool? wikiShare,
    bool? dailyReminder,
    bool? streakWarning,
    bool? friendActivities,
    bool? systemAnnouncements,
  }) {
    return NotificationSettingsEntity(
      allowEmail: allowEmail ?? this.allowEmail,
      energy: energy ?? this.energy,
      friendReq: friendReq ?? this.friendReq,
      streak: streak ?? this.streak,
      wikiShare: wikiShare ?? this.wikiShare,
      dailyReminder: dailyReminder ?? this.dailyReminder,
      streakWarning: streakWarning ?? this.streakWarning,
      friendActivities: friendActivities ?? this.friendActivities,
      systemAnnouncements: systemAnnouncements ?? this.systemAnnouncements,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'allowEmail': allowEmail,
      'energy': energy,
      'friendReq': friendReq,
      'streak': streak,
      'wikiShare': wikiShare,
      'dailyReminder': dailyReminder,
      'streakWarning': streakWarning,
      'friendActivities': friendActivities,
      'systemAnnouncements': systemAnnouncements,
    };
  }

  @override
  List<Object?> get props => [
        allowEmail,
        energy,
        friendReq,
        streak,
        wikiShare,
        dailyReminder,
        streakWarning,
        friendActivities,
        systemAnnouncements,
      ];
}

/// Dữ liệu gửi phản hồi và báo lỗi
class FeedbackEntity extends Equatable {
  final String content;
  final String? category;

  const FeedbackEntity({
    required this.content,
    this.category,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'content': content.trim()};
    if (category != null && category!.trim().isNotEmpty) {
      map['category'] = category!.trim();
    }
    return map;
  }

  @override
  List<Object?> get props => [content, category];
}

