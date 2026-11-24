"use client";

import { useEffect } from "react";
import Link from "next/link";
import { 
  Zap, BrainCircuit, ShieldCheck, Star, 
  ChevronDown, Sparkles, ArrowRight, Trophy, 
  Gamepad2
} from "lucide-react";

export default function HomePage() {
  // Hiệu ứng cuộn chuột hiển thị tính năng (Scroll Reveal)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show-reveal");
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#0d1117] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
      
      {/* 🚨 THANH HEADER LANDING PAGE (ĐÃ THÊM MENU TRƯỢT TRANG) */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight hidden sm:block">Hub-EL</span>
          </div>

          {/* 🚨 MENU ĐIỀU HƯỚNG TRƯỢT TRANG (NẰM Ở GIỮA) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
            <Link href="#ai-quiz" className="hover:text-purple-400 transition-colors flex items-center gap-2">
              <BrainCircuit className="w-4 h-4"/> AI Quiz
            </Link>
            <Link href="#wiki-gacha" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
              <Star className="w-4 h-4"/> Thẻ Wiki
            </Link>
            <Link href="#leaderboard" className="hover:text-blue-400 transition-colors flex items-center gap-2">
              <Trophy className="w-4 h-4"/> Bảng Vàng
            </Link>
          </nav>
          
          {/* Nút Đăng nhập / Đăng ký */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/register" className="hidden lg:block text-sm font-bold text-slate-300 hover:text-white transition-colors">
              Đăng ký
            </Link>
            <Link 
              href="/login" 
              className="px-5 sm:px-6 py-2.5 rounded-full bg-white text-black font-black text-sm hover:bg-blue-50 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-2"
            >
              Đăng nhập <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* NỀN GRID KHÔNG GIAN (GITHUB STYLE) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#0d1117]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[600px] bg-gradient-to-b from-blue-900/40 via-purple-900/10 to-transparent blur-[120px]"></div>
      </div>

      {/* HERO SECTION */}
      <main className="relative z-10 container mx-auto px-6 pt-40 pb-32 min-h-screen flex flex-col items-center justify-center text-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-bold text-blue-400 animate-in fade-in slide-in-from-bottom-4 duration-1000 mb-8 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <Sparkles className="w-4 h-4" />
          Nền tảng học tập thế hệ 5.0
        </div>
        
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both max-w-5xl mx-auto">
          Khai phóng <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Tiềm năng học tập
          </span>
        </h1>
        
        <p className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          Hub-EL kết hợp sức mạnh phân tích của trí tuệ nhân tạo (AI) và cơ chế gây nghiện của Gamification. Biến mỗi giờ học khô khan thành một hành trình phiêu lưu đầy thú vị.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
          <Link href="/login" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-2">
            Bắt đầu trải nghiệm ngay <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-12 text-sm text-slate-500 font-bold animate-in fade-in duration-1000 delay-700 fill-mode-both">
          <div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-400" /> Công nghệ AI</div>
          <div className="flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-yellow-400" /> Gamification</div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Bảo mật & Riêng tư</div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-600 hidden md:block">
          <ChevronDown className="w-8 h-8" />
        </div>
      </main>

      {/* CÁC PHÂN ĐOẠN GIỚI THIỆU TRƯỢT XUỐNG */}
      <div className="relative z-10 container mx-auto px-6 py-24 space-y-40">
        
        {/* 🚨 SECTION 1: AI QUIZ (Có gắn ID id="ai-quiz") */}
        <section id="ai-quiz" className="scroll-mt-24 grid lg:grid-cols-2 gap-16 items-center reveal-on-scroll">
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <BrainCircuit className="w-7 h-7 text-purple-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black">AI tạo bài tập <br/><span className="text-purple-400">tự động</span></h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Bạn chỉ cần dán link bất kỳ video học thuật nào từ YouTube. Hệ thống AI của chúng tôi sẽ phân tích giọng nói, trích xuất kiến thức cốt lõi và tự động tạo ra một bài trắc nghiệm độc quyền dành riêng cho bạn.
            </p>
            <ul className="space-y-3 text-slate-300 font-medium">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"/> Hỗ trợ mọi chủ đề và ngôn ngữ.</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"/> Giải thích chi tiết đáp án bằng AI.</li>
            </ul>
          </div>
          <div className="relative h-[400px] w-full rounded-3xl bg-gradient-to-br from-purple-900/20 to-[#0d1117] border border-purple-500/20 p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col justify-center overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full"></div>
             <div className="w-full bg-[#161b22] border border-slate-700 rounded-2xl p-6 shadow-2xl relative z-10 animate-pulse-slow">
                <div className="w-1/3 h-4 bg-slate-700 rounded-full mb-6"></div>
                <div className="space-y-3">
                  <div className="w-full h-12 border border-slate-700 rounded-xl bg-slate-800/50 flex items-center px-4"><div className="w-1/2 h-3 bg-slate-600 rounded-full"></div></div>
                  <div className="w-full h-12 border border-purple-500/50 rounded-xl bg-purple-500/10 flex items-center px-4"><div className="w-2/3 h-3 bg-purple-400 rounded-full"></div></div>
                  <div className="w-full h-12 border border-slate-700 rounded-xl bg-slate-800/50 flex items-center px-4"><div className="w-1/3 h-3 bg-slate-600 rounded-full"></div></div>
                </div>
             </div>
          </div>
        </section>

        {/* 🚨 SECTION 2: GACHA SYSTEM (Có gắn ID id="wiki-gacha") */}
        <section id="wiki-gacha" className="scroll-mt-24 grid lg:grid-cols-2 gap-16 items-center reveal-on-scroll">
          <div className="order-2 lg:order-1 relative h-[400px] w-full rounded-3xl bg-gradient-to-br from-yellow-900/20 to-[#0d1117] border border-yellow-500/20 p-8 shadow-[0_0_50px_rgba(234,179,8,0.1)] flex items-center justify-center overflow-hidden">
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/20 blur-[80px] rounded-full"></div>
             <div className="w-48 h-72 bg-gradient-to-tr from-yellow-600 to-yellow-300 rounded-2xl p-1 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500 relative z-10">
                <div className="w-full h-full bg-[#161b22] rounded-xl flex flex-col items-center justify-center p-4">
                   <Star className="w-16 h-16 text-yellow-500 mb-4" />
                   <div className="w-24 h-3 bg-yellow-500/20 rounded-full mb-2"></div>
                   <div className="w-16 h-2 bg-slate-700 rounded-full"></div>
                </div>
             </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Star className="w-7 h-7 text-yellow-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black">Hệ thống <span className="text-yellow-400">Thẻ Wiki</span></h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Tạm biệt cách học nhàm chán! Mỗi khi hoàn thành bài học, bạn sẽ nhận được xu để quay Gacha. Mở khóa và sưu tầm hàng trăm Thẻ bài tri thức với các độ hiếm khác nhau.
            </p>
            <ul className="space-y-3 text-slate-300 font-medium">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/> Thẻ bài chứa kiến thức tóm tắt từ Wikipedia.</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/> Chia sẻ bộ sưu tập độc quyền với bạn bè.</li>
            </ul>
          </div>
        </section>

        {/* 🚨 SECTION 3: LEADERBOARD (Có gắn ID id="leaderboard") */}
        <section id="leaderboard" className="scroll-mt-24 grid lg:grid-cols-2 gap-16 items-center reveal-on-scroll">
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black">Bảng Vàng <br/><span className="text-blue-400">Danh Dự</span></h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Bạn không hề đơn độc. Ghi danh mình lên bảng xếp hạng Real-time cùng hàng ngàn học viên khác thông qua việc cày cuốc kinh nghiệm (XP) và trả lời chính xác các câu hỏi khó.
            </p>
            <div className="pt-4">
               <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-2">
                 Tham gia đường đua ngay <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>
          <div className="relative w-full rounded-3xl bg-[#161b22] border border-slate-700 p-6 shadow-2xl flex flex-col gap-3">
             {[1, 2, 3].map((rank) => (
                <div key={rank} className={`w-full p-4 rounded-xl flex items-center justify-between ${rank === 1 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-[#0d1117] border border-slate-800'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`font-black text-lg ${rank === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>#{rank}</span>
                    <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                    <div className="space-y-1.5">
                      <div className="w-24 h-3 rounded-full bg-slate-600"></div>
                      <div className="w-16 h-2 rounded-full bg-slate-700"></div>
                    </div>
                  </div>
                  <div className="w-12 h-4 rounded-full bg-blue-500/20"></div>
                </div>
             ))}
          </div>
        </section>

      </div>

      <footer className="relative z-10 py-12 text-center text-slate-600 text-sm font-medium border-t border-white/5 mt-20">
        © 2026 Hub-EL Platform. Build with Passion & AI.
      </footer>

      <style jsx global>{`
        /* 🚨 ĐẢM BẢO CUỘN MƯỢT MÀ */
        html { scroll-behavior: smooth; }

        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(60px);
          transition: all 1s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal-on-scroll.show-reveal {
          opacity: 1;
          transform: translateY(0);
        }
        
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}