import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/learning/data/models/quiz_question_model.dart';
import 'package:hub_el_mobile/features/learning/data/models/quiz_result_model.dart';
import 'package:hub_el_mobile/features/learning/data/models/video_item_model.dart';
import 'package:hub_el_mobile/features/learning/data/models/video_progress_model.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/quiz_question_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/quiz_result_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_progress_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/repositories/learning_repository.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/generate_quiz_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/submit_quiz_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_related_videos_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_video_detail_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_video_progress_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/mark_video_completed_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/search_videos_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/sync_video_progress_usecase.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/quiz/quiz_bloc.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/quiz/quiz_event.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/quiz/quiz_state.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/search/search_bloc.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/search/search_event.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/search/search_state.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/watch/watch_bloc.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/watch/watch_event.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/watch/watch_state.dart';

class MockLearningRepository implements ILearningRepository {
  bool shouldFail = false;
  bool isBanned = false;
  int mockLastWatched = 0;
  bool mockIsCompleted = false;

  @override
  Future<ApiResult<VideoSearchResultEntity>> searchVideos(String query, {String? pageToken}) async {
    if (shouldFail) {
      return const ApiFailure(message: 'Từ khóa không hợp lệ');
    }
    return const ApiSuccess(
      VideoSearchResultEntity(
        items: [
          VideoItemEntity(
            videoId: 'vid1',
            title: 'Lập trình Flutter cơ bản',
            channelTitle: 'Học Lập Trình',
            thumbnailUrl: 'https://img.youtube.com/vi/vid1/hqdefault.jpg',
          ),
        ],
        nextPageToken: 'next_token_123',
      ),
    );
  }

  @override
  Future<ApiResult<VideoItemEntity>> checkVideoUrl(String url) async {
    if (shouldFail) {
      return const ApiFailure(message: 'Link không hợp lệ');
    }
    return const ApiSuccess(
      VideoItemEntity(
        videoId: 'vid1',
        title: 'Video Bài Giảng',
        channelTitle: 'Kênh Khoa Học',
        thumbnailUrl: 'https://img.youtube.com/vi/vid1/hqdefault.jpg',
      ),
    );
  }

  @override
  Future<ApiResult<VideoDetailEntity>> getVideoDetail(String videoId) async {
    return ApiSuccess(
      VideoDetailEntity(
        videoId: videoId,
        isBanned: isBanned,
        bannedReason: isBanned ? 'Video vi phạm nội quy' : null,
      ),
    );
  }

  @override
  Future<ApiResult<List<VideoItemEntity>>> getRelatedVideos(String videoId) async {
    return const ApiSuccess([
      VideoItemEntity(
        videoId: 'vid_related',
        title: 'Video liên quan',
        channelTitle: 'Kênh Học Tập',
        thumbnailUrl: 'https://img.youtube.com/vi/vid_related/hqdefault.jpg',
      ),
    ]);
  }

  @override
  Future<ApiResult<VideoProgressEntity>> getVideoProgress(String videoId) async {
    return ApiSuccess(
      VideoProgressEntity(
        videoId: videoId,
        lastWatched: mockLastWatched,
        isCompleted: mockIsCompleted,
        duration: 3600,
      ),
    );
  }

  @override
  Future<ApiResult<VideoProgressEntity>> syncVideoProgress({
    required String videoId,
    required int seconds,
    required int lastWatchedSeconds,
    Map<String, dynamic>? videoMeta,
    bool markCompleted = false,
  }) async {
    mockLastWatched = lastWatchedSeconds;
    if (markCompleted) mockIsCompleted = true;
    return ApiSuccess(
      VideoProgressEntity(
        videoId: videoId,
        lastWatched: lastWatchedSeconds,
        isCompleted: mockIsCompleted,
        duration: 3600,
      ),
    );
  }

  @override
  Future<ApiResult<bool>> markVideoCompleted(String videoId) async {
    mockIsCompleted = true;
    return const ApiSuccess(true);
  }

  bool quizShouldFail = false;
  String quizFailMessage = 'Không đủ năng lượng AI';

  @override
  Future<ApiResult<QuizGeneratedEntity>> generateQuiz({
    required String videoId,
    int count = 5,
  }) async {
    if (quizShouldFail) {
      return ApiFailure(message: quizFailMessage);
    }
    return ApiSuccess(
      QuizGeneratedEntity(
        videoId: videoId,
        questionCount: count,
        questions: List.generate(
          count,
          (i) => QuizQuestionEntity(
            questionText: 'Câu hỏi mẫu số ${i + 1} về Flutter?',
            optionA: 'Lựa chọn A',
            optionB: 'Lựa chọn B',
            optionC: 'Lựa chọn C',
            optionD: 'Lựa chọn D',
            correctAnswer: 'A',
            explanation: 'Giải thích chi tiết cho câu hỏi ${i + 1}',
          ),
        ),
      ),
    );
  }

  bool submitQuizShouldFail = false;
  int mockEarnedXP = 140;
  int mockEarnedCoins = 14;

  @override
  Future<ApiResult<QuizResultEntity>> submitQuiz({
    required String videoId,
    String? videoTitle,
    String? channelName,
    required int score,
    required int correctCount,
    required int totalQuizzes,
    dynamic questionsData,
  }) async {
    if (submitQuizShouldFail) {
      return const ApiFailure(message: 'Lỗi khi lưu kết quả bài thi');
    }
    return ApiSuccess(
      QuizResultEntity(
        score: score,
        correctCount: correctCount,
        totalQuizzes: totalQuizzes,
        earnedXP: mockEarnedXP,
        earnedCoins: mockEarnedCoins,
      ),
    );
  }
}

void main() {
  group('Part A & B: Learning Module Tests', () {
    test('1. VideoItemModel.fromJson parses raw data correctly', () {
      final json = {
        'videoId': 'abc123xyz',
        'title': 'Kh&oacute;a học &quot;Flutter&quot; &amp; Dart',
        'channelTitle': 'Google Developers',
        'thumbnailUrl': 'https://example.com/thumb.jpg',
        'duration': 3600,
        'type': 'video',
      };

      final model = VideoItemModel.fromJson(json);
      expect(model.videoId, 'abc123xyz');
      expect(model.title, 'Khóa học "Flutter" & Dart');
      expect(model.channelTitle, 'Google Developers');
      expect(model.thumbnailUrl, 'https://example.com/thumb.jpg');
      expect(model.duration, 3600);
      expect(model.isPlaylist, false);
      expect(model.youtubeUrl, 'https://www.youtube.com/watch?v=abc123xyz');
    });

    test('2. VideoSearchResultModel.fromJson parses items and nextPageToken', () {
      final json = {
        'items': [
          {
            'videoId': 'v1',
            'title': 'Title 1',
            'channelTitle': 'Channel 1',
            'thumbnailUrl': 'https://example.com/1.jpg',
          }
        ],
        'nextPageToken': 'token_abc',
      };

      final result = VideoSearchResultModel.fromJson(json);
      expect(result.items.length, 1);
      expect(result.items.first.videoId, 'v1');
      expect(result.nextPageToken, 'token_abc');
    });

    test('3. SearchBloc emits SearchLoading then SearchLoaded on successful search', () async {
      final repo = MockLearningRepository();
      final useCase = SearchVideosUseCase(repo);
      final bloc = SearchBloc(searchVideosUseCase: useCase);

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<SearchLoading>(),
          isA<SearchLoaded>()
              .having((s) => s.videos.length, 'videos length', 1)
              .having((s) => s.query, 'query', 'flutter')
              .having((s) => s.nextPageToken, 'token', 'next_token_123'),
        ]),
      );

      bloc.add(const SearchVideosRequested('flutter'));
    });

    test('4. SearchBloc emits SearchFailure when search fails', () async {
      final repo = MockLearningRepository()..shouldFail = true;
      final useCase = SearchVideosUseCase(repo);
      final bloc = SearchBloc(searchVideosUseCase: useCase);

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<SearchLoading>(),
          isA<SearchFailure>().having((s) => s.message, 'message', 'Từ khóa không hợp lệ'),
        ]),
      );

      bloc.add(const SearchVideosRequested('invalid'));
    });

    test('5. WatchBloc loads video details, related videos and progress', () async {
      final repo = MockLearningRepository()..mockLastWatched = 45;
      final bloc = WatchBloc(
        getVideoDetailUseCase: GetVideoDetailUseCase(repo),
        getRelatedVideosUseCase: GetRelatedVideosUseCase(repo),
        getVideoProgressUseCase: GetVideoProgressUseCase(repo),
        syncVideoProgressUseCase: SyncVideoProgressUseCase(repo),
        markVideoCompletedUseCase: MarkVideoCompletedUseCase(repo),
      );

      const video = VideoItemEntity(
        videoId: 'vid1',
        title: 'Video Test',
        channelTitle: 'Channel Test',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      );

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<WatchLoading>(),
          isA<WatchLoaded>()
              .having((s) => s.isBanned, 'isBanned', false)
              .having((s) => s.relatedVideos.length, 'related count', 1)
              .having((s) => s.showResumeBanner, 'showResumeBanner', true)
              .having((s) => s.savedProgress?.lastWatched, 'lastWatched', 45),
        ]),
      );

      bloc.add(const WatchInitRequested(video));
    });

    test('6. WatchBloc detects banned video from Admin', () async {
      final repo = MockLearningRepository()..isBanned = true;
      final bloc = WatchBloc(
        getVideoDetailUseCase: GetVideoDetailUseCase(repo),
        getRelatedVideosUseCase: GetRelatedVideosUseCase(repo),
        getVideoProgressUseCase: GetVideoProgressUseCase(repo),
        syncVideoProgressUseCase: SyncVideoProgressUseCase(repo),
        markVideoCompletedUseCase: MarkVideoCompletedUseCase(repo),
      );

      const video = VideoItemEntity(
        videoId: 'banned_vid',
        title: 'Banned Video',
        channelTitle: 'Channel',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      );

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<WatchLoading>(),
          isA<WatchLoaded>()
              .having((s) => s.isBanned, 'isBanned', true)
              .having((s) => s.bannedReason, 'bannedReason', 'Video vi phạm nội quy'),
        ]),
      );

      bloc.add(const WatchInitRequested(video));
    });

    test('7. VideoProgressModel parses JSON and formats time correctly', () {
      final json = {
        'videoId': 'vid123',
        'lastWatched': 165,
        'duration': 600,
        'isCompleted': false,
        'updatedAt': '2026-11-08T10:00:00.000Z',
      };

      final progress = VideoProgressModel.fromJson(json);
      expect(progress.videoId, 'vid123');
      expect(progress.lastWatched, 165);
      expect(progress.duration, 600);
      expect(progress.isCompleted, false);
      expect(progress.formattedLastWatched, '02:45');
      expect(progress.formattedDuration, '10:00');
      expect(progress.progressPercent, closeTo(0.275, 0.001));
    });

    test('8. WatchBloc syncs heartbeat and updates progress position', () async {
      final repo = MockLearningRepository();
      final bloc = WatchBloc(
        getVideoDetailUseCase: GetVideoDetailUseCase(repo),
        getRelatedVideosUseCase: GetRelatedVideosUseCase(repo),
        getVideoProgressUseCase: GetVideoProgressUseCase(repo),
        syncVideoProgressUseCase: SyncVideoProgressUseCase(repo),
        markVideoCompletedUseCase: MarkVideoCompletedUseCase(repo),
      );

      const video = VideoItemEntity(
        videoId: 'vid1',
        title: 'Video Test',
        channelTitle: 'Channel Test',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      );

      bloc.add(const WatchInitRequested(video));
      await Future.delayed(const Duration(milliseconds: 50));

      bloc.add(const WatchPlayStateChanged(true));
      bloc.add(const WatchPositionUpdated(positionSeconds: 120, totalDurationSeconds: 600));
      await Future.delayed(const Duration(milliseconds: 50));

      bloc.add(const WatchProgressSyncRequested());
      await Future.delayed(const Duration(milliseconds: 50));

      expect(bloc.state, isA<WatchLoaded>());
      final loaded = bloc.state as WatchLoaded;
      expect(loaded.currentPosition, 120);
      expect(repo.mockLastWatched, 120);
    });

    test('9. WatchBloc dismisses resume banner on user action', () async {
      final repo = MockLearningRepository()..mockLastWatched = 100;
      final bloc = WatchBloc(
        getVideoDetailUseCase: GetVideoDetailUseCase(repo),
        getRelatedVideosUseCase: GetRelatedVideosUseCase(repo),
        getVideoProgressUseCase: GetVideoProgressUseCase(repo),
        syncVideoProgressUseCase: SyncVideoProgressUseCase(repo),
        markVideoCompletedUseCase: MarkVideoCompletedUseCase(repo),
      );

      const video = VideoItemEntity(
        videoId: 'vid1',
        title: 'Video Test',
        channelTitle: 'Channel Test',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      );

      bloc.add(const WatchInitRequested(video));
      await Future.delayed(const Duration(milliseconds: 50));
      expect((bloc.state as WatchLoaded).showResumeBanner, true);

      bloc.add(const WatchDismissResumeBanner());
      await Future.delayed(const Duration(milliseconds: 50));
      expect((bloc.state as WatchLoaded).showResumeBanner, false);
    });
  });

  group('Part C: AI Quiz Generator Tests', () {
    test('10. QuizQuestionModel.fromJson parses raw question data correctly', () {
      final json = {
        'questionText': 'Widget nào là cơ bản nhất trong Flutter?',
        'optionA': 'Container',
        'optionB': 'Text',
        'optionC': 'Column',
        'optionD': 'SizedBox',
        'correctAnswer': 'B',
        'explanation': 'Text là widget hiển thị chuỗi văn bản cơ bản.',
      };

      final model = QuizQuestionModel.fromJson(json);
      expect(model.questionText, 'Widget nào là cơ bản nhất trong Flutter?');
      expect(model.optionA, 'Container');
      expect(model.optionB, 'Text');
      expect(model.optionC, 'Column');
      expect(model.optionD, 'SizedBox');
      expect(model.correctAnswer, 'B');
      expect(model.explanation, 'Text là widget hiển thị chuỗi văn bản cơ bản.');
    });

    test('11. QuizGeneratedModel.fromJson parses questions array correctly', () {
      final json = {
        'videoId': 'flutter_vid_101',
        'questions': [
          {
            'questionText': 'Q1',
            'optionA': 'A1',
            'optionB': 'B1',
            'optionC': 'C1',
            'optionD': 'D1',
            'correctAnswer': 'A',
            'explanation': 'Exp1',
          },
          {
            'questionText': 'Q2',
            'optionA': 'A2',
            'optionB': 'B2',
            'optionC': 'C2',
            'optionD': 'D2',
            'correctAnswer': 'C',
            'explanation': 'Exp2',
          },
        ],
      };

      final model = QuizGeneratedModel.fromJson(json);
      expect(model.videoId, 'flutter_vid_101');
      expect(model.questions.length, 2);
      expect(model.questions[0].correctAnswer, 'A');
      expect(model.questions[1].correctAnswer, 'C');
    });

    test('12. GenerateQuizUseCase returns ApiSuccess with questions on success', () async {
      final repo = MockLearningRepository();
      final useCase = GenerateQuizUseCase(repo);

      final result = await useCase(videoId: 'test_vid', count: 3);

      expect(result, isA<ApiSuccess<QuizGeneratedEntity>>());
      final data = (result as ApiSuccess<QuizGeneratedEntity>).data;
      expect(data.videoId, 'test_vid');
      expect(data.questions.length, 3);
      expect(data.questions.first.questionText, contains('Câu hỏi mẫu số 1'));
    });

    test('13. GenerateQuizUseCase returns ApiFailure when insufficient tokens or error', () async {
      final repo = MockLearningRepository()..quizShouldFail = true;
      final useCase = GenerateQuizUseCase(repo);

      final result = await useCase(videoId: 'test_vid', count: 5);

      expect(result, isA<ApiFailure<QuizGeneratedEntity>>());
      expect((result as ApiFailure).message, 'Không đủ năng lượng AI');
    });

    test('14. QuizBloc emits QuizGenerating then QuizLoaded on successful generation', () async {
      final repo = MockLearningRepository();
      final bloc = QuizBloc(
        generateQuizUseCase: GenerateQuizUseCase(repo),
        submitQuizUseCase: SubmitQuizUseCase(repo),
      );

      expect(bloc.state, isA<QuizInitial>());

      bloc.add(const GenerateQuizRequested(videoId: 'v123', count: 3));
      await Future.delayed(const Duration(milliseconds: 50));

      expect(bloc.state, isA<QuizLoaded>());
      final loaded = bloc.state as QuizLoaded;
      expect(loaded.videoId, 'v123');
      expect(loaded.questions.length, 3);
      expect(loaded.userAnswers.isEmpty, true);
      expect(loaded.isSubmitted, false);
    });

    test('15. QuizBloc emits QuizError when generation fails', () async {
      final repo = MockLearningRepository()
        ..quizShouldFail = true
        ..quizFailMessage = 'Bạn cần tối thiểu 5 năng lượng AI';
      final bloc = QuizBloc(
        generateQuizUseCase: GenerateQuizUseCase(repo),
        submitQuizUseCase: SubmitQuizUseCase(repo),
      );

      bloc.add(const GenerateQuizRequested(videoId: 'v123', count: 5));
      await Future.delayed(const Duration(milliseconds: 50));

      expect(bloc.state, isA<QuizError>());
      expect((bloc.state as QuizError).message, 'Bạn cần tối thiểu 5 năng lượng AI');
    });

    test('16. QuizBloc updates userAnswers on QuizAnswerSelected and resets on QuizResetRequested', () async {
      final repo = MockLearningRepository();
      final bloc = QuizBloc(
        generateQuizUseCase: GenerateQuizUseCase(repo),
        submitQuizUseCase: SubmitQuizUseCase(repo),
      );

      bloc.add(const GenerateQuizRequested(videoId: 'v123', count: 3));
      await Future.delayed(const Duration(milliseconds: 50));

      expect(bloc.state, isA<QuizLoaded>());

      // Chọn câu trả lời cho câu 0 là 'B'
      bloc.add(const QuizAnswerSelected(questionIndex: 0, option: 'B'));
      await Future.delayed(const Duration(milliseconds: 20));

      var loaded = bloc.state as QuizLoaded;
      expect(loaded.userAnswers[0], 'B');

      // Chọn tiếp câu 1 là 'C'
      bloc.add(const QuizAnswerSelected(questionIndex: 1, option: 'C'));
      await Future.delayed(const Duration(milliseconds: 20));

      loaded = bloc.state as QuizLoaded;
      expect(loaded.userAnswers[0], 'B');
      expect(loaded.userAnswers[1], 'C');

      // Đổi đáp án câu 0 thành 'A'
      bloc.add(const QuizAnswerSelected(questionIndex: 0, option: 'A'));
      await Future.delayed(const Duration(milliseconds: 20));

      loaded = bloc.state as QuizLoaded;
      expect(loaded.userAnswers[0], 'A');

      // Reset
      bloc.add(const QuizResetRequested());
      await Future.delayed(const Duration(milliseconds: 20));

      expect(bloc.state, isA<QuizInitial>());
    });
  });

  group('Part D: Interactive Quiz & Auto-grading Tests', () {
    test('17. QuizResultModel.fromJson parses submission result correctly', () {
      final json = {
        'success': true,
        'data': {
          'score': 3,
          'correctCount': 3,
          'totalQuizzes': 5,
          'earnedXP': 210,
          'earnedCoins': 21,
        }
      };

      final model = QuizResultModel.fromJson(json);
      expect(model.score, 3);
      expect(model.correctCount, 3);
      expect(model.totalQuizzes, 5);
      expect(model.earnedXP, 210);
      expect(model.earnedCoins, 21);
      expect(model.percentage, 60.0);
      expect(model.isPassed, true);
    });

    test('18. SubmitQuizUseCase sends quiz result and returns ApiSuccess', () async {
      final repo = MockLearningRepository();
      final useCase = SubmitQuizUseCase(repo);

      final result = await useCase(
        videoId: 'vid123',
        videoTitle: 'Flutter Architecture',
        channelName: 'Flutter Team',
        score: 3,
        correctCount: 3,
        totalQuizzes: 3,
      );

      expect(result, isA<ApiSuccess<QuizResultEntity>>());
      final data = (result as ApiSuccess<QuizResultEntity>).data;
      expect(data.score, 3);
      expect(data.correctCount, 3);
      expect(data.earnedXP, 140);
      expect(data.earnedCoins, 14);
    });

    test('19. QuizLoaded calculates correct answers count accurately', () {
      final questions = [
        const QuizQuestionEntity(
          questionText: 'Q1',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          correctAnswer: 'A',
          explanation: 'Exp1',
        ),
        const QuizQuestionEntity(
          questionText: 'Q2',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          correctAnswer: 'C',
          explanation: 'Exp2',
        ),
      ];

      // Trường hợp 1: Đúng 1 câu (Câu 1 chọn A -> đúng, Câu 2 chọn B -> sai)
      var state = QuizLoaded(
        videoId: 'v1',
        questions: questions,
        userAnswers: const {0: 'A', 1: 'B'},
      );
      expect(state.calculatedCorrectCount, 1);
      expect(state.answeredCount, 2);
      expect(state.isAllAnswered, true);

      // Trường hợp 2: Đúng cả 2 câu
      state = state.copyWith(userAnswers: const {0: 'A', 1: 'C'});
      expect(state.calculatedCorrectCount, 2);

      // Trường hợp 3: Chưa làm câu nào
      state = state.copyWith(userAnswers: const {});
      expect(state.calculatedCorrectCount, 0);
      expect(state.answeredCount, 0);
      expect(state.isAllAnswered, false);
    });

    test('20. QuizBloc submits quiz, grades answers and emits QuizLoaded with result and reward', () async {
      final repo = MockLearningRepository();
      final bloc = QuizBloc(
        generateQuizUseCase: GenerateQuizUseCase(repo),
        submitQuizUseCase: SubmitQuizUseCase(repo),
      );

      // 1. Tạo 3 câu hỏi (mỗi câu đều có correctAnswer = 'A' theo mock)
      bloc.add(const GenerateQuizRequested(videoId: 'v101', count: 3));
      await Future.delayed(const Duration(milliseconds: 50));

      // 2. Chọn câu 0 là 'A' (đúng), câu 1 là 'B' (sai), câu 2 là 'A' (đúng) -> 2/3 đúng
      bloc.add(const QuizAnswerSelected(questionIndex: 0, option: 'A'));
      bloc.add(const QuizAnswerSelected(questionIndex: 1, option: 'B'));
      bloc.add(const QuizAnswerSelected(questionIndex: 2, option: 'A'));
      await Future.delayed(const Duration(milliseconds: 50));

      final preSubmit = bloc.state as QuizLoaded;
      expect(preSubmit.calculatedCorrectCount, 2);

      // 3. Nộp bài
      bloc.add(const QuizSubmitRequested(videoTitle: 'Test Title'));
      await Future.delayed(const Duration(milliseconds: 50));

      expect(bloc.state, isA<QuizLoaded>());
      final submitted = bloc.state as QuizLoaded;
      expect(submitted.isSubmitted, true);
      expect(submitted.isSubmitting, false);
      expect(submitted.result != null, true);
      expect(submitted.result!.correctCount, 2);
      expect(submitted.showRewardModal, true);

      // 4. Tắt modal phần thưởng
      bloc.add(const QuizDismissRewardModal());
      await Future.delayed(const Duration(milliseconds: 20));
      expect((bloc.state as QuizLoaded).showRewardModal, false);

      // 5. Làm lại bài (Retry) -> Xóa đáp án, mở lại để làm
      bloc.add(const QuizRetryRequested());
      await Future.delayed(const Duration(milliseconds: 20));
      final retried = bloc.state as QuizLoaded;
      expect(retried.isSubmitted, false);
      expect(retried.userAnswers.isEmpty, true);
    });
  });
}
