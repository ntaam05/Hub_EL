import 'package:equatable/equatable.dart';

enum WikiFilter { all, owned, unowned, studied, unstudied }

enum WikiSort { newest, rarity, name }

abstract class WikiManagerEvent extends Equatable {
  const WikiManagerEvent();

  @override
  List<Object?> get props => [];
}

class WikiInventoryFetchRequested extends WikiManagerEvent {
  const WikiInventoryFetchRequested();
}

class WikiInventoryRefreshRequested extends WikiManagerEvent {
  const WikiInventoryRefreshRequested();
}

class WikiFilterChanged extends WikiManagerEvent {
  final WikiFilter filter;

  const WikiFilterChanged(this.filter);

  @override
  List<Object?> get props => [filter];
}

class WikiRarityFilterChanged extends WikiManagerEvent {
  final String? rarity; // null means all rarities

  const WikiRarityFilterChanged(this.rarity);

  @override
  List<Object?> get props => [rarity];
}

class WikiSortChanged extends WikiManagerEvent {
  final WikiSort sort;

  const WikiSortChanged(this.sort);

  @override
  List<Object?> get props => [sort];
}

class WikiSearchChanged extends WikiManagerEvent {
  final String query;

  const WikiSearchChanged(this.query);

  @override
  List<Object?> get props => [query];
}
