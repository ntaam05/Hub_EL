BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [image] NVARCHAR(1000),
    [username] NVARCHAR(1000),
    [password] NVARCHAR(1000),
    [avatar] NVARCHAR(1000),
    [fullName] NVARCHAR(1000),
    [emailVerified] DATETIME2,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'student',
    [isActive] BIT NOT NULL CONSTRAINT [users_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [level] INT NOT NULL CONSTRAINT [users_level_df] DEFAULT 1,
    [xp] INT NOT NULL CONSTRAINT [users_xp_df] DEFAULT 0,
    [freeCoins] INT NOT NULL CONSTRAINT [users_freeCoins_df] DEFAULT 0,
    [aiTokens] INT NOT NULL CONSTRAINT [users_aiTokens_df] DEFAULT 0,
    [premiumCoins] INT NOT NULL CONSTRAINT [users_premiumCoins_df] DEFAULT 0,
    [stardust] INT NOT NULL CONSTRAINT [users_stardust_df] DEFAULT 0,
    [pitySR] INT NOT NULL CONSTRAINT [users_pitySR_df] DEFAULT 0,
    [pitySSR] INT NOT NULL CONSTRAINT [users_pitySSR_df] DEFAULT 0,
    [pityUR] INT NOT NULL CONSTRAINT [users_pityUR_df] DEFAULT 0,
    [isPro] BIT NOT NULL CONSTRAINT [users_isPro_df] DEFAULT 0,
    [premiumExpiresAt] DATETIME2,
    [gracePeriodEndsAt] DATETIME2,
    [lastDailyCoinGrant] DATETIME2,
    [currentStreak] INT NOT NULL CONSTRAINT [users_currentStreak_df] DEFAULT 0,
    [highestStreak] INT NOT NULL CONSTRAINT [users_highestStreak_df] DEFAULT 0,
    [lastStudyDate] DATETIME2,
    [streakFreezes] INT NOT NULL CONSTRAINT [users_streakFreezes_df] DEFAULT 0,
    [targetLanguage] NVARCHAR(1000) CONSTRAINT [users_targetLanguage_df] DEFAULT 'en',
    [languageLevel] NVARCHAR(1000) CONSTRAINT [users_languageLevel_df] DEFAULT 'A2',
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [users_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[user_stats] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [totalVideoWatched] INT NOT NULL CONSTRAINT [user_stats_totalVideoWatched_df] DEFAULT 0,
    [totalStudySeconds] INT NOT NULL CONSTRAINT [user_stats_totalStudySeconds_df] DEFAULT 0,
    [correctQuizAnswers] INT NOT NULL CONSTRAINT [user_stats_correctQuizAnswers_df] DEFAULT 0,
    [totalQuizAttempts] INT NOT NULL CONSTRAINT [user_stats_totalQuizAttempts_df] DEFAULT 0,
    [learnedWordsCount] INT NOT NULL CONSTRAINT [user_stats_learnedWordsCount_df] DEFAULT 0,
    [totalGachaPulls] INT NOT NULL CONSTRAINT [user_stats_totalGachaPulls_df] DEFAULT 0,
    [sharedCardsCount] INT NOT NULL CONSTRAINT [user_stats_sharedCardsCount_df] DEFAULT 0,
    [messagesSentCount] INT NOT NULL CONSTRAINT [user_stats_messagesSentCount_df] DEFAULT 0,
    CONSTRAINT [user_stats_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_stats_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[categories] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(500),
    CONSTRAINT [categories_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categories_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[videos] (
    [id] INT NOT NULL IDENTITY(1,1),
    [categoryId] INT,
    [youtubeUrl] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(255) NOT NULL,
    [channelName] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max),
    [thumbnail] NVARCHAR(500) NOT NULL,
    [duration] INT NOT NULL,
    [addedByUserId] NVARCHAR(1000),
    [likesCount] INT NOT NULL CONSTRAINT [videos_likesCount_df] DEFAULT 0,
    [dislikesCount] INT NOT NULL CONSTRAINT [videos_dislikesCount_df] DEFAULT 0,
    CONSTRAINT [videos_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [videos_youtubeUrl_key] UNIQUE NONCLUSTERED ([youtubeUrl])
);

-- CreateTable
CREATE TABLE [dbo].[quizzes] (
    [id] INT NOT NULL IDENTITY(1,1),
    [videoId] INT NOT NULL,
    [triggerAtSecond] INT NOT NULL,
    [question] NVARCHAR(max) NOT NULL,
    [explanation] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [quizzes_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [quizzes_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[quiz_options] (
    [id] INT NOT NULL IDENTITY(1,1),
    [quizId] INT NOT NULL,
    [content] NVARCHAR(500) NOT NULL,
    [isCorrect] BIT NOT NULL CONSTRAINT [quiz_options_isCorrect_df] DEFAULT 0,
    CONSTRAINT [quiz_options_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[wiki_cards] (
    [id] INT NOT NULL IDENTITY(1,1),
    [wikiUrl] NVARCHAR(1000),
    [title] NVARCHAR(255) NOT NULL,
    [rarity] NVARCHAR(1000) NOT NULL CONSTRAINT [wiki_cards_rarity_df] DEFAULT 'R',
    [imageUrl] NVARCHAR(1000),
    [aiContent] NVARCHAR(max) NOT NULL,
    [totalStars] INT NOT NULL CONSTRAINT [wiki_cards_totalStars_df] DEFAULT 1,
    [awakenedStars] INT NOT NULL CONSTRAINT [wiki_cards_awakenedStars_df] DEFAULT 0,
    [contentText] NVARCHAR(max),
    [chunkData] NVARCHAR(max),
    CONSTRAINT [wiki_cards_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [wiki_cards_wikiUrl_key] UNIQUE NONCLUSTERED ([wikiUrl])
);

-- CreateTable
CREATE TABLE [dbo].[user_inventory] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [cardId] INT NOT NULL,
    [acquiredAt] DATETIME2 NOT NULL CONSTRAINT [user_inventory_acquiredAt_df] DEFAULT CURRENT_TIMESTAMP,
    [isNew] BIT NOT NULL CONSTRAINT [user_inventory_isNew_df] DEFAULT 1,
    [currentStar] INT NOT NULL CONSTRAINT [user_inventory_currentStar_df] DEFAULT 0,
    [canShareCount] INT NOT NULL CONSTRAINT [user_inventory_canShareCount_df] DEFAULT 1,
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [user_inventory_source_df] DEFAULT 'GACHA',
    [isCompleted] BIT NOT NULL CONSTRAINT [user_inventory_isCompleted_df] DEFAULT 0,
    CONSTRAINT [user_inventory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_inventory_userId_cardId_key] UNIQUE NONCLUSTERED ([userId],[cardId])
);

-- CreateTable
CREATE TABLE [dbo].[wiki_quiz_attempts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [cardId] INT NOT NULL,
    [score] FLOAT(53) NOT NULL,
    [correctCount] INT NOT NULL,
    [totalQuizzes] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [wiki_quiz_attempts_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [userAnswers] NVARCHAR(max),
    [lessonSnapshot] NVARCHAR(max),
    CONSTRAINT [wiki_quiz_attempts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[vocabularies] (
    [id] INT NOT NULL IDENTITY(1,1),
    [cardId] INT NOT NULL,
    [word] NVARCHAR(255) NOT NULL,
    [pos] NVARCHAR(1000),
    [meaning] NVARCHAR(500) NOT NULL,
    [englishDesc] TEXT,
    CONSTRAINT [vocabularies_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[daily_gachas] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [date] DATE NOT NULL CONSTRAINT [daily_gachas_date_df] DEFAULT CURRENT_TIMESTAMP,
    [cardListIds] NVARCHAR(max) NOT NULL,
    [claimedIds] NVARCHAR(1000) NOT NULL CONSTRAINT [daily_gachas_claimedIds_df] DEFAULT '[]',
    CONSTRAINT [daily_gachas_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [daily_gachas_userId_date_key] UNIQUE NONCLUSTERED ([userId],[date])
);

-- CreateTable
CREATE TABLE [dbo].[user_progress] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [videoId] INT NOT NULL,
    [lastWatched] INT NOT NULL CONSTRAINT [user_progress_lastWatched_df] DEFAULT 0,
    [isCompleted] BIT NOT NULL CONSTRAINT [user_progress_isCompleted_df] DEFAULT 0,
    CONSTRAINT [user_progress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_progress_userId_videoId_key] UNIQUE NONCLUSTERED ([userId],[videoId])
);

-- CreateTable
CREATE TABLE [dbo].[quiz_attempts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [videoId] INT NOT NULL,
    [score] FLOAT(53) NOT NULL,
    [correctCount] INT NOT NULL,
    [totalQuizzes] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [quiz_attempts_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [quiz_attempts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[daily_tasks] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskDesc] NVARCHAR(255) NOT NULL,
    [taskType] NVARCHAR(1000) NOT NULL CONSTRAINT [daily_tasks_taskType_df] DEFAULT 'GENERAL',
    [target] INT NOT NULL CONSTRAINT [daily_tasks_target_df] DEFAULT 1,
    [rewardCoins] INT NOT NULL CONSTRAINT [daily_tasks_rewardCoins_df] DEFAULT 10,
    [rewardXp] INT NOT NULL CONSTRAINT [daily_tasks_rewardXp_df] DEFAULT 0,
    CONSTRAINT [daily_tasks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[user_task_progress] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [taskId] INT NOT NULL,
    [current] INT NOT NULL CONSTRAINT [user_task_progress_current_df] DEFAULT 0,
    [isClaimed] BIT NOT NULL CONSTRAINT [user_task_progress_isClaimed_df] DEFAULT 0,
    [assignedDate] DATE NOT NULL CONSTRAINT [user_task_progress_assignedDate_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [user_task_progress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_task_progress_userId_taskId_assignedDate_key] UNIQUE NONCLUSTERED ([userId],[taskId],[assignedDate])
);

-- CreateTable
CREATE TABLE [dbo].[achievements] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(500) NOT NULL,
    [rewardXp] INT NOT NULL CONSTRAINT [achievements_rewardXp_df] DEFAULT 100,
    CONSTRAINT [achievements_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [achievements_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[user_achievements] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [achievementId] INT NOT NULL,
    [unlockedAt] DATETIME2 NOT NULL CONSTRAINT [user_achievements_unlockedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [user_achievements_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_achievements_userId_achievementId_key] UNIQUE NONCLUSTERED ([userId],[achievementId])
);

-- CreateTable
CREATE TABLE [dbo].[chat_messages] (
    [id] INT NOT NULL IDENTITY(1,1),
    [senderId] NVARCHAR(1000) NOT NULL,
    [receiverId] NVARCHAR(1000),
    [groupId] INT,
    [content] NVARCHAR(max) NOT NULL,
    [isGiftCard] BIT NOT NULL CONSTRAINT [chat_messages_isGiftCard_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [chat_messages_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [chat_messages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[chat_groups] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [isVideoGroup] BIT NOT NULL CONSTRAINT [chat_groups_isVideoGroup_df] DEFAULT 0,
    [videoId] INT,
    CONSTRAINT [chat_groups_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [chat_groups_videoId_key] UNIQUE NONCLUSTERED ([videoId])
);

-- CreateTable
CREATE TABLE [dbo].[group_members] (
    [id] INT NOT NULL IDENTITY(1,1),
    [groupId] INT NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [joinedAt] DATETIME2 NOT NULL CONSTRAINT [group_members_joinedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [group_members_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [group_members_groupId_userId_key] UNIQUE NONCLUSTERED ([groupId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[friendships] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId1] NVARCHAR(1000) NOT NULL,
    [userId2] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [friendships_status_df] DEFAULT 'PENDING',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [friendships_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [friendships_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [friendships_userId1_userId2_key] UNIQUE NONCLUSTERED ([userId1],[userId2])
);

-- CreateTable
CREATE TABLE [dbo].[subscription_plans] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [durationDay] INT NOT NULL,
    CONSTRAINT [subscription_plans_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[coin_packages] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [coinAmount] INT NOT NULL,
    CONSTRAINT [coin_packages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[orders] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orderCode] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [planId] INT,
    [packageId] INT,
    [amount] FLOAT(53) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [orders_status_df] DEFAULT 'PENDING',
    [momoTransId] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [orders_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [orders_orderCode_key] UNIQUE NONCLUSTERED ([orderCode])
);

-- CreateTable
CREATE TABLE [dbo].[coin_transactions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [amount] INT NOT NULL,
    [currencyType] NVARCHAR(1000) NOT NULL CONSTRAINT [coin_transactions_currencyType_df] DEFAULT 'FREE',
    [reason] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [coin_transactions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [coin_transactions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[streak_freeze_usage] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [usedAt] DATETIME2 NOT NULL CONSTRAINT [streak_freeze_usage_usedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [streak_freeze_usage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[accounts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [providerAccountId] NVARCHAR(1000) NOT NULL,
    [refresh_token] TEXT,
    [access_token] TEXT,
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [id_token] TEXT,
    [session_state] NVARCHAR(1000),
    CONSTRAINT [accounts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [accounts_provider_providerAccountId_key] UNIQUE NONCLUSTERED ([provider],[providerAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[sessions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sessionToken] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sessions_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [wiki_cards_rarity_idx] ON [dbo].[wiki_cards]([rarity]);

-- AddForeignKey
ALTER TABLE [dbo].[user_stats] ADD CONSTRAINT [user_stats_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[videos] ADD CONSTRAINT [videos_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[categories]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[videos] ADD CONSTRAINT [videos_addedByUserId_fkey] FOREIGN KEY ([addedByUserId]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[quizzes] ADD CONSTRAINT [quizzes_videoId_fkey] FOREIGN KEY ([videoId]) REFERENCES [dbo].[videos]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[quiz_options] ADD CONSTRAINT [quiz_options_quizId_fkey] FOREIGN KEY ([quizId]) REFERENCES [dbo].[quizzes]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_inventory] ADD CONSTRAINT [user_inventory_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_inventory] ADD CONSTRAINT [user_inventory_cardId_fkey] FOREIGN KEY ([cardId]) REFERENCES [dbo].[wiki_cards]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[wiki_quiz_attempts] ADD CONSTRAINT [wiki_quiz_attempts_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[wiki_quiz_attempts] ADD CONSTRAINT [wiki_quiz_attempts_cardId_fkey] FOREIGN KEY ([cardId]) REFERENCES [dbo].[wiki_cards]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[vocabularies] ADD CONSTRAINT [vocabularies_cardId_fkey] FOREIGN KEY ([cardId]) REFERENCES [dbo].[wiki_cards]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[daily_gachas] ADD CONSTRAINT [daily_gachas_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_progress] ADD CONSTRAINT [user_progress_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_progress] ADD CONSTRAINT [user_progress_videoId_fkey] FOREIGN KEY ([videoId]) REFERENCES [dbo].[videos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[quiz_attempts] ADD CONSTRAINT [quiz_attempts_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[quiz_attempts] ADD CONSTRAINT [quiz_attempts_videoId_fkey] FOREIGN KEY ([videoId]) REFERENCES [dbo].[videos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_task_progress] ADD CONSTRAINT [user_task_progress_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_task_progress] ADD CONSTRAINT [user_task_progress_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[daily_tasks]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_achievements] ADD CONSTRAINT [user_achievements_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_achievements] ADD CONSTRAINT [user_achievements_achievementId_fkey] FOREIGN KEY ([achievementId]) REFERENCES [dbo].[achievements]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[chat_messages] ADD CONSTRAINT [chat_messages_senderId_fkey] FOREIGN KEY ([senderId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[chat_messages] ADD CONSTRAINT [chat_messages_receiverId_fkey] FOREIGN KEY ([receiverId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[chat_messages] ADD CONSTRAINT [chat_messages_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[chat_groups]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[chat_groups] ADD CONSTRAINT [chat_groups_videoId_fkey] FOREIGN KEY ([videoId]) REFERENCES [dbo].[videos]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[group_members] ADD CONSTRAINT [group_members_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[chat_groups]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[group_members] ADD CONSTRAINT [group_members_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[friendships] ADD CONSTRAINT [friendships_userId1_fkey] FOREIGN KEY ([userId1]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[friendships] ADD CONSTRAINT [friendships_userId2_fkey] FOREIGN KEY ([userId2]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_planId_fkey] FOREIGN KEY ([planId]) REFERENCES [dbo].[subscription_plans]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_packageId_fkey] FOREIGN KEY ([packageId]) REFERENCES [dbo].[coin_packages]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[coin_transactions] ADD CONSTRAINT [coin_transactions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[streak_freeze_usage] ADD CONSTRAINT [streak_freeze_usage_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[accounts] ADD CONSTRAINT [accounts_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sessions] ADD CONSTRAINT [sessions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
