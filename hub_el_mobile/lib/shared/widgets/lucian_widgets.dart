import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';

/// Widget rung nhẹ khi có lỗi validate / submit (#062 / #405)
class LucianShakeBox extends StatefulWidget {
  final Widget child;
  final int shakeTrigger;

  const LucianShakeBox({
    super.key,
    required this.child,
    required this.shakeTrigger,
  });

  @override
  State<LucianShakeBox> createState() => _LucianShakeBoxState();
}

class _LucianShakeBoxState extends State<LucianShakeBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 440),
    );
  }

  @override
  void didUpdateWidget(covariant LucianShakeBox oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.shakeTrigger != oldWidget.shakeTrigger &&
        widget.shakeTrigger > 0) {
      HapticFeedback.lightImpact();
      _controller.forward(from: 0);
    }
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
        final dx = math.sin(_controller.value * math.pi * 5) *
            (1 - _controller.value) *
            10;
        return Transform.translate(offset: Offset(dx, 0), child: child);
      },
      child: widget.child,
    );
  }
}

/// Trạng thái cho nút có hiệu ứng morphing (#062 / #009)
enum LucianButtonState { idle, busy, ok }

/// Nền gradient tinh tế + hiệu ứng sao băng nhẹ (đồng bộ với Lucian Dashboard & Profile trên web)
class LucianMeteorBackground extends StatefulWidget {
  final Widget child;
  final bool showMeteors;

  const LucianMeteorBackground({
    super.key,
    required this.child,
    this.showMeteors = true,
  });

  @override
  State<LucianMeteorBackground> createState() => _LucianMeteorBackgroundState();
}

class _LucianMeteorBackgroundState extends State<LucianMeteorBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 7),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final disableAnimations = MediaQuery.maybeOf(context)?.disableAnimations ?? false;

    return Stack(
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? const [
                        Color(0xFF07080D),
                        Color(0xFF0E101A),
                        Color(0xFF07080D),
                      ]
                    : const [
                        Color(0xFFF4F2EE),
                        Color(0xFFEDEAF6),
                        Color(0xFFF4F2EE),
                      ],
              ),
            ),
          ),
        ),
        if (widget.showMeteors && !disableAnimations)
          Positioned.fill(
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, _) {
                  return CustomPaint(
                    painter: _MeteorPainter(
                      progress: _controller.value,
                      isDark: isDark,
                    ),
                  );
                },
              ),
            ),
          ),
        widget.child,
      ],
    );
  }
}

class _MeteorPainter extends CustomPainter {
  final double progress;
  final bool isDark;

  _MeteorPainter({required this.progress, required this.isDark});

  static const _meteors = [
    (x: 0.22, y: 0.08, delay: 0.0, len: 110.0),
    (x: 0.72, y: 0.18, delay: 0.28, len: 130.0),
    (x: 0.45, y: 0.42, delay: 0.52, len: 95.0),
    (x: 0.82, y: 0.65, delay: 0.76, len: 120.0),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final baseColor = isDark ? AppColors.primaryLight : AppColors.primary;
    for (final m in _meteors) {
      final t = (progress - m.delay) % 1.0;
      if (t > 0.35) continue;
      final localT = t / 0.35;
      final opacity = math.sin(localT * math.pi) * (isDark ? 0.55 : 0.28);
      if (opacity <= 0.01) continue;

      final startX = size.width * m.x + localT * 120;
      final startY = size.height * m.y + localT * 120;
      final endX = startX - m.len * 0.707;
      final endY = startY - m.len * 0.707;

      final paint = Paint()
        ..strokeWidth = 1.6
        ..strokeCap = StrokeCap.round
        ..shader = LinearGradient(
          colors: [
            baseColor.withValues(alpha: opacity),
            baseColor.withValues(alpha: 0),
          ],
        ).createShader(Rect.fromPoints(Offset(startX, startY), Offset(endX, endY)));

      canvas.drawLine(Offset(endX, endY), Offset(startX, startY), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _MeteorPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.isDark != isDark;
}

/// Nút chính có hiệu ứng nhấn lò xo (#009) và morphing spinner -> checkmark (#062)
class LucianPrimaryButton extends StatefulWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final LucianButtonState state;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double height;
  final double borderRadius;

  const LucianPrimaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.state = LucianButtonState.idle,
    this.backgroundColor,
    this.foregroundColor,
    this.height = 52,
    this.borderRadius = 16,
  });

  @override
  State<LucianPrimaryButton> createState() => _LucianPrimaryButtonState();
}

class _LucianPrimaryButtonState extends State<LucianPrimaryButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isIdle = widget.state == LucianButtonState.idle;
    final isOk = widget.state == LucianButtonState.ok;
    final isBusy = widget.state == LucianButtonState.busy;

    final bg = isOk
        ? (isDark ? AppColors.mintDark : AppColors.mintLight)
        : (widget.backgroundColor ??
            (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary));
    final fg = isOk
        ? (isDark ? const Color(0xFF0B0C12) : Colors.white)
        : (widget.foregroundColor ??
            (isDark ? const Color(0xFF07080D) : Colors.white));

    return LayoutBuilder(
      builder: (context, constraints) {
        final fullWidth = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : 280.0;

        return Center(
          child: GestureDetector(
            onTapDown: isIdle && widget.onPressed != null
                ? (_) => setState(() => _pressed = true)
                : null,
            onTapUp: (_) => setState(() => _pressed = false),
            onTapCancel: () => setState(() => _pressed = false),
            onTap: isIdle ? widget.onPressed : null,
            child: AnimatedScale(
              scale: _pressed ? 0.96 : 1.0,
              duration: const Duration(milliseconds: 160),
              curve: Curves.easeOutBack,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 380),
                curve: Curves.easeOutBack,
                width: isIdle ? fullWidth : widget.height,
                height: widget.height,
                decoration: BoxDecoration(
                  color: widget.onPressed == null && isIdle
                      ? bg.withValues(alpha: 0.45)
                      : bg,
                  borderRadius: BorderRadius.circular(
                    isIdle ? widget.borderRadius : widget.height / 2,
                  ),
                ),
                alignment: Alignment.center,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: isBusy
                      ? SizedBox(
                          key: const ValueKey('busy'),
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(fg),
                          ),
                        )
                      : isOk
                          ? Icon(
                              Icons.check_rounded,
                              key: const ValueKey('ok'),
                              color: fg,
                              size: 26,
                            )
                          : Row(
                              key: const ValueKey('idle'),
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (widget.icon != null) ...[
                                  Icon(widget.icon, color: fg, size: 18),
                                  const SizedBox(width: 8),
                                ],
                                Text(
                                  widget.label,
                                  style: TextStyle(
                                    color: fg,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Nút nhấn giữ để xác nhận hành động quan trọng / nguy hiểm (#003)
class LucianHoldButton extends StatefulWidget {
  final String label;
  final String holdingLabel;
  final IconData? icon;
  final VoidCallback onConfirmed;
  final Duration holdDuration;
  final Color? color;

  const LucianHoldButton({
    super.key,
    required this.label,
    this.holdingLabel = 'Đang giữ để xác nhận...',
    this.icon,
    required this.onConfirmed,
    this.holdDuration = const Duration(milliseconds: 900),
    this.color,
  });

  @override
  State<LucianHoldButton> createState() => _LucianHoldButtonState();
}

class _LucianHoldButtonState extends State<LucianHoldButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  bool _confirmed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.holdDuration,
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed && !_confirmed) {
          _confirmed = true;
          HapticFeedback.mediumImpact();
          widget.onConfirmed();
        }
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _startHold() {
    _confirmed = false;
    HapticFeedback.selectionClick();
    _controller.forward(from: 0);
  }

  void _cancelHold() {
    if (!_confirmed && _controller.isAnimating) {
      _controller.reverse();
    } else if (!_confirmed) {
      _controller.reset();
    }
  }

  @override
  Widget build(BuildContext context) {
    final accent = widget.color ?? AppColors.error;

    return GestureDetector(
      onLongPressStart: (_) => _startHold(),
      onLongPressEnd: (_) => _cancelHold(),
      onTapDown: (_) => _startHold(),
      onTapUp: (_) => _cancelHold(),
      onTapCancel: _cancelHold,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final isHolding = _controller.value > 0.02;
          return ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: accent.withValues(alpha: isHolding ? 0.7 : 0.35),
                ),
              ),
              child: Stack(
                children: [
                  FractionallySizedBox(
                    widthFactor: _controller.value.clamp(0.0, 1.0),
                    heightFactor: 1.0,
                    child: Container(
                      color: accent.withValues(alpha: 0.88),
                    ),
                  ),
                  Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (widget.icon != null) ...[
                          Icon(
                            widget.icon,
                            size: 18,
                            color: _controller.value > 0.45
                                ? Colors.white
                                : accent,
                          ),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          isHolding ? widget.holdingLabel : widget.label,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: _controller.value > 0.45
                                ? Colors.white
                                : accent,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Dialog xác nhận nhấn giữ (#003) dùng cho Social (hủy kết bạn, chặn...) & Settings
class LucianConfirmHoldDialog extends StatelessWidget {
  final String title;
  final String description;
  final String holdLabel;
  final VoidCallback onConfirmed;

  const LucianConfirmHoldDialog({
    super.key,
    required this.title,
    required this.description,
    required this.holdLabel,
    required this.onConfirmed,
  });

  static Future<void> show(
    BuildContext context, {
    required String title,
    required String description,
    required String holdLabel,
    required VoidCallback onConfirmed,
  }) {
    return showDialog<void>(
      context: context,
      builder: (_) => LucianConfirmHoldDialog(
        title: title,
        description: description,
        holdLabel: holdLabel,
        onConfirmed: onConfirmed,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              color: Theme.of(context).textTheme.bodyMedium?.color?.withValues(alpha: 0.78),
            ),
          ),
          const SizedBox(height: 18),
          LucianHoldButton(
            label: holdLabel,
            onConfirmed: () {
              Navigator.of(context).pop();
              onConfirmed();
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
      ],
    );
  }
}

/// Công tắc gạt mượt kiểu Lucian (#013)
class LucianToggleSwitch extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;
  final Color? activeColor;

  const LucianToggleSwitch({
    super.key,
    required this.value,
    required this.onChanged,
    this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final active = activeColor ??
        (isDark ? AppColors.primaryLight : AppColors.primary);
    final inactiveTrack = isDark
        ? Colors.white.withValues(alpha: 0.14)
        : Colors.black.withValues(alpha: 0.12);

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onChanged(!value);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutBack,
        width: 50,
        height: 30,
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          color: value ? active : inactiveTrack,
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutBack,
          alignment: value ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isDark && value ? const Color(0xFF0B0C12) : Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: 4,
                  offset: const Offset(0, 1.5),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Nút Bookmark có hiệu ứng ruy băng nảy (#012) dùng cho trang Watch
class LucianBookmarkButton extends StatefulWidget {
  final bool isBookmarked;
  final VoidCallback onToggle;

  const LucianBookmarkButton({
    super.key,
    required this.isBookmarked,
    required this.onToggle,
  });

  @override
  State<LucianBookmarkButton> createState() => _LucianBookmarkButtonState();
}

class _LucianBookmarkButtonState extends State<LucianBookmarkButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 340),
    );
    _scale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.28), weight: 45),
      TweenSequenceItem(tween: Tween(begin: 1.28, end: 0.92), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 0.92, end: 1.0), weight: 25),
    ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
  }

  @override
  void didUpdateWidget(covariant LucianBookmarkButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isBookmarked != widget.isBookmarked) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeColor = isDark ? AppColors.primaryLight : AppColors.primary;

    return ScaleTransition(
      scale: _scale,
      child: IconButton(
        onPressed: () {
          HapticFeedback.lightImpact();
          widget.onToggle();
        },
        tooltip: widget.isBookmarked ? 'Bỏ lưu bài học' : 'Lưu bài học',
        icon: Icon(
          widget.isBookmarked
              ? Icons.bookmark_rounded
              : Icons.bookmark_border_rounded,
          color: widget.isBookmarked
              ? activeColor
              : Theme.of(context).iconTheme.color,
        ),
      ),
    );
  }
}

/// Ô nhập mã OTP 6 chữ số kiểu Lucian (#406): pop-in, rung lỗi + xóa, tick xanh khi đúng
class LucianOtpInput extends StatefulWidget {
  final Future<bool> Function(String code) onVerify;
  final bool disabled;

  const LucianOtpInput({
    super.key,
    required this.onVerify,
    this.disabled = false,
  });

  @override
  State<LucianOtpInput> createState() => _LucianOtpInputState();
}

class _LucianOtpInputState extends State<LucianOtpInput>
    with SingleTickerProviderStateMixin {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  late final AnimationController _shakeController;

  bool _busy = false;
  bool _ok = false;
  bool _err = false;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
    );
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    _shakeController.dispose();
    super.dispose();
  }

  String get _code => _controllers.map((c) => c.text).join();

  Future<void> _submit() async {
    final code = _code;
    if (code.length != 6 || _busy || _ok || widget.disabled) return;
    setState(() {
      _busy = true;
      _err = false;
    });

    final passed = await widget.onVerify(code);
    if (!mounted) return;

    if (passed) {
      setState(() {
        _busy = false;
        _ok = true;
      });
    } else {
      setState(() {
        _busy = false;
        _err = true;
      });
      _shakeController.forward(from: 0);
      await Future.delayed(const Duration(milliseconds: 480));
      if (!mounted) return;
      for (final c in _controllers) {
        c.clear();
      }
      setState(() => _err = false);
      _focusNodes[0].requestFocus();
    }
  }

  void _onChanged(int index, String value) {
    if (_busy || _ok || widget.disabled) return;
    final digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits.length > 1) {
      // Paste nhiều số
      for (int i = 0; i < 6; i++) {
        _controllers[i].text = i < digits.length ? digits[i] : '';
      }
      if (digits.length >= 6) {
        _focusNodes[5].requestFocus();
        _submit();
      } else {
        _focusNodes[digits.length].requestFocus();
      }
      setState(() => _err = false);
      return;
    }

    if (digits.isNotEmpty) {
      _controllers[index].text = digits;
      _controllers[index].selection = const TextSelection.collapsed(offset: 1);
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _submit();
      }
    } else if (index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    setState(() => _err = false);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _shakeController,
      builder: (context, child) {
        final dx = math.sin(_shakeController.value * math.pi * 5) *
            (1 - _shakeController.value) *
            10;
        return Transform.translate(offset: Offset(dx, 0), child: child);
      },
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 280),
        child: _ok
            ? Container(
                key: const ValueKey('otp-ok'),
                height: 54,
                width: 54,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.success,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: Colors.white,
                  size: 30,
                ),
              )
            : Row(
                key: const ValueKey('otp-boxes'),
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(6, (i) {
                  final hasVal = _controllers[i].text.isNotEmpty;
                  return Padding(
                    padding: EdgeInsets.only(right: i == 5 ? 0 : 8),
                    child: SizedBox(
                      width: 44,
                      height: 54,
                      child: AnimatedScale(
                        scale: hasVal ? 1.04 : 1.0,
                        duration: const Duration(milliseconds: 160),
                        curve: Curves.easeOutBack,
                        child: TextField(
                          controller: _controllers[i],
                          focusNode: _focusNodes[i],
                          enabled: !_busy && !widget.disabled,
                          textAlign: TextAlign.center,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                          decoration: InputDecoration(
                            counterText: '',
                            filled: true,
                            fillColor: const Color(0xFF0D1117),
                            contentPadding: EdgeInsets.zero,
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: _err
                                    ? AppColors.error
                                    : hasVal
                                        ? const Color(0xFF60A5FA)
                                        : const Color(0xFF334155),
                                width: _err || hasVal ? 1.5 : 1,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Color(0xFF60A5FA),
                                width: 1.8,
                              ),
                            ),
                          ),
                          onChanged: (val) => _onChanged(i, val),
                        ),
                      ),
                    ),
                  );
                }),
              ),
      ),
    );
  }
}
