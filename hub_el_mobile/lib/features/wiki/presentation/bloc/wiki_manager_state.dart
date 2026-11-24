import 'package:equatable/equatable.dart';
import '../../domain/entities/user_inventory_entity.dart';
import 'wiki_manager_event.dart';

abstract class WikiManagerState extends Equatable {
  const WikiManagerState();

  @override
  List<Object?> get props => [];
}

class WikiManagerInitial extends WikiManagerState {
  const WikiManagerInitial();
}

class WikiManagerLoading extends WikiManagerState {
  const WikiManagerLoading();
}

class WikiManagerLoaded extends WikiManagerState {
  final List<UserInventoryEntity> allInventory;
  final List<UserInventoryEntity> filteredInventory;
  final WikiFilter currentFilter;
  final WikiSort currentSort;
  final String? selectedRarity;
  final String searchQuery;

  const WikiManagerLoaded({
    required this.allInventory,
    required this.filteredInventory,
    this.currentFilter = WikiFilter.all,
    this.currentSort = WikiSort.newest,
    this.selectedRarity,
    this.searchQuery = '',
  });

  WikiManagerLoaded copyWith({
    List<UserInventoryEntity>? allInventory,
    List<UserInventoryEntity>? filteredInventory,
    WikiFilter? currentFilter,
    WikiSort? currentSort,
    String? selectedRarity,
    bool clearRarity = false,
    String? searchQuery,
  }) {
    return WikiManagerLoaded(
      allInventory: allInventory ?? this.allInventory,
      filteredInventory: filteredInventory ?? this.filteredInventory,
      currentFilter: currentFilter ?? this.currentFilter,
      currentSort: currentSort ?? this.currentSort,
      selectedRarity: clearRarity ? null : (selectedRarity ?? this.selectedRarity),
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  @override
  List<Object?> get props => [
        allInventory,
        filteredInventory,
        currentFilter,
        currentSort,
        selectedRarity,
        searchQuery,
      ];
}

class WikiManagerError extends WikiManagerState {
  final String message;

  const WikiManagerError(this.message);

  @override
  List<Object?> get props => [message];
}
