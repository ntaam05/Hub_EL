import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../domain/entities/quiz_question_entity.dart';
import '../../domain/entities/quiz_result_entity.dart';
import '../bloc/quiz/quiz_bloc.dart';
import '../bloc/quiz/quiz_event.dart';

class GeneratedQuizView extends StatelessWidget {
  final List<QuizQuestionEntity> questions;
  final Map<int, String> userAnswers;
  final bool isSubmitted;
  final bool isSubmitting;
  final QuizResultEntity? result;
  final VoidCallback? onSubmit;
  final VoidCallback? onRetry;
  final VoidCallback? onReset;

  const GeneratedQuizView({
    super.key,
    required this.questions,
    required this.userAnswers,
    this.isSubmitted = false,
    this.isSubmitting = false,
    this.result,
    this.onSubmit,
    this.onRetry,
    this.onReset,
  });

  int get _correctCount {
    if (result != null) return result!.correctCount;
    int count = 0;
    for (int i = 0; i < questions.length; i++) {
      if (userAnswers[i] != null &&
          userAnswers[i]!.trim().toUpperCase() == questions[i].correctAnswer.trim().toUpperCase()) {
        count++;
      }
    }
    return count;
  }

  double get _percentage =>
      questions.isNotEmpty ? (_correctCount / questions.length) * 100.0 : 0.0;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(top: 16),
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
          // 1. Header Danh sách câu hỏi hoặc Kết quả
          _buildHeader(context, isDark),
          const Divider(height: 24),

          // 2. Banner kết quả khi đã nộp bài (Part D & E)
          if (isSubmitted) ...[
            _buildResultSummaryBanner(context, isDark),
            AppSpacing.gapV20,
          ],

          // 3. Danh sách từng câu hỏi
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: questions.length,
            separatorBuilder: (_, _) => AppSpacing.gapV20,
            itemBuilder: (context, index) {
              final q = questions[index];
              final selectedOpt = userAnswers[index];
              final isUserCorrect = selectedOpt != null &&
                  selectedOpt.trim().toUpperCase() == q.correctAnswer.trim().toUpperCase();

              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1A1A21) : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tiêu đề câu hỏi
                    Text(
                      'Câu ${index + 1}: ${q.questionText}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                        color: isDark ? Colors.white : AppColors.lightTextPrimary,
                      ),
                    ),
                    AppSpacing.gapV12,

                    // 4 Lựa chọn A, B, C, D
                    ...['A', 'B', 'C', 'D'].map((opt) {
                      final optText = q.getOption(opt);
                      if (optText.isEmpty) return const SizedBox.shrink();

                      final isSelected = selectedOpt == opt;
                      final isCorrect = q.correctAnswer.trim().toUpperCase() == opt;

                      Color borderColor = isDark ? AppColors.darkBorder : Colors.grey.shade300;
                      Color bgColor = isDark ? const Color(0xFF23232B) : Colors.white;
                      Color textColor = isDark ? Colors.white70 : Colors.black87;
                      double opacity = 1.0;

                      if (isSubmitted) {
                        if (isCorrect) {
                          borderColor = const Color(0xFF22C55E);
                          bgColor = const Color(0xFF22C55E).withValues(alpha: 0.15);
                          textColor = const Color(0xFF22C55E);
                        } else if (isSelected && !isCorrect) {
                          borderColor = const Color(0xFFEF4444);
                          bgColor = const Color(0xFFEF4444).withValues(alpha: 0.15);
                          textColor = const Color(0xFFEF4444);
                        } else {
                          opacity = 0.45;
                          textColor = isDark ? Colors.white38 : Colors.grey;
                        }
                      } else if (isSelected) {
                        borderColor = AppColors.primary;
                        bgColor = AppColors.primary.withValues(alpha: 0.15);
                        textColor = AppColors.primaryLight;
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Opacity(
                          opacity: opacity,
                          child: InkWell(
                            onTap: (isSubmitted || isSubmitting)
                                ? null
                                : () {
                                    context.read<QuizBloc>().add(
                                          QuizAnswerSelected(
                                            questionIndex: index,
                                            option: opt,
                                          ),
                                        );
                                  },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: bgColor,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: borderColor, width: isSelected || (isSubmitted && isCorrect) ? 1.5 : 1),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 26,
                                    height: 26,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: isSubmitted && isCorrect
                                          ? const Color(0xFF22C55E)
                                          : (isSubmitted && isSelected && !isCorrect
                                              ? const Color(0xFFEF4444)
                                              : (isSelected
                                                  ? AppColors.primary
                                                  : (isDark ? Colors.white10 : Colors.grey.shade200))),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      opt,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: (isSelected || (isSubmitted && isCorrect)) ? Colors.white : textColor,
                                      ),
                                    ),
                                  ),
                                  AppSpacing.gapH12,
                                  Expanded(
                                    child: Text(
                                      optText,
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: textColor,
                                        fontWeight: isSelected || (isSubmitted && isCorrect)
                                            ? FontWeight.bold
                                            : FontWeight.normal,
                                      ),
                                    ),
                                  ),
                                  if (isSubmitted && isCorrect)
                                    const Icon(LucideIcons.checkCircle, color: Color(0xFF22C55E), size: 18),
                                  if (isSubmitted && isSelected && !isCorrect)
                                    const Icon(LucideIcons.xCircle, color: Color(0xFFEF4444), size: 18),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }),

                    // Giải thích đáp án sau khi nộp bài
                    if (isSubmitted && q.explanation.isNotEmpty) ...[
                      AppSpacing.gapV8,
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isUserCorrect
                              ? const Color(0xFF22C55E).withValues(alpha: 0.1)
                              : const Color(0xFFEF4444).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isUserCorrect
                                ? const Color(0xFF22C55E).withValues(alpha: 0.3)
                                : const Color(0xFFEF4444).withValues(alpha: 0.3),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  isUserCorrect ? LucideIcons.checkCircle : LucideIcons.xCircle,
                                  size: 16,
                                  color: isUserCorrect ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  isUserCorrect ? 'Chính xác!' : 'Chưa chính xác!',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isUserCorrect ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
                                  ),
                                ),
                              ],
                            ),
                            AppSpacing.gapV6,
                            Text(
                              'Giải thích: ${q.explanation}',
                              style: TextStyle(
                                fontSize: 12,
                                height: 1.45,
                                color: isDark ? Colors.white70 : Colors.black87,
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
          ),

          // 4. Thanh điều khiển phía chân bài tập
          AppSpacing.gapV20,
          if (!isSubmitted) ...[
            // Nút Nộp bài & Chấm điểm (Part D)
            if (userAnswers.isNotEmpty)
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 3,
                  ),
                  onPressed: isSubmitting ? null : onSubmit,
                  icon: isSubmitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(LucideIcons.checkCircle, size: 18),
                  label: Text(
                    isSubmitting
                        ? 'Đang chấm điểm...'
                        : 'Nộp bài & Chấm điểm (${userAnswers.length}/${questions.length} câu)',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
          ] else ...[
            // 2 Nút hành động sau khi đã chấm điểm: Làm lại & Tạo đề mới
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: BorderSide(
                        color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: onRetry ??
                        () => context.read<QuizBloc>().add(const QuizRetryRequested()),
                    icon: const Icon(LucideIcons.rotateCcw, size: 16),
                    label: const Text(
                      'Làm lại bài này',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
                AppSpacing.gapH12,
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: const Color(0xFF6366F1),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: onReset ??
                        () => context.read<QuizBloc>().add(const QuizResetRequested()),
                    icon: const Icon(LucideIcons.sparkles, size: 16),
                    label: const Text(
                      'Tạo đề mới',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(
              isSubmitted ? LucideIcons.award : LucideIcons.zap,
              color: isSubmitted ? const Color(0xFF22C55E) : Colors.amber,
              size: 20,
            ),
            AppSpacing.gapH8,
            Text(
              isSubmitted
                  ? 'Kết Quả Bài Tập ($_correctCount/${questions.length} đúng)'
                  : 'Bài Tập AI Sinh Ra (${questions.length} câu)',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : AppColors.lightTextPrimary,
              ),
            ),
          ],
        ),
        IconButton(
          icon: const Icon(LucideIcons.rotateCcw, size: 18),
          tooltip: 'Làm lại từ đầu',
          onPressed: () {
            context.read<QuizBloc>().add(const QuizResetRequested());
          },
        ),
      ],
    );
  }

  Widget _buildResultSummaryBanner(BuildContext context, bool isDark) {
    final passed = _percentage >= 50.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: passed
            ? const Color(0xFF22C55E).withValues(alpha: 0.1)
            : const Color(0xFFEF4444).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: passed
              ? const Color(0xFF22C55E).withValues(alpha: 0.3)
              : const Color(0xFFEF4444).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          // Điểm số dạng phần trăm tròn
          Container(
            width: 52,
            height: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: passed ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
            ),
            child: Text(
              '${_percentage.toInt()}%',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  passed ? 'Tuyệt vời! Bạn đã vượt qua ' : 'Hãy cố gắng thêm một chút! ',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: passed ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
                  ),
                ),
                AppSpacing.gapV4,
                Text(
                  'Bạn trả lời đúng $_correctCount trên tổng số ${questions.length} câu.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
                if (result != null && (result!.earnedXP > 0 || result!.earnedCoins > 0)) ...[
                  AppSpacing.gapV8,
                  Wrap(
                    spacing: 8,
                    children: [
                      if (result!.earnedXP > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '+${result!.earnedXP} EXP',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF3B82F6),
                            ),
                          ),
                        ),
                      if (result!.earnedCoins > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAB308).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '+${result!.earnedCoins} XU',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFEAB308),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
