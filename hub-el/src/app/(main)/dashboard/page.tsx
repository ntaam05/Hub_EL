"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  PlayCircle, Loader2, Award, Clock, 
  ChevronRight, ChevronLeft, Sparkles, Tv, HelpCircle, History,
  Coins, CheckCircle, GraduationCap, RotateCcw, Trophy, Compass, BookOpen, Heart
} from 'lucide-react';
import { getDashboardDataAction, claimDailyTaskRewardAction } from '@/actions/user/learning';
import { getRecommendedDashboardVideosAction } from '@/actions/video/video';
import { getFavoriteVideosAction } from '@/actions/video/favorite';

function formatTimeAgo(dateString: string) {
  if (!dateString) return "Vừa xong";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diffInSeconds < 60) return "Vừa xong";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

const activityUI: Record<string, any> = {
  'VIDEO': { icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", hover: "group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20" },
  'QUIZ': { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", hover: "group-hover:bg-green-100 dark:group-hover:bg-green-500/20" },
  'RETAKE_QUIZ': { icon: RotateCcw, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", hover: "group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20" }, 
  'COURSE': { icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-500/10", hover: "group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20" },  
  'ACHIEVEMENT': { icon: Trophy, color: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-500/10", hover: "group-hover:bg-yellow-100 dark:group-hover:bg-yellow-500/20" },
  'GACHA': { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", hover: "group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20" },
  'WIKI': { icon: BookOpen, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-500/10", hover: "group-hover:bg-teal-100 dark:group-hover:bg-teal-500/20" }
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  // 🚨 STATE CHO VIDEO YÊU THÍCH
  const [favoriteVideos, setFavoriteVideos] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [currentFavIndex, setCurrentFavIndex] = useState(0);

  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [rewardData, setRewardData] = useState<{xp: number, coins: number} | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (session?.user?.id && !hasFetched.current) {
      hasFetched.current = true; 
      
      getDashboardDataAction(session.user.id).then(res => {
        if (res.success) setData(res.data);
        setLoading(false);
      });
      
      getRecommendedDashboardVideosAction(session.user.id).then(res => {
        if (res.success) setRecommendedVideos(res.data);
        setLoadingRecommended(false);
      });

      // 🚨 GỌI API LẤY VIDEO YÊU THÍCH
      getFavoriteVideosAction(session.user.id).then(res => {
        if (res.success) setFavoriteVideos(res.data || []);
        setLoadingFavorites(false);
      });
    } else if (session === null) {
      setLoading(false); 
    }
  }, [session?.user?.id]);

  const handleClaimReward = async (progressId: number) => {
    setClaimingId(progressId);
    const res = await claimDailyTaskRewardAction(session?.user?.id as string, progressId);
    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        dailyTasks: prev.dailyTasks.map((tp: any) => tp.id === progressId ? { ...tp, isClaimed: true } : tp)
      }));

      window.dispatchEvent(new CustomEvent('updateUserStats', {
        detail: { xpDelta: res.xpDelta || 0, coinsDelta: res.coinsDelta || 0 }
      }));
      setRewardData({ xp: res.xpDelta || 0, coins: res.coinsDelta || 0 });
    } else alert(res.error || "Có lỗi xảy ra!");
    setClaimingId(null);
  };

  // 🚨 LOGIC ĐIỀU HƯỚNG CAROUSEL CHUYỂN 3 VIDEO/LẦN
  const handleNextFav = () => {
    setCurrentFavIndex(prev => (prev + 3 >= favoriteVideos.length ? 0 : prev + 3));
  };
  const handlePrevFav = () => {
    setCurrentFavIndex(prev => (prev - 3 < 0 ? Math.max(0, favoriteVideos.length - 3) : prev - 3));
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  if (!session) return <div className="p-8 text-center text-slate-500">Vui lòng đăng nhập để xem Bảng điều khiển.</div>;

  const displayTasks = data?.dailyTasks || [];

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#020617] font-sans overflow-x-hidden">
      
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-[150px]" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.02]" />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 w-full px-4 sm:px-6 lg:px-10 2xl:px-16 relative z-10 pb-24 md:pb-12 pt-6 md:pt-10">
        
        <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-8 tracking-tight drop-shadow-sm">
          Chào mừng trở lại, <span className="text-blue-600 dark:text-blue-400">{session.user?.name}</span>! 👋
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12">
          
          {/* ==================================== */}
          {/* CỘT TRÁI (TIẾP TỤC HỌC, ĐỀ XUẤT & YÊU THÍCH) */}
          {/* ==================================== */}
          <div className="xl:col-span-7 space-y-10">
            
            <div className="flex flex-col">
              <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 drop-shadow-sm">
                <PlayCircle className="w-5 h-5 text-blue-500" /> Tiếp tục học
              </h2>
              
              {data?.continueLearning ? (
                <div className="bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 p-5 md:p-6 flex flex-col md:flex-row items-center md:items-stretch gap-6 lg:gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl hover:border-blue-500/50 transition-all group">
                  <div className="w-full md:w-[280px] lg:w-[360px] aspect-video rounded-2xl overflow-hidden relative bg-slate-200 dark:bg-slate-800 shadow-md shrink-0">
                        {data.continueLearning.thumbnailUrl && data.continueLearning.thumbnailUrl !== "" && (
                          <img src={data.continueLearning.thumbnailUrl} alt="Thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                        <PlayCircle className="w-8 h-8 text-white opacity-100" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full flex flex-col justify-center py-2">
                    <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-2">{data.continueLearning.course}</p>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-xl md:text-2xl leading-tight mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: data.continueLearning.title }}></h3>
                    
                    <div className="flex items-center gap-4 w-full mb-6 mt-auto">
                      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.continueLearning.progress}%` }}></div>
                      </div>
                      <span className="text-sm md:text-base font-black text-slate-700 dark:text-slate-300">{data.continueLearning.progress}%</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                      <div className="flex gap-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold w-full sm:w-auto">
                        <span className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50"><Clock className="w-4 h-4 text-orange-500"/> {data.continueLearning.timeLeft}</span>
                      </div>
                      <button onClick={() => router.push(`/watch/${data.continueLearning.videoId}?t=${data.continueLearning.lastWatched}`)} className="w-full sm:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm md:text-base font-black rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
                        Vào học <PlayCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700/80 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4"><PlayCircle className="w-10 h-10" /></div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Chưa có bài học dở dang</h3>
                  <p className="text-sm text-slate-500 max-w-md">Hãy tìm kiếm một chủ đề bạn yêu thích và bắt đầu hành trình học tập ngay hôm nay!</p>
                </div>
              )}
            </div>

            <div className="flex flex-col relative pt-2">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 drop-shadow-sm">
                    <Compass className="w-5 h-5 text-indigo-500"/> Dành cho bạn
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Danh sách phát dựa trên sở thích của bạn</p>
                </div>
              </div>
              
              <div className="relative w-full">
                {loadingRecommended ? (
                  <div className="flex justify-center items-center h-[300px] bg-white/50 dark:bg-[#151821]/50 backdrop-blur-md rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                     <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  </div>
                ) : recommendedVideos.length > 0 ? (
                  <div className="bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[460px] pr-2 hover:pr-1 transition-all [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {recommendedVideos.map((vid: any) => (
                        <div 
                          key={vid.videoId} 
                          onClick={() => {
                            sessionStorage.setItem('routeState', JSON.stringify({ video: vid }));
                            router.push(`/watch/${vid.videoId}`);
                          }}
                          className="shrink-0 group bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 overflow-hidden cursor-pointer transition-all flex flex-row p-2 gap-3 md:gap-4 items-center"
                        >
                          <div className="w-[120px] sm:w-[150px] aspect-video relative bg-slate-800 shrink-0 rounded-lg overflow-hidden shadow-sm">
                            <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                            <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10">
                              <PlayCircle className="w-2.5 h-2.5" />
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col justify-center py-1 pr-2 min-w-0">
                            <h4 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" dangerouslySetInnerHTML={{__html: vid.title}}></h4>
                            <p className="text-[11px] md:text-xs font-medium text-slate-500 truncate">{vid.channelTitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700/80 text-center shadow-sm">
                    <Compass className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chưa có đề xuất nào phù hợp.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ==================================== */}
            {/* 🚨 PHẦN VIDEO YÊU THÍCH (MỚI THÊM) */}
            {/* ==================================== */}
            <div className="flex flex-col relative pt-4">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 drop-shadow-sm">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500/20"/> Video Yêu Thích
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Bộ sưu tập các video bạn đã lưu lại</p>
                </div>
                
                {favoriteVideos.length > 3 && (
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrevFav} className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all shadow-sm active:scale-95">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleNextFav} className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all shadow-sm active:scale-95">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative w-full overflow-hidden bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] min-h-[220px]">
                {loadingFavorites ? (
                  <div className="flex justify-center items-center h-[180px]"><Loader2 className="w-8 h-8 animate-spin text-red-500"/></div>
                ) : favoriteVideos.length > 0 ? (
                  // Key thay đổi sẽ kích hoạt lại animation lật trang mượt mà
                  <div key={currentFavIndex} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
                    {favoriteVideos.slice(currentFavIndex, currentFavIndex + 3).map((vid: any) => (
                      <div 
                        key={vid.videoId} 
                        onClick={() => router.push(`/watch/${vid.videoId}`)}
                        className="flex flex-col gap-3 group cursor-pointer"
                      >
                        <div className="w-full aspect-video rounded-xl overflow-hidden relative bg-slate-200 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                          <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"/>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                <PlayCircle className="w-5 h-5 text-white" />
                             </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-[13px] md:text-sm text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" dangerouslySetInnerHTML={{__html: vid.title}}></h4>
                          <p className="text-[11px] md:text-xs text-slate-500 mt-1 truncate">{vid.channelTitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[180px] text-center opacity-70">
                    <Heart className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-medium text-slate-500">Bạn chưa có video yêu thích nào.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ==================================== */}
          {/* CỘT PHẢI (NHIỆM VỤ & HOẠT ĐỘNG GẦN ĐÂY) */}
          {/* ==================================== */}
          <div className="xl:col-span-5 space-y-10">
            
            <div className="flex flex-col">
              <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 drop-shadow-sm">
                <Award className="w-5 h-5 text-yellow-500" /> Nhiệm vụ hôm nay
              </h2>
              
              <div className="bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {displayTasks.length > 0 ? (
                    displayTasks.map((tp: any, index: number) => {
                      const task = tp.task || {};
                      const current = tp.current || 0;
                      const max = task.target || 1;
                      const percent = Math.min((current / Math.max(max, 1)) * 100, 100);
                      const isCompleted = current >= max;
                      const isClaimed = tp.isClaimed;

                      const colors = [
                        { text: "text-orange-500", bg: "bg-orange-500", light: "bg-orange-500/10", icon: Tv },
                        { text: "text-green-500", bg: "bg-green-500", light: "bg-green-500/10", icon: Clock },
                        { text: "text-purple-500", bg: "bg-purple-500", light: "bg-purple-500/10", icon: HelpCircle }
                      ];
                      const style = colors[index % colors.length];
                      const Icon = style.icon;

                      return (
                        <div key={tp.id || index} className="flex items-center gap-4 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60">
                          <div className={`p-2.5 rounded-xl ${style.light} ${style.text}`}><Icon className="w-5 h-5" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-end mb-2">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{task.taskDesc}</p>
                              <span className="text-[10px] text-slate-500 font-bold shrink-0 ml-2">{current}/{max}</span>
                            </div>
                            {!isClaimed && (
                              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full ${style.bg} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                              </div>
                            )}
                          </div>
                          {isClaimed ? (
                            <div className="shrink-0 ml-2">
                              <button disabled className="px-3 py-2 bg-slate-200 dark:bg-slate-800/80 text-slate-500 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-transparent dark:border-slate-700/50">
                                <CheckCircle className="w-4 h-4" /> Đã nhận
                              </button>
                            </div>
                          ) : isCompleted ? (
                            <div className="shrink-0 ml-2">
                              <button onClick={() => handleClaimReward(tp.id)} disabled={claimingId === tp.id} className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl text-[11px] font-black shadow-lg shadow-orange-500/30 animate-pulse flex items-center gap-1 active:scale-95 transition-all">
                                {claimingId === tp.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} Nhận
                              </button>
                            </div>
                          ) : (
                            <div className="shrink-0 flex flex-col gap-1 items-end justify-center ml-2">
                              {task.rewardXp > 0 && <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 px-2 py-0.5 rounded-md">+{task.rewardXp} XP</span>}
                              {task.rewardCoins > 0 && <span className="text-[10px] font-black text-yellow-600 bg-yellow-500/10 border border-yellow-200/50 dark:border-yellow-500/20 px-2 py-0.5 rounded-md">+{task.rewardCoins} Xu</span>}
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white/50 dark:bg-transparent">
                      <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-500">Đã hoàn thành hết nhiệm vụ!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 drop-shadow-sm">
                <History className="w-5 h-5 text-emerald-500" /> Hoạt động gần đây
              </h2>
              <div className="bg-white/90 dark:bg-[#151821]/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 p-4 md:p-5 flex flex-col gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] min-h-[300px]">
                {data?.recentActivities && data.recentActivities.length > 0 ? (
                  data.recentActivities.map((act: any) => {
                    const config = activityUI[act.type] || activityUI['VIDEO'];
                    const Icon = config.icon;
                    return (
                      <div key={act.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl cursor-pointer transition-colors group">
                        <div className={`p-3 rounded-xl border border-transparent dark:border-slate-700/30 ${config.color} ${config.bg} ${config.hover} transition-colors`}><Icon className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-500 font-bold mb-1 uppercase tracking-wider">{act.action}</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{act.title}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.context}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0">
                          {formatTimeAgo(act.timestamp)} <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 py-12 text-center h-full">
                    <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Chưa có hoạt động nào.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Chúc Mừng */}
        {rewardData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1a1d21] rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center animate-in zoom-in-95 bounce border border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6"><Award className="w-10 h-10" /></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Tuyệt Vời!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-6">Bạn đã hoàn thành nhiệm vụ và nhận được phần thưởng:</p>
              <div className="flex w-full gap-4 mb-8">
                <div className="flex-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 flex flex-col items-center">
                  <Sparkles className="w-6 h-6 text-blue-500 mb-2" />
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">+{rewardData.xp}</span><span className="text-xs font-bold text-blue-500/70">EXP</span>
                </div>
                <div className="flex-1 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-2xl p-4 flex flex-col items-center">
                  <Coins className="w-6 h-6 text-yellow-500 mb-2" />
                  <span className="text-2xl font-black text-yellow-600 dark:text-yellow-500">+{rewardData.coins}</span><span className="text-xs font-bold text-yellow-500/70">XU</span>
                </div>
              </div>
              <button onClick={() => setRewardData(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">Tuyệt quá!</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}