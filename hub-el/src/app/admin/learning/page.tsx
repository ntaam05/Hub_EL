"use client";
import React, { useEffect, useState } from 'react';
import { getAdminLearningProgress, getAdminDashboardStats, getDashboardChartData } from '@/actions/admin/admin';
import { Loader2, BookOpen, HelpCircle, Film, Clock, CheckCircle, Video, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminLearningManagement() {
    const [progressData, setProgressData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 🚨 2 STATE TÌM KIẾM RIÊNG BIỆT CHO 2 BẢNG
    const [quizSearch, setQuizSearch] = useState("");
    const [videoSearch, setVideoSearch] = useState("");

    useEffect(() => {
        Promise.all([getAdminLearningProgress(), getAdminDashboardStats(), getDashboardChartData()]).then(([resProgress, resStats, resCharts]) => {
            if (resProgress.success) setProgressData(resProgress.data);
            if (resStats.success) setStats(resStats.data);
            if (resCharts.success) setChartData(resCharts.data || []);
            setLoading(false);
        });
    }, []);

    if (loading || !stats) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>;

    const glassClass = "bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl rounded-[2rem]";

    const LEARNING_CARDS = [
        { title: "Video Đã Cache", value: stats.totalVideos, icon: Video, color: "text-cyan-500", bg: "bg-cyan-500/10 dark:bg-cyan-500/20" },
        { title: "Tổng số Quiz tạo", value: stats.totalQuizzes, icon: HelpCircle, color: "text-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/20" },
    ];

    const correctPercent = stats.quizTotal > 0 ? Math.round((stats.quizCorrect / stats.quizTotal) * 100) : 0;
    const wrongPercent = stats.quizTotal > 0 ? 100 - correctPercent : 0;

    const CustomTooltip = ({ active, payload, label, unit }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/40 dark:border-slate-700 p-3 rounded-xl shadow-xl">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">{label}</p>
                    <p className="text-blue-500 font-black" style={{ color: payload[0].fill || payload[0].stroke }}>{payload[0].value.toLocaleString()} {unit}</p>
                </div>
            );
        }
        return null;
    };

    // 🚨 LOGIC LỌC DỮ LIỆU BẢNG LÀM BÀI QUIZ
    const filteredQuizzes = progressData?.recentQuizAttempts.filter((a: any) => 
        a.user?.name?.toLowerCase().includes(quizSearch.toLowerCase()) || 
        a.user?.email?.toLowerCase().includes(quizSearch.toLowerCase()) || 
        a.videoTitle?.toLowerCase().includes(quizSearch.toLowerCase())
    ) || [];

    // 🚨 LOGIC LỌC DỮ LIỆU BẢNG TIẾN ĐỘ VIDEO
    const filteredVideos = progressData?.recentVideoProgress.filter((prog: any) => 
        prog.user?.name?.toLowerCase().includes(videoSearch.toLowerCase()) || 
        prog.user?.email?.toLowerCase().includes(videoSearch.toLowerCase()) || 
        prog.video?.title?.toLowerCase().includes(videoSearch.toLowerCase())
    ) || [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full pb-10">
            <h1 className="text-4xl font-black mb-8 text-slate-800 dark:text-white flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-2xl"><BookOpen className="w-8 h-8 text-blue-500" /></div> Quản lý Học tập
            </h1>

            {/* HÀNG 1: THỐNG KÊ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mb-6">
                {LEARNING_CARDS.map((c, i) => (
                    <div key={i} className={`p-6 ${glassClass} flex items-center gap-5`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${c.bg} ${c.color}`}><c.icon className="w-8 h-8" /></div>
                        <div className="flex flex-col min-w-0">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{c.title}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white truncate">{c.value}</p>
                        </div>
                    </div>
                ))}
                
                <div className={`p-6 ${glassClass} flex flex-col justify-center`}>
                    <p className="text-sm font-black mb-2 flex items-center gap-1.5 text-slate-700 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-green-500"/> Tỉ lệ Quiz Đúng / Sai</p>
                    <div className="w-full h-4 bg-red-500/30 rounded-full overflow-hidden flex shadow-inner mt-1">
                        <div style={{ width: `${correctPercent}%` }} className="h-full bg-green-500 transition-all" />
                        <div style={{ width: `${wrongPercent}%` }} className="h-full bg-red-500 transition-all" />
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold mt-2 text-slate-500">
                        <span className="text-green-600 dark:text-green-400">Đúng: {correctPercent}% ({stats.quizCorrect})</span>
                        <span className="text-red-600 dark:text-red-400">Sai: {wrongPercent}% ({stats.quizWrong})</span>
                    </div>
                </div>
            </div>

            {/* HÀNG 2: BIỂU ĐỒ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-8">
                <div className={`p-6 ${glassClass}`}>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-500"/> Thời gian học trung bình / ngày</h2>
                    <div className="h-[230px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs><linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                                <RechartsTooltip content={<CustomTooltip unit="Phút / Học viên" />} />
                                <Area type="monotone" dataKey="avgStudyTime" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorStudy)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`p-6 ${glassClass}`}>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-orange-500"/> Tổng câu hỏi Quiz sinh ra</h2>
                    <div className="h-[230px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                                <YAxis hide />
                                <RechartsTooltip content={<CustomTooltip unit="Câu hỏi" />} cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} />
                                <Bar dataKey="quizzesCreated" fill="#f97316" radius={[6, 6, 6, 6]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* HÀNG 3: BẢNG REALTIME */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                {/* BẢNG LÀM QUIZ */}
                <div className={`p-6 ${glassClass} flex flex-col`}>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-orange-500"/> Lượt nộp bài Quiz gần đây</h2>
                    
                    {/* 🚨 THANH TÌM KIẾM QUIZ */}
                    <div className="relative mb-5 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm user, bài học..." 
                            value={quizSearch}
                            onChange={e => setQuizSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/30 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium placeholder:text-slate-500 transition-all text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="overflow-y-auto flex-1 max-h-[400px] space-y-4 pr-2">
                        {filteredQuizzes.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-10">Không tìm thấy dữ liệu phù hợp.</p>
                        ) : filteredQuizzes.map((attempt: any) => (
                            <div key={attempt.id} className="p-4 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/20 dark:border-slate-700/30 flex justify-between items-center">
                                <div className="flex items-center gap-3 min-w-0">
                                    <img src={attempt.user?.avatar || attempt.user?.image || "https://i.pravatar.cc/150"} className="w-10 h-10 rounded-full object-cover border dark:border-slate-600" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{attempt.user?.name || "Ẩn danh"}</p>
                                        <p className="text-[11px] text-slate-500 truncate">Bài: {attempt.videoTitle}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="inline-flex items-center gap-1 text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg">{attempt.correctCount}/{attempt.totalQuizzes} Đúng</span>
                                    <p className="text-[10px] text-slate-400 mt-1 font-bold">{attempt.score} Điểm</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BẢNG TIẾN ĐỘ VIDEO */}
                <div className={`p-6 ${glassClass} flex flex-col`}>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Film className="w-5 h-5 text-cyan-500"/> Tiến độ xem Video (Realtime)</h2>
                    
                    {/* 🚨 THANH TÌM KIẾM VIDEO */}
                    <div className="relative mb-5 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm user, video..." 
                            value={videoSearch}
                            onChange={e => setVideoSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/30 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-medium placeholder:text-slate-500 transition-all text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="overflow-y-auto flex-1 max-h-[400px] space-y-4 pr-2">
                        {filteredVideos.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-10">Không tìm thấy dữ liệu phù hợp.</p>
                        ) : filteredVideos.map((prog: any) => (
                            <div key={prog.id} className="p-4 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/20 dark:border-slate-700/30 flex justify-between items-center">
                                <div className="flex items-center gap-3 min-w-0">
                                    <img src={prog.user?.avatar || prog.user?.image || "https://i.pravatar.cc/150"} className="w-10 h-10 rounded-full object-cover border dark:border-slate-600" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{prog.user?.name || "Ẩn danh"}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{prog.video?.title || "Video lẻ"}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                    {prog.isCompleted ? <span className="text-[10px] font-black bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-md uppercase">Đã xong</span> : <span className="text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md uppercase">Xem dở</span>}
                                    <p className="text-[11px] font-mono font-bold text-slate-500">Vị trí: {Math.floor(prog.lastWatched / 60)}m{prog.lastWatched % 60}s</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}