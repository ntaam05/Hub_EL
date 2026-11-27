import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';

class SearchSuggestionsList extends StatelessWidget {
  final List<String> history;
  final List<String> suggestions;
  final ValueChanged<String> onSelected;
  final double maxHeight;

  const SearchSuggestionsList({
    super.key,
    required this.history,
    required this.suggestions,
    required this.onSelected,
    this.maxHeight = 320,
  });

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty && suggestions.isEmpty) {
      return const SizedBox.shrink();
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : Colors.grey.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.symmetric(vertical: 6),
        children: [
          if (history.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 6, 14, 4),
              child: Text(
                'TÌM KIẾM GẦN ĐÂY',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.6,
                  color: isDark ? Colors.white54 : Colors.grey.shade600,
                ),
              ),
            ),
            ...history.map(
              (item) => ListTile(
                dense: true,
                visualDensity: VisualDensity.compact,
                leading: Icon(
                  LucideIcons.history,
                  size: 16,
                  color: isDark ? Colors.white54 : Colors.grey.shade600,
                ),
                title: Text(
                  item,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : AppColors.lightTextPrimary,
                  ),
                ),
                trailing: const Icon(LucideIcons.arrowUpLeft, size: 14, color: Colors.grey),
                onTap: () => onSelected(item),
              ),
            ),
          ],
          if (suggestions.isNotEmpty) ...[
            if (history.isNotEmpty) const Divider(height: 8),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 6, 14, 4),
              child: Text(
                'GỢI Ý CHO BẠN',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.6,
                  color: isDark ? Colors.white54 : Colors.grey.shade600,
                ),
              ),
            ),
            ...suggestions.map(
              (item) => ListTile(
                dense: true,
                visualDensity: VisualDensity.compact,
                leading: const Icon(
                  LucideIcons.search,
                  size: 16,
                  color: AppColors.primaryLight,
                ),
                title: Text(
                  item,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white70 : AppColors.lightTextPrimary,
                  ),
                ),
                trailing: const Icon(LucideIcons.arrowUpLeft, size: 14, color: Colors.grey),
                onTap: () => onSelected(item),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
