import '../../domain/entities/settings_entities.dart';

class SecurityInfoModel extends SecurityInfoEntity {
  const SecurityInfoModel({
    required super.isOAuth,
    required super.email,
    required super.hasPassword,
  });

  factory SecurityInfoModel.fromJson(Map<String, dynamic> json) {
    return SecurityInfoModel(
      isOAuth: json['isOAuth'] == true,
      email: json['email']?.toString() ?? '',
      hasPassword: json['hasPassword'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isOAuth': isOAuth,
      'email': email,
      'hasPassword': hasPassword,
    };
  }
}

class PrivacySettingsModel extends PrivacySettingsEntity {
  const PrivacySettingsModel({
    super.showOnline = true,
    super.onlineScope = 'everyone',
    super.publicProfile = true,
    super.profileScope = 'everyone',
    super.allowFriendRequests = true,
    super.showInventory = true,
    super.showRank = true,
  });

  factory PrivacySettingsModel.fromJson(Map<String, dynamic> json) {
    return PrivacySettingsModel(
      showOnline: json['showOnline'] is bool ? json['showOnline'] as bool : true,
      onlineScope: json['onlineScope']?.toString() ?? 'everyone',
      publicProfile: json['publicProfile'] is bool ? json['publicProfile'] as bool : true,
      profileScope: json['profileScope']?.toString() ?? 'everyone',
      allowFriendRequests: json['allowFriendRequests'] is bool ? json['allowFriendRequests'] as bool : true,
      showInventory: json['showInventory'] is bool ? json['showInventory'] as bool : true,
      showRank: json['showRank'] is bool ? json['showRank'] as bool : true,
    );
  }
}

class NotificationSettingsModel extends NotificationSettingsEntity {
  const NotificationSettingsModel({
    super.allowEmail = true,
    super.energy = true,
    super.friendReq = true,
    super.streak = true,
    super.wikiShare = true,
    super.dailyReminder = true,
    super.streakWarning = true,
    super.friendActivities = true,
    super.systemAnnouncements = true,
  });

  factory NotificationSettingsModel.fromJson(Map<String, dynamic> json) {
    return NotificationSettingsModel(
      allowEmail: json['allowEmail'] is bool ? json['allowEmail'] as bool : true,
      energy: json['energy'] is bool ? json['energy'] as bool : true,
      friendReq: json['friendReq'] is bool ? json['friendReq'] as bool : true,
      streak: json['streak'] is bool ? json['streak'] as bool : true,
      wikiShare: json['wikiShare'] is bool ? json['wikiShare'] as bool : true,
      dailyReminder: json['dailyReminder'] is bool ? json['dailyReminder'] as bool : true,
      streakWarning: json['streakWarning'] is bool ? json['streakWarning'] as bool : true,
      friendActivities: json['friendActivities'] is bool ? json['friendActivities'] as bool : true,
      systemAnnouncements: json['systemAnnouncements'] is bool ? json['systemAnnouncements'] as bool : true,
    );
  }
}

