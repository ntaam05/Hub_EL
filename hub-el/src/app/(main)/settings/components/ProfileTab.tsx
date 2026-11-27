"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Camera, Check, X, Trash2, Plus, Loader2, Link as LinkIcon } from 'lucide-react';
import AvatarEditor from 'react-avatar-editor';
import { RollingActionButton } from '../../dashboard/LucianPrimitives';
import { updatePersonalProfileAction, updateAvatarAction } from '@/actions/user/settings';
import { getOtherUserProfile } from '@/actions/social/social';
// 🚨 Import action lấy tag sở thích động từ database
import { getInterestTagsAction } from '@/actions/admin/interests';

export default function ProfileTab({ showNotification }: { showNotification: (msg: string, type: 'success' | 'error') => void }) {
  const { data: session, update } = useSession();
  const router = useRouter(); 
  
  const [isSaving, setIsSending] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<string[]>([]);

  // 🚨 State lưu danh mục sở thích động từ Database
  const [interestTags, setInterestTags] = useState<string[]>([]);

  const [showInterestModal, setShowInterestModal] = useState(false);
  const [tempInterests, setTempInterests] = useState<string[]>([]); 
  
  const [imageSrc, setImageSrc] = useState<File | string | null>(null);
  const [stagedAvatar, setStagedAvatar] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const editorRef = useRef<any>(null); 

  // Tải danh mục sở thích hệ thống từ DB
  useEffect(() => {
    getInterestTagsAction().then(res => {
      if (res.success && res.data) {
        setInterestTags(res.data.map((t: any) => t.name));
      }
    });
  }, []);

  useEffect(() => {
    const loadData = async () => {
        const userId = session?.user?.id as string; 
        if (userId && !isDataLoaded) {
            const res = await getOtherUserProfile(userId, userId);
            if (res.success && res.data) {
                const currentUser = res.data as any; 
                setFullName(currentUser.fullName || currentUser.name || "");
                setUsername(currentUser.username || "");
                setBio(currentUser.bio || "");
                
                // 🚨 ĐÃ FIX: Lọc sạch trùng lặp dữ liệu bằng Set ngay khi parse từ DB
                try { 
                  const parsedInterests = currentUser.interests ? JSON.parse(currentUser.interests) : [];
                  setInterests(Array.from(new Set(parsedInterests)) as string[]); 
                } catch(e){}

                try {
                    if (currentUser.socialLinks) {
                        const parsedLinks = JSON.parse(currentUser.socialLinks);
                        setSocialLinks(parsedLinks.map((item: any) => item.url || ""));
                    }
                } catch(e){}
                setIsDataLoaded(true);
            }
        }
    };
    loadData();
  }, [session?.user?.id, isDataLoaded]);

  const handleSaveAll = async () => {
    const userId = session?.user?.id as string;
    if (!userId) return;

    setIsSending(true);
    const validLinks = socialLinks.filter(url => url.trim() !== "").map(url => ({ platform: 'link', url }));
    const profileRes = await updatePersonalProfileAction(userId, { fullName, username, bio, interests, socialLinks: validLinks });

    let avatarRes = { success: true, error: "" };
    if (stagedAvatar) avatarRes = await updateAvatarAction(userId, stagedAvatar) as any;

    if (profileRes.success && avatarRes.success) {
        showNotification("Đã lưu toàn bộ thay đổi!", 'success');
        window.dispatchEvent(new CustomEvent('updateUserProfile', { detail: { name: fullName, fullName, username, bio, ...(stagedAvatar ? { image: stagedAvatar } : {}) } }));
        update({ name: fullName, ...(stagedAvatar ? { image: stagedAvatar } : {}) }); 
        if (stagedAvatar) setStagedAvatar(null);
        setTimeout(() => { router.push(`/profile/${userId}`); }, 1000);
    } else {
        showNotification(profileRes.error || avatarRes.error || "Lỗi lưu dữ liệu!", 'error');
    }
    setIsSending(false);
  };

  const handleConfirmCrop = () => {
    if (!editorRef.current) return;
    try {
        const canvas = editorRef.current.getImageScaledToCanvas();
        setStagedAvatar(canvas.toDataURL('image/webp', 0.6));
        setImageSrc(null); 
    } catch (e) { showNotification("Lỗi khi xử lý ảnh!", "error"); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { setImageSrc(e.target.files[0]); setZoom(1); }
  };

  const addSocialLink = () => { if (socialLinks.length >= 5) return showNotification("Chỉ được thêm tối đa 5 liên kết.", "error"); setSocialLinks([...socialLinks, ""]); };
  const updateSocialLink = (index: number, value: string) => { const newLinks = [...socialLinks]; newLinks[index] = value; setSocialLinks(newLinks); };
  const removeSocialLink = (index: number) => { setSocialLinks(socialLinks.filter((_, i) => i !== index)); };
  const openInterestModal = () => { setTempInterests([...interests]); setShowInterestModal(true); }
  const toggleTempInterest = (tag: string) => { setTempInterests(prev => prev.includes(tag) ? prev.filter(i => i !== tag) : [...prev, tag]); }
  const saveInterests = () => { setInterests([...tempInterests]); setShowInterestModal(false); }

  return (
    <div className="animate-in fade-in flex flex-col gap-10">
      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer">
          <img src={stagedAvatar || session?.user?.image || "https://i.pravatar.cc/150"} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md" />
          <label className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={20} className="text-white mb-1" />
              <span className="text-[10px] text-white font-bold uppercase">Thay đổi</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        <div>
          <h2 className="text-xl font-black">Ảnh đại diện</h2>
          <p className="text-xs text-slate-500">Khuyến nghị ảnh vuông, tối đa 2MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="flex flex-col gap-2"><label className="font-bold text-xs uppercase tracking-wider text-slate-500">Tên hiển thị (Tên thật)</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors" /></div>
          <div className="flex flex-col gap-2"><label className="font-bold text-xs uppercase tracking-wider text-slate-500">Biệt danh (Nickname)</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors" /></div>
          <div className="flex flex-col gap-2 md:col-span-2"><label className="font-bold text-xs uppercase tracking-wider text-slate-500">Tiểu sử cá nhân</label><textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Hãy viết gì đó về bạn..." className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors resize-none" /></div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-8 max-w-4xl">
          <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Liên kết ngoài</h3><button onClick={addSocialLink} className="text-xs font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-1 hover:underline"><Plus size={14} /> Thêm liên kết</button></div>
          <div className="flex flex-col gap-3">
            {socialLinks.length === 0 ? <p className="text-sm italic text-slate-500">Bạn chưa thêm liên kết nào.</p> : socialLinks.map((url, index) => (
                  <div key={index} className="flex items-center gap-3 animate-in fade-in">
                    <div className="flex flex-1 items-center gap-3 bg-white/50 dark:bg-[#0f172a]/50 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-cyan-500 transition-colors">
                      <LinkIcon size={16} className="text-slate-400 shrink-0" /><input type="text" placeholder="Dán đường dẫn (VD: https://facebook.com/...)" value={url} onChange={(e) => updateSocialLink(index, e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300 hover:text-cyan-600 focus:text-cyan-600 transition-colors" />
                    </div>
                    <button onClick={() => removeSocialLink(index)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0"><Trash2 size={16} /></button>
                  </div>
                ))}
          </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-8 max-w-4xl">
          <div className="flex items-center justify-between mb-3"><label className="font-bold text-xs uppercase tracking-wider text-slate-500">Sở thích</label><button onClick={openInterestModal} className="text-xs font-black text-cyan-600 dark:text-cyan-400 hover:underline">Chỉnh sửa</button></div>
          <div className="flex flex-wrap gap-2">
            {/* 🚨 ĐÃ FIX: Thêm index để ngăn lỗi báo đỏ trùng Key khi render */}
            {interests.length > 0 ? interests.map((tag, index) => <span key={`profile-interest-${index}`} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-bold shadow-sm">{tag}</span>) : <span className="text-sm italic text-slate-500">Chưa chọn sở thích nào.</span>}
          </div>
      </div>

      <div className="flex justify-start pt-6 border-t border-slate-200 dark:border-slate-800/50 max-w-4xl">
          <RollingActionButton
            label={isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            onClick={() => { if (!isSaving && isDataLoaded) handleSaveAll(); }}
          />
      </div>

      {showInterestModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-transparent">
                <h3 className="font-black text-xl text-slate-900 dark:text-white">Bạn quan tâm đến điều gì?</h3>
                <button onClick={() => setShowInterestModal(false)}><X size={24} /></button>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-3 justify-center max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                  {/* 🚨 ĐÃ FIX: Render danh mục sở thích động lấy từ Database thông qua state interestTags */}
                  {interestTags.map(tag => {
                      const isSelected = tempInterests.includes(tag);
                      return (
                        <button key={tag} onClick={() => toggleTempInterest(tag)} className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 active:scale-95 ${isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-700 dark:text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10 dark:hover:border-white/30'}`}>
                            {tag}
                        </button>
                      );
                  })}
                </div>
              </div>
              <div className="p-6 flex gap-4 bg-transparent border-t border-slate-200 dark:border-white/10 mt-4">
                <button onClick={() => setShowInterestModal(false)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 rounded-xl font-bold transition-all">Bỏ qua</button>
                <button onClick={saveInterests} disabled={tempInterests.length === 0} className="flex-1 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-cyan-900/20">Tiếp tục ({tempInterests.length})</button>
              </div>
          </div>
        </div>
      )}

      {imageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg">Chỉnh sửa ảnh đại diện</h3>
                <button onClick={() => setImageSrc(null)} className="text-slate-500 hover:text-red-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full"><X size={20}/></button>
              </div>
              <div className="relative w-full h-[350px] bg-slate-100 dark:bg-[#020617] flex items-center justify-center overflow-hidden">
                <AvatarEditor ref={editorRef} image={imageSrc} width={200} height={200} border={50} borderRadius={100} color={[0, 0, 0, 0.6]} scale={zoom} rotate={0} />
              </div>
              <div className="p-5 flex flex-col gap-5 bg-white dark:bg-[#0f172a]">
                <div className="flex items-center gap-4 px-2">
                    <span className="text-xs font-bold text-slate-500">Thu phóng</span>
                    <input type="range" value={zoom} min={1} max={3} step={0.01} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-cyan-600" />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setImageSrc(null)} className="flex-1 py-3 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors">Hủy</button>
                    <button onClick={handleConfirmCrop} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 transition-all active:scale-95"><Check className="w-5 h-5"/> Xong</button>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}