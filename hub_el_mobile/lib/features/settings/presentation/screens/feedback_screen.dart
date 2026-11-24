import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../cubit/settings_cubit.dart';
import '../cubit/settings_state.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  String _selectedCategory = 'Góp ý tính năng';

  static const List<String> categories = [
    'Góp ý tính năng',
    'Báo lỗi hệ thống',
    'Yêu cầu hỗ trợ',
    'Khác',
  ];

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final cubit = context.read<SettingsCubit>();
    final ok = await cubit.submitFeedback(
      _contentController.text.trim(),
      category: _selectedCategory,
    );

    if (ok && mounted) {
      _contentController.clear();
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFF1E293B)),
          ),
          title: const Row(
            children: [
              Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 24),
              AppSpacing.gapH8,
              Text('Gửi thành công!', style: TextStyle(color: Colors.white, fontSize: 18)),
            ],
          ),
          content: const Text(
            'Cảm ơn bạn đã gửi ý kiến đóng góp! Đội ngũ phát triển Hub-EL sẽ xem xét và phản hồi sớm nhất.',
            style: TextStyle(color: Colors.white70, fontSize: 14),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryLight),
              child: const Text('Xong', style: TextStyle(color: Colors.white)),
            ),
          ],
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
        title: const Text('Góp Ý & Báo Lỗi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        elevation: 0,
      ),
      body: BlocConsumer<SettingsCubit, SettingsState>(
        listener: (context, state) {
          if (state.errorMessage != null && state.feedbackStatus == SettingsActionStatus.error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage!), backgroundColor: AppColors.error),
            );
          }
        },
        builder: (context, state) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.messageSquare, color: Color(0xFF38BDF8), size: 24),
                        AppSpacing.gapH12,
                        Expanded(
                          child: Text(
                            'Mọi ý kiến của bạn đều giúp Hub-EL hoàn thiện hơn mỗi ngày. Xin hãy chia sẻ chi tiết vấn đề bạn gặp phải.',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? Colors.white70 : AppColors.lightTextPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  AppSpacing.gapV20,

                  // Phân loại
                  const Text('Chủ đề góp ý:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  AppSpacing.gapV8,
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: categories.map((cat) {
                      final isSelected = _selectedCategory == cat;
                      return ChoiceChip(
                        label: Text(cat),
                        selected: isSelected,
                        onSelected: (val) {
                          if (val) setState(() => _selectedCategory = cat);
                        },
                        selectedColor: AppColors.primaryLight.withValues(alpha: 0.25),
                        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                        labelStyle: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? AppColors.primaryLight : (isDark ? Colors.white70 : AppColors.lightTextPrimary),
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
                  AppSpacing.gapV20,

                  // Nội dung
                  const Text('Nội dung góp ý / Báo lỗi:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  AppSpacing.gapV8,
                  TextFormField(
                    controller: _contentController,
                    maxLines: 6,
                    maxLength: 2000,
                    style: TextStyle(color: isDark ? Colors.white : AppColors.lightTextPrimary, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Nhập nội dung chi tiết phản hồi của bạn...',
                      hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : Colors.grey.shade50,
                      contentPadding: const EdgeInsets.all(14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.primaryLight, width: 1.5),
                      ),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return 'Vui lòng nhập nội dung góp ý.';
                      }
                      if (val.trim().length > 2000) {
                        return 'Nội dung không được vượt quá 2000 ký tự.';
                      }
                      return null;
                    },
                  ),
                  AppSpacing.gapV24,

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: state.feedbackStatus == SettingsActionStatus.loading ? null : _handleSubmit,
                      icon: state.feedbackStatus == SettingsActionStatus.loading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(LucideIcons.send, size: 16),
                      label: const Text('Gửi Phản Hồi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
}
