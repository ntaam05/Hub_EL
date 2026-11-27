// Lucian UX/UI Prompt #009 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#009
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Zap,
  Sparkles,
  Award,
  Coins,
  Flag,
  X,
  Ban,
  Share2,
  Play,
} from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ShareVideoModal from "@/components/modals/ShareVideoModal";
import { AdaptiveVideoQuiz } from "@/components/quiz/AdaptiveVideoQuiz";
import BookmarkRibbonButton from "./BookmarkRibbonButton";

import { generateQuizFromVideoAction } from "@/actions/quiz/ai";
import { saveQuizAttemptAction } from "@/actions/quiz/attempt";
import {
  getRelatedVideosAction,
  checkEducationalVideoAction,
} from "@/actions/video/video";
import { syncStudyTimeAction } from "@/actions/stats";
import {
  getVideoProgressAction,
  markVideoCompletedAction,
} from "@/actions/user/learning";
import { updateTaskProgressAction } from "@/actions/quests/progress";
import { reportVideoAction } from "@/actions/video/report";
import "../../dashboard/lucian-dashboard.css";

const METEORS = [
  { top: "8%", left: "24%", len: "145px", dur: "4.8s", del: "0.2s" },
  { top: "22%", left: "66%", len: "175px", dur: "5.5s", del: "1.4s" },
  { top: "45%", left: "44%", len: "155px", dur: "5.1s", del: "0.8s" },
  { top: "68%", left: "80%", len: "135px", dur: "4.6s", del: "2.3s" },
];

// =====================================
// COMPONENT: NÚT BÁO CÁO (REPORT)
// =====================================
const ReportButton = ({
  video,
  userId,
  showNotification,
}: {
  video: any;
  userId: string;
  showNotification: Function;
}) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReported, setIsReported] = useState(false);

  const handleSubmit = async () => {
    if (!userId)
      return showNotification("Vui lòng đăng nhập để báo cáo video", "error");
    if (!reason.trim())
      return showNotification("Vui lòng chọn hoặc nhập lý do", "error");

    setIsSubmitting(true);
    const res = await reportVideoAction({
      videoId: video.videoId,
      title: video.title,
      channelName: video.channelTitle || "Kênh ẩn danh",
      reason: reason,
      userId: userId,
    });

    if (res.success) {
      setIsReported(true);
      setShowModal(false);
      showNotification(
        "Báo cáo đã được gửi đến Ban quản trị xem xét",
        "success",
        "Đã gửi báo cáo"
      );
    } else {
      showNotification("Có lỗi xảy ra khi gửi báo cáo: " + res.error, "error");
    }
    setIsSubmitting(false);
  };

  if (isReported) {
    return (
      <button
        type="button"
        disabled
        title="Đã báo cáo"
        className="w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center bg-[var(--ux-warn)]/12 border-[var(--ux-warn)]/30 text-[var(--ux-warn)] opacity-75"
      >
        <Flag className="w-[18px] h-[18px] fill-current" strokeWidth={1.75} />
      </button>
    );
  }

  const predefinedReasons = [
    "Chứa nội dung giải trí, chơi game",
    "Sai kiến thức, thông tin lệch lạc",
    "Nội dung phản cảm, độc hại",
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title="Báo cáo nội dung vi phạm"
        className="w-10 h-10 shrink-0 rounded-xl transition-colors border flex items-center justify-center bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-2)] hover:text-[var(--ux-warn)] hover:border-[var(--ux-line-2)]"
      >
        <Flag className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </button>

      {showModal && (
        <div className="ux fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-[var(--ux-surface)] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--ux-line-2)]">
            <h3 className="text-base font-semibold text-[var(--ux-ink)] mb-1.5 flex items-center gap-2">
              <AlertTriangle
                className="w-4 h-4 text-[var(--ux-warn)]"
                strokeWidth={1.75}
              />
              Báo cáo video này
            </h3>
            <p className="text-xs text-[var(--ux-ink-2)] mb-4">
              Giúp cộng đồng loại bỏ nội dung giải trí hoặc sai lệch kiến thức
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {predefinedReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                    reason === r
                      ? "bg-[var(--ux-warn)]/12 border-[var(--ux-warn)]/40 text-[var(--ux-warn)]"
                      : "bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink)] hover:border-[var(--ux-line-2)]"
                  }`}
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
              />
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[var(--ux-ink-2)] bg-[var(--ux-surface-2)] hover:bg-[var(--ux-surface-3)] border border-[var(--ux-line)] transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !reason}
                className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white bg-[var(--ux-warn)] hover:opacity-90 disabled:opacity-45 flex items-center justify-center gap-2 transition-opacity"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Gửi báo cáo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =====================================
// TRANG HIỂN THỊ CHÍNH
// =====================================
export default function StudyRoomPage() {
  const router = useRouter();
  const params = useParams();

  const searchParams = useSearchParams();
  const startTime = searchParams.get("t") || 0;

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
  const [rewardData, setRewardData] = useState<{
    xp: number;
    coins: number;
  } | null>(null);

  const [isBanned, setIsBanned] = useState(false);
  const [bannedReason, setBannedReason] = useState("");

  const [notification, setNotification] = useState<{
    title?: string;
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const showNotification = (
    msg: string,
    type: "success" | "error" = "success",
    title?: string
  ) => {
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

    if (!video?.videoId || !userId) return;
    let active = true;
    getVideoProgressAction(userId, video.videoId)
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
  }, [video?.videoId, userId, startTime]);

  useEffect(() => {
    if (!video?.videoId) return;
    setIsBanned(false);

    checkEducationalVideoAction("", "", video.videoId)
      .then((res) => {
        if (
          res.success &&
          res.isEducational === false &&
          res.reason?.includes("Quản trị viên")
        ) {
          setIsBanned(true);
          setBannedReason(
            res.reason ||
              "Video này đã bị Quản trị viên khóa do vi phạm nội quy học tập."
          );
        }
      })
      .catch(() => {});
  }, [video?.videoId]);

  useEffect(() => {
    if (!video?.videoId || isBanned) return;

    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        new (window as any).YT.Player("yt-player", {
          events: {
            onReady: (event: any) => {
              const playerDuration =
                typeof event.target.getDuration === "function"
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
            onStateChange: (event: any) => {
              if (event.data === 1) setIsPlaying(true);
              else setIsPlaying(false);
            },
          },
        });
      }
    };

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      setTimeout(initPlayer, 500);
    }

    return () => {
      setIsPlaying(false);
    };
  }, [video?.videoId, isBanned]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPlaying && userId && video?.videoId && !isBanned) {
      timer = setInterval(() => {
        accumulatedSeconds.current += 1;
        totalWatchedSeconds.current += 1;

        const player = (window as any).YT?.get("yt-player");
        const currentTime =
          player && typeof player.getCurrentTime === "function"
            ? Math.floor(player.getCurrentTime())
            : 0;
        const duration =
          player && typeof player.getDuration === "function"
            ? Math.floor(player.getDuration())
            : 0;

        setWatchProgress({
          watched: totalWatchedSeconds.current,
          duration,
          completed: hasMarkedCompleted.current,
        });

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
              duration: duration,
            }
          );
          accumulatedSeconds.current = 0;
          updateTaskProgressAction(userId, "WATCH_MINUTE", 1);
        }

        const requiredSeconds = duration > 0 ? Math.ceil(duration * 0.5) : 0;

        if (
          duration > 0 &&
          totalWatchedSeconds.current >= requiredSeconds &&
          !hasMarkedCompleted.current
        ) {
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
                  video.videoId,
                  currentTime,
                  {
                    title: video.title || "Video Bài Giảng",
                    channelName: video.channelTitle || "Kênh Ẩn Danh",
                    thumbnail: video.thumbnailUrl || "",
                    duration: duration,
                  }
                ).then(() => {
                  accumulatedSeconds.current = 0;
                })
              : Promise.resolve();

          syncBeforeComplete
            .then(() => markVideoCompletedAction(userId, video.videoId))
            .then((res: any) => {
              if (res?.success && (res.xpDelta || res.coinsDelta)) {
                window.dispatchEvent(
                  new CustomEvent("updateUserStats", {
                    detail: {
                      xpDelta: res.xpDelta || 0,
                      coinsDelta: res.coinsDelta || 0,
                    },
                  })
                );
                showNotification(
                  `🎉 Hoàn thành 50% video! Nhận +${res.coinsDelta || 50} Xu và +${res.xpDelta || 50} EXP!`,
                  "success"
                );
              }
              updateTaskProgressAction(userId, "WATCH_COUNT", 1);
            })
            .catch((e: any) => console.log("Lưu tiến độ video:", e));
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, userId, video, isBanned]);

  useEffect(() => {
    return () => {
      if (accumulatedSeconds.current > 0 && userId && video?.videoId && !isBanned) {
        const player = (window as any).YT?.get("yt-player");
        const currentTime =
          player && typeof player.getCurrentTime === "function"
            ? Math.floor(player.getCurrentTime())
            : 0;
        const duration =
          player && typeof player.getDuration === "function"
            ? Math.floor(player.getDuration())
            : 0;

        syncStudyTimeAction(
          userId,
          accumulatedSeconds.current,
          video.videoId,
          currentTime,
          {
            title: video.title || "Video Bài Giảng",
            channelName: video.channelTitle || "Kênh Ẩn Danh",
            thumbnail: video.thumbnailUrl || "",
            duration: duration,
          }
        );
      }
    };
  }, [userId, video, isBanned]);

  useEffect(() => {
    const savedState = sessionStorage.getItem("routeState");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.video?.videoId === params.videoId) {
        setVideo(parsed.video);
        return;
      }
    }
    if (params.videoId)
      setVideo({
        videoId: params.videoId,
        title: "Đang tải video...",
        channelTitle: "Video bài giảng",
      });
  }, [params.videoId]);

  useEffect(() => {
    if (!video?.videoId) return;
    setIsLoadingRelated(true);
    getRelatedVideosAction(video.videoId).then((res) => {
      if (res.success && Array.isArray(res.data))
        setRelatedVideos(
          res.data.filter((v: any) => v.videoId !== video.videoId)
        );
      setIsLoadingRelated(false);
    });
  }, [video]);

  const handleGenerateQuiz = async () => {
    if (!video?.videoId) return;
    if (!userId)
      return showNotification("Vui lòng đăng nhập để sử dụng AI", "error");

    setIsGenerating(true);
    setUserAnswers({});
    setHasSubmitted(false);
    setShowAiError(false);
    try {
      const res = await generateQuizFromVideoAction(
        userId,
        video.videoId,
        questionCount,
        true
      );
      if (res.success && res.data) {
        const initialList = Array.isArray(res.data)
          ? res.data
          : res.data.questions;
        setQuizzes(initialList);
        window.dispatchEvent(
          new CustomEvent("updateUserStats", {
            detail: { energyCost: currentEnergyCost },
          })
        );
        updateTaskProgressAction(userId, "SPEND_ENERGY", currentEnergyCost);
      } else {
        setShowAiError(true);
        if (res.error) showNotification(res.error, "error");
      }
    } catch (err) {
      setShowAiError(true);
    }
    setIsGenerating(false);
  };

  const handleSubmitQuiz = async () => {
    if (!userId)
      return showNotification("Vui lòng đăng nhập để lưu bài", "error");
    let score = 0;
    quizzes.forEach((q: any, i: number) => {
      if (userAnswers[i] === q.correctAnswer) score++;
    });
    setHasSubmitted(true);
    setIsSubmitting(true);

    try {
      const res = await saveQuizAttemptAction({
        userId: userId,
        videoId: video.videoId,
        videoTitle: video.title,
        channelName: video.channelTitle,
        score,
        correctCount: score,
        totalQuizzes: quizzes.length,
        questionsData: quizzes,
      });

      if (res.success) {
        const earnedXP = res.earnedXP || 0;
        const earnedCoins = res.earnedCoins || 0;

        if (earnedXP > 0 || earnedCoins > 0) {
          setRewardData({ xp: earnedXP, coins: earnedCoins });
          window.dispatchEvent(
            new CustomEvent("updateUserStats", {
              detail: { xpDelta: earnedXP, coinsDelta: earnedCoins },
            })
          );
        }

        updateTaskProgressAction(userId, "QUIZ_ATTEMPT", quizzes.length);
        if (score > 0) {
          updateTaskProgressAction(userId, "QUIZ_CORRECT", score);
        }

        window.dispatchEvent(new Event("quizCompleted"));
      } else {
        showNotification("Lỗi Database khi lưu bài", "error");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  if (!video) {
    return (
      <div className="dash-bg-gradient flex justify-center items-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ux-accent)]" />
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

      {/* Khung thông báo */}
      {notification && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border bg-[var(--ux-surface)] max-w-[90%] md:max-w-md w-full animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            notification.type === "error"
              ? "border-[var(--ux-danger)]/35 text-[var(--ux-danger)]"
              : "border-[var(--ux-line-2)] text-[var(--ux-accent)]"
          }`}
        >
          {notification.type === "error" ? (
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          ) : (
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col min-w-0">
            {notification.title && (
              <span className="font-semibold text-sm mb-0.5 leading-snug text-[var(--ux-ink)]">
                {notification.title}
              </span>
            )}
            <span className="text-xs text-[var(--ux-ink-2)] leading-relaxed">
              {notification.msg}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-auto p-1 hover:bg-[var(--ux-surface-2)] rounded-lg transition-colors shrink-0 text-[var(--ux-ink-3)]"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modal khóa video bị cấm */}
      {isBanned && (
        <div className="fixed inset-0 z-[400] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--ux-surface)] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--ux-danger)]/40 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-[var(--ux-danger)]/12 text-[var(--ux-danger)] rounded-xl flex items-center justify-center mb-4">
              <Ban className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--ux-ink)] mb-1.5">
              Truy cập bị từ chối
            </h3>
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
            if (userId && video?.videoId && !isBanned) {
              const player = (window as any).YT?.get("yt-player");
              const currentTime =
                player && typeof player.getCurrentTime === "function"
                  ? Math.floor(player.getCurrentTime())
                  : 0;
              const duration =
                player && typeof player.getDuration === "function"
                  ? Math.floor(player.getDuration())
                  : 0;
              const secsToSend =
                accumulatedSeconds.current > 0
                  ? accumulatedSeconds.current
                  : 1;

              await syncStudyTimeAction(
                userId,
                secsToSend,
                video.videoId,
                currentTime,
                {
                  title: video.title || "Video Bài Giảng",
                  channelName: video.channelTitle || "Kênh Ẩn Danh",
                  thumbnail: video.thumbnailUrl || "",
                  duration: duration,
                }
              );
            }
            router.back();
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-xs font-medium text-[var(--ux-ink-2)] hover:text-[var(--ux-ink)] hover:border-[var(--ux-line-2)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Quay lại
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (9/12): VIDEO PLAYER + TẠO QUIZ */}
          <div className="xl:col-span-9 space-y-5 min-w-0">
            <div className="dash-card rounded-2xl p-4 sm:p-5">
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-3 border border-[var(--ux-line)]">
                {!isBanned && (
                  <iframe
                    id="yt-player"
                    key={video.videoId}
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&enablejsapi=1`}
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

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 flex gap-3 items-start sm:items-center min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <BookmarkRibbonButton
                      video={video}
                      showNotification={showNotification}
                    />
                    <ReportButton
                      video={video}
                      userId={userId}
                      showNotification={showNotification}
                    />
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      title="Chia sẻ video"
                      className="w-10 h-10 shrink-0 rounded-xl transition-colors border flex items-center justify-center bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-2)] hover:text-[var(--ux-accent)] hover:border-[var(--ux-line-2)]"
                    >
                      <Share2 className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <h1
                      className="text-base sm:text-lg font-semibold text-[var(--ux-ink)] line-clamp-2 leading-snug"
                      dangerouslySetInnerHTML={{ __html: video.title }}
                    />
                    <p className="text-xs text-[var(--ux-ink-3)] mt-0.5 truncate">
                      {video.channelTitle}
                    </p>
                  </div>
                </div>

                {/* KHỐI TẠO BÀI TẬP AI */}
                <div className="flex items-center gap-2 bg-[var(--ux-surface-2)] p-1.5 rounded-xl border border-[var(--ux-line)] shrink-0">
                  <div className="flex items-center gap-1.5 pl-2">
                    <span className="text-[11px] text-[var(--ux-ink-3)] whitespace-nowrap">
                      Số câu
                    </span>
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
                              <span className="line-through opacity-75">
                                {questionCount}
                              </span>
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
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  AI đang quá tải hoặc dữ liệu trả về bị lỗi. Vui lòng thử lại
                </p>
              )}
            </div>

            {quizzes && userId && (
              <AdaptiveVideoQuiz
                videoId={video.videoId}
                userId={userId}
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
          </div>

          {/* CỘT PHẢI (3/12): VIDEO ĐỀ XUẤT */}
          <aside className="xl:col-span-3 shrink-0">
            <div className="dash-card rounded-2xl xl:sticky xl:top-5 flex flex-col max-h-[calc(100vh-110px)]">
              <div className="px-4 py-3.5 border-b border-[var(--ux-line)] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--ux-ink)]">
                  Video đề xuất
                </h2>
                {!isLoadingRelated && (
                  <span className="text-xs text-[var(--ux-ink-3)] tabular-nums">
                    {relatedVideos.length}
                  </span>
                )}
              </div>

              <div className="p-3 space-y-2 overflow-y-auto">
                {isLoadingRelated ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--ux-accent)]" />
                  </div>
                ) : (
                  relatedVideos.map((vid, i) => (
                    <div
                      key={vid.videoId || i}
                      onClick={() => {
                        sessionStorage.setItem(
                          "routeState",
                          JSON.stringify({ video: vid })
                        );
                        router.push(`/watch/${vid.videoId}`);
                      }}
                      className="flex gap-3 cursor-pointer group p-2 rounded-xl bg-[var(--ux-surface-2)]/50 hover:bg-[var(--ux-surface-2)] border border-transparent hover:border-[var(--ux-line)] transition-colors"
                    >
                      <div className="w-[120px] aspect-video rounded-lg overflow-hidden shrink-0 relative bg-[var(--ux-surface-3)] border border-[var(--ux-line)]">
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-current" />
                        </div>
                      </div>

                      <div className="flex flex-col min-w-0 justify-center">
                        <h4
                          className="text-xs font-medium line-clamp-2 text-[var(--ux-ink)] group-hover:text-[var(--ux-accent)] transition-colors leading-snug"
                          dangerouslySetInnerHTML={{ __html: vid.title }}
                        />
                        <span className="text-[11px] text-[var(--ux-ink-3)] mt-1 truncate">
                          {vid.channelTitle}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal nhận thưởng sau quiz */}
      {rewardData && (
        <div className="ux fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="dash-card rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center">
            <div className="w-11 h-11 bg-[var(--ux-mint)]/12 text-[var(--ux-mint)] rounded-xl flex items-center justify-center mb-4">
              <Award className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-semibold text-[var(--ux-ink)] mb-1">
              Hoàn thành bài kiểm tra
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] text-center mb-5">
              Phần thưởng đã được cộng vào tài khoản
            </p>

            <div className="flex w-full gap-3 mb-5 tabular-nums">
              <div className="flex-1 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-xl p-3.5 flex flex-col items-center">
                <Sparkles
                  className="w-4 h-4 text-[var(--ux-accent)] mb-1.5"
                  strokeWidth={1.75}
                />
                <span className="text-xl font-semibold text-[var(--ux-accent)]">
                  +{rewardData.xp}
                </span>
                <span className="text-[11px] font-medium text-[var(--ux-ink-3)]">
                  EXP
                </span>
              </div>
              <div className="flex-1 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-xl p-3.5 flex flex-col items-center">
                <Coins
                  className="w-4 h-4 text-[var(--ux-warn)] mb-1.5"
                  strokeWidth={1.75}
                />
                <span className="text-xl font-semibold text-[var(--ux-warn)]">
                  +{rewardData.coins}
                </span>
                <span className="text-[11px] font-medium text-[var(--ux-ink-3)]">
                  Xu
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRewardData(null)}
              className="w-full py-2.5 bg-[var(--ux-accent)] hover:bg-[var(--ux-accent-2)] text-white rounded-xl text-sm font-medium transition-colors"
            >
              Tiếp tục học
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
