"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Loader2, PlayCircle, CheckCircle, XCircle, 
  Heart, AlertTriangle, Zap, Sparkles, Award, Coins, 
  Flag, X, Ban, Share2
} from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ShareVideoModal from '@/components/modals/ShareVideoModal';

import { generateQuizFromVideoAction } from '@/actions/quiz/ai';
import { saveQuizAttemptAction } from '@/actions/quiz/attempt';
// 🚨 Import thêm checkEducationalVideoAction
import { getRelatedVideosAction, checkEducationalVideoAction } from '@/actions/video/video'; 
import { checkFavoriteAction, addFavoriteAction, removeFavoriteAction } from '@/actions/video/favorite';
import { syncStudyTimeAction } from '@/actions/stats'; 
import { markVideoCompletedAction } from '@/actions/user/learning'; 
import { updateTaskProgressAction } from '@/actions/quests/progress';
import { reportVideoAction } from '@/actions/video/report';

// =====================================
// COMPONENT: NÚT THẢ TIM
// =====================================
const LikeButton = ({ video, showNotification }: { video: any, showNotification: Function }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && video?.videoId) {
      checkFavoriteAction(userId, video.videoId).then(res => {
        setIsLiked(res.success ? !!res.data : false); 
        setLoading(false);
      });
    } else setLoading(false);
  }, [userId, video]);

  const handleToggleLike = async () => {
    if (!userId) return showNotification("Vui lòng đăng nhập để lưu video!", "error");
    setLoading(true);
    try {
      if (isLiked) {
         await removeFavoriteAction(userId, video.videoId);
      } else {
         await addFavoriteAction({ userId, videoId: video.videoId, title: video.title, channelTitle: video.channelTitle, thumbnailUrl: video.thumbnailUrl });
         updateTaskProgressAction(userId, "COURSE_ADD", 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {}
    setLoading(false);
  };

  return (
    <button onClick={handleToggleLike} disabled={loading} title={isLiked ? "Bỏ yêu thích" : "Yêu thích"} className={`p-3 flex-shrink-0 rounded-full transition-all border flex items-center justify-center ${isLiked ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30' : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-[#1e1e24] dark:border-slate-700/50'}`}>
      <Heart className={`w-6 h-6 transition-all duration-300 ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-500 hover:text-red-400'}`} />
    </button>
  );
};

// =====================================
// COMPONENT: NÚT BÁO CÁO (REPORT)
// =====================================
const ReportButton = ({ video, userId, showNotification }: { video: any, userId: string, showNotification: Function }) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReported, setIsReported] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return showNotification("Vui lòng đăng nhập để báo cáo video!", "error");
    if (!reason.trim()) return showNotification("Vui lòng chọn hoặc nhập lý do!", "error");
    
    setIsSubmitting(true);
    const res = await reportVideoAction({
       videoId: video.videoId,
       title: video.title,
       channelName: video.channelTitle || "Kênh ẩn danh",
       reason: reason,
       userId: userId
    });

    if (res.success) {
       setIsReported(true);
       setShowModal(false);
       showNotification("Cảm ơn bạn! Báo cáo đã được gửi đến Ban Quản Trị xem xét.", "success", "GỬI THÀNH CÔNG");
    } else {
       showNotification("Có lỗi xảy ra khi gửi báo cáo: " + res.error, "error");
    }
    setIsSubmitting(false);
  };

  if (isReported) {
     return (
       <button disabled title="Đã báo cáo" className="p-3 flex-shrink-0 rounded-full transition-all border flex items-center justify-center bg-orange-50 border-orange-200 text-orange-500 opacity-70">
         <Flag className="w-6 h-6 fill-current" />
       </button>
     );
  }

  const predefinedReasons = [
    "Chứa nội dung giải trí, chơi game", 
    "Sai kiến thức, thông tin lệch lạc", 
    "Nội dung phản cảm, độc hại"
  ];

  return (
    <>
      <button onClick={() => setShowModal(true)} title="Báo cáo nội dung rác/vi phạm" className="p-3 flex-shrink-0 rounded-full transition-all border flex items-center justify-center bg-white hover:bg-orange-50 border-slate-200 hover:border-orange-200 dark:bg-[#1e1e24] dark:border-slate-700/50 dark:hover:bg-orange-900/20 text-slate-500 hover:text-orange-500">
        <Flag className="w-6 h-6 transition-all duration-300" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1d21] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Báo cáo Video này
            </h3>
            <p className="text-sm text-slate-500 mb-4">Giúp cộng đồng loại bỏ các video giải trí rác hoặc sai lệch kiến thức khỏi hệ thống.</p>

            <div className="flex flex-col gap-2 mb-4">
              {predefinedReasons.map(r => (
                 <button 
                   key={r} 
                   onClick={() => setReason(r)} 
                   className={`text-left p-3 rounded-lg border text-sm font-medium transition-all ${reason === r ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300'}`}
                 >
                   {r}
                 </button>
              ))}
              <textarea 
                placeholder="Hoặc nhập chi tiết lý do khác..." 
                value={!predefinedReasons.includes(reason) ? reason : ""} 
                onChange={(e) => setReason(e.target.value)} 
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm outline-none focus:border-orange-500 mt-2" 
                rows={3}
              ></textarea>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Hủy</button>
              <button onClick={handleSubmit} disabled={isSubmitting || !reason} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Gửi Báo Cáo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =====================================
// TRANG HIỂN THỊ CHÍNH
// =====================================
export default function StudyRoomPage() {
  const router = useRouter();
  const params = useParams();
  
  const searchParams = useSearchParams();
  const startTime = searchParams.get('t') || 0;

  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  
  const isProUser = (session?.user as any)?.isPro || false;
  
  const [video, setVideo] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [quizzes, setQuizzes] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionCount, setQuestionCount] = useState(5); 
  const [userAnswers, setUserAnswers] = useState<any>({}); 
  const [showAiError, setShowAiError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [rewardData, setRewardData] = useState<{xp: number, coins: number} | null>(null);

  // 🚨 TRẠNG THÁI KHÓA VIDEO CẤM
  const [isBanned, setIsBanned] = useState(false);
  const [bannedReason, setBannedReason] = useState("");

  // 🚨 HỆ THỐNG THÔNG BÁO TÙY CHỈNH MỚI
  const [notification, setNotification] = useState<{title?: string, msg: string, type: 'success' | 'error'} | null>(null);
  const showNotification = (msg: string, type: 'success' | 'error' = 'success', title?: string) => {
      setNotification({ title, msg, type });
      setTimeout(() => setNotification(null), 4500);
  };

  const calculateEnergyCost = (count: number) => {
    let cost = count;
    if (isProUser) {
        cost = Math.ceil(cost * 0.7);
        if (cost < 1) cost = 1;
    }
    return cost;
  };
  const currentEnergyCost = calculateEnergyCost(questionCount);

  const [isPlaying, setIsPlaying] = useState(false);
  const accumulatedSeconds = useRef(0);
  const syncInterval = 60; 
  const totalWatchedSeconds = useRef(0);
  const hasMarkedCompleted = useRef(false);

  useEffect(() => {
    totalWatchedSeconds.current = 0;
    hasMarkedCompleted.current = false;
  }, [video?.videoId]);

  // 🚨 CHU KỲ KIỂM TRA VIDEO CẤM TỪ ADMIN
  useEffect(() => {
    if (!video?.videoId) return;
    setIsBanned(false);

    checkEducationalVideoAction("", "", video.videoId).then(res => {
      if (res.success && res.isEducational === false && res.reason?.includes("Quản trị viên")) {
         setIsBanned(true);
         setBannedReason(res.reason || "Video này đã bị Quản trị viên khóa do vi phạm nội quy học tập.");
      }
    }).catch(() => {});
  }, [video?.videoId]);

  useEffect(() => {
    // Nếu video bị cấm thì chặn không cho init YouTube Player
    if (!video?.videoId || isBanned) return;

    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        new (window as any).YT.Player('yt-player', {
          events: {
            'onReady': (event: any) => {
              if (Number(startTime) > 0) {
                event.target.seekTo(Number(startTime), true);
              }
            },
            'onStateChange': (event: any) => {
              if (event.data === 1) setIsPlaying(true);
              else setIsPlaying(false); 
            }
          }
        });
      }
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      setTimeout(initPlayer, 500); 
    }

    return () => { setIsPlaying(false); };
  }, [video?.videoId, isBanned]); 

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPlaying && userId && video?.videoId && !isBanned) {
      timer = setInterval(() => {
        accumulatedSeconds.current += 1;
        totalWatchedSeconds.current += 1; 

        const player = (window as any).YT?.get('yt-player');
        const currentTime = player && typeof player.getCurrentTime === 'function' ? Math.floor(player.getCurrentTime()) : 0;
        const duration = player && typeof player.getDuration === 'function' ? Math.floor(player.getDuration()) : 0;

        if (accumulatedSeconds.current >= syncInterval) {
          syncStudyTimeAction(
             userId, 
             accumulatedSeconds.current, 
             video.videoId, 
             currentTime,
             {
                 title: video.title || "Video Bài Giảng",
                 channelName: video.channelTitle || "Kênh Ẩn Danh",
                 thumbnail: video.thumbnailUrl || "",
                 duration: duration
             }
          );
          accumulatedSeconds.current = 0;
          updateTaskProgressAction(userId, "WATCH_MINUTE", 1);
        }

        if (totalWatchedSeconds.current >= 60 && !hasMarkedCompleted.current) {
          hasMarkedCompleted.current = true;
          
          markVideoCompletedAction(userId, video.videoId).then((res : any)=> {
             if (res?.success && (res.xpDelta || res.coinsDelta)) {
                 window.dispatchEvent(new CustomEvent('updateUserStats', { 
                     detail: { xpDelta: res.xpDelta || 0, coinsDelta: res.coinsDelta || 0 } 
                 }));
             }
             updateTaskProgressAction(userId, "WATCH_COUNT", 1);
          }).catch((e : any)=> console.log("Lưu tiến độ video:", e));
        }

      }, 1000);
    }

    return () => { if (timer) clearInterval(timer); };
  }, [isPlaying, userId, video, isBanned]);

  useEffect(() => {
    return () => {
      if (accumulatedSeconds.current > 0 && userId && video?.videoId && !isBanned) {
        const player = (window as any).YT?.get('yt-player');
        const currentTime = player && typeof player.getCurrentTime === 'function' ? Math.floor(player.getCurrentTime()) : 0;
        const duration = player && typeof player.getDuration === 'function' ? Math.floor(player.getDuration()) : 0;

        syncStudyTimeAction(
          userId, 
          accumulatedSeconds.current,
          video.videoId,
          currentTime,
          {
             title: video.title || "Video Bài Giảng",
             channelName: video.channelTitle || "Kênh Ẩn Danh",
             thumbnail: video.thumbnailUrl || "",
             duration: duration
          }
        );
      }
    };
  }, [userId, video, isBanned]); 

  useEffect(() => {
    const savedState = sessionStorage.getItem('routeState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.video?.videoId === params.videoId) {
         setVideo(parsed.video);
         return; 
      }
    }
    if (params.videoId) setVideo({ videoId: params.videoId, title: "Đang tải video...", channelTitle: "Video Bài Giảng" });
  }, [params.videoId]);

  useEffect(() => {
    if (!video?.videoId) return;
    setIsLoadingRelated(true);
    getRelatedVideosAction(video.videoId).then(res => {
      if (res.success && Array.isArray(res.data)) setRelatedVideos(res.data.filter((v: any) => v.videoId !== video.videoId));
      setIsLoadingRelated(false);
    });
  }, [video]);

  const handleGenerateQuiz = async () => {
    if (!video?.videoId) return;
    if (!userId) return showNotification("Vui lòng đăng nhập để sử dụng AI!", "error");

    setIsGenerating(true); setUserAnswers({}); setHasSubmitted(false); setShowAiError(false);
    try {
      const res = await generateQuizFromVideoAction(userId, video.videoId, questionCount);
      if (res.success && res.data) {
        setQuizzes(Array.isArray(res.data) ? res.data : res.data.questions);
        window.dispatchEvent(new CustomEvent('updateUserStats', { detail: { energyCost: currentEnergyCost } }));
        updateTaskProgressAction(userId, "SPEND_ENERGY", currentEnergyCost);
      }
      else {
        setShowAiError(true);
        if (res.error) showNotification(res.error, "error");
      }
    } catch (err) { setShowAiError(true); }
    setIsGenerating(false);
  };

  const handleSubmitQuiz = async () => {
    if (!userId) return showNotification("Vui lòng đăng nhập để lưu bài!", "error");
    let score = 0;
    quizzes.forEach((q: any, i: number) => { if (userAnswers[i] === q.correctAnswer) score++; });
    setHasSubmitted(true); setIsSubmitting(true);
    
    try {
      const res = await saveQuizAttemptAction({
        userId: userId, videoId: video.videoId, videoTitle: video.title,
        channelName: video.channelTitle, score, correctCount: score, totalQuizzes: quizzes.length, questionsData: quizzes
      });
      
      if (res.success) {
        const earnedXP = res.earnedXP || 0;
        const earnedCoins = res.earnedCoins || 0;

        if (earnedXP > 0 || earnedCoins > 0) {
           setRewardData({ xp: earnedXP, coins: earnedCoins });
           window.dispatchEvent(new CustomEvent('updateUserStats', { detail: { xpDelta: earnedXP, coinsDelta: earnedCoins } }));
        }

        updateTaskProgressAction(userId, "QUIZ_ATTEMPT", quizzes.length);
        if (score > 0) {
            updateTaskProgressAction(userId, "QUIZ_CORRECT", score);
        }

        window.dispatchEvent(new Event('quizCompleted'));
      } else {
        showNotification("Lỗi Database khi lưu bài", "error");
      }
    } catch (err) { console.error(err); }
    setIsSubmitting(false);
  };

  if (!video) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full relative">
      
      {/* KHỐI UI RENDER THÔNG BÁO TÙY CHỈNH NẰM Ở ĐÂY */}
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-5 max-w-[90%] md:max-w-md w-full ${notification.type === 'error' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-blue-500 text-blue-600 dark:text-blue-400'}`}>
          {notification.type === 'error' ? <AlertTriangle size={24} className="text-red-500 shrink-0 mt-0.5" /> : <CheckCircle size={24} className="text-blue-500 shrink-0 mt-0.5" />}
          <div className="flex flex-col min-w-0">
            {notification.title && <span className="font-black text-[15px] uppercase mb-1 leading-tight">{notification.title}</span>}
            <span className="font-medium text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed">{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"><X size={16} /></button>
        </div>
      )}

      {/* 🚨 MODAL KHÓA TOÀN MÀN HÌNH NẾU VIDEO BỊ ADMIN CẤM TRUY CẬP */}
      {isBanned && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1a1d21] rounded-3xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl border border-red-500 text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <Ban className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide mb-2">Truy cập bị từ chối</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {bannedReason}
            </p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all text-sm uppercase tracking-wider"
            >
              Đồng ý (Quay về Trang chủ)
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={async () => {
          if (userId && video?.videoId && !isBanned) {
            const player = (window as any).YT?.get('yt-player');
            const currentTime = player && typeof player.getCurrentTime === 'function' ? Math.floor(player.getCurrentTime()) : 0;
            const duration = player && typeof player.getDuration === 'function' ? Math.floor(player.getDuration()) : 0;
            const secsToSend = accumulatedSeconds.current > 0 ? accumulatedSeconds.current : 1; 

            await syncStudyTimeAction(userId, secsToSend, video.videoId, currentTime, {
                title: video.title || "Video Bài Giảng",
                channelName: video.channelTitle || "Kênh Ẩn Danh",
                thumbnail: video.thumbnailUrl || "",
                duration: duration
            });
          }
          router.back(); 
        }} 
        className="flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>

      <div className="flex flex-col xl:flex-row gap-6 pb-10">
        <div className="w-full xl:w-3/4 space-y-6">
          <div className="bg-white/50 dark:bg-[#121212] rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800/50">
            
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
              {!isBanned && (
                <iframe 
                  id="yt-player"
                  key={video.videoId} 
                  className="w-full h-full" 
                  src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&enablejsapi=1`} 
                  allow="autoplay; fullscreen"
                ></iframe>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 flex gap-3 sm:gap-4 items-center">
                <LikeButton video={video} showNotification={showNotification} />
                <ReportButton video={video} userId={userId} showNotification={showNotification} />
                <button 
                  onClick={() => setIsShareModalOpen(true)} 
                  title="Chia sẻ video" 
                  className="p-3 flex-shrink-0 rounded-full transition-all border flex items-center justify-center bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-200 dark:bg-[#1e1e24] dark:border-slate-700/50 dark:hover:bg-blue-900/20 text-slate-500 hover:text-blue-500"
                >
                  <Share2 className="w-6 h-6 transition-all duration-300" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 line-clamp-2" dangerouslySetInnerHTML={{ __html: video.title }}></h2>
                  <p className="text-sm text-slate-500 mt-1 truncate">{video.channelTitle}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#1a1a21] p-2 rounded-xl border shrink-0">
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  disabled={isBanned}
                  value={questionCount} 
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))} 
                  className="w-16 bg-white dark:bg-slate-800 text-center rounded-lg py-2 font-bold border outline-none h-full text-slate-900 dark:text-white disabled:opacity-50" 
                />
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || isBanned}
                  className="px-5 py-2.5 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 h-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <div className="flex flex-col items-start leading-none text-left">
                        <span className="text-sm">Tạo bài tập AI</span>
                        <span className="text-[10px] opacity-90 mt-1 flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current" /> 
                          Tốn {isProUser && questionCount > currentEnergyCost ? (
                            <>
                               <span className="line-through opacity-60 decoration-white/60">{questionCount}</span> 
                               <span className="text-yellow-300 font-black">{currentEnergyCost}</span>
                            </>
                          ) : (
                            <span>{currentEnergyCost}</span>
                          )} năng lượng
                        </span>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
            {showAiError && <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> AI đang bị quá tải hoặc cấu trúc trả về bị lỗi. Xin vui lòng thử lại!</p>}
          </div>
          
          {quizzes && (
            <div className="bg-white/50 dark:bg-[#121212] rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-6 border-b pb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <Zap className="w-6 h-6 text-yellow-500" /> Bài Tập AI Sinh Ra ({quizzes.length} câu)
              </h3>
              
              <div className="space-y-6">
                {quizzes.map((q: any, index: number) => {
                  const isUserCorrect = userAnswers[index] === q.correctAnswer;
                  return (
                    <div key={index} className="p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a21]">
                      <p className="font-bold text-base md:text-lg mb-4 text-slate-800 dark:text-slate-200">
                        Câu {index + 1}: {q.questionText}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {['A', 'B', 'C', 'D'].map(opt => {
                          const isSelected = userAnswers[index] === opt;
                          const isCorrectOpt = q.correctAnswer === opt;
                          let btnStyle = "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:bg-[#23232b] dark:border-slate-700/50 dark:hover:bg-[#2a2a35]";
                          
                          if (hasSubmitted) {
                            if (isCorrectOpt) btnStyle = "bg-green-100 dark:bg-green-500/20 border-green-500 text-green-800 dark:text-green-400 font-bold";
                            else if (isSelected && !isCorrectOpt) btnStyle = "bg-red-100 dark:bg-red-500/20 border-red-500 text-red-800 dark:text-red-400 font-bold";
                            else btnStyle = "opacity-50 bg-slate-50 dark:bg-[#23232b] border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-500"; 
                          } else if (isSelected) btnStyle = "bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-800 dark:text-blue-400 font-bold shadow-sm";

                          return (
                            <button key={opt} onClick={() => !hasSubmitted && setUserAnswers({ ...userAnswers, [index]: opt })} disabled={hasSubmitted} className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${btnStyle}`}>
                              <span><span className="font-bold mr-1 opacity-80">{opt}.</span> {q[`option${opt}`]}</span>
                              {hasSubmitted && isCorrectOpt && <CheckCircle className="w-5 h-5 shrink-0" />}
                              {hasSubmitted && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      
                      {hasSubmitted && (
                        <div className={`mt-5 p-4 rounded-xl text-sm border ${isUserCorrect ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'}`}>
                          <p className="font-bold mb-2 flex items-center gap-2">{isUserCorrect ? <><CheckCircle className="w-4 h-4"/> Chính xác!</> : <><XCircle className="w-4 h-4"/> Sai rồi!</>}</p>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed"><span className="font-bold opacity-80">Giải thích:</span> {q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!hasSubmitted && Object.keys(userAnswers).length > 0 && (
                  <div className="mt-8 flex justify-end border-t pt-6">
                     <button onClick={handleSubmitQuiz} disabled={isSubmitting} className="px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5"/>} {isSubmitting ? 'Đang chấm...' : 'Nộp bài & Chấm điểm'}
                     </button>
                  </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full xl:w-[400px] shrink-0">
          <div className="bg-white/50 dark:bg-[#121212] rounded-2xl shadow-sm border dark:border-slate-800 sticky top-6 flex flex-col max-h-[calc(100vh-120px)]">
            <div className="p-5 border-b dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                Video Đề Xuất
            </div>
            
            <div className="p-4 space-y-3 overflow-y-auto">
              {isLoadingRelated ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              : relatedVideos.map((vid, i) => (
                  <div key={i} onClick={() => { sessionStorage.setItem('routeState', JSON.stringify({ video: vid })); router.push(`/watch/${vid.videoId}`); }} className="flex gap-3 cursor-pointer group p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#23232b]">
                      <div className="w-[140px] aspect-video rounded-lg overflow-hidden shrink-0"><img src={vid.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                      
                      <div className="flex flex-col">
                          <h4 className="text-xs font-semibold line-clamp-2 text-slate-900 dark:text-slate-100" dangerouslySetInnerHTML={{ __html: vid.title }}></h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{vid.channelTitle}</span>
                      </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {rewardData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1d21] rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center animate-in zoom-in-95 bounce border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
              <Award className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Tuyệt Vời!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-6">Bạn đã hoàn thành xuất sắc và nhận được phần thưởng:</p>
            
            <div className="flex w-full gap-4 mb-8">
              <div className="flex-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 flex flex-col items-center">
                <Sparkles className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">+{rewardData.xp}</span>
                <span className="text-xs font-bold text-blue-500/70">EXP</span>
              </div>
              <div className="flex-1 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-2xl p-4 flex flex-col items-center">
                <Coins className="w-6 h-6 text-yellow-500 mb-2" />
                <span className="text-2xl font-black text-yellow-600 dark:text-yellow-500">+{rewardData.coins}</span>
                <span className="text-xs font-bold text-yellow-500/70">XU</span>
              </div>
            </div>

            <button onClick={() => setRewardData(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">
              Tiếp Tục Học
            </button>
          </div>
        </div>
      )}
      {video && (
        <ShareVideoModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          videoId={video.videoId} 
          videoTitle={video.title}
          thumbnailUrl={video.thumbnailUrl}
        />
      )}

    </div>
  );
}