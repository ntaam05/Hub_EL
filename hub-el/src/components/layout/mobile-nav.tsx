"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Book, BrainCircuit, Users, Trophy, Target } from "lucide-react"; // Đổi Tv thành Book
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  // Logic: Kiểm tra route hiện tại có trùng khớp với path truyền vào không (Hỗ trợ cả sub-route như /courses/123)
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // Tối ưu code (DRY): Tách hàm sinh class CSS dùng chung ra riêng để HTML/JSX bên dưới không bị rác và dễ dàng thay đổi màu sắc hàng loạt sau này.
  const getNavItemClass = (path: string) => cn(
    "flex-1 flex flex-col items-center gap-1 transition-colors",
    isActive(path) 
      ? "text-blue-600 dark:text-blue-400" 
      : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
  );

  return (
    <div className="md:hidden fixed bottom-0 w-full h-16 border-t flex justify-around items-center z-40 pb-safe bg-white border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:border-slate-800 px-1">
      
      <Link href="/dashboard" className={getNavItemClass('/dashboard')}>
        <Home className="w-5 h-5"/> 
        <span className="text-[10px] font-bold tracking-wide">Tổng quan</span>
      </Link>
      
      {/* ĐÃ THAY THẾ PHÒNG HỌC THÀNH KHÓA HỌC */}
      <Link href="/quizzes" className={getNavItemClass('/quizzes')}>
        <Target className="w-5 h-5"/> {/* Đổi icon Book thành Target cho phù hợp luyện tập */}
        <span className="text-[10px] font-bold tracking-wide">Góc luyện tập</span>
      </Link>

      {/* Business Rule: Nút Gacha là tính năng core, cần thiết kế nổi bật hẳn lên (nằm đè lên viền nav) để thu hút ánh nhìn (Call-to-action). */}
      <Link href="/courses" className="relative -top-5 flex flex-col items-center shrink-0 w-[72px]">
        <div className={cn(
          "p-3.5 rounded-full shadow-[0_5px_15px_rgba(59,130,246,0.4)] border-4 border-white dark:border-slate-900 transition-transform active:scale-95",
          isActive('/courses') ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "bg-gradient-to-r from-blue-500 to-purple-500 text-white/90"
        )}>
          <Book className="w-6 h-6"/>
        </div>
        <span className={cn("absolute -bottom-4 text-[10px] font-bold whitespace-nowrap tracking-wide", isActive('/courses') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')}>
          Khóa học
        </span>
      </Link>
      
      <Link href="/social" className={getNavItemClass('/social')}>
        <Users className="w-5 h-5"/> 
        <span className="text-[10px] font-bold tracking-wide">Cộng đồng</span>
      </Link>

      <Link href="/leaderboard" className={getNavItemClass('/leaderboard')}>
        <Trophy className="w-5 h-5"/> 
        <span className="text-[10px] font-bold tracking-wide">Xếp hạng</span>
      </Link>
      
    </div>
  );
}