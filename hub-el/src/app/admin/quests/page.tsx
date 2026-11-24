"use client";
import React, { useEffect, useState } from 'react';
import { getAdminQuests, saveAdminQuest, deleteAdminQuest } from '@/actions/admin/admin';
import { Loader2, Plus, Edit, Trash2, X, Target, Zap, Coins, Crosshair, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminQuests() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [showModal, setShowModal] = useState(false);
    // 🚨 STATE MỚI: Thêm isProOnly
    const [formData, setFormData] = useState({ id: null, taskDesc: '', taskType: 'QUIZ_ATTEMPT', target: 1, rewardXp: 50, rewardCoins: 10, isProOnly: false });

    const loadData = () => { setLoading(true); getAdminQuests().then(res => { if(res.success) setTasks(res.data || []); setLoading(false); }); }
    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await saveAdminQuest(formData);
        if (res.success) { setShowModal(false); loadData(); } else alert(res.error);
        setIsSaving(false);
    };

    const handleDelete = async (id: number, taskDesc: string) => {
        if(confirm(`Xóa nhiệm vụ "${taskDesc}"? (Sẽ xóa tiến độ của user đang làm)`)) {
            const res = await deleteAdminQuest(id);
            if(res.success) loadData(); else alert(res.error);
        }
    };

    const openModal = (task: any = null) => {
        if (task) setFormData({ id: task.id, taskDesc: task.taskDesc, taskType: task.taskType, target: task.target, rewardXp: task.rewardXp, rewardCoins: task.rewardCoins, isProOnly: task.isProOnly });
        else setFormData({ id: null, taskDesc: '', taskType: 'QUIZ_ATTEMPT', target: 1, rewardXp: 50, rewardCoins: 10, isProOnly: false });
        setShowModal(true);
    }

    if (loading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-orange-500"/></div>;

    const glassClass = "bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full pb-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-2xl"><Target className="w-8 h-8 text-orange-500" /></div> Quản lý Nhiệm vụ
                </h1>
                <button onClick={() => openModal()} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95">
                    <Plus className="w-6 h-6" /> Thêm Nhiệm vụ
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                {tasks.map(task => (
                    <div key={task.id} className={`${glassClass} rounded-[2rem] p-6 group hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col`}>
                        {/* Huy hiệu loại nhiệm vụ */}
                        <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-2xl font-black text-xs text-white shadow-sm tracking-widest bg-slate-800">
                            {task.taskType}
                        </div>
                        
                        {/* 🚨 HUY HIỆU PRO NẾU CÓ */}
                        {task.isProOnly && (
                             <div className="absolute top-0 left-0 px-4 py-2 rounded-br-2xl font-black text-xs text-yellow-700 bg-yellow-400 shadow-sm flex items-center gap-1">
                                 <Crown className="w-3.5 h-3.5"/> VIP PRO
                             </div>
                        )}

                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 mt-6 pr-16 line-clamp-2 min-h-[56px]">{task.taskDesc}</h3>
                        
                        <div className="flex items-center gap-2 mb-6 font-bold text-slate-500">
                            <Crosshair className="w-4 h-4 text-orange-500" /> Mục tiêu yêu cầu: <span className="text-slate-800 dark:text-white text-lg">{task.target}</span>
                        </div>

                        <div className="flex gap-4 mb-6 mt-auto">
                            <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" /> 
                                <span className="font-black text-yellow-600 dark:text-yellow-400">+{task.rewardXp} XP</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                <Coins className="w-5 h-5 text-emerald-500 fill-emerald-500" /> 
                                <span className="font-black text-emerald-600 dark:text-emerald-400">+{task.rewardCoins} Xu</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                            <button onClick={() => openModal(task)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm"><Edit className="w-4 h-4"/> Sửa</button>
                            <button onClick={() => handleDelete(task.id, task.taskDesc)} className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors shadow-sm"><Trash2 className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL THÊM / SỬA */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                            <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-3">
                                <Target className="w-7 h-7 text-orange-500"/> {formData.id ? 'Sửa Nhiệm vụ' : 'Thêm Nhiệm vụ'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
                            
                            {/* 🚨 THÊM CHECKBOX PRO */}
                            <label className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl cursor-pointer hover:bg-yellow-500/20 transition-colors">
                                <input type="checkbox" checked={formData.isProOnly} onChange={e => setFormData({...formData, isProOnly: e.target.checked})} className="w-5 h-5 accent-yellow-500 rounded" />
                                <div className="flex flex-col">
                                    <span className="font-black text-yellow-700 dark:text-yellow-500 flex items-center gap-1.5"><Crown className="w-4 h-4"/> Nhiệm vụ dành riêng cho VIP</span>
                                    <span className="text-xs font-medium text-yellow-600/80 dark:text-yellow-500/80">User thường sẽ không thấy nhiệm vụ này</span>
                                </div>
                            </label>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mô tả hiển thị</label>
                                <input required type="text" value={formData.taskDesc} onChange={e => setFormData({...formData, taskDesc: e.target.value})} className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-orange-500 text-sm font-bold" placeholder="VD: Trả lời đúng 5 câu Quiz" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mã Logic (Type)</label>
                                    <select value={formData.taskType} onChange={e => setFormData({...formData, taskType: e.target.value})} className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-orange-500 text-sm font-bold tracking-tight text-blue-600">
                                        <option value="QUIZ_ATTEMPT">LÀM QUIZ (Số câu)</option>
                                        <option value="QUIZ_CORRECT">CÂU ĐÚNG (Số câu)</option>
                                        <option value="WATCH_MINUTE">XEM VIDEO (Số phút)</option>
                                        <option value="WATCH_COUNT">XEM VIDEO (Số lượng)</option>
                                        <option value="COURSE_ADD">THÊM KHÓA HỌC</option>
                                        <option value="GACHA_PULL">QUAY GACHA</option>
                                        <option value="MESSAGE_SEND">NHẮN TIN</option>
                                        <option value="SPEND_ENERGY">TIÊU NĂNG LƯỢNG AI</option>
                                        <option value="SPEND_COIN">TIÊU XU GACHA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mục tiêu đạt</label>
                                    <input required type="number" min="1" value={formData.target} onChange={e => setFormData({...formData, target: parseInt(e.target.value)})} className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-orange-500 text-sm font-bold" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Thưởng EXP <Zap className="inline w-4 h-4 text-yellow-500"/></label>
                                    <input required type="number" min="0" value={formData.rewardXp} onChange={e => setFormData({...formData, rewardXp: parseInt(e.target.value)})} className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-orange-500 text-sm font-bold text-yellow-600 dark:text-yellow-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Thưởng Xu <Coins className="inline w-4 h-4 text-emerald-500"/></label>
                                    <input required type="number" min="0" value={formData.rewardCoins} onChange={e => setFormData({...formData, rewardCoins: parseInt(e.target.value)})} className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-orange-500 text-sm font-bold text-emerald-600 dark:text-emerald-500" />
                                </div>
                            </div>
                            
                            <button type="submit" disabled={isSaving} className="mt-4 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95">
                                {isSaving ? <Loader2 className="w-6 h-6 animate-spin"/> : "Lưu Nhiệm Vụ"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}