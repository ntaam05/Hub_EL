"use client";

import React, { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { AlertTriangle, X } from 'lucide-react';

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
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);
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

    // 3. Lắng nghe thông báo TÀI KHOẢN ĐĂNG NHẬP NƠI KHÁC
    socketIo.on("session_kicked", (data: any) => {
      setKickedMessage(
        data?.message || "Tài khoản của bạn vừa được đăng nhập ở thiết bị khác. Vui lòng xác nhận để đăng xuất."
      );
    });

    return () => { socketIo.disconnect(); };
  }, [currentUserId, pathname]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {kickedMessage && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#171B24] rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-[10px] bg-amber-500/12 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-[18px] h-[18px] text-amber-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Tài khoản đăng nhập nơi khác
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              {kickedMessage}
            </p>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full py-2.5 px-4 rounded-[10px] bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div 
           key={t.id} 
           onClick={() => { router.push(t.link); removeToast(t.id); }} 
           className="cursor-pointer pointer-events-auto flex items-start gap-3 w-[320px] md:w-[348px] bg-white dark:bg-[#171B24] p-4 rounded-xl shadow-lg border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
        >
            <img src={t.avatar} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[13px] text-slate-800 dark:text-slate-200 leading-snug">
                   {t.type === 'friend_request' ? (
                       <>Lời mời kết bạn từ <span className="font-semibold text-blue-600 dark:text-blue-400">@{t.senderName}</span></>
                   ) : (
                       <>Tin nhắn mới từ <span className="font-semibold text-blue-600 dark:text-blue-400">@{t.senderName}</span></>
                   )}
                </p>
                {t.type === 'message' && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{t.content}</p>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); removeToast(t.id); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0">
                <X className="w-4 h-4" />
            </button>
        </div>
      ))}
      </div>
    </>
  );
}