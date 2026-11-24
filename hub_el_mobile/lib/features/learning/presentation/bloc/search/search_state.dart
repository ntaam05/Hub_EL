import 'package:hub_el_mobile/features/learning/domain/entities/video_item_entity.dart';

abstract class SearchState {
  const SearchState();
}

class SearchInitial extends SearchState {
  const SearchInitial();
}

class SearchLoading extends SearchState {
  const SearchLoading();
}

class SearchLoaded extends SearchState {
  final List<VideoItemEntity> videos;
  final String? nextPageToken;
  final String query;
  final bool isLoadingMore;

  const SearchLoaded({
    required this.videos,
    this.nextPageToken,
    required this.query,
    this.isLoadingMore = false,
  });

  SearchLoaded copyWith({
    List<VideoItemEntity>? videos,
    String? nextPageToken,
    String? query,
    bool? isLoadingMore,
  }) {
    return SearchLoaded(
      videos: videos ?? this.videos,
      nextPageToken: nextPageToken ?? this.nextPageToken,
      query: query ?? this.query,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }
}

class SearchFailure extends SearchState {
  final String message;
  final String? query;

  const SearchFailure({required this.message, this.query});
}
