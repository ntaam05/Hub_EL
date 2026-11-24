"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Ban, Unlock, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOtherUserProfile, getBlockedUsersAction, unblockUserAction } from '@/actions/social/social';
import { updatePrivacyAction } from '@/actions/user/settings';

export default function PrivacyTab({ showNotification }: { showNotification: (msg: string, type: 'success' | 'error') => void }) {
  const { data: session } = useSession();
  
  const [isSaving, setIsSending] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [privacySettings, setPrivacySettings] = useState({ 
      showOnline: true, 
      onlineScope: 'everyone', 
      publicProfile: true, 
      profileScope: 'everyone' 
  });
  
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
        const userId = session?.user?.id as string; 
        if (userId && !isDataLoaded) {
            const res = await getOtherUserProfile(userId, userId);
            if (res.success && res.data) {
                const currentUser = res.data as any; 
                try {
                    if (currentUser.privacySettings) {
                        setPrivacySettings(JSON.parse(currentUser.privacySettings));
                    }
                } catch(e){}
            }

            const blockRes = await getBlockedUsersAction(userId);
            if (blockRes.success) setBlockedUsers(blockRes.data || []);

            setIsDataLoaded(true);
        }
    };
    loadData();
  }, [session?.user?.id, isDataLoaded]);

  const handleSavePrivacy = async () => {
      const userId = session?.user?.id as string;
      if (!userId) return;
      setIsSending(true);
      
      const res = await updatePrivacyAction(userId, privacySettings);
      if (res.success) {
          showNotification(res.message || "Lưu cài đặt thành công", 'success');
      } else {
          showNotification(res.error || "Lỗi lưu cài đặt", 'error');
      }
      setIsSending(false);
  }

  const handleUnblock = async (id: string) => { 
      if(confirm("Bạn có chắc muốn bỏ chặn người này?")) { 
          const res = await unblockUserAction(session?.user?.id as string, id);
          if (res.success) {
             setBlockedUsers(prev => prev.filter(u => u.id !== id)); 
             showNotification("Đã bỏ chặn thành công!", "success"); 
          } else {
             showNotification("Lỗi bỏ chặn", "error"); 
          }
      } 
  }

  if (!isDataLoaded) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-cyan-500 w-8 h-8"/></div>;

  return (
    <div className="animate-in fade-in flex flex-col gap-10 max-w-4xl">
        <div>
          <h2 className="text-xl font-black mb-6">Trạng thái hoạt động</h2>
          <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Hiển thị trạng thái Online</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Cho phép người khác thấy dấu chấm xanh khi bạn đang hoạt động.</p>
                  </div>
                  <button onClick={() => setPrivacySettings({...privacySettings, showOnline: !privacySettings.showOnline})} className={cn("w-12 h-6 rounded-full relative transition-colors duration-300", privacySettings.showOnline ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700")}>
                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-300", privacySettings.showOnline ? "translate-x-7" : "translate-x-1")} />
                  </button>
              </div>
              
              {privacySettings.showOnline && (
                  <div className="flex items-center gap-6 px-4 py-3 bg-slate-50 dark:bg-[#0f172a]/50 rounded-xl border border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Hiển thị cho:</span>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                          <input type="radio" name="onlineScope" checked={privacySettings.onlineScope === 'everyone'} onChange={() => setPrivacySettings({...privacySettings, onlineScope: 'everyone'})} className="w-4 h-4 accent-cyan-600" />
                          Mọi người
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                          <input type="radio" name="onlineScope" checked={privacySettings.onlineScope === 'friends'} onChange={() => setPrivacySettings({...privacySettings, onlineScope: 'friends'})} className="w-4 h-4 accent-cyan-600" />
                          Chỉ bạn bè
                      </label>
                  </div>
              )}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-black mb-6">Hồ sơ cá nhân</h2>
          <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Công khai thông tin (Public Profile)</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Cho phép người khác xem danh sách bạn bè, thành tựu và chỉ số học tập của bạn.</p>
                  </div>
                  <button onClick={() => setPrivacySettings({...privacySettings, publicProfile: !privacySettings.publicProfile})} className={cn("w-12 h-6 rounded-full relative transition-colors duration-300", privacySettings.publicProfile ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700")}>
                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-300", privacySettings.publicProfile ? "translate-x-7" : "translate-x-1")} />
                  </button>
              </div>

              {privacySettings.publicProfile && (
                  <div className="flex items-center gap-6 px-4 py-3 bg-slate-50 dark:bg-[#0f172a]/50 rounded-xl border border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Hiển thị cho:</span>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                          <input type="radio" name="profileScope" checked={privacySettings.profileScope === 'everyone'} onChange={() => setPrivacySettings({...privacySettings, profileScope: 'everyone'})} className="w-4 h-4 accent-cyan-600" />
                          Mọi người
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                          <input type="radio" name="profileScope" checked={privacySettings.profileScope === 'friends'} onChange={() => setPrivacySettings({...privacySettings, profileScope: 'friends'})} className="w-4 h-4 accent-cyan-600" />
                          Chỉ bạn bè
                      </label>
                  </div>
              )}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-300">Quản lý chặn</h2>
          <p className="text-sm text-slate-500 mb-6">Những người bị chặn sẽ không thể tìm thấy hoặc nhắn tin cho bạn.</p>
          
          <div className="flex flex-col gap-3">
              {blockedUsers.length > 0 ? blockedUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent">
                      <div className="flex items-center gap-3">
                          <img src={u.avatar} className="w-10 h-10 rounded-full border dark:border-slate-700 object-cover" />
                          <p className="font-bold text-[15px]">{u.name}</p>
                      </div>
                      <button onClick={() => handleUnblock(u.id)} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-transparent border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 transition-all flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5" /> Bỏ chặn
                      </button>
                    </div>
                )) : (
                  <div className="p-6 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    Bạn chưa chặn ai.
                  </div>
              )}
          </div>
        </div>
        
        <div className="flex justify-start pt-6 border-t border-slate-200 dark:border-slate-800/50 max-w-4xl">
          <button disabled={isSaving} onClick={handleSavePrivacy} className="cursor-pointer px-10 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Lưu Quyền riêng tư
          </button>
        </div>
    </div>
  );
}