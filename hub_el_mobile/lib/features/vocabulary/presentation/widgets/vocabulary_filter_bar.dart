import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../cubit/vocabulary_state.dart';

class VocabularyFilterBar extends StatelessWidget {
  final String selectedLanguage;
  final String selectedPos;
  final VocabSortOrder sortOrder;
  final List<String> posList;
  final bool hasActiveFilters;
  final ValueChanged<String> onLanguageChanged;
  final ValueChanged<String> onPosChanged;
  final VoidCallback onToggleSort;
  final VoidCallback onReset;

  static const List<String> supportedLanguages = [
    'ALL',
    'Tiếng Anh',
    'Tiếng Nhật',
    'Tiếng Hàn',
    'Tiếng Trung',
    'Tiếng Pháp',
    'Tiếng Đức',
  ];

  const VocabularyFilterBar({
    super.key,
    required this.selectedLanguage,
    required this.selectedPos,
    required this.sortOrder,
    required this.posList,
    required this.hasActiveFilters,
    required this.onLanguageChanged,
    required this.onPosChanged,
    required this.onToggleSort,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Hàng 1: Ngôn ngữ & Nút Sắp xếp A-Z
        Row(
          children: [
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: supportedLanguages.map((lang) {
                    final isSelected = selectedLanguage == lang ||
                        (selectedLanguage == 'Tất cả' && lang == 'ALL');
                    final label = lang == 'ALL' ? 'Mọi ngôn ngữ' : lang;

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        selected: isSelected,
                        label: Text(
                          label,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                            color: isSelected
                                ? Colors.white
                                : (isDark ? Colors.white70 : Colors.black87),
                          ),
                        ),
                        selectedColor: const Color(0xFF6366F1),
                        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
                        checkmarkColor: Colors.white,
                        showCheckmark: false,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999),
                          side: BorderSide(
                            color: isSelected
                                ? const Color(0xFF6366F1)
                                : (isDark ? AppColors.darkBorder : Colors.grey.shade300),
                          ),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        onSelected: (_) => onLanguageChanged(lang),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Nút Toggle Sắp xếp A-Z / Z-A
            InkWell(
              onTap: onToggleSort,
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      sortOrder == VocabSortOrder.az
                          ? LucideIcons.arrowDownAZ
                          : LucideIcons.arrowUpAZ,
                      size: 15,
                      color: const Color(0xFF6366F1),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      sortOrder == VocabSortOrder.az ? 'A-Z' : 'Z-A',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 10),

        // Hàng 2: Phân loại loại từ (POS) & Nút Đặt lại
        Row(
          children: [
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    // Chip Tất cả loại từ
                    _buildPosChip(
                      context,
                      label: 'TẤT CẢ TỪ LOẠI',
                      isSelected: selectedPos == 'ALL',
                      onTap: () => onPosChanged('ALL'),
                      isDark: isDark,
                    ),
                    ...posList.map((pos) {
                      return _buildPosChip(
                        context,
                        label: pos,
                        isSelected: selectedPos == pos,
                        onTap: () => onPosChanged(pos),
                        isDark: isDark,
                      );
                    }),
                  ],
                ),
              ),
            ),
            if (hasActiveFilters) ...[
              const SizedBox(width: 8),
              InkWell(
                onTap: onReset,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        LucideIcons.rotateCcw,
                        size: 13,
                        color: Colors.amber.shade700,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Đặt lại',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Colors.amber.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildPosChip(
    BuildContext context, {
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF6366F1).withValues(alpha: isDark ? 0.25 : 0.15)
                : (isDark ? AppColors.darkSurface : Colors.grey.shade100),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF6366F1)
                  : (isDark ? AppColors.darkBorder : Colors.grey.shade300),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
              color: isSelected
                  ? const Color(0xFF6366F1)
                  : (isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
            ),
          ),
        ),
      ),
    );
  }
}
