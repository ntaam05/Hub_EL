"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; 
import { getFreshUserStatsAction } from '@/actions/user/learning';
import { 
  Search, Flame, Coins, ShoppingCart, Link as LinkIcon, Zap, Gem, 
  BarChart2, Settings, LogOut, X, Snowflake, Play, Menu, Bell, 
  BrainCircuit, BookMarked, Award, CornerDownLeft, Loader2, AlertCircle, CheckCircle2, History
} from 'lucide-react'; // 🚨 Đã import thêm AlertCircle và CheckCircle2

import { ThemeTogglePill } from "./theme-toggle";
import { StatsModal } from "../modals/stats-modal";
import { cn } from "@/lib/utils";
import LucianSearchBar from "./LucianSearchBar";

import { checkEducationalVideoAction, getSearchSuggestionsAction, validateSearchQueryAction } from '@/actions/video/video';

const HubElLogo = ({ className }: { className?: string }) => (
  <div className={cn("bg-blue-600 dark:bg-blue-500 transition-colors duration-500", className)}
    style={{ WebkitMaskImage: 'url(/logo.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskImage: 'url(/logo.png)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }}
  />
);

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [cachedUser, setCachedUser] = useState<any>(session?.user || null);

  // 🚨 HỆ THỐNG THÔNG BÁO TÙY CHỈNH MỚI (THAY THẾ ALERT)
  const [notification, setNotification] = useState<{title?: string, msg: string, type: 'success' | 'error'} | null>(null);
  const showNotification = (msg: string, type: 'success' | 'error' = 'success', title?: string) => {
      setNotification({ title, msg, type });
      // Tự động tắt sau 4.5 giây
      setTimeout(() => setNotification(null), 4500);
  };

  useEffect(() => {
    if (session?.user?.id) {
      if (!cachedUser) setCachedUser(session.user);
      getFreshUserStatsAction(session.user.id).then((freshData) => {
        if (freshData) {
          setCachedUser((prev: any) => ({
            ...prev,
            ...session.user, 
            ...freshData     
          }));
        }
      });
    } else if (session === null) {
      setCachedUser(null);
    }
  }, [session?.user?.id]);

  const user = cachedUser || session?.user;

  const [isStreakBumping, setIsStreakBumping] = useState(false);
  const [simulatedStreak, setSimulatedStreak] = useState<number | null>(null);

  useEffect(() => {
    const handleStatsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { xpDelta = 0, coinsDelta = 0, energyCost = 0, energyDelta = 0, premiumCoinsDelta = 0, isPro } = customEvent.detail;
      
      setCachedUser((prev: any) => {
        const baseUser = prev || session?.user || {};
        
        let newXp = (baseUser.xp || 0) + xpDelta;
        let newLevel = baseUser.level || 1;
        let reqXp = Math.floor(500 + Math.pow(newLevel, 2) * 20);

        while (newXp >= reqXp) {
          newXp -= reqXp;
          newLevel += 1;
          reqXp = Math.floor(500 + Math.pow(newLevel, 2) * 20);
        }

        const finalEnergyDelta = energyDelta !== 0 ? energyDelta : -energyCost;

        return {
          ...baseUser,
          xp: newXp,
          level: newLevel,
          freeCoins: Math.max(0, (baseUser.freeCoins || 0) + coinsDelta),
          premiumCoins: Math.max(0, (baseUser.premiumCoins || 0) + premiumCoinsDelta),
          aiTokens: Math.max(0, (baseUser.aiTokens || 0) + finalEnergyDelta),
          ...(isPro !== undefined ? { isPro } : {}) 
        };
      });
    };
    
    window.addEventListener('updateUserStats', handleStatsUpdate);
    return () => window.removeEventListener('updateUserStats', handleStatsUpdate);
  }, [session?.user]);

  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCachedUser((prev: any) => ({
        ...prev,
        ...customEvent.detail
      }));
    };
    
    window.addEventListener('updateUserProfile', handleProfileUpdate);
    return () => window.removeEventListener('updateUserProfile', handleProfileUpdate);
  }, []);
  
  useEffect(() => {
    const handleQuizDone = () => {
      let alreadyStudied = false;
      if (user?.lastStudyDate) {
        const today = new Date();
        const lastDate = new Date(user.lastStudyDate);
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
        if (todayMidnight === lastMidnight) alreadyStudied = true;
      }

      setSimulatedStreak(prev => {
        if (prev !== null) return prev; 
        if (alreadyStudied) return user?.currentStreak || 0; 

        setTimeout(() => {
           setIsStreakBumping(true);
           setTimeout(() => setIsStreakBumping(false), 2500);
        }, 10);
        
        return (user?.currentStreak || 0) + 1;
      });
    };

    window.addEventListener('quizCompleted', handleQuizDone);
    return () => window.removeEventListener('quizCompleted', handleQuizDone);
  }, [user?.lastStudyDate, user?.currentStreak]);

  const [keyword, setKeyword] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistoryList, setSearchHistoryList] = useState<string[]>([]);
  const [searchSuggestionsList, setSearchSuggestionsList] = useState<string[]>([]);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [ytLink, setYtLink] = useState('');
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showWikiMenu, setShowWikiMenu] = useState(false); 
  const wikiMenuRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showSuggestions && !isMobileSearchOpen) return;
    let active = true;
    const timer = setTimeout(async () => {
      const res = await getSearchSuggestionsAction(session?.user?.id as string | undefined, keyword);
      if (active && res.success) {
        setSearchHistoryList(res.history || []);
        setSearchSuggestionsList(res.suggestions || []);
      }
    }, keyword.trim() ? 200 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [keyword, showSuggestions, isMobileSearchOpen, session?.user?.id]);

  const executeSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setKeyword(trimmed);
    setShowSuggestions(false);
    const checkRes = await validateSearchQueryAction(trimmed, session?.user?.id);
    if (!checkRes.isValid) {
      showNotification(checkRes.reason || "Từ khóa tìm kiếm không hợp lệ", 'error', 'Từ khóa chưa phù hợp');
      return;
    }
    router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
    setIsMobileSearchOpen(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(keyword);
  };

  const handlePlayLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytLink.trim()) return;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = ytLink.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (!videoId) { 
      // 🚨 ĐÃ THAY ALERT
      showNotification("Link YouTube không hợp lệ!", 'error'); 
      return; 
    }

    setIsCheckingLink(true);
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      const oembedData = await oembedRes.json();
      const realTitle = oembedData.title || "Video không xác định";
      const realChannel = oembedData.author_name || "Kênh ẩn danh";

      const checkRes = await checkEducationalVideoAction(realTitle, realChannel);
      if (checkRes.success && checkRes.isEducational === false) {
        // 🚨 ĐÃ THAY ALERT
        showNotification(checkRes.reason || "Video không phù hợp.", 'error', 'TRUY CẬP BỊ TỪ CHỐI!');
        setIsCheckingLink(false); return;
      }

      sessionStorage.setItem('routeState', JSON.stringify({
        video: { videoId, title: realTitle, channelTitle: realChannel, thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }
      }));
      router.push(`/watch/${videoId}`);
      setShowLinkInput(false); setYtLink('');
      setIsMobileSearchOpen(false); 
    } catch (error) { 
      // 🚨 ĐÃ THAY ALERT
      showNotification("Có lỗi xảy ra khi lấy dữ liệu video!", 'error'); 
    }
    setIsCheckingLink(false);
  };

  let displayLevel = user?.level || 1;
  let displayXp = user?.xp || 0;
  let reqXp = Math.floor(500 + Math.pow(displayLevel, 2) * 20);
  let displayStreak = simulatedStreak !== null ? simulatedStreak : (user?.currentStreak || 0);
  let displayEnergy = user?.aiTokens || 0;
  let maxEnergy = 50; 
  let isStudiedToday = simulatedStreak !== null; 
  let diffDays = 0;

  if (user) {
    while (displayXp >= reqXp) {
      displayXp -= reqXp; 
      displayLevel += 1;  
      reqXp = Math.floor(500 + Math.pow(displayLevel, 2) * 20); 
    }

    if (user.lastStudyDate) {
      const today = new Date();
      const lastDate = new Date(user.lastStudyDate);
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
      diffDays = (todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24);
      
      if (simulatedStreak === null) isStudiedToday = diffDays === 0;
      if (diffDays > 1 && displayStreak > 0 && (user.streakFreezes || 0) === 0 && simulatedStreak === null) {
          displayStreak = 0;
      }
    }

    const baseCap = 50 + (displayLevel - 1) * 5;
    maxEnergy = user.isPro ? baseCap + 50 : baseCap; 
    if (diffDays > 0 || displayEnergy === 0) displayEnergy = maxEnergy;
  }
  
  const xpPercentage = user ? Math.min(100, Math.max(0, (displayXp / reqXp) * 100)) : 0;

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDesktopStreak, setShowDesktopStreak] = useState(false);
  
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopStreakRef = useRef<HTMLDivElement>(null);
  const linkPopupRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) setShowMobileMenu(false);
    if (desktopStreakRef.current && !desktopStreakRef.current.contains(target)) setShowDesktopStreak(false);
    if (linkPopupRef.current && !linkPopupRef.current.contains(target)) setShowLinkInput(false);
    if (wikiMenuRef.current && !wikiMenuRef.current.contains(target)) setShowWikiMenu(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const StreakPopupContent = () => (
    <div className="flex flex-col gap-1.5 p-0">
      <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[14px] p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0"><Snowflake className="w-4 h-4 text-white" /></div>
          <div className="flex flex-col text-left"><p className="text-[12px] font-bold text-slate-800 dark:text-white leading-none">Bảo vệ chuỗi</p></div>
        </div>
        <span className="text-sm font-black text-blue-500 dark:text-blue-400">{user?.streakFreezes || 0}/2</span>
      </div>
    </div>
  );

  return (
    <>
      <header className="h-20 px-3 md:px-8 flex items-center bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-slate-800 shrink-0 z-30 sticky top-0 transition-colors">
        
        {/* Khối thông báo */}
        {notification && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg border bg-white dark:bg-[#171B24] max-w-[90%] md:max-w-md w-full ${notification.type === 'error' ? 'border-red-500/30 text-red-600 dark:text-red-400' : 'border-slate-200 dark:border-white/10 text-blue-600 dark:text-blue-400'}`}>
            {notification.type === 'error' ? <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />}
            <div className="flex flex-col min-w-0">
              {notification.title && <span className="font-semibold text-sm mb-0.5 leading-snug text-slate-900 dark:text-slate-100">{notification.title}</span>}
              <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{notification.msg}</span>
            </div>
            <button onClick={() => setNotification(null)} className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors shrink-0 text-slate-400"><X size={16} /></button>
          </div>
        )}

        {isMobileSearchOpen ? (
          <div className="flex lg:hidden flex-col absolute top-0 left-0 w-full bg-white dark:bg-[#0f172a] p-4 shadow-xl gap-3 z-50 animate-in fade-in slide-in-from-top-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <HubElLogo className="w-8 h-8 shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <LucianSearchBar
                    value={keyword}
                    onChange={setKeyword}
                    onSubmitTerm={executeSearch}
                    historyList={searchHistoryList}
                    suggestionList={searchSuggestionsList}
                    isOpen={showSuggestions}
                    onOpenChange={setShowSuggestions}
                    placeholder="Tìm kiếm khóa học"
                  />
                </div>

                <button type="button" onClick={() => setIsMobileSearchOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 active:scale-95 shrink-0"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex pl-[44px]">
              <form onSubmit={handlePlayLink} className="flex-1 relative">
                <LinkIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Dán link YouTube..." value={ytLink} onChange={(e) => setYtLink(e.target.value)} disabled={isCheckingLink} className="w-full pl-11 pr-12 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-slate-700/50 rounded-full text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400" />
                
                <button type="submit" disabled={isCheckingLink} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full active:scale-95 shadow-sm disabled:opacity-50 hover:bg-blue-700 transition-colors">
                  {isCheckingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            
            <div className="flex items-center gap-2 shrink-0">
              <HubElLogo className="w-7 h-7 md:w-8 md:h-8" />
              <span className="font-semibold text-lg md:text-xl tracking-tight text-slate-900 dark:text-slate-100 truncate hidden sm:block">Hub-EL</span>
              <button onClick={() => setIsMobileSearchOpen(true)} className="lg:hidden ml-1 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-full text-slate-500 hover:text-blue-500 shadow-sm active:scale-95 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 hidden lg:flex items-center justify-center gap-3 px-4 max-w-2xl" ref={desktopSearchRef}>
              <LucianSearchBar
                value={keyword}
                onChange={setKeyword}
                onSubmitTerm={executeSearch}
                historyList={searchHistoryList}
                suggestionList={searchSuggestionsList}
                isOpen={showSuggestions}
                onOpenChange={setShowSuggestions}
                placeholder="Tìm kiếm khóa học"
              />

              <div className="relative" ref={linkPopupRef}>
                <button onClick={() => setShowLinkInput(!showLinkInput)} className={`p-2.5 rounded-full border ${showLinkInput ? 'bg-blue-600 text-white border-transparent' : 'bg-slate-100 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 shadow-sm border-transparent dark:border-slate-700/50'}`}><LinkIcon className="w-4 h-4" /></button>
                {showLinkInput && (
                  <div className="absolute top-full right-0 mt-3 w-[320px] p-3 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={handlePlayLink} className="flex gap-2">
                      <input type="text" autoFocus placeholder="Dán link YouTube..." value={ytLink} onChange={(e) => setYtLink(e.target.value)} disabled={isCheckingLink} className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-[#0f172a] border dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                      <button type="submit" disabled={isCheckingLink} className="p-2 bg-blue-600 text-white rounded-lg">{isCheckingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}</button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 md:gap-2 text-sm font-medium shrink-0">             
              {user ? (
                <>
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <div className="relative" ref={desktopStreakRef}>
                      <button onClick={() => setShowDesktopStreak(!showDesktopStreak)} className={`flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl border transition-all ${isStudiedToday ? 'bg-orange-500/10 text-orange-600 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                        <Flame className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isStudiedToday ? 'text-orange-500' : 'text-slate-400'}`} /> 
                       <span 
                            key={displayStreak} 
                            className={`font-black text-[11px] md:text-sm ${isStreakBumping ? 'text-white animate-in zoom-in-50 duration-300' : isStudiedToday ? 'text-orange-600 dark:text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            {displayStreak}
                        </span>
                      </button>
                      {showDesktopStreak && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[240px] bg-white dark:bg-[#1e1e24] rounded-[20px] shadow-2xl border dark:border-slate-800 p-2 z-50"><StreakPopupContent /></div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl border bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/30 dark:text-blue-400">
                      <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" /> <span className="font-black text-[11px] md:text-sm">{displayEnergy}/{maxEnergy}</span>
                    </div>
                    
                    <div className="flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl border bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:border-yellow-900/30 dark:text-yellow-500">
                      <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-600 dark:text-yellow-500" /> <span className="font-black text-[11px] md:text-sm">{user?.freeCoins || 0}</span>
                    </div>

                    <div className="flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl border bg-purple-500/10 text-purple-700 border-purple-200 dark:border-purple-900/30 dark:text-purple-400">
                      <Gem className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600 dark:text-purple-500" /> <span className="font-black text-[11px] md:text-sm">{user?.premiumCoins || 0}</span>
                    </div>

                    <Link href="/store" className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border shadow-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-transparent hover:bg-emerald-100">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Cửa hàng</span>
                    </Link>
                  </div>

                  <div className="lg:hidden flex items-center pl-1 md:border-l border-slate-200 dark:border-slate-700 relative" ref={mobileMenuRef}>
                    <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="active:scale-95 ml-1 relative">
                      {user?.image ? (
                          <img src={user.image} alt="Avatar" className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 dark:border-slate-700 shadow-md object-cover" />
                      ) : (
                          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-xs bg-gradient-to-tr from-blue-500 to-purple-500 text-white shadow-md border-2 dark:border-slate-700">{user?.name?.charAt(0) || "U"}</div>
                      )}
                    </button>
                    
                    {showMobileMenu && (
                      <div className="absolute right-0 top-full mt-6 w-[220px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
                          <p className="font-bold text-sm truncate text-slate-900 dark:text-white">{user?.name}</p>
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium"><span>Cấp {displayLevel}</span><span>{displayXp}/{reqXp} XP</span></div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1.5 shadow-inner"><div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full" style={{width: `${xpPercentage}%`}}></div></div>
                        </div>
                        <div className="p-2 space-y-1">
                         <Link href="/gacha" className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                              <BrainCircuit className="w-4 h-4 text-purple-500" /> Wiki
                            </Link>
                            <Link href="/vocabulary" className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                              <BookMarked className="w-4 h-4 text-blue-500" /> Từ vựng
                            </Link>
                          <Link href="/achievements" className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"><Award className="w-4 h-4 text-yellow-500" /> Thành tựu</Link>
                          <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-1.5 mx-2"></div>
                           <Link href={`/profile/${user?.id}`} className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"><Settings className="w-4 h-4 text-slate-500" /> Quản lý tài khoản</Link>
                          <button onClick={() => { setShowStatsModal(true); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"><BarChart2 className="w-4 h-4 text-indigo-500" /> Thống kê</button>
                          
                          <Link href="/store" className="lg:hidden w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors"><ShoppingCart className="w-4 h-4" /> Cửa hàng</Link>
                          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-colors"><LogOut className="w-4 h-4" /> Đăng xuất</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link href="/login" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg">Đăng nhập</Link>
              )}
            </div>
          </div>
        )}
      </header>
      {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} />}
    </>
  );
}