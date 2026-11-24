"use client";

import React, { useState, useEffect } from "react";
import { MessageSquareQuote, CheckCircle2, Clock, Loader2, MailOpen } from "lucide-react";
import { getFeedbacksAction, markFeedbackReadAction } from "@/actions/user/feedback";

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeedbacks = async () => {
    setLoading(true);
    const res = await getFeedbacksAction();
    if (res.success) setFeedbacks(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    // Optimistic UI update
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: "READ" } : f));
    await markFeedbackReadAction(id);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <MessageSquareQuote className="w-8 h-8 text-blue-500" /> Hòm Thư Góp Ý
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">
            Lắng nghe phản hồi từ học viên để nâng cấp hệ thống.
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm">
          {feedbacks.filter(f => f.status === "NEW").length} góp ý mới chưa đọc
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-20 text-slate-500">Chưa có góp ý nào từ người dùng.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbacks.map((fb) => (
            <div key={fb.id} className={`p-6 rounded-2xl border transition-all flex flex-col h-full ${fb.status === "NEW" ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 shadow-md' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${fb.status === "NEW" ? 'bg-blue-500' : 'bg-slate-400'}`}>
                    {fb.userName?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{fb.userName || "Ẩn danh"}</h4>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/> {new Date(fb.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
                {fb.status === "NEW" && <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded uppercase tracking-wider animate-pulse">Mới</span>}
              </div>

              <div className="flex-1 bg-slate-50 dark:bg-[#16181c] p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 mb-5">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{fb.content}</p>
              </div>

              {fb.status === "NEW" ? (
                <button onClick={() => handleMarkAsRead(fb.id)} className="w-full py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4"/> Đánh dấu đã xem
                </button>
              ) : (
                <div className="w-full py-2.5 text-slate-400 font-medium text-sm flex items-center justify-center gap-2">
                  <MailOpen className="w-4 h-4"/> Đã xem xét
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}