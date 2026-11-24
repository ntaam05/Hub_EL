import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class GachaRollButton extends StatefulWidget {
  final bool isRolling;
  final bool isFreePullAvailable;
  final int userCoins;
  final int costPerRoll;
  final Function(int count) onRoll;

  const GachaRollButton({
    super.key,
    required this.isRolling,
    required this.isFreePullAvailable,
    required this.userCoins,
    this.costPerRoll = 100,
    required this.onRoll,
  });

  @override
  State<GachaRollButton> createState() => _GachaRollButtonState();
}

class _GachaRollButtonState extends State<GachaRollButton> {
  int _rollCount = 1;
  Timer? _pressTimer;
  bool _isPressed = false;

  @override
  void dispose() {
    _pressTimer?.cancel();
    super.dispose();
  }

  void _handlePointerDown(PointerDownEvent event) {
    if (widget.isRolling) return;

    setState(() {
      _isPressed = true;
      _rollCount = 1;
    });

    _pressTimer?.cancel();
    _pressTimer = Timer.periodic(const Duration(milliseconds: 250), (timer) {
      if (_rollCount < 5) {
        HapticFeedback.lightImpact();
        setState(() {
          _rollCount++;
        });
      }
    });
  }

  void _handlePointerUp(PointerUpEvent event) {
    if (!_isPressed) return;
    _pressTimer?.cancel();
    _pressTimer = null;

    final selectedCount = _rollCount;
    setState(() {
      _isPressed = false;
      _rollCount = 1;
    });

    if (!widget.isRolling) {
      widget.onRoll(selectedCount);
    }
  }

  void _handlePointerCancel(PointerCancelEvent event) {
    _pressTimer?.cancel();
    _pressTimer = null;
    setState(() {
      _isPressed = false;
      _rollCount = 1;
    });
  }

  int _calculateCost(int count) {
    if (widget.isFreePullAvailable) {
      return (count - 1).clamp(0, 5) * widget.costPerRoll;
    }
    return count * widget.costPerRoll;
  }

  @override
  Widget build(BuildContext context) {
    final cost = _calculateCost(_rollCount);
    final hasEnoughCoins = widget.userCoins >= cost || (widget.isFreePullAvailable && _rollCount == 1);

    return Listener(
      onPointerDown: _handlePointerDown,
      onPointerUp: _handlePointerUp,
      onPointerCancel: _handlePointerCancel,
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            gradient: widget.isRolling || !hasEnoughCoins
                ? const LinearGradient(colors: [Color(0xFF475569), Color(0xFF334155)])
                : const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: widget.isRolling || !hasEnoughCoins
                ? []
                : [
                    BoxShadow(
                      color: const Color(0xFF3B82F6).withValues(alpha: 0.45),
                      blurRadius: 18,
                      offset: const Offset(0, 4),
                    ),
                  ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              widget.isRolling
                  ? const SizedBox(
                      width: 26,
                      height: 26,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white70),
                      ),
                    )
                  : const Icon(LucideIcons.gift, color: Colors.white, size: 24),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.isRolling
                        ? 'Đang tìm...'
                        : 'Tìm Tri Thức x$_rollCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Text(
                        'Tiêu hao: ',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        cost == 0 && widget.isFreePullAvailable
                            ? 'Miễn phí hôm nay'
                            : '$cost Xu',
                        style: TextStyle(
                          color: cost == 0 ? const Color(0xFF86EFAC) : const Color(0xFFFDE047),
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

