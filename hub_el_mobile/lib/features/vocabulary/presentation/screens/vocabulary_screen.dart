import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../domain/entities/vocabulary_entities.dart';
import '../cubit/vocabulary_cubit.dart';
import '../cubit/vocabulary_state.dart';
import '../services/vocabulary_tts_service.dart';
import '../widgets/vocabulary_card.dart';
import '../widgets/vocabulary_context_modal.dart';
import '../widgets/vocabulary_dashboard_header.dart';
import '../widgets/vocabulary_detail_sheet.dart';
import '../widgets/vocabulary_filter_bar.dart';

class VocabularyScreen extends StatefulWidget {
  const VocabularyScreen({super.key});

  @override
  State<VocabularyScreen> createState() => _VocabularyScreenState();
}

class _VocabularyScreenState extends State<VocabularyScreen> {
  final TextEditingController _searchController = TextEditingController();
  final VocabularyTtsService _ttsService = VocabularyTtsService();
  bool _isSearchOpen = false;

  @override
  void initState() {
    super.initState();
    _ttsService.init();
    final cubit = context.read<VocabularyCubit>();
    if (cubit.state.status == VocabularyStatus.initial) {
      cubit.loadVocabulary();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _ttsService.dispose();
    super.dispose();
  }

  void _onSpeak(VocabularyItemEntity item) {
    _ttsService.speak(
      item.word,
      languageCode: item.ttsLanguageCode,
    );
  }

  void _openDetailSheet(VocabularyItemEntity item) {
    VocabularyDetailSheet.show(
      context,
      item: item,
      onSpeak: () => _onSpeak(item),
      onViewContext: () => _openContextModal(item),
    );
  }

  void _openContextModal(VocabularyItemEntity item) {
    final cubit = context.read<VocabularyCubit>();
    cubit.loadVocabularyContext(item.cardId, item.word);

    VocabularyContextModal.show(
      context,
      cubit: cubit,
      targetWord: item.word,
      onClose: () => cubit.clearSelectedContext(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BlocConsumer<VocabularyCubit, VocabularyState>(
      listenWhen: (prev, curr) =>
          prev.isContextLoading != curr.isContextLoading ||
          prev.selectedContext != curr.selectedContext ||
          prev.contextError != curr.contextError,
      listener: (context, state) {
        // Có thể bổ sung toast khi cần
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: _isSearchOpen
                ? TextField(
                    controller: _searchController,
                    autofocus: true,
                    style: TextStyle(
                      color: isDark ? Colors.white : Colors.black87,
                      fontSize: 14,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Tìm từ vựng hoặc nghĩa...',
                      hintStyle: TextStyle(
                        color: isDark ? Colors.white38 : Colors.grey,
                        fontSize: 14,
                      ),
                      border: InputBorder.none,
                    ),
                    onChanged: (val) {
                      context.read<VocabularyCubit>().setSearchQuery(val);
                    },
                  )
                : const Text(
                    'SỔ TAY TỪ VỰNG',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                  ),
            backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
            elevation: 0.5,
            actions: [
              IconButton(
                icon: Icon(_isSearchOpen ? LucideIcons.x : LucideIcons.search, size: 20),
                onPressed: () {
                  setState(() {
                    _isSearchOpen = !_isSearchOpen;
                    if (!_isSearchOpen) {
                      _searchController.clear();
                      context.read<VocabularyCubit>().setSearchQuery('');
                    }
                  });
                },
              ),
              IconButton(
                icon: const Icon(LucideIcons.rotateCw, size: 19),
                onPressed: state.status == VocabularyStatus.loading
                    ? null
                    : () => context.read<VocabularyCubit>().loadVocabulary(),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => context.read<VocabularyCubit>().loadVocabulary(showLoading: false),
            child: _buildBody(context, state, isDark),
          ),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, VocabularyState state, bool isDark) {
    if (state.status == VocabularyStatus.loading && state.items.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF6366F1)),
      );
    }

    if (state.status == VocabularyStatus.error && state.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.redAccent),
              AppSpacing.gapV16,
              Text(
                state.errorMessage ?? 'Không thể tải sổ tay từ vựng',
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              AppSpacing.gapV16,
              ElevatedButton.icon(
                onPressed: () => context.read<VocabularyCubit>().loadVocabulary(),
                icon: const Icon(LucideIcons.rotateCw, size: 16),
                label: const Text('Thử lại'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final filtered = state.filteredItems;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      children: [
        // 1. Dashboard Header
        VocabularyDashboardHeader(
          totalCount: state.totalWords,
          languageCounts: state.languageCounts,
        ),

        AppSpacing.gapV16,

        // 2. Filter Bar
        VocabularyFilterBar(
          selectedLanguage: state.selectedLanguage,
          selectedPos: state.selectedPos,
          sortOrder: state.sortOrder,
          posList: state.posList,
          hasActiveFilters: state.hasActiveFilters,
          onLanguageChanged: (lang) =>
              context.read<VocabularyCubit>().setLanguageFilter(lang),
          onPosChanged: (pos) =>
              context.read<VocabularyCubit>().setPosFilter(pos),
          onToggleSort: () =>
              context.read<VocabularyCubit>().toggleSortOrder(),
          onReset: () =>
              context.read<VocabularyCubit>().resetFilters(),
        ),

        AppSpacing.gapV16,

        // 3. Tiêu đề danh sách
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'DANH SÁCH TỪ VỰNG (${filtered.length})',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
              ),
            ),
            if (state.hasActiveFilters)
              InkWell(
                onTap: () => context.read<VocabularyCubit>().resetFilters(),
                child: const Text(
                  'Hiển thị tất cả',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF6366F1),
                  ),
                ),
              ),
          ],
        ),

        AppSpacing.gapV12,

        // 4. Danh sách từ vựng hoặc Empty State
        if (filtered.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 50, horizontal: 20),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  LucideIcons.layers,
                  size: 48,
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                ),
                AppSpacing.gapV12,
                const Text(
                  'Không tìm thấy từ vựng nào',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Hãy thử tìm từ khóa khác hoặc quay Gacha để mở khóa thêm thẻ Wiki tri thức mới!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                  ),
                ),
              ],
            ),
          )
        else
          ...filtered.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: VocabularyCard(
                item: item,
                onSpeak: () => _onSpeak(item),
                onTapCard: () => _openDetailSheet(item),
                onTapContext: () => _openContextModal(item),
              ),
            );
          }),

        AppSpacing.gapV24,
      ],
    );
  }
}
