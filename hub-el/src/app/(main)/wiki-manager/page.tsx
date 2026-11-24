// src/app/(main)/wiki-manager/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getWikiManagementData } from "@/actions/wiki-manager";
import { BookOpen, History, X, CheckCircle2, XCircle, Clock, Award, Play, PlusCircle, Library, ArrowDownAZ, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { WikiCard3D } from "@/components/ui/wiki-card-3d";

// Business rule: Trọng số định lượng độ hiếm để phân cấp thứ tự sắp xếp thẻ.
const RARITY_WEIGHT: Record<string, number> = { MR: 7, LR: 6, UR: 5, SSR: 4, SR: 3, R: 2, N: 1 };

function ReviewHistoryModal({ attempt, onClose }: { attempt: any, onClose: () => void }) {
  if (!attempt) return null;
  
  // Logic: Parse dữ liệu từ snapshot để đảm bảo hiển thị đúng nội dung bài học tại thời điểm thi, do dữ liệu AI sinh ra trên thẻ gốc có thể bị thay đổi.
  const lessonData = attempt.lessonSnapshot ? JSON.parse(attempt.lessonSnapshot) : null;
  const userAnswers = attempt.userAnswers ? JSON.parse(attempt.userAnswers) : [];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1e293b]">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Chi tiết bài làm</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1"><Clock size={14}/> {new Date(attempt.createdAt).toLocaleString('vi-VN')}</span>
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Award size={14}/> Đúng {attempt.correctCount}/{attempt.totalQuizzes} câu</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-slate-50 dark:bg-[#0b1120]" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {lessonData ? (
            <>
              <div className="bg-white dark:bg-[#1e293b] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-700">Đoạn văn đã đọc</h3>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed text-justify">{lessonData.simplifiedText}</p>
              </div>

              <div className="space-y-6">
                <h3 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-widest border-b-2 border-blue-500 pb-2 inline-block">Câu hỏi & Đáp án</h3>
                {lessonData.quizzes?.map((quiz: any, qIdx: number) => {
                  const userAnswer = userAnswers[qIdx];
                  const isMultipleChoice = ["multiple_choice", "guess_meaning", "true_false", "main_idea", "inference"].includes(quiz.type);
                  
                  let isCorrect = false;
                  
                  // Logic: Xóa khoảng trắng thừa và chuẩn hóa lowercase trước khi kiểm tra để chấm điểm chính xác đối với dạng câu hỏi nhập tự luận.
                  if (isMultipleChoice) {
                    const selectedText = String(quiz.options[Number(userAnswer)] || "").trim().toLowerCase();
                    isCorrect = quiz.correctAnswers.some((a: string) => String(a).trim().toLowerCase() === selectedText);
                  } else {
                    isCorrect = quiz.correctAnswers.some((a: string) => String(a).trim().toLowerCase() === String(userAnswer).trim().toLowerCase());
                  }

                  return (
                    <div key={qIdx} className="bg-white dark:bg-[#1e293b] p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex gap-3 items-start mb-4">
                         <span className={cn("shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-black text-white", isCorrect ? "bg-green-500" : "bg-red-500")}>
                           {isCorrect ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
                         </span>
                         <div>
                           <span className="text-[10px] sm:text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded uppercase tracking-wider mb-2 inline-block">{quiz.type}</span>
                           <p className="font-bold text-slate-800 dark:text-white text-base sm:text-lg leading-snug">{quiz.question}</p>
                         </div>
                      </div>

                      {isMultipleChoice ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-0 sm:ml-11 mt-2">
                          {quiz.options.map((opt: string, oIdx: number) => {
                            const isOptCorrect = quiz.correctAnswers.some((a:string) => String(a).trim().toLowerCase() === String(opt).trim().toLowerCase());
                            const isSelected = Number(userAnswer) === oIdx;
                            
                            let btnClass = "bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 opacity-60";
                            if (isOptCorrect) btnClass = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 font-bold border-2 opacity-100";
                            else if (isSelected && !isOptCorrect) btnClass = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300 font-bold border-2 opacity-100";

                            return (
                              <div key={oIdx} className={cn("p-2.5 sm:p-3 rounded-lg border text-[13px] sm:text-sm flex items-center justify-between", btnClass)}>
                                <span>{opt}</span>
                                {isOptCorrect && <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0 ml-2"/>}
                                {isSelected && !isOptCorrect && <XCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 ml-2"/>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="ml-0 sm:ml-11 mt-2">
                           <div className="p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg text-sm mb-2 flex flex-col">
                             <span className="text-slate-500 text-[10px] uppercase mb-1 font-bold">Bạn đã nhập:</span>
                             <span className={cn("font-bold text-[15px]", isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{userAnswer || "(Bỏ trống)"}</span>
                           </div>
                           <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg text-sm flex flex-col">
                             <span className="text-green-600 dark:text-green-500 text-[10px] uppercase mb-1 font-bold">Đáp án chuẩn:</span>
                             <span className="font-bold text-[15px] text-green-700 dark:text-green-400">{quiz.correctAnswers.join(" / ")}</span>
                           </div>
                        </div>
                      )}

                      <div className="ml-0 sm:ml-11 mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-lg">
                        <span className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest block mb-1.5">AI Giải thích</span>
                        <p className="text-[13px] sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed text-justify">{quiz.explanation}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-500">Dữ liệu bài học cũ này không được tìm thấy.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ManagerCardItem({ item, onViewAttempt }: { item: any, onViewAttempt: (att: any) => void }) {
  const router = useRouter();
  const card = item.card;
  const isUnGen = card.aiContent === "Chưa generate";
  const history = card.attempts || [];
  
  // Logic: Ưu tiên link wiki gốc do user tự truyền vào, nếu không có mới fallback về link mặc định của hệ thống.
  const wikiUrl = card.url || card.wikiUrl || `https://vi.wikipedia.org/wiki/${encodeURIComponent(card.title)}`;

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg transition-shadow flex flex-col md:flex-row h-full">
      <div className="p-6 md:p-4 flex items-center justify-center bg-slate-50 dark:bg-[#0b1120]/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/50 min-h-[220px] md:min-w-[200px] shrink-0">
         <WikiCard3D 
           card={card} 
           currentAwakenedStars={card.awakenedStars || 0}
           scale={0.5} 
           onClick={() => router.push(`/wiki/${card.id}`)}
         />
      </div>

      <div className="flex-1 p-5 flex flex-col min-w-0">
         <div className="flex justify-between items-start mb-1">
             <h3 className="font-bold text-xl text-slate-900 dark:text-white truncate pr-2">{card.title}</h3>
             <button onClick={() => window.open(wikiUrl, '_blank')} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors shrink-0">
                 Chi tiết
             </button>
         </div>
         <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sở hữu lúc: {new Date(item.acquiredAt).toLocaleDateString('vi-VN')}</p>
         
         <div className="mb-5 md:mb-6">
            {!isUnGen ? (
              <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                 <CheckCircle2 size={16}/> Bài học đã sẵn sàng
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                 Chưa học lần nào
              </span>
            )}
         </div>

         <button onClick={() => router.push(`/wiki/${card.id}`)} className="w-full py-3 mb-5 md:mb-6 flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-200 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm uppercase tracking-wider transition-transform active:scale-95 shadow-md mt-auto">
            <Play size={18}/> Học Ngay
         </button>

         <div className="mt-auto border-t border-slate-200 dark:border-slate-700/50 pt-4 shrink-0">
            <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><History size={14}/> Lịch sử thi gần đây</p>
            {history.length > 0 ? (
               <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                 {history.map((att: any, i: number) => {
                   const isPass = att.correctCount >= Math.ceil(att.totalQuizzes / 2);
                   return (
                     <div key={i} onClick={() => onViewAttempt(att)} className={cn("shrink-0 cursor-pointer px-3 md:px-4 py-2 rounded-xl border flex flex-col items-center min-w-[70px] md:min-w-[80px] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800", isPass ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10" : "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10")}>
                       <span className={cn("text-sm font-black", isPass ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500")}>{att.correctCount}/{att.totalQuizzes}</span>
                       <span className="text-[9px] md:text-[10px] text-slate-500 mt-1">{new Date(att.createdAt).toLocaleDateString('vi-VN')}</span>
                     </div>
                   );
                 })}
               </div>
            ) : (
               <p className="text-xs md:text-sm text-slate-500 italic">Chưa có lịch sử làm bài.</p>
            )}
         </div>
      </div>
    </div>
  );
}

export default function WikiManagerPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();

  const [inventory, setInventory] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'STUDIED' | 'UNSTUDIED'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'RARITY' | 'NAME'>('NEWEST');
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAttempt, setViewingAttempt] = useState<any>(null);

  const fetchData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const res = await getWikiManagementData(user.id) as any;
    if (res.success) setInventory(res.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  // Logic: Tách bạch bước lọc và sắp xếp. Chạy lọc trước để giảm số lượng phần tử cần xử lý, sau đó mới thực thi thuật toán sắp xếp (O(N log N)) để tối ưu tốc độ render.
  const filteredCards = useMemo(() => {
    let result = [...inventory];

    if (filter === 'STUDIED') {
      result = result.filter(item => item.card.attempts && item.card.attempts.length > 0);
    } else if (filter === 'UNSTUDIED') {
      result = result.filter(item => !item.card.attempts || item.card.attempts.length === 0);
    }

    if (sortBy === 'NEWEST') {
      result.sort((a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime());
    } else if (sortBy === 'RARITY') {
      result.sort((a, b) => (RARITY_WEIGHT[b.card.rarity] || 0) - (RARITY_WEIGHT[a.card.rarity] || 0));
    } else if (sortBy === 'NAME') {
      result.sort((a, b) => a.card.title.localeCompare(b.card.title));
    }

    return result;
  }, [inventory, filter, sortBy]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#050810] p-4 md:p-6 lg:p-8">
      {/* Workaround bug: Vô hiệu hóa thanh cuộn toàn cục ngay trong component để ngăn layout giật lag khi chuyển đổi giữa các tab lọc dữ liệu. */}
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      `}} />

      <div className="w-full mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
              <BookOpen className="text-blue-500" size={28} /> Quản lý Bài Học
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mt-2">Theo dõi tiến độ và xem lại lịch sử các thẻ Wiki của bạn.</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => router.push('/vocabulary')} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm">
              <Library size={18} /> Kho Từ Vựng
            </button>
            <button onClick={() => router.push('/gacha')} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-xl shadow-lg transition-transform active:scale-95 text-sm uppercase tracking-wide">
              <PlusCircle size={18} /> Nhận thêm thẻ
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-wrap bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'STUDIED', label: 'Đã học' },
              { id: 'UNSTUDIED', label: 'Chưa học' }
            ].map(f => (
              <button 
                key={f.id} onClick={() => setFilter(f.id as any)}
                className={cn("px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all", filter === f.id ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 pr-1 hidden sm:inline-block"><ArrowDownAZ size={14} className="inline mr-1" />Sắp xếp:</span>
            {[
              { id: 'NEWEST', label: 'Mới nhất' },
              { id: 'RARITY', label: 'Độ hiếm' },
              { id: 'NAME', label: 'A-Z' }
            ].map(s => (
              <button 
                key={s.id} onClick={() => setSortBy(s.id as any)}
                className={cn("px-3 py-1.5 text-xs md:text-sm font-bold rounded-lg transition-all", sortBy === s.id ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-500 font-bold animate-pulse">Đang tải dữ liệu...</div>
        ) : filteredCards.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Sparkles className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-bold">Không có thẻ nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(450px,1fr))] gap-4 md:gap-6">
            {filteredCards.map((item) => (
              <ManagerCardItem key={item.id} item={item} onViewAttempt={setViewingAttempt} />
            ))}
          </div>
        )}
      </div>

      {viewingAttempt && (
        <ReviewHistoryModal attempt={viewingAttempt} onClose={() => setViewingAttempt(null)} />
      )}
    </div>
  );
}