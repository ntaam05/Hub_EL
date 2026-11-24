"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, ListVideo, Target, GraduationCap, Trophy, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCoursesDataAction } from '@/actions/user/learning';

export default function CoursesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      getCoursesDataAction(session.user.id).then(res => {
        if (res.success) setData(res.data);
        setLoading(false);
      });
    } else if (session === null) {
      setLoading(false);
    }
  }, [session]);

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
  if (!session) return <div className="p-8 text-center text-slate-500">Vui lòng đăng nhập để xem Khóa học.</div>;

  const totalPlaylists = data?.playlists?.length || 0;
  // Đếm số khóa học ĐÃ HOÀN THÀNH (>= 50 điểm)
  const completedPlaylists = data?.playlists?.filter((p: any) => p.isCompleted).length || 0;

  return (
    // 🚨 ĐÃ FIX: Bao trọn nền bằng relative min-h-screen, cho phép bung w-full
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#020617] font-sans flex flex-col overflow-x-hidden">
      
      {/* 🚨 ĐÃ FIX: Lớp ánh sáng Glow màu Tím/Indigo và Pattern chìm */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-indigo-500/15 dark:bg-indigo-600/10 rounded-full blur-[150px]" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.02]" />
      </div>

      {/* 🚨 ĐÃ FIX: Bung full chiều rộng, căn lề 2 bên rộng rãi */}
      <div className="animate-in fade-in slide-in-from-bottom-4 w-full px-4 sm:px-6 lg:px-10 2xl:px-16 relative z-10 pb-24 md:pb-12 pt-6 md:pt-10 flex flex-col flex-1 h-full">
        
        {/* HEADER PAGE */}
        <div className="flex items-center gap-2.5 md:gap-3 mb-6 md:mb-8 drop-shadow-sm">
          <div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg md:rounded-xl shrink-0">
              <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Khóa Học Của Tôi</h1>
            <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1 font-medium">Hệ thống đánh giá năng lực dựa trên điểm số thực tế.</p>
          </div>
        </div>

        {/* THỐNG KÊ TỔNG QUAN */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 md:p-8 rounded-[24px] md:rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 mb-8 md:mb-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 border border-indigo-400/30">
          <div className="w-full text-center md:text-left">
            <h2 className="text-lg md:text-xl font-bold mb-1 md:mb-2 flex items-center justify-center md:justify-start gap-2">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-300"/> Thành tích học tập
            </h2>
            <p className="text-indigo-100 text-[11px] md:text-sm">Bạn cần đạt tối thiểu 50 điểm tổng để hoàn thành một khóa học.</p>
          </div>
          
          <div className="flex items-center w-full md:w-auto justify-around gap-4 md:gap-6 bg-white/10 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl backdrop-blur-md border border-white/20 shrink-0 shadow-inner">
            <div className="text-center">
              <p className="text-indigo-200 text-[10px] md:text-xs font-bold uppercase mb-0.5 md:mb-1 tracking-wider">Đang học</p>
              <p className="text-2xl md:text-3xl font-black drop-shadow-md">{totalPlaylists - completedPlaylists}</p>
            </div>
            <div className="w-px h-8 md:h-10 bg-white/20"></div>
            <div className="text-center">
              <p className="text-yellow-300 text-[10px] md:text-xs font-bold uppercase mb-0.5 md:mb-1 tracking-wider">Tốt nghiệp</p>
              <p className="text-2xl md:text-3xl font-black drop-shadow-md">{completedPlaylists}</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white mb-4 md:mb-6 uppercase tracking-widest drop-shadow-sm flex items-center gap-2">
          <ListVideo className="w-5 h-5 text-indigo-500" /> Playlist đang theo dõi
        </h2>
        
        {data?.playlists?.length === 0 ? (
          <div className="bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700/80 text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><ListVideo className="w-8 h-8" /></div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Chưa có khóa học nào</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Bạn chưa lưu Playlist nào. Hãy ra trang chủ tìm kiếm và nhấn "Lưu Playlist" nhé!</p>
          </div>
        ) : (
          // 🚨 ĐÃ FIX: Thêm xl:grid-cols-4 và 2xl:grid-cols-5 cho màn hình Ultrawide
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {data?.playlists?.map((playlist: any) => {
              
              const gradeColors: Record<string, string> = {
                "Xuất sắc": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
                "Giỏi": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
                "Khá": "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
                "Trung bình": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
                "Chưa đạt": "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              };

              return (
                // 🚨 ĐÃ FIX: Hiệu ứng kính (Glassmorphism)
                <div key={playlist.id} onClick={() => router.push(`/playlist/${playlist.playlistId}`)} className="group flex flex-row md:flex-col bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all overflow-hidden hover:-translate-y-1">
                  
                  <div className="relative w-[130px] sm:w-[160px] md:w-full aspect-video bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border-r md:border-r-0 md:border-b border-slate-100/50 dark:border-slate-800">
                    <img src={playlist.thumbnailUrl} alt="thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    <div className="absolute right-1 bottom-1 md:right-3 md:bottom-3 bg-black/80 px-1.5 py-1 md:px-2.5 md:py-1.5 rounded-md md:rounded-lg flex items-center gap-1 md:gap-1.5 text-white backdrop-blur-md shadow-sm border border-white/10">
                      <ListVideo className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[8px] md:text-[10px] font-bold tracking-wider">PLAYLIST</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col p-3 md:p-5 flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug mb-0.5 md:mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" dangerouslySetInnerHTML={{ __html: playlist.title }}></h3>
                    <p className="text-[10px] md:text-xs text-slate-500 mb-2 md:mb-5 truncate font-medium">{playlist.channelTitle}</p>
                    
                    <div className="mt-auto bg-slate-50/80 dark:bg-slate-800/40 rounded-xl md:rounded-2xl p-2.5 md:p-4 border border-slate-100 dark:border-slate-700/50">
                      
                      <div className="space-y-1 md:space-y-2 mb-2 md:mb-4 border-b border-slate-200/80 dark:border-slate-700/80 pb-2 md:pb-3">
                        <div className="flex justify-between items-center text-[10px] md:text-sm">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Video Quizzes</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{playlist.videoScore} <span className="text-[8px] md:text-xs font-normal opacity-50">/100</span></span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] md:text-sm">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">AI (Cuối khóa)</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{playlist.summaryScore} <span className="text-[8px] md:text-xs font-normal opacity-50">/100</span></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[8px] md:text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-0.5">Tổng Kết</p>
                          <p className={`text-lg md:text-2xl font-black leading-none drop-shadow-sm ${playlist.isCompleted ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {playlist.finalScore} <span className="text-[9px] md:text-sm font-bold text-slate-400">điểm</span>
                          </p>
                        </div>
                        
                        <div className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg border text-[9px] md:text-xs font-black uppercase tracking-wide flex items-center gap-0.5 md:gap-1 shadow-sm ${gradeColors[playlist.grade]}`}>
                          {playlist.grade === "Xuất sắc" && <Award className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                          {playlist.grade}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}