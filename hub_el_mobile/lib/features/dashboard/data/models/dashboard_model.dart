import '../../domain/entities/dashboard_entity.dart';

class ContinueLearningModel extends ContinueLearningEntity {
  const ContinueLearningModel({
    required super.videoId,
    required super.title,
    required super.course,
    required super.thumbnailUrl,
    required super.progress,
    required super.timeLeft,
    required super.lastWatched,
  });

  factory ContinueLearningModel.fromJson(Map<String, dynamic> json) {
    return ContinueLearningModel(
      videoId: json['videoId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      course: json['course'] as String? ?? 'Khóa học Video',
      thumbnailUrl: json['thumbnailUrl'] as String? ?? '',
      progress: (json['progress'] as num?)?.toInt() ?? 0,
      timeLeft: json['timeLeft'] as String? ?? 'Đang học',
      lastWatched: (json['lastWatched'] as num?)?.toInt() ?? 0,
    );
  }
}

class DailyTaskModel extends DailyTaskEntity {
  const DailyTaskModel({
    required super.id,
    required super.taskId,
    required super.current,
    required super.isClaimed,
    required super.taskDesc,
    required super.taskType,
    required super.target,
    required super.rewardCoins,
    required super.rewardXp,
    required super.isProOnly,
  });

  factory DailyTaskModel.fromJson(Map<String, dynamic> json) {
    final taskObj = json['task'] as Map<String, dynamic>? ?? {};
    return DailyTaskModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      taskId: (json['taskId'] as num?)?.toInt() ?? 0,
      current: (json['current'] as num?)?.toInt() ?? 0,
      isClaimed: json['isClaimed'] as bool? ?? false,
      taskDesc: taskObj['taskDesc'] as String? ?? 'Nhiệm vụ',
      taskType: taskObj['taskType'] as String? ?? 'WATCH_VIDEO',
      target: (taskObj['target'] as num?)?.toInt() ?? 1,
      rewardCoins: (taskObj['rewardCoins'] as num?)?.toInt() ?? 0,
      rewardXp: (taskObj['rewardXp'] as num?)?.toInt() ?? 0,
      isProOnly: taskObj['isProOnly'] as bool? ?? false,
    );
  }
}

class DashboardVideoModel extends DashboardVideoEntity {
  const DashboardVideoModel({
    required super.videoId,
    required super.title,
    required super.channelTitle,
    required super.thumbnailUrl,
  });

  factory DashboardVideoModel.fromJson(Map<String, dynamic> json) {
    return DashboardVideoModel(
      videoId: json['videoId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      channelTitle: json['channelTitle'] as String? ?? '',
      thumbnailUrl: json['thumbnailUrl'] as String? ?? '',
    );
  }
}

class RecentActivityModel extends RecentActivityEntity {
  const RecentActivityModel({
    required super.id,
    required super.type,
    required super.action,
    required super.title,
    required super.context,
    required super.timestamp,
  });

  factory RecentActivityModel.fromJson(Map<String, dynamic> json) {
    return RecentActivityModel(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'VIDEO',
      action: json['action'] as String? ?? '',
      title: json['title'] as String? ?? '',
      context: json['context'] as String? ?? '',
      timestamp: json['timestamp'] as String? ?? '',
    );
  }
}

class DashboardDataModel extends DashboardDataEntity {
  const DashboardDataModel({
    required super.streak,
    required super.highestStreak,
    required super.completedVideosCount,
    super.continueLearning,
    required super.dailyTasks,
    required super.recommendedVideos,
    required super.favoriteVideos,
    required super.recentActivities,
  });

  factory DashboardDataModel.fromJson(Map<String, dynamic> json) {
    final continueMap = json['continueLearning'] as Map<String, dynamic>?;
    final dailyTasksList = (json['dailyTasks'] as List<dynamic>?)
            ?.map((e) => DailyTaskModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    final recommendedList = (json['recommendedVideos'] as List<dynamic>?)
            ?.map((e) => DashboardVideoModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    final favoriteList = (json['favoriteVideos'] as List<dynamic>?)
            ?.map((e) => DashboardVideoModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    final activitiesList = (json['recentActivities'] as List<dynamic>?)
            ?.map((e) => RecentActivityModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return DashboardDataModel(
      streak: (json['streak'] as num?)?.toInt() ?? 0,
      highestStreak: (json['highestStreak'] as num?)?.toInt() ?? 0,
      completedVideosCount: (json['completedVideosCount'] as num?)?.toInt() ?? 0,
      continueLearning:
          continueMap != null ? ContinueLearningModel.fromJson(continueMap) : null,
      dailyTasks: dailyTasksList,
      recommendedVideos: recommendedList,
      favoriteVideos: favoriteList,
      recentActivities: activitiesList,
    );
  }
}

