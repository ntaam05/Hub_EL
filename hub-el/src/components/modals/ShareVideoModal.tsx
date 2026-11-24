"use client";

import React, { useState, useEffect } from 'react';
import { X, Send, Search, Loader2, CheckCircle2, PlayCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getFriendsListAction, getChatGroupsAction, sendMessageAction } from '@/actions/social/social';
import { io } from 'socket.io-client';

export default function ShareVideoModal({ 
  isOpen, 
  onClose, 
  videoId, 
  videoTitle,
  thumbnailUrl 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  videoId: string; 
  videoTitle: string;
  thumbnailUrl?: string;
}) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id as string;
  
  const [friendsAndGroups, setFriendsAndGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && currentUserId) {
      setLoading(true);
      // Tải danh sách bạn bè & nhóm chat
      Promise.all([
        getFriendsListAction(currentUserId),
        getChatGroupsAction(currentUserId)
      ]).then(([resFriends, resGroups]) => {
        let combined: any[] = [];
        if (resFriends.success && resFriends.data) {
            combined = [...combined, ...resFriends.data.filter((f: any) => !f.isBlockedByMe && !f.isBlockedByThem)];
        }
        if (resGroups.success && resGroups.data) {
            const formattedGroups = resGroups.data.map((g: any) => ({
                id: g.id, name: g.name, avatar: g.avatar || "https://ui-avatars.com/api/?name=Group&background=3b82f6&color=fff",
                isGroup: true, isKicked: g.isKicked
            }));
            combined = [...combined, ...formattedGroups.filter((g: any) => !g.isKicked)];
        }
        setFriendsAndGroups(combined);
        setLoading(false);
      });
    }
  }, [isOpen, currentUserId]);

  const handleShare = async () => {
    if (!selectedTarget || !currentUserId) return;
    setIsSending(true);

    const isGroup = selectedTarget.isGroup;
    const receiverId = isGroup ? null : selectedTarget.id;
    const groupId = isGroup ? selectedTarget.id : undefined;

    // 🚨 Định dạng lưu Data: messageType="SHARE_VIDEO", content=Tiêu đề video, fileUrl=ID Video
    const res = await sendMessageAction(
        currentUserId, 
        receiverId, 
        videoTitle, 
        "SHARE_VIDEO", 
        videoId, 
        false, 
        groupId
    );

    if (res.success) {
      // Kết nối nhanh Socket để bắn thông báo cho người nhận
      const socket = io();
      if (isGroup) {
          socket.emit("send_message", { receiverId: `group_${groupId}`, message: { ...res.data, senderName: session?.user?.name, senderAvatar: session?.user?.image, groupId } });
      } else {
          socket.emit("send_message", { receiverId: selectedTarget.id, message: { ...res.data, senderName: session?.user?.name, senderAvatar: session?.user?.image } });
      }
      setTimeout(() => socket.disconnect(), 1000); // Ngắt sau khi bắn xong

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedTarget(null);
        onClose();
      }, 2000);
    } else {
      alert("Lỗi khi chia sẻ video!");
    }
    setIsSending(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">
        
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-black text-lg text-slate-800 dark:text-white">Chia sẻ Video</h3>
          <button onClick={onClose} className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full transition-colors"><X size={18}/></button>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
            <p className="font-bold text-lg text-slate-800 dark:text-slate-200">Đã chia sẻ thành công!</p>
          </div>
        ) : selectedTarget ? (
          <div className="p-6 flex flex-col items-center text-center animate-in slide-in-from-right-4">
            <div className="relative w-full aspect-video rounded-xl mb-4 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20"><PlayCircle className="w-12 h-12 text-white" /></div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              Gửi video <strong className="text-slate-900 dark:text-white">"{videoTitle}"</strong> đến {selectedTarget.isGroup ? 'nhóm' : ''} <strong className="text-blue-600 dark:text-blue-400">@{selectedTarget.name}</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setSelectedTarget(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">Hủy</button>
              <button disabled={isSending} onClick={handleShare} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />} Gửi ngay
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" placeholder="Tìm kiếm bạn bè, nhóm..." 
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : friendsAndGroups.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(target => (
                <button 
                  key={target.isGroup ? `group_${target.id}` : target.id} onClick={() => setSelectedTarget(target)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors text-left"
                >
                  <img src={target.avatar || "https://i.pravatar.cc/150"} className="w-10 h-10 rounded-full object-cover border dark:border-slate-700 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{target.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{target.isGroup ? 'Nhóm trò chuyện' : 'Bạn bè'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}