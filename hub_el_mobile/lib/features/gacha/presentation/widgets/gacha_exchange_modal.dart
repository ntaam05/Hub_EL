import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../domain/entities/gacha_exchange_entity.dart';
import '../bloc/gacha_bloc.dart';
import '../bloc/gacha_event.dart';
import '../bloc/gacha_state.dart';

class GachaExchangeModal extends StatefulWidget {
  const GachaExchangeModal({super.key});

  static void show(BuildContext context) {
    context.read<GachaBloc>().add(const GachaExchangeDataFetchRequested());
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BlocProvider.value(
        value: context.read<GachaBloc>(),
        child: const GachaExchangeModal(),
      ),
    );
  }

  @override
  State<GachaExchangeModal> createState() => _GachaExchangeModalState();
}

class _GachaExchangeModalState extends State<GachaExchangeModal> {
  static const rarityOrder = ['MR', 'LR', 'UR', 'SSR', 'SR', 'R', 'N'];

  static const rarityColors = {
    'MR': Color(0xFFEC4899),
    'LR': Color(0xFF2DD4BF),
    'UR': Color(0xFFEF4444),
    'SSR': Color(0xFFEAB308),
    'SR': Color(0xFFA855F7),
    'R': Color(0xFF3B82F6),
    'N': Color(0xFF94A3B8),
  };

  void _showConfirmDialog(BuildContext context, GachaExchangeItemEntity card, int currentStardust) {
    if (currentStardust < card.stardustCost) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bạn không đủ Bụi sao để đổi thẻ này!'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (dlgCtx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Colors.white12),
        ),
        title: const Row(
          children: [
            Icon(LucideIcons.repeat, color: Color(0xFF34D399), size: 22),
            SizedBox(width: 8),
            Text(
              'Xác nhận đổi thẻ',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Bạn có chắc chắn muốn dùng ${card.stardustCost} Bụi sao để đổi thẻ "${card.title}" (${card.rarity})?',
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text('Bụi sao hiện tại: ', style: TextStyle(color: Colors.white54, fontSize: 13)),
                Text(
                  '$currentStardust',
                  style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.bold),
                ),
                const Icon(LucideIcons.arrowRight, size: 14, color: Colors.white38),
                Text(
                  '${currentStardust - card.stardustCost}',
                  style: const TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dlgCtx).pop(),
            child: const Text('Hủy', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.of(dlgCtx).pop();
              context.read<GachaBloc>().add(GachaCardExchangeRequested(card.id));
            },
            child: const Text('Đổi ngay', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<GachaBloc, GachaState>(
      listener: (context, state) {
        if (state is GachaLoaded) {
          if (state.exchangeMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.exchangeMessage!),
                backgroundColor: const Color(0xFF10B981),
              ),
            );
          } else if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: const Color(0xFFEF4444),
              ),
            );
          }
        }
      },
      builder: (context, state) {
        final gachaLoaded = state is GachaLoaded ? state : null;
        final exchangeData = gachaLoaded?.exchangeData;
        final currentStardust = gachaLoaded?.status.stardust ?? 0;
        final isLoading = gachaLoaded?.isExchangeLoading ?? true;

        // Group cards by rarity
        final Map<String, List<GachaExchangeItemEntity>> grouped = {};
        if (exchangeData != null) {
          for (final c in exchangeData.cards) {
            final r = c.rarity.toUpperCase();
            grouped.putIfAbsent(r, () => []).add(c);
          }
        }

        return Container(
          height: MediaQuery.of(context).size.height * 0.90,
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
                        color: const Color(0xFF10B981).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(LucideIcons.repeat, color: Color(0xFF10B981), size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'TIỆM ĐỔI BỤI SAO',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    // Stardust badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFF34D399).withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.sparkles, color: Color(0xFF34D399), size: 14),
                          const SizedBox(width: 5),
                          Text(
                            '$currentStardust',
                            style: const TextStyle(
                              color: Color(0xFF6EE7B7),
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(LucideIcons.x, color: Colors.white70),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1, color: Colors.white12),

              // Body
              Expanded(
                child: isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: Color(0xFF34D399)),
                      )
                    : (exchangeData == null || exchangeData.cards.isEmpty)
                        ? const Center(
                            child: Text(
                              'Bạn đã sở hữu toàn bộ thẻ bài trong thư viện!',
                              style: TextStyle(color: Colors.white54, fontSize: 14),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: rarityOrder.length,
                            itemBuilder: (context, index) {
                              final rarity = rarityOrder[index];
                              final cardsInRarity = grouped[rarity] ?? [];
                              if (cardsInRarity.isEmpty) return const SizedBox.shrink();

                              final color = rarityColors[rarity] ?? Colors.white;

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                                    child: Row(
                                      children: [
                                        Text(
                                          rarity,
                                          style: TextStyle(
                                            color: color,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                            fontStyle: FontStyle.italic,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          '(${cardsInRarity.length} thẻ)',
                                          style: const TextStyle(
                                            color: Colors.white38,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  GridView.builder(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: 2,
                                      childAspectRatio: 0.72,
                                      crossAxisSpacing: 12,
                                      mainAxisSpacing: 12,
                                    ),
                                    itemCount: cardsInRarity.length,
                                    itemBuilder: (context, cIdx) {
                                      final card = cardsInRarity[cIdx];
                                      final canAfford = currentStardust >= card.stardustCost;

                                      return Container(
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF1E293B).withValues(alpha: 0.8),
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(
                                            color: canAfford
                                                ? color.withValues(alpha: 0.4)
                                                : Colors.white10,
                                          ),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          children: [
                                            // Image Artwork
                                            Expanded(
                                              child: ClipRRect(
                                                borderRadius: const BorderRadius.vertical(
                                                  top: Radius.circular(15),
                                                ),
                                                child: resolveCardImageUrl(card.imageUrl) != null &&
                                                        resolveCardImageUrl(card.imageUrl)!.isNotEmpty
                                                    ? Image.network(
                                                        resolveCardImageUrl(card.imageUrl)!,
                                                        fit: BoxFit.cover,
                                                        headers: kCardImageHeaders,
                                                        errorBuilder: (_, _, _) => Container(
                                                          color: color.withValues(alpha: 0.2),
                                                          child: Icon(LucideIcons.image,
                                                              color: color, size: 30),
                                                        ),
                                                      )
                                                    : Container(
                                                        color: color.withValues(alpha: 0.2),
                                                        child: Icon(LucideIcons.image,
                                                            color: color, size: 30),
                                                      ),
                                              ),
                                            ),

                                            Padding(
                                              padding: const EdgeInsets.all(10),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    card.title,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  ElevatedButton(
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: canAfford
                                                          ? const Color(0xFF10B981)
                                                          : const Color(0xFF334155),
                                                      foregroundColor: Colors.white,
                                                      padding: const EdgeInsets.symmetric(vertical: 6),
                                                      shape: RoundedRectangleBorder(
                                                        borderRadius: BorderRadius.circular(10),
                                                      ),
                                                      minimumSize: const Size.fromHeight(32),
                                                    ),
                                                    onPressed: canAfford
                                                        ? () => _showConfirmDialog(
                                                              context,
                                                              card,
                                                              currentStardust,
                                                            )
                                                        : null,
                                                    child: Row(
                                                      mainAxisAlignment: MainAxisAlignment.center,
                                                      children: [
                                                        const Icon(
                                                          LucideIcons.sparkles,
                                                          size: 13,
                                                          color: Colors.white,
                                                        ),
                                                        const SizedBox(width: 4),
                                                        Text(
                                                          '${card.stardustCost}',
                                                          style: const TextStyle(
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.w900,
                                                          ),
                                                        ),
                                                      ],
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
                                  const SizedBox(height: 16),
                                ],
                              );
                            },
                          ),
              ),
            ],
          ),
        );
      },
    );
  }
}
