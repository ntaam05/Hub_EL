import 'package:equatable/equatable.dart';
import '../../domain/entities/leaderboard_entity.dart';

class LeaderboardState extends Equatable {
  final LeaderboardCategoryType selectedCategory;
  final LeaderboardTimeframeType selectedTimeframe;
  final LeaderboardDataEntity? data;
  final bool isLoading;
  final String? errorMessage;

  const LeaderboardState({
    this.selectedCategory = LeaderboardCategoryType.streak,
    this.selectedTimeframe = LeaderboardTimeframeType.day,
    this.data,
    this.isLoading = false,
    this.errorMessage,
  });

  LeaderboardState copyWith({
    LeaderboardCategoryType? selectedCategory,
    LeaderboardTimeframeType? selectedTimeframe,
    LeaderboardDataEntity? data,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return LeaderboardState(
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedTimeframe: selectedTimeframe ?? this.selectedTimeframe,
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [
        selectedCategory,
        selectedTimeframe,
        data,
        isLoading,
        errorMessage,
      ];
}

