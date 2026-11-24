import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_result.dart';
import '../../domain/usecases/vocabulary_usecases.dart';
import 'vocabulary_state.dart';

class VocabularyCubit extends Cubit<VocabularyState> {
  final GetVocabularyListUseCase getVocabularyListUseCase;
  final GetVocabularyDetailUseCase getVocabularyDetailUseCase;
  final GetVocabularyContextUseCase getVocabularyContextUseCase;

  VocabularyCubit({
    required this.getVocabularyListUseCase,
    required this.getVocabularyDetailUseCase,
    required this.getVocabularyContextUseCase,
  }) : super(const VocabularyState());

  Future<void> loadVocabulary({bool showLoading = true, int page = 1}) async {
    if (showLoading) {
      emit(state.copyWith(status: VocabularyStatus.loading, clearErrorMessage: true));
    }

    final result = await getVocabularyListUseCase(
      page: page,
      limit: 100,
    );

    if (result is ApiSuccess) {
      final data = (result as ApiSuccess).data;
      emit(state.copyWith(
        status: VocabularyStatus.loaded,
        items: data.items,
        pagination: data.pagination,
        clearErrorMessage: true,
      ));
    } else if (result is ApiFailure) {
      emit(state.copyWith(
        status: VocabularyStatus.error,
        errorMessage: (result as ApiFailure).message,
      ));
    }
  }

  void setSearchQuery(String query) {
    emit(state.copyWith(searchQuery: query));
  }

  void setLanguageFilter(String language) {
    emit(state.copyWith(selectedLanguage: language));
  }

  void setPosFilter(String pos) {
    emit(state.copyWith(selectedPos: pos));
  }

  void setSortOrder(VocabSortOrder order) {
    emit(state.copyWith(sortOrder: order));
  }

  void toggleSortOrder() {
    final nextOrder = state.sortOrder == VocabSortOrder.az
        ? VocabSortOrder.za
        : VocabSortOrder.az;
    emit(state.copyWith(sortOrder: nextOrder));
  }

  void resetFilters() {
    emit(state.copyWith(
      selectedLanguage: 'ALL',
      selectedPos: 'ALL',
      searchQuery: '',
      sortOrder: VocabSortOrder.az,
    ));
  }

  Future<void> loadVocabularyDetail(int id) async {
    final result = await getVocabularyDetailUseCase(id);
    if (result is ApiSuccess) {
      emit(state.copyWith(selectedVocab: (result as ApiSuccess).data));
    }
  }

  void clearSelectedVocab() {
    emit(state.copyWith(clearSelectedVocab: true));
  }

  Future<void> loadVocabularyContext(int cardId, String targetWord) async {
    emit(state.copyWith(
      isContextLoading: true,
      clearSelectedContext: true,
      clearContextError: true,
    ));

    final result = await getVocabularyContextUseCase(cardId, targetWord);

    if (result is ApiSuccess) {
      emit(state.copyWith(
        isContextLoading: false,
        selectedContext: (result as ApiSuccess).data,
      ));
    } else if (result is ApiFailure) {
      emit(state.copyWith(
        isContextLoading: false,
        contextError: (result as ApiFailure).message,
      ));
    }
  }

  void clearSelectedContext() {
    emit(state.copyWith(
      clearSelectedContext: true,
      clearContextError: true,
      isContextLoading: false,
    ));
  }
}
