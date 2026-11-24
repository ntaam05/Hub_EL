"use client";

import React, { useState } from 'react';
// 🚨 Đã xóa sạch các icon Pointer rườm rà, chỉ giữ lại icon gốc
import { User, Shield, Bell, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import 4 Component Tabs
import ProfileTab from './components/ProfileTab';
import SecurityTab from './components/SecurityTab';
import PrivacyTab from './components/PrivacyTab';
import NotificationsTab from './components/NotificationsTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy' | 'notifications'>('profile');

  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-slate-50 dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 py-8 px-4 lg:px-12 relative overflow-hidden">
      
      {notification && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border bg-white dark:bg-slate-900 border-cyan-500 text-cyan-600 dark:text-cyan-400 animate-in fade-in slide-in-from-top-5">
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} className="text-red-500" />}
          <span className="font-black text-sm uppercase">{notification.msg}</span>
        </div>
      )}

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-20">
          <div className="absolute top-[10%] -left-[5%] w-[30%] h-[30%] bg-blue-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] -right-[5%] w-[35%] h-[35%] bg-purple-500 rounded-full blur-[120px]" />
      </div>

      <div className="w-full mx-auto relative z-10">
        <h1 className="text-3xl font-black mb-8 text-slate-900 dark:text-white">Cài đặt tài khoản</h1>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* 🚨 TABS SIDEBAR CHUẨN: Chỉ có cursor-pointer, icon nằm im */}
          <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-1">
             <button 
               onClick={() => setActiveTab('profile')} 
               className={cn("cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm border", activeTab === 'profile' ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-[#0f172a]" : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-[#0f172a]/50")}
             >
               <User size={18} />
               Thông tin cá nhân
             </button>

             <button 
               onClick={() => setActiveTab('security')} 
               className={cn("cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm border", activeTab === 'security' ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-[#0f172a]" : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-[#0f172a]/50")}
             >
               <Shield size={18} />
               Bảo mật & Đăng nhập
             </button>

             <button 
               onClick={() => setActiveTab('privacy')} 
               className={cn("cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm border", activeTab === 'privacy' ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-[#0f172a]" : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-[#0f172a]/50")}
             >
               <EyeOff size={18} />
               Quyền riêng tư
             </button>

             <button 
               onClick={() => setActiveTab('notifications')} 
               className={cn("cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm border", activeTab === 'notifications' ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-[#0f172a]" : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-[#0f172a]/50")}
             >
               <Bell size={18} />
               Thông báo Email
             </button>
          </div>

          <div className="flex-1 w-full bg-transparent rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-sm min-h-[400px]">
            {activeTab === 'profile' && <ProfileTab showNotification={showNotification} />}
            {activeTab === 'security' && <SecurityTab showNotification={showNotification} />}
            {activeTab === 'privacy' && <PrivacyTab showNotification={showNotification} />}
            {activeTab === 'notifications' && <NotificationsTab showNotification={showNotification} />}
          </div>

        </div>
      </div>
    </div>
  );
}