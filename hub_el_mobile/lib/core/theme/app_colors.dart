import 'package:flutter/material.dart';

/// Hệ thống màu sắc tập trung của Hub-EL, ánh xạ trực tiếp từ Tailwind CSS
/// và DESIGN_SYSTEM.md của website.
abstract class AppColors {
  // ==========================================
  // 1. BRAND COLORS (LUCIAN UX/UI TOKENS)
  // ==========================================
  static const Color primary = Color(0xFF6A57F2); // --ux-accent (light)
  static const Color primaryLight = Color(0xFFB7A4FF); // --ux-accent (dark)
  static const Color primaryDark = Color(0xFF5542E0);

  static const Color secondary = Color(0xFF2F8FE0); // --ux-accent-2 (light)
  static const Color secondaryLight = Color(0xFF7DB4FF); // --ux-accent-2 (dark)
  static const Color secondaryDark = Color(0xFF1D74C2);

  static const Color mintLight = Color(0xFF119C72); // --ux-mint (light)
  static const Color mintDark = Color(0xFF7EE8C0); // --ux-mint (dark)

  // Gradients thương hiệu
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF7B61FF), Color(0xFF3D8BFF), Color(0xFF1FB89A)],
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
  static const Color success = Color(0xFF119C72); // --ux-mint
  static const Color successLight = Color(0xFFECFDF5);
  static const Color successBorder = Color(0xFFA7F3D0);

  static const Color error = Color(0xFFD93A55); // --ux-danger
  static const Color errorLight = Color(0xFFFEF2F2);
  static const Color errorBorder = Color(0xFFFECACA);

  static const Color warning = Color(0xFFD6731E); // --ux-warn
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color warningBorder = Color(0xFFFDE68A);

  static const Color info = Color(0xFF2F8FE0); // --ux-accent-2
  static const Color infoLight = Color(0xFFEFF6FF);
  static const Color infoBorder = Color(0xFFBFDBFE);

  // ==========================================
  // 5. LIGHT THEME TOKENS (--ux-*)
  // ==========================================
  static const Color lightBackground = Color(0xFFF4F2EE); // --ux-page
  static const Color lightSurface = Color(0xFFFFFFFF); // --ux-surface
  static const Color lightCard = Color(0xFFFFFFFF); // --ux-surface
  static const Color lightBorder = Color(0x1716151B); // --ux-line (~9%)
  static const Color lightDivider = Color(0x1716151B);
  static const Color lightInputFill = Color(0xFFF5F3EF); // --ux-surface-2

  static const Color lightTextPrimary = Color(0xFF16151B); // --ux-ink
  static const Color lightTextSecondary = Color(0xFF57535F); // --ux-ink-2
  static const Color lightTextMuted = Color(0xFF8E8A97); // --ux-ink-3

  // ==========================================
  // 6. DARK THEME TOKENS (--ux-*)
  // ==========================================
  static const Color darkBackground = Color(0xFF07080D); // --ux-page
  static const Color darkSurface = Color(0xFF13141C); // --ux-surface
  static const Color darkCard = Color(0xFF13141C); // --ux-surface
  static const Color darkBorder = Color(0x14FFFFFF); // --ux-line (8%)
  static const Color darkDivider = Color(0x14FFFFFF);
  static const Color darkInputFill = Color(0xFF1A1B25); // --ux-surface-2

  static const Color spaceDarkBackground = Color(0xFF07080D);
  static const Color spaceSurface = Color(0xFF13141C);
  static const Color spaceCard = Color(0xFF1A1B25);
  static const Color spaceCardBorder = Color(0x14FFFFFF);

  static const Color darkTextPrimary = Color(0xFFF4F0E8); // --ux-ink
  static const Color darkTextSecondary = Color(0xADF4F0E8); // --ux-ink-2 (68%)
  static const Color darkTextMuted = Color(0x6BF4F0E8); // --ux-ink-3 (42%)
}

