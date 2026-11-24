import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/entities/leaderboard_entity.dart';

class CategorySelectorWidget extends StatelessWidget {
  final LeaderboardCategoryType selectedCategory;
  final ValueChanged<LeaderboardCategoryType> onCategorySelected;

  const CategorySelectorWidget({
    super.key,
    required this.selectedCategory,
    required this.onCategorySelected,
  });

  IconData _getCategoryIcon(LeaderboardCategoryType category) {
    switch (category) {
      case LeaderboardCategoryType.streak:
        return LucideIcons.flame;
      case LeaderboardCategoryType.grinder:
        return LucideIcons.swords;
      case LeaderboardCategoryType.time:
        return LucideIcons.clock;
      case LeaderboardCategoryType.aiKiller:
        return LucideIcons.target;
    }
  }

  Color _getCategoryColor(LeaderboardCategoryType category) {
    switch (category) {
      case LeaderboardCategoryType.streak:
        return Colors.orange;
      case LeaderboardCategoryType.grinder:
        return Colors.purpleAccent;
      case LeaderboardCategoryType.time:
        return Colors.blueAccent;
      case LeaderboardCategoryType.aiKiller:
        return Colors.pinkAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: LeaderboardCategoryType.values.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final category = LeaderboardCategoryType.values[index];
          final isSelected = category == selectedCategory;
          final color = _getCategoryColor(category);

          return GestureDetector(
            onTap: () => onCategorySelected(category),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? color.withValues(alpha: isDark ? 0.2 : 0.12)
                    : (isDark ? const Color(0xFF1E293B) : Colors.white),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected
                      ? color
                      : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                  width: isSelected ? 1.5 : 1.0,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: color.withValues(alpha: 0.25),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getCategoryIcon(category),
                    size: 18,
                    color: isSelected
                        ? color
                        : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    category.title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                      color: isSelected
                          ? (isDark ? Colors.white : color)
                          : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
