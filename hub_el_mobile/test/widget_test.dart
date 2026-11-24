import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hub_el_mobile/core/network/dio_client.dart';
import 'package:hub_el_mobile/core/storage/token_storage_service.dart';
import 'package:hub_el_mobile/features/authentication/data/datasources/auth_remote_data_source.dart';
import 'package:hub_el_mobile/features/authentication/data/repositories/auth_repository_impl.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/check_auth_status_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/forgot_password_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/google_sign_in_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/login_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/logout_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/register_usecase.dart';
import 'package:hub_el_mobile/features/authentication/domain/usecases/verify_reset_password_usecase.dart';
import 'package:hub_el_mobile/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:hub_el_mobile/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:hub_el_mobile/features/dashboard/data/repositories/dashboard_repository_impl.dart';
import 'package:hub_el_mobile/features/dashboard/domain/usecases/claim_task_reward_usecase.dart';
import 'package:hub_el_mobile/features/dashboard/domain/usecases/get_dashboard_data_usecase.dart';
import 'package:hub_el_mobile/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:hub_el_mobile/features/learning/data/datasources/learning_remote_data_source.dart';
import 'package:hub_el_mobile/features/learning/data/repositories/learning_repository_impl.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/check_video_link_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/generate_quiz_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/submit_quiz_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_related_videos_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_video_detail_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/get_video_progress_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/sync_video_progress_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/mark_video_completed_usecase.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/search_videos_usecase.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/quiz/quiz_bloc.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/search/search_bloc.dart';
import 'package:hub_el_mobile/features/learning/presentation/bloc/watch/watch_bloc.dart';
import 'package:hub_el_mobile/features/wiki/data/datasources/wiki_remote_data_source.dart';
import 'package:hub_el_mobile/features/wiki/data/repositories/wiki_repository_impl.dart';
import 'package:hub_el_mobile/features/wiki/domain/usecases/get_wiki_inventory_usecase.dart';
import 'package:hub_el_mobile/features/wiki/presentation/bloc/wiki_manager_bloc.dart';
import 'package:hub_el_mobile/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('HubElApp smoke test', (WidgetTester tester) async {
    FlutterSecureStorage.setMockInitialValues({});
    final tokenStorage = TokenStorageService();
    final dioClient = DioClient(tokenStorage: tokenStorage);
    final remoteDataSource = AuthRemoteDataSource(dioClient: dioClient);
    final repo = AuthRepositoryImpl(
      remoteDataSource: remoteDataSource,
      tokenStorage: tokenStorage,
    );

    final authBloc = AuthBloc(
      loginUseCase: LoginUseCase(repo),
      registerUseCase: RegisterUseCase(repo),
      checkAuthStatusUseCase: CheckAuthStatusUseCase(repo),
      logoutUseCase: LogoutUseCase(repo),
      forgotPasswordUseCase: ForgotPasswordUseCase(repo),
      verifyResetPasswordUseCase: VerifyResetPasswordUseCase(repo),
      googleSignInUseCase: GoogleSignInUseCase(repo),
    );

    final dashboardRepo = DashboardRepositoryImpl(
      remoteDataSource: DashboardRemoteDataSource(dioClient: dioClient),
    );
    final dashboardBloc = DashboardBloc(
      getDashboardDataUseCase: GetDashboardDataUseCase(dashboardRepo),
      claimTaskRewardUseCase: ClaimTaskRewardUseCase(dashboardRepo),
    );

    final learningRepo = LearningRepositoryImpl(
      remoteDataSource: LearningRemoteDataSource(dioClient: dioClient),
    );
    final searchBloc = SearchBloc(
      searchVideosUseCase: SearchVideosUseCase(learningRepo),
    );
    final watchBloc = WatchBloc(
      getVideoDetailUseCase: GetVideoDetailUseCase(learningRepo),
      getRelatedVideosUseCase: GetRelatedVideosUseCase(learningRepo),
      getVideoProgressUseCase: GetVideoProgressUseCase(learningRepo),
      syncVideoProgressUseCase: SyncVideoProgressUseCase(learningRepo),
      markVideoCompletedUseCase: MarkVideoCompletedUseCase(learningRepo),
    );
    final quizBloc = QuizBloc(
      generateQuizUseCase: GenerateQuizUseCase(learningRepo),
      submitQuizUseCase: SubmitQuizUseCase(learningRepo),
    );
    final wikiRemote = WikiRemoteDataSource(dioClient: dioClient);
    final wikiRepo = WikiRepositoryImpl(remoteDataSource: wikiRemote);
    final wikiManagerBloc = WikiManagerBloc(
      getWikiInventoryUseCase: GetWikiInventoryUseCase(wikiRepo),
    );
    final checkVideoLinkUseCase = CheckVideoLinkUseCase(learningRepo);

    await tester.pumpWidget(HubElApp(
      authBloc: authBloc,
      dashboardBloc: dashboardBloc,
      searchBloc: searchBloc,
      watchBloc: watchBloc,
      quizBloc: quizBloc,
      wikiManagerBloc: wikiManagerBloc,
      checkVideoLinkUseCase: checkVideoLinkUseCase,
    ));
    expect(find.text('Đang kiểm tra phiên làm việc...'), findsOneWidget);
  });
}
