// src/app/(main)/achievements/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { checkAndGetAchievements } from "@/actions/achievements";
import { ACHIEVEMENT_LIST, TIER_STYLES } from "@/config/achievements";
import { ArrowLeft, Trophy, Medal, CheckCircle2, Lock, ListFilter, Archive, Zap, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();

  const [serverData, setServerData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'PROGRESS' | 'UNLOCKED'>('PROGRESS');
  
  // STATE LƯU PHẦN THƯỞNG ĐỂ HIỆN POPUP
  const [rewardData, setRewardData] = useState<{xp: number, coins: number, energy: number} | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      setIsLoading(true);
      const res = await checkAndGetAchievements(user.id) as any;
      if (res.success) {
        setServerData(res.data);
        
        // KIỂM TRA NẾU CÓ PHẦN THƯỞNG TỪ THÀNH TỰU MỚI THÌ BẬT POPUP
        const eXP = res.earnedXP || 0;
        const eCoins = res.earnedCoins || 0;
        const eEnergy = res.earnedEnergy || 0;

        if (eXP > 0 || eCoins > 0 || eEnergy > 0) {
           setRewardData({ xp: eXP, coins: eCoins, energy: eEnergy });
           
           // PHÁT TÍN HIỆU ĐỒNG BỘ LÊN HEADER VÀ SIDEBAR TỨC THỜI
           window.dispatchEvent(new CustomEvent('updateUserStats', { 
             detail: { 
               xpDelta: eXP, 
               coinsDelta: eCoins, 
               // Do logic Header là (aiTokens - energyCost), nên ta truyền số ÂM để nó CỘNG THÊM NĂNG LƯỢNG
               energyCost: -eEnergy 
             } 
           }));
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [user?.id]);

  const { unlockedCount, totalCount, progressPercent } = useMemo(() => {
    const unlocked = serverData.filter(a => a.isUnlocked).length;
    const total = ACHIEVEMENT_LIST.length;
    return {
      unlockedCount: unlocked,
      totalCount: total,
      progressPercent: total > 0 ? (unlocked / total) * 100 : 0
    };
  }, [serverData]);

  const displayList = useMemo(() => {
    if (serverData.length === 0) return [];

    if (viewMode === 'UNLOCKED') {
      return serverData.filter(d => d.isUnlocked).sort((a, b) => b.tier - a.tier);
    }

    const groups: Record<string, any[]> = {};
    serverData.forEach(d => {
      if (!groups[d.groupId]) groups[d.groupId] = [];
      groups[d.groupId].push(d);
    });

    const progressingItems: any[] = [];
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.tier - b.tier);
      
      const firstLocked = group.find(a => !a.isUnlocked);
      if (firstLocked) {
        progressingItems.push(firstLocked); 
      } else {
        progressingItems.push(group[group.length - 1]); 
      }
    });

    return progressingItems;
  }, [serverData, viewMode]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#050810] p-4 md:p-6 lg:p-8 overflow-hidden relative">

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[10%] w-[800px] h-[800px] bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-[128px] animate-spin [animation-duration:70s]" />
        <div className="absolute bottom-[10%] right-[20%] w-[1000px] h-[1000px] bg-yellow-400/20 dark:bg-yellow-500/10 rounded-full blur-[128px] animate-spin [animation-duration:90s] [animation-delay:10s]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-orange-400/20 dark:bg-orange-500/10 rounded-full blur-[150px] animate-spin [animation-duration:110s] [animation-delay:20s]" />
      </div>

      <div className="w-full mx-auto space-y-6 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-[#111827] p-6 lg:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-yellow-600 dark:text-slate-400 dark:hover:text-yellow-400 mb-4 transition-colors">
              <ArrowLeft size={16} /> Quay lại
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
              <Trophy className="text-yellow-500" size={36} /> Bảng Vàng Thành Tựu
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mt-2">
              Khám phá và thu thập các huy hiệu danh giá trong suốt quá trình cày cuốc.
            </p>
          </div>
          
          <div className="relative z-10 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-700/50 p-4 rounded-2xl w-full md:w-72 shrink-0">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tiến độ thu thập</span>
               <span className="text-lg font-black text-yellow-600 dark:text-yellow-500">{unlockedCount} / {totalCount}</span>
             </div>
             <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
               <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
             </div>
          </div>
        </div>

        {/* BỘ LỌC */}
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
          <button 
            onClick={() => setViewMode('PROGRESS')}
            className={cn("flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all", viewMode === 'PROGRESS' ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
          >
            <ListFilter size={16} /> Tiến trình nâng cấp
          </button>
          <button 
            onClick={() => setViewMode('UNLOCKED')}
            className={cn("flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all", viewMode === 'UNLOCKED' ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
          >
            <Archive size={16} /> Bộ sưu tập đã nhận ({unlockedCount})
          </button>
        </div>

        {/* LIST THÀNH TỰU */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 font-bold">
             <Medal className="w-12 h-12 mb-4 animate-bounce text-yellow-500" />
             Đang rà soát kỷ lục...
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Trophy className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-bold">Bạn chưa thu thập được thành tựu nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 sm:gap-5 lg:gap-6 animate-in slide-in-from-bottom-4">
            {displayList.map((sData) => {
              const achConfig = ACHIEVEMENT_LIST.find(c => c.id === sData.id);
              if (!achConfig) return null;

              const Icon = achConfig.icon;
              const isUnlocked = sData.isUnlocked;
              const progressRaw = Math.min((sData.currentProgress / achConfig.reqValue) * 100, 100);
              const progress = isNaN(progressRaw) ? 0 : progressRaw;

              const tierStyle = TIER_STYLES[sData.tier] || TIER_STYLES[1];

              return (
                <div key={sData.id} className={cn(
                  "p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col group",
                  isUnlocked 
                    ? `bg-white dark:bg-[#111827] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none ${tierStyle.border}` 
                    : `bg-slate-50 dark:bg-[#0a0f18] border-slate-200 dark:border-slate-800 opacity-90 hover:opacity-100 hover:${tierStyle.border}`
                )}>
                  
                  {!isUnlocked && (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-500/10 dark:via-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none z-0"></div>
                  )}

                  {isUnlocked && <div className={cn("absolute -right-10 -top-10 w-32 h-32 blur-2xl rounded-full pointer-events-none", tierStyle.bg)} />}
                  
                  <div className="flex gap-4 items-center relative z-10 mb-4 flex-1">
                    <div className={cn("p-3 rounded-2xl shrink-0 border relative transition-colors duration-300", tierStyle.bg, tierStyle.border)}>
                      <Icon className={cn("w-8 h-8 transition-colors duration-300", tierStyle.color)} />
                      <span className="absolute -bottom-2 -right-2 w-5 h-5 bg-slate-800 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                        {sData.tier}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 pt-1 w-full min-w-0">
                      <div>
                        <h3 className={cn(
                            "text-lg font-black uppercase tracking-tight leading-tight mb-0.5 transition-colors duration-300", 
                            isUnlocked ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                        )}>
                          {achConfig.title}
                        </h3>
                        <p className="text-[11px] md:text-xs font-semibold text-slate-500 dark:text-slate-500 leading-relaxed pr-6">
                          {achConfig.desc}
                        </p>
                      </div>

                      <div className={cn("flex flex-wrap items-center gap-1.5 mt-0.5 relative z-20 transition-all duration-300", !isUnlocked && "grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100")}>
                          {achConfig.rewardXp && (
                            <span className={cn("px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 shadow-sm border text-[9px] font-black flex items-center gap-1", tierStyle.color, tierStyle.border)}>
                              +{achConfig.rewardXp.toLocaleString()} XP
                            </span>
                          )}
                          {achConfig.rewardCoins && (
                            <span className="px-1.5 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 text-yellow-600 dark:text-yellow-500 shadow-sm text-[9px] font-black flex items-center gap-1">
                              +{achConfig.rewardCoins.toLocaleString()} <Coins size={10}/>
                            </span>
                          )}
                          {achConfig.rewardEnergy && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 shadow-sm text-[9px] font-black flex items-center gap-1">
                              +{achConfig.rewardEnergy.toLocaleString()} <Zap size={10}/>
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto relative z-10 bg-slate-100 dark:bg-black/40 p-3 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center mb-1.5 relative z-10">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiến độ</span>
                      <span className={cn(
                          "text-[10px] font-black transition-colors duration-300", 
                          isUnlocked ? "text-green-500" : "text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-500"
                      )}>
                        {isUnlocked ? "Hoàn thành" : `${Math.floor(sData.currentProgress).toLocaleString()} / ${achConfig.reqValue.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden relative z-10">
                      <div className={cn(
                          "h-full transition-all duration-1000", 
                          isUnlocked ? "bg-green-500" : "bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-500 dark:group-hover:bg-blue-500"
                      )} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {isUnlocked && (
                    <div className="absolute right-4 top-4 rotate-12 opacity-20 pointer-events-none z-0">
                      <CheckCircle2 className={cn("w-16 h-16", tierStyle.color)} />
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="absolute right-4 top-4 opacity-10 pointer-events-none z-0">
                      <Lock className="w-10 h-10 text-slate-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* POPUP HIỂN THỊ PHẦN THƯỞNG KHI MỞ KHÓA THÀNH TỰU MỚI */}
      {/* ======================================================== */}
      {rewardData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1d21] rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center animate-in zoom-in-95 bounce border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Thành Tựu Mới!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-6">Bạn vừa thu thập thành công thành tựu và nhận được phần thưởng:</p>
            
            <div className="flex w-full gap-2 mb-8">
              {rewardData.xp > 0 && (
                <div className="flex-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">+{rewardData.xp}</span>
                  <span className="text-[10px] font-bold text-blue-500/70">EXP</span>
                </div>
              )}
              {rewardData.coins > 0 && (
                <div className="flex-1 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-xl font-black text-yellow-600 dark:text-yellow-500">+{rewardData.coins}</span>
                  <span className="text-[10px] font-bold text-yellow-500/70">XU</span>
                </div>
              )}
              {rewardData.energy > 0 && (
                <div className="flex-1 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-xl font-black text-green-600 dark:text-green-500">+{rewardData.energy}</span>
                  <span className="text-[10px] font-bold text-green-500/70">NĂNG LƯỢNG</span>
                </div>
              )}
            </div>

            <button onClick={() => setRewardData(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">
              Tuyệt Vời
            </button>
          </div>
        </div>
      )}

    </div>
  );
}