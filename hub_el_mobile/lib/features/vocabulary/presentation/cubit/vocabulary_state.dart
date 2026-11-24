import 'package:equatable/equatable.dart';
import '../../domain/entities/vocabulary_entities.dart';

enum VocabularyStatus { initial, loading, loaded, error }

enum VocabSortOrder { az, za }

class VocabularyState extends Equatable {
  final VocabularyStatus status;
  final List<VocabularyItemEntity> items;
  final VocabularyPaginationEntity? pagination;
  final String selectedLanguage;
  final String selectedPos;
  final String searchQuery;
  final VocabSortOrder sortOrder;
  final VocabularyDetailEntity? selectedVocab;
  final VocabularyContextEntity? selectedContext;
  final bool isContextLoading;
  final String? contextError;
  final String? errorMessage;

  const VocabularyState({
    this.status = VocabularyStatus.initial,
    this.items = const [],
    this.pagination,
    this.selectedLanguage = 'ALL',
    this.selectedPos = 'ALL',
    this.searchQuery = '',
    this.sortOrder = VocabSortOrder.az,
    this.selectedVocab,
    this.selectedContext,
    this.isContextLoading = false,
    this.contextError,
    this.errorMessage,
  });

  /// Danh sách từ vựng đã áp dụng bộ lọc (ngôn ngữ, loại từ, tìm kiếm, sắp xếp)
  List<VocabularyItemEntity> get filteredItems {
    var result = List<VocabularyItemEntity>.from(items);

    // 1. Tìm kiếm theo từ hoặc nghĩa
    if (searchQuery.trim().isNotEmpty) {
      final q = searchQuery.trim().toLowerCase();
      result = result.where((v) {
        return v.word.toLowerCase().includesOrMatch(q) ||
            v.meaning.toLowerCase().includesOrMatch(q) ||
            v.cardTitle.toLowerCase().includesOrMatch(q);
      }).toList();
    }

    // 2. Lọc theo ngôn ngữ
    if (selectedLanguage != 'ALL' && selectedLanguage != 'Tất cả') {
      result = result.where((v) {
        return v.displayLanguage == selectedLanguage ||
            (v.language ?? '').toLowerCase() == selectedLanguage.toLowerCase();
      }).toList();
    }

    // 3. Lọc theo loại từ (POS)
    if (selectedPos != 'ALL') {
      result = result.where((v) {
        return (v.pos?.trim().toUpperCase() ?? '') == selectedPos;
      }).toList();
    }

    // 4. Sắp xếp thứ tự
    result.sort((a, b) {
      final cmp = a.word.toLowerCase().compareTo(b.word.toLowerCase());
      return sortOrder == VocabSortOrder.za ? -cmp : cmp;
    });

    return result;
  }

  /// Danh sách các loại từ (POS) duy nhất có trong kho từ vựng
  List<String> get posList {
    final set = <String>{};
    for (final item in items) {
      if (item.pos != null && item.pos!.trim().isNotEmpty) {
        set.add(item.pos!.trim().toUpperCase());
      }
    }
    final list = set.toList();
    list.sort();
    return list;
  }

  /// Thống kê số lượng từ theo từng ngôn ngữ
  Map<String, int> get languageCounts {
    final counts = <String, int>{};
    for (final item in items) {
      final lang = item.displayLanguage;
      counts[lang] = (counts[lang] ?? 0) + 1;
    }
    return counts;
  }

  /// Tổng số từ trong sổ tay
  int get totalWords => pagination?.total ?? items.length;

  /// Đang có bộ lọc nào được áp dụng ngoài mặc định
  bool get hasActiveFilters {
    return (selectedLanguage != 'ALL' && selectedLanguage != 'Tất cả') ||
        selectedPos != 'ALL' ||
        searchQuery.trim().isNotEmpty ||
        sortOrder != VocabSortOrder.az;
  }

  VocabularyState copyWith({
    VocabularyStatus? status,
    List<VocabularyItemEntity>? items,
    VocabularyPaginationEntity? pagination,
    String? selectedLanguage,
    String? selectedPos,
    String? searchQuery,
    VocabSortOrder? sortOrder,
    VocabularyDetailEntity? selectedVocab,
    bool clearSelectedVocab = false,
    VocabularyContextEntity? selectedContext,
    bool clearSelectedContext = false,
    bool? isContextLoading,
    String? contextError,
    bool clearContextError = false,
    String? errorMessage,
    bool clearErrorMessage = false,
  }) {
    return VocabularyState(
      status: status ?? this.status,
      items: items ?? this.items,
      pagination: pagination ?? this.pagination,
      selectedLanguage: selectedLanguage ?? this.selectedLanguage,
      selectedPos: selectedPos ?? this.selectedPos,
      searchQuery: searchQuery ?? this.searchQuery,
      sortOrder: sortOrder ?? this.sortOrder,
      selectedVocab: clearSelectedVocab ? null : (selectedVocab ?? this.selectedVocab),
      selectedContext: clearSelectedContext ? null : (selectedContext ?? this.selectedContext),
      isContextLoading: isContextLoading ?? this.isContextLoading,
      contextError: clearContextError ? null : (contextError ?? this.contextError),
      errorMessage: clearErrorMessage ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [
        status,
        items,
        pagination,
        selectedLanguage,
        selectedPos,
        searchQuery,
        sortOrder,
        selectedVocab,
        selectedContext,
        isContextLoading,
        contextError,
        errorMessage,
      ];
}

extension _StringMatchExt on String {
  bool includesOrMatch(String query) {
    return contains(query);
  }
}

