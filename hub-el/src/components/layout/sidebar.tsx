"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  Home, BrainCircuit, Users, Award, Trophy, Menu, 
  LogOut, Settings, BarChart2, BookMarked,
  Book, Target, Library, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeTogglePill } from "./theme-toggle"; 
import { StatsModal } from "../modals/stats-modal";
import { useRouter } from "next/navigation"
import { getFreshUserStatsAction } from '@/actions/user/learning';
// 🚨 IMPORT NÚT GÓP Ý VÀO ĐÂY
import { FeedbackButton } from "@/components/layout/FeedbackButton";

const mainMenuItems = [
  { icon: Home, label: "Bảng điều khiển", href: "/dashboard" },
  { icon: Book, label: "Khóa học của tôi", href: "/courses" },    
  { icon: Target, label: "Góc luyện tập", href: "/quizzes" },    
  { icon: Users, label: "Trò chuyện", href: "/social" },
  { icon: Award, label: "Thành tựu", href: "/achievements" },
  { icon: Trophy, label: "Bảng xếp hạng", href: "/leaderboard" },
];

export function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState<any>(session?.user || null);

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

  useEffect(() => {
    const handleStatsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { xpDelta = 0, isPro } = customEvent.detail;
      
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

        return { 
          ...baseUser, 
          xp: newXp, 
          level: newLevel,
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
    const user = cachedUser || session?.user;

  const { displayLevel, displayXp, reqXp, xpPercentage } = useMemo(() => {
    let lvl = user?.level || 1;
    let xp = user?.xp || 0;
    
    let required = Math.floor(500 + Math.pow(lvl, 2) * 20);

    if (user) {
      while (xp >= required) {
        xp -= required;
        lvl += 1;
        required = Math.floor(500 + Math.pow(lvl, 2) * 20); 
      }
    }

    const percentage = user ? Math.min(100, Math.max(0, (xp / required) * 100)) : 0;
    
    return { displayLevel: lvl, displayXp: xp, reqXp: required, xpPercentage: percentage };
  }, [user?.level, user?.xp]);

  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowUserMenu(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const isWikiSectionActive = pathname.startsWith('/wiki-manager') || pathname.startsWith('/gacha') || pathname.startsWith('/vocabulary');

  return (
    <>
      <aside className={cn(
        "border-r flex-col hidden md:flex transition-all duration-300 shrink-0 relative z-40 bg-white dark:bg-[#0f172a] border-slate-200/80 dark:border-slate-800 shadow-[2px_0_10px_rgba(0,0,0,0.02)]",
        isCollapsed ? "w-20" : "w-64"
      )}>
        
        <div className={cn(
          "h-16 flex items-center border-b border-slate-200/80 dark:border-slate-800",
          isCollapsed ? "justify-center px-4" : "justify-between px-6"
        )}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="transition-colors p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800" 
          >
            <Menu className="w-6 h-6" />
          </button>
          {!isCollapsed && <ThemeTogglePill />}
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          {mainMenuItems.map(({ icon: Icon, label, href }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : ""}
                className={cn(
                  "w-full flex items-center gap-3 py-3 rounded-xl transition-all font-semibold",
                  isCollapsed ? "justify-center px-0" : "px-3",
                  isActive
                    ? "bg-blue-600/10 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
              </Link>
            )
          })}

          <div className="h-px bg-slate-200 dark:bg-slate-700/80 my-4 mx-2" />

          <div className="space-y-1 relative">
            <Link
              href="/wiki-manager"
              title={isCollapsed ? "Ngoại ngữ với Wiki" : ""}
              className={cn(
                "w-full flex items-center gap-3 py-3 rounded-xl transition-all font-semibold relative z-10",
                isCollapsed ? "justify-center px-0" : "px-3",
                pathname.startsWith('/wiki-manager') 
                  ? "bg-blue-600/10 text-blue-700 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              )}
            >
              <BookMarked className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Ngoại ngữ với Wiki</span>}
            </Link>

            {isWikiSectionActive && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                <Link
                  href="/gacha"
                  title={isCollapsed ? "Thẻ Wiki" : ""}
                  className={cn(
                    "w-full flex items-center transition-all font-semibold rounded-xl",
                    isCollapsed ? "justify-center px-0 py-3 gap-0 mt-2" : "pl-11 pr-3 py-2.5 gap-3 text-sm mt-1",
                    pathname.startsWith('/gacha')
                      ? "bg-blue-600/10 text-blue-700 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <BrainCircuit className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                  {!isCollapsed && <span className="whitespace-nowrap">Thẻ Wiki</span>}
                </Link>

                <Link
                  href="/vocabulary"
                  title={isCollapsed ? "Từ Vựng" : ""}
                  className={cn(
                    "w-full flex items-center transition-all font-semibold rounded-xl",
                    isCollapsed ? "justify-center px-0 py-3 gap-0 mt-2" : "pl-11 pr-3 py-2.5 gap-3 text-sm mt-1",
                    pathname.startsWith('/vocabulary')
                      ? "bg-blue-600/10 text-blue-700 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Library className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                  {!isCollapsed && <span className="whitespace-nowrap">Từ Vựng</span>}
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* 🚨 ĐẨY NÚT GÓP Ý LÊN TRÊN ĐƯỜNG KẺ GẠCH NGANG */}
        <div className="px-3 pb-1">
          <FeedbackButton isCollapsed={isCollapsed} />
        </div>

        <div className="relative p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent" ref={menuRef}>

          {showUserMenu && session && (
            <div className={cn(
              "absolute bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in z-50",
              isCollapsed ? "left-full ml-2 bottom-0 w-56 slide-in-from-left-2" 
              : "bottom-full mb-2 left-3 w-[calc(100%-1.5rem)] slide-in-from-bottom-2"
            )}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-bold truncate text-slate-900 dark:text-white">{user?.name}</p>
                  {user?.isPro && <span className="bg-yellow-400 text-yellow-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 shadow-sm">Pro</span>}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1 mb-1 font-medium">
                  <span>Cấp {displayLevel}</span>
                  <span>{displayXp}/{reqXp} XP</span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden bg-slate-200 dark:bg-slate-900">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full" style={{width: `${xpPercentage}%`}}></div>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button onClick={() => { setShowStatsModal(true); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-700 dark:hover:text-white"><BarChart2 className="w-4 h-4" /> Thống kê học tập</button>
                <button onClick={() => { setShowUserMenu(false); router.push(`/profile/${user?.id}`); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-700 dark:hover:text-white">
                  <Settings className="w-4 h-4" /> Quản lý tài khoản
                </button>
                
                {(user as any)?.role === "admin" && (
                  <button onClick={() => { setShowUserMenu(false); router.push(`/admin`); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                    <ShieldCheck className="w-4 h-4" /> Quản trị viên
                  </button>
                )}

                <div className="h-px my-1 mx-2 bg-slate-200/80 dark:bg-slate-700"></div>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"><LogOut className="w-4 h-4" /> Đăng xuất</button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            disabled={!session}
            className={cn(
              "w-full flex p-2 rounded-xl transition-colors hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-transparent",
              isCollapsed ? "flex-col items-center gap-2" : "items-center gap-3"
            )}
          >
            <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden",
                user?.isPro 
                  ? "bg-gradient-to-tr from-yellow-400 to-yellow-500 text-yellow-950 shadow-[0_0_10px_rgba(234,179,8,0.3)]" 
                  : "bg-gradient-to-tr from-blue-500 to-purple-500 text-white shadow-sm"
              )}>
                {user?.image ? (
                  <Image src={user.image} alt="Avatar" width={40} height={40} className="object-cover w-full h-full" />
                ) : (
                  user?.name?.charAt(0) || "U"
                )}
              </div>
              {isCollapsed && (
                <div className="w-8 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style={{width: `${xpPercentage}%`}}></div>
                </div>
              )}
            </div>
            
            {!isCollapsed && session && (
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-bold text-sm truncate text-slate-800 dark:text-slate-200">{user?.name}</p>
                  {user?.isPro && <span className="bg-yellow-400 text-yellow-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 shadow-sm">Pro</span>}
                </div>
                <div className="mt-1">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5 font-semibold">
                    <span>Lv. {displayLevel}</span>
                    <span>{displayXp}/{reqXp} XP</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-inner">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style={{width: `${xpPercentage}%`}}></div>
                  </div>
                </div>
              </div>
            )}

            {!isCollapsed && !session && (
               <div className="flex-1 text-left"><p className="text-xs font-bold opacity-50">Chưa đăng nhập</p></div>
            )}
          </button>
        </div>
      </aside>

      {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} />}
    </>
  );
}