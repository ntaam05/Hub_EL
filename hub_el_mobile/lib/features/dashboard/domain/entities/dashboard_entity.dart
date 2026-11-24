class ContinueLearningEntity {
  final String videoId;
  final String title;
  final String course;
  final String thumbnailUrl;
  final int progress;
  final String timeLeft;
  final int lastWatched;

  const ContinueLearningEntity({
    required this.videoId,
    required this.title,
    required this.course,
    required this.thumbnailUrl,
    required this.progress,
    required this.timeLeft,
    required this.lastWatched,
  });
}

class DailyTaskEntity {
  final int id;
  final int taskId;
  final int current;
  final bool isClaimed;
  final String taskDesc;
  final String taskType;
  final int target;
  final int rewardCoins;
  final int rewardXp;
  final bool isProOnly;

  const DailyTaskEntity({
    required this.id,
    required this.taskId,
    required this.current,
    required this.isClaimed,
    required this.taskDesc,
    required this.taskType,
    required this.target,
    required this.rewardCoins,
    required this.rewardXp,
    required this.isProOnly,
  });

  bool get isCompleted => current >= target;
  double get percent => target > 0 ? (current / target).clamp(0.0, 1.0) : 0.0;
}

class DashboardVideoEntity {
  final String videoId;
  final String title;
  final String channelTitle;
  final String thumbnailUrl;

  const DashboardVideoEntity({
    required this.videoId,
    required this.title,
    required this.channelTitle,
    required this.thumbnailUrl,
  });
}

class RecentActivityEntity {
  final String id;
  final String type; // 'VIDEO', 'QUIZ', 'RETAKE_QUIZ', 'COURSE', 'ACHIEVEMENT', 'GACHA', 'WIKI'
  final String action;
  final String title;
  final String context;
  final String timestamp;

  const RecentActivityEntity({
    required this.id,
    required this.type,
    required this.action,
    required this.title,
    required this.context,
    required this.timestamp,
  });
}

class DashboardDataEntity {
  final int streak;
  final int highestStreak;
  final int completedVideosCount;
  final ContinueLearningEntity? continueLearning;
  final List<DailyTaskEntity> dailyTasks;
  final List<DashboardVideoEntity> recommendedVideos;
  final List<DashboardVideoEntity> favoriteVideos;
  final List<RecentActivityEntity> recentActivities;

  const DashboardDataEntity({
    required this.streak,
    required this.highestStreak,
    required this.completedVideosCount,
    this.continueLearning,
    required this.dailyTasks,
    required this.recommendedVideos,
    required this.favoriteVideos,
    required this.recentActivities,
  });
}

