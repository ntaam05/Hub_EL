import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../data/models/quiz_history_model.dart';

class QuizReviewScreen extends StatefulWidget {
  final QuizHistoryModel attempt;

  const QuizReviewScreen({super.key, required this.attempt});

  @override
  State<QuizReviewScreen> createState() => _QuizReviewScreenState();
}

class _QuizReviewScreenState extends State<QuizReviewScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final questions = widget.attempt.questions;
    final total = questions.length;

    if (total == 0) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Ôn tập câu hỏi', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        body: const Center(
          child: Text('Bài tập này không có dữ liệu câu hỏi cũ.', style: TextStyle(color: Colors.grey)),
        ),
      );
    }

    final currentQ = questions[_currentIndex] as Map<String, dynamic>;
    final questionText = currentQ['questionText']?.toString() ?? 'Câu hỏi';
    final optA = currentQ['optionA']?.toString() ?? '';
    final optB = currentQ['optionB']?.toString() ?? '';
    final optC = currentQ['optionC']?.toString() ?? '';
    final optD = currentQ['optionD']?.toString() ?? '';
    final correctAnswer = currentQ['correctAnswer']?.toString().toUpperCase() ?? 'A';
    final explanation = currentQ['explanation']?.toString() ?? '';

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
        elevation: 0.5,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ÔN TẬP BÀI HỌC',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.primary),
            ),
            Text(
              widget.attempt.videoTitle ?? 'Trắc nghiệm',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.white70 : Colors.black87,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 14),
                const SizedBox(width: 4),
                Text(
                  '${widget.attempt.correctCount}/${widget.attempt.totalQuizzes}',
                  style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress Bar
            LinearProgressIndicator(
              value: (_currentIndex + 1) / total,
              backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              minHeight: 4,
            ),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  // Header câu hỏi
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Câu ${_currentIndex + 1} / $total',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                  AppSpacing.gapV16,

                  // Nội dung câu hỏi
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkCard : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: isDark ? AppColors.darkBorder : Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Text(
                      questionText,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        height: 1.45,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  AppSpacing.gapV20,

                  // 4 đáp án
                  _buildOptionItem('A', optA, correctAnswer == 'A', isDark),
                  _buildOptionItem('B', optB, correctAnswer == 'B', isDark),
                  _buildOptionItem('C', optC, correctAnswer == 'C', isDark),
                  _buildOptionItem('D', optD, correctAnswer == 'D', isDark),

                  AppSpacing.gapV16,

                  // Giải thích chi tiết
                  if (explanation.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.blue.withValues(alpha: 0.25)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(LucideIcons.lightbulb, color: Colors.blueAccent, size: 18),
                              SizedBox(width: 8),
                              Text(
                                'GIẢI THÍCH CHI TIẾT',
                                style: TextStyle(
                                  color: Colors.blueAccent,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 12,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            explanation,
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.5,
                              color: isDark ? Colors.white70 : const Color(0xFF334155),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

            // Thanh điều hướng đáy (Trước / Sau)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : Colors.white,
                border: Border(top: BorderSide(color: isDark ? AppColors.darkBorder : Colors.grey.shade200)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  OutlinedButton.icon(
                    onPressed: _currentIndex > 0
                        ? () => setState(() => _currentIndex--)
                        : null,
                    icon: const Icon(LucideIcons.chevronLeft, size: 16),
                    label: const Text('Câu trước'),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: _currentIndex < total - 1
                        ? () => setState(() => _currentIndex++)
                        : () => Navigator.of(context).pop(),
                    icon: Icon(_currentIndex < total - 1 ? LucideIcons.chevronRight : LucideIcons.check, size: 16),
                    label: Text(_currentIndex < total - 1 ? 'Câu tiếp' : 'Hoàn tất'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionItem(String key, String text, bool isCorrect, bool isDark) {
    if (text.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isCorrect
              ? AppColors.success.withValues(alpha: 0.12)
              : (isDark ? AppColors.darkCard : Colors.white),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isCorrect
                ? AppColors.success
                : (isDark ? AppColors.darkBorder : Colors.grey.shade200),
            width: isCorrect ? 1.8 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isCorrect ? AppColors.success : (isDark ? Colors.white10 : Colors.grey.shade100),
              ),
              child: Center(
                child: Text(
                  key,
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    color: isCorrect ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isCorrect ? FontWeight.bold : FontWeight.w500,
                  color: isCorrect
                      ? (isDark ? const Color(0xFF34D399) : const Color(0xFF065F46))
                      : (isDark ? Colors.white70 : Colors.black87),
                ),
              ),
            ),
            if (isCorrect)
              const Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 20),
          ],
        ),
      ),
    );
  }
}
