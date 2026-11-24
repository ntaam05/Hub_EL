// src/components/ui/wiki-card-3d.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// --- CẤU HÌNH GIAO DIỆN ---
const RARITY_CONFIG: Record<string, any> = {
  'N': { hex: '#94a3b8', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-400', gradient: 'from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-800' },
  'R': { hex: '#3b82f6', color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-400', gradient: 'from-cyan-300 to-blue-400 dark:from-cyan-600 dark:to-blue-800' },
  'SR': { hex: '#a855f7', color: 'text-purple-500', bg: 'bg-purple-500/20', border: 'border-purple-400', gradient: 'from-fuchsia-300 to-purple-400 dark:from-fuchsia-600 dark:to-purple-800' },
  'SSR': { hex: '#eab308', color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-400', gradient: 'from-amber-300 to-yellow-500 dark:from-amber-600 dark:to-orange-700' },
  'UR': { hex: '#ef4444', color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-400', gradient: 'from-rose-300 to-red-500 dark:from-rose-700 dark:to-red-900' },
  'LR': { hex: '#2dd4bf', color: 'text-teal-500', bg: 'bg-teal-500/20', border: 'border-teal-400', gradient: 'from-emerald-300 to-teal-400 dark:from-emerald-700 dark:to-cyan-900' },
  'MR': { hex: '#ec4899', color: 'text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-yellow-400 to-purple-500', bg: 'bg-gradient-to-br from-pink-400 via-rose-500 to-fuchsia-500', border: 'border-pink-500', gradient: 'from-pink-400 to-fuchsia-500' },
};

const NEXT_RARITY_COLOR: Record<string, string> = {
  'N': 'text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,1)]',
  'R': 'text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,1)]',
  'SR': 'text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,1)]',
  'SSR': 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,1)]',
  'UR': 'text-teal-400 drop-shadow-[0_0_20px_rgba(45,212,191,1)]',
  'LR': 'text-pink-500 drop-shadow-[0_0_25px_rgba(236,72,153,1)]',
  'MR': 'text-pink-500 drop-shadow-[0_0_30px_rgba(236,72,153,1)]',
};

const AWAKENED_EFFECTS: Record<string, any> = {
  'N': { star: 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,1)]' }, 
  'R': { star: 'text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,1)]' }, 
  'SR': { star: 'text-yellow-400 drop-shadow-[0_0_25px_rgba(234,179,8,1)]' }, 
  'SSR': { star: 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,1)]' }, 
  'UR': { star: 'text-teal-400 drop-shadow-[0_0_40px_rgba(45,212,191,1)]' }, 
  'LR': { star: 'text-pink-500 drop-shadow-[0_0_40px_rgba(236,72,153,1)]' }, 
  'MR': { star: 'text-pink-500 drop-shadow-[0_0_50px_rgba(236,72,153,1)]' }, 
};

function getRunningLines(stars: number, hexColor: string) {
  if (!stars || stars < 1) return 'none';
  const pct = 100 / stars; 
  const tail = Math.min(8, 25 / stars); 
  return `repeating-conic-gradient(from 0deg, transparent 0%, transparent calc(${pct}% - ${tail}%), ${hexColor} ${pct}%)`;
}

// Logic: Chuẩn hóa Interface (Kiểu dữ liệu) để mọi màn hình đều có thể truyền Props vào.
export interface WikiCard3DProps {
  card: any; // Data thẻ gốc từ DB
  currentAwakenedStars?: number; // Số sao thực tế user đang có
  isPass?: boolean; // Cờ hiệu ứng báo pass (Thêm laze)
  isRestored?: boolean; // Cờ hiệu ứng hồi sao (Chớp sao)
  lostStar?: boolean; // Cờ hiệu ứng vỡ sao
  cardDropped?: boolean; // Cờ hiệu ứng rớt thẻ xuống hố
  scale?: number; // Phóng to / Thu nhỏ tỷ lệ tổng thể (Ví dụ màn quản lý thì cho thẻ bằng 0.5 thôi)
  onClick?: () => void; // Bấm vào thẻ thì làm gì?
  interactive?: boolean; // Có cho phép rê chuột xoay thẻ không?
  className?: string; // Bọc CSS bổ sung
}

export function WikiCard3D({
  card,
  currentAwakenedStars = 0,
  isPass = false,
  isRestored = false,
  lostStar = false,
  cardDropped = false,
  scale = 1,
  onClick,
  interactive = true,
  className
}: WikiCard3DProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0, sweep: 50, opacity: 0 });
  const cardAreaRef = useRef<HTMLDivElement>(null);

  // Background check tỷ lệ ảnh để chia layout (Dọc hay ngang)
  useEffect(() => {
    if (card?.imageUrl) {
      const img = new Image();
      img.onload = () => setOrientation(img.height >= img.width ? 'portrait' : 'landscape');
      img.src = card.imageUrl;
    }
  }, [card?.imageUrl]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !cardAreaRef.current) return;
    const rect = cardAreaRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTilt({ x: -yPct * 30, y: xPct * 30, sweep: ((xPct + 0.5) + (yPct + 0.5)) / 2 * 100, opacity: 1 });
  };
  
  const handleMouseLeave = () => setCardTilt({ x: 0, y: 0, sweep: 50, opacity: 0 });

  const cardConfig = RARITY_CONFIG[card?.rarity || 'N'];
  if (!cardConfig) return null;

  return (
    // Component bọc ngoài cùng bắt chuột
    <div 
      ref={cardAreaRef} 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
      className={cn("relative flex items-center justify-center pointer-events-auto", className)}
      style={{ width: 280 * scale, height: 420 * scale }}
    >
      {/* Vùng Render Thẻ 3D */}
      <div 
        className={cn(
          "absolute origin-center cursor-pointer",
          // Quét cờ (Flag) từ các màn hình truyền vào để chạy Animation tương ứng
          cardDropped ? "animate-[cardDropOut_1s_ease-in_forwards] pointer-events-none" : "",
          (!cardDropped && !interactive) ? "animate-[cardRevealScale_0.5s_ease-out_forwards]" : ""
        )}
        style={{ perspective: '1000px', transform: `scale(${scale})` }} 
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <div 
          className={`w-[280px] h-[420px] rounded-[14px] border-[4px] ${cardConfig.border} p-1 flex flex-col shadow-2xl relative`} 
          style={{ transformStyle: 'preserve-3d', transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`, transition: 'transform 0.1s ease-out' }}
        >
          {/* Laze chạy quanh thẻ (Khi có sao) */}
          {(currentAwakenedStars > 0 || isPass) && (
            <div className="absolute inset-0 z-0 overflow-hidden rounded-[8px]"> 
              <div className="absolute w-[250%] h-[250%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 animate-[spin_3s_linear_infinite]"
                  style={{ background: getRunningLines(currentAwakenedStars, cardConfig.hex) }} />
            </div>
          )}

          {/* Vỡ sao (Khi rớt) */}
          {!isPass && lostStar && !cardDropped && (
            <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 rounded-[10px] animate-in fade-in duration-300">
                <Star size={100} className="text-red-500 fill-red-500" style={{ animation: 'starShatter 1s ease-out 1.2s forwards' }} />
            </div>
          )}

          {/* Nội dung bên trong khung thẻ */}
          <div className={`absolute inset-[2.5px] rounded-[10px] overflow-hidden z-10 ${orientation === 'landscape' ? 'bg-slate-100 dark:bg-slate-900' : 'bg-slate-800'}`}> 
            <div className={`absolute inset-0 ${cardConfig.bg} opacity-50`} />
            {orientation === 'portrait' && (
              <div className="absolute inset-0 overflow-hidden">
                {card.imageUrl ? <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover scale-105" /> : <div className={`w-full h-full bg-gradient-to-br ${cardConfig.gradient} flex items-center justify-center`}><Sparkles size={80} className="text-white/40" /></div>}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
              </div>
            )}
          </div>

          <div className="relative z-20 flex flex-col h-full p-1 min-h-0 pointer-events-none">
            {/* Header Thẻ */}
            <div className="flex items-center gap-1.5 mb-1 w-full shrink-0">
                <span className={cn(`font-serif font-black text-[38px] italic tracking-tight shrink-0 leading-none pl-1`, orientation === 'portrait' ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : 'drop-shadow-md', cardConfig.color)} style={{ WebkitTextStroke: '1px rgba(255,255,255,0.8)' }}>{card.rarity}</span>
                <div className={cn("flex-1 overflow-x-auto min-w-0 flex items-center pt-1 pb-1")} style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                    <h2 className={cn("font-extrabold text-[15px] uppercase tracking-wide whitespace-nowrap pr-2", orientation === 'portrait' ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)]' : 'text-slate-800 dark:text-slate-200 drop-shadow-sm')}>{card.title}</h2>
                </div>
            </div>

            {/* Layout nội dung theo chiều dọc/ngang */}
            {orientation === 'portrait' ? (
                <div className="mt-auto relative z-20 flex-1 min-h-0 flex flex-col justify-end pointer-events-auto">
                    <div className="relative w-full">
                        <div onClick={(e) => { e.stopPropagation(); window.open(card.wikiUrl || `https://vi.wikipedia.org/wiki/${encodeURIComponent(card.title)}`, '_blank'); }} title="Xem Wikipedia" className="absolute -top-8 right-1 z-50 text-white/80 hover:text-white bg-transparent w-6 h-6 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto transition-colors border-[1.5px] border-white/50 hover:border-white shadow-sm"><span className="font-serif italic font-bold text-[12px] leading-none">i</span></div>
                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-2.5 border border-white/20 flex flex-col h-auto max-h-[120px] shadow-[0_4px_10px_rgba(0,0,0,0.4)] pointer-events-auto">
                            <div className="flex-1 min-h-0 overflow-y-auto text-[10px] font-medium text-slate-50 leading-relaxed pr-2 text-justify drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>{card.contentText}</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col w-full gap-1 pb-0.5 min-h-0 pointer-events-auto">
                    <div className={`w-full flex-1 rounded-md flex items-center justify-center bg-gradient-to-br ${cardConfig.gradient} shadow-inner relative overflow-hidden border border-slate-400 shrink-0 min-h-[140px] max-h-[180px]`}>
                        {card.imageUrl ? <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover opacity-95" /> : <Sparkles size={48} className="text-white/80 animate-pulse" />}
                        <div onClick={(e) => { e.stopPropagation(); window.open(card.wikiUrl || `https://vi.wikipedia.org/wiki/${encodeURIComponent(card.title)}`, '_blank'); }} title="Xem Wikipedia" className="absolute bottom-1.5 right-1.5 text-white/80 hover:text-white bg-transparent w-6 h-6 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto transition-colors z-50 border-[1.5px] border-white/50 hover:border-white shadow-sm"><span className="font-serif italic font-bold text-[12px] leading-none">i</span></div>
                    </div>
                    <div className="flex-1 min-h-0 bg-white/70 dark:bg-slate-900/70 rounded-md p-2.5 border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col relative z-20 pointer-events-auto shadow-sm">
                        <div className="flex-1 min-h-0 overflow-y-auto text-[11px] font-medium text-slate-800 dark:text-slate-300 leading-relaxed pr-2 text-justify" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>{card.contentText}</div>
                    </div>
                </div>
            )}
          </div>

          {/* Dàn Sao 3D */}
          <div className="absolute -bottom-[10px] left-0 right-0 flex justify-center items-center pointer-events-none z-50">
            {[...Array(card.totalStars || 1)].map((_, i) => {
                const mid = ((card.totalStars || 1) - 1) / 2;
                const dist = Math.abs(i - mid);
                const starScale = 1 - dist * 0.12; 
                
                // Logic hiển thị trạng thái sao linh hoạt theo hiệu ứng
                const isAlreadyAwakened = i < currentAwakenedStars - (isPass ? 1 : 0);
                const isNewlyAwakened = i === currentAwakenedStars - 1;

                let starColorClass = 'text-slate-500 fill-slate-800 drop-shadow-none'; 
                let isMRStar = false;

                // Nếu đang có hiệu ứng nhận sao (isPass/isRestored) -> Dùng màu độ hiếm kế tiếp
                if (isPass || isRestored && (isNewlyAwakened || isAlreadyAwakened)) {
                    const colorKeys = Object.keys(NEXT_RARITY_COLOR);
                    const nextRarityIdx = Math.min(colorKeys.indexOf(card.rarity || 'N') + 1, colorKeys.length - 1);
                    starColorClass = NEXT_RARITY_COLOR[colorKeys[nextRarityIdx]];
                    if (colorKeys[nextRarityIdx] === 'MR') isMRStar = true;
                } else if (isAlreadyAwakened && card.rarity === 'MR') {
                    isMRStar = true;
                } else if (isAlreadyAwakened) {
                    starColorClass = AWAKENED_EFFECTS[card.rarity || 'N']?.star || cardConfig.color;
                }

                // Render cục sao cụ thể (Tùy theo hiệu ứng Pass, Fail, Restore...)
                return (
                  <div key={i} style={{ transform: `translateY(${dist * dist * 2}px) scale(${starScale}) rotate(${(i - mid) * 8}deg)`, zIndex: 10 - dist, margin: '0 -4px' }}>
                    {(isPass || isRestored) && isNewlyAwakened ? (
                      <div className="relative w-[36px] h-[36px] flex items-center justify-center overflow-visible">
                          {isMRStar ? (
                            <>
                              <svg width="36" height="36" viewBox="0 0 24 24" className={cn("absolute text-current animate-[outlineDrop_1s_ease-out_both]", starColorClass)} style={{ animationDelay: isRestored ? '0.5s' : '1.2s' }}>
                                <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <svg width="36" height="36" viewBox="0 0 24 24" className={cn("absolute animate-[solidFlash_1s_ease-out_both]", starColorClass)} style={{ animationDelay: isRestored ? '0.5s' : '1.2s' }}>
                                <defs>
                                  <linearGradient id={`grad-flash-${card?.id || 'm'}-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fde047" /><stop offset="50%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" />
                                  </linearGradient>
                                </defs>
                                <path fill={`url(#grad-flash-${card?.id || 'm'}-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <Star size={36} className={cn("absolute text-current animate-[outlineDrop_1s_ease-out_both]", starColorClass)} style={{ animationDelay: isRestored ? '0.5s' : '1.2s' }} />
                              <Star size={36} className={cn("absolute fill-current text-current animate-[solidFlash_1s_ease-out_both]", starColorClass)} style={{ animationDelay: isRestored ? '0.5s' : '1.2s' }} />
                            </>
                          )}
                      </div>
                    ) : ((isPass || isRestored) && isAlreadyAwakened) || isAlreadyAwakened ? (
                      isMRStar ? (
                          <svg width="36" height="36" viewBox="0 0 24 24" className={cn("drop-shadow-md dark:drop-shadow-lg", starColorClass)}>
                            <defs>
                              <linearGradient id={`grad-active-${card?.id || 'm'}-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fde047" /><stop offset="50%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" />
                              </linearGradient>
                            </defs>
                            <path fill={`url(#grad-active-${card?.id || 'm'}-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                      ) : (
                          <Star size={36} className={cn("fill-current", starColorClass)} style={{ WebkitTextStroke: '0px' }} />
                      )
                    ) : (
                      <Star size={36} className={isAlreadyAwakened ? starColorClass : "fill-slate-300 dark:fill-[#1e293b] text-slate-400 dark:text-slate-500 drop-shadow-md"} style={{ strokeWidth: 1.5 }} />
                    )}
                  </div>
                );
            })}
          </div>

          {/* Hiệu ứng gương / bóng mượt mà */}
          {interactive && (
            <div className="absolute inset-0 z-[60] pointer-events-none rounded-[10px] overflow-hidden" style={{ opacity: cardTilt.opacity, transition: 'opacity 0.4s ease-out' }}>
                <div className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%]" style={{ background: `linear-gradient(135deg, transparent 30%, rgba(200,200,200,0.2) 45%, rgba(200,200,200,0.2) 50%, rgba(200,200,200,0.2) 55%, transparent 70%)`, transform: `translate(${(cardTilt.sweep - 50) * 1.2}%, ${(cardTilt.sweep - 50) * 1.2}%)`, transition: 'transform 0.1s ease-out' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}