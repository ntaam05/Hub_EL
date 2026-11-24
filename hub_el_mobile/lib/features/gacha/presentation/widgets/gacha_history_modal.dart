import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../bloc/gacha_bloc.dart';
import '../bloc/gacha_event.dart';
import '../bloc/gacha_state.dart';

class GachaHistoryModal extends StatefulWidget {
  const GachaHistoryModal({super.key});

  static void show(BuildContext context) {
    context.read<GachaBloc>().add(const GachaHistoryFetchRequested(page: 1, limit: 10));
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BlocProvider.value(
        value: context.read<GachaBloc>(),
        child: const GachaHistoryModal(),
      ),
    );
  }

  @override
  State<GachaHistoryModal> createState() => _GachaHistoryModalState();
}

class _GachaHistoryModalState extends State<GachaHistoryModal> {
  int _currentPage = 1;

  static const rarityColors = {
    'MR': Color(0xFFEC4899),
    'LR': Color(0xFF2DD4BF),
    'UR': Color(0xFFEF4444),
    'SSR': Color(0xFFEAB308),
    'SR': Color(0xFFA855F7),
    'R': Color(0xFF3B82F6),
    'N': Color(0xFF94A3B8),
  };

  void _loadPage(int page) {
    setState(() {
      _currentPage = page;
    });
    context.read<GachaBloc>().add(GachaHistoryFetchRequested(page: page, limit: 10));
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<GachaBloc, GachaState>(
      builder: (context, state) {
        final gachaLoaded = state is GachaLoaded ? state : null;
        final history = gachaLoaded?.historyData;
        final isLoading = gachaLoaded?.isHistoryLoading ?? true;

        final cards = history?.cards ?? [];
        final totalPages = history?.totalPages ?? 1;

        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Color(0xFF0F172A),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(top: BorderSide(color: Colors.white24, width: 1.5)),
          ),
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(LucideIcons.history, color: Color(0xFF38BDF8), size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'LỊCH SỬ THẺ BÀI',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(LucideIcons.x, color: Colors.white70),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1, color: Colors.white12),

              // Content List
              Expanded(
                child: isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
                      )
                    : cards.isEmpty
                        ? const Center(
                            child: Text(
                              'Chưa có lịch sử nhận thẻ.',
                              style: TextStyle(color: Colors.white54, fontSize: 14),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: cards.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final card = cards[index];
                              final color = rarityColors[card.rarity] ?? Colors.white;

                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF1E293B).withValues(alpha: 0.8),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white10),
                                ),
                                child: Row(
                                  children: [
                                    // Card Thumbnail
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: SizedBox(
                                        width: 50,
                                        height: 70,
                                        child: resolveCardImageUrl(card.imageUrl) != null && resolveCardImageUrl(card.imageUrl)!.isNotEmpty
                                            ? Image.network(
                                                resolveCardImageUrl(card.imageUrl)!,
                                                fit: BoxFit.cover,
                                                headers: kCardImageHeaders,
                                                errorBuilder: (_, _, _) => Container(
                                                  color: color.withValues(alpha: 0.2),
                                                  child: Icon(LucideIcons.image,
                                                      color: color, size: 20),
                                                ),
                                              )
                                            : Container(
                                                color: color.withValues(alpha: 0.2),
                                                child: Icon(LucideIcons.image,
                                                    color: color, size: 20),
                                              ),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    // Info
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: color.withValues(alpha: 0.2),
                                                  borderRadius: BorderRadius.circular(6),
                                                  border: Border.all(color: color, width: 1),
                                                ),
                                                child: Text(
                                                  card.rarity,
                                                  style: TextStyle(
                                                    color: color,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w900,
                                                    fontStyle: FontStyle.italic,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  card.title,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            card.acquiredAt != null
                                                ? 'Nhận lúc: ${card.acquiredAt!.day.toString().padLeft(2, '0')}/${card.acquiredAt!.month.toString().padLeft(2, '0')}/${card.acquiredAt!.year} ${card.acquiredAt!.hour.toString().padLeft(2, '0')}:${card.acquiredAt!.minute.toString().padLeft(2, '0')}'
                                                : 'Mới nhận',
                                            style: const TextStyle(
                                              color: Colors.white54,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
              ),

              // Pagination Controls
              if (totalPages > 1)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E293B),
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: const Color(0xFF0F172A),
                        ),
                        onPressed: _currentPage > 1 && !isLoading
                            ? () => _loadPage(_currentPage - 1)
                            : null,
                        icon: const Icon(LucideIcons.chevronLeft, size: 16),
                        label: const Text('Trang trước'),
                      ),
                      Text(
                        'Trang $_currentPage / $totalPages',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E293B),
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: const Color(0xFF0F172A),
                        ),
                        onPressed: _currentPage < totalPages && !isLoading
                            ? () => _loadPage(_currentPage + 1)
                            : null,
                        icon: const Icon(LucideIcons.chevronRight, size: 16),
                        label: const Text('Trang sau'),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
