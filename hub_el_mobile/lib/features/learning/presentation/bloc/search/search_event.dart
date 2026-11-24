abstract class SearchEvent {
  const SearchEvent();
}

class SearchVideosRequested extends SearchEvent {
  final String query;
  final String? pageToken;
  final bool isLoadMore;

  const SearchVideosRequested(
    this.query, {
    this.pageToken,
    this.isLoadMore = false,
  });
}

class SearchQueryReset extends SearchEvent {
  const SearchQueryReset();
}
