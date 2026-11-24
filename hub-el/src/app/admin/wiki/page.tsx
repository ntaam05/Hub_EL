"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminWikiCards, saveAdminWikiCard, deleteAdminWikiCard } from '@/actions/admin/admin';
import { Loader2, Plus, Edit, Trash2, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminWikiCards() {
    const router = useRouter();
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: null, title: '', rarity: 'R', imageUrl: '', totalStars: 1 });

    const loadData = () => { setLoading(true); getAdminWikiCards().then(res => { if(res.success) setCards(res.data || []); setLoading(false); }); }
    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await saveAdminWikiCard(formData);
        if (res.success) { setShowModal(false); loadData(); } else alert(res.error);
    };

    const handleDelete = async (id: number, title: string) => {
        if(confirm(`Xóa thẻ "${title}"?`)) { const res = await deleteAdminWikiCard(id); if(res.success) loadData(); }
    };

    if (loading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-500"/></div>;

    const glassClass = "bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full pb-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-2xl"><Sparkles className="w-8 h-8 text-purple-500" /></div> Quản lý Thẻ Wiki
                </h1>
                <button onClick={() => router.push('/admin/crawl')} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-95">
                    <Plus className="w-6 h-6" /> Thêm Thẻ Mới
                </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 w-full">
                {cards.map(card => (
                    <div key={card.id} className={`${glassClass} rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-all`}>
                        <div className="aspect-square bg-slate-200/50 dark:bg-slate-800/50 relative p-2">
                            {card.imageUrl ? <img src={card.imageUrl} className="w-full h-full object-cover rounded-2xl shadow-inner" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">No Image</div>}
                            <div className="absolute top-4 right-4 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg bg-black/50 backdrop-blur-md border border-white/20">{card.rarity}</div>
                            
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-[2rem]">
                                <button onClick={() => { setFormData(card); setShowModal(true); }} className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"><Edit className="w-6 h-6"/></button>
                                <button onClick={() => handleDelete(card.id, card.title)} className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"><Trash2 className="w-6 h-6"/></button>
                            </div>
                        </div>
                        <div className="p-4 text-center">
                            <p className="font-black text-[15px] text-slate-800 dark:text-white truncate">{card.title}</p>
                            <p className="text-[12px] text-slate-500 font-bold mt-1 tracking-widest">⭐⭐⭐ {card.totalStars}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}