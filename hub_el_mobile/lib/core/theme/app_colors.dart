import 'package:flutter/material.dart';

/// Hệ thống màu sắc tập trung của Hub-EL, ánh xạ trực tiếp từ Tailwind CSS
/// và DESIGN_SYSTEM.md của website.
abstract class AppColors {
  // ==========================================
  // 1. BRAND COLORS (MÀU THƯƠNG HIỆU)
  // ==========================================
  static const Color primary = Color(0xFF2563EB); // Blue 600
  static const Color primaryLight = Color(0xFF3B82F6); // Blue 500
  static const Color primaryDark = Color(0xFF1D4ED8); // Blue 700

  static const Color secondary = Color(0xFF9333EA); // Purple 600
  static const Color secondaryLight = Color(0xFFA855F7); // Purple 500
  static const Color secondaryDark = Color(0xFF7E22CE); // Purple 700

  // Gradients thương hiệu đặc trưng của Hub-EL
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFF9333EA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient proGradient = LinearGradient(
    colors: [Color(0xFFFACC15), Color(0xFFEAB308)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient flameGradient = LinearGradient(
    colors: [Color(0xFFFB923C), Color(0xFFEA580C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ==========================================
  // 2. GAMIFICATION & CURRENCY COLORS
  // ==========================================
  // Streak - Ngọn lửa chuỗi ngày học
  static const Color streak = Color(0xFFF97316); // Orange 500
  static const Color streakLight = Color(0xFFFFF7ED); // Orange 50
  static const Color streakBorder = Color(0xFFFED7AA); // Orange 200

  // Energy / AI Tokens - Năng lượng tia sét
  static const Color energy = Color(0xFF0EA5E9); // Sky 500
  static const Color energyLight = Color(0xFFF0F9FF); // Sky 50
  static const Color energyBorder = Color(0xFFBAE6FD); // Sky 200

  // Coins - Xu Gacha cày cuốc
  static const Color coin = Color(0xFFEAB308); // Yellow 500
  static const Color coinLight = Color(0xFFFEFCE8); // Yellow 50
  static const Color coinBorder = Color(0xFFFEF08A); // Yellow 200

  // Gems - Ngọc nạp tiền qua MoMo
  static const Color gem = Color(0xFFA855F7); // Purple 500
  static const Color gemLight = Color(0xFFFAF5FF); // Purple 50
  static const Color gemBorder = Color(0xFFE9D5FF); // Purple 200

  // PRO / VIP Badge
  static const Color proBadge = Color(0xFFEAB308);
  static const Color proText = Color(0xFF713F12); // Yellow 900

  // Freeze Token - Bảo vệ chuỗi
  static const Color freeze = Color(0xFF38BDF8);

  // ==========================================
  // 3. WIKI CARD RARITY COLORS (ĐỘ HIẾM THẺ BÀI)
  // ==========================================
  static const Color rarityN = Color(0xFF94A3B8); // Normal - Xám bạc
  static const Color rarityR = Color(0xFF3B82F6); // Rare - Xanh dương
  static const Color raritySR = Color(0xFF8B5CF6); // Super Rare - Tím huyền thoại
  static const Color raritySSR = Color(0xFFF59E0B); // SSR - Vàng kim lộng lẫy
  static const Color rarityUR = Color(0xFFEC4899); // Ultra Rare - Hồng ngọc
  static const Color rarityLR = Color(0xFF06B6D4); // Legendary Rare - Xanh ngọc phát quang
  static const Color rarityMR = Color(0xFF6366F1); // Mythic Rare - Cầu vồng / Tím Indigo

  static Color getRarityColor(String rarity) {
    switch (rarity.toUpperCase()) {
      case 'MR':
        return rarityMR;
      case 'LR':
        return rarityLR;
      case 'UR':
        return rarityUR;
      case 'SSR':
        return raritySSR;
      case 'SR':
        return raritySR;
      case 'R':
        return rarityR;
      case 'N':
      default:
        return rarityN;
    }
  }

  // ==========================================
  // 4. FUNCTIONAL / FEEDBACK COLORS
  // ==========================================
  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color successLight = Color(0xFFECFDF5);
  static const Color successBorder = Color(0xFFA7F3D0);

  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color errorLight = Color(0xFFFEF2F2);
  static const Color errorBorder = Color(0xFFFECACA);

  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color warningBorder = Color(0xFFFDE68A);

  static const Color info = Color(0xFF3B82F6); // Blue 500
  static const Color infoLight = Color(0xFFEFF6FF);
  static const Color infoBorder = Color(0xFFBFDBFE);

  // ==========================================
  // 5. LIGHT THEME TOKENS
  // ==========================================
  static const Color lightBackground = Color(0xFFF8FAFC); // slate-50
  static const Color lightSurface = Color(0xFFFFFFFF); // white
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE2E8F0); // slate-200
  static const Color lightDivider = Color(0xFFE2E8F0);
  static const Color lightInputFill = Color(0xFFF1F5F9); // slate-100

  static const Color lightTextPrimary = Color(0xFF0F172A); // slate-900
  static const Color lightTextSecondary = Color(0xFF64748B); // slate-500
  static const Color lightTextMuted = Color(0xFF94A3B8); // slate-400

  // ==========================================
  // 6. DARK THEME TOKENS
  // ==========================================
  static const Color darkBackground = Color(0xFF020617); // Đổi thành màu vũ trụ sâu #020617 theo Mobile Web
  static const Color darkSurface = Color(0xFF0F172A); // Header, Bottom Nav #0F172A
  static const Color darkCard = Color(0xFF151821); // Card nền kính mờ #151821
  static const Color darkBorder = Color(0x80334155); // Viền slate-700/50
  static const Color darkDivider = Color(0x1FFFFFFF); // White 12%
  static const Color darkInputFill = Color(0xFF1E293B);

  // Không gian vũ trụ chuyên biệt cho Hub-EL Mobile Web
  static const Color spaceDarkBackground = Color(0xFF020617);
  static const Color spaceSurface = Color(0xFF0F172A);
  static const Color spaceCard = Color(0xFF151821);
  static const Color spaceCardBorder = Color(0x80334155);

  static const Color darkTextPrimary = Color(0xFFF8FAFC); // slate-50
  static const Color darkTextSecondary = Color(0xFF94A3B8); // slate-400
  static const Color darkTextMuted = Color(0xFF64748B); // slate-500
}

