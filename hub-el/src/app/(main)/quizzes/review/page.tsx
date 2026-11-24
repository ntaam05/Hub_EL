"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Loader2, Zap, CheckCircle, AlertTriangle, 
  ArrowLeft, Trophy, Award, Clock, XCircle, Star
} from 'lucide-react';
import { generateTopicReviewAction, saveSummaryScoreAction } from '@/actions/quiz/attempt';
import { updateTaskProgressAction } from '@/actions/quests/progress';

export default function ReviewQuizPage() {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get('topic');
  const router = useRouter();
  const { data: session } = useSession();
  const initialized = useRef(false);

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<any>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);

  // STATE ĐỒNG HỒ (30 Phút = 1800 Giây)
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  // 1. GỌI AI TẠO ĐỀ TỔNG HỢP
  useEffect(() => {
    const initQuiz = async () => {
      // 🚨 NẾU ĐÃ CHẠY RỒI (initialized.current === true) THÌ DỪNG LẠI NGAY!
      if (!playlistId || !session?.user?.id || initialized.current) return; 
      
      initialized.current = true; // Khóa cửa lại, không cho chạy lần 2

      try {
        const res = await generateTopicReviewAction({ 
            topic: playlistId,
            userId: session.user.id 
        });
        if (res.success && res.data) setQuizzes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user?.id) {
        initQuiz();
    }
  }, [playlistId, session]);

  // 2. LOGIC ĐẾM NGƯỢC THỜI GIAN
  useEffect(() => {
    if (loading || hasSubmitted || quizzes.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, hasSubmitted, quizzes.length]);

  // 3. TỰ ĐỘNG NỘP BÀI KHI HẾT GIỜ
  useEffect(() => {
    if (timeLeft === 0 && !hasSubmitted) {
      alert("Đã hết 30 phút! Hệ thống đang tự động thu bài.");
      handleSubmit();
    }
  }, [timeLeft, hasSubmitted]);

  // ĐỊNH DẠNG THỜI GIAN
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isTimeRunningOut = timeLeft <= 300;

  // 4. XỬ LÝ NỘP BÀI
  const handleSubmit = async () => {
    let correct = 0;
    quizzes.forEach((q, i) => {
      if (userAnswers[i] === q.correctAnswer) correct++; 
    });

    const score = quizzes.length > 0 ? Math.round((correct / quizzes.length) * 100) : 0;
    
    let grade = "Trung bình";
    if (score >= 90) grade = "Xuất sắc";
    else if (score >= 80) grade = "Giỏi";
    else if (score >= 60) grade = "Khá";

    setFinalResult({ score, correct, grade });
    setHasSubmitted(true);

    if (session?.user?.id && playlistId) {
      setIsSubmitting(true);
      await saveSummaryScoreAction(session.user.id, playlistId, score);
      updateTaskProgressAction(session.user.id, "QUIZ_ATTEMPT", quizzes.length);
      if (correct > 0) {
          updateTaskProgressAction(session.user.id, "QUIZ_CORRECT", correct);
      }
      setIsSubmitting(false);
      window.dispatchEvent(new Event('quizCompleted'));
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-[#00f2ff]" />
      <p className="text-slate-400 font-medium animate-pulse text-sm md:text-base px-4 text-center">AI đang phân tích khóa học và biên soạn đề thi...</p>
    </div>
  );

  if (quizzes.length === 0) return (
    <div className="text-center mt-20 px-4">
      <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl md:text-2xl font-bold text-white">Lỗi tạo bài tập</h2>
      <p className="text-sm md:text-base text-slate-400 mt-2">Hệ thống AI đang bảo trì. Vui lòng thử lại sau nhé!</p>
      <button onClick={() => router.back()} className="mt-6 px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base bg-[#00f2ff] text-black font-black hover:bg-[#00d4ff] rounded-xl md:rounded-2xl transition-all shadow-lg shadow-[#00f2ff]/20">Quay lại</button>
    </div>
  );

  return (
    // THÊM pb-32 ĐỂ KHÔNG BỊ THANH MOBILE NAV VÀ NÚT NỘP BÀI DƯỚI ĐÁY CHE KHUẤT
    <div className="max-w-4xl mx-auto pb-32 md:pb-24 pt-4 md:pt-8 px-4">
      
      {/* NÚT THOÁT VÀ ĐỒNG HỒ */}
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base text-slate-400 hover:text-[#00f2ff] font-bold transition-colors">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Thoát phòng thi
        </button>
        
        {!hasSubmitted && (
          <div className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black ${
            isTimeRunningOut 
              ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' 
              : 'bg-[#11111a] text-[#00f2ff] border border-[#1a1a24]'
          }`}>
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-base md:text-xl tracking-wider">{timeDisplay}</span>
          </div>
        )}
      </div>

      {/* HEADER BÀI THI */}
      <div className="bg-[#0a0a0c] border border-[#1a1a24] rounded-2xl md:rounded-[32px] p-5 md:p-8 text-white mb-6 md:mb-10 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <span className="px-3 md:px-4 py-1 md:py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">
               KIỂM TRA TỔNG HỢP
            </span>
          </div>
          <h1 className="text-xl md:text-3xl font-black mb-1 md:mb-2 text-white">BÀI THI CUỐI KHÓA</h1>
          <p className="text-xs md:text-base text-slate-400">Gồm {quizzes.length} câu hỏi được AI tổng hợp từ toàn bộ kiến thức trong khóa học.</p>
        </div>
        <Zap className="absolute right-[-10px] md:right-[-20px] bottom-[-10px] md:bottom-[-20px] w-32 h-32 md:w-64 md:h-64 text-[#00f2ff]/5 rotate-12" />
      </div>

      {/* KẾT QUẢ SAU KHI NỘP */}
      {hasSubmitted && finalResult && (
        <div className="bg-[#0a0a0c] border border-[#00f2ff] rounded-2xl md:rounded-[32px] p-6 md:p-10 mb-8 md:mb-10 text-center animate-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(0,242,255,0.15)] relative overflow-hidden">
          <Trophy className="w-16 h-16 md:w-24 md:h-24 text-[#00f2ff] mx-auto mb-4 md:mb-6 drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]" />
          <h2 className="text-2xl md:text-4xl font-black text-white mb-2">ĐÃ HOÀN THÀNH!</h2>
          
          <div className="flex justify-center items-center gap-6 md:gap-10 my-6 md:my-8">
            <div>
              <p className="text-slate-500 text-[10px] md:text-sm uppercase font-black tracking-widest mb-1 md:mb-2">Điểm số</p>
              <p className="text-5xl md:text-6xl font-black text-[#00f2ff]">{finalResult.score}</p>
            </div>
            <div className="w-px h-12 md:h-20 bg-[#1a1a24]"></div>
            <div>
              <p className="text-slate-500 text-[10px] md:text-sm uppercase font-black tracking-widest mb-1 md:mb-2">Xếp loại</p>
              <p className="text-2xl md:text-4xl font-black text-white mt-2 md:mt-4">{finalResult.grade}</p>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/quizzes')} // Đã fix lại điều hướng về /quizzes
            className="w-full md:w-auto px-6 md:px-10 py-3 md:py-4 bg-[#00f2ff] text-black rounded-xl md:rounded-2xl font-black hover:bg-[#00d4ff] hover:-translate-y-1 transition-all text-sm md:text-lg shadow-[0_0_20px_rgba(0,242,255,0.3)]"
          >
            Quay Về Góc Luyện Tập
          </button>
        </div>
      )}

      {/* DANH SÁCH CÂU HỎI */}
      <div className="space-y-4 md:space-y-6">
        {quizzes.map((q, i) => {
          const isUserCorrect = userAnswers[i] === q.correctAnswer;
          const isHard = q.isAdvanced; 
          
          return (
            <div key={i} className={`p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border transition-all ${
                isHard 
                  ? 'bg-[#0a0a0c] border-amber-500/50 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'bg-[#0a0a0c] border-[#1a1a24] hover:border-[#2a2a35]'
            }`}>
              
              {/* LABEL BÁO HIỆU CÂU KHÓ */}
              {isHard && (
                  <div className="inline-flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[9px] md:text-[10px] font-black uppercase mb-3 md:mb-4 tracking-wider border border-amber-500/20">
                    <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current"/> Câu hỏi nâng cao (AI)
                  </div>
              )}

              <p className="font-bold text-base md:text-xl mb-4 md:mb-6 text-slate-100 leading-relaxed">
                  <span className={isHard ? "text-amber-500 mr-1 md:mr-2" : "text-[#00f2ff] mr-1 md:mr-2"}>Câu {i + 1}:</span> 
                  <span dangerouslySetInnerHTML={{ __html: q.questionText }} />
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                {['A', 'B', 'C', 'D'].map(opt => {
                  const optionText = q[`option${opt}`];
                  if (!optionText) return null;

                  const isSelected = userAnswers[i] === opt;
                  const isCorrectOpt = q.correctAnswer === opt;
                  
                  let btnStyle = "bg-[#11111a] border-[#1a1a24] hover:bg-[#1f1f2e] text-slate-300";
                  
                  if (hasSubmitted) {
                    if (isCorrectOpt) {
                        btnStyle = "bg-green-500/10 border-green-500 text-green-400 font-bold shadow-sm shadow-green-500/20";
                    } else if (isSelected && !isCorrectOpt) {
                        btnStyle = "bg-red-500/10 border-red-500 text-red-400 font-bold shadow-sm shadow-red-500/20";
                    } else {
                        btnStyle = "opacity-40 bg-[#11111a] border-[#1a1a24] text-slate-500"; 
                    }
                  } else if (isSelected) {
                    btnStyle = "bg-[#00f2ff]/10 border-[#00f2ff] text-[#00f2ff] font-bold shadow-sm shadow-[#00f2ff]/20";
                  }

                  return (
                    <button 
                      key={opt} 
                      disabled={hasSubmitted}
                      onClick={() => setUserAnswers({...userAnswers, [i]: opt})}
                      className={`p-3 md:p-4 rounded-xl md:rounded-2xl border text-left flex justify-between items-center transition-all duration-300 ${btnStyle}`}
                    >
                      <span className="leading-relaxed">
                          <span className="font-black mr-1 md:mr-2 opacity-60">{opt}.</span> 
                          <span dangerouslySetInnerHTML={{ __html: optionText }} />
                      </span>
                      {hasSubmitted && isCorrectOpt && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0 opacity-100" />}
                      {hasSubmitted && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0 opacity-100" />}
                    </button>
                  );
                })}
              </div>
              
              {hasSubmitted && (
                <div className={`mt-4 md:mt-6 p-4 md:p-6 rounded-xl md:rounded-2xl text-xs md:text-sm border ${isUserCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <p className={`font-black text-sm md:text-base mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2 ${isUserCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isUserCorrect ? <><CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> CHÍNH XÁC</> : <><XCircle className="w-4 h-4 md:w-5 md:h-5" /> CHƯA CHÍNH XÁC</>}
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    <span className="font-bold opacity-70">Giải thích:</span> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NÚT NỘP BÀI THỦ CÔNG (Đẩy lên bottom-20 để né thanh Navbar dưới đáy Mobile) */}
      {!hasSubmitted && Object.keys(userAnswers).length > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3.5 md:py-5 bg-[#00f2ff] text-black rounded-xl md:rounded-full font-black text-base md:text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-[0_10px_40px_rgba(0,242,255,0.4)]"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Award className="w-5 h-5 md:w-6 md:h-6" />}
            {isSubmitting ? 'ĐANG CHẤM ĐIỂM...' : 'NỘP BÀI THI CUỐI KỲ'}
          </button>
        </div>
      )}
    </div>
  );
}