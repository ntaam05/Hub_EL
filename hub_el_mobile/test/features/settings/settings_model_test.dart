import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/features/settings/data/models/settings_models.dart';
import 'package:hub_el_mobile/features/settings/domain/entities/settings_entities.dart';

void main() {
  group('Settings Models & Entities Unit Tests', () {
    test('SecurityInfoModel.fromJson parses security response correctly', () {
      final json = {
        'isOAuth': true,
        'email': 'student@gmail.com',
        'hasPassword': false,
      };

      final model = SecurityInfoModel.fromJson(json);

      expect(model.isOAuth, true);
      expect(model.email, 'student@gmail.com');
      expect(model.hasPassword, false);
    });

    test('PrivacySettingsModel parses and serializes correctly', () {
      final json = {
        'showOnline': true,
        'onlineScope': 'friends',
        'publicProfile': false,
        'profileScope': 'everyone',
        'allowFriendRequests': true,
        'showInventory': false,
        'showRank': true,
      };

      final model = PrivacySettingsModel.fromJson(json);

      expect(model.showOnline, true);
      expect(model.onlineScope, 'friends');
      expect(model.publicProfile, false);
      expect(model.allowFriendRequests, true);
      expect(model.showInventory, false);
      expect(model.showRank, true);

      final map = model.toJson();
      expect(map['showOnline'], true);
      expect(map['onlineScope'], 'friends');
      expect(map['publicProfile'], false);
    });

    test('NotificationSettingsModel parses and copies with changes correctly', () {
      final json = {
        'allowEmail': true,
        'energy': false,
        'friendReq': true,
        'streak': true,
        'wikiShare': false,
        'dailyReminder': true,
        'streakWarning': true,
        'friendActivities': true,
        'systemAnnouncements': false,
      };

      final model = NotificationSettingsModel.fromJson(json);

      expect(model.allowEmail, true);
      expect(model.energy, false);
      expect(model.friendReq, true);
      expect(model.wikiShare, false);
      expect(model.systemAnnouncements, false);

      final updated = model.copyWith(allowEmail: false, energy: true);
      expect(updated.allowEmail, false);
      expect(updated.energy, true);
      expect(updated.friendReq, true);
    });

    test('FeedbackEntity.toJson produces clean map with trimmed content', () {
      const feedback = FeedbackEntity(
        content: '  Ứng dụng rất mượt và giao diện đẹp!  ',
        category: 'Góp ý tính năng',
      );

      final json = feedback.toJson();

      expect(json['content'], 'Ứng dụng rất mượt và giao diện đẹp!');
      expect(json['category'], 'Góp ý tính năng');
    });
  });
}

