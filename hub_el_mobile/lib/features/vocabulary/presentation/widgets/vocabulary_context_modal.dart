import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../wiki/presentation/screens/wiki_study_screen.dart';
import '../../domain/entities/vocabulary_entities.dart';
import '../cubit/vocabulary_cubit.dart';
import '../cubit/vocabulary_state.dart';

class VocabularyContextModal extends StatelessWidget {
  final VocabularyContextEntity? contextData;
  final bool isLoading;
  final String? errorMessage;
  final String targetWord;
  final VoidCallback onClose;

  const VocabularyContextModal({
    super.key,
    required this.contextData,
    required this.isLoading,
    this.errorMessage,
    required this.targetWord,
    required this.onClose,
  });

  static Future<void> show(
    BuildContext context, {
    required VocabularyCubit cubit,
    required String targetWord,
    required VoidCallback onClose,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BlocBuilder<VocabularyCubit, VocabularyState>(
        bloc: cubit,
        builder: (context, state) {
          return VocabularyContextModal(
            contextData: state.selectedContext,
            isLoading: state.isContextLoading,
            errorMessage: state.contextError,
            targetWord: targetWord,
            onClose: () {
              onClose();
              Navigator.of(ctx).pop();
            },
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 25,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Thanh kéo trên cùng
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header: Tiêu đề + Từ mục tiêu + Nút đóng
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      LucideIcons.bookOpen,
                      color: Color(0xFF6366F1),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'NGỮ CẢNH TỪ VỰNG',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 2),
                        RichText(
                          text: TextSpan(
                            text: 'Từ mục tiêu: ',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                            ),
                            children: [
                              TextSpan(
                                text: targetWord,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF6366F1),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 20),
                    onPressed: onClose,
                  ),
                ],
              ),
            ),

            Divider(height: 1, color: isDark ? AppColors.darkBorder : Colors.grey.shade200),

            // Thân nội dung
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: _buildBody(context, isDark),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, bool isDark) {
    if (isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            CircularProgressIndicator(color: Color(0xFF6366F1)),
            SizedBox(height: 16),
            Text(
              'Đang truy xuất ngữ cảnh bài học...',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    if (errorMessage != null && errorMessage!.isNotEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.alertTriangle, color: Colors.redAccent, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                errorMessage!,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.redAccent,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (contextData == null) {
      return const Center(
        child: Text('Không có dữ liệu ngữ cảnh.'),
      );
    }

    final data = contextData!;
    final text = data.simplifiedText;
    final found = data.found;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Thẻ nguồn Wiki Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.grey.shade50,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : Colors.grey.shade200,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.sparkles,
                  color: Color(0xFF6366F1),
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'THẺ BÀI WIKI NGUỒN',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                      ),
                    ),
                    Text(
                      data.cardTitle,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              if (data.rarity != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getRarityColor(data.rarity!).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _getRarityColor(data.rarity!).withValues(alpha: 0.4),
                    ),
                  ),
                  child: Text(
                    data.rarity!.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: _getRarityColor(data.rarity!),
                    ),
                  ),
                ),
            ],
          ),
        ),

        AppSpacing.gapV12,

        // Cảnh báo nếu từ không xuất hiện trực tiếp trong bài đọc
        if (!found) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(LucideIcons.info, color: Colors.amber, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Từ vựng này thuộc về một bài học cũ đã bị ghi đè hoặc không còn lưu trữ lịch sử chính xác trong bài đọc hiện tại.',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.amber,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          AppSpacing.gapV12,
        ],

        // Khối văn bản bài học có highlight
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'TRÍCH ĐOẠN BÀI ĐỌC',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                  color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                ),
              ),
              const SizedBox(height: 10),
              if (text.isEmpty)
                const Text(
                  'Không tìm thấy nội dung bài đọc của thẻ bài này.',
                  style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey),
                )
              else
                _buildHighlightedText(text, targetWord, isDark),
            ],
          ),
        ),

        AppSpacing.gapV20,

        // Nút hành động "Đến bài học"
        ElevatedButton.icon(
          onPressed: () {
            onClose();
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => WikiStudyScreen(cardId: data.cardId),
              ),
            );
          },
          icon: const Icon(LucideIcons.bookOpenCheck, size: 18),
          label: const Text(
            'ĐẾN BÀI HỌC WIKI NÀY',
            style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6366F1),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            elevation: 3,
          ),
        ),
      ],
    );
  }

  Widget _buildHighlightedText(String text, String target, bool isDark) {
    if (target.trim().isEmpty) {
      return Text(
        text,
        style: TextStyle(
          fontSize: 13,
          height: 1.6,
          color: isDark ? Colors.white70 : Colors.black87,
        ),
      );
    }

    final lowerText = text.toLowerCase();
    final lowerTarget = target.trim().toLowerCase();

    final spans = <InlineSpan>[];
    int start = 0;

    while (start < text.length) {
      final index = lowerText.indexOf(lowerTarget, start);
      if (index == -1) {
        spans.add(TextSpan(text: text.substring(start)));
        break;
      }

      if (index > start) {
        spans.add(TextSpan(text: text.substring(start, index)));
      }

      final matchedWord = text.substring(index, index + lowerTarget.length);
      spans.add(
        WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
            margin: const EdgeInsets.symmetric(horizontal: 1),
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1).withValues(alpha: isDark ? 0.35 : 0.2),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: const Color(0xFF6366F1).withValues(alpha: 0.6),
              ),
            ),
            child: Text(
              matchedWord,
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                color: Color(0xFF6366F1),
                fontSize: 13,
              ),
            ),
          ),
        ),
      );

      start = index + lowerTarget.length;
    }

    return Text.rich(
      TextSpan(
        children: spans,
        style: TextStyle(
          fontSize: 13,
          height: 1.6,
          color: isDark ? Colors.white70 : Colors.black87,
        ),
      ),
      textAlign: TextAlign.justify,
    );
  }

  Color _getRarityColor(String rarity) {
    switch (rarity.toUpperCase()) {
      case 'LEGENDARY':
        return Colors.amber;
      case 'EPIC':
        return Colors.purpleAccent;
      case 'RARE':
        return Colors.blueAccent;
      case 'COMMON':
      default:
        return Colors.grey;
    }
  }
}
