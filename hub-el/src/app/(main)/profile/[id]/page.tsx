"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  MessageCircle, MapPin, Users, Award, 
  CheckCircle2, UserPlus, Mail, Cake, Heart, Copy, UserMinus, Loader2, Settings,
  Link as LinkIcon, Lock, Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOtherUserProfile, addFriendAction, removeFriendAction } from '@/actions/social/social';
import { RollingActionButton } from '../../dashboard/LucianPrimitives';
import '../../dashboard/lucian-dashboard.css';

const METEORS = [
  { top: '8%', left: '24%', len: '145px', dur: '4.8s', del: '0.2s' },
  { top: '20%', left: '66%', len: '175px', dur: '5.5s', del: '1.4s' },
  { top: '46%', left: '44%', len: '155px', dur: '5.1s', del: '0.9s' },
  { top: '68%', left: '80%', len: '135px', dur: '4.6s', del: '2.3s' },
];

const SafeAvatar = ({ src, name, className }: { src: string | null, name: string, className?: string }) => {
  const [error, setError] = useState(false);
  if (src && !error) {
    return <img src={src} alt={name} className={cn("rounded-full object-cover bg-slate-800", className)} referrerPolicy="no-referrer" onError={() => setError(true)} />;
  }
  return <div className={cn("rounded-full flex items-center justify-center font-black bg-slate-700 text-slate-300 uppercase shadow-inner", className)}>{name?.charAt(0) || "U"}</div>;
};


export default function RefinedProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { data: session } = useSession();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const fetchProfile = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const res = await getOtherUserProfile(resolvedParams.id, session.user.id);
    if (res.success) {
        setProfileData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfile() }, [resolvedParams.id, session?.user?.id]);

  const handleCopyId = () => {
      navigator.clipboard.writeText(resolvedParams.id);
      setNotification({ msg: "Đã sao chép ID!", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
  }

  const handleToggleFriend = async () => {
     if (profileData.friendshipStatus === "ACCEPTED") {
         if(confirm("Bạn muốn hủy kết bạn?")) {
             await removeFriendAction(session?.user?.id as string, profileData.id);
             setNotification({ msg: "Đã hủy kết bạn", type: 'success' });
             fetchProfile();
         }
     } else {
         await addFriendAction(session?.user?.id as string, profileData.id);
         setNotification({ msg: "Đã gửi lời mời", type: 'success' });
         fetchProfile();
     }
  }

  if (loading) return <div className="flex justify-center mt-40"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>;
  if (!profileData) return <div className="text-center mt-40 text-slate-500">Người dùng không tồn tại.</div>;

  let parsedSocialLinks = [];
  try {
    if (profileData?.socialLinks) {
       const rawLinks = JSON.parse(profileData.socialLinks);
       parsedSocialLinks = rawLinks.filter((l: any) => l.url && l.url.trim() !== '');
    }
  } catch(e) {}

const displayFriends = profileData.isProfileHidden 
        ? [] 
        : (profileData.friends || []);

  return (
    <div className="dash-bg-gradient min-h-screen w-full font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden relative">
      
      {/* HIỆU ỨNG SAO BĂNG CHẠY NỀN */}
      <div className="dash-meteors" aria-hidden="true">
        {METEORS.map((m, idx) => (
          <span
            key={idx}
            className="dash-meteor"
            style={
              {
                '--my': m.top,
                '--mx': m.left,
                '--mlen': m.len,
                '--mdur': m.dur,
                '--mdel': m.del,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {notification && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border bg-white dark:bg-slate-900 border-cyan-500 text-cyan-600 dark:text-cyan-400 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 size={20} />
          <span className="font-black text-sm uppercase">{notification.msg}</span>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-start gap-8 lg:gap-12 relative z-10">
        
        {/* CỘT TRÁI (THÔNG TIN) */}
        <aside className="w-full md:w-[280px] lg:w-[320px] shrink-0 flex flex-col gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="relative mb-4 w-40 h-40 sm:w-48 sm:h-48 md:w-full md:h-auto md:aspect-square mx-auto md:mx-0">
              <SafeAvatar src={profileData.displayAvatar} name={profileData.name} className="w-full h-full border-4 border-white dark:border-[#0f172a] shadow-xl" />             
              
              {/* 🚨 DẤU CHẤM TRẠNG THÁI (ONLINE / OFFLINE) */}
              {!profileData.isProfileHidden && (
                <div 
                  className={cn(
                    "absolute bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-[12%] md:right-[12%] w-6 h-6 border-[3px] border-slate-50 dark:border-[#020617] rounded-full z-20",
                    profileData.isActive ? "bg-green-500" : "bg-slate-400"
                  )} 
                  title={profileData.isActive ? "Đang hoạt động" : "Ngoại tuyến"} 
                />
              )}
            </div>
            
            <div className="flex flex-col min-w-0 items-center md:items-start w-full">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight w-full truncate">{profileData.name}</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium truncate -mt-0.5">{profileData.username || "@member"}</p>
                
                {/* TIỂU SỬ CÁ NHÂN */}
                {!profileData.isProfileHidden && profileData.bio && (
                   <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 line-clamp-3 text-center md:text-left">{profileData.bio}</p>
                )}
                
                <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                    ID: {profileData.id.substring(0,12)}...
                    </span>
                    <button onClick={handleCopyId} className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {session?.user?.id === profileData.id ? (
               <RollingActionButton
                 label="Chỉnh sửa hồ sơ"
                 onClick={() => router.push('/settings')}
               />
            ) : (
               <>
                  {profileData.friendshipStatus === "ACCEPTED" ? (
                    <button onClick={handleToggleFriend} className="group flex items-center justify-center gap-1.5 px-3 py-1.5 bg-transparent text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-500 rounded-md font-bold text-xs border border-slate-300 dark:border-slate-600 hover:border-red-500 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 group-hover:hidden" /> 
                      <UserMinus className="w-3.5 h-3.5 hidden group-hover:block" />
                      <span className="group-hover:hidden">Bạn bè</span>
                      <span className="hidden group-hover:inline">Xóa kết bạn</span>
                    </button>
                  ) : profileData.friendshipStatus === "PENDING" ? (
                    <button disabled className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-transparent border border-slate-300 dark:border-slate-600 text-slate-500 rounded-md font-bold text-xs">Đã gửi lời mời</button>
                  ) : (
                    <button onClick={handleToggleFriend} className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-transparent text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 rounded-md font-bold text-xs border border-cyan-500 hover:border-cyan-600 transition-all shadow-sm">
                      <UserPlus className="w-3.5 h-3.5" /> Kết bạn
                    </button>
                  )}

                  <button onClick={() => router.push('/social')} className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-md font-bold text-xs border border-slate-300 dark:border-slate-600 transition-all shadow-sm">
                    <MessageCircle className="w-3.5 h-3.5" /> Nhắn tin
                  </button>
               </>
            )}
          </div>

          {/* 🚨 KIỂM TRA QUYỀN RIÊNG TƯ TRƯỚC KHI HIỂN THỊ CÁC THÔNG TIN NHẠY CẢM */}
          {!profileData.isProfileHidden ? (
            <>
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 font-medium justify-center md:justify-start border-b border-slate-200 dark:border-slate-800 pb-4">
                <Users className="w-4 h-4 text-slate-400" />
                <strong className="text-slate-900 dark:text-white">{displayFriends.length}</strong> bạn bè
              </div>

              <div className="flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-300">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Thông tin</h3>
                <div className="flex items-center gap-2.5 truncate"><Mail className="w-4 h-4 text-slate-400 shrink-0" /> {profileData.email}</div>
                
                <div className="flex items-start gap-2.5 pt-1">
                  <Heart className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1.5">
                    {/* 🚨 CHỈ HIỂN THỊ TRƯỜNG INTERESTS */}
                    {profileData.interests && JSON.parse(profileData.interests).length > 0 
                      ? JSON.parse(profileData.interests).map((h:any, i:number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {h}
                          </span>
                        )) 
                      : <span className="text-xs italic text-slate-500">Chưa cập nhật sở thích</span>
                    }
                  </div>
              </div>

                {parsedSocialLinks.length > 0 && (
                    <div className="flex items-start gap-2.5 pt-2">
                      <LinkIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1.5 overflow-hidden w-full">
                        {parsedSocialLinks.map((link: any, idx: number) => (
                            <a 
                              key={idx} 
                              href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors truncate w-full"
                              title={link.url}
                            >
                              {link.url}
                            </a>
                        ))}
                      </div>
                    </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Thành tựu nổi bật</h3>
                {profileData.achievements?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                    {profileData.achievements.map((a: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-full shadow-sm">
                            <span className="text-base">🏆</span>
                            <span className="text-[10px] font-black uppercase text-yellow-500">{a.achievement.name}</span>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="py-4 px-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-xs font-bold text-slate-400">Chưa có thành tựu nào.</p>
                    </div>
                )}
              </div>
            </>
          ) : (
             <div className="text-center p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Thông tin bị ẩn</p>
             </div>
          )}
        </aside>

        {/* CỘT PHẢI (NỘI DUNG CHÍNH) */}
        <main className="flex-1 w-full max-w-[800px] min-w-0">
          {profileData.isProfileHidden ? (
            
            // 🚨 GIAO DIỆN KHÓA TÀI KHOẢN (NẾU BỊ ẨN)
            <div className="bg-transparent rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800/80 p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
               <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Lock className="w-10 h-10 text-slate-400 dark:text-slate-500" />
               </div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Tài khoản này là riêng tư</h2>
               <p className="text-slate-500 text-sm max-w-sm">
                 Chỉ bạn bè mới có thể xem những thông tin cá nhân, danh sách bạn bè và các thành tựu của họ.
               </p>
               {profileData.friendshipStatus !== "ACCEPTED" && profileData.friendshipStatus !== "PENDING" && (
                 <button onClick={handleToggleFriend} className="mt-6 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95">
                    Kết bạn ngay
                 </button>
               )}
            </div>

          ) : (

            // 🚨 GIAO DIỆN DANH SÁCH BẠN BÈ BÌNH THƯỜNG
            <div className="bg-transparent rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800/80 p-6 lg:p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Danh sách bạn bè ({displayFriends.length})</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayFriends.map((friend: any) => (
                  <div 
                    key={friend.id} 
                    onClick={() => router.push(`/profile/${friend.id}`)} 
                    className="group flex flex-col items-center p-3 rounded-2xl bg-transparent hover:bg-white dark:hover:bg-[#0f172a] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="w-full aspect-square rounded-full overflow-hidden mb-3 border-2 border-slate-200 dark:border-slate-800 group-hover:border-cyan-500 transition-colors">
                      <SafeAvatar src={friend.avatar} name={friend.name} className="w-full h-full" />
                    </div>
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 text-center truncate w-full px-1">{friend.name}</p>
                  </div>
                ))}
              </div>
            </div>

          )}
        </main>
      </div>
    </div>
  );
}