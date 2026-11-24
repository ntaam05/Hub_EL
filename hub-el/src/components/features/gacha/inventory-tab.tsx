"use client";

import { X, BrainCircuit, ChevronLeft, ChevronRight, Book } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; 
import { getGachaHistory } from "@/actions/gacha"; 
import { cn } from "@/lib/utils";
import { WikiCard3D } from "@/components/ui/wiki-card-3d"; 

export function InventoryModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const router = useRouter(); 
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardToConfirm, setCardToConfirm] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 8; 
  const totalPages = Math.max(1, Math.ceil(inventory.length / ITEMS_PER_PAGE));
  const currentCards = inventory.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const leftPageCards = currentCards.slice(0, 4);
  const rightPageCards = currentCards.slice(4, 8);

  useEffect(() => {
    async function fetchInventory() {
      if(!userId) return;
      const data = await getGachaHistory(userId); 
      setInventory(data);
      setIsLoading(false);
    }
    fetchInventory();
  }, [userId]);

  // Logic: Ràng buộc sự kiện bàn phím (trái/phải) để lật trang sổ mượt mà mà không cần click chuột.
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (cardToConfirm) return;
    if (e.key === 'ArrowRight' && currentPage < totalPages - 1) setCurrentPage(p => p + 1);
    if (e.key === 'ArrowLeft' && currentPage > 0) setCurrentPage(p => p - 1);
  }, [currentPage, totalPages, cardToConfirm]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleConfirmStudy = () => {
    const targetCardId = cardToConfirm.id;
    setCardToConfirm(null); 
    onClose(); 
    router.push(`/wiki/${targetCardId}`); 
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/40 dark:bg-black/90 backdrop-blur-md flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-200">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      <div className="bg-white/95 dark:bg-[#0b1120]/95 border-2 border-slate-300 dark:border-slate-800 w-full max-w-6xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 relative h-[92vh]">
        
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 dark:from-black/60 to-transparent border-r border-slate-200/50 dark:border-white/5 pointer-events-none z-10" />

        <div className="flex justify-between items-center px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 shrink-0 z-20 h-[60px]">
          <div className="flex items-center gap-3">
             <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" /> 
             <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Sổ Sưu Tập Wiki</h2>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">{inventory.length} thẻ</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 flex flex-row relative z-20 h-full overflow-hidden">
          
          <div 
            onClick={() => currentPage > 0 && setCurrentPage(p => p - 1)}
            className={cn("w-10 sm:w-12 flex items-center justify-center transition-all bg-slate-100/50 dark:bg-slate-900/30", currentPage > 0 ? "cursor-pointer hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-white" : "opacity-20 text-slate-400 dark:text-slate-600")}
          >
            <ChevronLeft size={28} />
          </div>

          <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#050810]">
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute -top-[30%] -left-[30%] w-[100%] h-[100%] bg-purple-300/30 dark:bg-purple-900/30 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
              <div className="absolute top-[40%] right-[10%] w-[80%] h-[80%] bg-blue-300/30 dark:bg-blue-900/20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '10s' }} />
              <div className="absolute inset-0 opacity-10 dark:opacity-30 [background-image:radial-gradient(circle_at_center,black_1px,transparent_1px)] dark:[background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)]" style={{ backgroundSize: '30px 30px' }} />
              <div className="absolute inset-0 opacity-5 dark:opacity-20 [background-image:radial-gradient(circle_at_center,black_1.5px,transparent_1.5px)] dark:[background-image:radial-gradient(circle_at_center,white_1.5px,transparent_1.5px)]" style={{ backgroundSize: '70px 70px', backgroundPosition: '20px 20px' }} />
            </div>

            <div className="relative z-10 w-full h-full p-4 lg:p-8 grid grid-cols-2 gap-x-6 gap-y-3 lg:gap-x-12 lg:gap-y-5 content-center overflow-y-auto no-scrollbar">
               {leftPageCards.map((item, index) => (
                  <div key={`L-${index}`} className="flex justify-center items-center w-full aspect-[2.5/3.5]">
                    <WikiCard3D card={item.card} currentAwakenedStars={item.card.awakenedStars || 0} interactive={false} scale={0.8} onClick={() => setCardToConfirm(item.card)} />
                  </div>
               ))}
            </div>
          </div>

          <div className="hidden sm:flex w-8 lg:w-10 bg-gradient-to-r from-slate-200 via-slate-50 to-slate-200 dark:from-slate-900 dark:via-[#060a14] dark:to-slate-900 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-x border-slate-300/50 dark:border-slate-800/50 flex-col items-center justify-center gap-12 z-30">
             <div className="w-2.5 h-16 rounded-full bg-slate-300 dark:bg-slate-600 shadow-[1px_1px_3px_rgba(0,0,0,0.2)] dark:shadow-[2px_2px_5px_rgba(0,0,0,0.8)] border border-slate-400/50 dark:border-slate-500/50" />
             <div className="w-2.5 h-16 rounded-full bg-slate-300 dark:bg-slate-600 shadow-[1px_1px_3px_rgba(0,0,0,0.2)] dark:shadow-[2px_2px_5px_rgba(0,0,0,0.8)] border border-slate-400/50 dark:border-slate-500/50" />
             <div className="w-2.5 h-16 rounded-full bg-slate-300 dark:bg-slate-600 shadow-[1px_1px_3px_rgba(0,0,0,0.2)] dark:shadow-[2px_2px_5px_rgba(0,0,0,0.8)] border border-slate-400/50 dark:border-slate-500/50" />
          </div>

          <div className="hidden sm:flex flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#050810]">
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute bottom-[20%] -right-[20%] w-[100%] h-[100%] bg-pink-300/30 dark:bg-pink-900/20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
              <div className="absolute -top-[10%] left-[20%] w-[70%] h-[70%] bg-indigo-300/30 dark:bg-indigo-900/25 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
              <div className="absolute inset-0 opacity-10 dark:opacity-30 [background-image:radial-gradient(circle_at_center,black_1px,transparent_1px)] dark:[background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)]" style={{ backgroundSize: '40px 40px', backgroundPosition: '10px 10px' }} />
              <div className="absolute inset-0 opacity-5 dark:opacity-20 [background-image:radial-gradient(circle_at_center,black_1.5px,transparent_1.5px)] dark:[background-image:radial-gradient(circle_at_center,white_1.5px,transparent_1.5px)]" style={{ backgroundSize: '85px 85px', backgroundPosition: '30px 40px' }} />
            </div>

            <div className="relative z-10 w-full h-full p-4 lg:p-8 grid grid-cols-2 gap-x-6 gap-y-3 lg:gap-x-12 lg:gap-y-5 content-center overflow-y-auto no-scrollbar">
               {rightPageCards.map((item, index) => (
                  <div key={`R-${index}`} className="flex justify-center items-center w-full aspect-[2.5/3.5]">
                    <WikiCard3D card={item.card} currentAwakenedStars={item.card.awakenedStars || 0} interactive={false} scale={0.8} onClick={() => setCardToConfirm(item.card)} />
                  </div>
               ))}
            </div>
          </div>

          <div 
            onClick={() => currentPage < totalPages - 1 && setCurrentPage(p => p + 1)}
            className={cn("w-10 sm:w-12 flex items-center justify-center transition-all bg-slate-100/50 dark:bg-slate-900/30", currentPage < totalPages - 1 ? "cursor-pointer hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-white" : "opacity-20 text-slate-400 dark:text-slate-600")}
          >
            <ChevronRight size={28} />
          </div>

        </div>

        <div className="flex justify-center items-center py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 shrink-0 z-20 h-[40px]">
          <div className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-widest uppercase">
            TRANG {currentPage + 1} / {totalPages}
          </div>
        </div>
      </div>

      {cardToConfirm && (
         <div className="absolute inset-0 z-[60] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 flex flex-col items-center text-center relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
               <BrainCircuit className="w-16 h-16 text-blue-600 dark:text-blue-400 mb-4 drop-shadow-[0_0_5px_rgba(37,99,235,0.3)] dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
               <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-wide uppercase">Khai Phá Tri Thức</h3>
               <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                 Hệ thống sẽ chuyển bạn đến phòng học AI để phân tích thẻ <br/>
                 <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-lg text-base inline-block mt-3 shadow-inner">
                   {cardToConfirm.title}
                 </strong>
               </p>
               <div className="flex w-full gap-3 relative z-10">
                 <button onClick={() => setCardToConfirm(null)} className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold">Hủy bỏ</button>
                 <button onClick={handleConfirmStudy} className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all font-black shadow-lg hover:shadow-blue-500/25 uppercase tracking-wider">Học Ngay</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}