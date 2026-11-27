// Lucian UX/UI Prompt #009 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#009
// Lucian UX/UI Prompt #050 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#050
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  ListVideo,
  GraduationCap,
  Trophy,
  Award,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCoursesDataAction } from "@/actions/user/learning";
import { RollingActionButton } from "../dashboard/LucianPrimitives";
import "../dashboard/lucian-dashboard.css";

const METEORS = [
  { top: "8%", left: "26%", len: "150px", dur: "4.8s", del: "0.2s" },
  { top: "18%", left: "66%", len: "185px", dur: "5.5s", del: "1.4s" },
  { top: "30%", left: "84%", len: "130px", dur: "4.4s", del: "2.8s" },
  { top: "48%", left: "40%", len: "170px", dur: "5.6s", del: "0.9s" },
  { top: "64%", left: "74%", len: "145px", dur: "5.0s", del: "2.3s" },
];

type CourseFilter = "all" | "in_progress" | "completed";

function SpotlightCourseCard({
  playlist,
  onClick,
}: {
  playlist: any;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = cardRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    el.classList.add("is-live");
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.style.setProperty("--ry", `${((x - 0.5) * 7).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * 5).toFixed(2)}deg`);
  };

  const handlePointerLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove("is-live");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const gradeStyle: Record<string, string> = {
    "Xuất sắc":
      "bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] border-[var(--ux-accent)]/25",
    Giỏi: "bg-[var(--ux-mint)]/12 text-[var(--ux-mint)] border-[var(--ux-mint)]/25",
    Khá: "bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] border-[var(--ux-line)]",
    "Trung bình":
      "bg-[var(--ux-warn)]/12 text-[var(--ux-warn)] border-[var(--ux-warn)]/25",
    "Chưa đạt":
      "bg-[var(--ux-surface-3)] text-[var(--ux-ink-3)] border-[var(--ux-line)]",
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="ux u050-card dash-card group flex flex-row md:flex-col p-3 gap-3 text-left"
    >
      <span className="u050-glare" aria-hidden="true" />

      <div className="relative w-[132px] sm:w-[160px] md:w-full aspect-video rounded-[8px] bg-[var(--ux-surface-3)] overflow-hidden shrink-0 border border-[var(--ux-line)]">
        <img
          src={playlist.thumbnailUrl}
          alt={playlist.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="w-9 h-9 rounded-full bg-black/65 text-white flex items-center justify-center">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </span>
        </div>
        <div className="absolute right-2 bottom-2 bg-black/75 px-2 py-0.5 rounded-md flex items-center gap-1 text-white border border-white/10">
          <ListVideo className="w-3 h-3" strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Playlist</span>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 justify-between gap-3">
        <div>
          <h3
            className="font-medium text-sm text-[var(--ux-ink)] line-clamp-2 leading-snug group-hover:text-[var(--ux-accent)] transition-colors duration-200"
            dangerouslySetInnerHTML={{ __html: playlist.title }}
          />
          <p className="text-xs text-[var(--ux-ink-3)] mt-1 truncate">
            {playlist.channelTitle}
          </p>
        </div>

        <div className="bg-[var(--ux-surface-2)] rounded-[10px] p-3 border border-[var(--ux-line)] space-y-2.5">
          <div className="space-y-1 pb-2 border-b border-[var(--ux-line)] text-xs tabular-nums">
            <div className="flex justify-between items-center">
              <span className="text-[var(--ux-ink-3)]">Video Quizzes</span>
              <span className="font-medium text-[var(--ux-ink)]">
                {playlist.videoScore}
                <span className="text-[var(--ux-ink-3)] font-normal">/100</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--ux-ink-3)]">AI Cuối khóa</span>
              <span className="font-medium text-[var(--ux-ink)]">
                {playlist.summaryScore}
                <span className="text-[var(--ux-ink-3)] font-normal">/100</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 tabular-nums">
            <div>
              <p className="text-[11px] text-[var(--ux-ink-3)]">Tổng kết</p>
              <p
                className={`text-lg font-semibold leading-tight ${
                  playlist.isCompleted
                    ? "text-[var(--ux-accent)]"
                    : "text-[var(--ux-ink)]"
                }`}
              >
                {playlist.finalScore}{" "}
                <span className="text-xs font-normal text-[var(--ux-ink-3)]">
                  điểm
                </span>
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 shrink-0 ${
                gradeStyle[playlist.grade] || gradeStyle["Chưa đạt"]
              }`}
            >
              {playlist.grade === "Xuất sắc" && (
                <Award className="w-3 h-3" strokeWidth={1.75} />
              )}
              {playlist.grade}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CourseFilter>("all");

  useEffect(() => {
    if (session?.user?.id) {
      getCoursesDataAction(session.user.id).then((res) => {
        if (res.success) setData(res.data);
        setLoading(false);
      });
    } else if (session === null) {
      setLoading(false);
    }
  }, [session]);

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
        Vui lòng đăng nhập để xem Khóa học
      </div>
    );
  }

  const playlists = data?.playlists || [];
  const totalPlaylists = playlists.length;
  const completedPlaylists = playlists.filter((p: any) => p.isCompleted).length;
  const inProgressPlaylists = totalPlaylists - completedPlaylists;
  const completionRate =
    totalPlaylists > 0
      ? Math.round((completedPlaylists / totalPlaylists) * 100)
      : 0;

  const filteredPlaylists = playlists.filter((p: any) => {
    if (filter === "completed") return p.isCompleted;
    if (filter === "in_progress") return !p.isCompleted;
    return true;
  });

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
        {/* HERO TỔNG QUAN KHÓA HỌC */}
        <section className="dash-hero-card rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ux-ink)] tracking-[-0.02em]">
                Khóa học của tôi
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] mt-1">
                Đạt tối thiểu 50 điểm tổng kết (Video Quizzes + AI Cuối khóa) để
                hoàn thành một khóa học
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shrink-0 tabular-nums">
            <div className="flex items-center gap-3 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-xl px-4 py-2.5">
              <div>
                <p className="text-[11px] text-[var(--ux-ink-3)]">Đang học</p>
                <p className="text-xl font-semibold text-[var(--ux-ink)] leading-tight">
                  {inProgressPlaylists}
                </p>
              </div>
              <div className="w-px h-8 bg-[var(--ux-line)]" />
              <div>
                <p className="text-[11px] text-[var(--ux-ink-3)] flex items-center gap-1">
                  <Trophy
                    className="w-3 h-3 text-[var(--ux-mint)]"
                    strokeWidth={1.75}
                  />
                  Hoàn thành
                </p>
                <p className="text-xl font-semibold text-[var(--ux-mint)] leading-tight">
                  {completedPlaylists}
                </p>
              </div>
              <div className="w-px h-8 bg-[var(--ux-line)] hidden sm:block" />
              <div className="hidden sm:block">
                <p className="text-[11px] text-[var(--ux-ink-3)]">Tỷ lệ đạt</p>
                <p className="text-xl font-semibold text-[var(--ux-accent)] leading-tight">
                  {completionRate}%
                </p>
              </div>
            </div>

            <RollingActionButton
              label="Khám phá thêm"
              onClick={() => router.push("/dashboard")}
            />
          </div>
        </section>

        {/* THANH TIÊU ĐỀ + BỘ LỌC */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--ux-ink)] flex items-center gap-2">
            <ListVideo
              className="w-4 h-4 text-[var(--ux-accent)]"
              strokeWidth={1.75}
            />
            Playlist đang theo dõi
            <span className="text-xs font-medium tabular-nums text-[var(--ux-ink-3)]">
              ({filteredPlaylists.length})
            </span>
          </h2>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--ux-surface-2)] border border-[var(--ux-line)]">
            {[
              { id: "all" as CourseFilter, label: "Tất cả" },
              { id: "in_progress" as CourseFilter, label: "Đang học" },
              { id: "completed" as CourseFilter, label: "Hoàn thành" },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-[var(--ux-surface)] text-[var(--ux-ink)] shadow-xs border border-[var(--ux-line)]"
                      : "text-[var(--ux-ink-3)] hover:text-[var(--ux-ink)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DANH SÁCH PLAYLIST */}
        {filteredPlaylists.length === 0 ? (
          <div className="dash-card rounded-2xl p-10 text-center flex flex-col items-center justify-center border border-dashed border-[var(--ux-line-2)]">
            <div className="w-12 h-12 bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] rounded-xl flex items-center justify-center mb-3">
              <ListVideo className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-semibold text-[var(--ux-ink)] mb-1">
              {totalPlaylists === 0
                ? "Chưa có khóa học nào"
                : "Không có khóa học phù hợp bộ lọc"}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] max-w-md mb-5">
              {totalPlaylists === 0
                ? "Tìm kiếm chủ đề yêu thích và nhấn Lưu Playlist để theo dõi tiến độ học tập"
                : "Thử chuyển sang mục Tất cả để xem toàn bộ playlist đã lưu"}
            </p>
            {totalPlaylists === 0 && (
              <RollingActionButton
                label="Tìm khóa học"
                onClick={() => router.push("/dashboard")}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredPlaylists.map((playlist: any) => (
              <SpotlightCourseCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => router.push(`/playlist/${playlist.playlistId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
