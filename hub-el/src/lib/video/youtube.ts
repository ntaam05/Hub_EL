import { prisma } from "@/lib/prisma";
import { SearchRequest, VideoDTO } from "@/types/video/video";
import { YoutubeTranscript } from 'youtube-transcript';

// Chiến thuật lọc từ khoá
const BLACKLIST_ACTIONS = ["chơi", "leo rank", "highlight", "giải đấu", "stream", "reaction", "hài", "phim", "nhạc", "giải trí", "tiktok", "troll", "vlog", "review game"];
const WHITELIST_EDU_TERMS = ["học", "hướng dẫn", "tutorial", "course", "bài giảng", "lập trình", "cơ bản", "nâng cao", "khóa học", "lý thuyết", "thực hành", "chia sẻ", "tự học", "code", "it", "developer", "chuyên sâu", "tìm hiểu", "khoa hoc"];

function getApiKey() {
  const keys = (process.env.YOUTUBE_API_KEYS || "").split(",");
  return keys[Math.floor(Math.random() * keys.length)]?.trim();
}

function calculateRelevance(keyword: string, title: string, desc: string): number {
  const kw = keyword.toLowerCase();
  let score = 0.0;
  if (title.includes(kw)) score += 0.7;
  if (desc.includes(kw)) score += 0.1;
  return Math.min(score, 1.0);
}

// 1. TÌM KIẾM NÂNG CAO VÀ RANKING
export async function advancedSearchAndRank(request: SearchRequest, pageToken?: string) {
  const keyword = request.keyword.toLowerCase().trim();

  if (BLACKLIST_ACTIONS.some(action => keyword.includes(action))) {
    throw new Error("NON_EDUCATIONAL_INTENT");
  }

  try {
    const tokenKey = !pageToken ? "FIRST" : pageToken;
    const cacheKey = `SEARCH_${keyword}_V12_${tokenKey}`;

    // CHECK CACHE (24h)
    const cachedOpt = await prisma.youtubeSearchCache.findUnique({ where: { cacheKey } });
    if (cachedOpt) {
      const isStillValid = cachedOpt.lastUpdated.getTime() + 7 * 24 * 60 * 60 * 1000 > Date.now();
      if (isStillValid) {
        console.log(`⚡ [CACHE HIT] Lay du lieu Tim Kiem tu DB cho: ${keyword}`);
        return JSON.parse(cachedOpt.responseJson);
      }
    }

    console.log(`🌐 [API CALL] Đang gọi YouTube API Tìm Kiếm cho: ${keyword}`);
    
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("maxResults", "50");
    searchUrl.searchParams.set("type", "video,playlist,channel");
    searchUrl.searchParams.set("q", keyword);
    searchUrl.searchParams.set("key", getApiKey());
    if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

    const searchRes = await fetch(searchUrl.toString()).then(res => res.json());
    
    let rankedItems: VideoDTO[] = [];
    const videoIds = new Set<string>();
    const nextToken = searchRes.nextPageToken || null;

    if (searchRes.items) {
      for (const item of searchRes.items) {
        const idNode = item.id;
        const snippet = item.snippet;
        const title = snippet.title.toLowerCase();
        const desc = snippet.description.toLowerCase();

        if (BLACKLIST_ACTIONS.some(a => title.includes(a))) continue;
        const hasEduContext = WHITELIST_EDU_TERMS.some(term => title.includes(term) || desc.includes(term));

        if (idNode.videoId) {
          if (!hasEduContext) continue;
          videoIds.add(idNode.videoId);
        } else if (idNode.playlistId) {
          if (!hasEduContext) continue;
          rankedItems.push({
            videoId: idNode.playlistId, type: "playlist", title: snippet.title,
            channelTitle: snippet.channelTitle, thumbnailUrl: snippet.thumbnails.high.url, score: 0.5
          });
        } else if (idNode.channelId) {
          rankedItems.push({
            videoId: idNode.channelId, type: "channel", title: snippet.title,
            channelTitle: snippet.channelTitle, thumbnailUrl: snippet.thumbnails.high.url, score: 0.5
          });
        }
      }
    }

    // Lấy ViewCount cho video
    if (videoIds.size > 0) {
      const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      detailUrl.searchParams.set("part", "snippet,statistics,contentDetails");
      detailUrl.searchParams.set("id", Array.from(videoIds).join(","));
      detailUrl.searchParams.set("key", getApiKey());

      const detailRes = await fetch(detailUrl.toString()).then(res => res.json());
      if (detailRes.items) {
        for (const item of detailRes.items) {
          const snippet = item.snippet;
          const categoryId = snippet.categoryId || "";
          
          if (categoryId !== "27" && categoryId !== "28" && categoryId !== "26") continue;

          const stats = item.statistics;
          const views = stats.viewCount ? parseInt(stats.viewCount, 10) : 0;
          
          rankedItems.push({
            videoId: item.id,
            type: "video",
            title: snippet.title,
            channelTitle: snippet.channelTitle,
            thumbnailUrl: snippet.thumbnails?.high?.url,
            viewCount: views,
            score: calculateRelevance(keyword, snippet.title.toLowerCase(), snippet.description.toLowerCase())
          });
        }
      }
    }

    rankedItems.sort((a, b) => {
      if (a.type === "channel" && b.type !== "channel") return -1;
      if (a.type !== "channel" && b.type === "channel") return 1;
      return (b.score || 0) - (a.score || 0);
    });

    const responseData = { items: rankedItems, nextPageToken: nextToken };

    // LƯU CACHE
    try {
      await prisma.youtubeSearchCache.upsert({
        where: { cacheKey },
        update: { responseJson: JSON.stringify(responseData), lastUpdated: new Date() },
        create: { cacheKey, responseJson: JSON.stringify(responseData), lastUpdated: new Date() }
      });
    } catch (e: any) {
      console.error("⚠️ Lỗi lưu Cache Search:", e.message);
    }

    return responseData;
  } catch (error: any) {
    console.error("Lỗi Tìm kiếm:", error.message);
    throw new Error("Lỗi lấy dữ liệu YouTube");
  }
}

// 2. VIDEO LIÊN QUAN TỰ ĐỘNG BẰNG AI NLP
export async function getRelatedVideos(videoId: string) {
  try {
    const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailUrl.searchParams.set("part", "snippet");
    detailUrl.searchParams.set("id", videoId);
    detailUrl.searchParams.set("key", getApiKey());

    const detailRes = await fetch(detailUrl.toString()).then(res => res.json());
    if (!detailRes.items || detailRes.items.length === 0) return [];

    const realTitle = detailRes.items[0].snippet.title;
    const cleanTitle = realTitle.replace(/\[.*?\]|\(.*?\)/g, "").replace(/[^a-zA-Z0-9\p{L}\s]/gu, " ").trim();
    const words = cleanTitle.split(/\s+/);
    const smartKeyword = words.slice(0, Math.min(words.length, 7)).join(" ");

    console.log(`🤖 [AI NLP] Tự động trích xuất Keyword Đề xuất: ${smartKeyword}`);

    const searchResult = await advancedSearchAndRank({ keyword: smartKeyword });
    return searchResult.items || [];
  } catch (error: any) {
    console.error("❌ Lỗi khi tìm video đề xuất:", error.message);
    return [];
  }
}

// 3. LẤY CONTEXT ĐỂ TRUYỀN CHO AI GEMINI TẠO TRẮC NGHIỆM
export async function getVideoContext(videoId: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", getApiKey());

  try {
    // 1. Lấy Tiêu đề và Mô tả từ YouTube API (Logic cũ vẫn giữ nguyên để làm backup)
    const response = await fetch(url.toString()).then(res => res.json());
    let title = "";
    let description = "";

    if (response.items && response.items.length > 0) {
      const snippet = response.items[0].snippet;
      title = snippet.title;
      description = snippet.description;
    } else {
      return "Video này là bài giảng hướng dẫn lập trình thực chiến..."; 
    }

    // 2. Cào Phụ đề bằng youtube-transcript 
    let transcriptText = "";
    try {
      console.log(`🎬 Đang cào phụ đề cho video ID: ${videoId}...`);
      const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
      
      transcriptText = transcriptArray.map(item => item.text).join(' ');
      console.log(`✅ Cào phụ đề thành công! (Độ dài: ${transcriptText.length} ký tự)`);
    } catch (transcriptError: any) {
      console.warn(`⚠️ Video không có phụ đề hoặc bị tắt: ${transcriptError.message}`);
    }

    // 3. Gộp dữ liệu và đóng gói Context
    let fullContext = `Tiêu đề video: ${title}\n`;
    fullContext += `Nội dung/Mô tả: ${description}\n`;

    if (transcriptText) {
      fullContext += `\nLời thoại trong video (Phụ đề): ${transcriptText}`;
    }

    // 4. CHỐT CHẶN BẢO MẬT: Giới hạn ký tự (Chống tràn Quota API Gemini)
    if (fullContext.length > 6000) {
        fullContext = fullContext.substring(0, 8000) + "... [Nội dung đã được cắt bớt để tối ưu hệ thống AI]";
    }

    return fullContext;

  } catch (e) {
    console.error("⚠️ Lỗi gọi YouTube Detail (Hết Quota) - Đã dùng Context Giả lập cho AI.");
    return "Video này là bài giảng hướng dẫn lập trình thực chiến...";
  }
}

// 4. LẤY CHI TIẾT PLAYLIST
export async function getPlaylistItems(playlistId: string, pageToken?: string, maxResults = 50) {
  try {
    const tokenKey = !pageToken ? "FIRST" : pageToken;
    const cacheKey = `PLAYLIST_${playlistId}_V12_${tokenKey}`;

    const cachedOpt = await prisma.youtubeSearchCache.findUnique({ where: { cacheKey } });
    if (cachedOpt) {
      const isStillValid = cachedOpt.lastUpdated.getTime() + 7 * 24 * 60 * 60 * 1000 > Date.now(); // 7day
      if (isStillValid) {
        console.log(`⚡ [CACHE HIT] Lấy dữ liệu Playlist từ DB cho ID: ${playlistId}`);
        return JSON.parse(cachedOpt.responseJson);
      }
    }

    console.log(`🌐 [API CALL] Đang gọi YouTube API cho Playlist ID: ${playlistId}`);
    
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", maxResults.toString());
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("key", getApiKey());
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url.toString()).then(res => res.json());
    const items: VideoDTO[] = [];
    const nextToken = response.nextPageToken || null;

    if (response.items) {
      for (const item of response.items) {
        const snippet = item.snippet;
        items.push({
          videoId: snippet.resourceId.videoId,
          type: "video",
          title: snippet.title,
          channelTitle: snippet.videoOwnerChannelTitle,
          thumbnailUrl: snippet.thumbnails?.high?.url
        });
      }
    }

    const result = { items, nextPageToken: nextToken };

    try {
      await prisma.youtubeSearchCache.upsert({
        where: { cacheKey },
        update: { responseJson: JSON.stringify(result), lastUpdated: new Date() },
        create: { cacheKey, responseJson: JSON.stringify(result), lastUpdated: new Date() }
      });
    } catch (e: any) {
      console.error("⚠️ Lỗi lưu Cache Playlist:", e.message);
    }

    return result;
  } catch (error: any) {
    console.error("Lỗi khi lấy chi tiết Playlist:", error.message);
    return { items: [] };
  }
}