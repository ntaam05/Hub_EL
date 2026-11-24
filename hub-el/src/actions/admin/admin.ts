"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs"; 

// =========================================
// 1. LẤY SỐ LIỆU DASHBOARD TỔNG QUAN (ĐÃ MOCK DATA)
// =========================================
export async function getAdminDashboardStats() {
    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const quizTotal = 15420;
        const quizCorrect = 11250;
        const quizWrong = quizTotal - quizCorrect;

        return { success: true, data: {
            totalUsers: 1254,           
            proUsers: 342,              
            totalCards: 120,            
            totalRevenue: 24500000,     
            totalVideos: 450,           
            totalQuizzes: 3200,         
            quizCorrect,
            quizWrong,
            quizTotal
        }};
    } catch (error: any) { 
        return { success: false, error: error.message }; 
    }
}

// =========================================
// 2. LẤY DỮ LIỆU BIỂU ĐỒ 7 NGÀY QUA (ĐÃ MOCK DATA)
// =========================================
export async function getDashboardChartData() {
    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const chartData = [];
        const today = new Date();
        
        const mockTrends = [
            { users: 15, revenue: 150000, gacha: 60, studyTime: 25, quizzes: 10 },
            { users: 22, revenue: 450000, gacha: 120, studyTime: 35, quizzes: 18 },
            { users: 18, revenue: 200000, gacha: 85, studyTime: 30, quizzes: 14 },
            { users: 45, revenue: 1250000, gacha: 250, studyTime: 45, quizzes: 28 }, 
            { users: 50, revenue: 1500000, gacha: 310, studyTime: 55, quizzes: 35 }, 
            { users: 28, revenue: 500000, gacha: 140, studyTime: 32, quizzes: 20 },
            { users: 35, revenue: 850000, gacha: 180, studyTime: 40, quizzes: 25 },  
        ];

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() - i);
            const trend = mockTrends[6 - i];

            chartData.push({
                date: targetDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                users: trend.users,
                revenue: trend.revenue,
                gacha: trend.gacha,
                avgStudyTime: trend.studyTime,      
                quizzesCreated: trend.quizzes       
            });
        }
        return { success: true, data: chartData };
    } catch (error: any) { 
        return { success: false, error: error.message }; 
    }
}

// =========================================
// 🚨 DANH SÁCH USER GIẢ (MOCK DATA) CHO TRANG QUẢN LÝ
// =========================================
const MOCK_USERS_LIST = [
    { id: "mock_1", name: "Trần Minh Quân (Giả)", email: "quan.tran@gmail.com", role: "student", isPro: true, freeCoins: 12500, stardust: 450, aiTokens: 200, isActive: true, image: "https://i.pravatar.cc/150?u=a1" },
    { id: "mock_2", name: "Nguyễn Thảo Vy (Giả)", email: "vy.nguyen@gmail.com", role: "student", isPro: false, freeCoins: 450, stardust: 20, aiTokens: 50, isActive: true, image: "https://i.pravatar.cc/150?u=a2" },
    { id: "mock_3", name: "Lê Nhật Hải (Giả)", email: "hai.le@gmail.com", role: "student", isPro: true, freeCoins: 8900, stardust: 1200, aiTokens: 150, isActive: false, image: "https://i.pravatar.cc/150?u=a3" },
    { id: "mock_4", name: "Phạm Quốc Bảo (Giả)", email: "bao.pham@gmail.com", role: "student", isPro: false, freeCoins: 50, stardust: 0, aiTokens: 10, isActive: true, image: null },
    { id: "mock_5", name: "Hoàng Tường Vi (Giả)", email: "vi.hoang@gmail.com", role: "student", isPro: true, freeCoins: 3200, stardust: 850, aiTokens: 100, isActive: true, image: "https://i.pravatar.cc/150?u=a5" },
    { id: "mock_6", name: "Đặng Quang Huy (Giả)", email: "huy.dang@gmail.com", role: "student", isPro: false, freeCoins: 1200, stardust: 150, aiTokens: 50, isActive: true, image: "https://i.pravatar.cc/150?u=a6" },
    { id: "mock_7", name: "Vũ Phương Linh (Giả)", email: "linh.vu@gmail.com", role: "student", isPro: true, freeCoins: 15000, stardust: 5000, aiTokens: 300, isActive: true, image: "https://i.pravatar.cc/150?u=a7" },
    { id: "mock_8", name: "Bùi Tiến Dũng (Giả)", email: "dung.bui@gmail.com", role: "student", isPro: false, freeCoins: 0, stardust: 10, aiTokens: 0, isActive: false, image: null },
];

// =========================================
// 3. DANH SÁCH USER (TRỘN DỮ LIỆU THẬT & GIẢ)
// =========================================
export async function getAdminUsers() {
    try {
        const realUsers = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, isPro: true, freeCoins: true, stardust: true, aiTokens: true, isActive: true, image: true, avatar: true },
            orderBy: { createdAt: 'desc' }
        });
        
        // Trộn user thật và user giả lại với nhau để hiển thị
        const combinedUsers = [...realUsers, ...MOCK_USERS_LIST];
        
        return { success: true, data: combinedUsers };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// =========================================
// 4. CẬP NHẬT USER (ĐỔI EMAIL & MẬT KHẨU)
// =========================================
export async function updateAdminUser(userId: string, data: { isActive?: boolean, isPro?: boolean, email?: string, password?: string, role?: string }) {
    try {
        // 🚨 CHẶN DATABASE NẾU LÀ TÀI KHOẢN GIẢ
        if (userId.startsWith("mock_")) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true, message: "Thành công (Thao tác ảo trên dữ liệu giả)!" };
        }

        const updateData: any = { ...data };
        if (data.password && data.password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(data.password, salt);
        } else {
            delete updateData.password;
        }

        await prisma.user.update({ where: { id: userId }, data: updateData });
        revalidatePath('/admin/users');
        return { success: true, message: "Thành công!" };
    } catch (error: any) { 
        return { success: false, error: error.message }; 
    }
}

// =========================================
// 5. QUẢN LÝ THẺ WIKI
// =========================================
export async function getAdminWikiCards() {
    try {
        const cards = await prisma.wikiCard.findMany({ orderBy: { id: 'desc' } });
        return { success: true, data: cards };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function saveAdminWikiCard(data: any) {
    try {
        if (data.id) {
            await prisma.wikiCard.update({ where: { id: data.id }, data: { title: data.title, rarity: data.rarity, imageUrl: data.imageUrl, totalStars: Number(data.totalStars) } });
        } else {
            await prisma.wikiCard.create({ data: { title: data.title, rarity: data.rarity, imageUrl: data.imageUrl, aiContent: "Nội dung đang cập nhật...", totalStars: Number(data.totalStars) || 1 } });
        }
        revalidatePath('/admin/wiki');
        return { success: true, message: "Thành công!" };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteAdminWikiCard(id: number) {
     try {
        await prisma.wikiCard.delete({ where: { id } });
        revalidatePath('/admin/wiki');
        return { success: true, message: "Thành công!" };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// =========================================
// 6. QUẢN LÝ GIAO DỊCH
// =========================================
export async function getAdminOrders() {
    try {
        const orders = await prisma.order.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
        return { success: true, data: orders };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// =========================================
// 7. CÀO DATA WIKI
// =========================================
export async function crawlWikipediaAction(wikiUrl: string) {
    try {
        const urlObj = new URL(wikiUrl);
        const pathParts = urlObj.pathname.split('/');
        const keyword = pathParts[pathParts.length - 1];
        const domain = urlObj.hostname;
        const apiUrl = `https://${domain}/api/rest_v1/page/summary/${keyword}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Thất bại");
        const data = await response.json();
        return { success: true, data: { title: data.title, imageUrl: data.thumbnail?.source || "", extract: data.extract || "Không nội dung", wikiUrl: wikiUrl } };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// =========================================
// 8. ĐIỀU CHỈNH SỐ DƯ TAY
// =========================================
export async function adjustUserBalanceAction(userId: string, assetType: string, amount: number, reason: string) {
    try {
        // 🚨 CHẶN DATABASE NẾU LÀ TÀI KHOẢN GIẢ
        if (userId.startsWith("mock_")) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true };
        }

        let updateData: any = {};
        if (assetType === 'FREE_COIN') updateData.freeCoins = { increment: amount };
        if (assetType === 'STARDUST') updateData.stardust = { increment: amount };
        if (assetType === 'ENERGY') updateData.aiTokens = { increment: amount };
        await prisma.$transaction([
            prisma.user.update({ where: { id: userId }, data: updateData }),
            prisma.coinTransaction.create({ data: { userId, amount, currencyType: assetType, reason: `[ADMIN] ${reason}` } })
        ]);
        revalidatePath('/admin/users'); revalidatePath('/admin/orders');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// =========================================
// CÁC HÀM CÒN LẠI GIỮ NGUYÊN
// =========================================
export async function getAdminCoinTransactions() {
    try {
        const trans = await prisma.coinTransaction.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
        return { success: true, data: trans };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getAdminQuests() {
    try { return { success: true, data: await prisma.dailyTask.findMany({ orderBy: { id: 'desc' } }) }; } catch (error: any) { return { success: false, error: error.message }; }
}

export async function saveAdminQuest(data: any) {
    try {
        const d = { taskDesc: data.taskDesc, taskType: data.taskType, target: Number(data.target), rewardXp: Number(data.rewardXp), rewardCoins: Number(data.rewardCoins), isProOnly: Boolean(data.isProOnly) };
        if (data.id) { await prisma.dailyTask.update({ where: { id: data.id }, data: d }); } else { await prisma.dailyTask.create({ data: d }); }
        revalidatePath('/admin/quests'); return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteAdminQuest(id: number) {
    try { await prisma.dailyTask.delete({ where: { id } }); revalidatePath('/admin/quests'); return { success: true }; } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getAdminLearningProgress() {
    try {
        const recentQuizAttempts = await prisma.quizAttempt.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true, avatar: true, image: true } } } });
        const recentVideoProgress = await prisma.userProgress.findMany({ take: 20, orderBy: { updatedAt: 'desc' }, include: { user: { select: { name: true, email: true, avatar: true, image: true } }, video: { select: { title: true, channelName: true } } } });
        return { success: true, data: { recentQuizAttempts, recentVideoProgress } };
    } catch (error: any) { return { success: false, error: error.message }; }
}