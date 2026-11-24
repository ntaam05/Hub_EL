import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/entities/wiki_study_session_entity.dart';

class WikiQuizCardWidget extends StatelessWidget {
  final WikiStudyQuestionEntity quiz;
  final dynamic selectedAnswer;
  final bool isConfirmed;
  final ValueChanged<dynamic> onAnswerSelected;
  final VoidCallback onConfirm;

  const WikiQuizCardWidget({
    super.key,
    required this.quiz,
    required this.selectedAnswer,
    required this.isConfirmed,
    required this.onAnswerSelected,
    required this.onConfirm,
  });

  String _getSkillLabel(String type) {
    switch (type) {
      case 'true_false':
        return 'ĐÚNG / SAI';
      case 'main_idea':
        return 'Ý CHÍNH';
      case 'inference':
        return 'SUY LUẬN';
      case 'guess_meaning':
        return 'ĐOÁN NGHĨA';
      default:
        return 'TRẮC NGHIỆM';
    }
  }

  Color _getSkillColor(String type) {
    switch (type) {
      case 'inference':
        return const Color(0xFF9333EA);
      case 'true_false':
        return const Color(0xFFEA580C);
      case 'guess_meaning':
        return const Color(0xFFCA8A04);
      default:
        return const Color(0xFF2563EB);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final skillColor = _getSkillColor(quiz.type);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF111827) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Q{index + 1} and Type Badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'Q${quiz.index + 1}.',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF2563EB),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: skillColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: skillColor.withOpacity(0.3)),
                ),
                child: Text(
                  _getSkillLabel(quiz.type),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                    color: skillColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Question Text
          Text(
            quiz.question,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              height: 1.4,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 14),

          // Options List
          ...List.generate(quiz.options.length, (optIdx) {
            final optText = quiz.options[optIdx];
            final isSelected = selectedAnswer == optIdx || selectedAnswer == optText;

            Color bgColor = isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC);
            Color borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
            Color textColor = isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155);

            if (isSelected) {
              if (isConfirmed) {
                // Confirmed state
                bgColor = isDark ? const Color(0xFF1E3A8A).withOpacity(0.4) : const Color(0xFFEFF6FF);
                borderColor = const Color(0xFF2563EB);
                textColor = isDark ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8);
              } else {
                // Selected state before confirm
                bgColor = isDark ? const Color(0xFF1E3A8A).withOpacity(0.3) : const Color(0xFFDBEAFE);
                borderColor = const Color(0xFF2563EB);
                textColor = isDark ? Colors.white : const Color(0xFF1E3A8A);
              }
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: isConfirmed ? null : () => onAnswerSelected(optIdx),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: borderColor,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isSelected ? const Color(0xFF2563EB) : Colors.transparent,
                          border: Border.all(
                            color: isSelected ? const Color(0xFF2563EB) : Colors.grey,
                            width: 1.5,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            String.fromCharCode(65 + optIdx),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          optText,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                            color: textColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),

          // Nút "Xác nhận" (Hiện ra khi đã chọn đáp án nhưng chưa xác nhận)
          if (!isConfirmed && selectedAnswer != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: SizedBox(
                width: double.infinity,
                height: 44,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 2,
                  ),
                  onPressed: onConfirm,
                  child: const Text(
                    'XÁC NHẬN',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ),
            ),

          // Đã xác nhận: Khóa câu hỏi
          if (isConfirmed)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Row(
                children: [
                  const Icon(LucideIcons.checkCircle, size: 14, color: Color(0xFF10B981)),
                  const SizedBox(width: 6),
                  Text(
                    'Đã ghi nhận câu trả lời',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF059669),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

