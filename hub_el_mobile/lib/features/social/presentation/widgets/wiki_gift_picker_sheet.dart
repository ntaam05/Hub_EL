import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/entities/owned_wiki_card_entity.dart';

class WikiGiftPickerSheet extends StatelessWidget {
  final List<OwnedWikiCardEntity> cards;
  final bool isLoading;
  final ValueChanged<OwnedWikiCardEntity> onSelectCard;

  const WikiGiftPickerSheet({
    super.key,
    required this.cards,
    required this.isLoading,
    required this.onSelectCard,
  });

  Color _getRarityColor(String rarity) {
    switch (rarity.toUpperCase()) {
      case 'N':
        return Colors.blueGrey;
      case 'R':
        return const Color(0xFF3B82F6);
      case 'SR':
        return const Color(0xFFA855F7);
      case 'SSR':
        return const Color(0xFFF59E0B);
      case 'UR':
        return const Color(0xFFEF4444);
      case 'LR':
        return const Color(0xFF06B6D4);
      case 'MR':
        return const Color(0xFF10B981);
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.65,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF334155),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Row(
            children: [
              const Icon(LucideIcons.sparkles, color: Color(0xFFA855F7), size: 20),
              const SizedBox(width: 8),
              Text(
                'Tặng Thẻ Tri Thức Wiki',
                style: GoogleFonts.plusJakartaSans(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(LucideIcons.x, color: Color(0xFF94A3B8), size: 20),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          Text(
            'Chọn 1 thẻ từ kho đồ của bạn để làm quà tặng bạn bè:',
            style: GoogleFonts.plusJakartaSans(
              color: const Color(0xFF94A3B8),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 12),

          // Danh sách thẻ
          Expanded(
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFA855F7)),
                  )
                : cards.isEmpty
                    ? Center(
                        child: Text(
                          'Kho đồ của bạn đang trống.\nHãy học Wiki hoặc quay Gacha để nhận thẻ!',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.plusJakartaSans(
                            color: const Color(0xFF64748B),
                            fontSize: 13,
                          ),
                        ),
                      )
                    : GridView.builder(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          childAspectRatio: 0.72,
                        ),
                        itemCount: cards.length,
                        itemBuilder: (context, index) {
                          final card = cards[index];
                          final rarityColor = _getRarityColor(card.rarity);

                          return GestureDetector(
                            onTap: () {
                              if (Navigator.of(context).canPop()) {
                                Navigator.of(context).pop();
                              }
                              onSelectCard(card);
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: rarityColor.withValues(alpha: 0.6),
                                  width: 1.5,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Expanded(
                                    child: ClipRRect(
                                      borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(10),
                                      ),
                                      child: card.imageUrl != null && card.imageUrl!.isNotEmpty
                                          ? Image.network(
                                              card.imageUrl!,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, _, _) => Container(
                                                color: const Color(0xFF0F172A),
                                                child: const Icon(LucideIcons.image,
                                                    color: Colors.white24, size: 24),
                                              ),
                                            )
                                          : Container(
                                              color: const Color(0xFF0F172A),
                                              child: const Icon(LucideIcons.sparkles,
                                                  color: Colors.white24, size: 24),
                                            ),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(6),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 4, vertical: 1),
                                          decoration: BoxDecoration(
                                            color: rarityColor,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            card.rarity,
                                            style: GoogleFonts.plusJakartaSans(
                                              color: Colors.white,
                                              fontSize: 8,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          card.title,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.plusJakartaSans(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
