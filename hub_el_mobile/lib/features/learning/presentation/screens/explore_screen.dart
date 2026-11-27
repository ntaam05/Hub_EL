import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../../shared/widgets/search_suggestions_list.dart';
import '../../domain/entities/video_item_entity.dart';
import '../../domain/repositories/learning_repository.dart';
import '../../domain/usecases/check_video_link_usecase.dart';
import '../bloc/search/search_bloc.dart';
import '../bloc/search/search_event.dart';
import '../bloc/search/search_state.dart';
import '../widgets/video_search_tile.dart';
import '../../../courses/presentation/screens/playlist_screen.dart';
import 'watch_screen.dart';

class ExploreScreen extends StatefulWidget {
  final String initialQuery;

  const ExploreScreen({super.key, required this.initialQuery});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  late final TextEditingController _searchController;
  final TextEditingController _linkController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  bool _isCheckingLink = false;
  bool _showSuggestions = false;
  List<String> _history = [];
  List<String> _suggestions = [];
  Timer? _suggestDebounce;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.initialQuery);
    _searchFocusNode.addListener(_onSearchFocusChanged);
    if (widget.initialQuery.trim().isNotEmpty) {
      context.read<SearchBloc>().add(SearchVideosRequested(widget.initialQuery.trim()));
    } else {
      _loadSuggestions('');
    }
  }

  @override
  void dispose() {
    _suggestDebounce?.cancel();
    _searchFocusNode.removeListener(_onSearchFocusChanged);
    _searchFocusNode.dispose();
    _searchController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  void _onSearchFocusChanged() {
    if (_searchFocusNode.hasFocus) {
      setState(() => _showSuggestions = true);
      _loadSuggestions(_searchController.text);
    }
  }

  void _onSearchTextChanged(String text) {
    if (!_showSuggestions) {
      setState(() => _showSuggestions = true);
    }
    _suggestDebounce?.cancel();
    _suggestDebounce = Timer(
      Duration(milliseconds: text.trim().isEmpty ? 0 : 220),
      () => _loadSuggestions(text),
    );
  }

  Future<void> _loadSuggestions(String query) async {
    try {
      final repo = context.read<ILearningRepository>();
      final res = await repo.getSearchSuggestions(query);
      if (mounted) {
        setState(() {
          _history = res.history;
          _suggestions = res.suggestions;
        });
      }
    } catch (_) {}
  }

  void _onSearchSubmit(String query) {
    final trimmed = query.trim();
    if (trimmed.isNotEmpty) {
      _searchController.text = trimmed;
      _searchFocusNode.unfocus();
      setState(() => _showSuggestions = false);
      context.read<SearchBloc>().add(SearchVideosRequested(trimmed));
    }
  }

  Future<void> _onYoutubeLinkSubmit() async {
    final link = _linkController.text.trim();
    if (link.isEmpty || _isCheckingLink) return;

    setState(() => _isCheckingLink = true);
    try {
      final checkUseCase = context.read<CheckVideoLinkUseCase>();
      final result = await checkUseCase(link);
      if (!mounted) return;
      if (result is ApiSuccess<VideoItemEntity>) {
        _linkController.clear();
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => WatchScreen(video: result.data)),
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
    } finally {
      if (mounted) setState(() => _isCheckingLink = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : AppColors.lightTextPrimary,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Container(
          height: 40,
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(999),
          ),
          child: TextField(
            controller: _searchController,
            focusNode: _searchFocusNode,
            textInputAction: TextInputAction.search,
            onChanged: _onSearchTextChanged,
            onSubmitted: _onSearchSubmit,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.white : AppColors.lightTextPrimary,
            ),
            decoration: InputDecoration(
              hintText: 'Tìm kiếm khóa học...',
              hintStyle: TextStyle(
                fontSize: 13,
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
              ),
              prefixIcon: const Icon(LucideIcons.search, size: 16),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
          // Thanh tìm kiếm riêng dành cho gắn link YouTube (kiểm tra tính hợp lệ trước khi mở)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : Colors.white,
              border: Border(
                bottom: BorderSide(
                  color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
                ),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 40,
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkCard : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                      ),
                    ),
                    child: TextField(
                      controller: _linkController,
                      textInputAction: TextInputAction.go,
                      onSubmitted: (_) => _onYoutubeLinkSubmit(),
                      style: TextStyle(
                        fontSize: 12.5,
                        color: isDark ? Colors.white : AppColors.lightTextPrimary,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Gắn link YouTube vào đây để học ngay...',
                        hintStyle: TextStyle(
                          fontSize: 12.5,
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        ),
                        prefixIcon: const Icon(LucideIcons.playCircle, size: 16, color: Colors.redAccent),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      ),
                    ),
                  ),
                ),
                AppSpacing.gapH8,
                SizedBox(
                  height: 40,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                    ),
                    onPressed: _isCheckingLink ? null : _onYoutubeLinkSubmit,
                    child: _isCheckingLink
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Mở video', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: BlocBuilder<SearchBloc, SearchState>(
        builder: (context, state) {
          if (state is SearchLoading) {
            return const Center(child: LoadingWidget(message: 'Đang tìm kiếm bài giảng giáo dục...'));
          }

          if (state is SearchFailure) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(LucideIcons.shieldAlert, color: Colors.redAccent, size: 36),
                    ),
                    AppSpacing.gapV16,
                    const Text(
                      'Truy vấn bị từ chối!',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    AppSpacing.gapV8,
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state is SearchLoaded) {
            final videos = state.videos;

            return ListView(
              padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 40),
              children: [
                // Header Kết quả
                Row(
                  children: [
                    Text(
                      'Kết quả cho: ',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.lightTextPrimary,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        '"${state.query}"',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryLight,
                        ),
                      ),
                    ),
                  ],
                ),
                AppSpacing.gapV16,

                if (videos.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: Text('Không tìm thấy video nào phù hợp.'),
                    ),
                  )
                else
                  ...videos.map(
                    (vid) => VideoSearchTile(
                      video: vid,
                      onTap: () {
                        if (vid.isPlaylist) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => PlaylistScreen(
                                playlistItem: vid,
                              ),
                            ),
                          );
                          return;
                        }
                        if (vid.type == 'channel') {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Tính năng xem trang Kênh YouTube sẽ được hỗ trợ trong phiên bản kế tiếp!'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                          return;
                        }
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => WatchScreen(video: vid),
                          ),
                        );
                      },
                    ),
                  ),

                // Nút Hiển thị thêm kết quả (Next Page)
                if (state.nextPageToken != null) ...[
                  AppSpacing.gapV20,
                  Center(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      onPressed: state.isLoadingMore
                          ? null
                          : () {
                              context.read<SearchBloc>().add(
                                    SearchVideosRequested(
                                      state.query,
                                      pageToken: state.nextPageToken,
                                      isLoadMore: true,
                                    ),
                                  );
                            },
                      child: state.isLoadingMore
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Hiển thị thêm kết quả'),
                    ),
                  ),
                ],
              ],
            );
          }

          return const Center(
            child: Text('Nhập từ khóa giáo dục để bắt đầu tìm kiếm!'),
          );
        },
      ),
          ),
        ],
      ),
          if (_showSuggestions && (_history.isNotEmpty || _suggestions.isNotEmpty))
            Positioned(
              top: 8,
              left: 12,
              right: 12,
              child: SearchSuggestionsList(
                history: _history,
                suggestions: _suggestions,
                onSelected: _onSearchSubmit,
              ),
            ),
        ],
      ),
    );
  }
}
