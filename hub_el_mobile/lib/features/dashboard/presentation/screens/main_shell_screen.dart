import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/network/api_result.dart';
import '../../../../shared/widgets/custom_bottom_nav.dart';
import '../../../../shared/widgets/mobile_header_bar.dart';
import '../../../authentication/domain/entities/user_entity.dart';
import '../../../authentication/presentation/bloc/auth_bloc.dart';
import '../../../authentication/presentation/bloc/auth_event.dart';
import '../../../social/data/services/chat_socket_service.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';
import '../../../learning/domain/usecases/check_video_link_usecase.dart';
import '../../../learning/presentation/screens/explore_screen.dart';
import '../../../learning/presentation/screens/watch_screen.dart';
import '../../../practice/presentation/screens/practice_screen.dart';
import '../../../courses/presentation/screens/courses_screen.dart';
import '../../../social/presentation/screens/friends_screen.dart';
import '../../../leaderboard/presentation/screens/leaderboard_screen.dart';
import '../../../store/presentation/cubit/store_cubit.dart';
import 'dashboard_screen.dart';

class MainShellScreen extends StatefulWidget {
  final UserEntity user;

  const MainShellScreen({super.key, required this.user});

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> with WidgetsBindingObserver {
  int _currentTab = 0;
  bool _isSessionKickedDialogShowing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<StoreCubit>().loadCatalog(showLoading: false);
        _initRealtimeSync();
      }
    });
  }

  Future<void> _initRealtimeSync() async {
    try {
      final socketService = context.read<ChatSocketService>();
      await socketService.connect(widget.user.id);
      socketService.onProfileUpdated((data) {
        if (!mounted) return;
        context.read<AuthBloc>().add(AuthUserProfileUpdated(
          name: data['name'] as String?,
          fullName: data['fullName'] as String?,
          username: data['username'] as String?,
          avatar: data['avatar'] as String?,
          image: data['image'] as String?,
        ));
      });
      socketService.onSessionKicked((data) {
        if (!mounted || _isSessionKickedDialogShowing) return;
        _isSessionKickedDialogShowing = true;
        final message = data['message']?.toString() ??
            'Tài khoản của bạn vừa được đăng nhập ở thiết bị khác. Vui lòng xác nhận để đăng xuất.';
        showDialog<void>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Text('Tài khoản đăng nhập nơi khác'),
            content: Text(message),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  socketService.disconnect();
                  context.read<AuthBloc>().add(const AuthLogoutRequested());
                },
                child: const Text('Xác nhận'),
              ),
            ],
          ),
        );
      });
    } catch (_) {
      // Bỏ qua nếu môi trường test không cung cấp ChatSocketService / AuthBloc
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      try {
        context.read<AuthBloc>().add(const AuthUserRefreshed());
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: MobileHeaderBar(
        user: widget.user,
        onSearchSubmitted: (query) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ExploreScreen(initialQuery: query),
            ),
          );
        },
        onPlayLinkSubmitted: (link) async {
          final checkUseCase = context.read<CheckVideoLinkUseCase>();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Đang kiểm tra và xác minh link YouTube...'),
              duration: Duration(seconds: 1),
            ),
          );
          final result = await checkUseCase(link);
          if (context.mounted) {
            if (result is ApiSuccess<VideoItemEntity>) {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => WatchScreen(video: result.data),
                ),
              );
            } else if (result is ApiFailure<VideoItemEntity>) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(result.message),
                  backgroundColor: AppColors.error,
                  duration: const Duration(seconds: 4),
                ),
              );
            }
          }
        },
      ),
      body: IndexedStack(
        index: _currentTab,
        children: [
          // Tab 0: Tổng quan (Dashboard)
          DashboardScreen(user: widget.user),

          // Tab 1: Góc luyện tập (Quizzes)
          const PracticeScreen(),

          // Tab 2: Khóa học (Courses - FAB)
          const CoursesScreen(),

          // Tab 3: Cộng đồng (Social / Friends)
          const FriendsScreen(),

          // Tab 4: Xếp hạng (Leaderboard)
          const LeaderboardScreen(),
        ],
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentTab,
        onTabSelected: (index) {
          setState(() {
            _currentTab = index;
          });
        },
      ),
    );
  }
}

