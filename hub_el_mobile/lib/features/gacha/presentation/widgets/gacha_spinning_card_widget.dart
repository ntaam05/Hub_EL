import 'dart:math' as math;
import 'package:flutter/material.dart';

class GachaSpinningCardWidget extends StatefulWidget {
  final double scale;

  const GachaSpinningCardWidget({super.key, this.scale = 1.0});

  @override
  State<GachaSpinningCardWidget> createState() => _GachaSpinningCardWidgetState();
}

class _GachaSpinningCardWidgetState extends State<GachaSpinningCardWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final width = 280.0 * widget.scale;
    final height = 420.0 * widget.scale;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final angle = _controller.value * 2 * math.pi;

        return Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.001) // perspective
            ..rotateY(angle),
          child: Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14 * widget.scale),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF38BDF8).withValues(alpha: 0.8),
                  blurRadius: 30 * widget.scale,
                  spreadRadius: 4 * widget.scale,
                ),
                BoxShadow(
                  color: Colors.white.withValues(alpha: 0.9),
                  blurRadius: 15 * widget.scale,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

