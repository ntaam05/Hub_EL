"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { usePathname } from "next/navigation"; 
import { X, Flame, Clock, Target, Zap, BookOpen, TrendingUp, ShieldAlert, Sparkles, Trophy, MessageSquare, Users, Video, ListTodo, Wallet, ArrowRightLeft, Crown, Globe, Snowflake, Share2, Gem, Coins, Star } from "lucide-react";
import { getUserFullStats } from "@/actions/stats";
import { cn } from "@/lib/utils";

export function StatsModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'learning' | 'gacha' | 'social'>('overview');
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const hasMounted = useRef(false);
  const pathname = usePathname();
  const initialPathname = useRef(pathname);

  // Đóng modal nếu user bấm chuyển trang khác trên nền
  useEffect(() => {
    if (pathname !== initialPathname.current) {
      onClose();
    }
  }, [pathname]);

  // Lắng nghe Sidebar để đẩy lùi Modal cho khỏi bị che khuất
  useEffect(() => {
    hasMounted.current = true;
    const checkSidebar = () => setIsSidebarCollapsed(Boolean(document.documentElement.classList.contains("collapsed") || document.body.classList.contains("sidebar-collapsed") || document.querySelector('aside')?.classList.contains('w-20')));
    checkSidebar();
    const observer = new MutationObserver(checkSidebar);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const aside = document.querySelector('aside');
    if (aside) observer.observe(aside, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Gọi API lấy dữ liệu thống kê
  useEffect(() => {
    (async () => {
      const res = await getUserFullStats();
      if (res.success) setData(res.data);
      setLoading(false);
    })();
  }, []);

  // Lắng nghe sự kiện cập nhật XP, Xu, Năng lượng TỨC THỜI cho Modal
  useEffect(() => {
    const handleStatsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { xpDelta = 0, coinsDelta = 0, energyCost = 0 } = customEvent.detail;
      
      setData((prev: any) => {
        if (!prev || !prev.user) return prev;
        const baseUser = prev.user;
        
        let newXp = (baseUser.xp || 0) + xpDelta;
        let newLevel = baseUser.level || 1;
        let reqXp = Math.floor(500 + Math.pow(newLevel, 2) * 20);

        while (newXp >= reqXp) {
          newXp -= reqXp;
          newLevel += 1;
          reqXp = Math.floor(500 + Math.pow(newLevel, 2) * 20);
        }

        return {
          ...prev,
          user: {
            ...baseUser,
            xp: newXp,
            level: newLevel,
            freeCoins: (baseUser.freeCoins || 0) + coinsDelta,
            aiTokens: Math.max(0, (baseUser.aiTokens || 0) - energyCost)
          }
        };
      });
    };
    
    window.addEventListener('updateUserStats', handleStatsUpdate);
    return () => window.removeEventListener('updateUserStats', handleStatsUpdate);
  }, []);

  // Gộp 2 bảng `Order` và `CoinTransaction`
  const mergedTransactions = useMemo(() => {
    if (!data?.user) return [];
    
    const coinTxs = (data.user.coinTransactions || []).map((t: any) => ({
      id: `coin-${t.id}`, reason: t.reason, amount: t.amount, currencyType: t.currencyType,
      isFiat: false, timestamp: new Date(t.createdAt).getTime(), createdAt: t.createdAt
    }));

    const orderTxs = (data.user.orders || []).map((o: any) => ({
      id: `order-${o.id}`, reason: `Nạp tiền (Mã: ${o.orderCode})`, amount: o.amount, currencyType: 'FIAT',
      isFiat: true, timestamp: new Date(o.createdAt).getTime(), createdAt: o.createdAt
    }));

    return [...coinTxs, ...orderTxs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
  }, [data]);

  if (loading) return (
    <div className={cn("fixed top-16 right-0 bottom-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 left-0", isSidebarCollapsed ? "lg:left-20" : "lg:left-64")}>
      <div className="flex flex-col items-center gap-4"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500" /><p className="text-blue-400 font-bold animate-pulse text-sm">Đang nạp kho dữ liệu...</p></div>
    </div>
  );

  if (!data) return null;

  const { user, totalCards, uniqueCardsOwned, totalAchievements, recentQuizzes, totalFriends, totalSpent } = data;
  const stats = user.stats || {}, inventory = user.inventory || [], progress = user.progress || [], dailyTasks = user.dailyTasks || [];

  const today = new Date();
  const todayTasks = dailyTasks.filter((tp: any) => {
    if (!tp.assignedDate) return false;
    const taskDate = new Date(tp.assignedDate);
    return taskDate.getDate() === today.getDate() && 
           taskDate.getMonth() === today.getMonth() && 
           taskDate.getFullYear() === today.getFullYear();
  });

  // Tính toán ĐỘ CHÍNH XÁC QUÍZ
  let totalQuestions = 0;
  let correctQuestions = 0;
  
  if (recentQuizzes && recentQuizzes.length > 0) {
    totalQuestions = recentQuizzes.reduce((sum: number, q: any) => sum + (q.totalQuizzes || 0), 0);
    correctQuestions = recentQuizzes.reduce((sum: number, q: any) => sum + (q.correctCount || 0), 0);
  } else {
    correctQuestions = stats.correctQuizAnswers || 0;
    totalQuestions = Math.max(correctQuestions, (stats.totalQuizAttempts || 0) * 5); 
  }
  const accuracy = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  
  // Thời gian xem Video
  const totalSeconds = stats.totalStudySeconds || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const timeString = hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;

  // Tiến độ Video
  const completedVideos = progress.filter((p: any) => p.isCompleted).length;
  const inProgressVideos = progress.filter((p: any) => !p.isCompleted).length;
  const totalVideoProgress = completedVideos + inProgressVideos;

  const countRarity = (rarity: string) => inventory.filter((i: any) => i.card.rarity === rarity).length;
  const completedCards = inventory.filter((i: any) => i.isCompleted || (i.card?.awakenedStars || 0) >= (i.card?.totalStars || 1)).length;
  const untouchedCards = inventory.filter((i: any) => (i.card?.awakenedStars || 0) === 0 && !i.isCompleted).length;
  const learningCards = inventory.length - completedCards - untouchedCards;
  const countVocab = inventory.reduce((acc: number, curr: any) => acc + (curr.card?.vocabularies?.length || 0), 0);

  // Phúc lợi PRO
  const isPro = user.isPro;
  const proPerks = [
    { l: "Kinh Nghiệm", v: `+${isPro ? 20 : 0}% XP`, c: "blue" },
    { l: "Xu Hằng Ngày", v: `+${isPro ? (user.level || 1) + 20 : (user.level || 1)}% Xu`, c: "yellow" },
    { l: "Bụi Sao Gacha", v: `+${isPro ? 20 : 0}% Bụi Sao`, c: "emerald" },
    { l: "Lượt Gacha Free", v: `+${isPro ? 1 : 0} Lượt/Ngày`, c: "purple" },
    { l: "Phí AI Quiz", v: `Giảm ${isPro ? 30 : 0}% Phí`, c: "pink" },
    { l: "Năng Lượng", v: `+${isPro ? 50 : 0} Tối đa`, c: "cyan" },
    { l: "Share Thẻ", v: `+${isPro ? 2 : 0} Lần/Thẻ`, c: "orange" },
    { l: "Độc Quyền PRO", v: "Chat & NV", c: "red" }
  ];

  return (
    <div className={cn("fixed top-16 right-0 bottom-0 z-[999] p-4 lg:p-6 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 transition-all duration-300 left-0", isSidebarCollapsed ? "lg:left-20" : "lg:left-64")}>
      <style dangerouslySetInnerHTML={{__html: `@media (pointer: coarse) { .custom-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; } .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } } @media (pointer: fine) { .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.3); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(150, 150, 150, 0.5); } }`}} />
      
      <div className="w-full h-full bg-slate-50 dark:bg-[#0d0d12] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-[1800px]">
        
        {/* HEADER MODAL */}
        <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d0d12] dark:bg-gradient-to-r dark:from-blue-900/20 dark:to-transparent shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl", isPro ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "bg-blue-500/10 border border-blue-500/20")}>
                {isPro ? <Crown className="w-6 h-6 text-white" /> : <TrendingUp className="w-6 h-6 text-blue-400" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Dữ liệu <span className="text-blue-400">Hub-EL</span></h2>
                <div className="flex gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                  <span className="text-blue-400">Level {user.level}</span> • <span>{user.xp} XP</span>
                  {isPro && <span className="text-yellow-600 dark:text-yellow-500 font-black ml-2">Tài khoản PRO</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-white/5 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30 text-slate-500 dark:text-white/50 hover:text-red-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<TrendingUp size={14}/>} label="Tổng Quan" />
            <TabButton active={activeTab === 'learning'} onClick={() => setActiveTab('learning')} icon={<BookOpen size={14}/>} label="Học Tập & Tiến Độ" />
            <TabButton active={activeTab === 'gacha'} onClick={() => setActiveTab('gacha')} icon={<Sparkles size={14}/>} label="Kho Gacha Wiki" />
            <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} icon={<Wallet size={14}/>} label="Tài Chính & Xã Hội" />
          </div>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden p-4 lg:p-6 custom-scrollbar bg-slate-50 dark:bg-transparent dark:bg-[radial-gradient(circle_at_50%_0%,_rgba(56,189,248,0.03)_0%,_transparent_50%)]">
          
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === 'overview' && (
            <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
                <StatBox icon={<Flame className="text-orange-500" />} label="Chuỗi học" value={`${user.currentStreak || 0} Ngày`} sub={`Kỷ lục: ${user.highestStreak || 0} ngày`} color="orange" />
                <StatBox icon={<Clock className="text-blue-500" />} label="Thời gian xem" value={timeString} sub={`${stats.totalVideoWatched || 0} Video đã hoàn thành`} color="blue" />
                <StatBox icon={<Target className="text-green-500" />} label="Độ chính xác" value={`${accuracy}%`} sub={`${correctQuestions} / ${totalQuestions} câu hỏi đúng`} color="green" />
                <StatBox icon={<Trophy className="text-yellow-500" />} label="Thành tựu" value={user.achievements?.length || 0} sub={`Mở khóa ${user.achievements?.length || 0}/${totalAchievements} Huy hiệu`} color="yellow" />
              </div>
              <div className="flex-1 p-5 lg:p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden min-h-[120px] shadow-sm dark:shadow-none">
                <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-widest flex items-center gap-2 mb-4 shrink-0"><Zap className="w-5 h-5 text-blue-400" /> Biểu đồ phong độ Quiz (10 bài gần nhất)</h3>
                <div className="flex-1 flex gap-4 mt-2 relative min-h-[100px]">
                   <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 dark:text-white/30 pb-6 shrink-0 h-full"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
                   <div className="flex-1 flex items-end gap-3 border-l border-b border-slate-200 dark:border-white/10 pb-0 relative h-full">
                     <div className="absolute w-full border-t border-slate-100 dark:border-white/5 top-[25%]" /><div className="absolute w-full border-t border-slate-100 dark:border-white/5 top-[50%]" /><div className="absolute w-full border-t border-slate-100 dark:border-white/5 top-[75%]" />
                     {recentQuizzes.length > 0 ? recentQuizzes.map((quiz: any, idx: number) => {
                        const percent = Math.min((quiz.correctCount / Math.max(quiz.totalQuizzes, 1)) * 100, 100);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10 pb-1">
                            <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold shadow-lg">{quiz.correctCount}/{quiz.totalQuizzes} ({Math.round(percent)}%)</div>
                            <div className="w-full flex items-end justify-center px-1" style={{ height: `${percent}%` }}><div className={cn("w-full rounded-t-sm transition-all duration-700 h-full", percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500')} /></div>
                            <span className="absolute -bottom-6 text-[10px] font-bold text-slate-400 dark:text-white/40">B{idx+1}</span>
                          </div>
                        )
                      }) : <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-400 dark:text-white/20 italic z-10">Chưa có dữ liệu thi trắc nghiệm</div>}
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HỌC TẬP VÀ TIẾN ĐỘ */}
          {activeTab === 'learning' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col space-y-6 h-full">
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shrink-0 shadow-sm dark:shadow-none">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" /> Hồ sơ Ngôn Ngữ & Đóng Góp</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <ActivityRow icon={<Globe className="w-4 h-4 text-blue-400" />} label="Ngôn ngữ" value={(user.targetLanguage || "EN").toUpperCase()} />
                    <ActivityRow icon={<Target className="w-4 h-4 text-red-400" />} label="Trình độ" value={user.languageLevel || "Cơ bản"} />
                    <ActivityRow icon={<Video className="w-4 h-4 text-green-400" />} label="Góp Video" value={user.createdVideos?.length || 0} />
                    <ActivityRow icon={<BookOpen className="w-4 h-4 text-purple-400" />} label="Từ vựng Wiki" value={countVocab} />
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex-1 flex flex-col overflow-hidden shadow-sm dark:shadow-none">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 shrink-0"><ListTodo className="w-4 h-4 text-orange-400" /> Nhiệm vụ Hằng ngày</h4>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {/* 🚨 SỬ DỤNG MẢNG TODAY_TASKS CHỐNG LẶP */}
                    {todayTasks.length > 0 ? todayTasks.map((tp: any, idx: number) => (
                      <div key={idx}><div className="flex justify-between text-xs font-bold text-slate-600 dark:text-white/60 mb-2"><span>{tp.task?.taskDesc || "Nhiệm vụ"}</span><span className={tp.current >= tp.task?.target ? "text-green-600 dark:text-green-400" : ""}>{tp.current} / {tp.task?.target}</span></div><ProgressBar current={tp.current} max={tp.task?.target || 1} color="bg-orange-500" /></div>
                    )) : <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 dark:text-white/30 text-sm font-bold">Hôm nay không có nhiệm vụ.</div>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-6 h-full">
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex-1 flex flex-col overflow-hidden shadow-sm dark:shadow-none">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 shrink-0"><Video className="w-4 h-4 text-pink-400" /> Tiến độ Video</h4>
                  <div className="flex-1 flex items-center justify-between gap-6 px-2">
                    <div className="flex flex-col gap-4 w-40 shrink-0">
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center"><p className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase tracking-widest mb-1">Đã học xong</p><p className="text-2xl font-black text-slate-800 dark:text-white">{completedVideos}</p></div>
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center"><p className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mb-1">Đang học dở</p><p className="text-2xl font-black text-slate-800 dark:text-white">{inProgressVideos}</p></div>
                    </div>
                    <div className="flex-1 flex justify-center items-center h-full">
                      <div className="w-48 h-48 xl:w-56 xl:h-56 relative rounded-full shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(0,0,0,0.3)] shrink-0" style={{ background: totalVideoProgress > 0 ? `conic-gradient(#22c55e 0% ${(completedVideos/totalVideoProgress)*100}%, #eab308 ${(completedVideos/totalVideoProgress)*100}% 100%)` : '#e2e8f0' }}>
                        <div className="absolute inset-4 bg-white dark:bg-[#0d0d12] rounded-full flex flex-col items-center justify-center border-4 border-slate-100 dark:border-white/5"><span className="text-4xl font-black text-slate-800 dark:text-white mb-1">{totalVideoProgress}</span><span className="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest">Tổng Video</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shrink-0 shadow-sm dark:shadow-none">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Snowflake className="w-4 h-4 text-blue-400" /> Lịch sử Cứu hộ</h4>
                  <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex justify-between items-center"><div className="flex flex-col"><span className="text-base font-bold text-slate-800 dark:text-white/80">Số lần xài Thẻ Bảo vệ Chuỗi</span><span className="text-xs text-slate-500 dark:text-white/40 uppercase mt-1">Giữ lửa</span></div><span className="text-3xl font-black text-blue-500 dark:text-blue-400">{user.freezeUsage?.length || 0} Lần</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KHO GACHA */}
          {activeTab === 'gacha' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col space-y-6 h-full overflow-hidden">
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shrink-0 shadow-sm dark:shadow-none">
                  <div className="flex justify-between items-center mb-6 shrink-0"><h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> Bộ sưu tập Thẻ</h4><span className="text-[10px] px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-500/20 font-black shrink-0">{user.stardust} BỤI SAO</span></div>
                  <div className="mb-6 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shrink-0"><div className="flex justify-between items-center mb-2"><span className="text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase">Tỉ lệ hoàn thành</span><span className="text-sm font-black text-slate-800 dark:text-white">{uniqueCardsOwned} / {totalCards} Thẻ</span></div><ProgressBar current={uniqueCardsOwned} max={totalCards} color="bg-gradient-to-r from-blue-500 to-purple-500" height="h-2" /></div>
                  <div className="grid grid-cols-6 gap-2 shrink-0">
                    <RarityBoxSmall label="MR/LR" count={countRarity("MR") + countRarity("LR")} color="text-pink-500" border="border-pink-500/30" />
                    <RarityBoxSmall label="UR" count={countRarity("UR")} color="text-red-500" border="border-red-500/30" />
                    <RarityBoxSmall label="SSR" count={countRarity("SSR")} color="text-yellow-500" border="border-yellow-500/30" />
                    <RarityBoxSmall label="SR" count={countRarity("SR")} color="text-purple-400" border="border-purple-400/30" />
                    <RarityBoxSmall label="R" count={countRarity("R")} color="text-blue-400" border="border-blue-400/30" />
                    <RarityBoxSmall label="N" count={countRarity("N")} color="text-slate-400" border="border-slate-400/30" />
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex-1 flex flex-col justify-between overflow-hidden shadow-sm dark:shadow-none">
                  <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 shrink-0"><ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Hệ thống Bảo hiểm (Pity)</h4>
                  <div className="space-y-3 flex-1 flex flex-col justify-center shrink-0">
                    <PityBar label="Bảo hiểm UR (Max 120)" current={user.pityUR} max={120} color="bg-red-500" textClass="text-[11px] lg:text-sm" height="h-1.5 lg:h-2" spacing="space-y-1.5 lg:space-y-2" />
                    <PityBar label="Bảo hiểm SSR (Max 50)" current={user.pitySSR} max={50} color="bg-yellow-500" textClass="text-[11px] lg:text-sm" height="h-1.5 lg:h-2" spacing="space-y-1.5 lg:space-y-2" />
                    <PityBar label="Bảo hiểm SR (Max 10)" current={user.pitySR} max={10} color="bg-purple-500" textClass="text-[11px] lg:text-sm" height="h-1.5 lg:h-2" spacing="space-y-1.5 lg:space-y-2" />
                  </div>
                  <div className="mt-3 p-2 bg-red-500/5 border border-red-500/10 rounded-lg text-center shrink-0"><p className="text-[10px] lg:text-xs text-slate-500 dark:text-white/50 uppercase font-bold tracking-widest">Đã thực hiện tổng cộng <span className="text-slate-800 dark:text-white text-[15px]">{stats.totalGachaPulls || 0}</span> lệnh</p></div>
                </div>
              </div>
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-6 lg:p-7 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 h-full flex flex-col overflow-hidden shadow-sm dark:shadow-none">
                  <h4 className="text-xs lg:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 lg:mb-7 flex items-center gap-2 shrink-0"><Star className="w-4 h-4 text-yellow-400" /> Trạng thái học thẻ</h4>
                  <div className="space-y-4 lg:space-y-5 shrink-0 mt-2 lg:mt-3"><ActivityRow icon={<Star className="w-4 h-4 text-green-500 fill-green-500" />} label="Đã Hoàn thành (Full Sao)" value={completedCards} /><ActivityRow icon={<Star className="w-4 h-4 text-yellow-500" />} label="Đang cày dở" value={learningCards} /><ActivityRow icon={<BookOpen className="w-4 h-4 text-slate-400" />} label="Mới (Chưa đụng)" value={untouchedCards} /></div>
                  <div className="flex-1 flex flex-col items-center justify-center mt-10 lg:mt-12 overflow-hidden">
                    <div className="w-[240px] h-[240px] lg:w-[260px] lg:h-[260px] relative rounded-full shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ background: inventory.length > 0 ? `conic-gradient(#22c55e 0% ${(completedCards/inventory.length)*100}%, #eab308 ${(completedCards/inventory.length)*100}% ${((completedCards+learningCards)/inventory.length)*100}%, #94a3b8 ${((completedCards+learningCards)/inventory.length)*100}% 100%)` : '#e2e8f0' }}>
                      <div className="absolute inset-5 bg-white dark:bg-[#0d0d12] rounded-full border-4 border-slate-100 dark:border-white/5 flex flex-col items-center justify-center"><span className="text-5xl lg:text-6xl font-black text-slate-800 dark:text-white mb-1 lg:mb-2 leading-none">{inventory.length}</span><span className="text-[10px] lg:text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Thẻ sở hữu</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TÀI CHÍNH & XÃ HỘI */}
          {activeTab === 'social' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col space-y-4 h-full">
                {/* HẠNG TÀI KHOẢN*/}
                <div className="p-6 lg:p-10 rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-white/10 flex justify-between items-center shadow-sm dark:shadow-lg shrink-0">
                  <div className="flex items-center gap-4 lg:gap-6">
                    {isPro ? <Crown className="w-12 h-12 lg:w-16 lg:h-16 text-yellow-500" /> : <Users className="w-12 h-12 lg:w-16 lg:h-16 text-blue-500 dark:text-blue-400" />}
                    <div>
                      <p className="text-[11px] lg:text-sm font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-1.5">Hạng tài khoản</p>
                      <p className={cn("text-3xl lg:text-5xl font-black uppercase tracking-tighter", isPro ? "text-yellow-600 dark:text-yellow-500" : "text-blue-600 dark:text-blue-400")}>{isPro ? "Premium" : "Free"}</p>
                    </div>
                  </div>
                  <div className="text-right border-l-2 border-slate-200 dark:border-white/10 pl-6 lg:pl-10">
                    <p className="text-[11px] lg:text-sm font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-1.5">Thời hạn</p>
                    <p className="text-2xl lg:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{isPro && user.premiumExpiresAt ? `${Math.ceil((new Date(user.premiumExpiresAt).getTime() - Date.now()) / 86400000)} Ngày` : "Vĩnh viễn"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 shrink-0">
                   <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center shadow-sm dark:shadow-none"><p className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase mb-2">Xu</p><p className="text-2xl font-black text-slate-800 dark:text-white">{user.freeCoins}</p></div>
                   <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center shadow-sm dark:shadow-none"><p className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase mb-2">Năng lượng AI</p><p className="text-2xl font-black text-slate-800 dark:text-white">{user.aiTokens}</p></div>
                   <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center shadow-sm dark:shadow-none"><p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase mb-2">Xu Nạp</p><p className="text-2xl font-black text-slate-800 dark:text-white">{user.premiumCoins}</p></div>
                </div>
                
                {/* 🚨 ĐÃ FIX: TƯƠNG TÁC XÃ HỘI (Bỏ Nhóm Chat) */}
                <div className="p-4 lg:p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex-1 flex flex-col justify-center overflow-hidden shadow-sm dark:shadow-none">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0"><Users className="w-4 h-4 text-blue-400" /> Tương tác Xã hội</h4>
                  <div className="space-y-1">
                    <ActivityRow icon={<Users className="w-4 h-4 text-green-500" />} label="Bạn bè" value={totalFriends ?? 0} />
                    <ActivityRow icon={<MessageSquare className="w-4 h-4 text-blue-500" />} label="Tin đã gửi" value={stats.messagesSentCount || 0} />
                    <ActivityRow icon={<Share2 className="w-4 h-4 text-orange-500" />} label="Lượt Share Thẻ" value={stats.sharedCardsCount || 0} />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4 h-full overflow-hidden">
                <div className="p-5 lg:p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shrink-0 shadow-sm dark:shadow-none">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500" /> Phúc Lợi Đặc Quyền</h4>
                  <div className="flex flex-wrap justify-center gap-3">
                    {proPerks.map((p, i) => (
                      <div key={i} className={`p-3 bg-${p.c}-500/5 border border-${p.c}-500/10 rounded-xl flex flex-col justify-center items-center text-center flex-1 min-w-[130px] max-w-[180px]`}>
                        <p className="text-[9px] lg:text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis w-full">{p.l}</p>
                        <p className={`text-sm lg:text-base font-black text-${p.c}-600 dark:text-${p.c}-400 w-full truncate`}>{p.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 lg:p-7 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex flex-col flex-1 overflow-hidden shadow-sm dark:shadow-none">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4 text-yellow-500" /> Lịch sử Dòng tiền</h4>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase">Tổng nạp</p>
                      <p className="text-sm font-black text-yellow-600 dark:text-yellow-500">{totalSpent.toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 lg:space-y-3.5 mt-1 lg:mt-2">
                    {mergedTransactions.length > 0 ? mergedTransactions.map((tx: any, idx: number) => {
                        const isPositive = tx.amount > 0;
                        return (
                          <div key={idx} className="flex justify-between items-center p-3 lg:p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                            <div><p className={cn("text-xs lg:text-sm font-bold", tx.isFiat ? "text-yellow-600 dark:text-yellow-500" : "text-slate-800 dark:text-white/90")}>{tx.reason}</p><p className="text-[9px] lg:text-[10px] text-slate-500 dark:text-white/40 uppercase mt-0.5 lg:mt-1 tracking-wider">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p></div>
                            <div className={cn("text-sm lg:text-base font-black flex items-center gap-1 lg:gap-1.5", isPositive ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-white/60")}>{isPositive ? "+" : ""}{tx.amount.toLocaleString('vi-VN')} {tx.isFiat ? <span className="text-sm font-bold">đ</span> : tx.currencyType === 'PREMIUM' ? <Gem size={14} className="text-purple-500"/> : <Coins size={14} className={isPositive ? "text-green-600 dark:text-green-400" : "text-yellow-500"}/>}</div>
                          </div>
                        )
                    }) : <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/30 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl"><ArrowRightLeft className="w-6 h-6 lg:w-8 lg:h-8 mb-2 lg:mb-3 opacity-50" /><p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest">Chưa có giao dịch</p></div>}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// --- CÁC COMPONENT PHỤ TRỢ ---

function TabButton({ active, onClick, icon, label }: any) {
  return <button onClick={onClick} className={cn("flex items-center gap-1.5 lg:gap-2 px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl text-[10px] lg:text-[11px] font-bold transition-all whitespace-nowrap shrink-0 border uppercase tracking-widest", active ? "bg-blue-600 text-white border-blue-500 shadow-md dark:shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-transparent hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white")}>{icon} {label}</button>;
}
function StatBox({ icon, label, value, sub, color }: any) {
  const bgMap: any = { orange: "bg-orange-500/10 border-orange-500/20", blue: "bg-blue-500/10 border-blue-500/20", green: "bg-green-500/10 border-green-500/20", yellow: "bg-yellow-500/10 border-yellow-500/20", purple: "bg-purple-500/10 border-purple-500/20" };
  const iconBgMap: any = { orange: "bg-orange-500/20", blue: "bg-blue-500/20", green: "bg-green-500/20", yellow: "bg-yellow-500/20", purple: "bg-purple-500/20" };
  return <div className={cn("p-3 lg:p-5 rounded-2xl border relative overflow-hidden shadow-sm dark:shadow-none", bgMap[color])}><div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4"><div className={cn("p-1.5 lg:p-2 rounded-lg lg:rounded-xl", iconBgMap[color])}>{icon}</div><p className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest truncate">{label}</p></div><p className="text-xl lg:text-3xl font-black text-slate-800 dark:text-white leading-none mb-1 lg:mb-2">{value}</p><p className="text-[8px] lg:text-[10px] font-bold text-slate-400 dark:text-white/40 truncate">{sub}</p></div>;
}
function ActivityRow({ icon, label, value }: any) {
  return <div className="flex justify-between items-center py-1.5 lg:py-2 border-b border-slate-200 dark:border-white/5"><div className="flex items-center gap-2 lg:gap-3"><div className="p-1.5 lg:p-2 bg-slate-100 dark:bg-white/5 rounded-lg">{icon}</div><span className="text-[10px] lg:text-xs font-bold text-slate-600 dark:text-white/70 uppercase tracking-wider">{label}</span></div><span className="text-sm lg:text-base font-black text-slate-800 dark:text-white">{value}</span></div>;
}
function RarityBoxSmall({ label, count, color, border }: any) {
  return <div className={cn("text-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border flex flex-col justify-center items-center shadow-sm dark:shadow-inner", border)}><p className={cn("text-[9px] font-black mb-1 leading-none uppercase tracking-tighter", color)}>{label}</p><p className="text-lg font-black text-slate-800 dark:text-white">{count}</p></div>;
}
function ProgressBar({ current, max, color, height = "h-1.5 lg:h-2" }: any) {
  return <div className={cn("w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden", height)}><div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${Math.min((current / Math.max(max, 1)) * 100, 100)}%` }} /></div>;
}
function PityBar({ label, current, max, color, textClass="text-xs", height="h-2.5", spacing="space-y-2" }: any) {
  return (
    <div className={spacing}>
      <div className={cn("flex justify-between font-black text-slate-600 dark:text-white/50 uppercase tracking-wider leading-none", textClass)}>
        <span>{label}</span>
        <span className="text-slate-800 dark:text-white">{current} / {max}</span>
      </div>
      <ProgressBar current={current} max={max} color={color} height={height} />
    </div>
  );
}