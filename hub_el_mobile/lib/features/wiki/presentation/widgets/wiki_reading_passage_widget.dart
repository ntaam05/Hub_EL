import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/entities/wiki_study_session_entity.dart';
import 'wiki_vocabulary_sheet.dart';

class WikiReadingPassageWidget extends StatefulWidget {
  final String cardTitle;
  final String simplifiedText;
  final List<WikiVocabularyEntity> vocabularies;
  final List<String> guessWords;
  final String targetLanguage;

  const WikiReadingPassageWidget({
    super.key,
    required this.cardTitle,
    required this.simplifiedText,
    required this.vocabularies,
    required this.guessWords,
    required this.targetLanguage,
  });

  @override
  State<WikiReadingPassageWidget> createState() => _WikiReadingPassageWidgetState();
}

class _WikiReadingPassageWidgetState extends State<WikiReadingPassageWidget> {
  final FlutterTts _flutterTts = FlutterTts();
  List<String> _sentences = [];
  int _playingIndex = -1;

  @override
  void initState() {
    super.initState();
    _splitSentences();
    _initTts();
  }

  void _splitSentences() {
    final matches = RegExp(r'[^.!?\n]+[.!?\n]*').allMatches(widget.simplifiedText);
    _sentences = matches.map((m) => m.group(0) ?? '').where((s) => s.trim().isNotEmpty).toList();
    if (_sentences.isEmpty) {
      _sentences = [widget.simplifiedText];
    }
  }

  void _initTts() async {
    final code = _getLangCode(widget.targetLanguage);
    await _flutterTts.setLanguage(code);
    await _flutterTts.setSpeechRate(0.45);

    _flutterTts.setCompletionHandler(() {
      if (!mounted) return;
      if (_playingIndex >= 0 && _playingIndex < _sentences.length - 1) {
        _playFromSentence(_playingIndex + 1);
      } else {
        setState(() => _playingIndex = -1);
      }
    });

    _flutterTts.setErrorHandler((_) {
      if (mounted) setState(() => _playingIndex = -1);
    });
  }

  String _getLangCode(String lang) {
    switch (lang) {
      case 'Tiếng Nhật':
        return 'ja-JP';
      case 'Tiếng Hàn':
        return 'ko-KR';
      case 'Tiếng Trung':
        return 'zh-CN';
      case 'Tiếng Pháp':
        return 'fr-FR';
      case 'Tiếng Đức':
        return 'de-DE';
      default:
        return 'en-US';
    }
  }

  void _playFromSentence(int index) async {
    if (index < 0 || index >= _sentences.length) return;
    setState(() => _playingIndex = index);
    await _flutterTts.stop();
    await _flutterTts.speak(_sentences[index]);
  }

  void _stopPlaying() async {
    await _flutterTts.stop();
    setState(() => _playingIndex = -1);
  }

  @override
  void dispose() {
    _flutterTts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF111827) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Card Title + Play/Stop TTS Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  widget.cardTitle,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
              ),
              IconButton(
                style: IconButton.styleFrom(
                  backgroundColor: _playingIndex >= 0
                      ? const Color(0xFFEF4444).withOpacity(0.15)
                      : const Color(0xFF2563EB).withOpacity(0.15),
                  foregroundColor: _playingIndex >= 0 ? const Color(0xFFEF4444) : const Color(0xFF2563EB),
                ),
                icon: Icon(_playingIndex >= 0 ? LucideIcons.square : LucideIcons.volume2, size: 20),
                onPressed: () {
                  if (_playingIndex >= 0) {
                    _stopPlaying();
                  } else {
                    _playFromSentence(0);
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '💡 Gợi ý: Bấm vào một câu bất kỳ để máy đọc bắt đầu từ đoạn đó.',
            style: TextStyle(
              fontSize: 11,
              fontStyle: FontStyle.italic,
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 14),

          // Sentences block with highlighting
          Wrap(
            spacing: 2,
            runSpacing: 4,
            children: List.generate(_sentences.length, (i) {
              final isSentencePlaying = _playingIndex == i;
              return InkWell(
                onTap: () => _playFromSentence(i),
                borderRadius: BorderRadius.circular(6),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(
                    color: isSentencePlaying
                        ? (isDark ? const Color(0xFF1E3A8A).withOpacity(0.7) : const Color(0xFFDBEAFE))
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text.rich(
                    _buildHighlightedSpan(_sentences[i], isDark, isSentencePlaying),
                    style: TextStyle(
                      fontSize: 14.5,
                      height: 1.6,
                      color: isSentencePlaying
                          ? (isDark ? const Color(0xFFEFF6FF) : const Color(0xFF1E3A8A))
                          : (isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B)),
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  TextSpan _buildHighlightedSpan(String text, bool isDark, bool isPlaying) {
    if (widget.vocabularies.isEmpty && widget.guessWords.isEmpty) {
      return TextSpan(text: text);
    }

    final vocabWords = widget.vocabularies.map((v) => v.word.toLowerCase()).toSet();
    final guessWords = widget.guessWords.map((w) => w.toLowerCase()).toSet();

    final allTargetWords = [...vocabWords, ...guessWords]..sort((a, b) => b.length.compareTo(a.length));
    if (allTargetWords.isEmpty) return TextSpan(text: text);

    final pattern = r'\b(' + allTargetWords.map(RegExp.escape).join('|') + r')\b';
    final regex = RegExp(pattern, caseSensitive: false);

    final List<InlineSpan> spans = [];
    int lastIndex = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > lastIndex) {
        spans.add(TextSpan(text: text.substring(lastIndex, match.start)));
      }

      final matchedWord = match.group(0)!;
      final lower = matchedWord.toLowerCase();

      if (guessWords.contains(lower)) {
        // Guess word highlight (Yellow)
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
            decoration: BoxDecoration(
              color: Colors.amber.withOpacity(0.2),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.amber.withOpacity(0.6)),
            ),
            child: Text(
              matchedWord,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.amber,
              ),
            ),
          ),
        ));
      } else if (vocabWords.contains(lower)) {
        // Vocab word highlight (Blue bold with tap definition)
        final vocab = widget.vocabularies.firstWhere(
          (v) => v.word.toLowerCase() == lower,
        );

        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: GestureDetector(
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => FractionallySizedBox(
                  heightFactor: 0.65,
                  child: WikiVocabularySheet(
                    vocabularies: [vocab, ...widget.vocabularies.where((v) => v.word != vocab.word)],
                    language: widget.targetLanguage,
                  ),
                ),
              );
            },
            child: Text(
              matchedWord,
              style: TextStyle(
                fontWeight: FontWeight.w900,
                color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF1D4ED8),
                decoration: TextDecoration.underline,
                decorationColor: const Color(0xFF2563EB).withOpacity(0.5),
              ),
            ),
          ),
        ));
      } else {
        spans.add(TextSpan(text: matchedWord));
      }

      lastIndex = match.end;
    }

    if (lastIndex < text.length) {
      spans.add(TextSpan(text: text.substring(lastIndex)));
    }

    return TextSpan(children: spans);
  }
}

