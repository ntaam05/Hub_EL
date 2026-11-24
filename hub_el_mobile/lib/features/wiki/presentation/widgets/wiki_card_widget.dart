import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../domain/entities/wiki_card_entity.dart';

class RarityVisualConfig {
  final Color hexColor;
  final Color borderColor;
  final LinearGradient gradient;

  const RarityVisualConfig({
    required this.hexColor,
    required this.borderColor,
    required this.gradient,
  });
}

class WikiCardWidget extends StatelessWidget {
  final WikiCardEntity card;
  final int awakenedStars;
  final bool isOwned;
  final double scale;
  final VoidCallback? onTap;

  const WikiCardWidget({
    super.key,
    required this.card,
    this.awakenedStars = 0,
    this.isOwned = true,
    this.scale = 0.5,
    this.onTap,
  });

  static const Map<String, RarityVisualConfig> rarityConfigs = {
    'N': RarityVisualConfig(
      hexColor: Color(0xFF94A3B8),
      borderColor: Color(0xFF94A3B8),
      gradient: LinearGradient(
        colors: [Color(0xFFCBD5E1), Color(0xFF94A3B8)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    'R': RarityVisualConfig(
      hexColor: Color(0xFF3B82F6),
      borderColor: Color(0xFF3B82F6),
      gradient: LinearGradient(
        colors: [Color(0xFF67E8F9), Color(0xFF3B82F6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    'SR': RarityVisualConfig(
      hexColor: Color(0xFFA855F7),
      borderColor: Color(0xFFA855F7),
      gradient: LinearGradient(
        colors: [Color(0xFFF0ABFC), Color(0xFFA855F7)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    'SSR': RarityVisualConfig(
      hexColor: Color(0xFFEAB308),
      borderColor: Color(0xFFEAB308),
      gradient: LinearGradient(
        colors: [Color(0xFFFCD34D), Color(0xFFEAB308)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    'UR': RarityVisualConfig(
      hexColor: Color(0xFFEF4444),
      borderColor: Color(0xFFEF4444),
      gradient: LinearGradient(
        colors: [Color(0xFFFDA4AF), Color(0xFFEF4444)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    'LR': RarityVisualConfig(
      hexColor: Color(0xFF2DD4BF),
      borderColor: Color(0xFF2DD4BF),
      gradient: LinearGradient(
        colors: [Color(0xFF6EE7B7), Color(0xFF2DD4BF)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    'MR': RarityVisualConfig(
      hexColor: Color(0xFFEC4899),
      borderColor: Color(0xFFEC4899),
      gradient: LinearGradient(
        colors: [Color(0xFFEF4444), Color(0xFFEAB308), Color(0xFFA855F7)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
  };

  @override
  Widget build(BuildContext context) {
    final config = rarityConfigs[card.rarity.toUpperCase()] ?? rarityConfigs['N']!;
    final baseWidth = 280.0 * scale;
    final baseHeight = 420.0 * scale;
    final totalStars = card.totalStars > 0 ? card.totalStars : 1;
    final effectiveStars = isOwned
        ? (awakenedStars > 0 ? awakenedStars : card.awakenedStars)
        : 0;

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: baseWidth,
        height: baseHeight,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Thẻ Card Container chính
            Opacity(
              opacity: isOwned ? 1.0 : 0.75,
              child: Container(
                width: baseWidth,
                height: baseHeight,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14 * scale),
                  border: Border.all(
                    color: isOwned ? config.borderColor : Colors.grey.shade600,
                    width: (4 * scale).clamp(2.0, 4.0),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: isOwned
                          ? config.hexColor.withValues(alpha: 0.35)
                          : Colors.black26,
                      blurRadius: 12 * scale,
                      offset: Offset(0, 4 * scale),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular((14 * scale) - 2),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Hình nền artwork / gradient fallback
                      Builder(builder: (context) {
                        final resolvedUrl = resolveCardImageUrl(card.imageUrl);
                        if (resolvedUrl != null && resolvedUrl.isNotEmpty) {
                          return Image.network(
                            resolvedUrl,
                            fit: BoxFit.cover,
                            headers: kCardImageHeaders,
                            errorBuilder: (context, error, stackTrace) =>
                                _buildFallbackGradient(config),
                          );
                        }
                        return _buildFallbackGradient(config);
                      }),

                      // Lớp gradient đen che phủ trên và dưới để làm nổi text
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black87,
                              Colors.transparent,
                              Colors.transparent,
                              isOwned ? Colors.black87 : Colors.black.withValues(alpha: 0.9),
                            ],
                            stops: const [0.0, 0.25, 0.65, 1.0],
                          ),
                        ),
                      ),

                      // Header: Rarity & Title
                      Positioned(
                        top: 6 * scale,
                        left: 6 * scale,
                        right: 6 * scale,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              card.rarity,
                              style: TextStyle(
                                fontFamily: 'serif',
                                fontSize: 24 * scale,
                                fontWeight: FontWeight.w900,
                                fontStyle: FontStyle.italic,
                                color: isOwned ? config.hexColor : Colors.grey.shade400,
                                shadows: const [
                                  Shadow(color: Colors.black, blurRadius: 4, offset: Offset(0, 1)),
                                ],
                              ),
                            ),
                            SizedBox(width: 4 * scale),
                            Expanded(
                              child: Text(
                                card.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: (13 * scale).clamp(9.0, 14.0),
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  letterSpacing: 0.3,
                                  shadows: const [
                                    Shadow(color: Colors.black, blurRadius: 3, offset: Offset(0, 1)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Biểu tượng Khóa nếu chưa sở hữu
                      if (!isOwned)
                        Center(
                          child: Container(
                            padding: EdgeInsets.all(8 * scale),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.black.withValues(alpha: 0.65),
                              border: Border.all(color: Colors.white30, width: 1.5),
                            ),
                            child: Icon(
                              LucideIcons.lock,
                              color: Colors.white70,
                              size: 28 * scale,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),

            // Dàn Sao Thức Tỉnh ở chân thẻ
            Positioned(
              bottom: -(8 * scale),
              left: 0,
              right: 0,
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(totalStars, (i) {
                    final isAwakened = i < effectiveStars;
                    return Padding(
                      padding: EdgeInsets.symmetric(horizontal: 1 * scale),
                      child: Icon(
                        LucideIcons.star,
                        size: (16 * scale).clamp(10.0, 18.0),
                        color: isAwakened ? config.hexColor : Colors.white24,
                      ),
                    );
                  }),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackGradient(RarityVisualConfig config) {
    return Container(
      decoration: BoxDecoration(gradient: config.gradient),
      child: Center(
        child: Icon(
          LucideIcons.sparkles,
          size: 40 * scale,
          color: Colors.white.withValues(alpha: 0.4),
        ),
      ),
    );
  }
}
