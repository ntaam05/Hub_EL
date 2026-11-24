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

  // Ánh sáng tỏa nút bấm Khóa học (Floating CTA Glow)
  static const List<BoxShadow> navCtaGlow = [
    BoxShadow(
      color: Color(0x663B82F6), // Blue 40%
      blurRadius: 16,
      offset: Offset(0, 6),
    ),
  ];

  // Ánh sáng tỏa huy hiệu PRO (Pro Glow)
  static const List<BoxShadow> proGlow = [
    BoxShadow(
      color: Color(0x59EAB308), // Yellow 35%
      blurRadius: 10,
      offset: Offset(0, 0),
    ),
  ];

  // Ánh sáng ngọn lửa Streak (Flame Glow)
  static const List<BoxShadow> streakGlow = [
    BoxShadow(
      color: Color(0x4DF97316), // Orange 30%
      blurRadius: 10,
      offset: Offset(0, 2),
    ),
  ];

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
