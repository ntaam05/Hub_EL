import 'package:flutter/material.dart';

class GachaCardFrameWidget extends StatefulWidget {
  final double scale;
  final Color themeColor;

  const GachaCardFrameWidget({
    super.key,
    this.scale = 1.0,
    this.themeColor = const Color(0xFF38BDF8),
  });

  @override
  State<GachaCardFrameWidget> createState() => _GachaCardFrameWidgetState();
}

class _GachaCardFrameWidgetState extends State<GachaCardFrameWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return CustomPaint(
          size: Size(280 * widget.scale, 420 * widget.scale),
          painter: _CardFramePainter(
            progress: _animation.value,
            color: widget.themeColor,
          ),
        );
      },
    );
  }
}

class _CardFramePainter extends CustomPainter {
  final double progress;
  final Color color;

  _CardFramePainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final r = 16.0 * (size.width / 280.0);

    final glowPaint = Paint()
      ..color = color.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0 * (size.width / 280.0)
      ..strokeCap = StrokeCap.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);

    final outerPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0 * (size.width / 280.0)
      ..strokeCap = StrokeCap.round;

    final innerPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8 * (size.width / 280.0)
      ..strokeCap = StrokeCap.round;

    void drawCornerLines(Paint p) {
      final horizLen = (w / 2 - r) * progress;
      final vertLen = (h / 2 - r) * progress;

      // Top-Left corner
      canvas.drawLine(Offset(r, 0), Offset(r + horizLen, 0), p);
      canvas.drawLine(Offset(0, r), Offset(0, r + vertLen), p);
      canvas.drawArc(Rect.fromLTWH(0, 0, r * 2, r * 2), 3.14159, 1.57079, false, p);

      // Top-Right corner
      canvas.drawLine(Offset(w - r, 0), Offset(w - r - horizLen, 0), p);
      canvas.drawLine(Offset(w, r), Offset(w, r + vertLen), p);
      canvas.drawArc(Rect.fromLTWH(w - r * 2, 0, r * 2, r * 2), -1.57079, 1.57079, false, p);

      // Bottom-Left corner
      canvas.drawLine(Offset(r, h), Offset(r + horizLen, h), p);
      canvas.drawLine(Offset(0, h - r), Offset(0, h - r - vertLen), p);
      canvas.drawArc(Rect.fromLTWH(0, h - r * 2, r * 2, r * 2), 1.57079, 1.57079, false, p);

      // Bottom-Right corner
      canvas.drawLine(Offset(w - r, h), Offset(w - r - horizLen, h), p);
      canvas.drawLine(Offset(w, h - r), Offset(w, h - r - vertLen), p);
      canvas.drawArc(Rect.fromLTWH(w - r * 2, h - r * 2, r * 2, r * 2), 0, 1.57079, false, p);
    }

    drawCornerLines(glowPaint);
    drawCornerLines(outerPaint);
    drawCornerLines(innerPaint);
  }

  @override
  bool shouldRepaint(covariant _CardFramePainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}

