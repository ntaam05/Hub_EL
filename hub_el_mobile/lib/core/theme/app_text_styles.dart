import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Hệ thống Typography Hub-EL đồng bộ font Inter và thang đo tỉ lệ chuẩn.
abstract class AppTextStyles {
  // Font gia đình chính
  static TextStyle get _baseInter => GoogleFonts.inter();

  // ==========================================
  // DISPLAY & HEADINGS
  // ==========================================
  static TextStyle get display => _baseInter.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.w900,
        height: 1.2,
        letterSpacing: -0.5,
        color: AppColors.lightTextPrimary,
      );

  static TextStyle get h1 => _baseInter.copyWith(
        fontSize: 22,
        fontWeight: FontWeight.w800,
        height: 1.3,
        letterSpacing: -0.4,
        color: AppColors.lightTextPrimary,
      );

  static TextStyle get h2 => _baseInter.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        height: 1.35,
        letterSpacing: -0.3,
        color: AppColors.lightTextPrimary,
      );

  static TextStyle get h3 => _baseInter.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.4,
        letterSpacing: -0.2,
        color: AppColors.lightTextPrimary,
      );

  // ==========================================
  // BODY TEXT
  // ==========================================
  static TextStyle get bodyLarge => _baseInter.copyWith(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        height: 1.5,
        color: AppColors.lightTextPrimary,
      );

  static TextStyle get bodyMedium => _baseInter.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: AppColors.lightTextPrimary,
      );

  static TextStyle get bodySmall => _baseInter.copyWith(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        height: 1.45,
        color: AppColors.lightTextSecondary,
      );

  // ==========================================
  // LABELS & BUTTONS
  // ==========================================
  static TextStyle get labelLarge => _baseInter.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        height: 1.2,
        letterSpacing: 0.1,
      );

  static TextStyle get labelMedium => _baseInter.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        height: 1.2,
      );

  static TextStyle get labelSmall => _baseInter.copyWith(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        height: 1.2,
      );

  // ==========================================
  // CAPTION & BADGES
  // ==========================================
  static TextStyle get caption => _baseInter.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        height: 1.3,
        color: AppColors.lightTextMuted,
      );

  static TextStyle get microBadge => _baseInter.copyWith(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        height: 1.1,
        letterSpacing: 0.2,
      );

  // ==========================================
  // MONOSPACE (SỐ LIỆU / MÃ CODE)
  // ==========================================
  static TextStyle get statNumber => GoogleFonts.robotoMono(
        fontSize: 13,
        fontWeight: FontWeight.w800,
        height: 1.2,
      );
}

