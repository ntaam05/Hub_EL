import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/features/profile/data/models/user_profile_model.dart';
import 'package:hub_el_mobile/features/profile/domain/entities/user_profile_entity.dart';

void main() {
  group('UserProfileModel & Entity Unit Tests', () {
    test('UserProfileModel.fromJson parses complete JSON correctly', () {
      final json = {
        'id': 'user-123',
        'name': 'Hoàng Nhật Tâm',
        'fullName': 'Hoàng Nhật Tâm (Pro)',
        'username': 'tamhoang',
        'email': 'tam@example.com',
        'displayAvatar': 'https://example.com/avatar.jpg',
        'bio': 'Lập trình viên Flutter & Next.js',
        'interests': ['Lập trình', 'Tiếng Anh', 'Khoa học'],
        'socialLinks': [
          {'platform': 'github', 'url': 'https://github.com/tam'}
        ],
        'level': 5,
        'xp': 1250,
        'isPro': true,
        'role': 'student',
        'createdAt': '2026-01-15T10:00:00.000Z',
      };

      final model = UserProfileModel.fromJson(json);

      expect(model.id, 'user-123');
      expect(model.displayName, 'Hoàng Nhật Tâm (Pro)');
      expect(model.username, 'tamhoang');
      expect(model.displayUsername, '@tamhoang');
      expect(model.email, 'tam@example.com');
      expect(model.displayAvatar, 'https://example.com/avatar.jpg');
      expect(model.bio, 'Lập trình viên Flutter & Next.js');
      expect(model.hasBio, true);
      expect(model.interests.length, 3);
      expect(model.interests, contains('Lập trình'));
      expect(model.level, 5);
      expect(model.xp, 1250);
      expect(model.isPro, true);
      expect(model.initialLetter, 'H');
      expect(model.createdAt, isNotNull);
    });

    test('UserProfileModel fallback to name or email when fullName/username is null', () {
      final json = {
        'id': 'user-456',
        'name': null,
        'fullName': null,
        'username': null,
        'email': 'student@hub-el.com',
        'image': 'data:image/jpeg;base64,abc123',
      };

      final model = UserProfileModel.fromJson(json);

      expect(model.displayName, 'student');
      expect(model.displayUsername, '@member');
      expect(model.initialLetter, 'S');
      expect(model.hasBio, false);
      expect(model.displayAvatar, 'data:image/jpeg;base64,abc123');
      expect(model.interests, isEmpty);
      expect(model.level, 1);
      expect(model.xp, 0);
      expect(model.isPro, false);
    });

    test('UpdateProfileRequest.toJson creates correct map structure', () {
      const request = UpdateProfileRequest(
        fullName: 'Nguyễn Văn A',
        username: 'nguyenvana',
        bio: 'Học tiếng Anh mỗi ngày',
        interests: ['Tiếng Anh', 'Công nghệ'],
      );

      final map = request.toJson();

      expect(map['fullName'], 'Nguyễn Văn A');
      expect(map['username'], 'nguyenvana');
      expect(map['bio'], 'Học tiếng Anh mỗi ngày');
      expect(map['interests'], ['Tiếng Anh', 'Công nghệ']);
    });
  });
}

