// src/app/(main)/vocabulary/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getUserVocabulary } from "@/actions/vocabulary";
import { getWikiManagementData } from "@/actions/wiki-manager";
import { WikiCard3D } from "@/components/ui/wiki-card-3d";
import { Library, Search, ArrowLeft, Volume2, BookOpen, Layers, X, Globe, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPORTED_LANGUAGES = ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hàn", "Tiếng Trung", "Tiếng Pháp", "Tiếng Đức"];

const getSpeechLangCode = (lang: string) => ({"Tiếng Anh":"en-US", "Tiếng Nhật":"ja-JP", "Tiếng Hàn":"ko-KR", "Tiếng Trung":"zh-CN", "Tiếng Pháp":"fr-FR", "Tiếng Đức":"de-DE"}[lang] || "en-US");

const safeText = (text: string) => text ? text.replace(/\?/g, (m, o, s) => (o > 0 && o < s.length - 1 && s[o-1].match(/[a-z]/i) && s[o+1].match(/[a-z]/i)) ? " " : m) : "";

// Hàm helper bóc tách chi tiết từ vựng để code render ngắn gọn hơn
const parseVocabDesc = (desc?: string) => {
  if (!desc || !desc.includes('\n')) return { phonetic: "", pron: "", exp: safeText(desc || "") };
  const parts = desc.split('\n'), line1 = safeText(parts[0].trim()), exp = safeText(parts.slice(1).join(' ').trim());
  const bracketMatch = line1.match(/\[.*?\]/);
  if (bracketMatch) return { phonetic: bracketMatch[0], pron: line1.replace(bracketMatch[0], '').replace(/^-/, '').trim(), exp };
  const splitDash = line1.split('-');
  return { phonetic: splitDash[0]?.trim() || "", pron: splitDash[1]?.trim() || "", exp };
};

// --- COMPONENT: MODAL NGỮ CẢNH ---
function ReadingContextModal({ userId, cardId, targetWord, onClose }: { userId: string, cardId: number, targetWord: string, onClose: () => void }) {
  const router = useRouter();
  const [cardData, setCardData] = useState<any>(null);
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContext() {
      if (!userId) return;
      setIsLoading(true);
      const res = await getWikiManagementData(userId) as any;
      if (res.success) {
        const invItem = res.data.find((item: any) => item.card.id === cardId);
        if (invItem?.card) {
          setCardData(invItem.card);
          
          let foundText = "";
          const searchTarget = targetWord.trim().toLowerCase();

          // Logic: 1. Ưu tiên tìm từ vựng trong bài học mới nhất (aiContent hiện tại)
          try {
            const ai = JSON.parse(invItem.card.aiContent);
            if (ai.simplifiedText && ai.simplifiedText.toLowerCase().includes(searchTarget)) {
              foundText = ai.simplifiedText;
            }
          } catch (e) {}

          // Logic: 2. Nếu bài mới nhất không có (do đã bị ghi đè), lục lại toàn bộ lịch sử (attempts)
          if (!foundText && invItem.card.attempts && invItem.card.attempts.length > 0) {
            // Duyệt ngược từ bài làm gần nhất trở về trước
            for (let i = invItem.card.attempts.length - 1; i >= 0; i--) {
              try {
                const snap = JSON.parse(invItem.card.attempts[i].lessonSnapshot);
                if (snap.simplifiedText && snap.simplifiedText.toLowerCase().includes(searchTarget)) {
                  foundText = snap.simplifiedText;
                  break;
                }
              } catch (e) {}
            }
          }

          // Logic: 3. Nếu vẫn xui xẻo không tìm thấy ở đâu (có thể do lỗi data), đành fallback về bài mới nhất
          if (!foundText) {
            try {
              const ai = JSON.parse(invItem.card.aiContent);
              foundText = ai.simplifiedText || "";
            } catch (e) {}
          }

          setSimplifiedText(foundText);
        }
      }
      setIsLoading(false);
    }
    fetchContext();
  }, [userId, cardId, targetWord]);

  // Logic: Tách chuỗi và tô sáng từ vựng mục tiêu (không phân biệt hoa thường) để định vị ngữ cảnh.
  const renderHighlightedText = () => {
     if (!simplifiedText) return <p className="text-slate-500 italic">Không tìm thấy nội dung bài đọc.</p>;
     const safeWord = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     const parts = simplifiedText.split(new RegExp(`(${safeWord})`, 'gi'));
     
     // Cảnh báo phụ: Nếu từ vựng thực sự không tồn tại trong bài đọc đang hiển thị, báo dòng nhỏ cho user biết.
     const isWordFound = parts.length > 1;

     return (
       <>
         {!isWordFound && (
           <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm font-medium">
             ⚠️ Từ vựng này thuộc về một bài học cũ đã bị ghi đè hoặc không còn lưu trữ lịch sử chính xác.
           </div>
         )}
         <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify text-sm md:text-base whitespace-pre-wrap">
           {parts.map((part, i) => 
              part.toLowerCase() === targetWord.toLowerCase() 
              ? <mark key={i} className="bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-black px-1.5 py-0.5 rounded shadow-sm">{part}</mark> 
              : part
           )}
         </p>
       </>
     )
  };

  return (
    <div className="absolute inset-0 z-[100] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in">
       <div className="bg-white dark:bg-[#0f172a] w-full max-w-5xl max-h-[90vh] md:h-[600px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-800">
         
         <div className="w-full md:w-2/5 lg:w-1/3 bg-slate-50 dark:bg-[#0b1120] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 relative">
            <button onClick={onClose} className="absolute top-4 left-4 md:hidden p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-full transition-colors">
              <X size={16} />
            </button>
            {isLoading ? (
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-40 h-60 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ) : cardData ? (
              <div className="flex flex-col items-center transform scale-90 sm:scale-100">
                <WikiCard3D 
                  card={cardData} 
                  currentAwakenedStars={cardData.awakenedStars || 0}
                  scale={0.7} 
                  onClick={() => {}}
                />
                <button 
                   onClick={() => router.push(`/wiki/${cardData.id}`)}
                   className="mt-6 px-5 py-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors text-sm w-full flex items-center justify-center gap-2"
                >
                  <BookOpen size={16} /> Đến bài học
                </button>
              </div>
            ) : (
              <div className="text-slate-500 font-bold">Lỗi tải thẻ</div>
            )}
         </div>

         <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Ngữ cảnh từ vựng</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Từ mục tiêu: <strong className="text-indigo-600 dark:text-indigo-400 text-base">{targetWord}</strong></p>
              </div>
              <button onClick={onClose} className="hidden md:flex p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-white dark:bg-[#0f172a]" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
               {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/5"></div>
                  </div>
               ) : (
                  renderHighlightedText()
               )}
            </div>
         </div>

       </div>
    </div>
  )
}

// --- MAIN PAGE ---
export default function VocabularyPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();

  const [vocabs, setVocabs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPos, setFilterPos] = useState("ALL");
  const [filterLang, setFilterLang] = useState("ALL");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [selectedContextVocab, setSelectedContextVocab] = useState<{cardId: number, word: string} | null>(null);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      setIsLoading(true);
      const res = await getUserVocabulary(user.id);
      if (res?.success && res.data) setVocabs(res.data);
      setIsLoading(false);
    })();
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  }, [user?.id]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => { if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setIsLangMenuOpen(false); };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // ĐÃ FIX: Chuẩn hóa trim() và toUpperCase() để tránh trùng lặp do khoảng trắng hay viết hoa thường
  const uniquePosList = useMemo(() => Array.from(new Set(vocabs.map(v => v.pos?.trim().toUpperCase()).filter(Boolean))).sort(), [vocabs]);

  const filteredVocabs = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return vocabs.filter(v => 
      (v.word.toLowerCase().includes(query) || v.meaning.toLowerCase().includes(query)) &&
      (filterPos === "ALL" || v.pos?.trim().toUpperCase() === filterPos) &&
      (filterLang === "ALL" || (v.language || "Tiếng Anh") === filterLang)
    );
  }, [vocabs, searchQuery, filterPos, filterLang]);

  const handleSpeak = (word: string, langName: string) => {
    if (!('speechSynthesis' in window)) return alert("Trình duyệt của bạn không hỗ trợ phát âm.");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    const langCode = getSpeechLangCode(langName);
    u.lang = langCode;
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(langCode.split('-')[0].toLowerCase()));
    u.voice = voices.find(v => /Google|Premium|Natural/i.test(v.name)) || voices[0];
    u.rate = 0.85; 
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#050810] font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; } * { scrollbar-width: none !important; -ms-overflow-style: none !important; }`}} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 mb-4 transition-colors"><ArrowLeft size={16} /> Quay lại</button>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3"><Library className="text-indigo-500" size={28} /> Kho Từ Vựng</h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mt-2">Bộ từ điển cá nhân được tổng hợp từ các thẻ Wiki bạn đã sở hữu.</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* DROPDOWN NGÔN NGỮ */}
              <div className="relative" ref={langMenuRef}>
                <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className={cn("bg-indigo-50 dark:bg-indigo-900/30 border-2 px-3.5 py-3.5 rounded-xl shrink-0 flex items-center justify-between gap-1 shadow-sm transition-all outline-none w-[180px]", isLangMenuOpen ? "border-indigo-400 ring-4 ring-indigo-500/20" : "border-indigo-200 dark:border-indigo-800/50 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700")}>
                    <div className="flex items-center gap-2">
                      <Globe size={20} className="text-indigo-500 dark:text-indigo-400" />
                      <span className="text-sm md:text-base font-black text-indigo-700 dark:text-indigo-300 truncate">{filterLang === "ALL" ? "Mọi ngôn ngữ" : filterLang}</span>
                    </div>
                    <ChevronDown size={18} className={cn("text-indigo-400 transition-transform duration-300 shrink-0", isLangMenuOpen && "rotate-180")} />
                </button>
                {isLangMenuOpen && (
                  <div className="absolute top-full right-0 sm:left-0 mt-2 w-[180px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1.5 flex flex-col gap-1">
                      <button onClick={() => { setFilterLang("ALL"); setIsLangMenuOpen(false); }} className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors", filterLang === "ALL" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                        Mọi ngôn ngữ {filterLang === "ALL" && <Check size={16} />}
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-0.5 mx-2" />
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <button key={lang} onClick={() => { setFilterLang(lang); setIsLangMenuOpen(false); }} className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors", filterLang === lang ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                          {lang} {filterLang === lang && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* TỔNG SỐ */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800/50 px-5 py-2.5 rounded-xl shrink-0 text-center shadow-sm flex flex-col items-center justify-center min-w-[90px]">
                 <span className="text-[10px] md:text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1">Tổng số</span>
                 <span className="text-xl md:text-2xl font-black text-indigo-700 dark:text-indigo-300 leading-none">{filteredVocabs.length}</span>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="w-5 h-5 text-slate-400" /></div>
              <input type="text" placeholder="Tìm kiếm từ hoặc nghĩa tiếng Việt..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={18} /></button>}
            </div>

            <div className="flex overflow-x-auto gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 no-scrollbar">
              <button onClick={() => setFilterPos("ALL")} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap", filterPos === "ALL" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>Tất cả</button>
              {uniquePosList.map(pos => (
                <button key={pos as string} onClick={() => setFilterPos(pos as string)} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap uppercase", filterPos === pos ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>{pos as string}</button>
              ))}
            </div>
          </div>

          {/* LIST */}
          {isLoading ? (
            <div className="py-20 text-center text-slate-500 font-bold animate-pulse">Đang lật mở từ điển...</div>
          ) : filteredVocabs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Layers className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-bold text-lg">Không tìm thấy từ vựng nào.</p>
              <p className="text-sm mt-1">Hãy thử tìm từ khóa khác hoặc quay thẻ Gacha để nạp thêm tri thức!</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-5 lg:gap-6 animate-in slide-in-from-bottom-4">
              {filteredVocabs.map((v, i) => {
                const { phonetic, pron, exp } = parseVocabDesc(v.englishDesc);
                return (
                  <div key={i} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all flex flex-col group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-2">
                        <h3 className="text-xl font-black text-indigo-700 dark:text-indigo-400 break-words leading-tight mb-1">{safeText(v.word)}</h3>
                        {v.pos && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">{v.pos?.trim().toUpperCase()}</span>}
                      </div>
                      <button onClick={() => handleSpeak(v.word, v.language || "Tiếng Anh")} className="shrink-0 p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors" title="Nghe phát âm"><Volume2 size={18} /></button>
                    </div>

                    <div className="mb-4 flex-1">
                      <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mb-2">{safeText(v.meaning)}</p>
                      {phonetic && (
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[13px] font-black text-indigo-600/80 dark:text-indigo-400/80 font-mono tracking-wide bg-indigo-50 dark:bg-indigo-900/10 px-1.5 py-0.5 rounded">{phonetic}</span>
                          {pron && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{pron}</span>}
                        </div>
                      )}
                      {exp && <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-3 leading-relaxed">{exp}</p>}
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <button onClick={() => setSelectedContextVocab({ cardId: v.cardId, word: v.word })} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors group/link w-fit outline-none text-left">
                        <BookOpen size={12} /><span className="uppercase tracking-widest truncate max-w-[150px]">{safeText(v.cardTitle)}</span>
                      </button>
                      <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">{v.language || "Tiếng Anh"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedContextVocab && <ReadingContextModal userId={user?.id} cardId={selectedContextVocab.cardId} targetWord={selectedContextVocab.word} onClose={() => setSelectedContextVocab(null)} />}
    </div>
  );
}