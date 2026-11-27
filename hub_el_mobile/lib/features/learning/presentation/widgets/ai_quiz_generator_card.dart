import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../authentication/presentation/bloc/auth_bloc.dart';
import '../../../authentication/presentation/bloc/auth_state.dart';
import '../../../store/presentation/cubit/store_cubit.dart';
import '../bloc/quiz/quiz_bloc.dart';
import '../bloc/quiz/quiz_event.dart';
import '../bloc/quiz/quiz_state.dart';

class AiQuizGeneratorCard extends StatefulWidget {
  final String videoId;
  final bool? isPro;
  final int userEnergy;

  const AiQuizGeneratorCard({
    super.key,
    required this.videoId,
    this.isPro,
    this.userEnergy = 20,
  });

  @override
  State<AiQuizGeneratorCard> createState() => _AiQuizGeneratorCardState();
}

class _AiQuizGeneratorCardState extends State<AiQuizGeneratorCard> {
  final TextEditingController _countController = TextEditingController(text: '5');
  int _questionCount = 5;

  @override
  void dispose() {
    _countController.dispose();
    super.dispose();
  }

  bool _resolveIsPro(BuildContext context) {
    if (widget.isPro != null) return widget.isPro!;
    try {
      final storePro = context.watch<StoreCubit>().state.catalog?.balance.isPro;
      if (storePro == true) return true;
    } catch (_) {}
    try {
      final authState = context.watch<AuthBloc>().state;
      if (authState is Authenticated) return authState.user.isPro;
    } catch (_) {}
    return false;
  }

  int _calculateEnergyCost(int count, bool isPro) {
    if (isPro) {
      final discounted = (count * 0.7).ceil();
      return discounted < 1 ? 1 : discounted;
    }
    return count;
  }

  void _updateQuestionCount(int newCount) {
    final clamped = newCount.clamp(1, 20);
    setState(() {
      _questionCount = clamped;
      if (_countController.text != '$clamped') {
        _countController.text = '$clamped';
        _countController.selection = TextSelection.fromPosition(
          TextPosition(offset: _countController.text.length),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isProUser = _resolveIsPro(context);
    final energyCost = _calculateEnergyCost(_questionCount, isProUser);

    return BlocBuilder<QuizBloc, QuizState>(
      builder: (context, state) {
        final isGenerating = state is QuizGenerating;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.spaceCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? AppColors.spaceCardBorder : Colors.grey.shade200,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Tiêu đề
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF3B82F6)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 20),
                      ),
                      AppSpacing.gapH12,
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Tạo bài tập AI',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'Trắc nghiệm thông minh từ video',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  if (isProUser)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.proBadge,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'PRO -30% ⚡',
                        style: AppTextStyles.microBadge.copyWith(color: AppColors.proText),
                      ),
                    ),
                ],
              ),
              AppSpacing.gapV16,

              // Nhập số lượng câu hỏi (1-20) & Nút Tạo bài tập
              Row(
                children: [
                  Container(
                    height: 44,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF18181B) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          visualDensity: VisualDensity.compact,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                          icon: const Icon(LucideIcons.minus, size: 14),
                          onPressed: (isGenerating || _questionCount <= 1)
                              ? null
                              : () => _updateQuestionCount(_questionCount - 1),
                        ),
                        SizedBox(
                          width: 42,
                          child: TextField(
                            controller: _countController,
                            enabled: !isGenerating,
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(2),
                            ],
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : AppColors.lightTextPrimary,
                            ),
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.symmetric(vertical: 8),
                            ),
                            onChanged: (val) {
                              final parsed = int.tryParse(val);
                              if (parsed != null) {
                                setState(() => _questionCount = parsed.clamp(1, 20));
                              }
                            },
                            onEditingComplete: () {
                              _updateQuestionCount(_questionCount);
                              FocusScope.of(context).unfocus();
                            },
                          ),
                        ),
                        Text(
                          'câu',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                          ),
                        ),
                        IconButton(
                          visualDensity: VisualDensity.compact,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                          icon: const Icon(LucideIcons.plus, size: 14),
                          onPressed: (isGenerating || _questionCount >= 20)
                              ? null
                              : () => _updateQuestionCount(_questionCount + 1),
                        ),
                      ],
                    ),
                  ),
                  AppSpacing.gapH12,

                  // Nút Tạo bài tập AI Gradient
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                        ),
                        onPressed: isGenerating
                            ? null
                            : () {
                                final parsed = int.tryParse(_countController.text) ?? _questionCount;
                                final validCount = parsed.clamp(1, 20);
                                _updateQuestionCount(validCount);
                                FocusScope.of(context).unfocus();
                                context.read<QuizBloc>().add(
                                      GenerateQuizRequested(
                                        videoId: widget.videoId,
                                        count: validCount,
                                      ),
                                    );
                              },
                        child: Ink(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF6366F1), Color(0xFF3B82F6)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Container(
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: isGenerating
                                ? const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        'Đang tạo...',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(LucideIcons.sparkles, size: 16, color: Colors.white),
                                      const SizedBox(width: 6),
                                      Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Tạo bài tập AI',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                              height: 1.1,
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              const Icon(LucideIcons.zap, size: 10, color: Colors.yellowAccent),
                                              const SizedBox(width: 2),
                                              if (isProUser && _questionCount > energyCost) ...[
                                                Text(
                                                  '$_questionCount',
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    color: Colors.white54,
                                                    decoration: TextDecoration.lineThrough,
                                                    height: 1.1,
                                                  ),
                                                ),
                                                const SizedBox(width: 4),
                                              ],
                                              Text(
                                                'Tốn $energyCost⚡',
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: isProUser ? FontWeight.bold : FontWeight.normal,
                                                  color: isProUser ? Colors.yellowAccent : Colors.white70,
                                                  height: 1.1,
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
                      ),
                    ),
                  ),
                ],
              ),

              // Thông báo lỗi nếu AI quá tải hoặc thất bại
              if (state is QuizError) ...[
                AppSpacing.gapV12,
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.alertTriangle, color: Colors.redAccent, size: 18),
                      AppSpacing.gapH8,
                      Expanded(
                        child: Text(
                          state.message,
                          style: const TextStyle(fontSize: 12, color: Colors.redAccent),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
