import 'package:flutter/material.dart';

/// Hằng số khoảng cách (Spacing) và kích thước bo góc (Radius)
/// Được trích xuất theo đúng tỷ lệ của website trong globals.css.
abstract class AppSpacing {
  // Khoảng cách cơ bản (Padding & Margin)
  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;

  // EdgeInsets Tiện Ích
  static const EdgeInsets paddingZero = EdgeInsets.zero;
  static const EdgeInsets paddingXs = EdgeInsets.all(xs);
  static const EdgeInsets paddingSm = EdgeInsets.all(sm);
  static const EdgeInsets paddingMd = EdgeInsets.all(md);
  static const EdgeInsets paddingLg = EdgeInsets.all(lg);
  static const EdgeInsets paddingXl = EdgeInsets.all(xl);

  static const EdgeInsets paddingHSm = EdgeInsets.symmetric(horizontal: sm);
  static const EdgeInsets paddingHMd = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets paddingHLg = EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets paddingHXl = EdgeInsets.symmetric(horizontal: xl);

  static const EdgeInsets paddingVSm = EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets paddingVMd = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets paddingVLg = EdgeInsets.symmetric(vertical: lg);

  // Khoảng cách giữa các ô nhập liệu / phần tử
  static const SizedBox gapH2 = SizedBox(width: xxs);
  static const SizedBox gapH4 = SizedBox(width: xs);
  static const SizedBox gapH6 = SizedBox(width: 6.0);
  static const SizedBox gapH8 = SizedBox(width: sm);
  static const SizedBox gapH12 = SizedBox(width: md);
  static const SizedBox gapH16 = SizedBox(width: lg);
  static const SizedBox gapH24 = SizedBox(width: xxl);

  static const SizedBox gapV2 = SizedBox(height: xxs);
  static const SizedBox gapV4 = SizedBox(height: xs);
  static const SizedBox gapV6 = SizedBox(height: 6.0);
  static const SizedBox gapV8 = SizedBox(height: sm);
  static const SizedBox gapV12 = SizedBox(height: md);
  static const SizedBox gapV16 = SizedBox(height: lg);
  static const SizedBox gapV20 = SizedBox(height: xl);
  static const SizedBox gapV24 = SizedBox(height: xxl);
  static const SizedBox gapV32 = SizedBox(height: xxxl);
}

/// Hệ thống bo tròn góc (Border Radius) đồng nhất với Tailwind Radius
abstract class AppRadius {
  static const double sm = 6.0;
  static const double md = 8.0;
  static const double lg = 10.0;
  static const double xl = 14.0;
  static const double xxl = 18.0;
  static const double xxxl = 22.0;
  static const double full = 999.0;

  static const BorderRadius borderSm = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius borderMd = BorderRadius.all(Radius.circular(md));
  static const BorderRadius borderLg = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius borderXl = BorderRadius.all(Radius.circular(xl));
  static const BorderRadius border2Xl = BorderRadius.all(Radius.circular(xxl));
  static const BorderRadius border3Xl = BorderRadius.all(Radius.circular(xxxl));
  static const BorderRadius borderPill = BorderRadius.all(Radius.circular(full));
}

