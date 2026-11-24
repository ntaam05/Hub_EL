import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/achievement_entities.dart';

class GroupFilterBar extends StatelessWidget {
  final String? selectedGroup;
  final Map<String, int> groupCounts;
  final Map<String, int> groupUnlockedCounts;
  final Function(String? groupId) onGroupSelected;

  const GroupFilterBar({
    super.key,
    required this.selectedGroup,
    required this.groupCounts,
    required this.groupUnlockedCounts,
    required this.onGroupSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalAll = groupCounts.values.fold<int>(0, (sum, count) => sum + count);

    return SizedBox(
      height: 38,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          // Chip Tất cả
          _buildChip(
            label: 'Tất cả',
            count: totalAll,
            isSelected: selectedGroup == null,
            onTap: () => onGroupSelected(null),
            isDark: isDark,
          ),
          const SizedBox(width: 8),

          // 14 Nhóm Thành Tựu
          ...AchievementGroup.values.map((group) {
            final count = groupCounts[group.code] ?? 0;
            final isSelected = selectedGroup == group.code;

            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _buildChip(
                label: group.label,
                icon: group.icon,
                count: count,
                isSelected: isSelected,
                onTap: () => onGroupSelected(group.code),
                isDark: isDark,
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildChip({
    required String label,
    IconData? icon,
    required int count,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : (isDark ? AppColors.darkCard : Colors.white),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? AppColors.darkBorder : Colors.grey.shade300),
            width: isSelected ? 1.5 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 13,
                color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.grey.shade700),
              ),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.grey.shade700),
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.25)
                      : (isDark ? Colors.white12 : Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: isSelected ? Colors.white : (isDark ? Colors.white54 : Colors.grey.shade600),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

