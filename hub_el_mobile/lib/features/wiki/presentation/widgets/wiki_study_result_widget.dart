import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/entities/wiki_card_entity.dart';
import '../bloc/wiki_study_bloc.dart';
import '../bloc/wiki_study_event.dart';
import '../bloc/wiki_study_state.dart';
import 'wiki_card_widget.dart';

class WikiStudyResultWidget extends StatefulWidget {
  final WikiStudyState state;
  final VoidCallback onFinish;

  const WikiStudyResultWidget({
    super.key,
    required this.state,
    required this.onFinish,
  });

  @override
  State<WikiStudyResultWidget> createState() => _WikiStudyResultWidgetState();
}

class _WikiStudyResultWidgetState extends State<WikiStudyResultWidget> {
  late final ConfettiController _confettiController;
  bool _showReview = false;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    if (widget.state.result?.isPass == true) {
      _confettiController.play();
    }
  }

  @override
  void didUpdateWidget(covariant WikiStudyResultWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.state.isStarRestored && !oldWidget.state.isStarRestored) {
      _confettiController.play();
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final res = widget.state.result;
    final card = widget.state.card;
    final isPass = res?.isPass == true;
    final isRestored = widget.state.isStarRestored;

    if (res == null || card == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final dummyWikiCard = WikiCardEntity(
      id: card.cardId,
      title: card.title,
      rarity: card.rarity,
      imageUrl: card.imageUrl,
      wikiUrl: card.wikiUrl,
      aiContent: '',
      totalStars: card.totalStars,
      awakenedStars: widget.state.currentAwakenedStars,
    );

    return Stack(
      alignment: Alignment.topCenter,
      children: [
        // Confetti
        ConfettiWidget(
          confettiController: _confettiController,
          blastDirectionality: BlastDirectionality.explosive,
          numberOfParticles: 35,
          gravity: 0.2,
          colors: const [
            Colors.green,
            Colors.blue,
            Colors.pink,
            Colors.orange,
            Colors.purple,
            Colors.amber,
          ],
        ),

        SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            children: [
              // 3D Card Display
              Center(
                child: WikiCardWidget(
                  card: dummyWikiCard,
                  isOwned: true,
                  scale: 0.85,
                ),
              ),
              const SizedBox(height: 24),

              // CASE A: PASS OR STAR RESTORED
              if (isPass || isRestored) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF111827) : Colors.white,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '+${res.expGained} XP',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF10B981),
                        ),
                      ),
                      if (isRestored) ...[
                        const SizedBox(width: 12),
                        const Icon(LucideIcons.sparkles, size: 18, color: Colors.amber),
                        const SizedBox(width: 4),
                        const Text(
                          'Đã khôi phục +1 Sao',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Colors.amber,
                          ),
                        ),
                      ] else ...[
                        if (res.gainedCoins > 0) ...[
                          const SizedBox(width: 10),
                          const Text('•', style: TextStyle(color: Colors.grey, fontSize: 16)),
                          const SizedBox(width: 10),
                          Text(
                            '+${res.gainedCoins} Xu',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFFF59E0B),
                            ),
                          ),
                        ],
                        const SizedBox(width: 10),
                        const Text('•', style: TextStyle(color: Colors.grey, fontSize: 16)),
                        const SizedBox(width: 10),
                        const Text(
                          '+1 Sao',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF8B5CF6),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Button "Xác nhận"
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                      foregroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 4,
                    ),
                    onPressed: widget.onFinish,
                    child: const Text(
                      'XÁC NHẬN',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                ),
              ]

              // CASE B: FAILED
              else ...[
                if (res.isLostStar && !isRestored) ...[
                  // Mất sao & Cứu sao banner
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E1B4B) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          '-1 Sao',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFEF4444),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: widget.state.isKeepingStar
                                ? Colors.grey
                                : const Color(0xFFF59E0B),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 2,
                          ),
                          onPressed: widget.state.isKeepingStar
                              ? null
                              : () {
                                  context.read<WikiStudyBloc>().add(const WikiStudyKeepStarRequested());
                                },
                          child: Text(
                            widget.state.isKeepingStar ? 'Đang xử lý...' : 'Giữ sao (-50 Xu)',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Thất bại card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF111827) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Icon(
                        LucideIcons.trophy,
                        size: 54,
                        color: isDark ? const Color(0xFF475569) : const Color(0xFF94A3B8),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'THẤT BÀI',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Đúng ${res.correctCount}/${res.totalQuizzes} câu. Cần 50% để qua!',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: widget.onFinish,
                          child: Text(
                            'THỬ LẠI SAU',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),

              // Xem lại câu hỏi & lời giải (Toggle)
              InkWell(
                onTap: () {
                  setState(() => _showReview = !_showReview);
                },
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _showReview ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                        size: 18,
                        color: const Color(0xFF2563EB),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _showReview ? 'Thu gọn bài giải' : 'Xem lại câu hỏi & AI giải thích',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Danh sách câu hỏi và lời giải chi tiết
              if (_showReview) ...[
                const SizedBox(height: 16),
                ...res.quizzes.map((q) => _buildReviewCard(q, isDark)),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewCard(dynamic q, bool isDark) {
    final isCorrect = q.isCorrect == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isCorrect
              ? const Color(0xFF10B981).withOpacity(0.5)
              : const Color(0xFFEF4444).withOpacity(0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isCorrect ? LucideIcons.checkCircle2 : LucideIcons.xCircle,
                size: 18,
                color: isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              ),
              const SizedBox(width: 8),
              Text(
                'Q${q.index + 1}.',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            q.question,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
          const SizedBox(height: 10),
          Text(
            'Đáp án của bạn: ${q.userAnswer.isEmpty ? "(Chưa chọn)" : q.userAnswer}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444),
            ),
          ),
          if (!isCorrect && q.correctAnswers.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Đáp án đúng: ${q.correctAnswers.join(" | ")}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF10B981),
                ),
              ),
            ),
          if (q.explanation.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'AI GIẢI THÍCH:',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    q.explanation,
                    style: TextStyle(
                      fontSize: 12,
                      height: 1.4,
                      color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
