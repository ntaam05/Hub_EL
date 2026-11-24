import { prisma } from "@/lib/prisma";

export type LeaderboardCategory = "STREAK" | "GRINDER" | "TIME" | "AI_KILLER";
export type LeaderboardRange = "DAY" | "WEEK" | "MONTH" | "ALL";

export interface LeaderboardPlayerDTO {
  rank: number;
  userId: string;
  displayName: string;
  username: string | null;
  avatar: string | null;
  isPro: boolean;
  level: number;
  scoreValue: number;
  scoreLabel: string;
  subLabel: string;
}

export interface CurrentUserRankDTO extends LeaderboardPlayerDTO {
  isTop50: boolean;
}

export interface LeaderboardResponseData {
  category: LeaderboardCategory;
  range: LeaderboardRange;
  generatedAt: string;
  topPlayers: LeaderboardPlayerDTO[];
  currentUser: CurrentUserRankDTO | null;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

// =========================================
// 1. DỮ LIỆU MOCK ĐỂ ĐẢM BẢO GAMIFICATION LUÔN CÓ NGƯỜI
// =========================================
const MOCK_USERS = [
  { id: "mock1", name: "Nguyễn Văn A (Bot)", username: "nguyenvana_bot", avatar: "https://i.pravatar.cc/150?u=1", isPro: true, level: 15 },
  { id: "mock2", name: "Trần Thị B (Bot)", username: "tranthib_bot", avatar: "https://i.pravatar.cc/150?u=2", isPro: false, level: 12 },
  { id: "mock3", name: "Lê Hoàng C (Bot)", username: "lehoangc_bot", avatar: "https://i.pravatar.cc/150?u=3", isPro: true, level: 20 },
  { id: "mock4", name: "Phạm Văn D (Bot)", username: "phamvand_bot", avatar: "https://i.pravatar.cc/150?u=4", isPro: false, level: 9 },
  { id: "mock5", name: "Hoàng Thị E (Bot)", username: "hoangthie_bot", avatar: null, isPro: false, level: 8 },
  { id: "mock6", name: "Vũ Văn F (Bot)", username: "vuvanf_bot", avatar: "https://i.pravatar.cc/150?u=6", isPro: true, level: 18 },
  { id: "mock7", name: "Đặng Thị G (Bot)", username: "dangthig_bot", avatar: "https://i.pravatar.cc/150?u=7", isPro: false, level: 11 },
  { id: "mock8", name: "Bùi Văn H (Bot)", username: "buivanh_bot", avatar: null, isPro: false, level: 7 },
];

function generateMockData(category: LeaderboardCategory, timeframe: LeaderboardRange) {
  const multiplier = timeframe === "DAY" ? 1 : timeframe === "WEEK" ? 2 : timeframe === "MONTH" ? 5 : 10;
  return MOCK_USERS.map((user, index) => {
    let scoreValue = 0;
    let scoreLabel = "";
    let subLabel = "";

    const randomSeed = (index + 1) * 0.1;

    if (category === "STREAK") {
      scoreValue = Math.floor(randomSeed * 10) + 1;
      scoreLabel = `${scoreValue} Ngày`;
      subLabel = "Chuỗi liên tục";
    } else if (category === "GRINDER") {
      scoreValue = Math.floor(randomSeed * 150 * multiplier) + 50 * multiplier;
      scoreLabel = `${scoreValue.toLocaleString()} XP`;
      subLabel = timeframe === "ALL" ? `Cấp ${user.level}` : "Thu thập được";
    } else if (category === "TIME") {
      scoreValue = Math.floor(randomSeed * 300 * multiplier) + 120 * multiplier;
      const h = Math.floor(scoreValue / 3600);
      const m = Math.floor((scoreValue % 3600) / 60);
      scoreLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
      subLabel = "Thời lượng xem";
    } else if (category === "AI_KILLER") {
      scoreValue = Math.floor(randomSeed * 5 * multiplier) + 2 * multiplier;
      scoreLabel = `${scoreValue.toLocaleString()}`;
      subLabel = "Câu đúng";
    }

    return {
      userId: user.id,
      displayName: user.name,
      username: user.username,
      avatar: user.avatar,
      isPro: user.isPro,
      level: user.level,
      scoreValue,
      scoreLabel,
      subLabel,
    };
  });
}

// =========================================
// 2. CÔNG THỨC VÀ TIỆN ÍCH THỜI GIAN
// =========================================
export function calculateLifetimeXP(level: number, currentXp: number): number {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(500 + Math.pow(i, 2) * 20);
  }
  return totalXP + currentXp;
}

export function getStartDate(timeframe: LeaderboardRange): Date {
  // Lấy chuẩn ngày theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7) tương thích với @db.Date của SQL Server
  const vnTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  if (timeframe === "DAY") {
    return new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate()));
  }
  if (timeframe === "WEEK") {
    const day = vnTime.getDay();
    const diff = vnTime.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), diff));
  }
  if (timeframe === "MONTH") {
    return new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), 1));
  }
  return new Date(0);
}

// =========================================
// 3. MAIN LEADERBOARD SERVICE
// =========================================
export async function getLeaderboardService(
  categoryInput: string = "STREAK",
  timeframeInput: string = "DAY",
  currentUserId?: string | null
): Promise<ServiceResult<LeaderboardResponseData>> {
  try {
    const validCategories: LeaderboardCategory[] = ["STREAK", "GRINDER", "TIME", "AI_KILLER"];
    const validRanges: LeaderboardRange[] = ["DAY", "WEEK", "MONTH", "ALL"];

    const category: LeaderboardCategory = validCategories.includes(categoryInput.toUpperCase() as any)
      ? (categoryInput.toUpperCase() as LeaderboardCategory)
      : "STREAK";

    const timeframe: LeaderboardRange = validRanges.includes(timeframeInput.toUpperCase() as any)
      ? (timeframeInput.toUpperCase() as LeaderboardRange)
      : "DAY";

    // 1. Sinh dữ liệu giả định
    const mockData = generateMockData(category, timeframe);

    let realData: {
      userId: string;
      displayName: string;
      username: string | null;
      avatar: string | null;
      isPro: boolean;
      level: number;
      scoreValue: number;
      scoreLabel: string;
      subLabel: string;
    }[] = [];

    // 2. Truy vấn dữ liệu thực từ Database
    if (category === "STREAK") {
      const rawData = await prisma.user.findMany({
        where: { isActive: true, currentStreak: { gt: 0 } },
        orderBy: [{ currentStreak: "desc" }, { level: "desc" }, { id: "asc" }],
        take: 50,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          avatar: true,
          isPro: true,
          level: true,
          currentStreak: true,
        },
      });

      realData = rawData.map((u) => ({
        userId: u.id,
        displayName: u.name || u.username || "Học viên ẩn danh",
        username: u.username,
        avatar: u.avatar || u.image,
        isPro: u.isPro,
        level: u.level,
        scoreValue: u.currentStreak,
        scoreLabel: `${u.currentStreak} Ngày`,
        subLabel: "Chuỗi liên tục",
      }));
    } else if (timeframe === "ALL") {
      switch (category) {
        case "GRINDER": {
          const xpData = await prisma.user.findMany({
            where: { isActive: true },
            orderBy: [{ level: "desc" }, { xp: "desc" }, { id: "asc" }],
            take: 50,
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              avatar: true,
              isPro: true,
              level: true,
              xp: true,
            },
          });

          realData = xpData.map((u) => {
            const totalXp = calculateLifetimeXP(u.level, u.xp);
            return {
              userId: u.id,
              displayName: u.name || u.username || "Học viên",
              username: u.username,
              avatar: u.avatar || u.image,
              isPro: u.isPro,
              level: u.level,
              scoreValue: totalXp,
              scoreLabel: `${totalXp.toLocaleString()} XP`,
              subLabel: `Cấp ${u.level}`,
            };
          });
          break;
        }

        case "TIME": {
          const timeStats = await prisma.userStats.findMany({
            where: { user: { isActive: true }, totalStudySeconds: { gt: 0 } },
            orderBy: [{ totalStudySeconds: "desc" }, { id: "asc" }],
            take: 50,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  avatar: true,
                  isPro: true,
                  level: true,
                },
              },
            },
          });

          realData = timeStats.map((s) => {
            const h = Math.floor(s.totalStudySeconds / 3600);
            const m = Math.floor((s.totalStudySeconds % 3600) / 60);
            return {
              userId: s.user.id,
              displayName: s.user.name || s.user.username || "Học viên",
              username: s.user.username,
              avatar: s.user.avatar || s.user.image,
              isPro: s.user.isPro,
              level: s.user.level,
              scoreValue: s.totalStudySeconds,
              scoreLabel: h > 0 ? `${h}h ${m}m` : `${m}m`,
              subLabel: "Thời lượng xem",
            };
          });
          break;
        }

        case "AI_KILLER": {
          const aiStats = await prisma.userStats.findMany({
            where: { user: { isActive: true }, correctQuizAnswers: { gt: 0 } },
            orderBy: [{ correctQuizAnswers: "desc" }, { id: "asc" }],
            take: 50,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  avatar: true,
                  isPro: true,
                  level: true,
                },
              },
            },
          });

          realData = aiStats.map((s) => ({
            userId: s.user.id,
            displayName: s.user.name || s.user.username || "Học viên",
            username: s.user.username,
            avatar: s.user.avatar || s.user.image,
            isPro: s.user.isPro,
            level: s.user.level,
            scoreValue: s.correctQuizAnswers,
            scoreLabel: `${s.correctQuizAnswers.toLocaleString()}`,
            subLabel: "Câu đúng",
          }));
          break;
        }
      }
    } else {
      // timeFrame in ['DAY', 'WEEK', 'MONTH']
      const startDate = getStartDate(timeframe);
      const dailyData = await prisma.dailyStat.groupBy({
        by: ["userId"],
        where: { date: { gte: startDate } },
        _sum: { xpGained: true, studySeconds: true, correctAnswers: true, quizAttempts: true },
      });

      if (dailyData.length > 0) {
        const userIds = dailyData.map((d) => d.userId);
        const users = await prisma.user.findMany({
          where: { id: { in: userIds }, isActive: true },
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            avatar: true,
            isPro: true,
            level: true,
          },
        });

        const mergedData = dailyData
          .map((d) => {
            const u = users.find((x) => x.id === d.userId);
            return u ? { ...d, user: u } : null;
          })
          .filter(Boolean) as any[];

        switch (category) {
          case "GRINDER":
            realData = mergedData.map((d) => ({
              userId: d.user.id,
              displayName: d.user.name || d.user.username || "Học viên",
              username: d.user.username,
              avatar: d.user.avatar || d.user.image,
              isPro: d.user.isPro,
              level: d.user.level,
              scoreValue: d._sum.xpGained || 0,
              scoreLabel: `${(d._sum.xpGained || 0).toLocaleString()} XP`,
              subLabel: "Thu thập được",
            }));
            break;

          case "TIME":
            realData = mergedData.map((d) => {
              const secs = d._sum.studySeconds || 0;
              const h = Math.floor(secs / 3600);
              const m = Math.floor((secs % 3600) / 60);
              return {
                userId: d.user.id,
                displayName: d.user.name || d.user.username || "Học viên",
                username: d.user.username,
                avatar: d.user.avatar || d.user.image,
                isPro: d.user.isPro,
                level: d.user.level,
                scoreValue: secs,
                scoreLabel: h > 0 ? `${h}h ${m}m` : `${m}m`,
                subLabel: "Thời lượng xem",
              };
            });
            break;

          case "AI_KILLER":
            realData = mergedData.map((d) => ({
              userId: d.user.id,
              displayName: d.user.name || d.user.username || "Học viên",
              username: d.user.username,
              avatar: d.user.avatar || d.user.image,
              isPro: d.user.isPro,
              level: d.user.level,
              scoreValue: d._sum.correctAnswers || 0,
              scoreLabel: `${(d._sum.correctAnswers || 0).toLocaleString()}`,
              subLabel: "Câu đúng",
            }));
            break;
        }
      }
    }

    // 3. Kết hợp dữ liệu thật và dữ liệu giả, giải quyết bằng điểm ổn định
    const combined = [...realData, ...mockData];
    combined.sort((a, b) => {
      if (b.scoreValue !== a.scoreValue) {
        return b.scoreValue - a.scoreValue;
      }
      if (b.level !== a.level) {
        return b.level - a.level;
      }
      return a.userId.localeCompare(b.userId);
    });

    // 4. Lấy Top 50 người chơi
    const topPlayers: LeaderboardPlayerDTO[] = combined.slice(0, 50).map((player, idx) => ({
      rank: idx + 1,
      userId: player.userId,
      displayName: player.displayName,
      username: player.username,
      avatar: player.avatar,
      isPro: player.isPro,
      level: player.level,
      scoreValue: player.scoreValue,
      scoreLabel: player.scoreLabel,
      subLabel: player.subLabel,
    }));

    // 5. Xác định thứ hạng và điểm của người dùng hiện tại (Current User)
    let currentUserRank: CurrentUserRankDTO | null = null;
    if (currentUserId) {
      const foundInTop = topPlayers.find((p) => p.userId === currentUserId);
      if (foundInTop) {
        currentUserRank = {
          ...foundInTop,
          isTop50: true,
        };
      } else {
        // Nếu không có trong top 50, truy vấn hồ sơ người dùng để tính điểm cá nhân
        const me = await prisma.user.findUnique({
          where: { id: currentUserId },
          include: { stats: true },
        });

        if (me) {
          let myScoreValue = 0;
          let myScoreLabel = "0";
          let mySubLabel = "";

          if (category === "STREAK") {
            myScoreValue = me.currentStreak || 0;
            myScoreLabel = `${myScoreValue} Ngày`;
            mySubLabel = "Chuỗi liên tục";
          } else if (timeframe === "ALL") {
            if (category === "GRINDER") {
              myScoreValue = calculateLifetimeXP(me.level, me.xp);
              myScoreLabel = `${myScoreValue.toLocaleString()} XP`;
              mySubLabel = `Cấp ${me.level}`;
            } else if (category === "TIME") {
              myScoreValue = me.stats?.totalStudySeconds || 0;
              const h = Math.floor(myScoreValue / 3600);
              const m = Math.floor((myScoreValue % 3600) / 60);
              myScoreLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
              mySubLabel = "Thời lượng xem";
            } else if (category === "AI_KILLER") {
              myScoreValue = me.stats?.correctQuizAnswers || 0;
              myScoreLabel = `${myScoreValue.toLocaleString()}`;
              mySubLabel = "Câu đúng";
            }
          } else {
            const startDate = getStartDate(timeframe);
            const myDaily = await prisma.dailyStat.groupBy({
              by: ["userId"],
              where: { userId: currentUserId, date: { gte: startDate } },
              _sum: { xpGained: true, studySeconds: true, correctAnswers: true },
            });

            if (myDaily.length > 0) {
              const item = myDaily[0]._sum;
              if (category === "GRINDER") {
                myScoreValue = item.xpGained || 0;
                myScoreLabel = `${myScoreValue.toLocaleString()} XP`;
                mySubLabel = "Thu thập được";
              } else if (category === "TIME") {
                myScoreValue = item.studySeconds || 0;
                const h = Math.floor(myScoreValue / 3600);
                const m = Math.floor((myScoreValue % 3600) / 60);
                myScoreLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
                mySubLabel = "Thời lượng xem";
              } else if (category === "AI_KILLER") {
                myScoreValue = item.correctAnswers || 0;
                myScoreLabel = `${myScoreValue.toLocaleString()}`;
                mySubLabel = "Câu đúng";
              }
            }
          }

          // Tính thứ hạng tương đối (Số người có điểm cao hơn + 1)
          const higherCount = combined.filter((p) => p.scoreValue > myScoreValue).length;
          const myRank = higherCount + 1;

          currentUserRank = {
            rank: myRank,
            userId: me.id,
            displayName: me.name || me.username || "Tôi",
            username: me.username,
            avatar: me.avatar || me.image,
            isPro: me.isPro,
            level: me.level,
            scoreValue: myScoreValue,
            scoreLabel: myScoreLabel,
            subLabel: mySubLabel,
            isTop50: false,
          };
        }
      }
    }

    return {
      success: true,
      data: {
        category,
        range: timeframe,
        generatedAt: new Date().toISOString(),
        topPlayers,
        currentUser: currentUserRank,
      },
    };
  } catch (error: any) {
    console.error("LỖI LEADERBOARD SERVICE:", error);
    return { success: false, error: error.message || "Lỗi kết nối CSDL", statusCode: 500 };
  }
}
