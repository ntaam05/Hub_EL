"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { PlayCircle, Loader2, ShieldAlert, ListVideo, UserCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

// IMPORT SERVER ACTION THAY VÌ DÙNG FETCH 8080
import { searchAdvancedAction } from '@/actions/video/video'; 

function ExploreContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');
  const router = useRouter();

  const [searchVideos, setSearchVideos] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchVideos = async (pageToken: string | null = null) => {
    if (!pageToken) setLoading(true); else setLoadingMore(true);
    setErrorMsg(null);
    
    try {
      // GỌI TRỰC TIẾP NEXT.JS SERVER ACTION THAY VÌ JAVA API
      const res = await searchAdvancedAction(
        { keyword: searchQuery as string, minViews: 0, minLikes: 0, duration: "all" },
        pageToken || undefined
      );
      
      if (!res.success) {
          setErrorMsg(res.error || "Truy vấn bị từ chối");
      } else {
          const data = res.data as any;
          if (pageToken) setSearchVideos(prev => [...prev, ...(data.items || [])]);
          else setSearchVideos(data.items || []);
          setNextPageToken(data.nextPageToken);
      }
    } catch (err) { 
      console.error("Lỗi tìm kiếm:", err); 
    }
    
    setLoading(false); 
    setLoadingMore(false);
  };

  useEffect(() => {
    if (searchQuery) fetchVideos();
    else setSearchVideos([]);
  }, [searchQuery]);

  const handleNavigate = (vid: any) => {
    sessionStorage.setItem('routeState', JSON.stringify({ video: vid }));
    if (vid.type === 'playlist') router.push(`/playlist/${vid.videoId}`);
    else router.push(`/watch/${vid.videoId}`);
  };

  return (
    // THÊM px-4 (padding 2 bên cho mobile) và pb-24 (tránh bị thanh điều hướng dưới đáy che khuất)
    <div className="animate-in fade-in slide-in-from-bottom-4 pb-24 md:pb-10 max-w-5xl mx-auto pt-4 md:pt-8 px-4 lg:px-0">
      {searchQuery && (
        <>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-white/10 pb-3 md:pb-4">
            Kết quả cho: <span className="text-blue-500">"{searchQuery}"</span>
          </h2>
          
          {loading ? (
            <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShieldAlert className="w-12 h-12 md:w-16 md:h-16 text-red-500 mb-4" />
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Truy vấn bị từ chối!</h3>
                <p className="text-sm md:text-base text-slate-500">{errorMsg}</p>
            </div>
          ) : (
            <div className="flex flex-col w-full gap-1 md:gap-0">
              {searchVideos.map((vid, index) => {
                const isPlaylist = vid.type === 'playlist';
                return (
                  // ĐỔI THÀNH flex-row ĐỂ LUÔN XẾP NGANG TRÊN MOBILE, giảm gap và padding
                  <div key={vid.videoId || index} onClick={() => handleNavigate(vid)}
                    className="flex flex-row gap-3 md:gap-4 w-full cursor-pointer group mb-3 md:mb-6 hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded-xl transition-all items-start md:items-stretch"
                  >
                    {/* BÓP NHỎ THUMBNAIL TRÊN MOBILE: w-[140px] */}
                    <div className="relative w-[140px] sm:w-[200px] md:w-[360px] aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                      <img src={vid.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {isPlaylist && (
                        <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                          <ListVideo className="w-4 h-4 md:w-8 md:h-8 mb-0.5 md:mb-1" /><span className="text-[8px] md:text-xs font-medium">DANH SÁCH</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <PlayCircle className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    
                    {/* NỘI DUNG BÊN PHẢI ĐƯỢC THU NHỎ FONT TRÊN MOBILE */}
                    <div className="flex flex-col flex-1 py-0 md:py-1 min-w-0">
                      <h3 className="text-sm md:text-lg font-medium text-slate-900 dark:text-slate-100 line-clamp-3 md:line-clamp-2 group-hover:text-blue-500 transition-colors leading-snug" dangerouslySetInnerHTML={{ __html: vid.title }}></h3>
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-3 mt-1.5 md:mt-3">
                        <UserCircle className="w-4 h-4 md:w-6 md:h-6 text-slate-400 shrink-0" />
                        <p className="text-[11px] md:text-sm text-slate-600 dark:text-slate-400 font-medium truncate">{vid.channelTitle}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {nextPageToken && (
                <div className="flex justify-center mt-6 md:mt-8 border-t border-slate-200 dark:border-white/10 pt-6 md:pt-8">
                  <button onClick={() => fetchVideos(nextPageToken)} disabled={loadingMore} className="px-6 md:px-8 py-2 md:py-2.5 text-sm md:text-base rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center gap-2">
                    {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin"/> Đang tải...</> : 'Hiển thị thêm kết quả'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Bắt buộc bọc trong Suspense vì Next.js yêu cầu khi có sử dụng useSearchParams()
export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}