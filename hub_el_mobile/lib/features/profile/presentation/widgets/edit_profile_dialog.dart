import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/user_profile_entity.dart';

class EditProfileDialog extends StatefulWidget {
  final UserProfileEntity profile;
  final Future<bool> Function(UpdateProfileRequest request) onSave;

  const EditProfileDialog({
    super.key,
    required this.profile,
    required this.onSave,
  });

  @override
  State<EditProfileDialog> createState() => _EditProfileDialogState();
}

class _EditProfileDialogState extends State<EditProfileDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _fullNameController;
  late TextEditingController _usernameController;
  late TextEditingController _bioController;
  final TextEditingController _interestSearchController = TextEditingController();

  late List<String> _selectedInterests;
  final List<TextEditingController> _socialLinkControllers = [];

  bool _isSaving = false;
  String? _errorMessage;
  String _interestSearchQuery = '';

  /// 37 Chủ đề chuẩn từ CSDL và Web Hub-EL
  static const List<String> availableInterests = [
    'API Development',
    'Backend Development',
    'Blockchain',
    'C',
    'C++',
    'Competitive Programming',
    'CSS',
    'Data Science',
    'DevOps',
    'Docker',
    'Frontend Development',
    'Fullstack Development',
    'Git',
    'GitHub',
    'Golang',
    'HTML',
    'Java',
    'JavaScript',
    'Lập trình game',
    'Lập trình mobile',
    'Lập trình web',
    'MySQL',
    'Next.js',
    'Node.js',
    'Phát triển Android',
    'Phát triển iOS',
    'PostgreSQL',
    'Python',
    'React',
    'SQL',
    'Thiết kế đồ họa',
    'Thiết kế UI/UX',
    'Tiếng Anh',
    'Tiếng Hàn',
    'Tiếng Nhật',
    'Tiếng Trung',
    'TypeScript',
  ];

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController(
      text: widget.profile.fullName ?? widget.profile.name ?? '',
    );
    _usernameController = TextEditingController(
      text: widget.profile.username ?? '',
    );
    _bioController = TextEditingController(text: widget.profile.bio ?? '');
    _selectedInterests = List<String>.from(widget.profile.interests);

    // Nạp danh sách liên kết ngoài hiện tại (tối đa 5 liên kết)
    if (widget.profile.socialLinks.isNotEmpty) {
      for (final link in widget.profile.socialLinks) {
        final url = link['url']?.toString() ?? '';
        if (url.isNotEmpty && _socialLinkControllers.length < 5) {
          _socialLinkControllers.add(TextEditingController(text: url));
        }
      }
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _bioController.dispose();
    _interestSearchController.dispose();
    for (final c in _socialLinkControllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _toggleInterest(String interest) {
    setState(() {
      if (_selectedInterests.contains(interest)) {
        _selectedInterests.remove(interest);
      } else {
        _selectedInterests.add(interest);
      }
    });
  }

  void _addSocialLink() {
    if (_socialLinkControllers.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Chỉ được thêm tối đa 5 liên kết ngoài.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    setState(() {
      _socialLinkControllers.add(TextEditingController());
    });
  }

  void _removeSocialLink(int index) {
    setState(() {
      _socialLinkControllers[index].dispose();
      _socialLinkControllers.removeAt(index);
    });
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    final validLinks = _socialLinkControllers
        .map((c) => c.text.trim())
        .where((url) => url.isNotEmpty)
        .map((url) => {'platform': 'link', 'url': url})
        .toList();

    final request = UpdateProfileRequest(
      fullName: _fullNameController.text.trim(),
      username: _usernameController.text.trim(),
      bio: _bioController.text.trim(),
      interests: _selectedInterests,
      socialLinks: validLinks,
    );

    final success = await widget.onSave(request);

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        Navigator.of(context).pop(true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredInterests = availableInterests.where((i) {
      if (_interestSearchQuery.isEmpty) return true;
      return i.toLowerCase().contains(_interestSearchQuery.toLowerCase());
    }).toList();

    return Dialog(
      backgroundColor: const Color(0xFF0F172A),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFF1E293B)),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520, maxHeight: 720),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Chỉnh sửa thông tin',
                      style: AppTextStyles.h2.copyWith(color: Colors.white),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
                AppSpacing.gapV12,
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.error.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: AppColors.error, fontSize: 13),
                    ),
                  ),
                  AppSpacing.gapV12,
                ],
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Họ và tên
                        _buildLabel('Họ và tên'),
                        TextFormField(
                          controller: _fullNameController,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: _buildInputDecoration('Nhập họ và tên đầy đủ'),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return 'Họ và tên không được để trống.';
                            }
                            return null;
                          },
                        ),
                        AppSpacing.gapV12,

                        // Biệt danh / Username
                        _buildLabel('Biệt danh (Username)'),
                        TextFormField(
                          controller: _usernameController,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: _buildInputDecoration('Nhập username (không dấu, không cách)'),
                          validator: (val) {
                            if (val != null && val.trim().isNotEmpty) {
                              if (val.trim().contains(' ')) {
                                return 'Biệt danh không được chứa khoảng trắng.';
                              }
                            }
                            return null;
                          },
                        ),
                        AppSpacing.gapV12,

                        // Tiểu sử (Bio)
                        _buildLabel('Tiểu sử cá nhân (Bio)'),
                        TextFormField(
                          controller: _bioController,
                          maxLines: 3,
                          maxLength: 200,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: _buildInputDecoration('Giới thiệu đôi nét về bản thân bạn...'),
                        ),
                        AppSpacing.gapV8,

                        // LIÊN KẾT NGOÀI (SOCIAL LINKS)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildLabel('Liên kết ngoài (${_socialLinkControllers.length}/5)'),
                            if (_socialLinkControllers.length < 5)
                              TextButton.icon(
                                onPressed: _addSocialLink,
                                icon: const Icon(LucideIcons.plus, size: 14, color: AppColors.primaryLight),
                                label: const Text(
                                  'Thêm liên kết',
                                  style: TextStyle(
                                    color: AppColors.primaryLight,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        if (_socialLinkControllers.isEmpty)
                          const Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: Text(
                              'Chưa có liên kết ngoài nào (VD: Facebook, GitHub, Website...).',
                              style: TextStyle(color: Colors.white38, fontSize: 12, fontStyle: FontStyle.italic),
                            ),
                          )
                        else
                          ..._socialLinkControllers.asMap().entries.map((entry) {
                            final idx = entry.key;
                            final controller = entry.value;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: controller,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      decoration: _buildInputDecoration('Dán URL (VD: https://github.com/...)').copyWith(
                                        prefixIcon: const Icon(LucideIcons.link2, size: 16, color: Colors.white54),
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                      ),
                                    ),
                                  ),
                                  AppSpacing.gapH8,
                                  IconButton(
                                    icon: const Icon(LucideIcons.trash2, size: 18, color: AppColors.error),
                                    onPressed: () => _removeSocialLink(idx),
                                    tooltip: 'Xóa liên kết',
                                  ),
                                ],
                              ),
                            );
                          }),
                        AppSpacing.gapV12,

                        // SỞ THÍCH (INTERESTS) - ĐỦ 37 TỪ KHÓA
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildLabel('Chủ đề học tập & Sở thích (${_selectedInterests.length})'),
                            if (_selectedInterests.isNotEmpty)
                              TextButton(
                                onPressed: () => setState(() => _selectedInterests.clear()),
                                child: const Text(
                                  'Xóa hết',
                                  style: TextStyle(color: Colors.white38, fontSize: 11),
                                ),
                              ),
                          ],
                        ),
                        // Ô tìm kiếm nhanh sở thích
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: TextField(
                            controller: _interestSearchController,
                            onChanged: (val) => setState(() => _interestSearchQuery = val.trim()),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: _buildInputDecoration('Tìm nhanh sở thích trong 37 chủ đề...').copyWith(
                              prefixIcon: const Icon(LucideIcons.search, size: 16, color: Colors.white54),
                              suffixIcon: _interestSearchQuery.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 16, color: Colors.white54),
                                      onPressed: () {
                                        _interestSearchController.clear();
                                        setState(() => _interestSearchQuery = '');
                                      },
                                    )
                                  : null,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: filteredInterests.map((interest) {
                            final isSelected = _selectedInterests.contains(interest);
                            return FilterChip(
                              label: Text(interest),
                              selected: isSelected,
                              onSelected: (_) => _toggleInterest(interest),
                              backgroundColor: const Color(0xFF1E293B),
                              selectedColor: AppColors.primaryLight.withValues(alpha: 0.25),
                              checkmarkColor: AppColors.primaryLight,
                              labelStyle: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected ? AppColors.primaryLight : Colors.white70,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                                side: BorderSide(
                                  color: isSelected ? AppColors.primaryLight : const Color(0xFF334155),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ),
                AppSpacing.gapV16,
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
                      child: const Text('Hủy', style: TextStyle(color: Colors.white60)),
                    ),
                    AppSpacing.gapH12,
                    ElevatedButton(
                      onPressed: _isSaving ? null : _handleSave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              'Lưu thay đổi (${_selectedInterests.length})',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
      ),
    );
  }

  InputDecoration _buildInputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
      filled: true,
      fillColor: const Color(0xFF1E293B),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFF334155)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFF334155)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primaryLight, width: 1.5),
      ),
    );
  }
}
