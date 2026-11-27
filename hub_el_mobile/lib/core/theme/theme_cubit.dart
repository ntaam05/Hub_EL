import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ThemeCubit extends Cubit<ThemeMode> {
  static const String _storageKey = 'hub_el_theme_mode';
  final FlutterSecureStorage _storage;

  ThemeCubit({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage(),
        super(ThemeMode.dark);

  Future<void> loadTheme() async {
    try {
      final saved = await _storage.read(key: _storageKey);
      if (saved == 'light') {
        emit(ThemeMode.light);
      } else if (saved == 'dark') {
        emit(ThemeMode.dark);
      }
    } catch (_) {}
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    emit(mode);
    try {
      await _storage.write(
        key: _storageKey,
        value: mode == ThemeMode.light ? 'light' : 'dark',
      );
    } catch (_) {}
  }
}
