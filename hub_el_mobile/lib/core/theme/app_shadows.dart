import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Hệ thống đổ bóng (BoxShadow) và hiệu ứng phát sáng (Glow Effects)
abstract class AppShadows {
  // Đổ bóng thẻ bài / card nhẹ
  static const List<BoxShadow> soft = [
    BoxShadow(
      color: Color(0x0A000000), // Black 4%
      blurRadius: 10,
      offset: Offset(0, 2),
    ),
  ];

  // Đổ bóng nổi bề mặt (Elevated Surface)
  static const List<BoxShadow> elevated = [
    BoxShadow(
      color: Color(0x12000000), // Black 7%
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  // Đổ bóng Dialog & Modal Bottom Sheet
  static const List<BoxShadow> dialog = [
    BoxShadow(
      color: Color(0x26000000), // Black 15%
      blurRadius: 24,
      offset: Offset(0, 10),
    ),
  ];

  // Đổ bóng trung tính nhẹ cho nút nổi
  static const List<BoxShadow> navCtaGlow = [
    BoxShadow(
      color: Color(0x1F000000),
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
  ];

  // Đổ bóng nhẹ cho huy hiệu PRO
  static const List<BoxShadow> proGlow = soft;

  // Đổ bóng nhẹ cho Streak
  static const List<BoxShadow> streakGlow = soft;

  // Ánh sáng thẻ Wiki theo màu độ hiếm
  static List<BoxShadow> rarityGlow(String rarity) {
    final color = AppColors.getRarityColor(rarity);
    return [
      BoxShadow(
        color: color.withValues(alpha: 0.35),
        blurRadius: 14,
        spreadRadius: 1,
        offset: const Offset(0, 2),
      ),
    ];
  }
}
