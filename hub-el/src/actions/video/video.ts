"use server";

import { SearchRequest } from "@/types/video/video";
import { advancedSearchAndRank, getRelatedVideos, getPlaylistItems } from "@/lib/video/youtube";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

// ==========================================
// HÀM LẤY TỪ KHÓA KIỂM DUYỆT TỪ DATABASE
// ==========================================
async function getActiveKeywords() {
  try {
    const keywords = await prisma.filterKeyword.findMany({
      where: { isActive: true }
    });
    const blacklist = keywords.filter(k => k.type === "BLACKLIST").map(k => k.word.toLowerCase());
    const whitelist = keywords.filter(k => k.type === "WHITELIST").map(k => k.word.toLowerCase());
    
    // Fallback mặc định phòng khi database trống trơn
    if (blacklist.length === 0 && whitelist.length === 0) {
       return {
         blacklist: ["chơi", "game", "giải trí", "nhạc", "phim", "tiktok", "troll", "hài"],
         whitelist: ["học", "hướng dẫn", "bài giảng", "khóa học", "tutorial", "lập trình"]
       };
    }
    return { blacklist, whitelist };
  } catch (error) {
    return { blacklist: [], whitelist: [] };
  }
}

// Hàm quét siêu tốc bằng từ khóa
function isEducationalFastCheck(title: string, channelName: string = "", blacklist: string[], whitelist: string[]) {
  const text = `${title} ${channelName}`.toLowerCase();
  for (const word of blacklist) {
    if (text.includes(word)) return false; 
  }
  for (const word of whitelist) {
    if (text.includes(word)) return true; 
  }
  return null; // Vùng xám
}

// ==========================================
// CÁC ACTION GỌI YOUTUBE API CÓ MÀNG LỌC
// ==========================================
export async function searchAdvancedAction(request: SearchRequest, pageToken?: string) {
  try {
    const result = await advancedSearchAndRank(request, pageToken);
    
    if (result && result.items) {
      const { blacklist, whitelist } = await getActiveKeywords();
      
      // Lấy danh sách video bị Cấm thủ công
      const bannedVideos = await prisma.moderatedVideo.findMany({
         where: { status: "BANNED" }, select: { videoId: true }
      });
      const bannedIds = bannedVideos.map(v => v.videoId);

      result.items = result.items.filter((video: any) => {
        if (bannedIds.includes(video.videoId)) return false; // Trúng chốt cấm thủ công
        const check = isEducationalFastCheck(video.title, video.channelTitle, blacklist, whitelist);
        return check !== false; 
      });
    }
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRelatedVideosAction(videoId: string) {
  try {
    const videos = await getRelatedVideos(videoId);
    const { blacklist, whitelist } = await getActiveKeywords();
    const bannedVideos = await prisma.moderatedVideo.findMany({
         where: { status: "BANNED" }, select: { videoId: true }
    });
    const bannedIds = bannedVideos.map(v => v.videoId);

    const cleanVideos = videos.filter((video: any) => {
         if (bannedIds.includes(video.videoId)) return false;
         return isEducationalFastCheck(video.title, video.channelTitle, blacklist, whitelist) !== false;
    });
    return { success: true, data: cleanVideos };
  } catch (error) {
    return { success: true, data: [] };
  }
}

export async function getPlaylistItemsAction(playlistId: string, pageToken?: string) {
  try {
    const items = await getPlaylistItems(playlistId, pageToken, 50);
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: `Lỗi lấy chi tiết: ${error.message}` };
  }
}

// ==========================================
// KIỂM DUYỆT BẢO VỆ CỔNG (Dành cho chức năng Nhập Link)
// ==========================================
export async function checkEducationalVideoAction(title: string, channelName: string, videoId?: string, userId?: string) {
  try {
    // 1. KIỂM TRA BẢNG DUYỆT THỦ CÔNG
    if (videoId) {
       const modRecord = await prisma.moderatedVideo.findUnique({ where: { videoId } });
       if (modRecord) {
           if (modRecord.status === "BANNED") return { success: true, isEducational: false, reason: "Video này đã bị Quản trị viên khóa do vi phạm nội quy học tập." };
           if (modRecord.status === "APPROVED") return { success: true, isEducational: true };
       }
    }

    const text = ` ${title} ${channelName} `.toLowerCase(); 
    const { blacklist, whitelist } = await getActiveKeywords();
    
    // 2. QUÉT TỪ KHÓA DATABASE
    for (const word of blacklist) {
      if (text.includes(` ${word} `) || text.includes(word)) {
        return { success: true, isEducational: false, reason: `Hệ thống phát hiện từ khóa giải trí: "${word}"` };
      }
    }
    
    for (const word of whitelist) {
      if (text.includes(` ${word} `)) {
        return { success: true, isEducational: true };
      }
    }

    // 3. VÙNG XÁM -> GỌI AI & LƯU NHẬT KÝ
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Bạn là hệ thống kiểm duyệt giáo dục. 
    Tiêu đề: "${title}" | Kênh: "${channelName}"
    Nhiệm vụ: Video này có thuộc chủ đề HỌC TẬP, KIẾN THỨC, KỸ NĂNG không? 
    Chỉ trả về DUY NHẤT "YES" hoặc "NO".`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim().toUpperCase();
    const isEducational = answer.includes("YES");
    const reason = isEducational ? "" : "Hệ thống AI phân tích và đánh giá đây KHÔNG phải nội dung học tập.";
    

    return { success: true, isEducational, reason };
  } catch (error: any) {
    console.error("🚨 Lỗi AI kiểm duyệt link:", error.message);
    return { success: true, isEducational: false, reason: "Hệ thống AI kiểm duyệt đang bảo trì. Tạm thời từ chối link lạ!" }; 
  }
}

export async function validateSearchQueryAction(query: string, userId?: string) {
  const text = query.toLowerCase();
  const { blacklist, whitelist } = await getActiveKeywords();

  for (const word of blacklist) {
    if (text.includes(word)) {
      return { isValid: false, reason: `Chứa từ khóa vi phạm chính sách giải trí/game ("${word}").` };
    }
  }

  let hasEduTerm = false;
  for (const word of whitelist) {
    if (text.includes(word)) {
      hasEduTerm = true;
      break;
    }
  }

  if (!hasEduTerm) {
    return { isValid: false, reason: "Từ khóa quá chung chung hoặc không nằm trong danh mục giáo dục. Vui lòng thêm các từ như: 'học', 'hướng dẫn', 'lý thuyết', 'toán', 'lập trình'..." };
  }

  if (userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { searchHistory: true } });
      let history: string[] = [];
      if (user?.searchHistory) history = JSON.parse(user.searchHistory);
      
      // Chỉ push vào history
      if (!history.includes(text)) {
        history.unshift(text);
        if (history.length > 10) history.pop(); // Giữ lại 10 từ gần nhất
        await prisma.user.update({ 
            where: { id: userId }, 
            data: { searchHistory: JSON.stringify(history) } 
        });
      }
    } catch(e) {}
  }
  return { isValid: true };
}

// ==========================================
// THUẬT TOÁN ĐỀ XUẤT VIDEO (DASHBOARD)
// ==========================================
export async function getRecommendedDashboardVideosAction(userId: string) {
  try {
    // 1. Lấy thông tin User bao gồm 2 trường đã tách biệt (Sở thích & Lịch sử tìm kiếm)
    const user = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { interests: true, searchHistory: true } 
    });
    
    // Lấy thông tin video xem gần đây và video đã thích
    const recentProgress = await prisma.userProgress.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 3, include: { video: true } });
    const recentFavorites = await prisma.favoriteVideo.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 3 });

    // 2. Parse mảng Sở thích (Những mục tick chọn ở Form)
    let parsedInterests: string[] = [];
    if (user?.interests) {
      try {
        const arr = JSON.parse(user.interests);
        if (Array.isArray(arr) && arr.length > 0) parsedInterests = arr;
      } catch(e) {}
    }

    // 3. Parse mảng Lịch sử tìm kiếm (MỚI THÊM VÀO)
    let parsedSearchHistory: string[] = [];
    if (user?.searchHistory) {
      try {
        const arr = JSON.parse(user.searchHistory);
        if (Array.isArray(arr) && arr.length > 0) parsedSearchHistory = arr;
      } catch(e) {}
    }

    // 4. Lấy từ khóa ngẫu nhiên từ các video vừa xem/vừa thả tim
    let historyWords: string[] = [];
    let sourceTitles: string[] = [];
    if (recentProgress.length > 0) sourceTitles.push(...recentProgress.map(p => p.video?.title || ""));
    if (recentFavorites.length > 0) sourceTitles.push(...recentFavorites.map(f => f.title || ""));

    if (sourceTitles.length > 0) {
      const randomTitle = sourceTitles[Math.floor(Math.random() * sourceTitles.length)];
      const cleanTitle = randomTitle.replace(/\[.*?\]|\(.*?\)/g, "").replace(/[^a-zA-Z0-9\p{L}\s]/gu, " ").trim();
      historyWords = cleanTitle.split(/\s+/).filter(w => w.length > 2); 
    }

    // 5. TRỘN TỪ KHÓA (MIX KEYWORDS) ĐỂ GỢI Ý
    let searchKeywords: string[] = [];

    // Ưu tiên 1: Lấy 2 sở thích user đã chọn
    if (parsedInterests.length > 0) {
      searchKeywords.push(...parsedInterests.slice(0, 2));
    }

    // Ưu tiên 2: Lấy 2 từ khóa user vừa gõ tìm kiếm gần đây
    if (parsedSearchHistory.length > 0) {
      searchKeywords.push(...parsedSearchHistory.slice(0, 2));
    }

    // Ưu tiên 3: Lấy 3 từ khóa từ tiêu đề video đang học dở
    if (historyWords.length > 0) {
      searchKeywords.push(...historyWords.slice(0, 3)); 
    }

    // Fallback: Nếu tài khoản trắng tinh, chưa chọn sở thích, chưa xem gì
    if (searchKeywords.length === 0) {
      searchKeywords.push("khóa học lập trình cơ bản"); 
    }

    // Nối tất cả thành 1 chuỗi dài (giới hạn 100 ký tự để YouTube API không bị lỗi)
    let finalKeyword = searchKeywords.join(" ").trim().substring(0, 100);

    // 6. GỌI YOUTUBE API
    const result = await advancedSearchAndRank({ keyword: finalKeyword });
    
    if (result && result.items) {
      const { blacklist, whitelist } = await getActiveKeywords();
      const bannedVideos = await prisma.moderatedVideo.findMany({ where: { status: "BANNED" }, select: { videoId: true } });
      const bannedIds = bannedVideos.map(v => v.videoId);

      // Chốt chặn cuối: Lọc sạch video rác & video Admin đã cấm
      result.items = result.items.filter((video: any) => {
         if (bannedIds.includes(video.videoId)) return false;
         return isEducationalFastCheck(video.title, video.channelTitle, blacklist, whitelist) !== false;
      });
    }
    
    return { success: true, data: result.items || [], keyword: finalKeyword };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}