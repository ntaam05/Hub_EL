// src/app/(main)/gacha/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { rollGacha } from "@/actions/gacha";
import { Gift, Info, History, Repeat } from 'lucide-react';
import { cn } from "@/lib/utils";
import { InfoModal } from "@/components/features/gacha/info-modal";
import { ExchangeModal } from "@/components/features/gacha/exchange-modal";
import { InventoryModal } from "@/components/features/gacha/inventory-tab"; 
import { WikiCard3D } from "@/components/ui/wiki-card-3d"; 
import { updateTaskProgressAction } from "@/actions/quests/progress";

const COST_PER_ROLL = 100; // Tiêu hao 100 Xu mỗi lần

// Component: Khung ánh sáng vẽ bao quanh thẻ (Kích thước gốc 280x420 khớp 100% với thẻ thật)
const CardFrameSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 280 420" className="absolute inset-0 w-full h-full overflow-visible z-10">
     <defs>
        <filter id="frame-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
     </defs>
     <g filter="url(#frame-glow)" strokeLinecap="round" fill="none">
        {/* Lớp viền màu theo Theme */}
        <g stroke={color} strokeWidth="6">
           <path d="M 4.69 4.69 A 16 16 0 0 1 16 0 L 140 0" className="energy-line-h" />
           <path d="M 4.69 4.69 A 16 16 0 0 0 0 16 L 0 210" className="energy-line-v" />
           <path d="M 275.31 4.69 A 16 16 0 0 0 264 0 L 140 0" className="energy-line-h" />
           <path d="M 275.31 4.69 A 16 16 0 0 1 280 16 L 280 210" className="energy-line-v" />
           <path d="M 4.69 415.31 A 16 16 0 0 0 16 420 L 140 420" className="energy-line-h" />
           <path d="M 4.69 415.31 A 16 16 0 0 1 0 404 L 0 210" className="energy-line-v" />
           <path d="M 275.31 415.31 A 16 16 0 0 1 264 420 L 140 420" className="energy-line-h" />
           <path d="M 275.31 415.31 A 16 16 0 0 0 280 404 L 280 210" className="energy-line-v" />
        </g>
        {/* Lớp lõi màu trắng */}
        <g stroke="white" strokeWidth="2">
           <path d="M 4.69 4.69 A 16 16 0 0 1 16 0 L 140 0" className="energy-line-h" />
           <path d="M 4.69 4.69 A 16 16 0 0 0 0 16 L 0 210" className="energy-line-v" />
           <path d="M 275.31 4.69 A 16 16 0 0 0 264 0 L 140 0" className="energy-line-h" />
           <path d="M 275.31 4.69 A 16 16 0 0 1 280 16 L 280 210" className="energy-line-v" />
           <path d="M 4.69 415.31 A 16 16 0 0 0 16 420 L 140 420" className="energy-line-h" />
           <path d="M 4.69 415.31 A 16 16 0 0 1 0 404 L 0 210" className="energy-line-v" />
           <path d="M 275.31 415.31 A 16 16 0 0 1 264 420 L 140 420" className="energy-line-h" />
           <path d="M 275.31 415.31 A 16 16 0 0 0 280 404 L 280 210" className="energy-line-v" />
        </g>
     </g>
  </svg>
);

export default function GachaPage() {
  const { data: session, status, update } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  
  const [rollState, setRollState] = useState<'idle' | 'drawing' | 'spinning' | 'revealed'>('idle');
  const [gachaResults, setGachaResults] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const [rollCount, setRollCount] = useState(1);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showInfo, setShowInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showExchange, setShowExchange] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [bgData, setBgData] = useState({ stars: [] as any[], clouds: [] as any[] });
  const [treeData, setTreeData] = useState({ branchPathStrings: "", leaves: [] as any[], particles: [] as any[] });
  const [scaleValue, setScaleValue] = useState(1);

  // Clear timer tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => { if (pressTimerRef.current) clearInterval(pressTimerRef.current); };
  }, []);

  // Tính scale tự động cho số lượng thẻ
  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < 768) {
        setScaleValue(rollCount > 1 ? 0.65 : 1.1);
      } else {
        setScaleValue(rollCount > 3 ? 0.85 : rollCount > 1 ? 1 : 1.2);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [rollCount]);

  useEffect(() => {
    const checkTheme = () => document.documentElement.classList.contains('dark');
    setIsDarkMode(checkTheme());
    const observer = new MutationObserver(() => setIsDarkMode(checkTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const activeThemeColor = useMemo(() => isDarkMode ? '#cffafe' : '#f472b6', [isDarkMode]);

  useEffect(() => {
    setBgData({
      stars: Array.from({ length: 80 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 40, size: Math.random() * 1.5 + 0.5, delay: Math.random() * 5 })),
      clouds: Array.from({ length: 8 }).map((_, i) => ({ id: i, x: -30, y: 5 + Math.random() * 35, width: 140 + Math.random() * 80, height: 40 + Math.random() * 20, duration: 35 + Math.random() * 20, delay: -(Math.random() * 60), opacity: 0.65 }))
    });

    let branchPathStrings = ""; 
    const leafNodes: { x: number, y: number }[] = [];
    const particles: any[] = [];
    for (let i = 0; i < 60; i++) particles.push({ cx: 400 + (Math.random() - 0.5) * 800, startY: Math.random() * 300, endY: 400 + Math.random() * 400, r: Math.random() * 2 + 0.8, delay: Math.random() * 10, duration: 8 + Math.random() * 10 });

    const buildFractal = (x: number, y: number, length: number, angle: number, depth: number) => {
      const endX = x + length * Math.cos(angle); const endY = y + length * Math.sin(angle);
      branchPathStrings += `M ${x} ${y} L ${endX} ${endY} `;
      if (depth === 0) { leafNodes.push({ x: endX, y: endY }); return; }
      const scale = 0.75 + Math.random() * 0.1; const spread = 0.45;
      buildFractal(endX, endY, length * scale, angle - spread, depth - 1);
      buildFractal(endX, endY, length * scale, angle + spread, depth - 1);
    };
    buildFractal(400, 15, 95, Math.PI / 2, 10); 
    
    const leaves: any[] = [];
    for (let i = 0; i < 200; i++) {
      const node = leafNodes[Math.floor(Math.random() * leafNodes.length)];
      const cornerIdx = Math.floor(Math.random() * 4); 
      let tx, ty;
      switch(cornerIdx) { case 0: tx = 264.69; ty = 144.69; break; case 1: tx = 535.31; ty = 144.69; break; case 2: tx = 264.69; ty = 555.31; break; default: tx = 535.31; ty = 555.31; break; }
      leaves.push({ id: `leaf-${i}`, x: node.x, y: node.y, targetX: tx, targetY: ty, r: 1.2 + Math.random() * 1.8, delay: -(Math.random() * 15), actionDelay: Math.random() * 1.0, dur: 8 + Math.random() * 8 });
    }
    setTreeData({ branchPathStrings, leaves, particles });
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (rollState !== 'idle' || status !== "authenticated" || !user?.id) return;
    
    setRollCount(1);
    
    if (pressTimerRef.current) clearInterval(pressTimerRef.current);
    
    pressTimerRef.current = setInterval(() => {
      setRollCount(prev => {
        if (prev < 5) return prev + 1; 
        return prev;
      });
    }, 250); 
  };

  const handlePointerUpOrLeave = () => {
    if (pressTimerRef.current) {
      clearInterval(pressTimerRef.current);
      pressTimerRef.current = null;
      
      if (rollState === 'idle') {
        executeRoll(rollCount);
      }
    }
  };

  const executeRoll = async (count: number) => {
    if (rollState !== 'idle' || status !== "authenticated" || !user?.id) return;
    setRollState('drawing'); 
    setGachaResults([]); 
    setMessage(""); 
    
    try {
      const results: any[] = []; 
      let newCards = 0;
      let dupes = 0;
      let errorMsg = "";

      for (let i = 0; i < count; i++) {
        const res = (await rollGacha(user.id)) as any;
        if (res.success) {
          const dbCard = res.card;
          const isNewCard = !res.message.includes("Trùng");

          const cardData = { 
              ...dbCard, 
              contentText: dbCard.contentText || "Dữ liệu đang được cập nhật...",
              wikiUrl: dbCard.url || dbCard.wikiUrl || `https://vi.wikipedia.org/wiki/${encodeURIComponent(dbCard.title)}`,
              isNewCard: isNewCard
          };
          results.push(cardData);
          if (isNewCard) newCards++;
          else dupes++;
        } else {
          errorMsg = res.message; 
          break;
        }
      }

      if (results.length > 0) {
        await update();
        router.refresh();
        updateTaskProgressAction(user.id, "GACHA_PULL", results.length);
        updateTaskProgressAction(user.id, "SPEND_COIN", results.length * 100);
        if (results.length === 1) {
            setMessage(newCards > 0 ? "Nhận được thẻ mới!" : "Thẻ trùng lặp (+ Bụi sao)");
        } else {
            setMessage(`Đã rút ${results.length} thẻ: ${newCards} Mới, ${dupes} Trùng`);
        }
        
        setTimeout(() => { 
          setRollState('spinning'); 
          setTimeout(() => { 
            setRollState('revealed'); 
            setGachaResults(results); 
          }, 800); 
        }, 3000); 
      } else { 
        alert(errorMsg || "Lỗi khi rút thẻ."); 
        setRollState('idle'); 
        setRollCount(1);
      }
    } catch (err) { 
      setRollState('idle'); 
      setRollCount(1);
    }
  };

  const handleCloseCard = () => { 
    setRollState('idle'); 
    setGachaResults([]); 
    setRollCount(1); 
  };

  const handleInstantLearn = (cardId: string | number) => {
    router.push(`/wiki/${cardId}`);
  };

  return (
    <div className={cn("relative flex flex-col w-full h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] pb-16 md:pb-0 overflow-hidden font-sans transition-colors duration-700 ease-in-out select-none", isDarkMode ? 'bg-[#0b1120] text-slate-100' : 'bg-sky-100 text-slate-800')}>
      <style>{`
        @keyframes driftClouds { from { transform: translateX(-100%); } to { transform: translateX(120vw); } }
        @keyframes twinkleStar { 0%, 100% { opacity: 0.2; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes lineGrowH { 0% { stroke-dashoffset: 140; opacity: 0; } 10% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes lineGrowV { 0% { stroke-dashoffset: 210; opacity: 0; } 10% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes whiteCardSpin { 0% { transform: scale(1) rotateY(0deg); opacity: 0; box-shadow: 0 0 20px rgba(255,255,255,0); } 10% { opacity: 1; box-shadow: 0 0 40px ${activeThemeColor}; } 100% { transform: scale(1) rotateY(360deg); opacity: 1; box-shadow: 0 0 100px #3b82f6; } }
        @keyframes gatherToCorner { 0% { transform: translate(0, 0) scale(1); opacity: 0.8; } 100% { transform: translate(var(--tx), var(--ty)) scale(0.6); opacity: 0; } }
        @keyframes dropAndFade { 0% { transform: translateY(0px) scale(0); opacity: 0; } 5% { transform: translateY(0px) scale(1); opacity: 0.8; } 85% { transform: translateY(0px) scale(1); opacity: 0.8; } 100% { transform: translateY(100px) scale(0.5); opacity: 0; } }
        
        .energy-line-h { stroke-dasharray: 140; stroke-dashoffset: 140; animation: lineGrowH 1.5s ease-out forwards; animation-delay: 1.2s; }
        .energy-line-v { stroke-dasharray: 210; stroke-dashoffset: 210; animation: lineGrowV 1.5s ease-out forwards; animation-delay: 1.2s; }
        .cloud-shape { position: absolute; background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 225, 240, 0.85) 100%); filter: blur(10px); border-radius: 80px; pointer-events: none; box-shadow: inset 0 -10px 15px rgba(150, 140, 150, 0.25), 0 10px 30px rgba(255, 255, 255, 0.4); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* BACKGROUND CẢNH VẬT */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {isDarkMode ? bgData.stars.map(star => (
          <div key={star.id} className="absolute bg-white rounded-full" style={{ left:`${star.x}%`, top:`${star.y}%`, width:star.size, height:star.size, animation:`twinkleStar 4s ease-in-out infinite ${star.delay}s`, boxShadow: '0 0 4px white' }} />
        )) : bgData.clouds.map(cloud => (
          <div key={cloud.id} className="cloud-shape" style={{ top: `${cloud.y}%`, left: `${cloud.x}%`, width: `${cloud.width}px`, height: `${cloud.height}px`, opacity: cloud.opacity, animation: `driftClouds ${cloud.duration}s linear infinite`, animationDelay: `${cloud.delay}s` }} />
        ))}
      </div>

      <div className={`absolute -top-10 md:top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] md:h-full sm:h-[700px] z-[5] pointer-events-none transition-all duration-[2000ms] ${rollState !== 'idle' ? 'scale-105 brightness-110' : 'scale-100'}`}>
        <svg viewBox="0 0 800 700" preserveAspectRatio="xMidYMin slice" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isDarkMode ? "#2dd4bf" : "#10b981"} />
              <stop offset="100%" stopColor={isDarkMode ? "#3b82f6" : "#0284c7"} />
            </linearGradient>
            <linearGradient id="islandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isDarkMode ? '#1e293b' : '#d1d5db'} />
              <stop offset="100%" stopColor={isDarkMode ? '#0f172a' : '#9ca3af'} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ĐÃ XÓA logic vẽ khung bị sai toạ độ ở đây để không bị lệch nữa */}

          {treeData.particles.map((pt, i) => (
            <circle key={`pt-${i}`} cx={pt.cx} cy={pt.cy} r={pt.r} fill={isDarkMode ? "#67e8f9" : "#f472b6"} filter="url(#glow)">
              <animate attributeName="cy" values={`${pt.startY};${pt.endY}`} dur={`${pt.duration}s`} repeatCount="indefinite" begin={`-${pt.delay}s`} />
              <animate attributeName="opacity" values="0;0.6;0" dur={`${pt.duration}s`} repeatCount="indefinite" begin={`-${pt.delay}s`} />
            </circle>
          ))}

          <path d={treeData.branchPathStrings} stroke="url(#treeGrad)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={rollState !== 'idle' ? 0.3 : 0.8} filter="url(#glow)" style={{ transition: 'opacity 1s' }} />

          {treeData.leaves.map((n) => (
            <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill={activeThemeColor} filter="url(#glow)"
                    style={{ '--tx': `${n.targetX - n.x}px`, '--ty': `${n.targetY - n.y}px`, animation: rollState === 'drawing' ? `gatherToCorner 2s cubic-bezier(0.42, 0, 0.58, 1) ${n.actionDelay}s forwards` : (rollState === 'idle' ? `dropAndFade ${n.dur}s infinite ${n.delay}s ease-in` : 'none'), opacity: rollState === 'idle' ? 0.8 : (rollState === 'drawing' ? 0 : 0), transformOrigin: `${n.x}px ${n.y}px` } as React.CSSProperties} />
          ))}

          <g filter="url(#glow)">
            <path d="M 180,0 C 250,25 350,55 400,60 C 450,55 550,25 620,0 C 500,10 300,10 180,0 Z" fill="url(#islandGrad)" stroke={isDarkMode ? "#0ea5e9" : "#9ca3af"} strokeWidth="1" strokeOpacity="0.5" />
            <path d="M 150,0 C 250,15 550,15 650,0 C 550,-8 250,-8 150,0 Z" fill={isDarkMode ? '#0f172a' : '#bbf7d0'} stroke={isDarkMode ? "#38bdf8" : "#22c55e"} strokeWidth="2" />
          </g>
        </svg>
      </div>

      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-auto">
        <button onClick={() => setShowInventory(true)} className={`flex items-start gap-3 px-4 py-2.5 backdrop-blur-md border rounded-xl font-semibold transition-all hover:scale-105 shadow-lg ${isDarkMode ? 'bg-slate-800/80 text-slate-200 border-slate-600' : 'bg-white/80 text-gray-800 border-gray-300'}`}>
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-base font-bold">Kho Thẻ</span>
            <div className="flex items-center gap-1.5 opacity-80">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png" alt="Wikipedia" className="w-3.5 h-3.5 object-contain" />
              <span className="text-[9px] uppercase font-black tracking-widest leading-none">Wikipedia</span>
            </div>
          </div>
        </button>
      </div>

      {/* VÙNG CHỨA CÁC THẺ GACHA (GIAI ĐOẠN 1, 2, 3 NẰM CHUNG 1 TỌA ĐỘ) */}
      {rollState !== 'idle' && (
  <div className={cn("absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-[100] p-4 transition-all duration-700", rollState === 'drawing' ? "bg-transparent backdrop-blur-none" : "bg-black/60 backdrop-blur-[6px]")} onClick={rollState === 'revealed' ? handleCloseCard : undefined}>
          
          {rollState === 'revealed' && message && (
            <div className={`absolute top-[10%] md:top-[8%] px-6 py-2.5 rounded-full z-50 shadow-2xl ${message.includes("Trùng") ? 'bg-orange-900/90 border border-orange-500' : 'bg-green-900/90 border border-green-500'}`}>
              <p className={`text-sm font-black uppercase tracking-widest text-center ${message.includes("Trùng") ? "text-orange-400" : "text-green-400"}`}>{message}</p>
            </div>
          )}

          <div className="flex flex-row flex-wrap justify-center items-center gap-4 md:gap-8 w-full max-w-[1400px]">
            {Array.from({ length: rollCount }).map((_, idx) => {
               const card = gachaResults[idx];
               
               return (
                 <div key={idx} className="relative flex items-center justify-center shrink-0" style={{ width: 280 * scaleValue, height: 420 * scaleValue }}>
                    
                    {/* KHUNG GỐC LUÔN CỐ ĐỊNH 280x420 VÀ ĐƯỢC ZOOM THEO SCALE */}
                    <div className="absolute w-[280px] h-[420px]" style={{ transform: `scale(${scaleValue})`, transformOrigin: 'center' }}>
                        
                        {/* Giai đoạn 1: Khung ánh sáng vẽ bao quanh (Sử dụng Component CardFrameSVG) */}
                        {rollState === 'drawing' && (
                           <CardFrameSVG color={activeThemeColor} />
                        )}

                        {/* Giai đoạn 2: Thẻ trắng xoay */}
                        {rollState === 'spinning' && (
                           <div className="absolute inset-0 bg-white rounded-[14px] animate-[whiteCardSpin_0.8s_ease-in_forwards]" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }} />
                        )}

                        {/* Giai đoạn 3: Thẻ thật lật ra */}
                        {rollState === 'revealed' && card && (
                           <>
                              <WikiCard3D card={card} currentAwakenedStars={card.awakenedStars || 0} scale={1} className="m-0 pointer-events-auto" interactive={true} />
                              
                              {/* HUY HIỆU THẺ MỚI */}
                              {card.isNewCard && (
                                 <div className="absolute -top-3 -right-3 z-[110] bg-red-500 text-white text-[11px] sm:text-sm font-black px-3 sm:px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-white dark:border-slate-800 rotate-12 animate-bounce pointer-events-none">
                                    NEW!
                                 </div>
                              )}
                           </>
                        )}
                    </div>
                 </div>
               )
            })}
          </div>

          {rollState === 'revealed' && (
            <p className="absolute bottom-[10%] text-white/50 text-xs font-bold uppercase tracking-widest animate-pulse">Chạm vào màn hình để đóng</p>
          )}
        </div>
      )}

      <div className="absolute bottom-20 md:bottom-6 left-4 md:left-6 z-20 flex gap-4 pointer-events-auto">
        <button onClick={() => setShowExchange(true)} className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 backdrop-blur-md border rounded-xl font-medium transition-all hover:scale-105 shadow-lg ${isDarkMode ? 'bg-slate-800/80 text-green-400 border-green-800' : 'bg-white/80 text-green-700 border-green-300'}`}>
          <Repeat size={20} /><span className="hidden sm:inline">Đổi bụi sao</span>
        </button>
        <button onClick={() => setShowInfo(true)} className={`flex items-center gap-2 px-5 py-3 backdrop-blur-md border rounded-xl font-medium transition-all hover:scale-105 shadow-lg ${isDarkMode ? 'bg-slate-800/80 text-slate-300 border-slate-600' : 'bg-white/80 text-gray-700 border-gray-300'}`}>
          <Info size={20} /><span className="hidden sm:inline">Chi tiết</span>
        </button>
      </div>

      <div className="absolute bottom-20 md:bottom-6 right-4 md:right-6 z-20 pointer-events-auto flex flex-col items-center gap-1.5">
        
        <button 
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          onContextMenu={(e) => e.preventDefault()} 
          disabled={rollState !== 'idle' || status === "loading"} 
          className={cn(
            "group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-3 font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg hover:scale-[1.02] active:scale-95 touch-none select-none",
            isDarkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                       : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_20px_rgba(244,114,182,0.4)]'
          )}
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
          
          <Gift size={28} className={rollState !== 'idle' ? "animate-spin opacity-50" : "animate-bounce drop-shadow-md"} />
          
          <div className="flex flex-col items-start text-left ml-1">
             <span className="text-lg sm:text-xl uppercase tracking-wider leading-tight drop-shadow-sm">
               {rollState !== 'idle' ? 'Đang tìm...' : `Tìm Tri Thức x${rollCount}`}
             </span>
             {rollState === 'idle' && (
                <span className="text-[11px] sm:text-xs text-white/90 font-medium">
                  Tiêu hao: <span className="font-black text-yellow-300 drop-shadow-sm">{rollCount * COST_PER_ROLL} Xu</span>
                </span>
             )}
          </div>
        </button>

      </div>

      <div className="absolute bottom-16 md:bottom-0 left-0 w-full shrink-0 pointer-events-none z-0 overflow-hidden">
        <svg viewBox="0 0 1440 320" className="w-full h-auto block overflow-visible transition-colors duration-1000 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fde047" stopOpacity="0.9" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" /></linearGradient>
            <linearGradient id="moonGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" /><stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" /></linearGradient>
            <linearGradient id="mountBack" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={isDarkMode ? "#1e293b" : "#bae6fd"} stopOpacity="0.8"/><stop offset="100%" stopColor={isDarkMode ? "#0f172a" : "#f0f9ff"} stopOpacity="0.1"/></linearGradient>
            <linearGradient id="mountMid" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={isDarkMode ? "#334155" : "#7dd3fc"} stopOpacity="0.8"/><stop offset="100%" stopColor={isDarkMode ? "#0f172a" : "#e0f2fe"} stopOpacity="0.3"/></linearGradient>
            <linearGradient id="mountFront" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={isDarkMode ? "#475569" : "#38bdf8"} stopOpacity="0.9"/><stop offset="100%" stopColor={isDarkMode ? "#0f172a" : "#bae6fd"} stopOpacity="0.6"/></linearGradient>
          </defs>
          <circle cx="1300" cy="70" r="45" fill={isDarkMode ? "url(#moonGrad)" : "url(#sunGrad)"} />
          <g><animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="50s" repeatCount="indefinite" /><path fill="url(#mountBack)" d="M0,210 L80,90 L200,180 L350,70 L500,200 L680,100 L850,240 L1000,110 L1200,250 L1350,140 L1440,210 L1440,320 L0,320 Z" /><path fill="url(#mountBack)" d="M0,210 L80,90 L200,180 L350,70 L500,200 L680,100 L850,240 L1000,110 L1200,250 L1350,140 L1440,210 L1440,320 L0,320 Z" transform="translate(1440, 0)" /></g>
          <g><animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="30s" repeatCount="indefinite" /><path fill="url(#mountMid)" d="M0,260 L100,170 L250,280 L400,160 L550,270 L750,150 L900,280 L1100,180 L1250,290 L1350,200 L1440,260 L1440,320 L0,320 Z" /><path fill="url(#mountMid)" d="M0,260 L100,170 L250,280 L400,160 L550,270 L750,150 L900,280 L1100,180 L1250,290 L1350,200 L1440,260 L1440,320 L0,320 Z" transform="translate(1440, 0)" /></g>
          <g><animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="15s" repeatCount="indefinite" /><path fill="url(#mountFront)" d="M0,300 L120,230 L280,310 L450,210 L600,310 L780,220 L950,310 L1150,240 L1300,320 L1380,260 L1440,300 L1440,320 L0,320 Z" /><path fill="url(#mountFront)" d="M0,300 L120,230 L280,310 L450,210 L600,310 L780,220 L950,310 L1150,240 L1300,320 L1380,260 L1440,300 L1440,320 L0,320 Z" transform="translate(1440, 0)" /></g>
        </svg>
      </div>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {showExchange && <ExchangeModal userId={user?.id} onClose={() => setShowExchange(false)} />}
      {showInventory && <InventoryModal userId={user?.id} onClose={() => setShowInventory(false)} />}
    </div>
  );
}