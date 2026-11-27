// Lucian UX/UI Prompt #009 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#009
// Lucian UX/UI Prompt #050 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#050
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Award,
  RotateCcw,
  Target,
  BookOpen,
} from "lucide-react";
import { getUserQuizHistoryAction } from "@/actions/quiz/attempt";
import { RollingActionButton } from "../dashboard/LucianPrimitives";
import "../dashboard/lucian-dashboard.css";

const METEORS = [
  { top: "7%", left: "22%", len: "150px", dur: "4.7s", del: "0.1s" },
  { top: "17%", left: "64%", len: "180px", dur: "5.4s", del: "1.5s" },
  { top: "29%", left: "86%", len: "135px", dur: "4.3s", del: "2.9s" },
  { top: "47%", left: "38%", len: "170px", dur: "5.7s", del: "0.8s" },
  { top: "63%", left: "72%", len: "145px", dur: "5.1s", del: "2.2s" },
];

const categories = [
  { name: "Python", keywords: ["python", "django", "flask", "fastapi", "pandas", "numpy", "lập trình python", "python cơ bản"] },
  { name: "Java", keywords: ["java", "spring", "hibernate", "maven", "jsp", "lập trình java", "java core"] },
  { name: "JavaScript", keywords: ["javascript", "js", "es6", "typescript", "ts", "lập trình javascript", "js cơ bản"] },
  { name: "React & Next", keywords: ["react", "nextjs", "next.js", "tailwind", "hook", "redux", "reactjs", "frontend react"] },
  { name: "Node.js", keywords: ["node", "express", "nest", "backend", "api", "nodejs", "nestjs", "backend nodejs"] },
  { name: "C / C++", keywords: ["c", "c++", "cpp", "oop", "lập trình c", "lập trình c++"] },
  { name: "C#", keywords: ["c#", ".net", "asp.net", "winform", "unity", "lập trình c#"] },
  { name: "PHP", keywords: ["php", "laravel", "wordpress", "lập trình php"] },
  { name: "Go", keywords: ["golang", "go language", "gin", "lập trình go"] },
  { name: "Rust", keywords: ["rust", "cargo", "lập trình rust"] },
  { name: "Android", keywords: ["android", "kotlin", "java android", "lập trình android"] },
  { name: "iOS", keywords: ["ios", "swift", "swiftui", "lập trình ios"] },
  { name: "Flutter", keywords: ["flutter", "dart", "flutter cơ bản", "lập trình flutter"] },
  { name: "React Native", keywords: ["react native", "mobile app", "ứng dụng di động"] },
  { name: "Frontend", keywords: ["frontend", "html", "css", "responsive", "ui", "giao diện web"] },
  { name: "Backend", keywords: ["backend", "server", "rest api", "authentication", "xây dựng api"] },
  { name: "Database", keywords: ["sql", "mysql", "postgresql", "mongodb", "oracle", "cơ sở dữ liệu"] },
  { name: "DevOps", keywords: ["docker", "kubernetes", "ci/cd", "linux", "nginx", "triển khai server"] },
  { name: "AI / Machine Learning", keywords: ["ai", "machine learning", "deep learning", "tensorflow", "pytorch", "trí tuệ nhân tạo", "học máy"] },
  { name: "Data Science", keywords: ["data science", "data analysis", "visualization", "statistics", "khoa học dữ liệu", "phân tích dữ liệu"] },
  { name: "Cyber Security", keywords: ["security", "cybersecurity", "hacking", "encryption", "aes", "des", "an toàn thông tin", "bảo mật"] },
  { name: "Tiếng Việt", keywords: ["tiếng việt", "ngữ văn", "văn học", "phân tích thơ", "tập làm văn"] },
  { name: "Tiếng Anh", keywords: ["english", "tiếng anh", "toeic", "ielts", "grammar", "vocabulary", "ngữ pháp tiếng anh"] },
  { name: "Tiếng Nhật", keywords: ["japanese", "jlpt", "hiragana", "katakana", "tiếng nhật", "kanji"] },
  { name: "Tiếng Trung", keywords: ["chinese", "hsk", "tiếng trung", "pinyin"] },
  { name: "Toán học", keywords: ["toán", "math", "đại số", "giải tích", "hình học", "toán học cơ bản"] },
  { name: "Xác suất thống kê", keywords: ["xác suất", "thống kê", "probability", "statistics"] },
  { name: "Toán cao cấp", keywords: ["calculus", "linear algebra", "ma trận", "vector", "toán cao cấp"] },
  { name: "Cấu trúc dữ liệu & Giải thuật", keywords: ["dsa", "algorithm", "data structure", "linked list", "tree", "cấu trúc dữ liệu", "giải thuật"] },
  { name: "Hệ điều hành", keywords: ["os", "operating system", "linux kernel", "process", "hệ điều hành"] },
  { name: "Mạng máy tính", keywords: ["network", "tcp/ip", "router", "socket", "mạng máy tính"] },
  { name: "Cơ sở dữ liệu", keywords: ["database", "normalization", "sql server", "thiết kế cơ sở dữ liệu"] },
  { name: "Trí tuệ nhân tạo", keywords: ["artificial intelligence", "ai", "expert system", "trí tuệ nhân tạo"] },
  { name: "Kỹ thuật phần mềm", keywords: ["software engineering", "uml", "agile", "scrum", "kỹ thuật phần mềm"] },
  { name: "Vật lý", keywords: ["physics", "điện", "quang học", "cơ học", "vật lý"] },
  { name: "Hóa học", keywords: ["chemistry", "hóa", "phản ứng", "hữu cơ", "hóa học"] },
  { name: "Sinh học", keywords: ["biology", "dna", "genetics", "sinh học"] },
  { name: "Lịch sử", keywords: ["lịch sử", "history", "chiến tranh", "vua"] },
  { name: "Địa lý", keywords: ["địa lý", "geography", "climate", "khí hậu"] },
  { name: "Kinh tế", keywords: ["economics", "kinh tế", "microeconomics", "macroeconomics"] },
  { name: "Marketing", keywords: ["marketing", "seo", "branding", "digital marketing", "tiếp thị"] },
  { name: "Quản trị kinh doanh", keywords: ["business", "management", "startup", "quản trị kinh doanh"] },
  { name: "Thiết kế đồ họa", keywords: ["design", "photoshop", "illustrator", "figma", "thiết kế đồ họa"] },
  { name: "UI/UX", keywords: ["ui", "ux", "wireframe", "prototype", "thiết kế giao diện"] },
  { name: "Kỹ năng mềm", keywords: ["soft skill", "communication", "teamwork", "kỹ năng mềm", "giao tiếp"] },
  { name: "Triết học", keywords: ["philosophy", "triết học", "marx", "lenin"] },
  { name: "Pháp luật", keywords: ["law", "pháp luật", "hiến pháp", "luật"] },
];

function SpotlightQuizCard({
  attempt,
  onClick,
}: {
  attempt: any;
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

  const videoId = attempt.video?.youtubeUrl;
  const date = new Date(attempt.createdAt).toLocaleDateString("vi-VN");
  const total = attempt.totalQuizzes || 1;
  const scorePercentage = Math.round((attempt.correctCount / total) * 100);

  const badgeTone =
    scorePercentage >= 80
      ? "bg-[var(--ux-mint)]/12 text-[var(--ux-mint)] border-[var(--ux-mint)]/25"
      : scorePercentage >= 50
      ? "bg-[var(--ux-warn)]/12 text-[var(--ux-warn)] border-[var(--ux-warn)]/25"
      : "bg-[var(--ux-danger)]/12 text-[var(--ux-danger)] border-[var(--ux-danger)]/25";

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

      <div className="relative w-[132px] sm:w-[160px] md:w-full aspect-video rounded-[8px] overflow-hidden shrink-0 bg-[var(--ux-surface-3)] border border-[var(--ux-line)]">
        <img
          src={
            attempt.video?.thumbnailUrl ||
            `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
          }
          className="w-full h-full object-cover"
          alt={attempt.video?.title || "Quiz thumbnail"}
        />
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded-md text-[10.5px] font-medium text-white tabular-nums border border-white/10">
          {date}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0 gap-3">
        <div>
          <h3 className="text-sm font-medium text-[var(--ux-ink)] line-clamp-2 leading-snug group-hover:text-[var(--ux-accent)] transition-colors duration-200">
            {attempt.video?.title || "Bài luyện tập"}
          </h3>
        </div>

        <div className="space-y-2.5 mt-auto">
          <div className="flex items-center justify-between gap-2 bg-[var(--ux-surface-2)] rounded-[10px] p-2.5 border border-[var(--ux-line)] tabular-nums">
            <div>
              <p className="text-[11px] text-[var(--ux-ink-3)]">Kết quả</p>
              <p className="text-sm font-semibold text-[var(--ux-ink)]">
                {attempt.correctCount}/{attempt.totalQuizzes}{" "}
                <span className="text-xs font-normal text-[var(--ux-ink-3)]">
                  câu đúng
                </span>
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-md border text-xs font-semibold shrink-0 ${badgeTone}`}
            >
              {scorePercentage}%
            </span>
          </div>

          <div className="hidden md:flex w-full py-2 items-center justify-center gap-1.5 bg-[var(--ux-surface-2)] group-hover:bg-[var(--ux-accent)] border border-[var(--ux-line)] group-hover:border-[var(--ux-accent)] rounded-[9px] text-xs font-medium text-[var(--ux-ink-2)] group-hover:text-white transition-colors duration-200">
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            Làm lại bài tập
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryQuizzPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>("Tất cả");

  useEffect(() => {
    if (session?.user?.id) {
      getUserQuizHistoryAction(session.user.id).then((res) => {
        if (res.success) setHistory(res.data || []);
        setLoading(false);
      });
    } else if (session === null) {
      setLoading(false);
    }
  }, [session]);

  const handleRetakeQuiz = (attempt: any) => {
    const videoId = attempt.video?.youtubeUrl;
    if (!videoId) return;

    if (
      !attempt.questionsData ||
      attempt.questionsData === "null" ||
      attempt.questionsData === "[]" ||
      attempt.questionsData.length === 0
    ) {
      alert("Bài tập này đang bị trống dữ liệu câu hỏi cũ.");
      return;
    }

    const isPlaylist = videoId.startsWith("PL");

    sessionStorage.setItem(
      "routeState",
      JSON.stringify({
        isReviewMode: true,
        pastQuizData: attempt.questionsData,
        ...(isPlaylist ? { playlistId: videoId } : { video: attempt.video }),
      })
    );

    if (isPlaylist) {
      router.push(`/playlist/${videoId}`);
    } else {
      router.push(`/historyquizz`);
    }
  };

  if (loading) {
    return (
      <div className="dash-bg-gradient flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ux-accent)]" />
        <p className="text-xs text-[var(--ux-ink-2)]">
          Đang tải lịch sử luyện tập...
        </p>
      </div>
    );
  }

  const groupedHistory = history.reduce((acc: Record<string, any[]>, item) => {
    let topic = "Chủ đề khác";
    if (item.video) {
      const textToSearch = `${item.video.title || ""} ${
        item.video.channelName || ""
      }`.toLowerCase();
      for (const category of categories) {
        const matched = category.keywords.some((keyword) => {
          const kw = keyword.toLowerCase();
          if (kw === "c") return /(^|\s)c(\s|$|[.,!?;:])/.test(textToSearch);
          return textToSearch.includes(kw);
        });

        if (matched) {
          topic = category.name;
          break;
        }
      }
    }

    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(item);
    return acc;
  }, {});

  const topics = Object.keys(groupedHistory);
  const visibleEntries =
    selectedTopic === "Tất cả"
      ? Object.entries(groupedHistory)
      : Object.entries(groupedHistory).filter(([t]) => t === selectedTopic);

  const avgScore =
    history.length > 0
      ? Math.round(
          history.reduce(
            (sum, item) =>
              sum + (item.correctCount / (item.totalQuizzes || 1)) * 100,
            0
          ) / history.length
        )
      : 0;

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
        {/* HERO TỔNG QUAN GÓC LUYỆN TẬP */}
        <section className="dash-hero-card rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ux-ink)] tracking-[-0.02em]">
                Góc luyện tập
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] mt-1">
                Xem lại lịch sử làm bài và ôn tập nhanh các chủ đề đã học
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shrink-0 tabular-nums">
            <div className="flex items-center gap-4 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-xl px-4 py-2.5">
              <div>
                <p className="text-[11px] text-[var(--ux-ink-3)]">Bài đã làm</p>
                <p className="text-xl font-semibold text-[var(--ux-ink)] leading-tight">
                  {history.length}
                </p>
              </div>
              <div className="w-px h-8 bg-[var(--ux-line)]" />
              <div>
                <p className="text-[11px] text-[var(--ux-ink-3)]">Điểm TB</p>
                <p className="text-xl font-semibold text-[var(--ux-mint)] leading-tight">
                  {avgScore}%
                </p>
              </div>
            </div>

            <RollingActionButton
              label="Khám phá bài học"
              onClick={() => router.push("/dashboard")}
            />
          </div>
        </section>

        {/* BỘ LỌC CHỦ ĐỀ */}
        {topics.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["Tất cả", ...topics].map((topic) => {
              const active = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                    active
                      ? "bg-[var(--ux-accent)] text-white border-[var(--ux-accent)]"
                      : "bg-[var(--ux-surface-2)] text-[var(--ux-ink-2)] border-[var(--ux-line)] hover:text-[var(--ux-ink)]"
                  }`}
                >
                  {topic}
                  {topic !== "Tất cả" && (
                    <span className="ml-1.5 opacity-75 tabular-nums">
                      ({groupedHistory[topic].length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* DANH SÁCH LỊCH SỬ BÀI TẬP */}
        {history.length === 0 ? (
          <div className="dash-card rounded-2xl p-10 text-center flex flex-col items-center justify-center border border-dashed border-[var(--ux-line-2)]">
            <div className="w-12 h-12 bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] rounded-xl flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-semibold text-[var(--ux-ink)] mb-1">
              Chưa có dữ liệu bài tập
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] max-w-md mb-5">
              Bạn chưa thực hiện bài kiểm tra nào. Chọn một video để bắt đầu
              luyện tập ngay
            </p>
            <RollingActionButton
              label="Khám phá bài học"
              onClick={() => router.push("/dashboard")}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {visibleEntries.map(([topic, items]) => (
              <section key={topic} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-[var(--ux-line)] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] flex items-center justify-center">
                      <Award className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <h2 className="text-sm font-semibold text-[var(--ux-ink)]">
                      {topic}
                    </h2>
                    <span className="text-xs text-[var(--ux-ink-3)] tabular-nums">
                      ({items.length})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {items.map((attempt: any) => (
                    <SpotlightQuizCard
                      key={attempt.id}
                      attempt={attempt}
                      onClick={() => handleRetakeQuiz(attempt)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
