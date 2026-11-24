import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../bloc/wiki_study_bloc.dart';
import '../bloc/wiki_study_event.dart';
import '../bloc/wiki_study_state.dart';

class WikiStudyConfigWidget extends StatelessWidget {
  final WikiStudyState state;

  const WikiStudyConfigWidget({super.key, required this.state});

  static const List<Map<String, String>> langOptions = [
    {'value': 'Tiếng Anh', 'label': '🇬🇧 Tiếng Anh'},
    {'value': 'Tiếng Nhật', 'label': '🇯🇵 Tiếng Nhật'},
    {'value': 'Tiếng Hàn', 'label': '🇰🇷 Tiếng Hàn'},
    {'value': 'Tiếng Trung', 'label': '🇨🇳 Tiếng Trung'},
    {'value': 'Tiếng Pháp', 'label': '🇫🇷 Tiếng Pháp'},
    {'value': 'Tiếng Đức', 'label': '🇩🇪 Tiếng Đức'},
  ];

  static const List<Map<String, String>> levelOptions = [
    {'value': 'A1', 'label': 'A1 - Sơ cấp'},
    {'value': 'A2', 'label': 'A2 - Cơ bản'},
    {'value': 'B1', 'label': 'B1 - Trung cấp'},
    {'value': 'B2', 'label': 'B2 - Trung cao'},
    {'value': 'C1', 'label': 'C1 - Cao cấp'},
    {'value': 'C2', 'label': 'C2 - Thành thạo'},
  ];

  static const List<Map<String, String>> quizSkills = [
    {'id': 'multiple_choice', 'label': 'Trắc nghiệm chi tiết'},
    {'id': 'true_false', 'label': 'Đúng / Sai (T/F/NG)'},
    {'id': 'main_idea', 'label': 'Tìm ý chính'},
    {'id': 'inference', 'label': 'Suy luận logic'},
    {'id': 'guess_meaning', 'label': 'Đoán nghĩa (Ngữ cảnh)'},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final card = state.card;
    final isPro = card?.isPro ?? false;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF111827) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header with PRO Tag
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          LucideIcons.settings2,
                          color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'THIẾT LẬP BÀI HỌC',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                    if (isPro)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.withOpacity(0.4)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.crown, size: 14, color: Colors.amber),
                            SizedBox(width: 4),
                            Text(
                              'PRO (-30% NL)',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.amber,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 16),

                // Ngôn ngữ & Trình độ Dropdown
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(LucideIcons.globe, size: 14, color: isDark ? Colors.blueAccent : Colors.blue),
                              const SizedBox(width: 6),
                              Text(
                                'Ngôn ngữ:',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          _buildDropdown(
                            context: context,
                            value: state.selectedLanguage,
                            options: langOptions,
                            onChanged: (val) {
                              if (val != null) {
                                context.read<WikiStudyBloc>().add(WikiStudyLanguageChanged(val));
                              }
                            },
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(LucideIcons.signalHigh, size: 14, color: isDark ? Colors.greenAccent : Colors.green),
                              const SizedBox(width: 6),
                              Text(
                                'Trình độ:',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          _buildDropdown(
                            context: context,
                            value: state.selectedLevel,
                            options: levelOptions,
                            onChanged: (val) {
                              if (val != null) {
                                context.read<WikiStudyBloc>().add(WikiStudyLevelChanged(val));
                              }
                            },
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Số lượng câu hỏi Slider
                _buildSingleSlider(
                  label: 'Số câu hỏi:',
                  subLabel: 'Tối đa: ${state.dynamicMaxQs} câu',
                  value: state.numQs,
                  min: 2,
                  max: state.dynamicMaxQs,
                  onChanged: (val) {
                    context.read<WikiStudyBloc>().add(WikiStudyNumQuestionsChanged(val));
                  },
                  isDark: isDark,
                  color: const Color(0xFF2563EB),
                ),
                const SizedBox(height: 16),

                // Thời gian làm bài Slider
                _buildSingleSlider(
                  label: 'Thời gian làm bài (Phút):',
                  subLabel: state.timeLimit == 0 ? 'Không giới hạn (∞)' : '${state.timeLimit} phút',
                  value: state.timeLimit,
                  min: 0,
                  max: 60,
                  displayValue: state.timeLimit == 0 ? '∞' : '${state.timeLimit}',
                  onChanged: (val) {
                    context.read<WikiStudyBloc>().add(WikiStudyTimeLimitChanged(val));
                  },
                  isDark: isDark,
                  color: const Color(0xFF9333EA),
                  helperText: '* Chọn ∞ (0 phút) để học thoải mái không giới hạn thời gian.',
                ),
                const SizedBox(height: 16),

                // Thanh trượt kép: Độ dài bài đọc (Dual Range)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Độ dài bài đọc (Số từ):',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF14B8A6).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF14B8A6).withOpacity(0.4)),
                          ),
                          child: Text(
                            '${state.wordMin} - ${state.wordMax} từ',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0D9488),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    RangeSlider(
                      values: RangeValues(state.wordMin.toDouble(), state.wordMax.toDouble()),
                      min: 100,
                      max: 700,
                      divisions: 60,
                      activeColor: const Color(0xFF14B8A6),
                      inactiveColor: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                      onChanged: (RangeValues values) {
                        int minVal = (values.start / 10).round() * 10;
                        int maxVal = (values.end / 10).round() * 10;
                        if (maxVal - minVal >= 50) {
                          context.read<WikiStudyBloc>().add(WikiStudyWordRangeChanged(minVal, maxVal));
                        }
                      },
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('100 từ', style: TextStyle(fontSize: 11, color: isDark ? Colors.grey : Colors.black45)),
                        Text('700 từ', style: TextStyle(fontSize: 11, color: isDark ? Colors.grey : Colors.black45)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Khối Luyện tập kỹ năng (Chọn nhiều)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF111827) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Luyện tập kỹ năng (Chọn ít nhất 2):',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                  ),
                ),
                const SizedBox(height: 12),
                ...quizSkills.map((skill) {
                  final isSelected = state.quizTypes.contains(skill['id']);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: () {
                        context.read<WikiStudyBloc>().add(WikiStudySkillToggled(skill['id']!));
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? (isDark ? const Color(0xFF1E3A8A).withOpacity(0.4) : const Color(0xFFEFF6FF))
                              : (isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC)),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFF2563EB)
                                : (isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF2563EB) : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF2563EB) : Colors.grey,
                                  width: 2,
                                ),
                              ),
                              child: isSelected
                                  ? const Icon(LucideIcons.check, size: 16, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                skill['label']!,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                                  color: isSelected
                                      ? (isDark ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8))
                                      : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Nút Bắt đầu học (CTA)
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: state.quizTypes.length < 2
                    ? (isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1))
                    : const Color(0xFF4F46E5),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: state.quizTypes.length < 2 ? 0 : 4,
              ),
              onPressed: state.quizTypes.length < 2
                  ? null
                  : () {
                      context.read<WikiStudyBloc>().add(const WikiStudyGenerateRequested());
                    },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.sparkles, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    state.quizTypes.length < 2
                        ? 'Chọn ít nhất 2 kỹ năng'
                        : 'Bắt đầu học (Tiêu hao ${state.energyCost} Năng lượng)',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required BuildContext context,
    required String value,
    required List<Map<String, String>> options,
    required ValueChanged<String?> onChanged,
    required bool isDark,
  }) {
    final safeValue = options.any((opt) => opt['value'] == value)
        ? value
        : (options.isNotEmpty ? options.first['value'] : null);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: safeValue,
          isExpanded: true,
          dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
          icon: Icon(LucideIcons.chevronDown, size: 18, color: isDark ? Colors.grey : Colors.black54),
          items: options.map((opt) {
            return DropdownMenuItem<String>(
              value: opt['value'],
              child: Text(
                opt['label']!,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildSingleSlider({
    required String label,
    required String subLabel,
    required int value,
    required int min,
    required int max,
    required ValueChanged<int> onChanged,
    required bool isDark,
    required Color color,
    String? displayValue,
    String? helperText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                subLabel,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: Slider(
                value: value.clamp(min, max).toDouble(),
                min: min.toDouble(),
                max: max.toDouble(),
                divisions: max > min ? max - min : 1,
                activeColor: color,
                inactiveColor: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                onChanged: (double val) => onChanged(val.round()),
              ),
            ),
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(color: color.withOpacity(0.3), blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: Center(
                child: Text(
                  displayValue ?? '$value',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
          ],
        ),
        if (helperText != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              helperText,
              style: TextStyle(
                fontSize: 11,
                fontStyle: FontStyle.italic,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
            ),
          ),
      ],
    );
  }
}
