"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Bell,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "../dashboard/lucian-dashboard.css";

import ProfileTab from "./components/ProfileTab";
import SecurityTab from "./components/SecurityTab";
import PrivacyTab from "./components/PrivacyTab";
import NotificationsTab from "./components/NotificationsTab";

const METEORS = [
  { top: "8%", left: "24%", len: "145px", dur: "4.8s", del: "0.2s" },
  { top: "20%", left: "66%", len: "175px", dur: "5.5s", del: "1.4s" },
  { top: "46%", left: "44%", len: "155px", dur: "5.1s", del: "0.9s" },
  { top: "68%", left: "80%", len: "135px", dur: "4.6s", del: "2.3s" },
];

type SettingsTabId = "profile" | "security" | "privacy" | "notifications";

const TABS: Array<{
  id: SettingsTabId;
  label: string;
  desc: string;
  icon: React.ElementType;
}> = [
  {
    id: "profile",
    label: "Thông tin cá nhân",
    desc: "Ảnh đại diện, tên hiển thị, sở thích",
    icon: User,
  },
  {
    id: "security",
    label: "Bảo mật & Đăng nhập",
    desc: "Mật khẩu, xác thực, xóa tài khoản",
    icon: Shield,
  },
  {
    id: "privacy",
    label: "Quyền riêng tư",
    desc: "Hiển thị hồ sơ và danh sách bạn bè",
    icon: EyeOff,
  },
  {
    id: "notifications",
    label: "Thông báo Email",
    desc: "Nhắc nhở học tập và cập nhật",
    icon: Bell,
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");

  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const showNotification = (
    msg: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="ux dash-bg-gradient relative min-h-[calc(100vh-80px)] w-full overflow-x-hidden">
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

      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-[var(--ux-surface)] border-[var(--ux-line-2)] text-[var(--ux-ink)]">
          {notification.type === "success" ? (
            <CheckCircle2
              size={18}
              className="text-[var(--ux-mint)] shrink-0"
            />
          ) : (
            <AlertCircle
              size={18}
              className="text-[var(--ux-danger)] shrink-0"
            />
          )}
          <span className="font-medium text-xs sm:text-sm">
            {notification.msg}
          </span>
        </div>
      )}

      {/* Khung dữ liệu tràn đều 2 bên màn hình */}
      <div className="relative z-10 w-full px-4 sm:px-6 pb-24 md:pb-10 pt-5 space-y-5 dash-enter">
        <div className="dash-hero-card rounded-2xl p-5 sm:p-6 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ux-ink)] tracking-[-0.02em]">
              Cài đặt tài khoản
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] mt-0.5">
              Quản lý hồ sơ, bảo mật, quyền riêng tư và tùy chọn thông báo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* TABS SIDEBAR */}
          <aside className="lg:col-span-3 dash-card rounded-2xl p-2 flex flex-col gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors border",
                    isActive
                      ? "bg-[var(--ux-accent-soft)] border-[var(--ux-accent)]/30 text-[var(--ux-accent)]"
                      : "border-transparent text-[var(--ux-ink-2)] hover:bg-[var(--ux-surface-2)] hover:text-[var(--ux-ink)]"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">
                      {tab.label}
                    </p>
                    <p className="text-[11px] text-[var(--ux-ink-3)] truncate mt-0.5 hidden sm:block">
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* NỘI DUNG TAB */}
          <section className="lg:col-span-9 dash-card rounded-2xl p-5 sm:p-7 min-h-[420px]">
            {activeTab === "profile" && (
              <ProfileTab showNotification={showNotification} />
            )}
            {activeTab === "security" && (
              <SecurityTab showNotification={showNotification} />
            )}
            {activeTab === "privacy" && (
              <PrivacyTab showNotification={showNotification} />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab showNotification={showNotification} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
