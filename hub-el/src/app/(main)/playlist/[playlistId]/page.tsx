"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  PlayCircle,
  Loader2,
  ListVideo,
  AlertTriangle,
  Play,
  CheckCircle,
  Heart,
  Library,
  Lock,
  Unlock,
  Sparkles,
  CheckCircle2,
  Award,
  Coins,
  Flag,
  X,
  Ban,
  Share2,
} from "lucide-react";

// SERVER ACTIONS
import {
  toggleFavoriteVideoAction,
  toggleFavoritePlaylistAction,
} from "@/actions/user/favorites";
import ShareVideoModal from "@/components/modals/ShareVideoModal";
import { AdaptiveVideoQuiz } from "@/components/quiz/AdaptiveVideoQuiz";
import BookmarkRibbonButton from "../../watch/[videoId]/BookmarkRibbonButton";
import { RollingActionButton } from "../../dashboard/LucianPrimitives";
import "../../dashboard/lucian-dashboard.css";
import {
  getPlaylistItemsAction,
  checkEducationalVideoAction,
} from "@/actions/video/video";
import { generateQuizFromVideoAction } from "@/actions/quiz/ai";
import { saveQuizAttemptAction } from "@/actions/quiz/attempt";
import {
  getPlaylistProgressAction,
  getVideoProgressAction,
  markVideoCompletedAction,
} from "@/actions/user/learning";
import { syncStudyTimeAction } from "@/actions/stats";
import { updateTaskProgressAction } from "@/actions/quests/progress";
import { reportVideoAction } from "@/actions/video/report";

const METEORS = [
  { top: "8%", left: "24%", len: "145px", dur: "4.8s", del: "0.2s" },
  { top: "22%", left: "66%", len: "175px", dur: "5.5s", del: "1.4s" },
  { top: "45%", left: "44%", len: "155px", dur: "5.1s", del: "0.8s" },
  { top: "68%", left: "80%", len: "135px", dur: "4.6s", del: "2.3s" },
];

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
       showNotification("Báo cáo đã được gửi đến Ban quản trị xem xét", "success", "Đã gửi báo cáo");
    } else {
       showNotification("Có lỗi xảy ra khi gửi báo cáo: " + res.error, "error");
    }
    setIsSubmitting(false);
  };

  if (isReported) {
     return (
       <button type="button" disabled title="Đã báo cáo" className="w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center bg-[var(--ux-warn)]/12 border-[var(--ux-warn)]/30 text-[var(--ux-warn)] opacity-75">
         <Flag className="w-[18px] h-[18px] fill-current" strokeWidth={1.75} />
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
      <button type="button" onClick={() => setShowModal(true)} title="Báo cáo nội dung vi phạm" className="w-10 h-10 shrink-0 rounded-xl transition-colors border flex items-center justify-center bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-2)] hover:text-[var(--ux-warn)] hover:border-[var(--ux-line-2)]">
        <Flag className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </button>

      {showModal && (
        <div className="ux fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-[var(--ux-surface)] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--ux-line-2)]">
            <h3 className="text-base font-semibold text-[var(--ux-ink)] mb-1.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--ux-warn)]" strokeWidth={1.75} /> Báo cáo video này
            </h3>
            <p className="text-xs text-[var(--ux-ink-2)] mb-4">Giúp cộng đồng loại bỏ các video giải trí rác khỏi hệ thống</p>

            <div className="flex flex-col gap-2 mb-4">
              {predefinedReasons.map(r => (
                 <button 
                   key={r} 
                   type="button"
                   onClick={() => setReason(r)} 
                   className={`text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${reason === r ? 'bg-[var(--ux-warn)]/12 border-[var(--ux-warn)]/40 text-[var(--ux-warn)]' : 'bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink)] hover:border-[var(--ux-line-2)]'}`}
                 >
                   {r}
                 </button>
              ))}
              <textarea 
                placeholder="Hoặc nhập chi tiết lý do khác" 
                value={!predefinedReasons.includes(reason) ? reason : ""} 
                onChange={(e) => setReason(e.target.value)} 
                className="w-full p-3 rounded-xl border border-[var(--ux-line)] bg-[var(--ux-surface-2)] text-[var(--ux-ink)] placeholder:text-[var(--ux-ink-3)] text-xs sm:text-sm outline-none focus:border-[var(--ux-accent)] mt-1" 
                rows={3}
              ></textarea>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[var(--ux-ink-2)] bg-[var(--ux-surface-2)] hover:bg-[var(--ux-surface-3)] border border-[var(--ux-line)] transition-colors">Hủy</button>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting || !reason} className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white bg-[var(--ux-warn)] hover:opacity-90 disabled:opacity-45 flex items-center justify-center gap-2 transition-opacity">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Gửi báo cáo"}
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
  const [watchProgress, setWatchProgress] = useState({
    watched: 0,
    duration: 0,
    completed: false,
  });

  useEffect(() => {
    const initialStart = Number(startTime) > 0 ? Number(startTime) : 0;
    totalWatchedSeconds.current = initialStart;
    hasMarkedCompleted.current = false;
    setWatchProgress({ watched: initialStart, duration: 0, completed: false });

    if (!currentVideo?.videoId || !userId) return;
    let active = true;
    getVideoProgressAction(userId, currentVideo.videoId)
      .then((res) => {
        if (!active || !res?.success) return;
        const restoredWatched = Math.max(res.lastWatched || 0, initialStart);
        totalWatchedSeconds.current = restoredWatched;
        hasMarkedCompleted.current = Boolean(res.isCompleted);
        setWatchProgress((prev) => ({
          watched: restoredWatched,
          duration: res.duration > 0 ? res.duration : prev.duration,
          completed: Boolean(res.isCompleted),
        }));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [currentVideo?.videoId, userId, startTime]);

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
              const playerDuration =
                typeof event.target.getDuration === 'function'
                  ? Math.floor(event.target.getDuration())
                  : 0;
              if (playerDuration > 0) {
                setWatchProgress((prev) => ({
                  ...prev,
                  duration: prev.duration > 0 ? prev.duration : playerDuration,
                }));
              }
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

        setWatchProgress({
          watched: totalWatchedSeconds.current,
          duration,
          completed: hasMarkedCompleted.current,
        });

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

        const requiredSeconds = duration > 0 ? Math.ceil(duration * 0.5) : 0;

        if (duration > 0 && totalWatchedSeconds.current >= requiredSeconds && !hasMarkedCompleted.current) {
          hasMarkedCompleted.current = true;
          setWatchProgress({
            watched: totalWatchedSeconds.current,
            duration,
            completed: true,
          });

          const syncBeforeComplete =
            accumulatedSeconds.current > 0
              ? syncStudyTimeAction(
                  userId,
                  accumulatedSeconds.current,
                  currentVideo.videoId,
                  currentTime,
                  {
                    title: currentVideo.title || "Video Bài Giảng",
                    channelName: currentVideo.channelTitle || "Kênh Ẩn Danh",
                    thumbnail: currentVideo.thumbnailUrl || "",
                    duration: duration,
                  }
                ).then(() => {
                  accumulatedSeconds.current = 0;
                })
              : Promise.resolve();
          
          syncBeforeComplete
            .then(() => markVideoCompletedAction(userId, currentVideo.videoId))
            .then((res: any) => {
               if (res?.success && (res.xpDelta || res.coinsDelta)) {
                   window.dispatchEvent(new CustomEvent('updateUserStats', { 
                       detail: { xpDelta: res.xpDelta || 0, coinsDelta: res.coinsDelta || 0 } 
                   }));
                   showNotification(
                     `🎉 Hoàn thành 50% video! Nhận +${res.coinsDelta || 50} Xu và +${res.xpDelta || 50} EXP!`,
                     "success"
                   );
               }
               updateTaskProgressAction(userId, "WATCH_COUNT", 1);
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

  if (loading) {
    return (
      <div className="dash-bg-gradient flex justify-center items-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ux-accent)]" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="dash-bg-gradient flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-[var(--ux-danger)] mb-3" />
        <h2 className="text-base font-semibold text-[var(--ux-ink)]">Không thể tải khóa học</h2>
        <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="ux dash-bg-gradient relative min-h-screen w-full overflow-x-hidden">
      {/* Hiệu ứng sao băng chạy nền */}
      <div className="dash-meteors" aria-hidden="true">
        {METEORS.map((m, idx) => (
          <span
            key={idx}
            className="dash-meteor"
            style={
              {
                "--my": m.top,
                "--mx": m.left,
                "--mlen": m.len,
                "--mdur": m.dur,
                "--mdel": m.del,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* THÔNG BÁO TOAST POPUP */}
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border bg-[var(--ux-surface)] max-w-[90%] md:max-w-md w-full ${notification.type === 'error' ? 'border-[var(--ux-danger)]/35 text-[var(--ux-danger)]' : 'border-[var(--ux-line-2)] text-[var(--ux-accent)]'}`}>
          {notification.type === 'error' ? <AlertTriangle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
          <div className="flex flex-col min-w-0">
            {notification.title && <span className="font-semibold text-sm mb-0.5 leading-snug text-[var(--ux-ink)]">{notification.title}</span>}
            <span className="text-xs text-[var(--ux-ink-2)] leading-relaxed">{notification.msg}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="ml-auto p-1 hover:bg-[var(--ux-surface-2)] rounded-lg transition-colors shrink-0 text-[var(--ux-ink-3)]"><X size={16} /></button>
        </div>
      )}

      {/* MODAL KHÓA VIDEO BỊ CẤM */}
      {isBanned && (
        <div className="fixed inset-0 z-[400] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--ux-surface)] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--ux-danger)]/40 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-[var(--ux-danger)]/12 text-[var(--ux-danger)] rounded-xl flex items-center justify-center mb-4">
              <Ban className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--ux-ink)] mb-1.5">Truy cập bị từ chối</h3>
            <p className="text-sm text-[var(--ux-ink-2)] mb-6 leading-relaxed">
              {bannedReason}
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 bg-[var(--ux-danger)] hover:opacity-90 text-white font-medium rounded-xl transition-opacity text-sm"
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
      )}

      {/* Khung dữ liệu tràn đều 2 bên màn hình */}
      <div className="relative z-10 w-full px-4 sm:px-6 pb-24 md:pb-10 pt-4 space-y-4 dash-enter">
        <button
          type="button"
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
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-xs font-medium text-[var(--ux-ink-2)] hover:text-[var(--ux-ink)] hover:border-[var(--ux-line-2)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (8-9/12): VIDEO + TẠO CÂU HỎI + BÀI TẬP TỔNG HỢP */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5 min-w-0">
            {currentVideo && (
              <>
                <div className="dash-card rounded-2xl p-4 sm:p-5">
                  <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video mb-3 border border-[var(--ux-line)]">
                    {!isBanned && (
                      <iframe
                        id="yt-player"
                        key={currentVideo.videoId}
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&enablejsapi=1`}
                        allow="autoplay; fullscreen"
                      />
                    )}
                  </div>

                  {/* Thanh tiến độ xem video (mục tiêu xem đủ 50% thời lượng để hoàn thành + nhận 50 Xu & 50 EXP) */}
                  {(() => {
                    const rawPct = watchProgress.duration > 0
                      ? Math.min(100, Math.round((watchProgress.watched / watchProgress.duration) * 100))
                      : 0;
                    const displayPct = watchProgress.completed ? Math.max(rawPct, 50) : rawPct;
                    return (
                      <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[var(--ux-surface-2)] border border-[var(--ux-line)]">
                        <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                          <span className={`font-semibold ${watchProgress.completed ? "text-[var(--ux-mint)]" : "text-[var(--ux-ink-2)]"}`}>
                            {watchProgress.completed
                              ? "Đã xem đủ 50% · Hoàn thành video (+50 Xu, +50 EXP)"
                              : `Đã xem: ${displayPct}% / 50%`}
                          </span>
                          <span className="text-[11px] font-medium text-[var(--ux-ink-3)] tabular-nums">
                            {displayPct}%
                          </span>
                        </div>
                        <div className="relative h-1.5 w-full rounded-full bg-[var(--ux-line)] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-[width] duration-500 ${
                              watchProgress.completed ? "bg-[var(--ux-mint)]" : "bg-[var(--ux-accent)]"
                            }`}
                            style={{ width: `${displayPct}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[var(--ux-ink-3)]/50"
                            title="Mốc 50%"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl font-semibold text-[var(--ux-ink)] leading-snug line-clamp-2" dangerouslySetInnerHTML={{ __html: currentVideo.title }} />
                      <p className="text-xs text-[var(--ux-ink-3)] mt-1 truncate">{currentVideo.channelTitle}</p>

                      <div className="flex flex-wrap gap-2 mt-3.5 items-center">
                        <BookmarkRibbonButton
                          video={currentVideo}
                          showNotification={showNotification}
                        />

                        <button
                          type="button"
                          onClick={handleTogglePlaylistFav}
                          disabled={loadingFavPlay || isBanned}
                          className={`h-10 flex items-center gap-2 px-3.5 rounded-xl font-medium text-xs sm:text-sm transition-colors border ${
                            isPlayFav
                              ? 'bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] border-[var(--ux-accent)]/30'
                              : 'bg-[var(--ux-surface-2)] text-[var(--ux-ink-2)] border-[var(--ux-line)] hover:text-[var(--ux-ink)] hover:border-[var(--ux-line-2)]'
                          }`}
                        >
                          {loadingFavPlay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Library className="w-4 h-4" strokeWidth={1.75} />}
                          {isPlayFav ? 'Đã lưu khóa học' : 'Lưu playlist'}
                        </button>

                        <ReportButton video={currentVideo} userId={userId} showNotification={showNotification} />

                        <button
                          type="button"
                          onClick={() => setIsShareModalOpen(true)}
                          title="Chia sẻ video"
                          className="w-10 h-10 shrink-0 rounded-xl transition-colors border flex items-center justify-center bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-2)] hover:text-[var(--ux-accent)] hover:border-[var(--ux-line-2)]"
                        >
                          <Share2 className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    {/* KHỐI TẠO CÂU HỎI */}
                    <div className="flex items-center gap-2 bg-[var(--ux-surface-2)] p-1.5 rounded-xl border border-[var(--ux-line)] shrink-0 self-start xl:self-center">
                      <div className="flex items-center gap-1.5 pl-2">
                        <span className="text-[11px] text-[var(--ux-ink-3)] whitespace-nowrap">Số câu</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          disabled={isBanned}
                          value={questionCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (Number.isNaN(val)) setQuestionCount(1);
                            else setQuestionCount(Math.min(20, Math.max(1, val)));
                          }}
                          className="w-14 h-9 bg-[var(--ux-surface)] text-center rounded-lg text-sm font-semibold tabular-nums border border-[var(--ux-line)] outline-none focus:border-[var(--ux-accent)] text-[var(--ux-ink)] disabled:opacity-50"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateQuiz}
                        disabled={isGenerating || isBanned}
                        className="h-9 px-4 flex items-center justify-center gap-2 bg-[var(--ux-accent)] hover:bg-[var(--ux-accent-2)] text-white rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang tạo...</span>
                          </>
                        ) : (
                          <>
                            <span>Tạo câu hỏi</span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-md tabular-nums">
                              {isProUser && questionCount > currentEnergyCost ? (
                                <>
                                  <span className="line-through opacity-75">{questionCount}</span>
                                  <span>{currentEnergyCost}</span>
                                </>
                              ) : (
                                <span>{currentEnergyCost}</span>
                              )}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {showAiError && (
                    <p className="text-[var(--ux-danger)] text-xs sm:text-sm mt-4 p-3 bg-[var(--ux-danger)]/10 border border-[var(--ux-danger)]/25 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> AI đang bị quá tải hoặc dữ liệu trả về bị lỗi. Vui lòng thử lại
                    </p>
                  )}
                </div>

                {/* BÀI TẬP TỔNG HỢP CUỐI KHÓA */}
                {progress && (
                  <div className="dash-hero-card rounded-2xl overflow-hidden relative">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 relative z-10">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${progress.isUnlocked ? 'bg-[var(--ux-mint)]/12 text-[var(--ux-mint)]' : 'bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-3)]'}`}>
                          {progress.isUnlocked ? <Unlock className="w-5 h-5" strokeWidth={1.75} /> : <Lock className="w-5 h-5" strokeWidth={1.75} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-[var(--ux-ink)] flex items-center gap-2">
                            Bài tập tổng hợp cuối khóa
                            {progress.summaryScore > 0 && <CheckCircle2 className="w-4 h-4 text-[var(--ux-mint)] shrink-0" />}
                          </h3>
                          <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] mt-0.5 leading-relaxed">
                            {progress.isUnlocked
                              ? "Đã đủ điều kiện làm bài thi tổng kết để lấy 50% số điểm còn lại"
                              : `Đạt điểm tối đa ở các bài quiz lẻ để mở khóa (${progress.currentVideoScore}/${progress.potentialMaxVideoScore} điểm)`
                            }
                          </p>
                        </div>
                      </div>

                      {progress.isUnlocked && !isBanned ? (
                        <RollingActionButton
                          label={progress.summaryScore > 0 ? "Làm lại bài thi" : "Bắt đầu thi"}
                          onClick={() => router.push(`/quizzes/review?topic=${playlistId}`)}
                          className="shrink-0"
                        />
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-[var(--ux-surface-2)] text-[var(--ux-ink-3)] cursor-not-allowed border border-[var(--ux-line)] shrink-0"
                        >
                          Chưa mở khóa
                        </button>
                      )}
                    </div>

                    {!progress.isUnlocked && progress.potentialMaxVideoScore > 0 && (
                      <div
                        className="h-1 bg-[var(--ux-accent)] transition-[width] duration-700"
                        style={{ width: `${(progress.currentVideoScore / progress.potentialMaxVideoScore) * 100}%` }}
                      />
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

          {/* CỘT PHẢI (4-3/12): DANH SÁCH BÀI HỌC */}
          <aside className="lg:col-span-4 xl:col-span-3 shrink-0">
            <div className="dash-card flex flex-col h-[560px] lg:h-[calc(100vh-110px)] lg:sticky lg:top-5 rounded-2xl overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[var(--ux-line)] flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-semibold text-sm flex items-center gap-2 text-[var(--ux-ink)]">
                    <ListVideo className="w-4 h-4 text-[var(--ux-accent)]" strokeWidth={1.75} /> Danh sách bài học
                  </h2>
                  <p className="text-xs text-[var(--ux-ink-3)] mt-0.5 tabular-nums">{playlistItems.length} video trong khóa</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                {playlistItems.map((vid, index) => {
                  const isActive = currentVideo?.videoId === vid.videoId;
                  return (
                    <div
                      key={vid.videoId}
                      onClick={() => setCurrentVideo(vid)}
                      className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-colors group border ${
                        isActive
                          ? 'bg-[var(--ux-accent-soft)] border-[var(--ux-accent)]/30'
                          : 'border-transparent hover:bg-[var(--ux-surface-2)]'
                      }`}
                    >
                      <div className="relative w-[116px] aspect-video rounded-lg overflow-hidden shrink-0 bg-[var(--ux-surface-3)] border border-[var(--ux-line)]">
                        <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[10px] text-white font-medium tabular-nums">
                          Bài {index + 1}
                        </span>
                        {isActive ? (
                          <div className="absolute inset-0 bg-[var(--ux-accent)]/35 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-current" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <PlayCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                        <h4
                          className={`text-xs font-medium line-clamp-2 leading-snug ${isActive ? 'text-[var(--ux-accent)]' : 'text-[var(--ux-ink)]'}`}
                          dangerouslySetInnerHTML={{ __html: vid.title }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal nhận thưởng */}
      {rewardData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="dash-card rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center">
            <div className="w-11 h-11 bg-[var(--ux-mint)]/12 text-[var(--ux-mint)] rounded-xl flex items-center justify-center mb-4">
              <Award className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-semibold text-[var(--ux-ink)] mb-1">Hoàn thành bài kiểm tra</h2>
            <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] text-center mb-5">Phần thưởng đã được cộng vào tài khoản</p>

            <div className="flex w-full gap-3 mb-5 tabular-nums">
              <div className="flex-1 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-xl p-3.5 flex flex-col items-center">
                <Sparkles className="w-4 h-4 text-[var(--ux-accent)] mb-1.5" strokeWidth={1.75} />
                <span className="text-xl font-semibold text-[var(--ux-accent)]">+{rewardData.xp}</span>
                <span className="text-[11px] font-medium text-[var(--ux-ink-3)]">EXP</span>
              </div>
              <div className="flex-1 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-xl p-3.5 flex flex-col items-center">
                <Coins className="w-4 h-4 text-[var(--ux-warn)] mb-1.5" strokeWidth={1.75} />
                <span className="text-xl font-semibold text-[var(--ux-warn)]">+{rewardData.coins}</span>
                <span className="text-[11px] font-medium text-[var(--ux-ink-3)]">Xu</span>
              </div>
            </div>

            <button type="button" onClick={() => setRewardData(null)} className="w-full py-2.5 bg-[var(--ux-accent)] hover:bg-[var(--ux-accent-2)] text-white rounded-xl text-sm font-medium transition-colors">
              Tiếp tục học
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