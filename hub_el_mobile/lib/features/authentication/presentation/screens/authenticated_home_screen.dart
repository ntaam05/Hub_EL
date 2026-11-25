import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/custom_app_bar.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../../../../shared/widgets/custom_card.dart';
import '../../../../shared/widgets/resource_pill.dart';
import '../../domain/entities/user_entity.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';

class AuthenticatedHomeScreen extends StatelessWidget {
  final UserEntity user;

  const AuthenticatedHomeScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: CustomAppBar(
        titleWidget: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: AppRadius.borderMd,
              ),
              child: const Icon(
                LucideIcons.graduationCap,
                color: Colors.white,
                size: 18,
              ),
            ),
            AppSpacing.gapH8,
            ShaderMask(
              shaderCallback: (bounds) => AppColors.primaryGradient.createShader(bounds),
              child: Text(
                'Hub-EL',
                style: AppTextStyles.h1.copyWith(color: Colors.white),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, size: 20),
            tooltip: 'Đăng xuất',
            onPressed: () {
              context.read<AuthBloc>().add(const AuthLogoutRequested());
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: AppSpacing.paddingLg,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // RESOURCE PILLS HEADER
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ResourcePill(
                    type: ResourcePillType.streak,
                    value: '${user.currentStreak} Ngày',
                    isActive: user.isStudiedToday,
                  ),
                  AppSpacing.gapH8,
                  ResourcePill(
                    type: ResourcePillType.energy,
                    value: '${user.aiTokens}⚡',
                  ),
                  AppSpacing.gapH8,
                  ResourcePill(
                    type: ResourcePillType.coin,
                    value: '${user.freeCoins}',
                  ),
                  AppSpacing.gapH8,
                  ResourcePill(
                    type: ResourcePillType.gem,
                    value: '${user.premiumCoins}',
                  ),
                  if (user.isPro) ...[
                    AppSpacing.gapH8,
                    const ResourcePill(
                      type: ResourcePillType.pro,
                      value: 'PRO',
                    ),
                  ],
                ],
              ),
            ),
            AppSpacing.gapV24,

            // USER PROFILE CARD
            CustomCard(
              isHighlighted: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.primaryGradient,
                          image: user.displayAvatar != null
                              ? DecorationImage(
                                  image: NetworkImage(user.displayAvatar!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: user.displayAvatar == null
                            ? Center(
                                child: Text(
                                  user.displayName.isNotEmpty
                                      ? user.displayName.substring(0, 1).toUpperCase()
                                      : 'U',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              )
                            : null,
                      ),
                      AppSpacing.gapH16,
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    user.displayName,
                                    style: AppTextStyles.h2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (user.isPro) ...[
                                  AppSpacing.gapH8,
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.proBadge,
                                      borderRadius: AppRadius.borderSm,
                                    ),
                                    child: Text(
                                      'PRO',
                                      style: AppTextStyles.microBadge.copyWith(color: AppColors.proText),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            AppSpacing.gapV4,
                            Text(
                              user.email,
                              style: AppTextStyles.caption.copyWith(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                            AppSpacing.gapV4,
                            Text(
                              'Cấp độ ${user.level} • ${user.xp} XP • Vai trò: ${user.role.toUpperCase()}',
                              style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  AppSpacing.gapV16,
                  const Divider(),
                  AppSpacing.gapV8,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatColumn('Xu Gacha', '${user.freeCoins}', LucideIcons.coins),
                      _buildStatColumn('Năng lượng AI', '${user.aiTokens}⚡', LucideIcons.zap),
                      _buildStatColumn('Bụi Sao', '${user.stardust}', LucideIcons.sparkles),
                    ],
                  ),
                ],
              ),
            ),
            AppSpacing.gapV24,

            // AUTH STATUS DETAILS
            CustomCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 20),
                      AppSpacing.gapH8,
                      Text('Xác thực bảo mật thành công', style: AppTextStyles.h3),
                    ],
                  ),
                  AppSpacing.gapV12,
                  Text(
                    'Bạn đang sử dụng phiên đăng nhập an toàn có mã hóa Hardware KeyStore/Keychain (FlutterSecureStorage) và Bearer JWT Token liên kết trực tiếp với Database SQL Server Backend.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  AppSpacing.gapV20,
                  CustomButton(
                    text: 'ĐĂNG XUẤT KHỎI THIẾT BỊ',
                    variant: ButtonVariant.destructive,
                    icon: const Icon(LucideIcons.logOut, size: 16),
                    onPressed: () {
                      context.read<AuthBloc>().add(const AuthLogoutRequested());
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatColumn(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        AppSpacing.gapV4,
        Text(value, style: AppTextStyles.labelLarge.copyWith(fontWeight: FontWeight.bold)),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }
}

