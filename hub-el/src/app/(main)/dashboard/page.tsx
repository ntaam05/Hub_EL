// Lucian UX/UI Prompt #014 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#014
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  Loader2,
  Award,
  Clock,
  Sparkles,
  History,
  CheckCircle,
  GraduationCap,
  RotateCcw,
  Trophy,
  Compass,
  BookOpen,
  Heart,
  Play,
} from "lucide-react";
import {
  getDashboardDataAction,
  claimDailyTaskRewardAction,
  getFreshUserStatsAction,
} from "@/actions/user/learning";
import { getRecommendedDashboardVideosAction } from "@/actions/video/video";
import { getFavoriteVideosAction } from "@/actions/video/favorite";
import { RollingActionButton, SpotlightVideoCard } from "./LucianPrimitives";
import "./lucian-dashboard.css";

function formatTimeAgo(dateString: string) {
  if (!dateString) return "Vừa xong";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000)
  );
  if (diffInSeconds < 60) return "Vừa xong";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

const activityUI: Record<string, { icon: React.ElementType }> = {
  VIDEO: { icon: PlayCircle },
  QUIZ: { icon: CheckCircle },
  RETAKE_QUIZ: { icon: RotateCcw },
  COURSE: { icon: GraduationCap },
  ACHIEVEMENT: { icon: Trophy },
  GACHA: { icon: Sparkles },
  WIKI: { icon: BookOpen },
};

const METEORS = [
  { top: "6%", left: "24%", len: "150px", dur: "4.6s", del: "0s" },
  { top: "14%", left: "62%", len: "190px", dur: "5.4s", del: "1.3s" },
  { top: "22%", left: "86%", len: "130px", dur: "4.2s", del: "2.7s" },
  { top: "38%", left: "42%", len: "170px", dur: "5.8s", del: "0.7s" },
  { top: "52%", left: "78%", len: "140px", dur: "4.9s", del: "3.1s" },
  { top: "68%", left: "54%", len: "160px", dur: "5.2s", del: "1.9s" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  const [favoriteVideos, setFavoriteVideos] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);

  const favScrollRef = useRef<HTMLDivElement>(null);
  const recScrollRef = useRef<HTMLDivElement>(null);

  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [rewardData, setRewardData] = useState<{
    xp: number;
    coins: number;
  } | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (session?.user?.id && !hasFetched.current) {
      hasFetched.current = true;

      getDashboardDataAction(session.user.id).then((res) => {
        if (res.success) setData(res.data);
        setLoading(false);
      });

      getFreshUserStatsAction(session.user.id).then((res) => {
        if (res) setUserStats(res);
      });

      getRecommendedDashboardVideosAction(session.user.id).then((res) => {
        if (res.success) setRecommendedVideos(res.data);
        setLoadingRecommended(false);
      });

      getFavoriteVideosAction(session.user.id).then((res) => {
        if (res.success) setFavoriteVideos(res.data || []);
        setLoadingFavorites(false);
      });
    } else if (session === null) {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const handleClaimReward = async (progressId: number) => {
    setClaimingId(progressId);
    const res = await claimDailyTaskRewardAction(
      session?.user?.id as string,
      progressId
    );
    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        dailyTasks: prev.dailyTasks.map((tp: any) =>
          tp.id === progressId ? { ...tp, isClaimed: true } : tp
        ),
      }));

      window.dispatchEvent(
        new CustomEvent("updateUserStats", {
          detail: {
            xpDelta: res.xpDelta || 0,
            coinsDelta: res.coinsDelta || 0,
          },
        })
      );
      setRewardData({ xp: res.xpDelta || 0, coins: res.coinsDelta || 0 });
      setTimeout(() => setRewardData(null), 4500);
    } else {
      alert(res.error || "Có lỗi xảy ra");
    }
    setClaimingId(null);
  };

  useEffect(() => {
    const attachWheelScroll = (el: HTMLDivElement | null) => {
      if (!el) return () => {};
      const onWheel = (e: WheelEvent) => {
        if (el.scrollWidth <= el.clientWidth) return;
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (delta === 0) return;

        const atStart = el.scrollLeft <= 0 && delta < 0;
        const atEnd =
          el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && delta > 0;
        if (atStart || atEnd) return;

        e.preventDefault();
        el.scrollLeft += delta;
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    };

    const cleanupFav = attachWheelScroll(favScrollRef.current);
    const cleanupRec = attachWheelScroll(recScrollRef.current);
    return () => {
      cleanupFav();
      cleanupRec();
    };
  }, [loadingFavorites, loadingRecommended, favoriteVideos.length, recommendedVideos.length]);

  if (loading) {
    return (
      <div className="dash-bg-gradient flex justify-center items-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ux-accent)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="dash-bg-gradient p-8 text-center text-sm text-[var(--ux-ink-2)] min-h-[70vh]">
        Vui lòng đăng nhập để xem Bảng điều khiển
      </div>
    );
  }

  const displayTasks = data?.dailyTasks || [];
  const completedTasksCount = displayTasks.filter(
    (tp: any) => (tp.current || 0) >= (tp.task?.target || 1)
  ).length;
  const totalTasksCount = displayTasks.length;
  const taskRatio =
    totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0;
  const allTasksDone =
    totalTasksCount > 0 && completedTasksCount === totalTasksCount;

  const uStats = userStats || (session.user as any) || {};
  const level = uStats.level || 1;
  const displayAvatar = uStats.image || uStats.avatar || session.user?.image;
  const displayName =
    uStats.fullName || uStats.name || session.user?.name || "Học viên";

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

      {/* Khung dữ liệu tràn đều 2 bên màn hình */}
      <div className="relative z-10 w-full px-4 sm:px-6 pb-24 md:pb-8 pt-5 space-y-5 dash-enter">
        {/* ==================================== */}
        {/* HÀNG 1: TIẾP TỤC HỌC (LỚN) + NHIỆM VỤ HÔM NAY (GỌN) */}
        {/* ==================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* CỘT TRÁI (8/12): TIẾP TỤC HỌC NỔI BẬT */}
          <section className="xl:col-span-8 dash-hero-card rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-5">
            {/* Thanh thông tin học viên gọn phía trên */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--ux-line)]">
              <div className="flex items-center gap-3 min-w-0">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border border-[var(--ux-line-2)] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--ux-accent)] text-white flex items-center justify-center text-sm font-medium shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-lg font-semibold text-[var(--ux-ink)] truncate">
                      {displayName}
                    </h1>
                    <span className="text-[11px] font-medium tabular-nums text-[var(--ux-accent)] bg-[var(--ux-accent-soft)] px-2 py-0.5 rounded-md">
                      Cấp {level}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ux-ink-3)] truncate">
                    Bảng điều khiển học tập
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ux-ink-2)]">
                <PlayCircle
                  className="w-4 h-4 text-[var(--ux-accent)]"
                  strokeWidth={1.75}
                />
                Tiếp tục học
              </span>
            </div>

            {data?.continueLearning ? (
              <div className="flex flex-col md:flex-row gap-5 lg:gap-7 items-stretch md:items-center flex-1">
                <div
                  onClick={() =>
                    router.push(
                      `/watch/${data.continueLearning.videoId}?t=${data.continueLearning.lastWatched}`
                    )
                  }
                  className="w-full md:w-[310px] lg:w-[360px] aspect-video rounded-xl overflow-hidden relative bg-[var(--ux-surface-3)] shrink-0 border border-[var(--ux-line-2)] cursor-pointer group"
                >
                  {data.continueLearning.thumbnailUrl && (
                    <img
                      src={data.continueLearning.thumbnailUrl}
                      alt={data.continueLearning.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-black/65 text-white flex items-center justify-center border border-white/20">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between gap-4 py-1">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-medium text-[var(--ux-accent)] bg-[var(--ux-accent-soft)] px-2.5 py-1 rounded-md truncate">
                        {data.continueLearning.course}
                      </span>
                      <span className="text-xs text-[var(--ux-ink-3)] tabular-nums flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                        {data.continueLearning.timeLeft}
                      </span>
                    </div>

                    <h2
                      className="font-semibold text-[var(--ux-ink)] text-lg sm:text-xl lg:text-[22px] leading-snug line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: data.continueLearning.title,
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[var(--ux-ink-3)]">
                          Tiến độ bài học
                        </span>
                        <span className="font-semibold tabular-nums text-[var(--ux-ink)]">
                          {data.continueLearning.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[var(--ux-surface-3)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--ux-accent)] rounded-full transition-[width] duration-500"
                          style={{ width: `${data.continueLearning.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <RollingActionButton
                        label="Tiếp tục bài học"
                        onClick={() =>
                          router.push(
                            `/watch/${data.continueLearning.videoId}?t=${data.continueLearning.lastWatched}`
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border border-dashed border-[var(--ux-line-2)] rounded-xl">
                <PlayCircle
                  className="w-8 h-8 text-[var(--ux-ink-3)] mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-base font-medium text-[var(--ux-ink)]">
                  Chưa có bài học dở dang
                </p>
                <p className="text-xs text-[var(--ux-ink-3)] mt-1">
                  Chọn một video đề xuất bên dưới để bắt đầu học ngay
                </p>
              </div>
            )}
          </section>

          {/* CỘT PHẢI (4/12): NHIỆM VỤ HÔM NAY THU GỌN (#014) */}
          <section
            className={`xl:col-span-4 dash-card rounded-2xl p-4 sm:p-5 flex flex-col u014 ${
              allTasksDone ? "is-all" : ""
            }`}
            style={{ "--p": taskRatio.toFixed(3) } as React.CSSProperties}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[var(--ux-ink)] flex items-center gap-2">
                  <Award
                    className="w-4 h-4 text-[var(--ux-accent)]"
                    strokeWidth={1.75}
                  />
                  Nhiệm vụ hôm nay
                </h2>
                <p className="text-[11px] text-[var(--ux-ink-3)] mt-0.5 truncate">
                  {allTasksDone
                    ? "Đã hoàn thành mục tiêu"
                    : "Hoàn thành để nhận thưởng"}
                </p>
              </div>

              {totalTasksCount > 0 && (
                <div className="u014-ring" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <circle className="bg" cx="24" cy="24" r="20" />
                    <circle className="fg" cx="24" cy="24" r="20" />
                  </svg>
                  <span className="u014-num">
                    {completedTasksCount}/{totalTasksCount}
                  </span>
                  <span className="u014-done">
                    <svg viewBox="0 0 16 16">
                      <path d="M3.5 8.4l3 3 6-6.4" />
                    </svg>
                  </span>
                </div>
              )}
            </div>

            {displayTasks.length > 0 ? (
              <div className="flex-1 flex flex-col gap-1.5">
                {displayTasks.map((tp: any, index: number) => {
                  const task = tp.task || {};
                  const current = tp.current || 0;
                  const max = task.target || 1;
                  const isCompleted = current >= max;
                  const isClaimed = tp.isClaimed;

                  return (
                    <div
                      key={tp.id || index}
                      className={`u014-row ${isCompleted ? "is-done" : ""}`}
                    >
                      <span className="u014-box" aria-hidden="true">
                        <svg viewBox="0 0 26 26">
                          <path d="M7.5 13.5l3.8 3.8 7.4-8" />
                        </svg>
                      </span>
                      <span className="u014-t flex-1 min-w-0 truncate">
                        {task.taskDesc}
                      </span>
                      <span className="text-[11px] text-[var(--ux-ink-3)] font-medium tabular-nums shrink-0">
                        {current}/{max}
                      </span>
                      {isClaimed ? (
                        <span className="text-[10.5px] font-medium text-[var(--ux-ink-3)] px-2 py-0.5 rounded bg-[var(--ux-surface-3)] shrink-0">
                          Đã nhận
                        </span>
                      ) : isCompleted ? (
                        <button
                          type="button"
                          onClick={() => handleClaimReward(tp.id)}
                          disabled={claimingId === tp.id}
                          className="px-2.5 py-0.5 bg-[var(--ux-accent)] hover:bg-[var(--ux-accent-2)] text-white rounded text-[11px] font-medium transition-colors shrink-0"
                        >
                          {claimingId === tp.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Nhận"
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium tabular-nums shrink-0">
                          {task.rewardXp > 0 && (
                            <span className="text-[var(--ux-accent)]">
                              +{task.rewardXp} EXP
                            </span>
                          )}
                          {task.rewardCoins > 0 && (
                            <span className="text-[var(--ux-warn)]">
                              +{task.rewardCoins} Xu
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-5 border border-dashed border-[var(--ux-line-2)] rounded-xl text-center">
                <Award
                  className="w-5 h-5 text-[var(--ux-ink-3)] mb-1.5"
                  strokeWidth={1.5}
                />
                <p className="text-xs text-[var(--ux-ink-2)]">
                  Không có nhiệm vụ nào hôm nay
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ==================================== */}
        {/* HÀNG 2: VIDEO YÊU THÍCH + HOẠT ĐỘNG GẦN ĐÂY */}
        {/* ==================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* CỘT TRÁI (7/12): VIDEO YÊU THÍCH */}
          <section className="xl:col-span-7 dash-card rounded-2xl p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-semibold text-[var(--ux-ink)] flex items-center gap-2">
                <Heart
                  className="w-4 h-4 text-[var(--ux-danger)]"
                  strokeWidth={1.75}
                />
                Video yêu thích
              </h2>
              {favoriteVideos.length > 3 && (
                <span className="text-[11px] text-[var(--ux-ink-3)]">
                  Lăn chuột để xem thêm
                </span>
              )}
            </div>

            {loadingFavorites ? (
              <div className="flex-1 flex justify-center items-center min-h-[150px]">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--ux-accent)]" />
              </div>
            ) : favoriteVideos.length > 0 ? (
              <div
                ref={favScrollRef}
                className="flex gap-3.5 overflow-x-auto pb-2"
              >
                {favoriteVideos.map((vid: any) => (
                  <div
                    key={vid.videoId}
                    className="w-[210px] sm:w-[225px] shrink-0"
                  >
                    <SpotlightVideoCard
                      title={vid.title}
                      channelTitle={vid.channelTitle}
                      thumbnailUrl={vid.thumbnailUrl}
                      onClick={() => router.push(`/watch/${vid.videoId}`)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[150px] border border-dashed border-[var(--ux-line-2)] rounded-xl text-center p-4">
                <Heart
                  className="w-5 h-5 text-[var(--ux-ink-3)] mb-1.5"
                  strokeWidth={1.5}
                />
                <p className="text-xs text-[var(--ux-ink-2)]">
                  Chưa có video yêu thích
                </p>
              </div>
            )}
          </section>

          {/* CỘT PHẢI (5/12): HOẠT ĐỘNG GẦN ĐÂY */}
          <section className="xl:col-span-5 dash-card rounded-2xl p-4 sm:p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-[var(--ux-ink)] mb-3 flex items-center gap-2">
              <History
                className="w-4 h-4 text-[var(--ux-ink-2)]"
                strokeWidth={1.75}
              />
              Hoạt động gần đây
            </h2>

            <div className="flex flex-col divide-y divide-[var(--ux-line)] flex-1">
              {data?.recentActivities && data.recentActivities.length > 0 ? (
                data.recentActivities.slice(0, 4).map((act: any) => {
                  const config = activityUI[act.type] || activityUI["VIDEO"];
                  const Icon = config.icon;
                  return (
                    <div
                      key={act.id}
                      className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-2)] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--ux-ink)] truncate">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-[var(--ux-ink-3)] truncate">
                          {act.action}
                        </p>
                      </div>
                      <span className="text-[11px] text-[var(--ux-ink-3)] tabular-nums shrink-0">
                        {formatTimeAgo(act.timestamp)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <History
                    className="w-5 h-5 text-[var(--ux-ink-3)] mb-1.5"
                    strokeWidth={1.5}
                  />
                  <p className="text-xs text-[var(--ux-ink-2)]">
                    Chưa có hoạt động nào
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ==================================== */}
        {/* HÀNG 3: DÀNH CHO BẠN (#050) FULL CHIỀU NGANG BÊN DƯỚI */}
        {/* ==================================== */}
        <section className="dash-card rounded-2xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-sm font-semibold text-[var(--ux-ink)] flex items-center gap-2">
              <Compass
                className="w-4 h-4 text-[var(--ux-accent)]"
                strokeWidth={1.75}
              />
              Dành cho bạn
            </h2>
            {recommendedVideos.length > 4 && (
              <span className="text-[11px] text-[var(--ux-ink-3)]">
                Lăn chuột để xem thêm
              </span>
            )}
          </div>

          {loadingRecommended ? (
            <div className="flex-1 flex justify-center items-center min-h-[160px]">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--ux-accent)]" />
            </div>
          ) : recommendedVideos.length > 0 ? (
            <div
              ref={recScrollRef}
              className="flex gap-4 overflow-x-auto pb-2"
            >
              {recommendedVideos.map((vid: any) => (
                <div
                  key={vid.videoId}
                  className="w-[240px] sm:w-[270px] lg:w-[290px] shrink-0"
                >
                  <SpotlightVideoCard
                    title={vid.title}
                    channelTitle={vid.channelTitle}
                    thumbnailUrl={vid.thumbnailUrl}
                    onClick={() => {
                      sessionStorage.setItem(
                        "routeState",
                        JSON.stringify({ video: vid })
                      );
                      router.push(`/watch/${vid.videoId}`);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] border border-dashed border-[var(--ux-line-2)] rounded-xl text-center">
              <Compass
                className="w-6 h-6 text-[var(--ux-ink-3)] mb-2"
                strokeWidth={1.5}
              />
              <p className="text-xs text-[var(--ux-ink-2)]">
                Chưa có đề xuất phù hợp
              </p>
            </div>
          )}
        </section>

        {/* Thông báo nhận thưởng dưới navbar trượt từ dưới lên */}
        {rewardData && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border bg-[var(--ux-surface)] border-[var(--ux-line-2)] text-[var(--ux-accent)] max-w-[90%] md:max-w-md w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Award className="w-[18px] h-[18px] shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm mb-0.5 leading-snug text-[var(--ux-ink)]">
                Hoàn thành nhiệm vụ
              </span>
              <span className="text-xs text-[var(--ux-ink-2)] leading-relaxed">
                🎉 Nhận thưởng +{rewardData.coins} Xu và +{rewardData.xp} EXP!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRewardData(null)}
              className="ml-auto p-1 hover:bg-[var(--ux-surface-2)] rounded-lg transition-colors shrink-0 text-[var(--ux-ink-3)] text-xs font-medium"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
