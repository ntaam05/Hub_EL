import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/avatar_image_helper.dart';
import '../../../authentication/presentation/bloc/auth_bloc.dart';
import '../../../authentication/presentation/bloc/auth_event.dart';
import '../cubit/profile_cubit.dart';
import '../cubit/profile_state.dart';
import '../widgets/avatar_preview_dialog.dart';
import '../widgets/edit_profile_dialog.dart';
import '../../../settings/presentation/screens/security_screen.dart';
import '../../../settings/presentation/screens/settings_hub_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    context.read<ProfileCubit>().loadProfile();
  }

  Future<void> _pickAndUploadAvatar() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (image == null) return;

      final bytes = await image.readAsBytes();
      final mimeType = image.mimeType ?? 'image/jpeg';
      final base64String = 'data:$mimeType;base64,${base64Encode(bytes)}';

      if (!mounted) return;

      final shouldUpload = await showDialog<bool>(
        context: context,
        builder: (_) => AvatarPreviewDialog(
          imageBytes: bytes,
          mimeType: mimeType,
          onConfirm: () => Navigator.of(context).pop(true),
        ),
      );

      if (shouldUpload == true && mounted) {
        final success = await context.read<ProfileCubit>().updateAvatar(base64String);
        if (success && mounted) {
          context.read<AuthBloc>().add(const AuthUserRefreshed());
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Cập nhật ảnh đại diện thành công!'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi chọn ảnh: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _openEditProfileDialog() {
    final state = context.read<ProfileCubit>().state;
    if (state.profile == null) return;

    showDialog(
      context: context,
      builder: (_) => EditProfileDialog(
        profile: state.profile!,
        onSave: (request) async {
          final ok = await context.read<ProfileCubit>().updateProfile(request);
          if (ok && mounted) {
            context.read<AuthBloc>().add(const AuthUserRefreshed());
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Cập nhật thông tin hồ sơ thành công!'),
                backgroundColor: AppColors.success,
              ),
            );
          }
          return ok;
        },
      ),
    );
  }

  Future<void> _launchSocialUrl(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) return;
    final uri = Uri.tryParse(cleanUrl.startsWith('http') ? cleanUrl : 'https://$cleanUrl');
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể mở liên kết: $url')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Hồ Sơ Cá Nhân', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.settings, size: 20),
            tooltip: 'Cài đặt tài khoản',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsHubScreen()),
              );
            },
          ),
        ],
      ),
      body: BlocConsumer<ProfileCubit, ProfileState>(
        listener: (context, state) {
          if (state.status == ProfileStatus.loaded && state.profile != null) {
            final p = state.profile!;
            try {
              context.read<AuthBloc>().add(AuthUserProfileUpdated(
                fullName: p.fullName,
                username: p.username,
                image: p.displayAvatar,
                avatar: p.displayAvatar,
              ));
            } catch (_) {}
          }
          if (state.errorMessage != null && state.status == ProfileStatus.error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state.isLoading && state.profile == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primaryLight));
          }

          if (state.profile == null && state.status == ProfileStatus.error) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.alertTriangle, size: 48, color: AppColors.error),
                  AppSpacing.gapV12,
                  Text(
                    state.errorMessage ?? 'Không thể tải hồ sơ người dùng.',
                    style: const TextStyle(color: Colors.white70),
                  ),
                  AppSpacing.gapV16,
                  ElevatedButton(
                    onPressed: () => context.read<ProfileCubit>().loadProfile(),
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          final profile = state.profile!;
          final imageProvider = safeGetImageProvider(profile.displayAvatar);

          return RefreshIndicator(
            onRefresh: () => context.read<ProfileCubit>().loadProfile(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              child: Column(
                children: [
                  // CARD 1: OVERVIEW CARD (Avatar, Name, Username, Level, Pro Badge)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // Avatar with camera edit button
                        Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: AppColors.primaryGradient,
                                border: Border.all(
                                  color: AppColors.primaryLight,
                                  width: 3,
                                ),
                                image: imageProvider != null
                                    ? DecorationImage(image: imageProvider, fit: BoxFit.cover)
                                    : null,
                              ),
                              child: imageProvider == null
                                  ? Center(
                                      child: Text(
                                        profile.initialLetter,
                                        style: const TextStyle(
                                          fontSize: 36,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                            // Online status badge
                            Positioned(
                              top: 4,
                              right: 4,
                              child: Container(
                                width: 18,
                                height: 18,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                                    width: 3,
                                  ),
                                ),
                              ),
                            ),
                            // Camera action button
                            GestureDetector(
                              onTap: state.isAvatarUploading ? null : _pickAndUploadAvatar,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                                    width: 2,
                                  ),
                                ),
                                child: state.isAvatarUploading
                                    ? const SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : const Icon(LucideIcons.camera, color: Colors.white, size: 14),
                              ),
                            ),
                          ],
                        ),
                        AppSpacing.gapV12,

                        // Name & Username
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Flexible(
                              child: Text(
                                profile.displayName,
                                style: AppTextStyles.h1.copyWith(
                                  fontSize: 20,
                                  color: isDark ? Colors.white : AppColors.lightTextPrimary,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (profile.isPro) ...[
                              AppSpacing.gapH6,
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.proBadge,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'PRO',
                                  style: AppTextStyles.microBadge.copyWith(color: AppColors.proText),
                                ),
                              ),
                            ],
                          ],
                        ),
                        Text(
                          profile.displayUsername,
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark ? Colors.white54 : AppColors.lightTextSecondary,
                          ),
                        ),
                        AppSpacing.gapV8,

                        // Level & XP bar
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(LucideIcons.award, color: Colors.amber, size: 16),
                              AppSpacing.gapH6,
                              Text(
                                'Cấp ${profile.level}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              AppSpacing.gapH12,
                              Text(
                                '${profile.xp} XP',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isDark ? Colors.white70 : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Bio
                        if (profile.hasBio) ...[
                          AppSpacing.gapV12,
                          Text(
                            profile.bio!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              fontStyle: FontStyle.italic,
                              color: isDark ? Colors.white70 : AppColors.lightTextPrimary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  AppSpacing.gapV16,

                  // CARD 2: INTERESTS
                  if (profile.interests.isNotEmpty) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(LucideIcons.sparkles, color: Color(0xFF38BDF8), size: 16),
                              AppSpacing.gapH8,
                              Text(
                                'Chủ đề quan tâm',
                                style: AppTextStyles.h3.copyWith(
                                  fontSize: 15,
                                  color: isDark ? Colors.white : AppColors.lightTextPrimary,
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.gapV12,
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: profile.interests.map((interest) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF334155) : Colors.grey.shade300,
                                  ),
                                ),
                                child: Text(
                                  interest,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: isDark ? Colors.white70 : AppColors.lightTextPrimary,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    AppSpacing.gapV16,
                  ],

                  // CARD 2.5: LIÊN KẾT NGOÀI (SOCIAL & WEB LINKS)
                  if (profile.socialLinks.isNotEmpty) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(LucideIcons.link2, color: AppColors.primaryLight, size: 16),
                              AppSpacing.gapH8,
                              Text(
                                'Liên kết ngoài (${profile.socialLinks.length})',
                                style: AppTextStyles.h3.copyWith(
                                  fontSize: 15,
                                  color: isDark ? Colors.white : AppColors.lightTextPrimary,
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.gapV12,
                          Column(
                            children: profile.socialLinks.map((link) {
                              final url = link['url']?.toString() ?? '';
                              IconData icon = LucideIcons.globe;
                              Color iconColor = AppColors.primaryLight;
                              if (url.contains('github.com')) {
                                icon = LucideIcons.code;
                                iconColor = Colors.white;
                              } else if (url.contains('facebook.com')) {
                                icon = Icons.facebook;
                                iconColor = const Color(0xFF1877F2);
                              } else if (url.contains('youtube.com') || url.contains('youtu.be')) {
                                icon = LucideIcons.video;
                                iconColor = const Color(0xFFFF0000);
                              } else if (url.contains('linkedin.com')) {
                                icon = LucideIcons.briefcase;
                                iconColor = const Color(0xFF0A66C2);
                              }

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: InkWell(
                                  onTap: () => _launchSocialUrl(url),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isDark ? const Color(0xFF334155) : Colors.grey.shade300,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(icon, size: 18, color: iconColor),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            url,
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: isDark ? Colors.cyanAccent.shade100 : Colors.blue.shade700,
                                              decoration: TextDecoration.underline,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        AppSpacing.gapH8,
                                        const Icon(LucideIcons.externalLink, size: 14, color: Colors.white38),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    AppSpacing.gapV16,
                  ],

                  // CARD 3: ACTION BUTTONS & SHORTCUTS
                  Material(
                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200,
                        ),
                      ),
                      child: Column(
                        children: [
                          _buildActionRow(
                            icon: LucideIcons.userCheck,
                            color: Colors.blueAccent,
                            title: 'Chỉnh sửa thông tin cá nhân',
                            subtitle: 'Họ tên, biệt danh, tiểu sử, sở thích',
                            onTap: _openEditProfileDialog,
                            isDark: isDark,
                          ),
                          const Divider(height: 16),
                          _buildActionRow(
                            icon: LucideIcons.shieldCheck,
                            color: const Color(0xFF10B981),
                            title: 'Bảo mật & Đổi mật khẩu',
                            subtitle: 'Quản lý mật khẩu, mã xác thực OTP',
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const SecurityScreen()),
                              );
                            },
                            isDark: isDark,
                          ),
                          const Divider(height: 16),
                          _buildActionRow(
                            icon: LucideIcons.slidersHorizontal,
                            color: Colors.purpleAccent,
                            title: 'Cài đặt ứng dụng',
                            subtitle: 'Quyền riêng tư, thông báo, góp ý',
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const SettingsHubScreen()),
                              );
                            },
                            isDark: isDark,
                          ),
                        ],
                      ),
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

  Widget _buildActionRow({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: isDark ? Colors.white : AppColors.lightTextPrimary,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          fontSize: 12,
          color: isDark ? Colors.white54 : AppColors.lightTextSecondary,
        ),
      ),
      trailing: const Icon(LucideIcons.chevronRight, size: 18, color: Colors.grey),
      onTap: onTap,
    );
  }
}
