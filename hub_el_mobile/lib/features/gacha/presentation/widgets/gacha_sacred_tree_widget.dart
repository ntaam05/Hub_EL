import 'dart:math' as math;
import 'package:flutter/material.dart';

class GachaSacredTreeWidget extends StatefulWidget {
  final bool isRolling;

  const GachaSacredTreeWidget({super.key, this.isRolling = false});

  @override
  State<GachaSacredTreeWidget> createState() => _GachaSacredTreeWidgetState();
}

class _GachaSacredTreeWidgetState extends State<GachaSacredTreeWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size.infinite,
          painter: _SacredTreePainter(
            progress: _controller.value,
            isRolling: widget.isRolling,
          ),
        );
      },
    );
  }
}

class _SacredTreePainter extends CustomPainter {
  final double progress;
  final bool isRolling;

  _SacredTreePainter({required this.progress, required this.isRolling});

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final topY = 20.0;

    // 1. Vẽ các ngôi sao lấp lánh trên nền trời
    final random = math.Random(42); // Seed cố định để sao đứng yên vị trí
    final starPaint = Paint()..color = Colors.white;

    for (int i = 0; i < 60; i++) {
      final sx = random.nextDouble() * size.width;
      final sy = random.nextDouble() * size.height * 0.45;
      final sSize = random.nextDouble() * 1.8 + 0.6;
      final phase = (progress * 4 + random.nextDouble() * math.pi * 2) % (math.pi * 2);
      final alpha = (0.2 + 0.8 * (0.5 + 0.5 * math.sin(phase))).clamp(0.1, 1.0);

      starPaint.color = Colors.white.withValues(alpha: alpha);
      canvas.drawCircle(Offset(sx, sy), sSize, starPaint);
    }

    // 2. Vẽ đám mây thần thoại chuyển động nhẹ
    final cloudOffset = progress * size.width * 0.4;
    final cloudPaint = Paint()
      ..color = const Color(0xFF38BDF8).withValues(alpha: 0.04)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20);

    canvas.drawOval(
      Rect.fromCenter(
        center: Offset((cloudOffset) % (size.width + 200) - 100, 80),
        width: 240,
        height: 60,
      ),
      cloudPaint,
    );

    // 3. Vẽ nhánh cây phát sáng dạng Fractal (Cây tri thức)
    final branchPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF2DD4BF), Color(0xFF3B82F6)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height * 0.6));

    final glowPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round
      ..color = const Color(0xFF67E8F9).withValues(alpha: isRolling ? 0.35 : 0.15)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);

    _drawFractalBranch(
      canvas,
      centerX,
      topY,
      85.0,
      math.pi / 2,
      7,
      branchPaint,
      glowPaint,
    );

    // 4. Vẽ các hạt năng lượng / bụi sao rơi từ cây thần
    final particlePaint = Paint()..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2);
    for (int i = 0; i < 35; i++) {
      final pRandom = math.Random(100 + i);
      final px = centerX + (pRandom.nextDouble() - 0.5) * 320;
      final speed = 0.5 + pRandom.nextDouble() * 1.5;
      final py = (progress * size.height * 0.6 * speed + pRandom.nextDouble() * size.height * 0.5) %
          (size.height * 0.6);
      final pr = 1.0 + pRandom.nextDouble() * 2.0;

      final pAlpha = math.sin((py / (size.height * 0.6)) * math.pi).clamp(0.0, 0.8);
      particlePaint.color = const Color(0xFF67E8F9).withValues(alpha: pAlpha);
      canvas.drawCircle(Offset(px, py + 20), pr, particlePaint);
    }
  }

  void _drawFractalBranch(
    Canvas canvas,
    double x,
    double y,
    double length,
    double angle,
    int depth,
    Paint paint,
    Paint glow,
  ) {
    if (depth <= 0) return;

    final endX = x + length * math.cos(angle);
    final endY = y + length * math.sin(angle);

    canvas.drawLine(Offset(x, y), Offset(endX, endY), glow);
    canvas.drawLine(Offset(x, y), Offset(endX, endY), paint);

    final scale = 0.72;
    final spread = 0.42;

    _drawFractalBranch(
      canvas,
      endX,
      endY,
      length * scale,
      angle - spread,
      depth - 1,
      paint,
      glow,
    );
    _drawFractalBranch(
      canvas,
      endX,
      endY,
      length * scale,
      angle + spread,
      depth - 1,
      paint,
      glow,
    );
  }

  @override
  bool shouldRepaint(covariant _SacredTreePainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.isRolling != isRolling;
  }
}

