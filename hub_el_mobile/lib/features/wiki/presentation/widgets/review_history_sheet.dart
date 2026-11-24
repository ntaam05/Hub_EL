import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../domain/entities/wiki_quiz_attempt_entity.dart';

class ReviewHistorySheet extends StatelessWidget {
  final WikiQuizAttemptEntity attempt;

  const ReviewHistorySheet({super.key, required this.attempt});

  static Future<void> show(BuildContext context, WikiQuizAttemptEntity attempt) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ReviewHistorySheet(attempt: attempt),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(attempt.createdAt);
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: const [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 20,
                offset: Offset(0, -5),
              ),
            ],
          ),
          child: Column(
            children: [
              // Thanh kéo drag handle
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  margin: const EdgeInsets.only(top: 10, bottom: 8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                  border: Border(bottom: BorderSide(color: borderColor)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'CHI TIẾT BÀI LÀM',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                              color: isDark ? Colors.white : const Color(0xFF1E293B),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Wrap(
                            spacing: 12,
                            runSpacing: 4,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(LucideIcons.clock, size: 14, color: isDark ? Colors.white60 : Colors.black54),
                                  const SizedBox(width: 4),
                                  Text(
                                    dateStr,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: isDark ? Colors.white60 : Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(LucideIcons.award, size: 14, color: Color(0xFF16A34A)),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Đúng ${attempt.correctCount}/${attempt.totalQuizzes} câu',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF16A34A),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(LucideIcons.x, size: 20),
                      style: IconButton.styleFrom(
                        backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
              ),

              // Nội dung chi tiết cuộn
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Section 1: Đoạn văn đã đọc
                    if (attempt.simplifiedText != null && attempt.simplifiedText!.trim().isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: borderColor),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Đoạn văn đã đọc',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                              ),
                            ),
                            const Divider(height: 16),
                            Text(
                              attempt.simplifiedText!,
                              textAlign: TextAlign.justify,
                              style: TextStyle(
                                fontSize: 13,
                                height: 1.6,
                                color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                              ),
                            ),
                          ],
                        ),
                      ),
                      AppSpacing.gapV16,
                    ],

                    // Section 2: Danh sách Câu hỏi & Đáp án
                    if (attempt.quizzes.isNotEmpty) ...[
                      Text(
                        'CÂU HỎI & ĐÁP ÁN',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                          color: isDark ? Colors.white : const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...List.generate(attempt.quizzes.length, (qIdx) {
                        final quiz = attempt.quizzes[qIdx];
                        final userAnswer = qIdx < attempt.userAnswers.length
                            ? attempt.userAnswers[qIdx]
                            : null;
                        return _buildQuizReviewItem(context, quiz, userAnswer, isDark, borderColor);
                      }),
                    ] else
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Text(
                            'Không có dữ liệu chi tiết câu hỏi.',
                            style: TextStyle(
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuizReviewItem(
    BuildContext context,
    QuizQuestion quiz,
    String? userAnswer,
    bool isDark,
    Color borderColor,
  ) {
    final isMultipleChoice = ['multiple_choice', 'guess_meaning', 'true_false', 'main_idea', 'inference']
        .contains(quiz.type.toLowerCase());

    bool isCorrect = false;
    final userAnsInt = int.tryParse(userAnswer ?? '');

    if (isMultipleChoice && userAnsInt != null && userAnsInt >= 0 && userAnsInt < quiz.options.length) {
      final selectedOpt = quiz.options[userAnsInt].trim().toLowerCase();
      isCorrect = quiz.correctAnswers.any((a) => a.trim().toLowerCase() == selectedOpt);
    } else if (userAnswer != null) {
      isCorrect = quiz.correctAnswers.any((a) => a.trim().toLowerCase() == userAnswer.trim().toLowerCase());
    }

    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row Header: Status Icon, Type Pill, Question
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: isCorrect ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Icon(
                    isCorrect ? LucideIcons.check : LucideIcons.x,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        quiz.type.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      quiz.question,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Options Review
          if (isMultipleChoice)
            Column(
              children: List.generate(quiz.options.length, (optIdx) {
                final opt = quiz.options[optIdx];
                final isOptCorrect = quiz.correctAnswers.any((a) => a.trim().toLowerCase() == opt.trim().toLowerCase());
                final isSelected = userAnsInt == optIdx;

                Color optBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
                Color optBorder = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
                Color textColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

                if (isOptCorrect) {
                  optBg = isDark ? const Color(0xFF14532D).withValues(alpha: 0.3) : const Color(0xFFDCFCE7);
                  optBorder = const Color(0xFF22C55E);
                  textColor = isDark ? const Color(0xFF86EFAC) : const Color(0xFF15803D);
                } else if (isSelected && !isOptCorrect) {
                  optBg = isDark ? const Color(0xFF7F1D1D).withValues(alpha: 0.3) : const Color(0xFFFEE2E2);
                  optBorder = const Color(0xFFEF4444);
                  textColor = isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C);
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: optBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: optBorder, width: isOptCorrect || isSelected ? 1.5 : 1.0),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          opt,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isOptCorrect || isSelected ? FontWeight.bold : FontWeight.normal,
                            color: textColor,
                          ),
                        ),
                      ),
                      if (isOptCorrect)
                        const Icon(LucideIcons.checkCircle2, size: 16, color: Color(0xFF22C55E))
                      else if (isSelected && !isOptCorrect)
                        const Icon(LucideIcons.xCircle, size: 16, color: Color(0xFFEF4444)),
                    ],
                  ),
                );
              }),
            )
          else ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Bạn đã nhập:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 2),
                  Text(
                    userAnswer ?? '(Bỏ trống)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isCorrect ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF14532D).withValues(alpha: 0.2) : const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Đáp án chuẩn:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
                  const SizedBox(height: 2),
                  Text(
                    quiz.correctAnswers.join(' / '),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                  ),
                ],
              ),
            ),
          ],

          // AI Giải thích
          if (quiz.explanation.trim().isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.2) : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'AI GIẢI THÍCH',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF2563EB),
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    quiz.explanation,
                    textAlign: TextAlign.justify,
                    style: TextStyle(
                      fontSize: 12,
                      height: 1.4,
                      color: isDark ? const Color(0xFFBFDBFE) : const Color(0xFF1E40AF),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

