// src/app/(main)/wiki/[id]/_components/StudyConfig.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Settings2, Globe, SignalHigh, CheckSquare, Sparkles, Crown, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyConfigProps {
  isPro: boolean;
  selectedLanguage: string; setSelectedLanguage: (val: string) => void;
  selectedLevel: string; setSelectedLevel: (val: string) => void;
  numQs: number; setNumQs: (val: number) => void;
  timeLimit: number; setTimeLimit: (val: number) => void;
  wordMin: number; setWordMin: (val: number) => void;
  wordMax: number; setWordMax: (val: number) => void;
  quizTypes: string[]; toggleQuizType: (typeId: string) => void;
  handleGenerateLesson: () => void;
}

// --- DỮ LIỆU CỐ ĐỊNH ---
const LANG_OPTIONS = [
  { value: "Tiếng Anh", label: "🇬🇧 Tiếng Anh" }, { value: "Tiếng Nhật", label: "🇯🇵 Tiếng Nhật" },
  { value: "Tiếng Hàn", label: "🇰🇷 Tiếng Hàn" }, { value: "Tiếng Trung", label: "🇨🇳 Tiếng Trung" },
  { value: "Tiếng Pháp", label: "🇫🇷 Tiếng Pháp" }, { value: "Tiếng Đức", label: "🇩🇪 Tiếng Đức" },
];

const LEVEL_OPTIONS = [
  { value: "A1", label: "A1 - Sơ cấp" }, { value: "A2", label: "A2 - Cơ bản" },
  { value: "B1", label: "B1 - Trung cấp" }, { value: "B2", label: "B2 - Trung cao" },
  { value: "C1", label: "C1 - Cao cấp" }, { value: "C2", label: "C2 - Thành thạo" },
];

const QUIZ_SKILLS = [
  { id: "multiple_choice", label: "Trắc nghiệm chi tiết" }, { id: "true_false", label: "Đúng / Sai (T/F/NG)" },
  { id: "main_idea", label: "Tìm ý chính" }, { id: "inference", label: "Suy luận logic" },
  { id: "guess_meaning", label: "Đoán nghĩa (Ngữ cảnh)" },
];

// --- COMPONENT: DROPDOWN TÙY CHỈNH ---
function CustomDropdown({ value, options, onChange }: { value: string; options: {value: string; label: string; desc?: string}[]; onChange: (val: string) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={cn("w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3.5 lg:p-4 rounded-xl border-2 text-slate-700 dark:text-slate-200 font-bold outline-none transition-all cursor-pointer shadow-sm group", isOpen ? "border-blue-500 ring-4 ring-blue-500/20 bg-white dark:bg-slate-800" : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50")}>
        <div className="flex flex-col items-start gap-0.5 text-left">
          <span className="text-sm md:text-base">{selectedOpt?.label}</span>
          {selectedOpt?.desc && <span className="text-[11px] md:text-xs text-slate-500 font-medium">{selectedOpt.desc}</span>}
        </div>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-transform duration-300 shrink-0", isOpen && "rotate-180 text-blue-500")} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 origin-top">
          <div className="max-h-[260px] overflow-y-auto no-scrollbar px-1.5">
            {options.map((opt) => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }} className={cn("w-full text-left px-3 py-2.5 my-0.5 rounded-lg font-bold transition-all flex items-center justify-between", value === opt.value ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50")}>
                <div className="flex flex-col">
                  <span className="text-sm">{opt.label}</span>
                  {opt.desc && <span className={cn("text-[11px] font-medium mt-0.5", value === opt.value ? "text-blue-500/70" : "text-slate-400")}>{opt.desc}</span>}
                </div>
                {value === opt.value && <Check className="w-4 h-4 shrink-0 text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENT: THANH TRƯỢT ĐƠN ---
function SingleSlider({ label, subLabel, min, max, value, onChange, isTime = false }: any) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex justify-between">
        <span>{label}</span>
        {subLabel && <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">{subLabel}</span>}
      </label>
      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer" />
        <div className={cn("shrink-0 flex items-center justify-center text-white font-black text-lg w-12 h-12 rounded-xl shadow-md", isTime ? "bg-purple-600" : "bg-blue-600")}>
          {isTime && value === 0 ? "∞" : value}
        </div>
      </div>
      {/* Đã bỏ điều kiện value === 0, text này giờ sẽ luôn hiện */}
      {isTime && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2 italic">* Chọn <span className="font-bold text-purple-500">∞ (0 phút)</span> để học thoải mái không giới hạn thời gian.</p>}
    </div>
  );
}

// --- MAIN COMPONENT ---
export function StudyConfig({
  isPro, selectedLanguage, setSelectedLanguage, selectedLevel, setSelectedLevel, numQs, setNumQs,
  timeLimit, setTimeLimit, wordMin, setWordMin, wordMax, setWordMax, quizTypes, toggleQuizType, handleGenerateLesson
}: StudyConfigProps) {
  
  const dynamicMaxQs = Math.min(15, Math.max(2, Math.floor(wordMax / 40)));
  const baseEnergyCost = 10;
  const energyCost = isPro ? Math.ceil(baseEnergyCost * 0.7) : baseEnergyCost;

  useEffect(() => {
    if (numQs > dynamicMaxQs) setNumQs(dynamicMaxQs);
  }, [wordMax, numQs, dynamicMaxQs, setNumQs]);

  return (
    <div className="bg-white/90 dark:bg-[#111827]/90 pb-[50px] backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-2xl p-5 md:p-8 shadow-xl animate-in fade-in zoom-in-95 mt-2 w-full lg:w-[95%] max-w-[1600px] mx-auto flex flex-col transition-all duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Settings2 className="text-blue-600 dark:text-blue-400 w-6 h-6 sm:w-8 sm:h-8" />
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">Thiết lập Bài học</h2>
        </div>
        {isPro && (
          <div className="hidden sm:flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Đã kích hoạt ưu đãi PRO (-30% Năng lượng)</span>
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 w-full">
        {/* CỘT TRÁI - THIẾT LẬP CƠ BẢN */}
        <div className="flex-1 flex flex-col space-y-6 xl:pr-10 xl:border-r-2 border-slate-200 dark:border-slate-700/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5"><Globe size={16} className="text-blue-500" /> Ngôn ngữ:</label>
              <CustomDropdown value={selectedLanguage} options={LANG_OPTIONS} onChange={(val) => { setSelectedLanguage(val); localStorage.setItem("wiki_lastLanguage", val); }} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5"><SignalHigh size={16} className="text-green-500" /> Trình độ:</label>
              <CustomDropdown value={selectedLevel} options={LEVEL_OPTIONS} onChange={(val) => { setSelectedLevel(val); localStorage.setItem("wiki_lastLevel", val); }} />
            </div>
          </div>

          <SingleSlider label="Số câu hỏi:" subLabel={`Bài ${wordMin} - ${wordMax} từ, Tối đa: ${dynamicMaxQs} câu`} min={2} max={dynamicMaxQs} value={numQs} onChange={setNumQs} />
          <SingleSlider label="Thời gian làm bài (Phút):" min={0} max={60} value={timeLimit} onChange={setTimeLimit} isTime />

          {/* THANH TRƯỢT KÉP - BÀI ĐỌC */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex justify-between items-end">
              <span>Độ dài bài đọc (Số từ):</span>
              <span className="text-teal-600 dark:text-teal-400 font-black text-base md:text-lg bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-lg border border-teal-200 dark:border-teal-800">{wordMin} - {wordMax}</span>
            </label>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
              <div className="relative w-full h-3">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="absolute top-0 bottom-0 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)] pointer-events-none" style={{ left: `${((wordMin - 100) / 600) * 100}%`, right: `${100 - ((wordMax - 100) / 600) * 100}%` }}></div>
                <input type="range" min="100" max="700" step="10" value={wordMin} onChange={(e) => setWordMin(Math.min(Number(e.target.value), wordMax - 50))} className="absolute w-full top-0 h-3 appearance-none bg-transparent dual-range" />
                <input type="range" min="100" max="700" step="10" value={wordMax} onChange={(e) => setWordMax(Math.max(Number(e.target.value), wordMin + 50))} className="absolute w-full top-0 h-3 appearance-none bg-transparent dual-range" />
              </div>
              <div className="flex justify-between items-center mt-4 text-xs font-bold text-slate-400"><span>100 từ</span><span>700 từ</span></div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI - KỸ NĂNG & NÚT BẮT ĐẦU */}
        <div className="flex-[0.8] flex flex-col w-full">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5">Luyện tập kỹ năng (Chọn nhiều):</label>
          <div className="grid grid-cols-1 gap-3 xl:gap-4">
            {QUIZ_SKILLS.map((type) => {
              const isSelected = quizTypes.includes(type.id);
              return (
                <button key={type.id} onClick={() => toggleQuizType(type.id)} className={cn("p-4 rounded-xl border-2 font-bold text-sm md:text-base transition-all flex items-center justify-start gap-4", isSelected ? "bg-blue-50 dark:bg-blue-900/30 border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors shrink-0", isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-400")}>{isSelected && <CheckSquare size={16} />}</div>
                  {type.label}
                </button>
              );
            })}
          </div>

          <div className="pt-8 xl:pt-11 mt-auto">
            <button disabled={quizTypes.length < 2} onClick={handleGenerateLesson} className={cn("w-full py-4 font-black rounded-xl text-base md:text-lg shadow-lg transition-all flex items-center justify-center gap-2", quizTypes.length < 2 ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-50" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-[1.02] active:scale-95 shadow-blue-500/20")}>
              <Sparkles size={20} />
              {quizTypes.length < 2 ? "Chọn ít nhất 2 kỹ năng" : (
                <span className="flex items-center gap-1.5">
                  Bắt đầu học (Tiêu hao 
                  {isPro ? (
                    <span className="inline-flex items-center gap-1.5 ml-1">
                      <span className="line-through text-white/70 text-sm">{baseEnergyCost}</span>
                      <span className="text-yellow-300 text-xl drop-shadow-md">{energyCost}</span>
                    </span>
                  ) : (<span className="ml-1">{energyCost}</span>)}
                  Năng lượng)
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}