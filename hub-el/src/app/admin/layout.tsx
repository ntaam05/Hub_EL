"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Heart,
  Filter,
  ShieldAlert,
  MessageSquareQuote,
  Sparkles,
  CreditCard,
  Target,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import "../(main)/dashboard/lucian-dashboard.css";

const METEORS = [
  { top: "8%", left: "26%", len: "145px", dur: "4.8s", del: "0.2s" },
  { top: "22%", left: "66%", len: "175px", dur: "5.5s", del: "1.4s" },
  { top: "46%", left: "44%", len: "155px", dur: "5.1s", del: "0.9s" },
  { top: "68%", left: "80%", len: "135px", dur: "4.6s", del: "2.3s" },
];

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

const BOTTOM_NAV = [
  { name: "Tổng quan", icon: LayoutDashboard, path: "/admin" },
  { name: "Người dùng", icon: Users, path: "/admin/users" },
  { name: "Giao dịch", icon: CreditCard, path: "/admin/orders" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  const activeTitle =
    FULL_MENU.find((m) => m.path === pathname)?.name || "Quản trị hệ thống";

  return (
    <div className="ux dash-bg-gradient flex h-screen overflow-hidden relative">
      {/* Lớp mờ background trên Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[90] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR ADMIN */}
      <aside
        className={`fixed inset-y-0 left-0 z-[100] w-[260px] bg-[var(--ux-surface)] border-r border-[var(--ux-line)] flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--ux-line)] shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--ux-accent)] rounded-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <span className="font-semibold text-base text-[var(--ux-ink)]">
              Hub-EL{" "}
              <span className="text-[var(--ux-accent)] font-medium">Admin</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Đóng menu"
            className="md:hidden w-8 h-8 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-2)] rounded-lg flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          <p className="text-[11px] font-medium text-[var(--ux-ink-3)] mb-1.5 px-2.5 pt-1">
            Quản lý hệ thống
          </p>
          {FULL_MENU.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors border text-sm font-medium ${
                  isActive
                    ? "bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] border-[var(--ux-accent)]/25"
                    : "border-transparent text-[var(--ux-ink-2)] hover:bg-[var(--ux-surface-2)] hover:text-[var(--ux-ink)]"
                }`}
              >
                <Icon
                  size={17}
                  strokeWidth={1.75}
                  className={
                    isActive
                      ? "text-[var(--ux-accent)]"
                      : "text-[var(--ux-ink-3)]"
                  }
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--ux-line)] shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 text-[var(--ux-ink-2)] hover:bg-[var(--ux-danger)]/10 hover:text-[var(--ux-danger)] rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut size={17} strokeWidth={1.75} />
            Về trang học viên
          </Link>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[260px] relative">
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

        {/* Top Bar */}
        <header className="h-16 bg-[var(--ux-surface)]/90 backdrop-blur-md border-b border-[var(--ux-line)] flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Mở menu quản trị"
              className="md:hidden w-9 h-9 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-2)] flex items-center justify-center"
            >
              <Menu size={18} />
            </button>
            <h1 className="font-semibold text-base sm:text-lg text-[var(--ux-ink)]">
              {activeTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-lg flex items-center justify-center text-[var(--ux-ink-2)] hover:text-[var(--ux-ink)] hover:border-[var(--ux-line-2)] transition-colors"
                title="Chuyển đổi giao diện"
              >
                {theme === "dark" ? (
                  <Sun size={17} className="text-[var(--ux-warn)]" />
                ) : (
                  <Moon size={17} className="text-[var(--ux-accent)]" />
                )}
              </button>
            )}
          </div>
        </header>

        {/* Nội dung các trang */}
        <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 pb-[96px] md:pb-8">
          {children}
        </main>
      </div>

      {/* BOTTOM TAB BAR CHO MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--ux-surface)]/95 backdrop-blur-md border-t border-[var(--ux-line)] flex justify-around items-center h-16 z-[80] px-2">
        {BOTTOM_NAV.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center gap-1 p-1.5"
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[var(--ux-accent-soft)] text-[var(--ux-accent)]"
                    : "text-[var(--ux-ink-3)]"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-[var(--ux-accent)]" : "text-[var(--ux-ink-3)]"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
