import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/features/courses/data/models/course_model.dart';
import 'package:hub_el_mobile/features/courses/presentation/screens/playlist_screen.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PlaylistScreen Widget Tests', () {
    testWidgets('Renders properly when passed a CoursePlaylistModel', (tester) async {
      tester.view.physicalSize = const Size(800, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final course = CoursePlaylistModel(
        id: 1,
        userId: 'user1',
        playlistId: 'PL12345',
        title: 'Lập trình Flutter toàn tập',
        channelTitle: 'Kênh Lập Trình',
        thumbnailUrl: '',
        totalVideos: 3,
        videoIds: 'vid1,vid2,vid3',
        videoScore: 40,
        summaryScore: 45,
        finalScore: 85,
        grade: 'Xuất sắc',
        isCompleted: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: PlaylistScreen(course: course),
        ),
      );
      await tester.pump();

      // Verify title & channel
      expect(find.text('CHI TIẾT KHÓA HỌC'), findsOneWidget);
      expect(find.text('Lập trình Flutter toàn tập'), findsOneWidget);
      expect(find.text('Kênh Lập Trình'), findsOneWidget);

      // Verify buttons
      expect(find.text('BẮT ĐẦU HỌC'), findsOneWidget);
      expect(find.text('ĐÃ LƯU'), findsOneWidget);

      // Verify scores
      expect(find.text('40/50'), findsOneWidget);
      expect(find.text('45/50'), findsOneWidget);
      expect(find.text('Xuất sắc'), findsOneWidget);

      // Let any pending microtasks finish before tear down
      await tester.pump(const Duration(milliseconds: 100));
    });

    testWidgets('Renders properly when opened from search result (VideoItemEntity)', (tester) async {
      tester.view.physicalSize = const Size(800, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      const searchItem = VideoItemEntity(
        videoId: 'PL_SEARCH_101',
        title: 'Khóa học Python cho người mới',
        channelTitle: 'Python Master',
        thumbnailUrl: '',
        isPlaylist: true,
        type: 'playlist',
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: PlaylistScreen(playlistItem: searchItem),
        ),
      );
      await tester.pump();

      // Verify title and channel from search entity
      expect(find.text('CHI TIẾT KHÓA HỌC'), findsOneWidget);
      expect(find.text('Khóa học Python cho người mới'), findsOneWidget);
      expect(find.text('Python Master'), findsOneWidget);

      // Since not saved yet, button should say 'LƯU KHÓA'
      expect(find.text('LƯU KHÓA'), findsOneWidget);

      // Let any pending microtasks finish before tear down
      await tester.pump(const Duration(milliseconds: 100));
    });
  });
}
