import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/achievement_entities.dart';

class TierFilterBar extends StatelessWidget {
  final int? selectedTier;
  final Map<int, int> tierCounts;
  final Function(int? tier) onTierSelected;

  const TierFilterBar({
    super.key,
    required this.selectedTier,
    required this.tierCounts,
    required this.onTierSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalAll = tierCounts.values.fold<int>(0, (sum, count) => sum + count);

    return SizedBox(
      height: 36,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          // Tất cả cấp độ
          _buildChip(
            label: 'Tất cả cấp',
            count: totalAll,
            isSelected: selectedTier == null,
            color: isDark ? Colors.white : AppColors.primary,
            onTap: () => onTierSelected(null),
            isDark: isDark,
          ),
          const SizedBox(width: 8),

          // 6 Cấp độ
          ...AchievementTier.values.map((tier) {
            final count = tierCounts[tier.level] ?? 0;
            final isSelected = selectedTier == tier.level;

            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _buildChip(
                label: tier.label,
                tierLevel: tier.level,
                count: count,
                isSelected: isSelected,
                color: tier.primaryColor,
                onTap: () => onTierSelected(tier.level),
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
    int? tierLevel,
    required int count,
    required bool isSelected,
    required Color color,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected
              ? color.withValues(alpha: isDark ? 0.25 : 0.15)
              : (isDark ? AppColors.darkCard : Colors.white),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? color : (isDark ? AppColors.darkBorder : Colors.grey.shade300),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (tierLevel != null) ...[
              Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '$tierLevel',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                color: isSelected ? color : (isDark ? Colors.white70 : Colors.grey.shade700),
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 5),
              Text(
                '($count)',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? color : (isDark ? Colors.white38 : Colors.grey.shade500),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

