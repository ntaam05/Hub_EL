import 'package:equatable/equatable.dart';

enum GachaAnimationState {
  idle,
  drawing,
  spinning,
  revealed,
}

abstract class GachaEvent extends Equatable {
  const GachaEvent();

  @override
  List<Object?> get props => [];
}

class GachaStatusFetchRequested extends GachaEvent {
  const GachaStatusFetchRequested();
}

class GachaRollRequested extends GachaEvent {
  final int count;

  const GachaRollRequested(this.count);

  @override
  List<Object?> get props => [count];
}

class GachaAnimationStepChanged extends GachaEvent {
  final GachaAnimationState rollState;

  const GachaAnimationStepChanged(this.rollState);

  @override
  List<Object?> get props => [rollState];
}

class GachaResetResultRequested extends GachaEvent {
  const GachaResetResultRequested();
}

class GachaExchangeDataFetchRequested extends GachaEvent {
  const GachaExchangeDataFetchRequested();
}

class GachaCardExchangeRequested extends GachaEvent {
  final int cardId;

  const GachaCardExchangeRequested(this.cardId);

  @override
  List<Object?> get props => [cardId];
}

class GachaHistoryFetchRequested extends GachaEvent {
  final int page;
  final int limit;

  const GachaHistoryFetchRequested({this.page = 1, this.limit = 10});

  @override
  List<Object?> get props => [page, limit];
}

