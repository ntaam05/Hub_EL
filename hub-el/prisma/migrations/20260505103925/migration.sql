BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[youtube_search_cache] (
    [cacheKey] NVARCHAR(500) NOT NULL,
    [responseJson] NVARCHAR(max) NOT NULL,
    [lastUpdated] DATETIME2 NOT NULL CONSTRAINT [youtube_search_cache_lastUpdated_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [youtube_search_cache_pkey] PRIMARY KEY CLUSTERED ([cacheKey])
);

-- CreateTable
CREATE TABLE [dbo].[favorite_videos] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [videoId] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000),
    [channelTitle] NVARCHAR(1000),
    [thumbnailUrl] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [favorite_videos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [favorite_videos_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [favorite_videos_userId_videoId_key] UNIQUE NONCLUSTERED ([userId],[videoId])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
