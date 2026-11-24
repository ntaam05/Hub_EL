import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_result.dart';
import '../../domain/entities/user_inventory_entity.dart';
import '../../domain/usecases/get_wiki_inventory_usecase.dart';
import 'wiki_manager_event.dart';
import 'wiki_manager_state.dart';

class WikiManagerBloc extends Bloc<WikiManagerEvent, WikiManagerState> {
  final GetWikiInventoryUseCase getWikiInventoryUseCase;

  WikiManagerBloc({required this.getWikiInventoryUseCase})
      : super(const WikiManagerInitial()) {
    on<WikiInventoryFetchRequested>(_onFetchRequested);
    on<WikiInventoryRefreshRequested>(_onRefreshRequested);
    on<WikiFilterChanged>(_onFilterChanged);
    on<WikiRarityFilterChanged>(_onRarityFilterChanged);
    on<WikiSortChanged>(_onSortChanged);
    on<WikiSearchChanged>(_onSearchChanged);
  }

  Future<void> _onFetchRequested(
    WikiInventoryFetchRequested event,
    Emitter<WikiManagerState> emit,
  ) async {
    emit(const WikiManagerLoading());
    await _loadInventory(emit);
  }

  Future<void> _onRefreshRequested(
    WikiInventoryRefreshRequested event,
    Emitter<WikiManagerState> emit,
  ) async {
    await _loadInventory(emit);
  }

  Future<void> _loadInventory(Emitter<WikiManagerState> emit) async {
    final result = await getWikiInventoryUseCase();

    if (result is ApiSuccess<List<UserInventoryEntity>>) {
      final items = result.data;
      final currentFilter = state is WikiManagerLoaded
          ? (state as WikiManagerLoaded).currentFilter
          : WikiFilter.all;
      final currentSort = state is WikiManagerLoaded
          ? (state as WikiManagerLoaded).currentSort
          : WikiSort.newest;
      final selectedRarity = state is WikiManagerLoaded
          ? (state as WikiManagerLoaded).selectedRarity
          : null;
      final searchQuery = state is WikiManagerLoaded
          ? (state as WikiManagerLoaded).searchQuery
          : '';

      final filtered = _applyFilterAndSort(
        items,
        currentFilter,
        currentSort,
        selectedRarity,
        searchQuery,
      );

      emit(WikiManagerLoaded(
        allInventory: items,
        filteredInventory: filtered,
        currentFilter: currentFilter,
        currentSort: currentSort,
        selectedRarity: selectedRarity,
        searchQuery: searchQuery,
      ));
    } else if (result is ApiFailure<List<UserInventoryEntity>>) {
      emit(WikiManagerError(result.message));
    }
  }

  void _onFilterChanged(
    WikiFilterChanged event,
    Emitter<WikiManagerState> emit,
  ) {
    if (state is WikiManagerLoaded) {
      final current = state as WikiManagerLoaded;
      final filtered = _applyFilterAndSort(
        current.allInventory,
        event.filter,
        current.currentSort,
        current.selectedRarity,
        current.searchQuery,
      );
      emit(current.copyWith(
        currentFilter: event.filter,
        filteredInventory: filtered,
      ));
    }
  }

  void _onRarityFilterChanged(
    WikiRarityFilterChanged event,
    Emitter<WikiManagerState> emit,
  ) {
    if (state is WikiManagerLoaded) {
      final current = state as WikiManagerLoaded;
      final filtered = _applyFilterAndSort(
        current.allInventory,
        current.currentFilter,
        current.currentSort,
        event.rarity,
        current.searchQuery,
      );
      emit(current.copyWith(
        selectedRarity: event.rarity,
        clearRarity: event.rarity == null,
        filteredInventory: filtered,
      ));
    }
  }

  void _onSortChanged(
    WikiSortChanged event,
    Emitter<WikiManagerState> emit,
  ) {
    if (state is WikiManagerLoaded) {
      final current = state as WikiManagerLoaded;
      final filtered = _applyFilterAndSort(
        current.allInventory,
        current.currentFilter,
        event.sort,
        current.selectedRarity,
        current.searchQuery,
      );
      emit(current.copyWith(
        currentSort: event.sort,
        filteredInventory: filtered,
      ));
    }
  }

  void _onSearchChanged(
    WikiSearchChanged event,
    Emitter<WikiManagerState> emit,
  ) {
    if (state is WikiManagerLoaded) {
      final current = state as WikiManagerLoaded;
      final filtered = _applyFilterAndSort(
        current.allInventory,
        current.currentFilter,
        current.currentSort,
        current.selectedRarity,
        event.query,
      );
      emit(current.copyWith(
        searchQuery: event.query,
        filteredInventory: filtered,
      ));
    }
  }

  List<UserInventoryEntity> _applyFilterAndSort(
    List<UserInventoryEntity> items,
    WikiFilter filter,
    WikiSort sort,
    String? rarity,
    String query,
  ) {
    var result = List<UserInventoryEntity>.from(items);

    // 1. Search Query
    if (query.trim().isNotEmpty) {
      final q = query.trim().toLowerCase();
      result = result.where((item) => item.card.title.toLowerCase().contains(q)).toList();
    }

    // 2. Rarity Filter
    if (rarity != null && rarity.trim().isNotEmpty && rarity != 'ALL') {
      result = result.where((item) => item.card.rarity.toUpperCase() == rarity.toUpperCase()).toList();
    }

    // 3. Ownership & Study Filter
    if (filter == WikiFilter.owned) {
      result = result.where((item) => item.isOwned).toList();
    } else if (filter == WikiFilter.unowned) {
      result = result.where((item) => !item.isOwned).toList();
    } else if (filter == WikiFilter.studied) {
      result = result.where((item) => item.isOwned && item.card.isStudied).toList();
    } else if (filter == WikiFilter.unstudied) {
      result = result.where((item) => !item.card.isStudied).toList();
    }

    // 4. Sort
    if (sort == WikiSort.newest) {
      result.sort((a, b) {
        if (a.isOwned && b.isOwned) {
          final dateA = a.acquiredAt ?? DateTime.fromMillisecondsSinceEpoch(0);
          final dateB = b.acquiredAt ?? DateTime.fromMillisecondsSinceEpoch(0);
          return dateB.compareTo(dateA);
        } else if (a.isOwned && !b.isOwned) {
          return -1; // Owned cards appear before unowned
        } else if (!a.isOwned && b.isOwned) {
          return 1;
        } else {
          return b.cardId.compareTo(a.cardId);
        }
      });
    } else if (sort == WikiSort.rarity) {
      result.sort((a, b) {
        final diff = b.card.rarityWeight.compareTo(a.card.rarityWeight);
        if (diff != 0) return diff;
        return a.card.title.toLowerCase().compareTo(b.card.title.toLowerCase());
      });
    } else if (sort == WikiSort.name) {
      result.sort((a, b) => a.card.title.toLowerCase().compareTo(b.card.title.toLowerCase()));
    }

    return result;
  }
}
