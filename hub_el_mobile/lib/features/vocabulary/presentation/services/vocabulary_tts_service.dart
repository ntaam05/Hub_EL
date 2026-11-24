import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

class VocabularyTtsService {
  final FlutterTts _flutterTts;
  bool _isInitialized = false;

  VocabularyTtsService({FlutterTts? flutterTts})
      : _flutterTts = flutterTts ?? FlutterTts();

  Future<void> init() async {
    if (_isInitialized) return;
    try {
      await _flutterTts.setSpeechRate(0.48);
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);
      _isInitialized = true;
    } catch (e) {
      debugPrint('[VocabularyTtsService] Init error: $e');
    }
  }

  Future<bool> speak(String text, {String languageCode = 'en-US'}) async {
    if (text.trim().isEmpty) return false;
    try {
      await init();
      await _flutterTts.stop();
      await _flutterTts.setLanguage(languageCode);
      final result = await _flutterTts.speak(text.trim());
      return result == 1;
    } catch (e) {
      debugPrint('[VocabularyTtsService] Speak error: $e');
      return false;
    }
  }

  Future<void> stop() async {
    try {
      await _flutterTts.stop();
    } catch (e) {
      debugPrint('[VocabularyTtsService] Stop error: $e');
    }
  }

  void dispose() {
    stop();
  }
}

