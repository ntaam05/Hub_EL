"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Award, 
  RotateCcw, 
  Target, 
  BookOpen
} from 'lucide-react';
import { getUserQuizHistoryAction } from '@/actions/quiz/attempt';

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
  { name: "Pháp luật", keywords: ["law", "pháp luật", "hiến pháp", "luật"] }
];

export default function HistoryQuizzPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. LẤY DỮ LIỆU TỪ SERVER
  useEffect(() => {
    if (session?.user?.id) {
      getUserQuizHistoryAction(session.user.id).then(res => {
        if (res.success) setHistory(res.data || []);
        setLoading(false);
      });
    } else if (session === null) {
      setLoading(false);
    }
  }, [session]);

  // HÀM CHUYỂN HƯỚNG LÀM LẠI BÀI TẬP
  const handleRetakeQuiz = (attempt: any) => {
    const videoId = attempt.video?.youtubeUrl;
    if (!videoId) return;

    if (!attempt.questionsData || attempt.questionsData === "null" || attempt.questionsData === "[]" || attempt.questionsData.length === 0) {
      alert("⚠️ LỖI DỮ LIỆU: Bài tập này đang bị trống dữ liệu câu hỏi cũ.");
      return;
    }

    const isPlaylist = videoId.startsWith("PL");

    sessionStorage.setItem('routeState', JSON.stringify({
        isReviewMode: true,
        pastQuizData: attempt.questionsData,
        ...(isPlaylist ? { playlistId: videoId } : { video: attempt.video })
    }));

    if (isPlaylist) {
      router.push(`/playlist/${videoId}`);
    } else {
      router.push(`/historyquizz`); 
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-40 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-slate-500 font-medium animate-pulse">Đang tải lịch sử học tập...</p>
      </div>
    );
  }

  // Phân nhóm lịch sử theo chủ đề (Playlist/Topic)
  const groupedHistory = history.reduce((acc: any, item) => {
    let topic = "Chủ đề Khác";
    if (item.video) {
      const textToSearch = `${item.video.title || ""} ${item.video.channelName || ""}`.toLowerCase();
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

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#020617] font-sans flex flex-col overflow-x-hidden">
      
      {/* Lớp ánh sáng Glow màu Tím/Indigo và Pattern chìm */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-indigo-500/15 dark:bg-indigo-600/10 rounded-full blur-[150px]" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.02]" />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 w-full px-4 sm:px-6 lg:px-10 2xl:px-16 relative z-10 pb-24 md:pb-12 pt-6 md:pt-10 flex flex-col flex-1 h-full">
        
        {/* Header trang lịch sử */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 mb-6 md:mb-10 drop-shadow-sm">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg md:rounded-xl shrink-0">
                <Target className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-0.5 md:mb-1 tracking-tight">
                Góc Luyện Tập
              </h1>
              <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Xem lại quá trình chinh phục kiến thức và ôn tập các bài học đã qua.
              </p>
            </div>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700/80 text-center shadow-sm">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-indigo-500" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-2">Chưa có dữ liệu bài tập</h3>
            <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-8 max-w-sm mx-auto">Bạn chưa thực hiện bài tập nào. Hãy chọn một video và bắt đầu học ngay nhé!</p>
            <button onClick={() => router.push('/explore')} className="px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl md:rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95">
              Khám phá bài học
            </button>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {Object.entries(groupedHistory).map(([topic, items]: [string, any]) => {
              return (
                <div key={topic} className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 pb-3 md:pb-4 drop-shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-md">
                        <Award className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{topic}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                    {items.map((attempt: any) => {
                      const videoId = attempt.video?.youtubeUrl;
                      const date = new Date(attempt.createdAt).toLocaleDateString('vi-VN');
                      const scorePercentage = (attempt.correctCount / attempt.totalQuizzes) * 100;

                      return (
                        // Gắn onClick vào thẻ div bọc ngoài và thêm class cursor-pointer
                        <div 
                          key={attempt.id} 
                          onClick={() => handleRetakeQuiz(attempt)}
                          className="group cursor-pointer flex flex-row md:flex-col bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all overflow-hidden hover:-translate-y-1"
                        >
                          
                          {/* KHU VỰC ẢNH BÌA */}
                          <div className="relative w-[130px] md:w-full aspect-video overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border-r md:border-r-0 md:border-b border-slate-100/50 dark:border-slate-800">
                            <img 
                              src={attempt.video?.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              alt={attempt.video?.title}
                            />
                            <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 px-2 md:px-3 py-0.5 md:py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] md:text-[10px] font-black text-white border border-white/20 shadow-sm">
                              {date}
                            </div>
                            
                            <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent items-end p-4">
                              <p className="text-white text-xs lg:text-sm font-bold line-clamp-2 leading-relaxed drop-shadow-md">
                                {attempt.video?.title}
                              </p>
                            </div>
                          </div>

                          {/* KHU VỰC THÔNG TIN & ĐIỂM SỐ */}
                          <div className="p-3 md:p-5 flex-1 flex flex-col justify-center min-w-0">
                            
                            <p className="md:hidden text-slate-800 dark:text-slate-100 text-[11px] font-bold line-clamp-2 mb-2 leading-snug">
                              {attempt.video?.title}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex flex-col">
                                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-400 font-black mb-0.5 md:mb-1">Kết quả</span>
                                <span className="text-sm md:text-lg font-black text-slate-800 dark:text-white drop-shadow-sm">
                                  {attempt.correctCount}/{attempt.totalQuizzes} <span className="text-[9px] md:text-xs text-slate-400 font-medium">câu đúng</span>
                                </span>
                              </div>
                              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center border-2 shadow-sm ${
                                scorePercentage >= 80 ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400' : 
                                scorePercentage >= 50 ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400' : 
                                'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
                              }`}>
                                <span className="text-[10px] md:text-xs font-black">{Math.round(scorePercentage)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* NÚT BẤM (NẰM DƯỚI CÙNG TRÊN PC ĐỂ LÀM CHỈ DẪN TRỰC QUAN) */}
                          <div className="hidden md:block px-5 pb-5 pt-1">
                            <button 
                              type="button"
                              className="w-full py-3 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all shadow-sm pointer-events-none"
                            >
                              <RotateCcw className="w-4 h-4" />
                              LÀM LẠI BÀI TẬP
                            </button>
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}