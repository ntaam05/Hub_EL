/// Danh sách tập trung tất cả các API Endpoints của Hub-EL
/// Đồng bộ theo đúng đặc tả API_CONTRACT.md và BACKEND_ANALYSIS.md
abstract class ApiEndpoints {
  // ==========================================
  // 1. AUTHENTICATION & USER SESSION
  // ==========================================
  static const String login = '/api/v1/auth/login';
  static const String register = '/api/v1/auth/register';
  static const String forgotPassword = '/api/v1/auth/forgot-password';
  static const String verifyResetPassword = '/api/v1/auth/verify-reset-password';
  static const String google = '/api/v1/auth/google';
  static const String oauthGoogle = '/api/v1/auth/google';
  static const String refreshToken = '/api/v1/auth/refresh';
  static const String logout = '/api/v1/auth/logout';
  static const String me = '/api/v1/auth/me';

  // ==========================================
  // 2. DASHBOARD & QUESTS
  // ==========================================
  static const String dashboard = '/api/v1/dashboard';
  static const String dashboardStats = '/api/v1/dashboard';
  static const String dashboardTasks = '/api/v1/dashboard/tasks';
  static String claimTaskReward(int taskId) => '/api/v1/dashboard/tasks/$taskId/claim';

  // ==========================================
  // 3. VIDEO LEARNING & AI QUIZ
  // ==========================================
  static const String videoSearch = '/api/v1/videos/search';
  static const String videoCheck = '/api/v1/videos/check';
  static const String videoValidateLink = '/api/v1/videos/check';
  static const String videoGenerateQuiz = '/api/v1/videos/quiz/generate';
  static const String videoProgress = '/api/v1/videos/progress';
  static const String videoProgressSync = '/api/v1/videos/progress/sync';
  static const String videoProgressComplete = '/api/v1/videos/progress/complete';
  static const String videoSubmitQuiz = '/api/v1/videos/quiz/submit';
  static const String quizHistory = '/api/v1/learning/quizzes/history';
  static const String courses = '/api/v1/courses';
  static const String playlistItems = '/api/v1/videos/playlist';
  static String playlistDetail(String playlistId) => '/api/v1/videos/playlist?playlistId=$playlistId';
  static String playlistProgress(String playlistId) => '/api/v1/courses?playlistId=$playlistId';
  static const String favoriteVideos = '/api/v1/videos/favorite';
  static String checkFavoriteVideo(String videoId) => '/api/v1/videos/favorite?videoId=$videoId';
  static const String userFullStats = '/api/v1/stats';
  static String videoDetail(String videoId) => '/api/v1/videos/$videoId';
  static String videoRelated(String videoId) => '/api/v1/videos/$videoId/related';

  // ==========================================
  // 4. WIKI LANGUAGE & GACHA
  // ==========================================
  static const String wikiInventory = '/api/v1/wiki/inventory';
  static String wikiCardDetail(int cardId) => '/api/v1/wiki/cards/$cardId';
  static const String wikiStudyGenerate = '/api/v1/wiki/study/generate';
  static const String wikiStudyFinish = '/api/v1/wiki/study/finish';
  static const String wikiStudyKeepStar = '/api/v1/wiki/study/keep-star';
  static const String vocabulary = '/api/v1/vocabulary';
  static String wikiGenerateLesson(int cardId) => '/api/v1/wiki/study/generate';
  static String wikiSubmitQuiz(int cardId) => '/api/v1/wiki/study/finish';
  static String wikiKeepStar(int cardId) => '/api/v1/wiki/study/keep-star';

  static const String gachaStatus = '/api/v1/gacha/status';
  static const String gachaRoll = '/api/v1/gacha/roll';
  static const String gachaExchange = '/api/v1/gacha/exchange';
  static const String gachaHistory = '/api/v1/gacha/history';

  // ==========================================
  // 5. SOCIAL & FRIENDS (HTTP REST)
  // ==========================================
  static const String friendsList = '/api/v1/friends';
  static const String friendsSearch = '/api/v1/friends/search';
  static const String friendRequests = '/api/v1/friends/requests';
  static const String friendSentRequests = '/api/v1/friends/requests/sent';
  static const String sendFriendRequest = '/api/v1/friends/requests';
  static String respondFriendRequest(int requestId) => '/api/v1/friends/requests/$requestId/respond';
  static String cancelFriendRequest(dynamic requestId) => '/api/v1/friends/requests/$requestId';
  static String removeFriend(String targetUserId) => '/api/v1/friends/$targetUserId';
  static String blockUser(String targetUserId) => '/api/v1/friends/$targetUserId/block';
  static String unblockUser(String targetUserId) => '/api/v1/friends/$targetUserId/block';
  static const String blockedUsers = '/api/v1/friends/blocked';
  static String userProfile(String targetUserId) => '/api/v1/users/$targetUserId/profile';

  // Chat & Realtime Messaging Endpoints
  static const String chatHistory = '/api/v1/chat/history';
  static const String chatSend = '/api/v1/chat/send';
  static const String chatClaimGift = '/api/v1/chat/claim-gift';
  static const String chatCards = '/api/v1/chat/cards';
  static const String socialChatHistory = '/api/v1/chat/history';
  static const String uploadMessageAttachment = '/api/upload/message';

  // ==========================================
  // 6. STORE & MOMO PAYMENT GATEWAY
  // ==========================================
  static const String storeCatalog = '/api/v1/store';
  static const String storeExchange = '/api/v1/store/exchange';
  static const String storeTransactions = '/api/v1/store/transactions';
  static const String storeMomoCreate = '/api/v1/store/momo/create';
  static const String storeMomoCheckStatus = '/api/v1/store/momo/check-status';
  static const String momoCreate = '/api/v1/store/momo/create';
  static const String momoCheckStatus = '/api/v1/store/momo/check-status';

  // ==========================================
  // 7. LEADERBOARD & ACHIEVEMENTS
  // ==========================================
  static const String leaderboard = '/api/v1/leaderboard';
  static const String achievements = '/api/v1/achievements';

  // ==========================================
  // 8. VOCABULARY NOTEBOOK
  // ==========================================
  static const String vocabularyList = '/api/v1/vocabulary';
  static String vocabularyContext(int cardId, String word) =>
      '/api/v1/vocabulary/context?cardId=$cardId&word=${Uri.encodeComponent(word)}';
  static String vocabularyDetail(int id) => '/api/v1/vocabulary/$id';

  // ==========================================
  // 9. PROFILE & USER SETTINGS
  // ==========================================
  static const String settingsProfile = '/api/v1/settings/profile';
  static const String settingsAvatar = '/api/v1/settings/avatar';
  static const String settingsSecurity = '/api/v1/settings/security';
  static const String settingsSendOtp = '/api/v1/settings/security/send-otp';
  static const String settingsVerifyOtp = '/api/v1/settings/security/verify-otp';
  static const String settingsChangePassword = '/api/v1/settings/security/change-password';
  static const String settingsResetPassword = '/api/v1/settings/security/reset-password';
  static const String settingsPrivacy = '/api/v1/settings/privacy';
  static const String settingsNotifications = '/api/v1/settings/notifications';
  static const String settingsDeleteAccount = '/api/v1/settings/security/delete-account';
  static const String settingsInterests = '/api/v1/settings/interests';
  static const String feedback = '/api/v1/feedback';

  // Legacy mappings for backward compatibility
  static const String updateProfile = '/api/v1/settings/profile';
  static const String updateSecurity = '/api/v1/settings/security';
  static const String updateSettings = '/api/v1/settings/profile';
}

