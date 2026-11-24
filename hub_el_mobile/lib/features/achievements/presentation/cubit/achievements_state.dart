import 'package:equatable/equatable.dart';
import '../../domain/entities/achievement_entities.dart';

enum AchievementsStatus { initial, loading, loaded, error }

enum AchievementFilterStatus {
  all('Tất cả'),
  unlocked('Đã mở khóa'),
  inProgress('Đang tiến hành');

  final String label;
  const AchievementFilterStatus(this.label);
}

class AchievementsState extends Equatable {
  final AchievementsStatus status;
  final AchievementsDataEntity? data;
  final String? selectedGroup; // null = Tất cả nhóm
  final int? selectedTier; // null = Tất cả cấp độ
  final AchievementFilterStatus filterStatus;
  final String searchQuery;
  final AchievementItemEntity? selectedAchievement;
  final bool showCelebration;
  final String? errorMessage;

  const AchievementsState({
    this.status = AchievementsStatus.initial,
    this.data,
    this.selectedGroup,
    this.selectedTier,
    this.filterStatus = AchievementFilterStatus.all,
    this.searchQuery = '',
    this.selectedAchievement,
    this.showCelebration = false,
    this.errorMessage,
  });

  AchievementsState copyWith({
    AchievementsStatus? status,
    AchievementsDataEntity? data,
    String? selectedGroup,
    bool clearSelectedGroup = false,
    int? selectedTier,
    bool clearSelectedTier = false,
    AchievementFilterStatus? filterStatus,
    String? searchQuery,
    AchievementItemEntity? selectedAchievement,
    bool clearSelectedAchievement = false,
    bool? showCelebration,
    String? errorMessage,
    bool clearErrorMessage = false,
  }) {
    return AchievementsState(
      status: status ?? this.status,
      data: data ?? this.data,
      selectedGroup: clearSelectedGroup ? null : (selectedGroup ?? this.selectedGroup),
      selectedTier: clearSelectedTier ? null : (selectedTier ?? this.selectedTier),
      filterStatus: filterStatus ?? this.filterStatus,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedAchievement: clearSelectedAchievement ? null : (selectedAchievement ?? this.selectedAchievement),
      showCelebration: showCelebration ?? this.showCelebration,
      errorMessage: clearErrorMessage ? null : (errorMessage ?? this.errorMessage),
    );
  }

  /// Danh sách thành tựu đã qua bộ lọc
  List<AchievementItemEntity> get filteredAchievements {
    if (data == null) return const [];

    return data!.achievements.where((ach) {
      // 1. Lọc theo trạng thái hoàn thành
      if (filterStatus == AchievementFilterStatus.unlocked && !ach.isUnlocked) {
        return false;
      }
      if (filterStatus == AchievementFilterStatus.inProgress && ach.isUnlocked) {
        return false;
      }

      // 2. Lọc theo nhóm (Group)
      if (selectedGroup != null && ach.groupId != selectedGroup) {
        return false;
      }

      // 3. Lọc theo cấp độ (Tier)
      if (selectedTier != null && ach.tier != selectedTier) {
        return false;
      }

      // 4. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim().isNotEmpty) {
        final query = searchQuery.trim().toLowerCase();
        final matchTitle = ach.title.toLowerCase().contains(query);
        final matchDesc = ach.desc.toLowerCase().contains(query);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    }).toList();
  }

  /// Thống kê số lượng theo nhóm
  Map<String, int> get groupCounts {
    final map = <String, int>{};
    if (data == null) return map;
    for (final ach in data!.achievements) {
      map[ach.groupId] = (map[ach.groupId] ?? 0) + 1;
    }
    return map;
  }

  /// Thống kê số lượng mở khóa theo nhóm
  Map<String, int> get groupUnlockedCounts {
    final map = <String, int>{};
    if (data == null) return map;
    for (final ach in data!.achievements) {
      if (ach.isUnlocked) {
        map[ach.groupId] = (map[ach.groupId] ?? 0) + 1;
      }
    }
    return map;
  }

  /// Thống kê số lượng theo cấp độ
  Map<int, int> get tierCounts {
    final map = <int, int>{};
    if (data == null) return map;
    for (final ach in data!.achievements) {
      map[ach.tier] = (map[ach.tier] ?? 0) + 1;
    }
    return map;
  }

  @override
  List<Object?> get props => [
        status,
        data,
        selectedGroup,
        selectedTier,
        filterStatus,
        searchQuery,
        selectedAchievement,
        showCelebration,
        errorMessage,
      ];
}

