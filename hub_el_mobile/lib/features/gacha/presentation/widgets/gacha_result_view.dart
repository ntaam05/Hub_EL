import 'package:flutter/material.dart';
import '../../domain/entities/gacha_card_entity.dart';
import '../../../wiki/domain/entities/wiki_card_entity.dart';
import '../../../wiki/presentation/widgets/wiki_card_widget.dart';

class GachaResultView extends StatelessWidget {
  final List<GachaCardEntity> cards;
  final String? bannerMessage;
  final VoidCallback onClose;

  const GachaResultView({
    super.key,
    required this.cards,
    this.bannerMessage,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final isMulti = cards.length > 1;

    return LayoutBuilder(
      builder: (context, constraints) {
        final availableHeight = constraints.maxHeight;
        final maxCardHeight = (availableHeight - 160).clamp(200.0, availableHeight);
        final maxScale = isMulti ? 0.70 : 1.05;
        final scale = (maxCardHeight / 420.0).clamp(0.40, maxScale);

        return GestureDetector(
          onTap: onClose,
          behavior: HitTestBehavior.opaque,
          child: Container(
            color: Colors.black.withValues(alpha: 0.75),
            width: double.infinity,
            height: double.infinity,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Banner thông báo phía trên
                if (bannerMessage != null && bannerMessage!.isNotEmpty)
                  Positioned(
                    top: 36,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      decoration: BoxDecoration(
                        color: bannerMessage!.contains('Trùng')
                            ? const Color(0xFF7C2D12).withValues(alpha: 0.95)
                            : const Color(0xFF14532D).withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(
                          color: bannerMessage!.contains('Trùng')
                              ? const Color(0xFFF97316)
                              : const Color(0xFF22C55E),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: bannerMessage!.contains('Trùng')
                                ? const Color(0xFFF97316).withValues(alpha: 0.4)
                                : const Color(0xFF22C55E).withValues(alpha: 0.4),
                            blurRadius: 16,
                          ),
                        ],
                      ),
                      child: Text(
                        bannerMessage!,
                        style: TextStyle(
                          color: bannerMessage!.contains('Trùng')
                              ? const Color(0xFFFDBA74)
                              : const Color(0xFF86EFAC),
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),

                // Danh sách các thẻ kết quả
                Center(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 70),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: cards.map((card) {
                        final wikiCard = WikiCardEntity(
                          id: card.id,
                          title: card.title,
                          rarity: card.rarity,
                          imageUrl: card.imageUrl,
                          wikiUrl: card.wikiUrl,
                          totalStars: card.totalStars,
                          awakenedStars: card.awakenedStars,
                        );

                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8.0),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              WikiCardWidget(
                                card: wikiCard,
                                awakenedStars: card.awakenedStars,
                                isOwned: true,
                                scale: scale,
                              ),

                              // Huy hiệu NEW!
                              if (card.isNew)
                                Positioned(
                                  top: -8 * scale,
                                  right: -8 * scale,
                                  child: Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 10 * scale,
                                      vertical: 4 * scale,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEF4444),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.white, width: 2),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFEF4444).withValues(alpha: 0.8),
                                          blurRadius: 10,
                                        ),
                                      ],
                                    ),
                                    child: Text(
                                      'NEW!',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: (12 * scale).clamp(9.0, 14.0),
                                        fontWeight: FontWeight.w900,
                                        fontStyle: FontStyle.italic,
                                      ),
                                    ),
                                  ),
                                ),

                              // Huy hiệu Thẻ trùng & Bụi sao
                              if (!card.isNew && card.stardustEarned > 0)
                                Positioned(
                                  bottom: 12 * scale,
                                  left: 10 * scale,
                                  right: 10 * scale,
                                  child: Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 8 * scale,
                                      vertical: 4 * scale,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0F172A).withValues(alpha: 0.9),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFF34D399),
                                        width: 1.2,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          Icons.auto_awesome,
                                          color: Color(0xFF34D399),
                                          size: 14,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '+${card.stardustEarned} Bụi sao',
                                          style: TextStyle(
                                            color: const Color(0xFF6EE7B7),
                                            fontSize: (11 * scale).clamp(8.0, 13.0),
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

                // Hướng dẫn chạm để đóng
                Positioned(
                  bottom: 24,
                  child: Text(
                    'CHẠM VÀO MÀN HÌNH ĐỂ TIẾP TỤC',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

