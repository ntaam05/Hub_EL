"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { X } from 'lucide-react';

interface ToastNotif {
  id: string;
  type: 'message' | 'friend_request';
  senderName: string;
  senderId: string;
  avatar: string;
  content?: string;
  link: string;
}

export function GlobalNotification() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (!currentUserId) return;
    
    // Kết nối Socket chung cho toàn hệ thống
    const socketIo = io();
    socketIo.emit("join_room", currentUserId);

    // 1. Lắng nghe TIN NHẮN MỚI
    socketIo.on("receive_message", (data: any) => {
      // 🚨 Nếu đang mở trang chat thì KHÔNG HIỆN thông báo góc (để trang chat tự lo)
      if (pathname === '/social') return;

      const newToast: ToastNotif = {
        id: Date.now().toString(),
        type: 'message',
        senderName: data.senderName || 'Ai đó',
        senderId: data.senderId,
        avatar: data.senderAvatar || 'https://i.pravatar.cc/150',
        content: data.content,
        link: '/social'
      };
      
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => removeToast(newToast.id), 5000); // Tự động ẩn sau 5s
    });

    // 2. Lắng nghe LỜI MỜI KẾT BẠN
    socketIo.on("receive_friend_request", (data: any) => {
      const newToast: ToastNotif = {
        id: Date.now().toString(),
        type: 'friend_request',
        senderName: data.senderName,
        senderId: data.senderId,
        avatar: data.avatar || 'https://i.pravatar.cc/150',
        link: `/profile/${data.senderId}`
      };
      
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => removeToast(newToast.id), 6000); // Tự động ẩn sau 6s
    });

    return () => { socketIo.disconnect(); };
  }, [currentUserId, pathname]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div 
           key={t.id} 
           onClick={() => { router.push(t.link); removeToast(t.id); }} 
           className="cursor-pointer pointer-events-auto flex items-start gap-3 w-[320px] md:w-[350px] bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-right-8 fade-in duration-300 hover:scale-[1.02] transition-transform"
        >
            <img src={t.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-slate-800 dark:text-slate-200 leading-snug">
                   {t.type === 'friend_request' ? (
                       <>Bạn nhận được 1 lời mời kết bạn từ <strong className="font-black text-blue-600 dark:text-blue-400">@{t.senderName}</strong></>
                   ) : (
                       <>Bạn nhận được 1 tin nhắn từ <strong className="font-black text-blue-600 dark:text-blue-400">@{t.senderName}</strong></>
                   )}
                </p>
                {t.type === 'message' && <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1 font-medium">{t.content}</p>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); removeToast(t.id); }} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-100 dark:bg-slate-700 rounded-full shrink-0">
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
      ))}
    </div>
  );
}