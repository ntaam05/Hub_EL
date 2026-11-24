"use client";

import { useState, useEffect } from "react";

export default function AutoCrawlPage() {
  const [isAuto, setIsAuto] = useState(false);
  const [delay, setDelay] = useState(30); 
  const [logs, setLogs] = useState<string[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [rareCards, setRareCards] = useState<string[]>([]);
  const [jackpotAlert, setJackpotAlert] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const startCrawling = async () => {
      if (!isAuto) return;

      addLog("🚀 Đang bắt đầu một lượt quét mới...");
      try {
        const res = await fetch("/api/cron/wiki-crawl");
        const data = await res.json();
        
        if (data.status === "success") {
          addLog(`✅ ${data.summary}`);
          setTotalSaved(prev => prev + (data.savedCards?.length || 0));

          if (data.savedCards && data.savedCards.length > 0) {
            const foundRares = data.savedCards.filter((card: string) => !card.startsWith("[N]"));
            
            if (foundRares.length > 0) {
              setRareCards(prev => [...foundRares, ...prev]);
              setJackpotAlert(`🎉 NỔ HŨ! Vừa tìm thấy ${foundRares.length} thẻ hiếm!`);
              setTimeout(() => setJackpotAlert(null), 4000);
            }
          }
        } else {
          addLog(`❌ Lỗi: ${data.error || "Không xác định"}`);
        }
      } catch (err) {
        addLog("⚠️ Lỗi kết nối Server.");
      }

      timer = setTimeout(startCrawling, delay * 1000);
    };

    if (isAuto) {
      startCrawling();
    }

    return () => clearTimeout(timer);
  }, [isAuto, delay]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  // --- CẬP NHẬT MÀU SẮC 7 CẤP ĐỘ ---
  const getRarityColor = (cardString: string) => {
    if (cardString.includes("[MR]")) return "text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-purple-500 font-black animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]";
    if (cardString.includes("[LR]")) return "text-pink-500 font-black drop-shadow-[0_0_5px_rgba(236,72,153,0.8)] animate-pulse";
    if (cardString.includes("[UR]")) return "text-red-500 font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]";
    if (cardString.includes("[SSR]")) return "text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]";
    if (cardString.includes("[SR]")) return "text-purple-400 font-semibold";
    if (cardString.includes("[R]")) return "text-blue-400 font-medium";
    return "text-slate-300";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-4xl mx-auto font-sans">
        
        {jackpotAlert && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-600 to-red-600 text-white px-8 py-3 rounded-full font-black text-xl shadow-[0_0_20px_rgba(234,179,8,0.8)] animate-bounce border-2 border-yellow-300">
            {jackpotAlert}
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6 text-white tracking-wide">
          🎰 WikiGacha <span className="text-slate-500 font-normal">| Cỗ máy săn thẻ tự động</span>
        </h1>
        
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl mb-6 flex items-center gap-6 shadow-2xl backdrop-blur-md">
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-400">Độ trễ (giây):</label>
            <input 
              type="number" 
              value={delay} 
              onChange={(e) => setDelay(Number(e.target.value))}
              className="w-20 p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-center transition-all shadow-inner"
              min="2"
            />
          </div>
          
          <div className="flex-1">
            <button 
              onClick={() => setIsAuto(!isAuto)}
              className={`w-full py-3.5 rounded-xl font-black text-white tracking-wider transition-all shadow-lg active:scale-95 ${
                isAuto 
                  ? "bg-red-500/80 hover:bg-red-500 border border-red-500/50 shadow-red-500/20" 
                  : "bg-blue-600 hover:bg-blue-500 border border-blue-500/50 shadow-blue-500/20"
              }`}
            >
              {isAuto ? "⏹ DỪNG MÁY SĂN" : "✨ BẮT ĐẦU SĂN THẺ TỰ ĐỘNG"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl shadow-inner">
                <p className="text-xs font-bold text-orange-400/80 uppercase mb-1 tracking-widest">Trạng thái</p>
                <p className="text-xl font-black text-orange-500">{isAuto ? "ĐANG CHẠY ⚙️" : "ĐANG NGHỈ 💤"}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl shadow-inner">
                <p className="text-xs font-bold text-green-400/80 uppercase mb-1 tracking-widest">Tổng thẻ đã săn</p>
                <p className="text-2xl font-black text-green-400">{totalSaved}</p>
              </div>
            </div>

            <div className="bg-[#0a0f1c] border border-slate-800 text-green-400 p-5 rounded-2xl h-[400px] overflow-y-auto font-mono text-sm leading-relaxed shadow-2xl relative custom-scrollbar">
              <div className="sticky top-0 bg-[#0a0f1c] pb-2 mb-3 border-b border-slate-800/80">
                <p className="text-slate-500 font-bold tracking-wider">// NHẬT KÝ HỆ THỐNG</p>
              </div>
              {logs.length === 0 && <p className="text-slate-700 italic mt-4">Chưa có hoạt động nào...</p>}
              <div className="flex flex-col gap-1.5">
                {logs.map((log, i) => (
                  <p key={i} className={`${i === 0 && isAuto ? "text-green-300 font-bold drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "text-green-600/70"}`}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-yellow-600/30 p-5 rounded-2xl h-[515px] overflow-y-auto shadow-2xl relative custom-scrollbar">
            <div className="sticky top-0 bg-slate-900 pb-2 mb-3 border-b border-slate-800/80 flex justify-between items-center z-10">
              <p className="text-yellow-500 font-bold tracking-wider flex items-center gap-2">
                🏆 BỘ SƯU TẬP THẺ HIẾM
              </p>
              <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md">
                {rareCards.length} thẻ
              </span>
            </div>

            {rareCards.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                <span className="text-4xl mb-2">🕸️</span>
                <p>Chưa tìm thấy thẻ hiếm nào...</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {rareCards.map((card, i) => (
                <div key={i} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                  <span className={getRarityColor(card)}>{card}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}