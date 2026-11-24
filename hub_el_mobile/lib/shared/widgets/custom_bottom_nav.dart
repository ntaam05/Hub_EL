import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';

class CustomBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTabSelected;

  const CustomBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTabSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final navBg = isDark ? AppColors.darkSurface : Colors.white;
    final borderColor = isDark ? AppColors.darkBorder : Colors.grey.shade200;

    return Container(
      color: navBg,
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 76,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomCenter,
            children: [
              // Nền thanh Bottom Nav
              Container(
                height: 64,
                decoration: BoxDecoration(
                  color: navBg,
                  border: Border(top: BorderSide(color: borderColor, width: 1)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
                      blurRadius: 15,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    // Tab 0: Tổng quan
                    _buildNavItem(
                      index: 0,
                      icon: LucideIcons.home,
                      label: 'Tổng quan',
                      isDark: isDark,
                    ),

                    // Tab 1: Góc luyện tập
                    _buildNavItem(
                      index: 1,
                      icon: LucideIcons.target,
                      label: 'Luyện tập',
                      isDark: isDark,
                    ),

                    // Khoảng trống cho FAB nổi ở giữa
                    const SizedBox(width: 72),

                    // Tab 3: Cộng đồng
                    _buildNavItem(
                      index: 3,
                      icon: LucideIcons.users,
                      label: 'Cộng đồng',
                      isDark: isDark,
                    ),

                    // Tab 4: Xếp hạng
                    _buildNavItem(
                      index: 4,
                      icon: LucideIcons.trophy,
                      label: 'Xếp hạng',
                      isDark: isDark,
                    ),
                  ],
                ),
              ),

              // NÚT TRỌNG TÂM NỔI BẬT (ELEVATED FAB) - TAB 2: KHÓA HỌC
              Positioned(
                top: 0,
                child: GestureDetector(
                  onTap: () => onTabSelected(2),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: currentIndex == 2
                              ? AppColors.primaryGradient
                              : const LinearGradient(
                                  colors: [Color(0xFF3B82F6), Color(0xFFA855F7)],
                                ),
                          border: Border.all(
                            color: navBg,
                            width: 4,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF3B82F6).withValues(alpha: 0.45),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            LucideIcons.book,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Khóa học',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.2,
                          color: currentIndex == 2
                              ? AppColors.primaryLight
                              : (isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required String label,
    required bool isDark,
  }) {
    final isActive = currentIndex == index;
    final activeColor = AppColors.primaryLight;
    final inactiveColor = isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted;

    return Expanded(
      child: InkWell(
        onTap: () => onTabSelected(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: isActive ? activeColor : inactiveColor,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                color: isActive ? activeColor : inactiveColor,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
