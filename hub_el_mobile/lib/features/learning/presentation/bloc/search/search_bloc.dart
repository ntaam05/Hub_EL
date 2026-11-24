import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hub_el_mobile/core/network/api_result.dart';
import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';
import 'package:hub_el_mobile/features/learning/domain/usecases/search_videos_usecase.dart';
import 'search_event.dart';
import 'search_state.dart';

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  final SearchVideosUseCase searchVideosUseCase;

  SearchBloc({required this.searchVideosUseCase}) : super(const SearchInitial()) {
    on<SearchVideosRequested>(_onSearchRequested);
    on<SearchQueryReset>(_onReset);
  }

  Future<void> _onSearchRequested(
    SearchVideosRequested event,
    Emitter<SearchState> emit,
  ) async {
    if (event.query.trim().isEmpty) {
      emit(const SearchInitial());
      return;
    }

    if (event.isLoadMore && state is SearchLoaded) {
      final currentLoaded = state as SearchLoaded;
      emit(currentLoaded.copyWith(isLoadingMore: true));

      final result = await searchVideosUseCase(event.query, pageToken: event.pageToken);
      if (result is ApiSuccess<VideoSearchResultEntity>) {
        final data = result.data;
        emit(currentLoaded.copyWith(
          videos: [...currentLoaded.videos, ...data.items],
          nextPageToken: data.nextPageToken,
          isLoadingMore: false,
        ));
      } else if (result is ApiFailure<VideoSearchResultEntity>) {
        emit(currentLoaded.copyWith(isLoadingMore: false));
      }
    } else {
      emit(const SearchLoading());
      final result = await searchVideosUseCase(event.query, pageToken: event.pageToken);

      if (result is ApiSuccess<VideoSearchResultEntity>) {
        emit(SearchLoaded(
          videos: result.data.items,
          nextPageToken: result.data.nextPageToken,
          query: event.query,
        ));
      } else if (result is ApiFailure<VideoSearchResultEntity>) {
        emit(SearchFailure(
          message: result.message,
          query: event.query,
        ));
      }
    }
  }

  void _onReset(SearchQueryReset event, Emitter<SearchState> emit) {
    emit(const SearchInitial());
  }
}
