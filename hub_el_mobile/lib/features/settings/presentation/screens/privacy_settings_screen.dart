import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/lucian_widgets.dart';
import '../../domain/entities/settings_entities.dart';
import '../cubit/settings_cubit.dart';
import '../cubit/settings_state.dart';

class PrivacySettingsScreen extends StatefulWidget {
  const PrivacySettingsScreen({super.key});

  @override
  State<PrivacySettingsScreen> createState() => _PrivacySettingsScreenState();
}

class _PrivacySettingsScreenState extends State<PrivacySettingsScreen> {
  late PrivacySettingsEntity _localSettings;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    context.read<SettingsCubit>().loadPrivacySettings();
  }

  Future<void> _handleSave() async {
    final ok = await context.read<SettingsCubit>().updatePrivacySettings(_localSettings);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã lưu cài đặt quyền riêng tư!'),
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
        title: const Text('Quyền Riêng Tư', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
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
          if (state.errorMessage != null && state.privacyStatus == SettingsActionStatus.error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage!), backgroundColor: AppColors.error),
            );
          }
        },
        builder: (context, state) {
          if (state.privacyStatus == SettingsActionStatus.loading && state.privacySettings == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryLight));
          }

          if (!_isInitialized && state.privacySettings != null) {
            _localSettings = state.privacySettings!;
            _isInitialized = true;
          }

          if (!_isInitialized) {
            _localSettings = const PrivacySettingsEntity();
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader('Trạng thái hoạt động'),
                _buildCardContainer(
                  isDark,
                  children: [
                    _buildSwitchTile(
                      title: 'Hiển thị trạng thái Online',
                      subtitle: 'Cho phép người khác thấy dấu chấm xanh khi bạn hoạt động',
                      value: _localSettings.showOnline,
                      onChanged: (val) {
                        setState(() => _localSettings = _localSettings.copyWith(showOnline: val));
                      },
                      isDark: isDark,
                    ),
                    if (_localSettings.showOnline) ...[
                      const Divider(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Phạm vi hiển thị Online:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            AppSpacing.gapV8,
                            Row(
                              children: [
                                ChoiceChip(
                                  label: const Text('Mọi người'),
                                  selected: _localSettings.onlineScope == 'everyone',
                                  selectedColor: AppColors.primaryLight.withValues(alpha: 0.25),
                                  onSelected: (val) {
                                    if (val) setState(() => _localSettings = _localSettings.copyWith(onlineScope: 'everyone'));
                                  },
                                ),
                                const SizedBox(width: 10),
                                ChoiceChip(
                                  label: const Text('Chỉ bạn bè'),
                                  selected: _localSettings.onlineScope == 'friends',
                                  selectedColor: AppColors.primaryLight.withValues(alpha: 0.25),
                                  onSelected: (val) {
                                    if (val) setState(() => _localSettings = _localSettings.copyWith(onlineScope: 'friends'));
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                AppSpacing.gapV20,

                _buildSectionHeader('Tương tác xã hội & Hồ sơ'),
                _buildCardContainer(
                  isDark,
                  children: [
                    _buildSwitchTile(
                      title: 'Cho phép nhận lời mời kết bạn',
                      subtitle: 'Người dùng khác có thể gửi yêu cầu kết bạn cho bạn',
                      value: _localSettings.allowFriendRequests,
                      onChanged: (val) {
                        setState(() => _localSettings = _localSettings.copyWith(allowFriendRequests: val));
                      },
                      isDark: isDark,
                    ),
                    const Divider(height: 1),
                    _buildSwitchTile(
                      title: 'Hồ sơ công khai',
                      subtitle: 'Hiển thị thông tin hồ sơ cho người dùng khác',
                      value: _localSettings.publicProfile,
                      onChanged: (val) {
                        setState(() => _localSettings = _localSettings.copyWith(publicProfile: val));
                      },
                      isDark: isDark,
                    ),
                    const Divider(height: 1),
                    _buildSwitchTile(
                      title: 'Hiển thị kho đồ & Thẻ bài',
                      subtitle: 'Cho phép bạn bè xem danh sách thẻ tri thức đã sở hữu',
                      value: _localSettings.showInventory,
                      onChanged: (val) {
                        setState(() => _localSettings = _localSettings.copyWith(showInventory: val));
                      },
                      isDark: isDark,
                    ),
                    const Divider(height: 1),
                    _buildSwitchTile(
                      title: 'Hiển thị thứ hạng trên Bảng xếp hạng',
                      subtitle: 'Công khai vị trí xếp hạng của bạn với cộng đồng',
                      value: _localSettings.showRank,
                      onChanged: (val) {
                        setState(() => _localSettings = _localSettings.copyWith(showRank: val));
                      },
                      isDark: isDark,
                    ),
                  ],
                ),
                AppSpacing.gapV24,

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: state.privacyStatus == SettingsActionStatus.loading ? null : _handleSave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryLight,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: state.privacyStatus == SettingsActionStatus.loading
                        ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                        : const Text('Lưu Quyền Riêng Tư', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
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
      child: Text(
        title,
        style: AppTextStyles.h3.copyWith(fontSize: 15, fontWeight: FontWeight.bold),
      ),
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
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    required bool isDark,
  }) {
    return ListTile(
      onTap: () => onChanged(!value),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : AppColors.lightTextSecondary),
      ),
      trailing: LucianToggleSwitch(
        value: value,
        onChanged: onChanged,
      ),
    );
  }
}
