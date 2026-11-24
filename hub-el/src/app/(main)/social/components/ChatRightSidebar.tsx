import React from 'react';
import { UserCircle, BellOff, Bell, Image as ImageIcon, Link as LinkIcon, UserMinus, Unlock, Ban, Users, Edit3, LogOut, Camera, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatRightSidebar({
  activeFriend, currentUserId, mediaFilesCount, linkFilesCount,
  onOpenMedia, onOpenLinks, onRemoveFriend, onBlockUser, onUnblockUser, router,
  isMuted, onToggleMute, onRenameGroup, onViewGroupMembers, onUpdateGroupAvatar,
  onDeleteGroup, onLeaveGroup
}: any) {
  if (!activeFriend) return null;

  return (
    <div className="w-[300px] shrink-0 border-l border-slate-200 dark:border-slate-800 hidden lg:flex flex-col bg-white dark:bg-[#0f172a] overflow-y-auto">
      <div className="p-6 flex flex-col items-center border-b border-slate-200 dark:border-slate-800">
        
        {/* 🚨 AVATAR CHO PHÉP BẤM ĐỂ ĐỔI ẢNH NẾU LÀ NHÓM */}
        <div className={cn("relative group", activeFriend.isGroup && "cursor-pointer")} onClick={activeFriend.isGroup ? onUpdateGroupAvatar : undefined}>
           <img src={activeFriend.avatar || "https://i.pravatar.cc/150"} alt="avt" className="w-20 h-20 rounded-full mb-3 shadow-md border-2 border-white dark:border-slate-700 object-cover group-hover:opacity-60 transition-all" />
           {activeFriend.isGroup && (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pb-3">
                   <div className="bg-black/60 p-2 rounded-full backdrop-blur-sm shadow-lg"><Camera className="w-5 h-5 text-white" /></div>
               </div>
           )}
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">{activeFriend.name}</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5">
           {activeFriend.isGroup ? `${activeFriend.memberCount || 'Nhiều'} thành viên` : (activeFriend.isBlockedByMe || activeFriend.isBlockedByThem ? 'Ngoại tuyến' : (activeFriend.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'))}
        </p>
        
        <div className="flex gap-4 text-sm font-semibold">
          {activeFriend.isGroup ? (
             <button onClick={onViewGroupMembers} className="flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 p-3 rounded-xl transition-colors text-slate-700 dark:text-slate-300">
               <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700/50 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400"><Users className="w-5 h-5" /></div>
               Thành viên
             </button>
          ) : (
             <button onClick={() => router.push(`/profile/${activeFriend.id}`)} className="flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 p-3 rounded-xl transition-colors text-slate-700 dark:text-slate-300">
               <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700/50 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400"><UserCircle className="w-5 h-5" /></div>
               Hồ sơ
             </button>
          )}
          
          <button onClick={onToggleMute} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl transition-colors font-bold", isMuted ? "hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300")}>
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border transition-all", isMuted ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-500" : "bg-slate-100 dark:bg-slate-800 border-transparent dark:border-slate-700/50 text-slate-600 dark:text-slate-400")}>
                {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            {isMuted ? 'Bật âm' : 'Tắt âm'}
          </button>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        {activeFriend.isGroup && (
           <>
              <button onClick={onRenameGroup} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                 Đổi tên nhóm <Edit3 className="w-5 h-5 text-slate-400" />
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>
           </>
        )}

        <button onClick={onOpenMedia} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-300 transition-colors">
          File phương tiện <div className="flex items-center gap-2"><span className="text-xs text-slate-400 font-bold">{mediaFilesCount}</span><ImageIcon className="w-5 h-5 text-slate-400" /></div>
        </button>
        <button onClick={onOpenLinks} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-300 transition-colors">
          File đính kèm <div className="flex items-center gap-2"><span className="text-xs text-slate-400 font-bold">{linkFilesCount}</span><LinkIcon className="w-5 h-5 text-slate-400" /></div>
        </button>

        {!activeFriend.isGroup ? (
          <>
            {!activeFriend.isBlockedByMe && !activeFriend.isBlockedByThem && (
              <button onClick={onRemoveFriend} className="w-full flex items-center justify-between p-3 hover:bg-red-50 text-red-600 dark:text-red-500 dark:hover:bg-red-500/10 rounded-xl font-semibold transition-colors mt-4">Xóa kết bạn <UserMinus className="w-5 h-5" /></button>
            )}
            {activeFriend.isBlockedByMe ? (
                <button onClick={onUnblockUser} className="w-full flex items-center justify-between p-3 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-500 dark:hover:bg-emerald-500/10 rounded-xl font-semibold transition-colors mt-1">Bỏ chặn <Unlock className="w-5 h-5" /></button>
            ) : (
                <button onClick={onBlockUser} className="w-full flex items-center justify-between p-3 hover:bg-red-50 text-red-600 dark:text-red-500 dark:hover:bg-red-500/10 rounded-xl font-semibold transition-colors mt-1">Chặn <Ban className="w-5 h-5" /></button>
            )}
          </>
        ) : (
            // 🚨 LOGIC TRƯỞNG NHÓM (Giải tán vs Rời nhóm)
            activeFriend.leaderId === currentUserId ? (
              <button onClick={onDeleteGroup} className="w-full flex items-center justify-between p-3 hover:bg-red-50 text-red-600 dark:text-red-500 dark:hover:bg-red-500/10 rounded-xl font-semibold transition-colors mt-4">
                Giải tán nhóm <Trash2 className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={onLeaveGroup} className="w-full flex items-center justify-between p-3 hover:bg-red-50 text-red-600 dark:text-red-500 dark:hover:bg-red-500/10 rounded-xl font-semibold transition-colors mt-4">
                Rời khỏi nhóm <LogOut className="w-5 h-5" />
              </button>
            )
        )}
      </div>
    </div>
  );
}