"use client";

import { X, Info, Sparkles, ShieldCheck, Repeat } from "lucide-react";
import { cn } from "@/lib/utils"; // Import hàm cn từ file utils của bạn

export function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 bg-slate-900/40 dark:bg-black/90 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-200">
      
      {/* Container: Max chiều cao 90vh trên mobile để dễ cuộn, 85vh trên PC */}
      <div className="bg-slate-50 dark:bg-[#0d0d12] border border-slate-200 dark:border-white/10 w-full max-w-5xl max-h-[90vh] lg:max-h-[85vh] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="relative flex justify-between items-center p-5 lg:px-8 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-transparent dark:bg-gradient-to-r dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
              Chi tiết <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Cầu Nguyện</span>
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="group p-2 text-slate-400 dark:text-white/40 hover:text-red-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-all border border-transparent dark:border-white/5"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Nội dung: overflow-y-auto (cho Mobile cuộn) và lg:overflow-hidden (cho PC cố định) */}
        <div className="flex-1 p-5 lg:p-8 bg-slate-50 dark:bg-transparent dark:bg-[radial-gradient(circle_at_50%_0%,_rgba(56,189,248,0.03)_0%,_transparent_50%)] overflow-y-auto lg:overflow-hidden custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start lg:h-full">
            
            {/* Cột trái: Cơ chế & Quy tắc */}
            <div className="lg:col-span-5 space-y-6 lg:space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                  <h3 className="text-yellow-600 dark:text-yellow-500 font-black text-sm lg:text-xs uppercase tracking-[0.2em]">Cơ chế Bảo Hiểm</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  {[
                    { label: "Tiêu tốn", value: "100 Xu", color: "text-slate-800 dark:text-white" },
                    { label: "Bảo hiểm SR", value: "10 Lần", color: "text-purple-600 dark:text-purple-400" },
                    { label: "Bảo hiểm SSR", value: "50 Lần", color: "text-yellow-600 dark:text-yellow-400" },
                    { label: "Bảo hiểm UR", value: "120 Lần", color: "text-red-600 dark:text-red-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col p-3 lg:p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                      <span className="text-xs text-slate-500 dark:text-white/40 font-bold uppercase mb-1">{item.label}</span>
                      <span className={cn("text-xl lg:text-2xl font-black tracking-tight", item.color)}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-white/40 leading-relaxed italic border-l-2 border-slate-200 dark:border-white/10 pl-3">
                  * Reset bộ đếm Pity ngay khi nhận được vật phẩm cùng cấp hoặc cao hơn.
                </p>
              </section>

              <section className="p-4 lg:p-5 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-500/5 dark:to-purple-500/5 border border-blue-100 dark:border-white/5 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                  <Repeat className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-green-600 dark:text-green-400 font-black text-sm lg:text-xs uppercase tracking-widest">Quy tắc trùng lặp</h3>
                </div>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-white/60 leading-relaxed">
                  Triệu hồi trùng thẻ sẽ tự động phân rã thành <strong className="text-slate-800 dark:text-white">Bụi Sao</strong> tỉ lệ thuận theo độ hiếm.
                </p>
              </section>
            </div>

            {/* Cột phải: Bảng tỉ lệ */}
            <div className="lg:col-span-7 lg:h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-blue-600 dark:text-blue-400 font-black text-sm lg:text-xs uppercase tracking-[0.2em]">Xác suất triệu hồi</h3>
              </div>
              
              <div className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none">
                <table className="w-full text-left lg:h-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 text-xs uppercase tracking-widest text-slate-500 dark:text-white/40">
                      <th className="px-4 py-3 font-bold">Độ hiếm</th>
                      <th className="px-4 py-3 font-bold text-center">Tỉ lệ</th>
                      <th className="px-4 py-3 font-bold text-right">Phân loại</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold">
                    {[
                      { rank: "MR", rate: "0.05%", desc: "Cực kỳ dài", color: "bg-gradient-to-r from-red-500 via-yellow-400 to-purple-500 text-transparent bg-clip-text" },
                      { rank: "LR", rate: "0.15%", desc: "Siêu dài", color: "text-pink-600 dark:text-pink-500" },
                      { rank: "UR", rate: "0.80%", desc: "Rất dài", color: "text-red-600 dark:text-red-500" },
                      { rank: "SSR", rate: "4.00%", desc: "Dài", color: "text-yellow-600 dark:text-yellow-500" },
                      { rank: "SR", rate: "15.0%", desc: "Khá dài", color: "text-purple-600 dark:text-purple-400" },
                      { rank: "R", rate: "30.0%", desc: "Trung bình", color: "text-blue-600 dark:text-blue-400" },
                      { rank: "N", rate: "50.0%", desc: "Cơ bản", color: "text-slate-500 dark:text-white/60" },
                    ].map((row, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 lg:py-0">
                          <span className={cn("text-lg lg:text-xl font-black italic tracking-tighter", row.color)}>{row.rank}</span>
                        </td>
                        <td className="px-4 py-3 lg:py-0 text-center">
                          <span className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full text-slate-700 dark:text-white/90 font-mono text-xs lg:text-sm">{row.rate}</span>
                        </td>
                        <td className="px-4 py-3 lg:py-0 text-right text-slate-500 dark:text-white/40 font-medium italic text-xs lg:text-sm">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 lg:px-8 border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/40 flex justify-between items-center shrink-0">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 dark:text-white/30 uppercase font-black tracking-widest mb-0.5">Phí gacha</span>
              <span className="text-base text-slate-800 dark:text-white font-black">100 <span className="text-yellow-600 dark:text-yellow-500">Xu/Lượt</span></span>
            </div>
            <div className="flex flex-col border-l border-slate-300 dark:border-white/10 pl-6">
              <span className="text-[10px] text-slate-500 dark:text-white/30 uppercase font-black tracking-widest mb-0.5">Quy đổi trùng</span>
              <span className="text-base font-black text-green-600 dark:text-green-500">Bụi Sao 1:1</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="px-8 py-3 bg-slate-800 text-white dark:bg-white dark:text-black hover:bg-blue-600 dark:hover:bg-blue-400 hover:text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg"
          >
            Đã rõ
          </button>
        </div>

      </div>

      {/* Thêm CSS cho Scrollbar trên điện thoại (đã chỉnh để thân thiện 2 mode) */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(150, 150, 150, 0.5); }
      `}</style>
    </div>
  );
}