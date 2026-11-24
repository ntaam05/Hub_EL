"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ShieldAlert, AlertTriangle, Ban, 
  Loader2, PlayCircle, X, CheckSquare, Clock, ShieldCheck,
  History, RefreshCcw
} from "lucide-react";
import { 
  getPendingReportsAction, 
  resolveReportGroupAction, 
  getBannedVideosAction, 
  unbanVideoAction       
} from "@/actions/admin/moderation";

export default function ModerationPage() {
  const { data: session } = useSession();
  const adminName = session?.user?.name || "Admin";

  const [activeTab, setActiveTab] = useState<"REPORTS" | "BANNED">("REPORTS");
  const [reports, setReports] = useState<any[]>([]);
  const [bannedVideos, setBannedVideos] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); 

  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "BAN" | "UNBAN";
    videoId: string;
    title: string;
    message: string;
  } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    const [repRes, banRes] = await Promise.all([
      getPendingReportsAction(),
      getBannedVideosAction()
    ]);
    if (repRes.success) setReports(repRes.data || []);
    if (banRes.success) setBannedVideos(banRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIgnore = async (videoId: string) => {
    setIsProcessing(videoId);
    const res = await resolveReportGroupAction(videoId, "IGNORE", adminName);
    if (res.success) {
      showNotification("Đã bỏ qua báo cáo", "success");
      setReports(prev => prev.filter(r => r.videoId !== videoId));
    } else {
      showNotification(res.error || "Có lỗi xảy ra", "error");
    }
    setIsProcessing(null);
  };

  const executeConfirm = async () => {
    if (!confirmModal) return;
    const { type, videoId } = confirmModal;
    setConfirmModal(null);
    setIsProcessing(videoId);

    if (type === "BAN") {
      const res = await resolveReportGroupAction(videoId, "BAN", adminName);
      if (res.success) {
        showNotification("Đã cấm video thành công!", "success");
        setReports(prev => prev.filter(r => r.videoId !== videoId));
        loadData(); 
      } else {
        showNotification(res.error || "Có lỗi xảy ra", "error");
      }
    } else if (type === "UNBAN") {
      const res = await unbanVideoAction(videoId);
      if (res.success) {
        showNotification("Đã khôi phục video thành công!", "success");
        setBannedVideos(prev => prev.filter(v => v.videoId !== videoId));
      } else {
        showNotification(res.error || "Lỗi khôi phục", "error");
      }
    }
    setIsProcessing(null);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8 font-sans text-slate-900 dark:text-slate-100 relative">
      
      {notification && (
        <div className={`fixed top-10 right-10 z-[600] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-5 ${notification.type === 'error' ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}>
          <span className="font-bold text-sm">{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1d21] rounded-3xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${confirmModal.type === 'BAN' ? 'bg-red-100 text-red-500 dark:bg-red-500/10' : 'bg-emerald-100 text-emerald-500 dark:bg-emerald-500/10'}`}>
              {confirmModal.type === 'BAN' ? <Ban className="w-8 h-8" /> : <RefreshCcw className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setConfirmModal(null)} 
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={executeConfirm} 
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors shadow-lg ${confirmModal.type === 'BAN' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'}`}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" /> Trung tâm Kiểm duyệt
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">
            Quản lý các báo cáo từ cộng đồng và lịch sử cấm video.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab("REPORTS")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === "REPORTS" ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <AlertTriangle className="w-4 h-4" /> Báo cáo chờ duyệt
          {reports.length > 0 && <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{reports.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab("BANNED")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === "BANNED" ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500 bg-red-50 dark:bg-red-500/10' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <History className="w-4 h-4" /> Lịch sử Cấm
        </button>
      </div>

      {/* NỘI DUNG TABS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: USER REPORTS */}
            {activeTab === "REPORTS" && (
              <div className="p-2 md:p-6">
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[350px] text-center">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tuyệt vời! Không có báo cáo nào.</h3>
                    <p className="text-slate-500 mt-2 text-sm max-w-sm">Hệ thống đang hoạt động ổn định và cộng đồng không phát hiện video rác nào cần xử lý.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map((report) => (
                      <div key={report.videoId} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow relative">
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-black shadow-lg border-2 border-white dark:border-slate-800 z-10" title="Số lượt báo cáo">
                           {report.reportCount}
                        </div>
                        <div className="flex gap-4 mb-4">
                          <img src={`https://img.youtube.com/vi/${report.videoId}/mqdefault.jpg`} className="w-32 aspect-video object-cover rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight mb-1" title={report.title}>{report.title}</h4>
                            <p className="text-xs text-slate-500 truncate mb-2">{report.channelName || "Kênh ẩn danh"}</p>
                            <a href={`https://youtube.com/watch?v=${report.videoId}`} target="_blank" rel="noreferrer" className="mt-auto w-fit text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-blue-200 transition-colors">
                              <PlayCircle className="w-3 h-3" /> Xem trên YouTube
                            </a>
                          </div>
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg mb-4 flex-1">
                          <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">Các lý do báo cáo:</span>
                          <ul className="text-sm font-semibold text-red-700 dark:text-red-400 mt-1 list-disc pl-4 space-y-1">
                             {report.reasons.map((rs: string, idx: number) => <li key={idx}>{rs}</li>)}
                          </ul>
                          <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Cập nhật: {new Date(report.latestReportTime).toLocaleString('vi-VN')}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-200 dark:border-slate-700">
                          <button 
                            onClick={() => setConfirmModal({
                              type: "BAN", 
                              videoId: report.videoId, 
                              title: "Xác nhận cấm video", 
                              message: `Bạn có chắc chắn muốn CẤM vĩnh viễn video "${report.title}"? Nó sẽ bị ẩn khỏi kết quả tìm kiếm và danh sách yêu thích của mọi học viên.`
                            })} 
                            disabled={isProcessing === report.videoId} 
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                          >
                            {isProcessing === report.videoId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} CẤM VĨNH VIỄN
                          </button>
                          
                          <button 
                            onClick={() => handleIgnore(report.videoId)} 
                            disabled={isProcessing === report.videoId} 
                            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                          >
                            <CheckSquare className="w-4 h-4" /> BỎ QUA
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LỊCH SỬ CẤM (BANNED HISTORY) */}
            {activeTab === "BANNED" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs uppercase font-black border-b border-red-200 dark:border-red-900/30">
                    <tr>
                      <th className="px-6 py-4 w-2/5">Video Đang Bị Cấm</th>
                      <th className="px-6 py-4">Nguồn cấm</th>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-slate-100 dark:divide-slate-800">
                    {bannedVideos.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-16 text-slate-500">Thùng rác trống. Chưa có video nào bị cấm.</td></tr>
                    ) : (
                      bannedVideos.map((video) => (
                        <tr key={video.videoId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`} className="w-16 h-10 object-cover rounded bg-slate-200" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1" title={video.title}>{video.title || "Video không xác định"}</span>
                                <span className="text-xs text-slate-500 truncate">{video.channelName || "Kênh ẩn danh"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{video.reason || "Cấm thủ công"}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">Bởi: {video.moderatedBy || "System"}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">{new Date(video.updatedAt).toLocaleString('vi-VN')}</td>
                          <td className="px-6 py-4 text-right">
                             <button 
                                onClick={() => setConfirmModal({
                                  type: "UNBAN", 
                                  videoId: video.videoId, 
                                  title: "Xác nhận khôi phục", 
                                  message: `Bạn có chắc chắn muốn KHÔI PHỤC video "${video.title}"? Sau khi khôi phục, video này sẽ hiển thị bình thường trên hệ thống.`
                                })} 
                                disabled={isProcessing === video.videoId}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                {isProcessing === video.videoId ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <RefreshCcw className="w-3.5 h-3.5"/>} Khôi phục
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}