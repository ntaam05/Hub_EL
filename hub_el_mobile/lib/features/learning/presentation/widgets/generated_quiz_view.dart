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
  final int? totalCount;
  final int currentIndex;
  final int difficultyLevel;
  final Map<int, int> questionDifficulties;
  final bool isLoadingNext;
  final String? nextQuestionError;
  final Map<int, String> userAnswers;
  final bool isSubmitted;
  final bool isSubmitting;
  final QuizResultEntity? result;
  final VoidCallback? onNextQuestion;
  final VoidCallback? onSubmit;
  final VoidCallback? onRetry;
  final VoidCallback? onReset;

  const GeneratedQuizView({
    super.key,
    required this.questions,
    this.totalCount,
    this.currentIndex = 0,
    this.difficultyLevel = 2,
    this.questionDifficulties = const {0: 2},
    this.isLoadingNext = false,
    this.nextQuestionError,
    required this.userAnswers,
    this.isSubmitted = false,
    this.isSubmitting = false,
    this.result,
    this.onNextQuestion,
    this.onSubmit,
    this.onRetry,
    this.onReset,
  });

  int get _effectiveTotalCount => totalCount ?? questions.length;

  static String _difficultyLabel(int level) {
    switch (level.clamp(1, 5)) {
      case 1:
        return 'Mức 1 · Rất dễ';
      case 2:
        return 'Mức 2 · Tương đối dễ';
      case 3:
        return 'Mức 3 · Trung bình';
      case 4:
        return 'Mức 4 · Khá khó';
      case 5:
        return 'Mức 5 · Khó';
      default:
        return 'Mức 2 · Tương đối dễ';
    }
  }

  static Color _difficultyColor(int level) {
    switch (level.clamp(1, 5)) {
      case 1:
        return const Color(0xFF10B981);
      case 2:
        return const Color(0xFF22C55E);
      case 3:
        return const Color(0xFFF59E0B);
      case 4:
        return const Color(0xFFF97316);
      case 5:
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF22C55E);
    }
  }

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
          ] else if (questions.isNotEmpty) ...[
            // Thanh tiến độ & badge độ khó khi làm từng câu
            Builder(
              builder: (context) {
                final safeIdx = currentIndex.clamp(0, questions.length - 1);
                final currentDiff = questionDifficulties[safeIdx] ?? difficultyLevel;
                final diffColor = _difficultyColor(currentDiff);
                final answeredCurrent = userAnswers.containsKey(safeIdx);
                final progress = _effectiveTotalCount > 0
                    ? (safeIdx + (answeredCurrent ? 1 : 0)) / _effectiveTotalCount
                    : 0.0;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Câu ${safeIdx + 1} / $_effectiveTotalCount',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: diffColor.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: diffColor.withValues(alpha: 0.35)),
                          ),
                          child: Text(
                            _difficultyLabel(currentDiff),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: diffColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    AppSpacing.gapV8,
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: progress.clamp(0.0, 1.0),
                        minHeight: 6,
                        backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      ),
                    ),
                    AppSpacing.gapV16,
                  ],
                );
              },
            ),
          ],

          // 3. Hiển thị từng câu hỏi (1 câu khi đang làm, toàn bộ khi đã nộp để xem lại)
          if (questions.isNotEmpty)
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: isSubmitted ? questions.length : 1,
              separatorBuilder: (_, _) => AppSpacing.gapV20,
              itemBuilder: (context, listIndex) {
                final index = isSubmitted
                    ? listIndex
                    : currentIndex.clamp(0, questions.length - 1);
                final q = questions[index];
                final selectedOpt = userAnswers[index];
                final isAnswered = selectedOpt != null;
                final showFeedback = isSubmitted || isAnswered;
                final isUserCorrect = selectedOpt != null &&
                    selectedOpt.trim().toUpperCase() == q.correctAnswer.trim().toUpperCase();
                final qDiff = questionDifficulties[index] ?? difficultyLevel;
                final qDiffColor = _difficultyColor(qDiff);
                final isLastQuestion = index + 1 >= _effectiveTotalCount;

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
                      if (isSubmitted) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Câu ${index + 1} / ${questions.length}',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white54 : Colors.grey.shade600,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: qDiffColor.withValues(alpha: 0.14),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: qDiffColor.withValues(alpha: 0.35)),
                              ),
                              child: Text(
                                _difficultyLabel(qDiff),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: qDiffColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        AppSpacing.gapV8,
                      ],
                      // Tiêu đề câu hỏi
                      Text(
                        isSubmitted ? q.questionText : 'Câu ${index + 1}: ${q.questionText}',
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

                        if (showFeedback) {
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
                              onTap: (showFeedback || isSubmitting || isLoadingNext)
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
                                  border: Border.all(
                                    color: borderColor,
                                    width: isSelected || (showFeedback && isCorrect) ? 1.5 : 1,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 26,
                                      height: 26,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        color: showFeedback && isCorrect
                                            ? const Color(0xFF22C55E)
                                            : (showFeedback && isSelected && !isCorrect
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
                                          color: (isSelected || (showFeedback && isCorrect))
                                              ? Colors.white
                                              : textColor,
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
                                          fontWeight: isSelected || (showFeedback && isCorrect)
                                              ? FontWeight.bold
                                              : FontWeight.normal,
                                        ),
                                      ),
                                    ),
                                    if (showFeedback && isCorrect)
                                      const Icon(LucideIcons.checkCircle, color: Color(0xFF22C55E), size: 18),
                                    if (showFeedback && isSelected && !isCorrect)
                                      const Icon(LucideIcons.xCircle, color: Color(0xFFEF4444), size: 18),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }),

                      // Giải thích đáp án ngay sau khi chọn hoặc khi xem lại
                      if (showFeedback && q.explanation.isNotEmpty) ...[
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
                                    color: isUserCorrect
                                        ? const Color(0xFF22C55E)
                                        : const Color(0xFFEF4444),
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      isUserCorrect
                                          ? (!isSubmitted && !isLastQuestion
                                              ? 'Chính xác! Câu tiếp theo sẽ khó hơn.'
                                              : 'Chính xác!')
                                          : (!isSubmitted && !isLastQuestion
                                              ? 'Chưa chính xác! Câu tiếp theo sẽ dễ hơn.'
                                              : 'Chưa chính xác!'),
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: isUserCorrect
                                            ? const Color(0xFF22C55E)
                                            : const Color(0xFFEF4444),
                                      ),
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

          if (nextQuestionError != null && !isSubmitted) ...[
            AppSpacing.gapV12,
            Text(
              nextQuestionError!,
              style: const TextStyle(fontSize: 12, color: AppColors.error),
            ),
          ],

          // 4. Thanh điều khiển phía chân bài tập
          AppSpacing.gapV20,
          if (!isSubmitted && questions.isNotEmpty) ...[
            Builder(
              builder: (context) {
                final safeIdx = currentIndex.clamp(0, questions.length - 1);
                final answeredCurrent = userAnswers.containsKey(safeIdx);
                final isLast = safeIdx + 1 >= _effectiveTotalCount;
                if (!answeredCurrent) return const SizedBox.shrink();

                if (!isLast) {
                  return SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 3,
                      ),
                      onPressed: isLoadingNext
                          ? null
                          : (onNextQuestion ??
                              () => context.read<QuizBloc>().add(const QuizNextQuestionRequested())),
                      icon: isLoadingNext
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(LucideIcons.arrowRight, size: 18),
                      label: Text(
                        isLoadingNext ? 'Đang tạo câu hỏi tiếp theo...' : 'Câu tiếp theo',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                }

                return SizedBox(
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
                          : 'Nộp bài & Chấm điểm (${userAnswers.length}/$_effectiveTotalCount câu)',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ),
                );
              },
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
