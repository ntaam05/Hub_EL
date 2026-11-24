"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, CheckCircle, Plus, Trash2, Eye, EyeOff, 
  Search, Loader2, BookOpen, AlertOctagon, CheckSquare, X
} from "lucide-react";
import { 
  getKeywordsAction, addKeywordAction, 
  toggleKeywordAction, deleteKeywordAction 
} from "@/actions/admin/keyword";

export default function LearningManagementPage() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newWord, setNewWord] = useState("");
  const [newType, setNewType] = useState<"BLACKLIST" | "WHITELIST">("BLACKLIST");
  const [searchQuery, setSearchQuery] = useState("");

  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchKeywords = async () => {
    setLoading(true);
    const res = await getKeywordsAction();
    if (res.success) setKeywords(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    setIsSubmitting(true);
    const res = await addKeywordAction(newWord, newType);
    if (res.success) {
      setNewWord("");
      showNotification("Đã thêm từ khóa thành công!", "success");
      fetchKeywords();
    } else {
      showNotification(res.error || "Lỗi khi thêm từ khóa", "error");
    }
    setIsSubmitting(false);
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, isActive: !currentStatus } : k));
    const res = await toggleKeywordAction(id, currentStatus);
    if (!res.success) {
      showNotification(res.error || "Lỗi kết nối", "error");
      fetchKeywords();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn từ khóa này?")) return;
    setKeywords(prev => prev.filter(k => k.id !== id));
    const res = await deleteKeywordAction(id);
    if (res.success) {
      showNotification("Đã xóa từ khóa", "success");
    } else {
      showNotification(res.error || "Lỗi khi xóa", "error");
      fetchKeywords();
    }
  };

  const filteredKeywords = keywords.filter(k => k.word.toLowerCase().includes(searchQuery.toLowerCase()));
  const blacklist = filteredKeywords.filter(k => k.type === "BLACKLIST");
  const whitelist = filteredKeywords.filter(k => k.type === "WHITELIST");

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8 font-sans text-slate-900 dark:text-slate-100">
      
      {notification && (
        <div className={`fixed top-10 right-10 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-5 ${notification.type === 'error' ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}>
          <span className="font-bold text-sm">{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" /> Quản lý Bộ lọc AI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">
            Kiểm soát các từ khóa để tối ưu hóa thuật toán nhận diện video học tập.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleAdd} className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-end sm:items-center">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Từ khóa mới</label>
            <input 
              type="text" 
              value={newWord} 
              onChange={(e) => setNewWord(e.target.value)} 
              placeholder="Nhập từ khóa (vd: game, toán học...)" 
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phân loại</label>
            <select 
              value={newType} 
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm cursor-pointer"
            >
              <option value="BLACKLIST">⛔ Cấm (Blacklist)</option>
              <option value="WHITELIST">✅ Ưu tiên (Whitelist)</option>
            </select>
          </div>
          <button type="submit" disabled={!newWord.trim() || isSubmitting} className="w-full sm:w-auto h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm
          </button>
        </form>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tìm kiếm bộ lọc</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc từ khóa nhanh..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CỘT BLACKLIST */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-red-200 dark:border-red-900/30">
            <h2 className="text-lg font-black text-red-600 dark:text-red-500 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" /> TỪ KHÓA CẤM
            </h2>
            <span className="px-2.5 py-0.5 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">{blacklist.length} từ</span>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-red-400" /></div>
          ) : blacklist.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">Chưa có từ khóa nào.</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {blacklist.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${item.isActive ? 'bg-white dark:bg-slate-900 border-red-100 dark:border-red-900/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                  <span className={`font-semibold text-sm ${item.isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>{item.word}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleToggle(item.id, item.isActive)} title={item.isActive ? "Tạm ẩn" : "Kích hoạt"} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                      {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(item.id)} title="Xóa" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CỘT WHITELIST */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200 dark:border-emerald-900/30">
            <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-500 flex items-center gap-2">
              <CheckSquare className="w-5 h-5" /> TỪ KHÓA ƯU TIÊN
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">{whitelist.length} từ</span>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
          ) : whitelist.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">Chưa có từ khóa nào.</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {whitelist.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${item.isActive ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                  <span className={`font-semibold text-sm ${item.isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>{item.word}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleToggle(item.id, item.isActive)} title={item.isActive ? "Tạm ẩn" : "Kích hoạt"} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                      {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(item.id)} title="Xóa" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; }
      `}</style>
    </div>
  );
}