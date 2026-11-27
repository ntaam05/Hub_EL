import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/avatar_image_helper.dart';
import '../../features/authentication/domain/entities/user_entity.dart';
import '../../features/authentication/presentation/bloc/auth_bloc.dart';
import '../../features/authentication/presentation/bloc/auth_event.dart';
import '../../features/learning/domain/repositories/learning_repository.dart';
import 'search_suggestions_list.dart';
import '../../features/wiki/presentation/screens/wiki_manager_screen.dart';
import '../../features/gacha/presentation/screens/gacha_screen.dart';
import '../../features/store/presentation/screens/store_screen.dart';
import '../../features/store/presentation/cubit/store_cubit.dart';
import '../../features/store/presentation/cubit/store_state.dart';
import '../../features/achievements/presentation/screens/achievements_screen.dart';
import '../../features/vocabulary/presentation/screens/vocabulary_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import 'resource_pill.dart';
import 'stats_dialog.dart';
import 'streak_dialog.dart';

class MobileHeaderBar extends StatefulWidget implements PreferredSizeWidget {
  final UserEntity user;
  final Function(String query)? onSearchSubmitted;
  final Function(String youtubeLink)? onPlayLinkSubmitted;

  const MobileHeaderBar({
    super.key,
    required this.user,
    this.onSearchSubmitted,
    this.onPlayLinkSubmitted,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60.0);

  @override
  State<MobileHeaderBar> createState() => _MobileHeaderBarState();
}

class _MobileHeaderBarState extends State<MobileHeaderBar> {
  bool _isSearchOpen = false;
  bool _isLinkOpen = false;
  final _searchController = TextEditingController();
  final _linkController = TextEditingController();
  OverlayEntry? _suggestionsOverlay;
  List<String> _searchHistory = [];
  List<String> _searchSuggestions = [];
  Timer? _suggestDebounce;

  @override
  void dispose() {
    _removeSuggestionsOverlay();
    _suggestDebounce?.cancel();
    _searchController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  void _removeSuggestionsOverlay() {
    _suggestionsOverlay?.remove();
    _suggestionsOverlay = null;
  }

  void _showOrUpdateSuggestionsOverlay() {
    if (!_isSearchOpen || (_searchHistory.isEmpty && _searchSuggestions.isEmpty)) {
      _removeSuggestionsOverlay();
      return;
    }

    if (_suggestionsOverlay != null) {
      _suggestionsOverlay!.markNeedsBuild();
      return;
    }

    final overlay = Overlay.maybeOf(context);
    if (overlay == null) return;

    final topOffset = MediaQuery.of(context).padding.top + widget.preferredSize.height + 4;

    _suggestionsOverlay = OverlayEntry(
      builder: (ctx) => Positioned(
        top: topOffset,
        left: 12,
        right: 12,
        child: Material(
          color: Colors.transparent,
          child: SearchSuggestionsList(
            history: _searchHistory,
            suggestions: _searchSuggestions,
            onSelected: (term) {
              _searchController.text = term;
              _removeSuggestionsOverlay();
              setState(() => _isSearchOpen = false);
              widget.onSearchSubmitted?.call(term);
            },
          ),
        ),
      ),
    );
    overlay.insert(_suggestionsOverlay!);
  }

  Future<void> _fetchHeaderSuggestions(String query) async {
    try {
      final repo = context.read<ILearningRepository>();
      final res = await repo.getSearchSuggestions(query);
      if (mounted && _isSearchOpen) {
        setState(() {
          _searchHistory = res.history;
          _searchSuggestions = res.suggestions;
        });
        _showOrUpdateSuggestionsOverlay();
      }
    } catch (_) {}
  }

  void _onHeaderSearchChanged(String val) {
    _suggestDebounce?.cancel();
    _suggestDebounce = Timer(
      Duration(milliseconds: val.trim().isEmpty ? 0 : 220),
      () => _fetchHeaderSuggestions(val),
    );
  }

  void _openProfileMenu(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final reqXp = 500 + (widget.user.level * widget.user.level * 20);
    final xpPercent = (widget.user.xp / reqXp).clamp(0.0, 1.0);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 30,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Thanh kéo
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                AppSpacing.gapV16,

                // Thẻ thông tin User & Level
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _buildAvatarCircle(size: 44),
                          AppSpacing.gapH12,
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.user.displayName,
                                  style: AppTextStyles.h2.copyWith(
                                    fontSize: 16,
                                    color: isDark ? Colors.white : AppColors.lightTextPrimary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  widget.user.email,
                                  style: AppTextStyles.caption.copyWith(
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          if (widget.user.isPro)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.proBadge,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'PRO',
                                style: AppTextStyles.microBadge.copyWith(color: AppColors.proText),
                              ),
                            ),
                        ],
                      ),
                      AppSpacing.gapV12,
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Cấp ${widget.user.level}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          Text(
                            '${widget.user.xp}/$reqXp XP',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                      AppSpacing.gapV6,
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: xpPercent,
                          minHeight: 6,
                          backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
                        ),
                      ),
                    ],
                  ),
                ),
                AppSpacing.gapV12,

                // Các tùy chọn danh mục
                _buildMenuItem(
                  icon: LucideIcons.brainCircuit,
                  color: Colors.purpleAccent,
                  title: 'Wiki Tri Thức & Bài Học',
                  isDark: isDark,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const WikiManagerScreen(showAppBar: true),
                      ),
                    );
                  },
                ),
                _buildMenuItem(
                  icon: LucideIcons.sparkles,
                  color: const Color(0xFF38BDF8),
                  title: 'Cầu Nguyện Tri Thức (Gacha)',
                  isDark: isDark,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const GachaScreen(showBackButton: true),
                      ),
                    );
                  },
                ),
                _buildMenuItem(
                  icon: LucideIcons.bookMarked,
                  color: Colors.blueAccent,
                  title: 'Kho Từ Vựng',
                  isDark: isDark,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const VocabularyScreen(),
                      ),
                    );
                  },
                ),
                _buildMenuItem(
                  icon: LucideIcons.award,
                  color: Colors.amberAccent,
                  title: 'Thành Tựu & Huy Hiệu',
                  isDark: isDark,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AchievementsScreen(),
                      ),
                    );
                  },
                ),
                _buildMenuItem(
                  icon: LucideIcons.barChart2,
                  color: Colors.indigoAccent,
                  title: 'Thống Kê Học Tập',
                  isDark: isDark,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    StatsDialog.show(context, user: widget.user);
                  },
                ),
                _buildMenuItem(
                  icon: LucideIcons.shoppingCart,
                  color: AppColors.success,
                  title: 'Cửa Hàng Vật Phẩm',
                  isDark: isDark,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const StoreScreen(),
                      ),
                    );
                  },
                ),
                const Divider(height: 12),
                _buildMenuItem(
                  icon: LucideIcons.user,
                  color: Colors.cyanAccent,
                  title: 'Hồ Sơ Cá Nhân',
                  isDark: isDark,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const ProfileScreen(),
                      ),
                    );
                  },
                ),
                const Divider(height: 12),
                _buildMenuItem(
                  icon: LucideIcons.logOut,
                  color: AppColors.error,
                  title: 'Đăng Xuất',
                  textColor: AppColors.error,
                  isDark: isDark,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    context.read<AuthBloc>().add(const AuthLogoutRequested());
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color color,
    required String title,
    Color? textColor,
    required VoidCallback onTap,
    bool isDark = true,
  }) {
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      leading: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textColor ?? (isDark ? Colors.white : AppColors.lightTextPrimary),
        ),
      ),
      trailing: const Icon(LucideIcons.chevronRight, size: 16, color: Colors.grey),
      onTap: onTap,
    );
  }

  Widget _buildAvatarCircle({double size = 34}) {
    final imageProvider = safeGetImageProvider(widget.user.displayAvatar);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppColors.primaryGradient,
        border: Border.all(color: AppColors.primaryLight, width: 1.5),
        image: imageProvider != null
            ? DecorationImage(
                image: imageProvider,
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: imageProvider == null
          ? Center(
              child: Text(
                widget.user.displayName.isNotEmpty
                    ? widget.user.displayName.substring(0, 1).toUpperCase()
                    : 'U',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: size * 0.45,
                ),
              ),
            )
          : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface.withValues(alpha: 0.92) : Colors.white.withValues(alpha: 0.92),
            border: Border(
              bottom: BorderSide(
                color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
                width: 1,
              ),
            ),
          ),
          child: SafeArea(
            bottom: false,
            child: _isSearchOpen
                ? _buildSearchOverlay(isDark)
                : (_isLinkOpen ? _buildLinkOverlay(isDark) : _buildStandardHeader(isDark)),
          ),
        ),
      ),
    );
  }

  Widget _buildStandardHeader(bool isDark) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final showBrandText = constraints.maxWidth >= 420;

        return Row(
          children: [
            // Logo & Search Icon
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(LucideIcons.graduationCap, color: Colors.white, size: 18),
                ),
                if (showBrandText) ...[
                  AppSpacing.gapH6,
                  ShaderMask(
                    shaderCallback: (bounds) => AppColors.primaryGradient.createShader(bounds),
                    child: const Text(
                      'Hub-EL',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                ],
                const SizedBox(width: 6),
                InkWell(
                  onTap: () {
                    setState(() {
                      _isSearchOpen = true;
                      _isLinkOpen = false;
                    });
                    _fetchHeaderSuggestions(_searchController.text);
                  },
                  borderRadius: BorderRadius.circular(999),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white10 : Colors.grey.shade100,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      LucideIcons.search,
                      size: 15,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                InkWell(
                  onTap: () => setState(() {
                    _isLinkOpen = true;
                    _isSearchOpen = false;
                  }),
                  borderRadius: BorderRadius.circular(999),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.link,
                      size: 15,
                      color: Colors.redAccent,
                    ),
                  ),
                ),
              ],
            ),

            const Spacer(),

            // Cụm Resource Badges (Đồng bộ thời gian thực từ StoreCubit & User)
            BlocBuilder<StoreCubit, StoreState>(
              builder: (context, storeState) {
                final balance = storeState.catalog?.balance;
                final maxEnergy = balance?.maxEnergy ?? widget.user.maxEnergy;
                final energyValue = balance != null ? '${balance.aiTokens}/$maxEnergy' : '${widget.user.aiTokens}/$maxEnergy';
                final coinValue = balance != null ? '${balance.freeCoins}' : '${widget.user.freeCoins}';
                final gemValue = balance != null ? '${balance.premiumCoins}' : '${widget.user.premiumCoins}';

                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ResourcePill(
                      type: ResourcePillType.streak,
                      value: '${widget.user.currentStreak}',
                      isActive: widget.user.isStudiedToday,
                      onTap: () {
                        // Kích hoạt đồng bộ trạng thái mới nhất từ server
                        context.read<AuthBloc>().add(const AuthUserRefreshed());
                        StreakDialog.show(
                          context,
                          streak: widget.user.currentStreak,
                          streakFreezes: widget.user.streakFreezes,
                          isStudiedToday: widget.user.isStudiedToday,
                        );
                      },
                    ),
                    const SizedBox(width: 3),
                    ResourcePill(
                      type: ResourcePillType.energy,
                      value: energyValue,
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const StoreScreen(initialTab: StoreTab.exchange),
                          ),
                        );
                        if (context.mounted) {
                          final currentBalance = context.read<StoreCubit>().state.catalog?.balance;
                          if (currentBalance != null) {
                            context.read<AuthBloc>().add(AuthUserBalanceUpdated(
                              freeCoins: currentBalance.freeCoins,
                              aiTokens: currentBalance.aiTokens,
                              premiumCoins: currentBalance.premiumCoins,
                              stardust: currentBalance.stardust,
                              isPro: currentBalance.isPro,
                            ));
                          }
                        }
                      },
                    ),
                    const SizedBox(width: 3),
                    ResourcePill(
                      type: ResourcePillType.coin,
                      value: coinValue,
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const StoreScreen(initialTab: StoreTab.exchange),
                          ),
                        );
                        if (context.mounted) {
                          final currentBalance = context.read<StoreCubit>().state.catalog?.balance;
                          if (currentBalance != null) {
                            context.read<AuthBloc>().add(AuthUserBalanceUpdated(
                              freeCoins: currentBalance.freeCoins,
                              aiTokens: currentBalance.aiTokens,
                              premiumCoins: currentBalance.premiumCoins,
                              stardust: currentBalance.stardust,
                              isPro: currentBalance.isPro,
                            ));
                          }
                        }
                      },
                    ),
                    const SizedBox(width: 3),
                    ResourcePill(
                      type: ResourcePillType.gem,
                      value: gemValue,
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const StoreScreen(initialTab: StoreTab.gems),
                          ),
                        );
                        if (context.mounted) {
                          final currentBalance = context.read<StoreCubit>().state.catalog?.balance;
                          if (currentBalance != null) {
                            context.read<AuthBloc>().add(AuthUserBalanceUpdated(
                              freeCoins: currentBalance.freeCoins,
                              aiTokens: currentBalance.aiTokens,
                              premiumCoins: currentBalance.premiumCoins,
                              stardust: currentBalance.stardust,
                              isPro: currentBalance.isPro,
                            ));
                          }
                        }
                      },
                    ),
                    const SizedBox(width: 5),

                    // Avatar Menu Trigger
                    GestureDetector(
                      onTap: () => _openProfileMenu(context),
                      child: _buildAvatarCircle(size: 32),
                    ),
                  ],
                );
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildSearchOverlay(bool isDark) {
    return Row(
      children: [
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: 36,
                child: TextField(
                  controller: _searchController,
                  autofocus: true,
                  textInputAction: TextInputAction.search,
                  onChanged: _onHeaderSearchChanged,
                  onSubmitted: (val) {
                    if (val.trim().isNotEmpty) {
                      _removeSuggestionsOverlay();
                      widget.onSearchSubmitted?.call(val.trim());
                      setState(() => _isSearchOpen = false);
                    }
                  },
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm khóa học...',
                    hintStyle: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                    ),
                    prefixIcon: const Icon(LucideIcons.search, size: 16),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                    filled: true,
                    fillColor: isDark ? AppColors.darkInputFill : Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        AppSpacing.gapH8,
        IconButton(
          icon: const Icon(LucideIcons.x, size: 20),
          onPressed: () {
            _removeSuggestionsOverlay();
            setState(() => _isSearchOpen = false);
          },
        ),
      ],
    );
  }

  Widget _buildLinkOverlay(bool isDark) {
    return Row(
      children: [
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: 36,
                child: TextField(
                  controller: _linkController,
                  autofocus: true,
                  textInputAction: TextInputAction.go,
                  onSubmitted: (val) {
                    if (val.trim().isNotEmpty) {
                      widget.onPlayLinkSubmitted?.call(val.trim());
                      _linkController.clear();
                      setState(() => _isLinkOpen = false);
                    }
                  },
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Dán link YouTube để học ngay...',
                    hintStyle: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                    ),
                    prefixIcon: const Icon(LucideIcons.playCircle, size: 16, color: Colors.redAccent),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                    filled: true,
                    fillColor: isDark ? AppColors.darkInputFill : Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        AppSpacing.gapH6,
        TextButton(
          onPressed: () {
            final link = _linkController.text.trim();
            if (link.isNotEmpty) {
              widget.onPlayLinkSubmitted?.call(link);
              _linkController.clear();
              setState(() => _isLinkOpen = false);
            }
          },
          child: const Text('Mở', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        IconButton(
          icon: const Icon(LucideIcons.x, size: 20),
          onPressed: () => setState(() => _isLinkOpen = false),
        ),
      ],
    );
  }
}
