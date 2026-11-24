"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getLeaderboardData } from "@/actions/leaderboard";
import { 
  Trophy, Flame, Clock, Target, Swords, 
  Crown, Calendar, CalendarDays, CalendarCheck, Infinity, Medal
} from "lucide-react";
import { cn } from "@/lib/utils";

// 🚨 ĐÃ BỎ MỤC "ACCURACY" (TOP CHÍNH XÁC)
const CATEGORIES = [
  { id: 'STREAK', title: 'Bền Bỉ', desc: 'Top Chuỗi Lửa', icon: Flame, color: 'text-orange-500' },
  { id: 'GRINDER', title: 'Cày Cuốc', desc: 'Top XP', icon: Swords, color: 'text-purple-500' },
  { id: 'TIME', title: 'Thời Gian', desc: 'Top Giờ Học', icon: Clock, color: 'text-blue-500' },
  { id: 'AI_KILLER', title: 'Khắc Tinh AI', desc: 'Top Câu Đúng', icon: Target, color: 'text-rose-500' },
];

const TIMEFRAMES = [
  { id: 'DAY', label: 'Hôm nay', icon: Calendar },
  { id: 'WEEK', label: 'Tuần này', icon: CalendarDays },
  { id: 'MONTH', label: 'Tháng này', icon: CalendarCheck },
  { id: 'ALL', label: 'Mọi lúc', icon: Infinity },
];

const SafeAvatar = ({ src, name, className }: { src: string | null, name: string, className?: string }) => {
  const [error, setError] = useState(false);
  if (src && !error) {
    return <img src={src} alt={name} className={cn("rounded-full object-cover bg-slate-100 dark:bg-slate-800", className)} referrerPolicy="no-referrer" onError={() => setError(true)} />;
  }
  return <div className={cn("rounded-full flex items-center justify-center font-black bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900 text-slate-700 dark:text-white uppercase shadow-inner", className)}>{name?.charAt(0) || "U"}</div>;
};

const PodiumUser = ({ data, position, isLoading, maxScore }: { data: any, position: 1 | 2 | 3, isLoading: boolean, maxScore: number }) => {
  const isReady = !isLoading && !!data;
  
  const baseHeights = { 1: 55, 2: 35, 3: 20 };
  // Sử dụng data.scoreValue (đã thêm trong file mock data) để cột nhảy cao thấp theo điểm
  const dynamicFactor = isReady && maxScore > 0 ? (data.scoreValue / maxScore) * 10 : 0;
  const pillarHeightPercent = isReady ? baseHeights[position] + dynamicFactor : 0; 

  const isFirst = position === 1;
  
  const rankColors = {
    1: { bg: "bg-gradient-to-t from-yellow-500/5 via-yellow-400/20 to-yellow-300/40 border-yellow-400", text: "text-yellow-600 dark:text-yellow-500", badge: "bg-yellow-400 text-yellow-900" },
    2: { bg: "bg-gradient-to-t from-slate-500/5 via-slate-400/20 to-slate-300/40 border-slate-300", text: "text-slate-500 dark:text-slate-400", badge: "bg-slate-200 dark:bg-slate-300 text-slate-900" },
    3: { bg: "bg-gradient-to-t from-orange-500/5 via-orange-400/20 to-orange-300/40 border-orange-400", text: "text-orange-600 dark:text-orange-500", badge: "bg-orange-400 text-orange-950" }
  };
  const style = rankColors[position];

  return (
    <div className={cn("w-[30%] max-w-[180px] h-[350px] sm:h-[400px] flex flex-col justify-end items-center relative", isFirst ? "z-20" : "z-10")}>
      
      <div 
        className="flex flex-col items-center absolute w-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ bottom: `${pillarHeightPercent}%`, opacity: isReady ? 1 : 0 }}
      >
        {isFirst && <Crown className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-bounce drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] absolute -top-11 translate-x-4 z-[9999] rotate-12" />}
        
        <div className="relative mb-3 group z-20">
           <SafeAvatar 
             src={data?.avatar} 
             name={data?.name || "U"} 
             className={cn("border-4 shadow-xl transition-transform group-hover:scale-110", isFirst ? "w-20 h-20 sm:w-24 sm:h-24 border-yellow-400" : "w-16 h-16 sm:w-20 sm:h-20 border-white dark:border-slate-800")} 
           />
           <div className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 border-white dark:border-[#050810] shadow-lg z-20", style.badge)}>
             {position}
           </div>
        </div>

        <div className="text-center w-full px-1">
          <p className={cn("font-black truncate text-sm sm:text-base drop-shadow-md", style.text)}>{data?.name || "..."}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-white drop-shadow-md">{data?.scoreLabel || "..."}</p>
        </div>
      </div>

      <div 
        className={cn("w-full rounded-t-xl border-t-[3px] shadow-[0_-5px_25px_rgba(0,0,0,0.2)] backdrop-blur-md relative overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]", style.bg)}
        style={{ height: `${pillarHeightPercent}%` }}
      >
         <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
         <div className="absolute top-4 left-1/2 -translate-x-1/2">
           <Trophy className={cn("w-6 h-6 sm:w-8 sm:h-8 opacity-60", style.text)} />
         </div>
      </div>

    </div>
  );
};

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [activeCategory, setActiveCategory] = useState('STREAK');
  const [activeTimeframe, setActiveTimeframe] = useState('DAY');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getLeaderboardData(activeCategory, activeTimeframe) as any;
        if (res?.success) setLeaderboard(res.data);
      } catch (error) {
        console.error("Lỗi tải Leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [activeCategory, activeTimeframe]);

  const top3 = leaderboard.slice(0, 3);
  const restOfBoard = leaderboard.slice(3);
  const currentUserRank = leaderboard.find(u => u.id === user?.id);

  const maxScore = top3[0]?.scoreValue || 1;

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#020617] font-sans relative flex flex-col pb-6">
      
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[400px] bg-blue-600/10 rounded-full blur-[150px]" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 mx-auto relative z-10 pt-8 sm:pt-12 flex flex-col flex-1 h-full">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-200 dark:border-slate-800/60 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <Trophy className="text-yellow-500 w-10 h-10 shrink-0" />
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white drop-shadow-sm whitespace-nowrap">
                Bảng Vàng
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Giao diện đang hiển thị với Dữ liệu giả (Mock Data).</p>
            </div>
          </div>

          <div className="flex bg-white dark:bg-[#0f172a] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-fit shrink-0 shadow-sm dark:shadow-lg animate-in fade-in duration-300">
            {TIMEFRAMES.map(tf => {
              const isActive = activeTimeframe === tf.id;
              const isDisabled = activeCategory === 'STREAK' && tf.id !== 'ALL';
              return (
                <button
                  key={tf.id}
                  onClick={() => setActiveTimeframe(tf.id)}
                  disabled={isDisabled}
                  className={cn(
                    "flex-1 sm:flex-none px-4 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                    isActive ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {tf.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-4 mb-6 shrink-0">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => { 
                  setActiveCategory(cat.id); 
                  if (cat.id === 'STREAK') setActiveTimeframe('ALL'); 
                  else if (activeTimeframe === 'ALL') setActiveTimeframe('DAY');
                }}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 text-left shrink-0",
                  isActive ? "bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-lg scale-[1.02]" : "bg-transparent border border-transparent hover:bg-slate-100 dark:hover:bg-slate-900/50"
                )}
              >
                <div className={cn("p-1.5 rounded-lg shrink-0", isActive ? "bg-slate-100 dark:bg-[#020617]" : "")}>
                  <Icon className={cn("w-4 h-4", isActive ? cat.color : "text-slate-500")} />
                </div>
                <div>
                  <p className={cn("text-xs lg:text-sm font-black uppercase tracking-widest leading-none mb-1", isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>{cat.title}</p>
                  <p className="text-[10px] text-slate-500 font-medium leading-none hidden sm:block">{cat.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16 w-full flex-1 min-h-0">
          
          <div className="w-full lg:w-[45%] xl:w-[45%] flex flex-col h-full relative z-[999] shrink-0 pt-10 lg:pt-12">
            
            <div className="flex-1 flex flex-col justify-end min-h-[400px]">
              <div className="flex items-end justify-center w-full h-full gap-2 sm:gap-6">
                <PodiumUser data={top3[1]} position={2} isLoading={isLoading} maxScore={maxScore} />
                <PodiumUser data={top3[0]} position={1} isLoading={isLoading} maxScore={maxScore} />
                <PodiumUser data={top3[2]} position={3} isLoading={isLoading} maxScore={maxScore} />
              </div>
            </div>

            {!isLoading && currentUserRank && currentUserRank.rank > 3 && (
              <div className="fixed bottom-4 left-4 right-4 lg:static lg:mt-12 z-50 animate-in slide-in-from-bottom-8">
                <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
                  <div className="w-10 sm:w-14 text-center shrink-0">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-500">#{currentUserRank.rank}</span>
                  </div>
                  <div className="relative shrink-0">
                    <SafeAvatar src={currentUserRank.avatar} name={currentUserRank.name} className="w-10 h-10 border-2 border-slate-200 dark:border-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white truncate text-sm">Vị trí của bạn</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">Tiếp tục cày cuốc để leo top nhé!</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-2 z-[500]">
                    <span className="text-lg font-black text-blue-600 dark:text-blue-500">{currentUserRank.scoreLabel}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[55%] xl:w-[55%] h-full overflow-y-auto no-scrollbar space-y-2 pb-10 px-5 -mx-2 pt-3 -mt-2">
            {!isLoading && restOfBoard.map((u) => (
              <div 
                key={u.id} 
                className={cn(
                  "flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl transition-all duration-300",
                  u.id === user?.id 
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] transform scale-[1.02] z-10 relative" 
                    : "bg-white/60 dark:bg-[#0f172a]/60 hover:bg-slate-50 dark:hover:bg-[#0f172a] border border-slate-200 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                )}
              >
                <div className="w-10 sm:w-14 text-center shrink-0">
                  <span className="text-base font-black text-slate-500">#{u.rank}</span>
                </div>

                <div className="relative shrink-0">
                  <SafeAvatar src={u.avatar} name={u.name} className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-slate-200 dark:border-slate-700" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-bold truncate text-sm sm:text-base", u.id === user?.id ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200")}>{u.name}</p>
                    {u.isPro && <span className="bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-500 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm shrink-0">PRO</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{u.subLabel}</p>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className={cn("text-base sm:text-lg font-black", u.id === user?.id ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-white")}>{u.scoreLabel}</span>
                </div>
              </div>
            ))}

            {isLoading && Array.from({length: 12}).map((_, i) => (
               <div key={i} className="h-20 bg-slate-100 dark:bg-[#0f172a]/50 rounded-2xl w-full animate-pulse border border-slate-200 dark:border-slate-800/50" />
            ))}
          </div>
          
        </div>
      </div>

      {!session && !isLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-100/80 dark:bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            <Medal className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Truy cập bị hạn chế</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Bạn cần đăng nhập để xem chi tiết Bảng xếp hạng và cạnh tranh với bạn bè.</p>
          </div>
        </div>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}