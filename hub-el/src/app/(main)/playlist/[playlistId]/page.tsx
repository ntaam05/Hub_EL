"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, PlayCircle, Loader2, ListVideo, AlertTriangle, 
  Play, CheckCircle, XCircle, Zap, Heart, Library, Lock, 
  Unlock, Sparkles, CheckCircle2, Award, Coins, Flag, X , Ban, Share2
} from 'lucide-react';

// SERVER ACTIONS
import { toggleFavoriteVideoAction, toggleFavoritePlaylistAction } from '@/actions/user/favorites';
import ShareVideoModal from '@/components/modals/ShareVideoModal';
import { AdaptiveVideoQuiz } from '@/components/quiz/AdaptiveVideoQuiz';
import { getPlaylistItemsAction, checkEducationalVideoAction } from '@/actions/video/video'; 
import { generateQuizFromVideoAction } from '@/actions/quiz/ai';
import { saveQuizAttemptAction } from '@/actions/quiz/attempt';
import { getPlaylistProgressAction, markVideoCompletedAction } from '@/actions/user/learning'; 
import { syncStudyTimeAction } from '@/actions/stats'; 
import { updateTaskProgressAction } from '@/actions/quests/progress';
import { reportVideoAction } from '@/actions/video/report';
import { checkFavoriteAction, addFavoriteAction, removeFavoriteAction } from '@/actions/video/favorite';

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
      checkFavoriteAction(userId, video.videoId).then((res: any) => {
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
      <Heart className={`w-6 h-6 transition-all duration-300 ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-500'}`} />
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
            <p className="text-sm text-slate-500 mb-4">Giúp cộng đồng loại bỏ các video giải trí rác khỏi hệ thống.</p>

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
export default function PlaylistPage() {
  const params = useParams();
  const playlistId = params.playlistId as string;
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const startTime = searchParams.get('t') || 0;

  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  
  const isProUser = (session?.user as any)?.isPro || false;
  
  const [progress, setProgress] = useState<any>(null);
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quizzes, setQuizzes] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionCount, setQuestionCount] = useState(5); 
  const [userAnswers, setUserAnswers] = useState<any>({}); 
  const [showAiError, setShowAiError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const [isVidFav, setIsVidFav] = useState(false);
  const [isPlayFav, setIsPlayFav] = useState(false);
  const [loadingFavVid, setLoadingFavVid] = useState(false);
  const [loadingFavPlay, setLoadingFavPlay] = useState(false);

  const [rewardData, setRewardData] = useState<{xp: number, coins: number} | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 🚨 CHỐT CHẶN BẢO MẬT: STATE ĐỂ KHÓA VIDEO CẤM
  const [isBanned, setIsBanned] = useState(false);
  const [bannedReason, setBannedReason] = useState("");

  // 🚨 TOAST NOTIFICATION TÙY CHỈNH
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
  }, [currentVideo?.videoId]);

  // 🚨 CHU KỲ KIỂM TRA VIDEO CẤM
  useEffect(() => {
    if (!currentVideo?.videoId) return;
    setIsBanned(false);

    // Sử dụng action có sẵn để quét trạng thái từ database độc lập với cache favorites
    checkEducationalVideoAction("", "", currentVideo.videoId).then(res => {
      if (res.success && res.isEducational === false && res.reason?.includes("Quản trị viên")) {
         setIsBanned(true);
         setBannedReason(res.reason || "Video này đã bị Quản trị viên khóa do vi phạm nội quy học tập.");
      }
    }).catch(() => {});
  }, [currentVideo?.videoId]);

  useEffect(() => {
    if (!currentVideo?.videoId || isBanned) return;

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
  }, [currentVideo?.videoId, isBanned]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPlaying && userId && currentVideo?.videoId && !isBanned) {
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
            currentVideo.videoId,
            currentTime,
            {
               title: currentVideo.title || "Video Bài Giảng",
               channelName: currentVideo.channelTitle || "Kênh Ẩn Danh",
               thumbnail: currentVideo.thumbnailUrl || "",
               duration: duration
            }
          );
          accumulatedSeconds.current = 0;
          updateTaskProgressAction(userId, "WATCH_MINUTE", 1);
        }

        if (totalWatchedSeconds.current >= 60 && !hasMarkedCompleted.current) {
          hasMarkedCompleted.current = true;
          
          markVideoCompletedAction(userId, currentVideo.videoId).then((res: any) => {
             if (res?.success && (res.xpDelta || res.coinsDelta)) {
                 window.dispatchEvent(new CustomEvent('updateUserStats', { 
                     detail: { xpDelta: res.xpDelta || 0, coinsDelta: res.coinsDelta || 0 } 
                 }));
                 updateTaskProgressAction(userId, "WATCH_COUNT", 1);
             }
          }).catch((e: any) => console.log("Lưu tiến độ video:", e));
        }

      }, 1000);
    }

    return () => { if (timer) clearInterval(timer); };
  }, [isPlaying, userId, currentVideo, isBanned]);

  useEffect(() => {
    return () => {
      if (accumulatedSeconds.current > 0 && userId && currentVideo?.videoId && !isBanned) {
        const player = (window as any).YT?.get('yt-player');
        const currentTime = player && typeof player.getCurrentTime === 'function' ? Math.floor(player.getCurrentTime()) : 0;
        const duration = player && typeof player.getDuration === 'function' ? Math.floor(player.getDuration()) : 0;

        syncStudyTimeAction(
          userId, 
          accumulatedSeconds.current,
          currentVideo.videoId,
          currentTime,
          {
             title: currentVideo.title || "Video Bài Giảng",
             channelName: currentVideo.channelTitle || "Kênh Ẩn Danh",
             thumbnail: currentVideo.thumbnailUrl || "",
             duration: duration
          }
        );
      }
    };
  }, [userId, currentVideo, isBanned]);

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true); setError(null);
      try {
        const res = await getPlaylistItemsAction(playlistId);
        if (!res.success) throw new Error("Không thể tải danh sách phát");
        
        const data = res.data as any;
        if (data.items && data.items.length > 0) {
          setPlaylistItems(data.items);
          setCurrentVideo(data.items[0]); 
        } else {
          setError("Danh sách phát này không có video nào.");
        }
      } catch (err: any) { setError(err.message); } 
      finally { setLoading(false); }
    };
    if (playlistId) fetchPlaylist();
  }, [playlistId]);

  const fetchProgress = async () => {
    if (session?.user?.id && playlistId) {
      const res = await getPlaylistProgressAction(session.user.id, playlistId);
      if (res.success) setProgress(res.data);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [session, playlistId]);

  useEffect(() => {
    setQuizzes(null); 
    setUserAnswers({}); 
    setHasSubmitted(false); 
    setShowAiError(false);
  }, [currentVideo]);

  const handleGenerateQuiz = async () => {
    if (!currentVideo) return;
    if (!session?.user?.id) return showNotification("Vui lòng đăng nhập để sử dụng AI!", "error");
    
    setIsGenerating(true); setUserAnswers({}); setHasSubmitted(false); setShowAiError(false);
    try {
      const res = await generateQuizFromVideoAction(session.user.id as string, currentVideo.videoId, questionCount, true);
      if (res.success && res.data) {
          const data = res.data;
          const finalQuizzes = Array.isArray(data) ? data : (data.questions || []);
          setQuizzes(finalQuizzes);
          window.dispatchEvent(new CustomEvent('updateUserStats', { detail: { energyCost: currentEnergyCost } }));
      } else {
          setShowAiError(true);
          if (res.error) showNotification(res.error, "error");
      }
    } catch (err) { setShowAiError(true); }
    setIsGenerating(false);
  };

  const handleSubmitQuiz = async () => {
    if (!quizzes) return;
    let score = 0;
    quizzes.forEach((q: any, index: number) => { if (userAnswers[index] === q.correctAnswer) score++; });
    setHasSubmitted(true);
    
    if (!session?.user?.id) return showNotification("Vui lòng đăng nhập để lưu kết quả!", "error");

    setIsSubmitting(true);
    try {
        const res = await saveQuizAttemptAction({
            userId: session.user.id as string,
            videoId: currentVideo.videoId, 
            videoTitle: currentVideo.title, 
            channelName: currentVideo.channelTitle,
            score: score,
            correctCount: score,
            totalQuizzes: quizzes.length,
            questionsData: quizzes
        });

        if (res.success) {
            const earnedXP = res.earnedXP || 0;
            const earnedCoins = res.earnedCoins || 0;

            if (earnedXP > 0 || earnedCoins > 0) {
               setRewardData({ xp: earnedXP, coins: earnedCoins });
               window.dispatchEvent(new CustomEvent('updateUserStats', { detail: { xpDelta: earnedXP, coinsDelta: earnedCoins } }));
            }
            updateTaskProgressAction(session.user.id as string, "QUIZ_ATTEMPT", quizzes.length);
            window.dispatchEvent(new Event('quizCompleted'));
            if (score > 0) {
                updateTaskProgressAction(session.user.id as string, "QUIZ_CORRECT", score);
            }
            await fetchProgress(); 
        } else {
            showNotification("Lỗi đồng bộ dữ liệu điểm số", "error");
        }
    } catch (err) { console.error(err); }
    setIsSubmitting(false);
  };

  const handleToggleVideoFav = async () => {
    if (!currentVideo || !session?.user?.id) return showNotification("Vui lòng đăng nhập!", "error");
    setLoadingFavVid(true);
    
    const res = await toggleFavoriteVideoAction({
      userId: session.user.id as string,
      videoId: currentVideo.videoId,
      title: currentVideo.title,
      channelTitle: currentVideo.channelTitle,
      thumbnailUrl: currentVideo.thumbnailUrl
    });
    
    if (res.success) setIsVidFav(res.isFavorited ?? false);
    if (res.isFavorited) {
      updateTaskProgressAction(session.user.id as string, "COURSE_ADD", 1);
    }
    setLoadingFavVid(false); 
  };
    
  const handleTogglePlaylistFav = async () => {
    if (!playlistId || !session?.user?.id) return showNotification("Vui lòng đăng nhập!", "error");
    
    setLoadingFavPlay(true);
    const videoIdsString = playlistItems.map((v: any) => v.videoId || v.id).join(",");
    
    const res = await toggleFavoritePlaylistAction({
      userId: session.user.id as string,
      playlistId: playlistId as string,
      title: playlistItems[0]?.title || "Khóa học Playlist",
      thumbnailUrl: playlistItems[0]?.thumbnailUrl,
      totalVideos: playlistItems.length,
      videoIds: videoIdsString 
    });
    
    if (res.success) setIsPlayFav(res.isFavorited ?? false);
    setLoadingFavPlay(false);
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-center mt-20"><AlertTriangle className="w-16 h-16 text-red-500 mx-auto" /><h2 className="text-2xl font-bold mt-4">Lỗi</h2><p>{error}</p></div>;

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 relative h-full">
      
      {/* THÔNG BÁO TOAST POPUP */}
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
          if (userId && currentVideo?.videoId && !isBanned) {
            const player = (window as any).YT?.get('yt-player');
            const currentTime = player && typeof player.getCurrentTime === 'function' ? Math.floor(player.getCurrentTime()) : 0;
            const duration = player && typeof player.getDuration === 'function' ? Math.floor(player.getDuration()) : 0;
            const secsToSend = accumulatedSeconds.current > 0 ? accumulatedSeconds.current : 1; 

            await syncStudyTimeAction(userId, secsToSend, currentVideo.videoId, currentTime, {
                title: currentVideo.title || "Video Bài Giảng",
                channelName: currentVideo.channelTitle || "Kênh Ẩn Danh",
                thumbnail: currentVideo.thumbnailUrl || "",
                duration: duration
            });
          }
          router.back(); 
        }} 
        className="flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>

      <div className="flex flex-col lg:flex-row gap-6 items-start pb-10">
        <div className="w-full lg:w-[65%] xl:w-[70%] space-y-6">
          {currentVideo && (
            <>
              <div className="bg-white/50 dark:bg-[#121212] rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800/50">
                <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video shadow-lg mb-6">
                  {!isBanned && (
                    <iframe 
                      id="yt-player"
                      key={currentVideo.videoId}
                      className="absolute top-0 left-0 w-full h-full" 
                      src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&enablejsapi=1`} 
                      allow="autoplay; fullscreen"
                    ></iframe>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight" dangerouslySetInnerHTML={{ __html: currentVideo.title }}></h1>
                <p className="text-sm text-slate-500 mt-2">{currentVideo.channelTitle}</p>
                <div className="flex flex-wrap gap-3 mt-4 items-center">
                  <button onClick={handleToggleVideoFav} disabled={loadingFavVid || isBanned} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${isVidFav ? 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-500/10 dark:border-pink-500/30' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#1a1a21] dark:text-slate-300 dark:border-slate-800'}`}>
                      {loadingFavVid ? <Loader2 className="w-4 h-4 animate-spin"/> : <Heart className={`w-4 h-4 ${isVidFav ? 'fill-pink-500 text-pink-500' : ''}`} />}
                      {isVidFav ? 'Đã thích Video' : 'Lưu Video'}
                  </button>

                  <button onClick={handleTogglePlaylistFav} disabled={loadingFavPlay || isBanned} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${isPlayFav ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#1a1a21] dark:text-slate-300 dark:border-slate-800'}`}>
                      {loadingFavPlay ? <Loader2 className="w-4 h-4 animate-spin"/> : <Library className={`w-4 h-4 ${isPlayFav ? 'fill-blue-500 text-blue-500' : ''}`} />}
                      {isPlayFav ? 'Đã lưu Khóa học' : 'Lưu Playlist'}
                  </button>

                  <ReportButton video={currentVideo} userId={userId} showNotification={showNotification} />
                  <button 
                    onClick={() => setIsShareModalOpen(true)} 
                    title="Chia sẻ video" 
                    className="p-2.5 md:p-3 flex-shrink-0 rounded-xl transition-all border flex items-center justify-center bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-200 dark:bg-[#1a1a21] dark:border-slate-800 dark:hover:bg-blue-900/20 text-slate-500 hover:text-blue-500"
                  >
                    <Share2 className="w-5 h-5 transition-all duration-300" />
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 bg-slate-50 dark:bg-[#1a1a21] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center w-full md:w-auto gap-3">
                       <input 
                          type="number" 
                          min="1" 
                          max="20" 
                          disabled={isBanned}
                          value={questionCount} 
                          onChange={(e) => setQuestionCount(parseInt(e.target.value))} 
                          className="w-16 h-full min-h-[44px] bg-white dark:bg-slate-800 text-center rounded-lg font-bold outline-none border border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white disabled:opacity-50" 
                        />
                    </div>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isGenerating || isBanned}
                      className="w-full md:w-auto px-5 py-2.5 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 h-full"
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

                {showAiError && (
                  <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5"/> AI đang bị quá tải hoặc cấu trúc trả về bị lỗi. Xin vui lòng thử lại!
                  </p>
                )}
              </div>

              {progress && (
                <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 relative z-10">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={`p-4 rounded-2xl shrink-0 ${progress.isUnlocked ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800/50'}`}>
                        {progress.isUnlocked ? <Unlock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          Bài tập tổng hợp (Cuối khóa)
                          {progress.summaryScore > 0 && <CheckCircle2 className="w-5 h-5 text-green-500"/>}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                          {progress.isUnlocked 
                            ? "Tuyệt vời! Bạn đã đủ điều kiện làm bài thi để lấy 50% số điểm còn lại."
                            : `Hãy đạt điểm tối đa ở các quiz lẻ để mở khóa (Hiện tại: ${progress.currentVideoScore} / ${progress.potentialMaxVideoScore} điểm)`
                          }
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!progress.isUnlocked || isBanned}
                      onClick={() => router.push(`/quizzes/review?topic=${playlistId}`)}
                      className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 ${
                        progress.isUnlocked && !isBanned
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:-translate-y-1 hover:shadow-blue-500/40' 
                          : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200 dark:bg-slate-800/30 dark:border-slate-800'
                      }`}
                    >
                      {progress.isUnlocked && <Sparkles className="w-5 h-5 text-yellow-300" />}
                      {progress.summaryScore > 0 ? 'Làm lại bài thi' : 'Bắt đầu thi'}
                    </button>
                  </div>
                  
                  {!progress.isUnlocked && progress.potentialMaxVideoScore > 0 && (
                    <div className="absolute bottom-0 left-0 h-1.5 bg-blue-500 transition-all duration-1000" 
                         style={{ width: `${(progress.currentVideoScore / progress.potentialMaxVideoScore) * 100}%` }}></div>
                  )}
                </div>
              )}

              {quizzes && Array.isArray(quizzes) && quizzes.length > 0 && session?.user?.id && (
                <AdaptiveVideoQuiz
                  videoId={currentVideo.videoId}
                  userId={session.user.id as string}
                  totalCount={questionCount}
                  questions={quizzes}
                  onQuestionsChange={setQuizzes}
                  userAnswers={userAnswers}
                  onUserAnswersChange={setUserAnswers}
                  hasSubmitted={hasSubmitted}
                  isSubmitting={isSubmitting}
                  onSubmitQuiz={handleSubmitQuiz}
                  onError={(msg) => showNotification(msg, "error")}
                />
              )}
            </>
          )}
        </div>

        <div className="w-full lg:w-[35%] xl:w-[30%] shrink-0">
            <div className="flex flex-col h-[600px] lg:h-[calc(100vh-120px)] sticky top-6 bg-slate-50 dark:bg-[#16181c] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-white dark:bg-[#1a1d21] border-b border-slate-200 dark:border-slate-800 z-10 shrink-0">
                  <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                    <ListVideo className="w-5 h-5 text-blue-500" /> Danh sách bài học
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{playlistItems.length} video trong khóa này</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {playlistItems.map((vid, index) => {
                  const isActive = currentVideo?.videoId === vid.videoId;
                  return (
                      <div key={vid.videoId} onClick={() => setCurrentVideo(vid)} className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all group ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30' : 'hover:bg-white dark:hover:bg-[#23232b] border border-transparent'}`}>
                          <div className="relative w-[120px] aspect-video rounded-lg overflow-hidden shrink-0">
                              <img src={vid.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                              <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">Bài {index + 1}</div>
                              {isActive ? (
                                <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                                  <Play className="w-6 h-6 text-white fill-current" />
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <PlayCircle className="w-6 h-6 text-white" />
                                </div>
                              )}
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <h4 className={`text-sm font-semibold line-clamp-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`} dangerouslySetInnerHTML={{ __html: vid.title }}></h4>
                          </div>
                      </div>
                  )})}
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
      {currentVideo && (
        <ShareVideoModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          videoId={currentVideo.videoId} 
          videoTitle={currentVideo.title}
          thumbnailUrl={currentVideo.thumbnailUrl}
        />
      )}

    </div>
  );
}