import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/settings_entities.dart';
import '../cubit/settings_cubit.dart';
import '../cubit/settings_state.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  late NotificationSettingsEntity _localSettings;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    context.read<SettingsCubit>().loadNotificationSettings();
  }

  Future<void> _handleSave() async {
    final ok = await context.read<SettingsCubit>().updateNotificationSettings(_localSettings);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã lưu cài đặt thông báo!'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Cài Đặt Thông Báo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.check, size: 22, color: AppColors.primaryLight),
            tooltip: 'Lưu cài đặt',
            onPressed: _handleSave,
          ),
        ],
      ),
      body: BlocConsumer<SettingsCubit, SettingsState>(
        listener: (context, state) {
          if (state.errorMessage != null && state.notificationStatus == SettingsActionStatus.error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage!), backgroundColor: AppColors.error),
            );
          }
        },
        builder: (context, state) {
          if (state.notificationStatus == SettingsActionStatus.loading && state.notificationSettings == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryLight));
          }

          if (!_isInitialized && state.notificationSettings != null) {
            _localSettings = state.notificationSettings!;
            _isInitialized = true;
          }

          if (!_isInitialized) {
            _localSettings = const NotificationSettingsEntity();
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Master Toggle
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _localSettings.allowEmail
                        ? const Color(0xFF0284C7).withValues(alpha: 0.15)
                        : (isDark ? const Color(0xFF0F172A) : Colors.white),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _localSettings.allowEmail
                          ? const Color(0xFF0284C7)
                          : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade200),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.mail, color: Color(0xFF0284C7), size: 28),
                      AppSpacing.gapH12,
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Nhận thông báo qua Email',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            AppSpacing.gapV4,
                            Text(
                              'Bật để nhận cập nhật quan trọng từ Hub-EL',
                              style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : AppColors.lightTextSecondary),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: _localSettings.allowEmail,
                        activeThumbColor: const Color(0xFF0284C7),
                        onChanged: (val) {
                          setState(() => _localSettings = _localSettings.copyWith(allowEmail: val));
                        },
                      ),
                    ],
                  ),
                ),
                AppSpacing.gapV20,

                if (_localSettings.allowEmail) ...[
                  _buildSectionHeader('Loại thông báo chi tiết'),
                  _buildCardContainer(
                    isDark,
                    children: [
                      _buildSwitchTile(
                        icon: LucideIcons.zap,
                        color: Colors.amber,
                        title: 'Năng lượng AI đã nạp đầy',
                        subtitle: 'Nhận email khi bình năng lượng AI hồi phục 100%',
                        value: _localSettings.energy,
                        onChanged: (val) {
                          setState(() => _localSettings = _localSettings.copyWith(energy: val));
                        },
                        isDark: isDark,
                      ),
                      const Divider(height: 1),
                      _buildSwitchTile(
                        icon: LucideIcons.flame,
                        color: Colors.orange,
                        title: 'Cảnh báo sắp mất chuỗi học tập',
                        subtitle: 'Nhắc nhở học tập để giữ ngọn lửa streak không bị tắt 🔥',
                        value: _localSettings.streak,
                        onChanged: (val) {
                          setState(() => _localSettings = _localSettings.copyWith(streak: val));
                        },
                        isDark: isDark,
                      ),
                      const Divider(height: 1),
                      _buildSwitchTile(
                        icon: LucideIcons.userPlus,
                        color: Colors.blueAccent,
                        title: 'Lời mời kết bạn mới',
                        subtitle: 'Thông báo khi có bạn học gửi yêu cầu kết nối',
                        value: _localSettings.friendReq,
                        onChanged: (val) {
                          setState(() => _localSettings = _localSettings.copyWith(friendReq: val));
                        },
                        isDark: isDark,
                      ),
                      const Divider(height: 1),
                      _buildSwitchTile(
                        icon: LucideIcons.share2,
                        color: Colors.purpleAccent,
                        title: 'Chia sẻ bài học Wiki',
                        subtitle: 'Thông báo khi bạn bè chia sẻ thẻ tri thức hoặc bài quiz',
                        value: _localSettings.wikiShare,
                        onChanged: (val) {
                          setState(() => _localSettings = _localSettings.copyWith(wikiShare: val));
                        },
                        isDark: isDark,
                      ),
                      const Divider(height: 1),
                      _buildSwitchTile(
                        icon: LucideIcons.bellRing,
                        color: const Color(0xFF10B981),
                        title: 'Nhắc nhở học tập hàng ngày',
                        subtitle: 'Gợi ý ôn luyện từ vựng và xem video theo lịch',
                        value: _localSettings.dailyReminder,
                        onChanged: (val) {
                          setState(() => _localSettings = _localSettings.copyWith(dailyReminder: val));
                        },
                        isDark: isDark,
                      ),
                      const Divider(height: 1),
                      _buildSwitchTile(
                        icon: LucideIcons.megaphone,
                        color: Colors.pinkAccent,
                        title: 'Thông báo sự kiện từ hệ thống',
                        subtitle: 'Cập nhật tính năng mới, sự kiện gacha và ưu đãi VIP',
                        value: _localSettings.systemAnnouncements,
                        onChanged: (val) {
                          setState(() => _localSettings = _localSettings.copyWith(systemAnnouncements: val));
                        },
                        isDark: isDark,
                      ),
                    ],
                  ),
                ],
                AppSpacing.gapV24,

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: state.notificationStatus == SettingsActionStatus.loading ? null : _handleSave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryLight,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: state.notificationStatus == SettingsActionStatus.loading
                        ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                        : const Text('Lưu Cài Đặt Thông Báo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ),
              ],
            ),
          );
        },
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

  Widget _buildSwitchTile({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    required bool isDark,
  }) {
    return SwitchListTile(
      value: value,
      onChanged: onChanged,
      activeThumbColor: AppColors.primaryLight,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      secondary: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : AppColors.lightTextSecondary),
      ),
    );
  }
}
