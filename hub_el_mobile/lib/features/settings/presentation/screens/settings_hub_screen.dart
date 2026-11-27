import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/theme_cubit.dart';
import 'feedback_screen.dart';
import 'notification_settings_screen.dart';
import 'privacy_settings_screen.dart';
import 'security_screen.dart';

class SettingsHubScreen extends StatefulWidget {
  const SettingsHubScreen({super.key});

  @override
  State<SettingsHubScreen> createState() => _SettingsHubScreenState();
}

class _SettingsHubScreenState extends State<SettingsHubScreen> {
  bool _isThemeDropdownOpen = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    ThemeMode currentThemeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    try {
      currentThemeMode = context.watch<ThemeCubit>().state;
    } catch (_) {}

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Cài Đặt', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('Tài khoản & Bảo mật'),
            _buildCardContainer(
              isDark,
              children: [
                _buildMenuItem(
                  icon: LucideIcons.shieldCheck,
                  color: const Color(0xFF10B981),
                  title: 'Bảo mật & Đổi mật khẩu',
                  subtitle: 'Đổi mật khẩu, đặt lại qua mã OTP Email',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SecurityScreen()),
                    );
                  },
                  isDark: isDark,
                ),
                const Divider(height: 1),
                _buildMenuItem(
                  icon: LucideIcons.lock,
                  color: Colors.cyanAccent,
                  title: 'Quyền riêng tư',
                  subtitle: 'Trạng thái Online, phạm vi xem hồ sơ, kho đồ',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const PrivacySettingsScreen()),
                    );
                  },
                  isDark: isDark,
                ),
              ],
            ),
            AppSpacing.gapV20,

            _buildSectionHeader('Tùy chọn ứng dụng'),
            _buildCardContainer(
              isDark,
              children: [
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.indigoAccent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.palette, color: Colors.indigoAccent, size: 20),
                  ),
                  title: const Text('Giao diện', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: Text(
                    currentThemeMode == ThemeMode.light ? 'Chế độ Sáng (Light)' : 'Chế độ Tối (Dark)',
                    style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : AppColors.lightTextSecondary),
                  ),
                  trailing: Icon(
                    _isThemeDropdownOpen ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 18,
                    color: Colors.grey,
                  ),
                  onTap: () => setState(() => _isThemeDropdownOpen = !_isThemeDropdownOpen),
                ),
                if (_isThemeDropdownOpen)
                  Container(
                    margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B).withValues(alpha: 0.6) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark ? const Color(0xFF334155) : Colors.grey.shade200,
                      ),
                    ),
                    child: Column(
                      children: [
                        _buildThemeOptionRow(
                          context: context,
                          isDark: isDark,
                          icon: LucideIcons.sun,
                          iconColor: Colors.amber,
                          label: 'Light (Sáng)',
                          isSelected: currentThemeMode == ThemeMode.light,
                          onTap: () {
                            try {
                              context.read<ThemeCubit>().setThemeMode(ThemeMode.light);
                            } catch (_) {}
                          },
                        ),
                        const Divider(height: 1),
                        _buildThemeOptionRow(
                          context: context,
                          isDark: isDark,
                          icon: LucideIcons.moon,
                          iconColor: Colors.indigoAccent,
                          label: 'Dark (Tối)',
                          isSelected: currentThemeMode == ThemeMode.dark,
                          onTap: () {
                            try {
                              context.read<ThemeCubit>().setThemeMode(ThemeMode.dark);
                            } catch (_) {}
                          },
                        ),
                      ],
                    ),
                  ),
                const Divider(height: 1),
                _buildMenuItem(
                  icon: LucideIcons.bell,
                  color: Colors.amberAccent,
                  title: 'Cài đặt thông báo Email',
                  subtitle: 'Chuỗi học tập, năng lượng AI, lời mời kết bạn',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
                    );
                  },
                  isDark: isDark,
                ),
                const Divider(height: 1),
                _buildMenuItem(
                  icon: LucideIcons.messageSquare,
                  color: Colors.purpleAccent,
                  title: 'Góp ý & Báo lỗi',
                  subtitle: 'Đóng góp ý kiến để hoàn thiện Hub-EL',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const FeedbackScreen()),
                    );
                  },
                  isDark: isDark,
                ),
              ],
            ),
            AppSpacing.gapV24,

            // App version card
            Center(
              child: Column(
                children: [
                  Text(
                    'Hub-EL Native Mobile App',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white60 : AppColors.lightTextSecondary,
                    ),
                  ),
                  AppSpacing.gapV4,
                  Text(
                    'Phiên bản 1.0.0 (Phase 6 Final)',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white38 : Colors.grey,
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

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(title, style: AppTextStyles.h3.copyWith(fontSize: 15, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildCardContainer(bool isDark, {required List<Widget> children}) {
    return Material(
      color: isDark ? const Color(0xFF0F172A) : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200),
        ),
        child: Column(children: children),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : AppColors.lightTextSecondary),
      ),
      trailing: const Icon(LucideIcons.chevronRight, size: 18, color: Colors.grey),
      onTap: onTap,
    );
  }

  Widget _buildThemeOptionRow({
    required BuildContext context,
    required bool isDark,
    required IconData icon,
    required Color iconColor,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Icon(icon, size: 18, color: iconColor),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isDark ? Colors.white : AppColors.lightTextPrimary,
                ),
              ),
            ),
            Checkbox(
              value: isSelected,
              onChanged: (_) => onTap(),
              activeColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
          ],
        ),
      ),
    );
  }
}
