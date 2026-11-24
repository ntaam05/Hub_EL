// src/components/features/achievements/achievement-toast.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { checkAndGetAchievements } from "@/actions/achievements";
import { Trophy, X } from "lucide-react";
import { ACHIEVEMENT_LIST, TIER_STYLES } from "@/config/achievements";
import { cn } from "@/lib/utils";

export function GlobalAchievementToast() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    checkAndGetAchievements(session.user.id).then(res => {
      if (res.success && res.newlyUnlocked && res.newlyUnlocked.length > 0) {
        setQueue(prev => [...prev, ...res.newlyUnlocked]);
      }
    });
  }, [pathname, session?.user?.id]);

  useEffect(() => {
    if (queue.length > 0) {
      const timer = setTimeout(() => {
        setQueue(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [queue]);

  if (queue.length === 0) return null;

  // Lấy ID từ queue, sau đó tự tra cứu file config tĩnh để kéo Icon và Style ra
  const currentToast = queue[0];
  const fullConfig = ACHIEVEMENT_LIST.find(c => c.id === currentToast.id);
  
  // Nếu vì lý do nào đó không tìm thấy config, fallback về mặc định
  const Icon = fullConfig?.icon || Trophy;
  const tierStyle = TIER_STYLES[fullConfig?.tier || 1];
  const title = fullConfig?.title || "Huy hiệu bí ẩn";

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[9999] animate-in slide-in-from-right-8 fade-in duration-300">
      <div className={cn(
        "relative overflow-hidden w-[320px] rounded-2xl border shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex p-4 cursor-default transition-all",
        "bg-white dark:bg-[#111827]",
        tierStyle.border
      )}>
        
        <div className={cn("absolute right-0 top-0 w-32 h-32 blur-[40px] rounded-full opacity-50 pointer-events-none", tierStyle.bg)} />
        
        <div className="flex gap-3 items-center relative z-10 w-full">
          <div className={cn("p-3 rounded-xl shrink-0 border", tierStyle.bg, tierStyle.border)}>
            <Icon className={cn("w-6 h-6", tierStyle.color)} />
          </div>
          
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 flex items-center gap-1">
              <Trophy size={10} className="text-yellow-500" /> Thành tựu mới!
            </p>
            <h4 className={cn("text-sm font-black uppercase tracking-tight truncate", tierStyle.color)}>
              {title}
            </h4>
          </div>

          <button 
            onClick={() => setQueue(prev => prev.slice(1))} 
            className="absolute top-1 right-1 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 h-1 bg-slate-200 dark:bg-slate-800 w-full">
          <div className={cn("h-full animate-[shrinkWidth_5s_linear_forwards]", tierStyle.bg.replace('/10', ''))} />
        </div>

        <style>{`
          @keyframes shrinkWidth { from { width: 100%; } to { width: 0%; } }
        `}</style>
      </div>
    </div>
  );
}