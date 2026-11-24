import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';

enum SocialProvider { google, github }

class SocialLoginButton extends StatelessWidget {
  final SocialProvider provider;
  final VoidCallback? onPressed;
  final bool isLoading;

  const SocialLoginButton({
    super.key,
    required this.provider,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return OutlinedButton(
      onPressed: isLoading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        side: BorderSide(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1.2,
        ),
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderLg,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (isLoading)
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else ...[
            _buildIcon(),
            AppSpacing.gapH8,
            Text(
              provider == SocialProvider.google ? 'Google' : 'GitHub',
              style: AppTextStyles.labelLarge.copyWith(
                color: isDark ? Colors.white : AppColors.lightTextPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildIcon() {
    if (provider == SocialProvider.google) {
      return SizedBox(
        width: 20,
        height: 20,
        child: CustomPaint(
          painter: _GoogleLogoPainter(),
        ),
      );
    }
    return const Icon(Icons.code, size: 20);
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;
    final double center = w / 2;

    // Google Blue
    final bluePaint = Paint()..color = const Color(0xFF4285F4);
    // Google Green
    final greenPaint = Paint()..color = const Color(0xFF34A853);
    // Google Yellow
    final yellowPaint = Paint()..color = const Color(0xFFFBBC05);
    // Google Red
    final redPaint = Paint()..color = const Color(0xFFEA4335);

    final rect = Rect.fromCircle(center: Offset(center, center), radius: center * 0.9);

    // Blue Bar
    canvas.drawRect(
      Rect.fromLTWH(center * 0.9, center - (h * 0.1), center * 0.95, h * 0.2),
      bluePaint,
    );

    // Arcs
    canvas.drawArc(rect, -0.7, 1.4, false, bluePaint..style = PaintingStyle.stroke..strokeWidth = 3.5);
    canvas.drawArc(rect, 0.7, 1.4, false, greenPaint..style = PaintingStyle.stroke..strokeWidth = 3.5);
    canvas.drawArc(rect, 2.1, 1.4, false, yellowPaint..style = PaintingStyle.stroke..strokeWidth = 3.5);
    canvas.drawArc(rect, 3.5, 1.4, false, redPaint..style = PaintingStyle.stroke..strokeWidth = 3.5);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

