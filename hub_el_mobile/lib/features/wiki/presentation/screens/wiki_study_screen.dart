import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../bloc/wiki_study_bloc.dart';
import '../bloc/wiki_study_event.dart';
import '../bloc/wiki_study_state.dart';
import '../widgets/wiki_quiz_card_widget.dart';
import '../widgets/wiki_reading_passage_widget.dart';
import '../widgets/wiki_study_config_widget.dart';
import '../widgets/wiki_study_result_widget.dart';
import '../widgets/wiki_vocabulary_sheet.dart';

class WikiStudyScreen extends StatefulWidget {
  final int cardId;

  const WikiStudyScreen({super.key, required this.cardId});

  @override
  State<WikiStudyScreen> createState() => _WikiStudyScreenState();
}

class _WikiStudyScreenState extends State<WikiStudyScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    context.read<WikiStudyBloc>().add(WikiStudyInitRequested(widget.cardId));
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      context.read<WikiStudyBloc>().add(const WikiStudyTimerTicked());
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() {
    _stopTimer();
    super.dispose();
  }

  Future<bool> _onWillPop() async {
    final state = context.read<WikiStudyBloc>().state;
    if (state.step == WikiStudyStep.study) {
      final shouldExit = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Rời bài học?'),
          content: const Text('Tiến trình làm bài hiện tại sẽ không được lưu nếu bạn thoát ra.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Tiếp tục học'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Rời đi'),
            ),
          ],
        ),
      );
      return shouldExit ?? false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        backgroundColor: isDark ? const Color(0xFF0B1120) : const Color(0xFFF0F9FF),
        appBar: _buildAppBar(context, isDark),
        body: BlocConsumer<WikiStudyBloc, WikiStudyState>(
          listener: (context, state) {
            if (state.step == WikiStudyStep.study && state.timeLimit > 0) {
              if (_timer == null || !_timer!.isActive) {
                _startTimer();
              }
            } else {
              _stopTimer();
            }

            if (state.errorMessage != null && state.errorMessage!.isNotEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.errorMessage!),
                  backgroundColor: Colors.red.shade800,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          },
          builder: (context, state) {
            if (state.isLoading && state.step == WikiStudyStep.config) {
              return const Center(child: CircularProgressIndicator());
            }

            switch (state.step) {
              case WikiStudyStep.config:
                return WikiStudyConfigWidget(state: state);

              case WikiStudyStep.loading:
                return _buildLoadingView(state, isDark);

              case WikiStudyStep.study:
                return _buildStudyView(context, state, isDark);

              case WikiStudyStep.result:
                return WikiStudyResultWidget(
                  state: state,
                  onFinish: () => Navigator.of(context).pop(true),
                );
            }
          },
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context, bool isDark) {
    return PreferredSize(
      preferredSize: const Size.fromHeight(60),
      child: BlocBuilder<WikiStudyBloc, WikiStudyState>(
        builder: (context, state) {
          final showStudyControls = state.step == WikiStudyStep.study && state.session != null;

          return AppBar(
            backgroundColor: isDark ? const Color(0xFF0F172A).withOpacity(0.9) : Colors.white.withOpacity(0.9),
            elevation: 0,
            leading: IconButton(
              icon: const Icon(LucideIcons.arrowLeft, size: 20),
              onPressed: () async {
                final canPop = await _onWillPop();
                if (canPop && context.mounted) {
                  Navigator.of(context).pop();
                }
              },
            ),
            title: Row(
              children: [
                // Ngôn ngữ & Trình độ Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        state.selectedLanguage,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(width: 4, height: 4, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF2563EB))),
                      const SizedBox(width: 6),
                      Text(
                        state.selectedLevel,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            actions: [
              if (showStudyControls) ...[
                // Timer Countdown
                if (state.timeLimit > 0)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: state.timeLeft <= 60
                            ? const Color(0xFFEF4444).withOpacity(0.15)
                            : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: state.timeLeft <= 60 ? const Color(0xFFEF4444) : Colors.transparent,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.timer,
                            size: 14,
                            color: state.timeLeft <= 60 ? const Color(0xFFEF4444) : Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${(state.timeLeft ~/ 60).toString().padLeft(2, '0')}:${(state.timeLeft % 60).toString().padLeft(2, '0')}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: state.timeLeft <= 60
                                  ? const Color(0xFFEF4444)
                                  : (isDark ? Colors.white : Colors.black87),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(width: 8),

                // Button Từ Vựng
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 2,
                    ),
                    onPressed: () {
                      if (state.session != null) {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => FractionallySizedBox(
                            heightFactor: 0.7,
                            child: WikiVocabularySheet(
                              vocabularies: state.session!.vocabularies,
                              language: state.selectedLanguage,
                            ),
                          ),
                        );
                      }
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.bookOpen, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          'Từ vựng (${state.session?.vocabularies.length ?? 0})',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _buildLoadingView(WikiStudyState state, bool isDark) {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF111827) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 50,
              height: 50,
              child: CircularProgressIndicator(
                strokeWidth: 4,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'AI đang thiết kế ${state.numQs} câu hỏi...',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Đang đơn giản hóa nội dung theo trình độ ${state.selectedLevel}',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudyView(BuildContext context, WikiStudyState state, bool isDark) {
    final session = state.session!;
    final guessWords = session.quizzes
        .where((q) => q.targetWord != null && q.targetWord!.isNotEmpty)
        .map((q) => q.targetWord!)
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Khối đọc bài
          WikiReadingPassageWidget(
            cardTitle: session.cardTitle,
            simplifiedText: session.simplifiedText,
            vocabularies: session.vocabularies,
            guessWords: guessWords,
            targetLanguage: state.selectedLanguage,
          ),
          const SizedBox(height: 24),

          // Header: KIỂM TRA TRI THỨC
          Row(
            children: [
              const Icon(LucideIcons.target, size: 22, color: Color(0xFF2563EB)),
              const SizedBox(width: 8),
              Text(
                'KIỂM TRA TRI THỨC (${session.quizzes.length} CÂU)',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Danh sách các câu hỏi Quiz
          ...session.quizzes.map((quiz) {
            return WikiQuizCardWidget(
              quiz: quiz,
              selectedAnswer: state.userAnswers[quiz.index],
              isConfirmed: state.confirmedQuestions.contains(quiz.index),
              onAnswerSelected: (val) {
                context.read<WikiStudyBloc>().add(
                      WikiStudyAnswerSelected(questionIndex: quiz.index, answer: val),
                    );
              },
              onConfirm: () {
                context.read<WikiStudyBloc>().add(
                      WikiStudyAnswerConfirmed(quiz.index),
                    );
              },
            );
          }),
          const SizedBox(height: 16),

          // Nút Nộp bài (Hoàn tất bài học)
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: state.isAllQuestionsConfirmed
                    ? const Color(0xFF10B981)
                    : (isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: state.isAllQuestionsConfirmed ? 4 : 0,
              ),
              onPressed: state.isAllQuestionsConfirmed && !state.isLoading
                  ? () {
                      context.read<WikiStudyBloc>().add(const WikiStudyFinishRequested());
                    }
                  : null,
              child: state.isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                    )
                  : Text(
                      state.isAllQuestionsConfirmed ? 'HOÀN TẤT BÀI HỌC' : 'TRẢ LỜI & XÁC NHẬN HẾT ĐỂ NỘP',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.8,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

extension ElevatedButtonExtension on ElevatedButton {
  Widget build(BuildContext context, Widget child, {required VoidCallback onTap}) {
    return ElevatedButton(
      style: style,
      onPressed: onTap,
      child: child,
    );
  }
}
