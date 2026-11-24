"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, Users, BookOpen, Heart, Filter, 
  ShieldAlert, MessageSquareQuote, Sparkles, CreditCard, 
  Target, Menu, X, ChevronRight, LogOut, ShieldCheck,
  Sun, Moon
} from 'lucide-react';

// Toàn bộ menu của Admin
const FULL_MENU = [
  { name: "Tổng quan", icon: LayoutDashboard, path: "/admin" },
  { name: "Người dùng", icon: Users, path: "/admin/users" },
  { name: "Học tập", icon: BookOpen, path: "/admin/learning" },
  { name: "Sở thích", icon: Heart, path: "/admin/interests" },
  { name: "Bộ lọc", icon: Filter, path: "/admin/keywords" }, 
  { name: "Kiểm duyệt", icon: ShieldAlert, path: "/admin/moderation" },
  { name: "Góp ý", icon: MessageSquareQuote, path: "/admin/feedback" },
  { name: "Thẻ Wiki", icon: Sparkles, path: "/admin/wiki" },
  { name: "Giao dịch", icon: CreditCard, path: "/admin/orders" },
  { name: "Nhiệm vụ", icon: Target, path: "/admin/quests" },
];

// 3 menu quan trọng nhất hiển thị ở Bottom Bar (Mobile)
const BOTTOM_NAV = [
  { name: "Tổng quan", icon: LayoutDashboard, path: "/admin" },
  { name: "Người dùng", icon: Users, path: "/admin/users" },
  { name: "Giao dịch", icon: CreditCard, path: "/admin/orders" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Cờ hiệu để biết component đã mount xong (chống lỗi hydration của next-themes)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tự động đóng Menu Mobile khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Ngăn cuộn trang nền khi mở Menu Mobile
  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#020617] overflow-hidden font-sans">
      
      {/* 1. SIDEBAR CHO DESKTOP (Ẩn trên Mobile) & DRAWER CHO MOBILE */}
      {/* Lớp mờ background trên Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Thanh Sidebar chính */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-[280px] bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        
        {/* Header của Sidebar */}
        <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl text-slate-800 dark:text-white tracking-tight">Hub-EL <span className="text-blue-600">Admin</span></span>
          </Link>
          {/* Nút đóng Menu trên Mobile */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Danh sách Menu */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-1.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Quản lý hệ thống</p>
          {FULL_MENU.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 transition-colors'} />
                  <span className="font-semibold text-sm">{item.name}</span>
                </div>
                {!isActive && <ChevronRight size={16} className="text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />}
              </Link>
            );
          })}
        </div>

        {/* Nút Đăng xuất ở cuối Sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors font-semibold text-sm">
            <LogOut size={18} /> Về trang học viên
          </Link>
        </div>
      </aside>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH (MAIN CONTENT) */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[280px]">
        
        {/* Top Bar */}
        <header className="h-16 md:h-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 z-40 sticky top-0">
          <div className="flex items-center gap-3">
             {/* Nút mở Menu trên Mobile */}
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center md:hidden">
                <ShieldCheck className="w-5 h-5 text-white" />
             </div>
             <h1 className="font-bold text-lg text-slate-800 dark:text-white md:hidden">Admin Panel</h1>
             <h1 className="font-black text-2xl text-slate-800 dark:text-white hidden md:block">Bảng điều khiển</h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Nút Chuyển Đổi Giao Diện Sáng/Tối */}
             {mounted && (
               <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 shadow-sm"
                  title="Chuyển đổi giao diện"
               >
                  {theme === 'dark' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-indigo-500" />}
               </button>
             )}
          </div>
        </header>

        {/* Nội dung các trang */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-[100px] md:pb-8 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* 3. BOTTOM TAB BAR CHO MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-[70px] z-[80] pb-safe px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {BOTTOM_NAV.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path} className="flex-1 flex flex-col items-center justify-center gap-1.5 p-2 transition-all active:scale-95">
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-transparent'}`}>
                  <Icon size={22} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{item.name}</span>
            </Link>
          );
        })}
        
        {/* Nút Hamburger để mở toàn bộ Menu */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-1.5 p-2 transition-all active:scale-95">
          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
             <Menu size={22} className="text-slate-700 dark:text-slate-300" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Thêm</span>
        </button>
      </nav>

      {/* CSS làm đẹp thanh cuộn */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
}