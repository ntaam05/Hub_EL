import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/constants/app_environment.dart';
import 'core/network/dio_client.dart';
import 'core/storage/token_storage_service.dart';
import 'core/theme/app_theme.dart';
import 'features/authentication/data/datasources/auth_remote_data_source.dart';
import 'features/authentication/data/repositories/auth_repository_impl.dart';
import 'features/authentication/domain/usecases/check_auth_status_usecase.dart';
import 'features/authentication/domain/usecases/forgot_password_usecase.dart';
import 'features/authentication/domain/usecases/google_sign_in_usecase.dart';
import 'features/authentication/domain/usecases/login_usecase.dart';
import 'features/authentication/domain/usecases/logout_usecase.dart';
import 'features/authentication/domain/usecases/register_usecase.dart';
import 'features/authentication/domain/usecases/verify_reset_password_usecase.dart';
import 'features/authentication/presentation/bloc/auth_bloc.dart';
import 'features/authentication/presentation/bloc/auth_event.dart';
import 'features/authentication/presentation/bloc/auth_state.dart';
import 'features/authentication/presentation/screens/login_screen.dart';
import 'features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'features/dashboard/data/repositories/dashboard_repository_impl.dart';
import 'features/dashboard/domain/usecases/claim_task_reward_usecase.dart';
import 'features/dashboard/domain/usecases/get_dashboard_data_usecase.dart';
import 'features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'features/dashboard/presentation/screens/main_shell_screen.dart';
import 'features/learning/data/datasources/learning_remote_data_source.dart';
import 'features/learning/data/repositories/learning_repository_impl.dart';
import 'features/learning/domain/usecases/check_video_link_usecase.dart';
import 'features/learning/domain/usecases/generate_quiz_usecase.dart';
import 'features/learning/domain/usecases/submit_quiz_usecase.dart';
import 'features/learning/domain/usecases/get_related_videos_usecase.dart';
import 'features/learning/domain/usecases/get_video_detail_usecase.dart';
import 'features/learning/domain/usecases/get_video_progress_usecase.dart';
import 'features/learning/domain/usecases/sync_video_progress_usecase.dart';
import 'features/learning/domain/usecases/mark_video_completed_usecase.dart';
import 'features/learning/domain/usecases/search_videos_usecase.dart';
import 'features/learning/presentation/bloc/quiz/quiz_bloc.dart';
import 'features/learning/presentation/bloc/search/search_bloc.dart';
import 'features/learning/presentation/bloc/watch/watch_bloc.dart';
import 'features/wiki/data/datasources/wiki_remote_data_source.dart';
import 'features/wiki/data/repositories/wiki_repository_impl.dart';
import 'features/wiki/domain/repositories/wiki_repository.dart';
import 'features/wiki/domain/usecases/get_wiki_inventory_usecase.dart';
import 'features/wiki/presentation/bloc/wiki_manager_bloc.dart';
import 'features/gacha/data/datasources/gacha_remote_data_source.dart';
import 'features/gacha/data/repositories/gacha_repository_impl.dart';
import 'features/gacha/domain/repositories/gacha_repository.dart';
import 'features/social/data/datasources/friends_remote_data_source.dart';
import 'features/social/data/repositories/friends_repository_impl.dart';
import 'features/social/domain/repositories/friends_repository.dart';
import 'features/social/presentation/cubit/friends_cubit.dart';
import 'features/social/data/datasources/chat_remote_data_source.dart';
import 'features/social/data/repositories/chat_repository_impl.dart';
import 'features/social/data/services/chat_socket_service.dart';
import 'features/social/domain/repositories/chat_repository.dart';
import 'features/social/presentation/cubit/chat_cubit.dart';
import 'features/leaderboard/data/datasources/leaderboard_remote_data_source.dart';
import 'features/leaderboard/data/repositories/leaderboard_repository_impl.dart';
import 'features/leaderboard/domain/repositories/leaderboard_repository.dart';
import 'features/leaderboard/domain/usecases/get_leaderboard_use_case.dart';
import 'features/leaderboard/presentation/cubit/leaderboard_cubit.dart';
import 'features/store/data/datasources/store_remote_data_source.dart';
import 'features/store/data/repositories/store_repository_impl.dart';
import 'features/store/domain/repositories/store_repository.dart';
import 'features/store/domain/usecases/store_usecases.dart';
import 'features/store/presentation/cubit/store_cubit.dart';
import 'features/achievements/data/datasources/achievements_remote_data_source.dart';
import 'features/achievements/data/repositories/achievements_repository_impl.dart';
import 'features/achievements/domain/repositories/achievements_repository.dart';
import 'features/achievements/domain/usecases/get_achievements_usecase.dart';
import 'features/achievements/presentation/cubit/achievements_cubit.dart';
import 'features/vocabulary/data/datasources/vocabulary_remote_data_source.dart';
import 'features/vocabulary/data/repositories/vocabulary_repository_impl.dart';
import 'features/vocabulary/domain/repositories/vocabulary_repository.dart';
import 'features/vocabulary/domain/usecases/vocabulary_usecases.dart';
import 'features/vocabulary/presentation/cubit/vocabulary_cubit.dart';
import 'features/profile/data/datasources/profile_remote_data_source.dart';
import 'features/profile/data/repositories/profile_repository_impl.dart';
import 'features/profile/domain/repositories/profile_repository.dart';
import 'features/profile/domain/usecases/profile_usecases.dart';
import 'features/profile/presentation/cubit/profile_cubit.dart';
import 'features/settings/data/datasources/settings_remote_data_source.dart';
import 'features/settings/data/repositories/settings_repository_impl.dart';
import 'features/settings/domain/repositories/settings_repository.dart';
import 'features/settings/domain/usecases/settings_usecases.dart';
import 'features/settings/presentation/cubit/settings_cubit.dart';
import 'shared/widgets/loading_widget.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Khởi tạo Local Storage và Network Client
  final tokenStorage = TokenStorageService();
  late final AuthBloc authBloc;

  final dioClient = DioClient(
    tokenStorage: tokenStorage,
    baseUrl: AppConfig.baseUrl,
    onSessionExpired: () => authBloc.add(const AuthSessionExpiredReceived()),
    onUserBanned: (reason) => authBloc.add(AuthUserBannedReceived(reason: reason)),
  );

  // 2. Khởi tạo Data Sources & Repositories
  final authRemoteDataSource = AuthRemoteDataSource(dioClient: dioClient);
  final authRepository = AuthRepositoryImpl(
    remoteDataSource: authRemoteDataSource,
    tokenStorage: tokenStorage,
  );

  final dashboardRemoteDataSource = DashboardRemoteDataSource(dioClient: dioClient);
  final dashboardRepository = DashboardRepositoryImpl(remoteDataSource: dashboardRemoteDataSource);

  final learningRemoteDataSource = LearningRemoteDataSource(dioClient: dioClient);
  final learningRepository = LearningRepositoryImpl(remoteDataSource: learningRemoteDataSource);

  final wikiRemoteDataSource = WikiRemoteDataSource(dioClient: dioClient);
  final wikiRepository = WikiRepositoryImpl(remoteDataSource: wikiRemoteDataSource);

  final gachaRemoteDataSource = GachaRemoteDataSource(dioClient: dioClient);
  final gachaRepository = GachaRepositoryImpl(remoteDataSource: gachaRemoteDataSource);

  final friendsRemoteDataSource = FriendsRemoteDataSource(dioClient: dioClient);
  final friendsRepository = FriendsRepositoryImpl(remoteDataSource: friendsRemoteDataSource);

  final chatRemoteDataSource = ChatRemoteDataSource(dioClient: dioClient);
  final chatSocketService = ChatSocketService(tokenStorage: tokenStorage);
  final chatRepository = ChatRepositoryImpl(remoteDataSource: chatRemoteDataSource);

  final leaderboardRemoteDataSource = LeaderboardRemoteDataSource(dioClient: dioClient);
  final leaderboardRepository = LeaderboardRepositoryImpl(remoteDataSource: leaderboardRemoteDataSource);

  final storeRemoteDataSource = StoreRemoteDataSource(dioClient: dioClient);
  final storeRepository = StoreRepositoryImpl(remoteDataSource: storeRemoteDataSource);

  final achievementsRemoteDataSource = AchievementsRemoteDataSource(dioClient: dioClient);
  final achievementsRepository = AchievementsRepositoryImpl(remoteDataSource: achievementsRemoteDataSource);

  final vocabularyRemoteDataSource = VocabularyRemoteDataSource(dioClient: dioClient);
  final vocabularyRepository = VocabularyRepositoryImpl(remoteDataSource: vocabularyRemoteDataSource);

  final profileRemoteDataSource = ProfileRemoteDataSourceImpl(dioClient: dioClient);
  final profileRepository = ProfileRepositoryImpl(remoteDataSource: profileRemoteDataSource);

  final settingsRemoteDataSource = SettingsRemoteDataSourceImpl(dioClient: dioClient);
  final settingsRepository = SettingsRepositoryImpl(remoteDataSource: settingsRemoteDataSource);

  // 3. Khởi tạo UseCases
  final loginUseCase = LoginUseCase(authRepository);
  final registerUseCase = RegisterUseCase(authRepository);
  final checkAuthStatusUseCase = CheckAuthStatusUseCase(authRepository);
  final logoutUseCase = LogoutUseCase(authRepository);
  final forgotPasswordUseCase = ForgotPasswordUseCase(authRepository);
  final verifyResetPasswordUseCase = VerifyResetPasswordUseCase(authRepository);
  final googleSignInUseCase = GoogleSignInUseCase(authRepository);

  final getDashboardDataUseCase = GetDashboardDataUseCase(dashboardRepository);
  final claimTaskRewardUseCase = ClaimTaskRewardUseCase(dashboardRepository);

  final searchVideosUseCase = SearchVideosUseCase(learningRepository);
  final checkVideoLinkUseCase = CheckVideoLinkUseCase(learningRepository);
  final getVideoDetailUseCase = GetVideoDetailUseCase(learningRepository);
  final getRelatedVideosUseCase = GetRelatedVideosUseCase(learningRepository);
  final getVideoProgressUseCase = GetVideoProgressUseCase(learningRepository);
  final syncVideoProgressUseCase = SyncVideoProgressUseCase(learningRepository);
  final markVideoCompletedUseCase = MarkVideoCompletedUseCase(learningRepository);
  final generateQuizUseCase = GenerateQuizUseCase(learningRepository);
  final submitQuizUseCase = SubmitQuizUseCase(learningRepository);

  final getWikiInventoryUseCase = GetWikiInventoryUseCase(wikiRepository);
  final getLeaderboardUseCase = GetLeaderboardUseCase(leaderboardRepository);

  final getStoreCatalogUseCase = GetStoreCatalogUseCase(repository: storeRepository);
  final exchangeResourcesUseCase = ExchangeResourcesUseCase(repository: storeRepository);
  final createMoMoPaymentUseCase = CreateMoMoPaymentUseCase(repository: storeRepository);
  final checkMoMoStatusUseCase = CheckMoMoStatusUseCase(repository: storeRepository);
  final getTransactionsUseCase = GetTransactionsUseCase(repository: storeRepository);

  final getAchievementsUseCase = GetAchievementsUseCase(repository: achievementsRepository);

  // 4. Khởi tạo BLoCs
  authBloc = AuthBloc(
    loginUseCase: loginUseCase,
    registerUseCase: registerUseCase,
    checkAuthStatusUseCase: checkAuthStatusUseCase,
    logoutUseCase: logoutUseCase,
    forgotPasswordUseCase: forgotPasswordUseCase,
    verifyResetPasswordUseCase: verifyResetPasswordUseCase,
    googleSignInUseCase: googleSignInUseCase,
  )..add(const AuthCheckRequested());

  final dashboardBloc = DashboardBloc(
    getDashboardDataUseCase: getDashboardDataUseCase,
    claimTaskRewardUseCase: claimTaskRewardUseCase,
  );

  final searchBloc = SearchBloc(searchVideosUseCase: searchVideosUseCase);
  final watchBloc = WatchBloc(
    getVideoDetailUseCase: getVideoDetailUseCase,
    getRelatedVideosUseCase: getRelatedVideosUseCase,
    getVideoProgressUseCase: getVideoProgressUseCase,
    syncVideoProgressUseCase: syncVideoProgressUseCase,
    markVideoCompletedUseCase: markVideoCompletedUseCase,
  );
  final quizBloc = QuizBloc(
    generateQuizUseCase: generateQuizUseCase,
    submitQuizUseCase: submitQuizUseCase,
  );
  final wikiManagerBloc = WikiManagerBloc(
    getWikiInventoryUseCase: getWikiInventoryUseCase,
  );
  final friendsCubit = FriendsCubit(repository: friendsRepository);
  final chatCubit = ChatCubit(repository: chatRepository, socketService: chatSocketService);
  final leaderboardCubit = LeaderboardCubit(getLeaderboardUseCase: getLeaderboardUseCase);
  final storeCubit = StoreCubit(
    getStoreCatalogUseCase: getStoreCatalogUseCase,
    exchangeResourcesUseCase: exchangeResourcesUseCase,
    createMoMoPaymentUseCase: createMoMoPaymentUseCase,
    checkMoMoStatusUseCase: checkMoMoStatusUseCase,
    getTransactionsUseCase: getTransactionsUseCase,
  );
  final achievementsCubit = AchievementsCubit(getAchievementsUseCase: getAchievementsUseCase);

  final getVocabularyListUseCase = GetVocabularyListUseCase(vocabularyRepository);
  final getVocabularyDetailUseCase = GetVocabularyDetailUseCase(vocabularyRepository);
  final getVocabularyContextUseCase = GetVocabularyContextUseCase(vocabularyRepository);
  final vocabularyCubit = VocabularyCubit(
    getVocabularyListUseCase: getVocabularyListUseCase,
    getVocabularyDetailUseCase: getVocabularyDetailUseCase,
    getVocabularyContextUseCase: getVocabularyContextUseCase,
  );

  final getProfileUseCase = GetProfileUseCase(profileRepository);
  final updateProfileUseCase = UpdateProfileUseCase(profileRepository);
  final updateAvatarUseCase = UpdateAvatarUseCase(profileRepository);
  final profileCubit = ProfileCubit(
    getProfileUseCase: getProfileUseCase,
    updateProfileUseCase: updateProfileUseCase,
    updateAvatarUseCase: updateAvatarUseCase,
  );

  final settingsCubit = SettingsCubit(
    getSecurityInfoUseCase: GetSecurityInfoUseCase(settingsRepository),
    sendSecurityOtpUseCase: SendSecurityOtpUseCase(settingsRepository),
    verifySecurityOtpUseCase: VerifySecurityOtpUseCase(settingsRepository),
    changePasswordUseCase: ChangePasswordUseCase(settingsRepository),
    resetPasswordWithOtpUseCase: ResetPasswordWithOtpUseCase(settingsRepository),
    getPrivacySettingsUseCase: GetPrivacySettingsUseCase(settingsRepository),
    updatePrivacySettingsUseCase: UpdatePrivacySettingsUseCase(settingsRepository),
    getNotificationSettingsUseCase: GetNotificationSettingsUseCase(settingsRepository),
    updateNotificationSettingsUseCase: UpdateNotificationSettingsUseCase(settingsRepository),
    submitFeedbackUseCase: SubmitFeedbackUseCase(settingsRepository),
    deleteAccountUseCase: DeleteAccountUseCase(settingsRepository),
    getInterestTagsUseCase: GetInterestTagsUseCase(settingsRepository),
  );

  runApp(HubElApp(
    authBloc: authBloc,
    dashboardBloc: dashboardBloc,
    searchBloc: searchBloc,
    watchBloc: watchBloc,
    quizBloc: quizBloc,
    wikiManagerBloc: wikiManagerBloc,
    friendsCubit: friendsCubit,
    chatCubit: chatCubit,
    leaderboardCubit: leaderboardCubit,
    storeCubit: storeCubit,
    achievementsCubit: achievementsCubit,
    vocabularyCubit: vocabularyCubit,
    profileCubit: profileCubit,
    settingsCubit: settingsCubit,
    checkVideoLinkUseCase: checkVideoLinkUseCase,
    wikiRepository: wikiRepository,
    gachaRepository: gachaRepository,
    friendsRepository: friendsRepository,
    chatRepository: chatRepository,
    leaderboardRepository: leaderboardRepository,
    storeRepository: storeRepository,
    achievementsRepository: achievementsRepository,
    vocabularyRepository: vocabularyRepository,
    profileRepository: profileRepository,
    settingsRepository: settingsRepository,
  ));
}

class HubElApp extends StatelessWidget {
  final AuthBloc authBloc;
  final DashboardBloc dashboardBloc;
  final SearchBloc searchBloc;
  final WatchBloc watchBloc;
  final QuizBloc quizBloc;
  final WikiManagerBloc wikiManagerBloc;
  final FriendsCubit? friendsCubit;
  final ChatCubit? chatCubit;
  final LeaderboardCubit? leaderboardCubit;
  final StoreCubit? storeCubit;
  final AchievementsCubit? achievementsCubit;
  final VocabularyCubit? vocabularyCubit;
  final ProfileCubit? profileCubit;
  final SettingsCubit? settingsCubit;
  final CheckVideoLinkUseCase checkVideoLinkUseCase;
  final IWikiRepository? wikiRepository;
  final IGachaRepository? gachaRepository;
  final IFriendsRepository? friendsRepository;
  final IChatRepository? chatRepository;
  final ILeaderboardRepository? leaderboardRepository;
  final IStoreRepository? storeRepository;
  final IAchievementsRepository? achievementsRepository;
  final IVocabularyRepository? vocabularyRepository;
  final ProfileRepository? profileRepository;
  final SettingsRepository? settingsRepository;

  const HubElApp({
    super.key,
    required this.authBloc,
    required this.dashboardBloc,
    required this.searchBloc,
    required this.watchBloc,
    required this.quizBloc,
    required this.wikiManagerBloc,
    this.friendsCubit,
    this.chatCubit,
    this.leaderboardCubit,
    this.storeCubit,
    this.achievementsCubit,
    this.vocabularyCubit,
    this.profileCubit,
    this.settingsCubit,
    required this.checkVideoLinkUseCase,
    this.wikiRepository,
    this.gachaRepository,
    this.friendsRepository,
    this.chatRepository,
    this.leaderboardRepository,
    this.storeRepository,
    this.achievementsRepository,
    this.vocabularyRepository,
    this.profileRepository,
    this.settingsRepository,
  });

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: checkVideoLinkUseCase),
        if (wikiRepository != null)
          RepositoryProvider<IWikiRepository>.value(value: wikiRepository!),
        if (gachaRepository != null)
          RepositoryProvider<IGachaRepository>.value(value: gachaRepository!),
        if (friendsRepository != null)
          RepositoryProvider<IFriendsRepository>.value(value: friendsRepository!),
        if (chatRepository != null)
          RepositoryProvider<IChatRepository>.value(value: chatRepository!),
        if (leaderboardRepository != null)
          RepositoryProvider<ILeaderboardRepository>.value(value: leaderboardRepository!),
        if (storeRepository != null)
          RepositoryProvider<IStoreRepository>.value(value: storeRepository!),
        if (achievementsRepository != null)
          RepositoryProvider<IAchievementsRepository>.value(value: achievementsRepository!),
        if (vocabularyRepository != null)
          RepositoryProvider<IVocabularyRepository>.value(value: vocabularyRepository!),
        if (profileRepository != null)
          RepositoryProvider<ProfileRepository>.value(value: profileRepository!),
        if (settingsRepository != null)
          RepositoryProvider<SettingsRepository>.value(value: settingsRepository!),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider.value(value: authBloc),
          BlocProvider.value(value: dashboardBloc),
          BlocProvider.value(value: searchBloc),
          BlocProvider.value(value: watchBloc),
          BlocProvider.value(value: quizBloc),
          BlocProvider.value(value: wikiManagerBloc),
          if (friendsCubit != null)
            BlocProvider.value(value: friendsCubit!),
          if (chatCubit != null)
            BlocProvider.value(value: chatCubit!),
          if (leaderboardCubit != null)
            BlocProvider.value(value: leaderboardCubit!),
          if (storeCubit != null)
            BlocProvider.value(value: storeCubit!),
          if (achievementsCubit != null)
            BlocProvider.value(value: achievementsCubit!),
          if (vocabularyCubit != null)
            BlocProvider.value(value: vocabularyCubit!),
          if (profileCubit != null)
            BlocProvider.value(value: profileCubit!),
          if (settingsCubit != null)
            BlocProvider.value(value: settingsCubit!),
        ],
        child: MaterialApp(
          title: 'Hub-EL Mobile',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeMode.dark, // Khớp với phong cách Dark theme không gian của Website
          home: const AuthRootNavigator(),
        ),
      ),
    );
  }
}

class AuthRootNavigator extends StatelessWidget {
  const AuthRootNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthInitial || (state is AuthLoading && state.message?.contains('kiểm tra') == true)) {
          return const Scaffold(
            body: Center(
              child: LoadingWidget(message: 'Đang kiểm tra phiên làm việc...'),
            ),
          );
        }

        if (state is Authenticated) {
          return MainShellScreen(user: state.user);
        }

        return const LoginScreen();
      },
    );
  }
}
