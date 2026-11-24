import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/user_inventory_entity.dart';
import '../../domain/entities/wiki_quiz_attempt_entity.dart';
import 'review_history_sheet.dart';
import 'wiki_card_widget.dart';

class WikiManagerCardItem extends StatelessWidget {
  final UserInventoryEntity item;
  final ValueChanged<WikiQuizAttemptEntity>? onAttemptTap;
  final VoidCallback? onStudyTap;
  final VoidCallback? onGachaTap;

  const WikiManagerCardItem({
    super.key,
    required this.item,
    this.onAttemptTap,
    this.onStudyTap,
    this.onGachaTap,
  });

  Future<void> _launchWikiUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final card = item.card;
    final history = card.attempts;
    final isOwned = item.isOwned;
    final acquiredDateStr = item.acquiredAt != null
        ? DateFormat('dd/MM/yyyy').format(item.acquiredAt!)
        : null;

    final cardBg = isDark ? const Color(0xFF111827) : Colors.white;
    final borderColor = isDark ? const Color(0xFF1F2937) : const Color(0xFFE2E8F0);
    final isStudied = isOwned && card.isStudied;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Phần trên: Thumbnail thẻ 3D
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20),
            color: isDark ? const Color(0xFF0B1120).withValues(alpha: 0.5) : const Color(0xFFF8FAFC),
            child: Center(
              child: WikiCardWidget(
                card: card,
                awakenedStars: item.currentStar > 0 ? item.currentStar : card.awakenedStars,
                isOwned: isOwned,
                scale: 0.52,
                onTap: isOwned ? onStudyTap : onGachaTap,
              ),
            ),
          ),

          // Phần dưới: Thông tin, Trạng thái, Nút học, Lịch sử thi
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title + Chi tiết button
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        card.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    InkWell(
                      onTap: () => _launchWikiUrl(card.effectiveWikiUrl),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E3A8A).withValues(alpha: 0.3)
                              : const Color(0xFFDBEAFE),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'CHI TIẾT',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF1D4ED8),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 4),

                // Sở hữu lúc / Chưa sở hữu
                Text(
                  isOwned
                      ? 'Sở hữu lúc: $acquiredDateStr'
                      : 'Chưa có trong bộ sưu tập',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  ),
                ),

                const SizedBox(height: 12),

                // Trạng thái bài học
                if (!isOwned)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.lock, size: 12, color: Colors.grey),
                        SizedBox(width: 6),
                        Text(
                          'Chưa sở hữu',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  )
                else if (isStudied)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF14532D).withValues(alpha: 0.3)
                          : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? const Color(0xFF166534) : const Color(0xFFBBF7D0),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.checkCircle2, size: 14, color: Color(0xFF16A34A)),
                        SizedBox(width: 6),
                        Text(
                          'Bài học đã sẵn sàng',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF15803D),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.circle, size: 12, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text(
                          'Chưa học lần nào',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 16),

                // Nút HỌC NGAY / QUAY THẺ MỞ KHÓA
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isOwned
                          ? (isDark ? const Color(0xFFE2E8F0) : const Color(0xFF0F172A))
                          : (isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                      foregroundColor: isOwned
                          ? (isDark ? const Color(0xFF0F172A) : Colors.white)
                          : (isDark ? Colors.white60 : Colors.black54),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: isOwned ? 2 : 0,
                    ),
                    onPressed: isOwned
                        ? (onStudyTap ??
                            () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Chức năng Học Thẻ "${card.title}" sẽ triển khai ở Bước 5B!'),
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            })
                        : (onGachaTap ??
                            () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Hãy vào mục Gacha để rút thẻ bài này nhé!'),
                                  duration: Duration(seconds: 2),
                                ),
                              );
                            }),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(isOwned ? LucideIcons.play : LucideIcons.lock, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          isOwned ? 'HỌC NGAY' : 'CHƯA SỞ HỮU',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Lịch sử thi gần đây
                Divider(color: borderColor, height: 1),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Icon(
                      LucideIcons.history,
                      size: 14,
                      color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'LỊCH SỬ THI GẦN ĐÂY',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.8,
                        color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                if (isOwned && history.isNotEmpty)
                  SizedBox(
                    height: 58,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: history.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 8),
                      itemBuilder: (context, idx) {
                        final att = history[idx];
                        final isPass = att.isPass;
                        final attDateStr = DateFormat('dd/MM').format(att.createdAt);

                        return InkWell(
                          onTap: () {
                            if (onAttemptTap != null) {
                              onAttemptTap!(att);
                            } else {
                              ReviewHistorySheet.show(context, att);
                            }
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            width: 78,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: isPass
                                  ? (isDark
                                      ? const Color(0xFF14532D).withValues(alpha: 0.15)
                                      : const Color(0xFFF0FDF4))
                                  : (isDark
                                      ? const Color(0xFF7F1D1D).withValues(alpha: 0.15)
                                      : const Color(0xFFFEF2F2)),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isPass
                                    ? (isDark
                                        ? const Color(0xFF166534).withValues(alpha: 0.5)
                                        : const Color(0xFFBBF7D0))
                                    : (isDark
                                        ? const Color(0xFF991B1B).withValues(alpha: 0.5)
                                        : const Color(0xFFFECACA)),
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  '${att.correctCount}/${att.totalQuizzes}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    color: isPass ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  attDateStr,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  )
                else
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 4),
                    child: Text(
                      'Chưa có lịch sử làm bài.',
                      style: TextStyle(
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
