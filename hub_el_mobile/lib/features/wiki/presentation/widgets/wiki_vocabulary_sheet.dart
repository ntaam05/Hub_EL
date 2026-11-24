import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/entities/wiki_study_session_entity.dart';

class WikiVocabularySheet extends StatefulWidget {
  final List<WikiVocabularyEntity> vocabularies;
  final String language;

  const WikiVocabularySheet({
    super.key,
    required this.vocabularies,
    required this.language,
  });

  @override
  State<WikiVocabularySheet> createState() => _WikiVocabularySheetState();
}

class _WikiVocabularySheetState extends State<WikiVocabularySheet> {
  final FlutterTts _flutterTts = FlutterTts();

  @override
  void initState() {
    super.initState();
    _initTts();
  }

  void _initTts() async {
    final code = _getLangCode(widget.language);
    await _flutterTts.setLanguage(code);
    await _flutterTts.setSpeechRate(0.45);
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

  void _speakWord(String word) async {
    await _flutterTts.stop();
    await _flutterTts.speak(word);
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
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag indicator
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 6),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.bookOpen, size: 20, color: Color(0xFF2563EB)),
                    const SizedBox(width: 8),
                    Text(
                      'TỪ VỰNG KHÓ (${widget.vocabularies.length})',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.8,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Vocab list
          Expanded(
            child: widget.vocabularies.isEmpty
                ? Center(
                    child: Text(
                      'Không có từ vựng khó nào.',
                      style: TextStyle(color: isDark ? Colors.grey : Colors.black54),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: widget.vocabularies.length,
                    itemBuilder: (context, index) {
                      final vocab = widget.vocabularies[index];
                      return _buildVocabItem(vocab, isDark);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildVocabItem(WikiVocabularyEntity v, bool isDark) {
    String phonetic = '';
    String pronunciation = '';
    String explanation = v.englishDesc;

    if (v.englishDesc.contains('\n')) {
      final parts = v.englishDesc.split('\n');
      final line1 = parts[0].trim();
      final bracketMatch = RegExp(r'\[.*?\]').firstMatch(line1);
      if (bracketMatch != null) {
        phonetic = bracketMatch.group(0) ?? '';
        pronunciation = line1.replaceAll(phonetic, '').replaceAll(RegExp(r'^-'), '').trim();
      }
      explanation = parts.skip(1).join(' ').trim();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    v.word,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF1D4ED8),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      v.pos,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.grey : Colors.black54,
                      ),
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(LucideIcons.volume2, size: 18, color: Color(0xFF2563EB)),
                onPressed: () => _speakWord(v.word),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            v.meaning,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
            ),
          ),
          if (phonetic.isNotEmpty || pronunciation.isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              children: [
                if (phonetic.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      phonetic,
                      style: const TextStyle(
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                  ),
                if (pronunciation.isNotEmpty)
                  Text(
                    pronunciation,
                    style: TextStyle(
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                      color: isDark ? Colors.grey : Colors.black54,
                    ),
                  ),
              ],
            ),
          ],
          if (explanation.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A).withOpacity(0.5) : Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Text(
                explanation,
                style: TextStyle(
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

