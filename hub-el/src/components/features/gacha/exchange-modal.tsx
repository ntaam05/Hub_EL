"use client";

import { X, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getExchangeData, exchangeCard } from "@/actions/gacha"; 
import { cn } from "@/lib/utils";
import { WikiCard3D } from "@/components/ui/wiki-card-3d";

const RARITY_COST: Record<string, number> = {
  'MR': 5000, 'LR': 2000, 'UR': 800, 'SSR': 300, 'SR': 100, 'R': 30, 'N': 10
};

const RARITY_ORDER = ['MR', 'LR', 'UR', 'SSR', 'SR', 'R', 'N'];

const RARITY_STYLE: Record<string, string> = {
  'MR': 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-purple-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] border-pink-500',
  'LR': 'text-teal-500 border-teal-500',
  'UR': 'text-red-500 border-red-500',
  'SSR': 'text-yellow-500 border-yellow-500',
  'SR': 'text-purple-500 border-purple-500',
  'R': 'text-blue-500 border-blue-500',
  'N': 'text-slate-500 border-slate-500'
};

export function ExchangeModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const [unownedCards, setUnownedCards] = useState<any[]>([]);
  const [myStardust, setMyStardust] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [confirmCard, setConfirmCard] = useState<any>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  
  const [exchangeStep, setExchangeStep] = useState<'idle' | 'spinning' | 'revealed'>('idle');
  const [revealedCardConfig, setRevealedCardConfig] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Workaround bug: Modal `fixed` có thể đè lên Sidebar gây vướng víu. 
  // Dùng MutationObserver để bắt trạng thái đóng/mở của Sidebar và đẩy mép trái (left margin) của Modal ra cho khớp.
  useEffect(() => {
    const checkSidebar = () => {
      const isCollapsed = document.documentElement.classList.contains("collapsed") || 
                          document.body.classList.contains("sidebar-collapsed") ||
                          document.querySelector('aside')?.classList.contains('w-20');
      setIsSidebarCollapsed(Boolean(isCollapsed));
    };
    checkSidebar();
    const observer = new MutationObserver(checkSidebar);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const aside = document.querySelector('aside');
    if (aside) observer.observe(aside, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getExchangeData(userId) as any;
    if (res.success) {
      setMyStardust(res.stardust);
      setUnownedCards(res.unownedCards);
    }
    setIsLoading(false);
  };

  useEffect(() => { if (userId) fetchData(); }, [userId]);

  // Logic: Gom nhóm (Group by) danh sách thẻ thô từ DB thành từng cục array theo độ hiếm (Rarity) để dễ dàng lặp render UI.
  const groupedCards = useMemo(() => {
    const groups: Record<string, any[]> = {};
    unownedCards.forEach(card => {
      const r = card.rarity || 'N';
      if (!groups[r]) groups[r] = [];
      groups[r].push(card);
    });
    return groups;
  }, [unownedCards]);

  const handleExchange = async () => {
    if (!confirmCard || isExchanging) return;
    setIsExchanging(true);
    const cost = RARITY_COST[confirmCard.rarity || 'N'];
    
    const res = await exchangeCard(userId, confirmCard.id, cost);
    if (res.success) {
      setRevealedCardConfig({
        ...confirmCard,
        contentText: confirmCard.contentText || "Dữ liệu đang được cập nhật...",
        wikiUrl: confirmCard.url || confirmCard.wikiUrl || `https://vi.wikipedia.org/wiki/${encodeURIComponent(confirmCard.title)}`
      });

      setExchangeStep('spinning');
      setTimeout(() => {
        setExchangeStep('revealed');
        setIsExchanging(false);
      }, 800);
    } else {
      alert(res.message);
      setIsExchanging(false);
    }
  };

  const handleCloseReveal = () => {
    setExchangeStep('idle');
    setConfirmCard(null);
    setRevealedCardConfig(null);
    fetchData();
  };

  return (
    <div className={cn(
      "fixed top-16 right-0 bottom-0 z-[100] bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-200 transition-all duration-300 left-0",
      isSidebarCollapsed ? "lg:left-20" : "lg:left-64"
    )}>
      <style>{`
        @keyframes storeCardSpin { 0% { transform: scale(1) rotateY(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: scale(1) rotateY(360deg); opacity: 1; } }
        @keyframes cardRevealScale { 0% { transform: scale(1.2); opacity: 0; } 10% { opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="bg-slate-50 dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col overflow-hidden h-full relative">
        <div className="flex justify-between items-center px-6 py-3 h-[60px] border-b border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-green-500/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">Tiệm Đổi Thẻ</h2>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-l border-slate-300 dark:border-slate-700 pl-3">
                Bụi Sao: <span className="text-green-600 dark:text-green-400 text-sm">{myStardust}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-[#0a0a0c]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500 dark:text-white/50 animate-pulse font-bold">Đang tải kệ hàng...</div>
          ) : unownedCards.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/30 space-y-4">
              <CheckCircle2 className="w-16 h-16 opacity-50 text-green-500" />
              <span className="italic font-medium">Bạn đã sở hữu toàn bộ thẻ trong hệ thống!</span>
            </div>
          ) : (
            <div className="space-y-10">
              {RARITY_ORDER.map((rarity) => {
                const cards = groupedCards[rarity];
                if (!cards || cards.length === 0) return null;
                const cost = RARITY_COST[rarity];

                return (
                  <div key={rarity} className="animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-white/10 pb-2 mb-4">
                      <h3 className={cn("text-2xl font-black italic tracking-tighter", RARITY_STYLE[rarity])}>
                        {rarity} TIER
                      </h3>
                      <div className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300">
                        Giá: <span className="text-green-600 dark:text-green-400">{cost} Bụi sao</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {cards.map(card => (
                        <div 
                          key={card.id} 
                          onClick={() => setConfirmCard(card)}
                          className={cn(
                            "group cursor-pointer rounded-xl border-[3px] bg-white dark:bg-slate-800 p-2 flex flex-col items-center text-center transition-all hover:scale-105 shadow-sm hover:shadow-xl",
                            RARITY_STYLE[rarity].split(' ').find(c => c.startsWith('border-')),
                            myStardust >= cost ? "opacity-100" : "opacity-60 grayscale-[50%]"
                          )}
                        >
                          <div className="w-full aspect-square rounded-lg bg-slate-100 dark:bg-slate-900 mb-2 overflow-hidden flex items-center justify-center relative">
                            {card.imageUrl ? (
                              <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
                            ) : (
                              <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            )}
                            {myStardust < cost && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-red-400 font-bold text-[10px] uppercase bg-black/80 px-2 py-1 rounded">Không đủ bụi</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-black text-slate-800 dark:text-white line-clamp-2 leading-tight">
                            {card.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {exchangeStep !== 'idle' && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none overflow-hidden">
            
            {exchangeStep === 'spinning' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[420px] shrink-0 bg-white rounded-2xl animate-[storeCardSpin_0.8s_ease-in_forwards]" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }} />
            )}

            {exchangeStep === 'revealed' && revealedCardConfig && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-[6px] z-[100]" onClick={handleCloseReveal}>
                <WikiCard3D card={revealedCardConfig} scale={1} />
                <div className="mt-8 flex flex-col items-center z-[110] relative">
                  <p className="text-green-400 font-black text-xl mb-4 uppercase tracking-widest text-center drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">
                    Đổi thẻ thành công!
                  </p>
                  <button onClick={handleCloseReveal} className="px-10 py-3.5 bg-slate-100 text-slate-800 dark:bg-white dark:text-black font-black rounded-xl uppercase tracking-wider shadow-lg transition-transform active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-200 pointer-events-auto">
                    Xác nhận
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {confirmCard && exchangeStep === 'idle' && (
        <div className="absolute inset-0 z-[110] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
           <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 p-6 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 flex flex-col items-center text-center">
              <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase">Xác nhận đổi thẻ</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Bạn có chắc muốn dùng <strong className="text-green-600 dark:text-green-400">{RARITY_COST[confirmCard.rarity || 'N']} Bụi sao</strong> để đổi lấy thẻ <br/>
                <strong className={cn("text-lg italic", RARITY_STYLE[confirmCard.rarity || 'N'])}>{confirmCard.title}</strong> không?
              </p>
              <div className="flex w-full gap-3">
                <button disabled={isExchanging} onClick={() => setConfirmCard(null)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Hủy</button>
                <button disabled={isExchanging || myStardust < RARITY_COST[confirmCard.rarity || 'N']} onClick={handleExchange} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-slate-400 text-white font-black transition-colors uppercase tracking-wider">
                  {isExchanging ? "Đang đổi..." : "Đổi ngay"}
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}