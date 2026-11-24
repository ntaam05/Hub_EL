"use client";

import React, { useState } from "react";
import { MessageSquarePlus, X, Loader2, CheckCircle, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { submitFeedbackAction } from "@/actions/user/feedback";
import { cn } from "@/lib/utils";

export function FeedbackButton({ isCollapsed }: { isCollapsed?: boolean }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    
    const res = await submitFeedbackAction({
      userId: session?.user?.id,
      userName: session?.user?.name || "Người dùng ẩn danh",
      content: content
    });

    if (res.success) {
      setIsSuccess(true);
      setContent("");
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
      }, 2000); 
    } else {
      alert("Lỗi: " + res.error);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        title={isCollapsed ? "Góp ý hệ thống" : ""}
        className={cn(
          "w-full flex items-center transition-all font-semibold rounded-xl mb-2 group",
          isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5 gap-3",
          "text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10"
        )}
      >
        <MessageSquarePlus className={cn("shrink-0 transition-transform group-hover:scale-110", isCollapsed ? "w-6 h-6 text-slate-500 dark:text-slate-400" : "w-5 h-5")} />
        {!isCollapsed && <span className="text-sm whitespace-nowrap">Góp ý hệ thống</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1d21] rounded-3xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquarePlus className="w-6 h-6 text-blue-500" /> Gửi góp ý
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            {isSuccess ? (
              <div className="py-8 flex flex-col items-center text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                <p className="font-bold text-lg">Cảm ơn bạn đã góp ý!</p>
                <p className="text-sm text-slate-500 mt-1">Ban quản trị sẽ xem xét để cải thiện hệ thống.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4">Bạn gặp lỗi, hay có ý tưởng tính năng mới cho nền tảng? Hãy cho chúng tôi biết nhé!</p>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung góp ý của bạn ở đây..."
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 min-h-[120px] resize-none mb-6"
                ></textarea>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || !content.trim()} 
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Gửi Góp Ý
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}