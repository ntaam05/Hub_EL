import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class GachaInfoModal extends StatelessWidget {
  const GachaInfoModal({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const GachaInfoModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: Colors.white24, width: 1.5),
        ),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(LucideIcons.sparkles, color: Color(0xFF38BDF8), size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'CHI TIẾT CẦU NGUYỆN',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(LucideIcons.x, color: Colors.white70),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Colors.white12),

          // Scrollable Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Cơ chế bảo hiểm
                  Row(
                    children: [
                      const Icon(LucideIcons.shieldCheck, color: Color(0xFFEAB308), size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'CƠ CHẾ BẢO HIỂM (PITY)',
                        style: TextStyle(
                          color: const Color(0xFFEAB308),
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 2.2,
                    children: [
                      _buildPityCard('Tiêu tốn', '100 Xu', Colors.white),
                      _buildPityCard('Bảo hiểm SR', '10 Lần', const Color(0xFFA855F7)),
                      _buildPityCard('Bảo hiểm SSR', '50 Lần', const Color(0xFFEAB308)),
                      _buildPityCard('Bảo hiểm UR', '120 Lần', const Color(0xFFEF4444)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '* Reset bộ đếm Pity ngay khi nhận được thẻ cùng cấp hoặc cao hơn.',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 2. Quy tắc trùng lặp & Bụi sao
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B).withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(LucideIcons.repeat, color: Color(0xFF34D399), size: 18),
                            const SizedBox(width: 8),
                            const Text(
                              'QUY TẮC TRÙNG LẶP & BỤI SAO',
                              style: TextStyle(
                                color: Color(0xFF34D399),
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Triệu hồi thẻ đã sở hữu sẽ tự động quy đổi thành Bụi Sao (N: 1, R: 5, SR: 20, SSR: 100, UR: 500, LR: 1000, MR: 5000).\nTài khoản PRO nhận thêm +20% Bụi sao.',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // 3. Bảng xác suất
                  Row(
                    children: [
                      const Icon(LucideIcons.info, color: Color(0xFF38BDF8), size: 18),
                      const SizedBox(width: 8),
                      const Text(
                        'XÁC SUẤT TRIỆU HỒI',
                        style: TextStyle(
                          color: Color(0xFF38BDF8),
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.white12),
                        color: const Color(0xFF1E293B).withValues(alpha: 0.5),
                      ),
                      child: Table(
                        columnWidths: const {
                          0: FlexColumnWidth(1.2),
                          1: FlexColumnWidth(1.2),
                          2: FlexColumnWidth(1.6),
                        },
                        children: [
                          _buildTableRow('ĐỘ HIẾM', 'TỈ LỆ', 'PHÂN LOẠI', isHeader: true),
                          _buildTableRow('MR', '0.05%', 'Cực kỳ dài', color: const Color(0xFFEC4899)),
                          _buildTableRow('LR', '0.15%', 'Siêu dài', color: const Color(0xFF2DD4BF)),
                          _buildTableRow('UR', '0.80%', 'Rất dài', color: const Color(0xFFEF4444)),
                          _buildTableRow('SSR', '4.00%', 'Dài', color: const Color(0xFFEAB308)),
                          _buildTableRow('SR', '15.0%', 'Khá dài', color: const Color(0xFFA855F7)),
                          _buildTableRow('R', '30.0%', 'Trung bình', color: const Color(0xFF3B82F6)),
                          _buildTableRow('N', '50.0%', 'Cơ bản', color: const Color(0xFF94A3B8)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPityCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  TableRow _buildTableRow(
    String col1,
    String col2,
    String col3, {
    bool isHeader = false,
    Color? color,
  }) {
    return TableRow(
      decoration: BoxDecoration(
        color: isHeader ? Colors.white.withValues(alpha: 0.05) : Colors.transparent,
      ),
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Text(
            col1,
            style: TextStyle(
              color: isHeader ? Colors.white54 : (color ?? Colors.white),
              fontSize: isHeader ? 11 : 14,
              fontWeight: FontWeight.w900,
              fontStyle: isHeader ? FontStyle.normal : FontStyle.italic,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Text(
            col2,
            style: TextStyle(
              color: isHeader ? Colors.white54 : Colors.white,
              fontSize: isHeader ? 11 : 13,
              fontWeight: isHeader ? FontWeight.bold : FontWeight.w600,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Text(
            col3,
            style: TextStyle(
              color: isHeader ? Colors.white54 : Colors.white70,
              fontSize: isHeader ? 11 : 13,
              fontWeight: isHeader ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}

