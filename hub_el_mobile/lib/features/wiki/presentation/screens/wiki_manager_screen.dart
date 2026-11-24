import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/repositories/wiki_repository.dart';
import '../../domain/usecases/finish_wiki_study_usecase.dart';
import '../../domain/usecases/generate_wiki_study_usecase.dart';
import '../../domain/usecases/get_wiki_study_card_usecase.dart';
import '../../domain/usecases/keep_wiki_card_star_usecase.dart';
import '../bloc/wiki_manager_bloc.dart';
import '../bloc/wiki_manager_event.dart';
import '../bloc/wiki_manager_state.dart';
import '../bloc/wiki_study_bloc.dart';
import '../widgets/review_history_sheet.dart';
import '../widgets/wiki_manager_card_item.dart';
import 'wiki_study_screen.dart';
import 'package:hub_el_mobile/features/gacha/presentation/screens/gacha_screen.dart';

class WikiManagerScreen extends StatefulWidget {
  final bool showAppBar;

  const WikiManagerScreen({super.key, this.showAppBar = false});

  @override
  State<WikiManagerScreen> createState() => _WikiManagerScreenState();
}

class _WikiManagerScreenState extends State<WikiManagerScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Tự động tải inventory nếu chưa được tải
    final bloc = context.read<WikiManagerBloc>();
    if (bloc.state is WikiManagerInitial) {
      bloc.add(const WikiInventoryFetchRequested());
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF050810) : const Color(0xFFF8FAFC);

    final content = RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        context.read<WikiManagerBloc>().add(const WikiInventoryRefreshRequested());
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // --- HEADER: TITLE & SUBTITLE ---
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(LucideIcons.bookOpen, color: Color(0xFF3B82F6), size: 24),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'QUẢN LÝ BÀI HỌC',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Theo dõi tiến độ và xem lại lịch sử các thẻ Wiki của bạn.',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // --- QUICK ACTIONS: KHO TỪ VỰNG & NHẬN THÊM THẺ ---
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Tính năng Kho Từ Vựng sẽ được mở ở các bước tiếp theo!'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                          icon: const Icon(LucideIcons.library, size: 16),
                          label: const Text('Kho Từ Vựng', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: isDark ? const Color(0xFF818CF8) : const Color(0xFF4338CA),
                            backgroundColor: isDark
                                ? const Color(0xFF312E81).withValues(alpha: 0.3)
                                : const Color(0xFFEEF2FF),
                            side: BorderSide(
                              color: isDark ? const Color(0xFF3730A3) : const Color(0xFFC7D2FE),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF2563EB), Color(0xFF9333EA)],
                            ),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF9333EA).withValues(alpha: 0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const GachaScreen(showBackButton: true),
                                ),
                              );
                              if (context.mounted) {
                                context.read<WikiManagerBloc>().add(const WikiInventoryRefreshRequested());
                              }
                            },
                            icon: const Icon(LucideIcons.plusCircle, size: 16, color: Colors.white),
                            label: const Text(
                              'Nhận thêm thẻ',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 0.3,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // --- SEARCH BAR ---
                  TextField(
                    controller: _searchController,
                    onChanged: (val) {
                      context.read<WikiManagerBloc>().add(WikiSearchChanged(val));
                    },
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm theo tên thẻ bài...',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                      prefixIcon: const Icon(LucideIcons.search, size: 18),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(LucideIcons.x, size: 16),
                              onPressed: () {
                                _searchController.clear();
                                context.read<WikiManagerBloc>().add(const WikiSearchChanged(''));
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 1.5),
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // --- FILTERS & SORTS ROW ---
                  BlocBuilder<WikiManagerBloc, WikiManagerState>(
                    builder: (context, state) {
                      final currentFilter = state is WikiManagerLoaded
                          ? state.currentFilter
                          : WikiFilter.all;
                      final currentSort = state is WikiManagerLoaded
                          ? state.currentSort
                          : WikiSort.newest;
                      final selectedRarity = state is WikiManagerLoaded
                          ? state.selectedRarity
                          : null;

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Filter Ownership / Study Pills
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _buildFilterPill(
                                  context: context,
                                  label: 'Tất cả',
                                  filter: WikiFilter.all,
                                  isSelected: currentFilter == WikiFilter.all,
                                  isDark: isDark,
                                ),
                                const SizedBox(width: 8),
                                _buildFilterPill(
                                  context: context,
                                  label: 'Đã sở hữu',
                                  filter: WikiFilter.owned,
                                  isSelected: currentFilter == WikiFilter.owned,
                                  isDark: isDark,
                                ),
                                const SizedBox(width: 8),
                                _buildFilterPill(
                                  context: context,
                                  label: 'Chưa sở hữu',
                                  filter: WikiFilter.unowned,
                                  isSelected: currentFilter == WikiFilter.unowned,
                                  isDark: isDark,
                                ),
                                const SizedBox(width: 8),
                                _buildFilterPill(
                                  context: context,
                                  label: 'Đã học',
                                  filter: WikiFilter.studied,
                                  isSelected: currentFilter == WikiFilter.studied,
                                  isDark: isDark,
                                ),
                                const SizedBox(width: 8),
                                _buildFilterPill(
                                  context: context,
                                  label: 'Chưa học',
                                  filter: WikiFilter.unstudied,
                                  isSelected: currentFilter == WikiFilter.unstudied,
                                  isDark: isDark,
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 10),

                          // 2. Rarity Filter Pills
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      LucideIcons.sparkles,
                                      size: 13,
                                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'ĐỘ HIẾM:',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.8,
                                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 8),
                                _buildRarityPill(
                                  context: context,
                                  label: 'TẤT CẢ',
                                  rarity: null,
                                  isSelected: selectedRarity == null,
                                  isDark: isDark,
                                ),
                                const SizedBox(width: 6),
                                for (final r in ['MR', 'LR', 'UR', 'SSR', 'SR', 'R', 'N']) ...[
                                  _buildRarityPill(
                                    context: context,
                                    label: r,
                                    rarity: r,
                                    isSelected: selectedRarity == r,
                                    isDark: isDark,
                                  ),
                                  const SizedBox(width: 6),
                                ],
                              ],
                            ),
                          ),

                          const SizedBox(height: 10),

                          // 3. Sort Pills
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      LucideIcons.arrowDownAz,
                                      size: 14,
                                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'SẮP XẾP:',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.8,
                                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 8),
                                _buildSortPill(
                                  context: context,
                                  label: 'Mới nhất',
                                  sort: WikiSort.newest,
                                  isSelected: currentSort == WikiSort.newest,
                                  isDark: isDark,
                                ),
                                const SizedBox(width: 6),
                                _buildSortPill(
                                  context: context,
                                  label: 'Độ hiếm',
                                  sort: WikiSort.rarity,
                                  isSelected: currentSort == WikiSort.rarity,
                                  isDark: isDark,
                                ),
                                const SizedBox(width: 6),
                                _buildSortPill(
                                  context: context,
                                  label: 'A-Z',
                                  sort: WikiSort.name,
                                  isSelected: currentSort == WikiSort.name,
                                  isDark: isDark,
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          // --- CARDS LIST OR STATES ---
          BlocBuilder<WikiManagerBloc, WikiManagerState>(
            builder: (context, state) {
              if (state is WikiManagerLoading) {
                return const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(strokeWidth: 3),
                        SizedBox(height: 14),
                        Text('Đang tải dữ liệu bộ sưu tập...'),
                      ],
                    ),
                  ),
                );
              }

              if (state is WikiManagerError) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.alertTriangle, size: 48, color: AppColors.error),
                          const SizedBox(height: 12),
                          Text(
                            state.message,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () {
                              context.read<WikiManagerBloc>().add(const WikiInventoryFetchRequested());
                            },
                            icon: const Icon(LucideIcons.refreshCw, size: 16),
                            label: const Text('Thử lại'),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              if (state is WikiManagerLoaded) {
                final items = state.filteredInventory;

                if (items.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              LucideIcons.sparkles,
                              size: 54,
                              color: isDark ? Colors.white24 : Colors.black26,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Không có thẻ nào phù hợp.',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final item = items[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: WikiManagerCardItem(
                            item: item,
                            onAttemptTap: (att) {
                              ReviewHistorySheet.show(context, att);
                            },
                            onStudyTap: () async {
                              final result = await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => BlocProvider(
                                    create: (ctx) {
                                      final repo = ctx.read<IWikiRepository>();
                                      return WikiStudyBloc(
                                        getWikiStudyCardUseCase: GetWikiStudyCardUseCase(repository: repo),
                                        generateWikiStudyUseCase: GenerateWikiStudyUseCase(repository: repo),
                                        finishWikiStudyUseCase: FinishWikiStudyUseCase(repository: repo),
                                        keepWikiCardStarUseCase: KeepWikiCardStarUseCase(repository: repo),
                                      );
                                    },
                                    child: WikiStudyScreen(cardId: item.cardId),
                                  ),
                                ),
                              );
                              if (result == true && context.mounted) {
                                context.read<WikiManagerBloc>().add(const WikiInventoryRefreshRequested());
                              }
                            },
                          ),
                        );
                      },
                      childCount: items.length,
                    ),
                  ),
                );
              }

              return const SliverToBoxAdapter(child: SizedBox.shrink());
            },
          ),
        ],
      ),
    );

    if (widget.showAppBar) {
      return Scaffold(
        backgroundColor: bgColor,
        appBar: AppBar(
          title: const Text('Quản lý Bài Học Wiki'),
          leading: IconButton(
            icon: const Icon(LucideIcons.arrowLeft),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: content,
      );
    }

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(child: content),
    );
  }

  Widget _buildFilterPill({
    required BuildContext context,
    required String label,
    required WikiFilter filter,
    required bool isSelected,
    required bool isDark,
  }) {
    return InkWell(
      onTap: () {
        context.read<WikiManagerBloc>().add(WikiFilterChanged(filter));
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark
                  ? const Color(0xFF1E3A8A).withValues(alpha: 0.4)
                  : const Color(0xFFDBEAFE))
              : (isDark ? const Color(0xFF1E293B) : Colors.white),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF3B82F6)
                : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected
                ? const Color(0xFF2563EB)
                : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
          ),
        ),
      ),
    );
  }

  Widget _buildRarityPill({
    required BuildContext context,
    required String label,
    required String? rarity,
    required bool isSelected,
    required bool isDark,
  }) {
    return InkWell(
      onTap: () {
        context.read<WikiManagerBloc>().add(WikiRarityFilterChanged(rarity));
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected
                ? (isDark ? Colors.white54 : Colors.black45)
                : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.bold,
            color: isSelected
                ? (isDark ? Colors.white : const Color(0xFF0F172A))
                : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
          ),
        ),
      ),
    );
  }

  Widget _buildSortPill({
    required BuildContext context,
    required String label,
    required WikiSort sort,
    required bool isSelected,
    required bool isDark,
  }) {
    return InkWell(
      onTap: () {
        context.read<WikiManagerBloc>().add(WikiSortChanged(sort));
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected
                ? (isDark ? Colors.white : const Color(0xFF0F172A))
                : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
          ),
        ),
      ),
    );
  }
}
