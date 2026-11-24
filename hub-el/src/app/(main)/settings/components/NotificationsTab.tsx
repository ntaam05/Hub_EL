"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Check, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOtherUserProfile } from '@/actions/social/social';
import { updateNotificationSettingsAction } from '@/actions/user/settings';

export default function NotificationsTab({ showNotification }: { showNotification: (msg: string, type: 'success' | 'error') => void }) {
  const { data: session } = useSession();
  
  const [isSaving, setIsSending] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [notifs, setNotifs] = useState({ 
      allowEmail: true, 
      energy: true, 
      friendReq: true, 
      streak: true, 
      wikiShare: true
  });

  useEffect(() => {
    const loadData = async () => {
        const userId = session?.user?.id as string; 
        if (userId && !isDataLoaded) {
            const res = await getOtherUserProfile(userId, userId);
            if (res.success && res.data) {
                const currentUser = res.data as any; 
                try {
                    if (currentUser.notificationSettings) {
                        const parsed = JSON.parse(currentUser.notificationSettings);
                        setNotifs(prev => ({ ...prev, ...parsed }));
                    }
                } catch(e){}
                setIsDataLoaded(true);
            }
        }
    };
    loadData();
  }, [session?.user?.id, isDataLoaded]);

  const handleSaveNotifications = async () => {
      const userId = session?.user?.id as string;
      if (!userId) return;
      setIsSending(true);
      
      const res = await updateNotificationSettingsAction(userId, notifs);
      if (res.success) {
          showNotification(res.message || "Đã lưu cài đặt thành công!", 'success');
      } else {
          showNotification(res.error || "Lỗi lưu cài đặt thông báo", 'error');
      }
      setIsSending(false);
  }

  if (!isDataLoaded) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-cyan-500 w-8 h-8"/></div>;

  return (
    <div className="animate-in fade-in flex flex-col gap-8 max-w-4xl">
        <div>
          <h2 className="text-xl font-black mb-2 flex items-center gap-2"><Mail className="w-6 h-6 text-cyan-500"/> Tùy chỉnh thông báo Email</h2>
          <p className="text-sm text-slate-500">Chúng tôi sẽ gửi email đến <strong className="text-slate-800 dark:text-slate-300">{session?.user?.email}</strong> khi có sự kiện quan trọng.</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10 shadow-sm transition-colors">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Cho phép gửi thông báo qua Email</h3>
                <p className="text-sm text-slate-500 mt-0.5">Bật tính năng này để hệ thống có thể gửi nhắc nhở đến bạn.</p>
              </div>
              <button onClick={() => setNotifs({...notifs, allowEmail: !notifs.allowEmail})} className={cn("w-14 h-7 rounded-full relative transition-colors duration-300 shrink-0", notifs.allowEmail ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700")}>
                <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-300 shadow-sm", notifs.allowEmail ? "translate-x-8" : "translate-x-1")} />
              </button>
          </div>

          {notifs.allowEmail && (
              <div className="flex flex-col gap-4 pl-4 md:pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Năng lượng AI đã đầy</h3>
                        <p className="text-[13px] text-slate-500 mt-0.5">Nhận email thông báo khi thanh Năng lượng AI được nạp đầy.</p>
                      </div>
                      <button onClick={() => setNotifs({...notifs, energy: !notifs.energy})} className={cn("w-11 h-6 rounded-full relative transition-colors duration-300 shrink-0", notifs.energy ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700")}>
                        <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-300 shadow-sm", notifs.energy ? "translate-x-6" : "translate-x-1")} />
                      </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Sắp mất chuỗi học tập</h3>
                        <p className="text-[13px] text-slate-500 mt-0.5">Nhắc nhở bạn vào làm nhiệm vụ hoặc bài tập để giữ chuỗi 🔥.</p>
                      </div>
                      <button onClick={() => setNotifs({...notifs, streak: !notifs.streak})} className={cn("w-11 h-6 rounded-full relative transition-colors duration-300 shrink-0", notifs.streak ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700")}>
                        <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-300 shadow-sm", notifs.streak ? "translate-x-6" : "translate-x-1")} />
                      </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Yêu cầu kết bạn mới</h3>
                        <p className="text-[13px] text-slate-500 mt-0.5">Khi có người gửi lời mời kết bạn cho bạn.</p>
                      </div>
                      <button onClick={() => setNotifs({...notifs, friendReq: !notifs.friendReq})} className={cn("w-11 h-6 rounded-full relative transition-colors duration-300 shrink-0", notifs.friendReq ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700")}>
                        <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-300 shadow-sm", notifs.friendReq ? "translate-x-6" : "translate-x-1")} />
                      </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Bạn bè chia sẻ thẻ Wiki</h3>
                        <p className="text-[13px] text-slate-500 mt-0.5">Nhận email khi bạn bè gửi tặng hoặc chia sẻ một thẻ Wiki mới cho bạn.</p>
                      </div>
                      <button onClick={() => setNotifs({...notifs, wikiShare: !notifs.wikiShare})} className={cn("w-11 h-6 rounded-full relative transition-colors duration-300 shrink-0", notifs.wikiShare ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700")}>
                        <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-300 shadow-sm", notifs.wikiShare ? "translate-x-6" : "translate-x-1")} />
                      </button>
                  </div>

              </div>
          )}
        </div>

        <div className="flex justify-start pt-6 border-t border-slate-200 dark:border-slate-800/50">
          <button disabled={isSaving} onClick={handleSaveNotifications} className="cursor-pointer px-10 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Lưu cài đặt thông báo
          </button>
        </div>
    </div>
  );
}