"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getInterestTagsAction, createInterestTagAction, deleteInterestTagAction } from '@/actions/admin/interests';

export default function AdminInterestsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadTags = async () => {
    setLoading(true);
    const res = await getInterestTagsAction();
    if (res.success) setTags(res.data || []);
    setLoading(false);
  };

  useEffect(() => { loadTags(); }, []);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await createInterestTagAction(newTagName);
    if (res.success) {
      showNotification(res.message || "Thành công", "success");
      setNewTagName("");
      loadTags();
    } else {
      showNotification(res.error || "Có lỗi xảy ra", "error");
    }
    setIsSubmitting(false);
  };

  const handleDeleteTag = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa sở thích "${name}" không?`)) return;

    const res = await deleteInterestTagAction(id);
    if (res.success) {
      showNotification(res.message || "Đã xóa", "success");
      loadTags();
    } else {
      showNotification(res.error || "Không thể xóa", "error");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans relative">
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border bg-white dark:bg-slate-900 ${notification.type === 'success' ? 'border-emerald-500 text-emerald-600' : 'border-red-500 text-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm uppercase">{notification.msg}</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-pink-100 dark:bg-pink-500/10 rounded-2xl text-pink-600"><Heart className="w-6 h-6 fill-current"/></div>
        <div>
          <h1 className="text-2xl font-black">Quản lý danh mục sở thích</h1>
          <p className="text-sm text-slate-500 mt-0.5">Thêm hoặc xóa các thẻ từ khóa sở thích hiển thị trên hệ thống.</p>
        </div>
      </div>

      {/* FORM THÊM MỚI */}
      <form onSubmit={handleAddTag} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm mb-8 flex gap-3 items-center">
        <input 
          type="text" 
          placeholder="Nhập tên sở thích mới (VD: Docker, Figma, K-Pop...)" 
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-pink-500 text-sm transition-colors text-slate-900 dark:text-white"
        />
        <button type="submit" disabled={isSubmitting || !newTagName.trim()} className="px-6 py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shrink-0">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Thêm thẻ
        </button>
      </form>

      {/* DANH SÁCH TAGS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Các sở thích hiện có ({tags.length})</h3>
        
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-pink-500 w-8 h-8" /></div>
        ) : tags.length === 0 ? (
          <p className="text-center text-slate-500 italic py-6 text-sm">Chưa có sở thích nào được cấu hình.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-pink-500/30 transition-all">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{tag.name}</span>
                <button 
                  type="button" 
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                  title="Xóa sở thích này"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}