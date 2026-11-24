"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { saveQuizAttemptAction } from '@/actions/quiz/attempt';
import { updateTaskProgressAction } from '@/actions/quests/progress';

export default function HistoryQuizzRoomPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [video, setVideo] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<any>({}); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // LẤY DỮ LIỆU TỪ HÀNH LÝ TRUYỀN SANG
  useEffect(() => {
    const savedState = sessionStorage.getItem('routeState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.isReviewMode && parsed.pastQuizData) {
           setVideo(parsed.video);
           
           let pastQs = parsed.pastQuizData;
           if (typeof pastQs === 'string') pastQs = JSON.parse(pastQs);
           if (typeof pastQs === 'string') pastQs = JSON.parse(pastQs); 
           
           if (!Array.isArray(pastQs) && pastQs.questions) {
               pastQs = pastQs.questions;
           }
           
           setQuizzes(pastQs || []);
        } else {
            router.push('/quizzes'); 
        }
      } catch(e) { 
        console.error("Lỗi đọc dữ liệu ôn tập:", e);
        router.push('/quizzes'); 
      }
    } else {
        router.push('/quizzes');
    }
  }, [router]);

  const handleSubmitQuiz = async () => {
    if (!session?.user?.id) return alert("Vui lòng đăng nhập!");
    let score = 0;
    quizzes.forEach((q: any, i: number) => { 
        const ansText = q[`option${userAnswers[i]}`] || q.options?.[userAnswers[i] === 'A' ? 0 : userAnswers[i] === 'B' ? 1 : userAnswers[i] === 'C' ? 2 : 3];
        if (userAnswers[i] === q.correctAnswer || ansText === q.correctAnswer) score++; 
    });
    
    setHasSubmitted(true); 
    setIsSubmitting(true);
    
    try {
      const res = await saveQuizAttemptAction({
        userId: session.user.id as string, 
        videoId: video.videoId || video.youtubeUrl, 
        videoTitle: video.title,
        channelName: video.channelTitle, 
        score, 
        correctCount: score, 
        totalQuizzes: quizzes.length, 
        questionsData: quizzes
      });
      if (res.success) {
        updateTaskProgressAction(session.user.id as string, "QUIZ_ATTEMPT", quizzes.length);
        
        if (score > 0) {
            updateTaskProgressAction(session.user.id as string, "QUIZ_CORRECT", score);
        }

        window.dispatchEvent(new Event('quizCompleted'));
      }
    } catch (err) { console.error(err); }
    setIsSubmitting(false);
  };

  if (!video) return <div className="flex justify-center mt-40"><Loader2 className="w-12 h-12 animate-spin text-indigo-500 dark:text-[#00f2ff]" /></div>;

  return (
    // 🚨 ĐÃ FIX: Bung nền ra 100% Ultrawide, thêm background 3D y hệt các trang khác
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#020617] font-sans flex flex-col overflow-x-hidden">
      
      {/* 🚨 ĐÃ FIX: Lớp ánh sáng Glow và Pattern chìm */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-indigo-500/15 dark:bg-cyan-600/10 rounded-full blur-[150px]" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.02]" />
      </div>

      {/* CHỈNH LẠI max-w-5xl CHO PHẦN CÂU HỎI ĐỂ ĐỌC CHỮ KHÔNG MỎI CỔ */}
      <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full relative w-full max-w-5xl mx-auto pb-32 md:pb-20 px-4 pt-6 md:pt-10 md:px-6 z-10">
        
        <button onClick={() => router.back()} className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base text-slate-500 hover:text-indigo-600 dark:hover:text-[#00f2ff] mb-4 md:mb-6 font-bold transition-colors w-fit">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Trở về Danh sách Lịch sử
        </button>

        {/* KHU VỰC VIDEO (Đã bật Light Mode/Glassmorphism) */}
        <div className="bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm mb-6 md:mb-8 flex flex-col md:flex-row gap-4 md:gap-6 items-center">
           <div className="w-full md:w-[350px] aspect-video rounded-xl md:rounded-2xl overflow-hidden bg-slate-200 dark:bg-black shrink-0 shadow-md">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${video.videoId || video.youtubeUrl}?controls=1`} allowFullScreen></iframe>
           </div>
           <div className="w-full">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 bg-indigo-100 text-indigo-700 dark:bg-[#00f2ff]/10 dark:text-[#00f2ff] rounded-full text-[10px] md:text-[11px] font-black uppercase mb-2 md:mb-3 tracking-wider">
                 <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4"/> CHẾ ĐỘ ÔN TẬP
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug" dangerouslySetInnerHTML={{ __html: video.title || "Bài ôn tập" }}></h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 md:mt-2">Làm lại bài kiểm tra này để củng cố kiến thức và khắc phục lỗi sai của bạn!</p>
           </div>
        </div>
        
        {/* KHU VỰC CÂU HỎI */}
        <div className="bg-transparent rounded-2xl md:rounded-3xl">
          <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 border-b border-slate-200/50 dark:border-slate-700/50 pb-3 md:pb-4 flex items-center gap-2 text-slate-800 dark:text-white">
              📝 Danh sách câu hỏi ({quizzes.length} câu)
          </h3>
          
          {quizzes.length === 0 ? (
             <p className="text-slate-500 dark:text-slate-400 text-center text-sm md:text-base py-10">Đang tải câu hỏi hoặc bài tập này không có dữ liệu...</p>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {quizzes.map((q: any, index: number) => {
                const ansText = q[`option${userAnswers[index]}`] || q.options?.[userAnswers[index] === 'A' ? 0 : userAnswers[index] === 'B' ? 1 : userAnswers[index] === 'C' ? 2 : 3];
                const isUserCorrect = userAnswers[index] === q.correctAnswer || ansText === q.correctAnswer;

                return (
                  // 🚨 ĐÃ FIX: Thẻ Card cho từng câu hỏi bật Glassmorphism
                  <div key={index} className="p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-slate-600">
                    <p className="font-bold text-base md:text-xl mb-4 md:mb-6 text-slate-800 dark:text-slate-100 leading-relaxed">
                        <span className="text-indigo-600 dark:text-[#00f2ff] mr-1 md:mr-2">Câu {index + 1}:</span> 
                        {q.questionText || q.question}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const optionText = q[`option${opt}`] || q.options?.[opt === 'A' ? 0 : opt === 'B' ? 1 : opt === 'C' ? 2 : 3];
                        if (!optionText) return null;

                        const isSelected = userAnswers[index] === opt || userAnswers[index] === optionText;
                        const isCorrectOpt = q.correctAnswer === opt || q.correctAnswer === optionText;
                        
                        // 🚨 ĐÃ FIX: Logic đổi màu cho cả 2 mode (Light/Dark)
                        let btnStyle = "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 dark:bg-[#11111a] dark:border-[#1a1a24] dark:hover:bg-[#1f1f2e] dark:text-slate-300";
                        
                        if (hasSubmitted) {
                          if (isCorrectOpt) {
                              btnStyle = "bg-green-50 border-green-500 text-green-700 font-bold shadow-sm dark:bg-green-500/10 dark:text-green-400 dark:shadow-green-500/20";
                          } else if (isSelected && !isCorrectOpt) {
                              btnStyle = "bg-red-50 border-red-500 text-red-700 font-bold shadow-sm dark:bg-red-500/10 dark:text-red-400 dark:shadow-red-500/20";
                          } else {
                              btnStyle = "opacity-50 bg-slate-50 border-slate-200 text-slate-500 dark:bg-[#11111a] dark:border-[#1a1a24] dark:text-slate-500"; 
                          }
                        } else if (isSelected) {
                          btnStyle = "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm dark:bg-[#00f2ff]/10 dark:border-[#00f2ff] dark:text-[#00f2ff] dark:shadow-[#00f2ff]/20";
                        }

                        return (
                          <button 
                            key={opt} 
                            onClick={() => !hasSubmitted && setUserAnswers({ ...userAnswers, [index]: opt })} 
                            disabled={hasSubmitted} 
                            className={`p-3 md:p-4 rounded-xl md:rounded-2xl border text-left flex justify-between items-center transition-all duration-300 ${btnStyle}`}
                          >
                            <span className="leading-relaxed">
                                <span className="font-black mr-1 md:mr-2 opacity-60">{opt}.</span> 
                                {optionText}
                            </span>
                            {hasSubmitted && isCorrectOpt && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0 opacity-100" />}
                            {hasSubmitted && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0 opacity-100" />}
                          </button>
                        );
                      })}
                    </div>

                    {hasSubmitted && (
                      <div className={`mt-4 md:mt-6 p-4 md:p-6 rounded-xl md:rounded-2xl text-xs md:text-sm border ${isUserCorrect ? 'bg-green-50 border-green-200 dark:bg-green-500/5 dark:border-green-500/20' : 'bg-red-50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20'}`}>
                        <p className={`font-black text-sm md:text-base mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2 ${isUserCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isUserCorrect ? <><CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> CHÍNH XÁC</> : <><XCircle className="w-4 h-4 md:w-5 md:h-5" /> CHƯA CHÍNH XÁC</>}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-bold opacity-70">Giải thích:</span> {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* NÚT NỘP BÀI (Tự động thích ứng màu) */}
          {!hasSubmitted && quizzes.length > 0 && (
              <div className="fixed bottom-20 md:static md:bottom-auto left-1/2 -translate-x-1/2 md:translate-x-0 w-full md:w-auto max-w-sm md:max-w-none px-4 md:px-0 z-50 mt-0 md:mt-10 flex justify-end">
                  <button 
                    onClick={handleSubmitQuiz} 
                    disabled={isSubmitting || Object.keys(userAnswers).length === 0} 
                    className={`w-full md:w-auto px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 text-base md:text-lg flex items-center justify-center md:justify-start gap-2 md:gap-3
                      ${Object.keys(userAnswers).length === 0 
                        ? 'bg-slate-300 text-slate-500 dark:bg-slate-800 cursor-not-allowed opacity-50' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:bg-[#00f2ff] dark:text-black dark:hover:bg-[#00d4ff] dark:shadow-[#00f2ff]/20'
                      }`}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 md:w-6 h-6 animate-spin" /> : <CheckCircle className="w-5 h-5 md:w-6 h-6"/>} 
                    {isSubmitting ? 'ĐANG CHẤM ĐIỂM...' : 'NỘP BÀI ÔN TẬP'}
                  </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}