"use client";
import React, { useEffect, useState } from 'react';
import { getAdminUsers, updateAdminUser, adjustUserBalanceAction } from '@/actions/admin/admin';
import { Loader2, Ban, CheckCircle2, Shield, Crown, Wallet, X, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // STATE ĐIỀU CHỈNH SỐ DƯ
    const [showFundModal, setShowFundModal] = useState(false);
    const [isFunding, setIsFunding] = useState(false);
    const [fundData, setFundData] = useState({ userId: '', userName: '', assetType: 'FREE_COIN', amount: 0, reason: '' });

    // STATE SỬA THÔNG TIN TÀI KHOẢN
    const [showEditAccountModal, setShowEditAccountModal] = useState(false);
    const [isSavingAccount, setIsSavingAccount] = useState(false);
    const [accountData, setAccountData] = useState({ userId: '', userName: '', email: '', password: '' });

    const loadData = () => { setLoading(true); getAdminUsers().then(res => { if(res.success) setUsers(res.data || []); setLoading(false); }); }
    useEffect(() => { loadData(); }, []);

    // 🚨 ĐÃ FIX: HÀM KHÓA TÀI KHOẢN THEO ROLE
    const toggleLock = async (user: any) => {
        if (user.role === 'admin') return alert("Không thể khóa Admin!");
        
        const isBanned = user.role === 'BANNED'; 
        
        if (confirm(`Chắc chắn muốn ${isBanned ? 'MỞ KHÓA' : 'KHÓA'} tài khoản ${user.name}?`)) {
            await updateAdminUser(user.id, { role: isBanned ? 'student' : 'BANNED' });
            loadData();
        }
    }

    const togglePro = async (user: any) => {
        if(confirm(`Đổi trạng thái VIP của ${user.name}?`)) {
            await updateAdminUser(user.id, { isPro: !user.isPro });
            loadData();
        }
    }

    const handleFundSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsFunding(true);
        const res = await adjustUserBalanceAction(fundData.userId, fundData.assetType, fundData.amount, fundData.reason || 'Admin điều chỉnh');
        if (res.success) { setShowFundModal(false); loadData(); alert("Thành công!"); } else alert(res.error);
        setIsFunding(false);
    }

    const handleEditAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingAccount(true);
        const res = await updateAdminUser(accountData.userId, { 
            email: accountData.email, 
            password: accountData.password 
        });
        if (res.success) { 
            setShowEditAccountModal(false); 
            loadData(); 
            alert("Đã cập nhật thông tin tài khoản!"); 
        } else {
            alert(res.error);
        }
        setIsSavingAccount(false);
    }

    if (loading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>;

    const glassClass = "bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl";

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.id.includes(searchTerm)
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">Quản lý Học viên</h1>
                
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm tên, email hoặc ID..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 transition-all ${glassClass}`}
                    />
                </div>
            </div>
            
            {/* 1. GIAO DIỆN DESKTOP (TABLE) */}
            <div className={`rounded-3xl overflow-hidden hidden md:block ${glassClass}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white/40 dark:bg-slate-800/40 border-b border-white/20 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[12px]">
                            <tr>
                                <th className="p-6">Người dùng</th>
                                <th className="p-6">Liên hệ</th>
                                <th className="p-6">Trạng thái</th>
                                <th className="p-6">Tài sản</th>
                                <th className="p-6 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20 dark:divide-slate-700/50">
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-medium">Không tìm thấy người dùng nào phù hợp.</td></tr>
                            ) : filteredUsers.map(u => (
                                <tr key={`desktop-${u.id}`} className="hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-6 flex items-center gap-4">
                                        <img src={u.avatar || u.image || "https://i.pravatar.cc/150"} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                                        <div>
                                            <p className="font-bold text-[16px] text-slate-800 dark:text-white flex items-center gap-1.5">
                                                {u.name} {u.role === 'admin' && <span title="Admin"><Shield className="w-5 h-5 text-blue-500" /></span>}
                                            </p>
                                            <p className="text-[12px] text-slate-500 font-mono mt-1">ID: {u.id}</p>
                                        </div>
                                    </td>
                                    <td className="p-6 text-slate-700 dark:text-slate-200 font-medium">{u.email}</td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-2 items-start">
                                            {/* 🚨 ĐÃ FIX: TRẠNG THÁI THEO ROLE */}
                                            {u.role !== 'BANNED' ? <span className="px-3 py-1.5 bg-green-500/20 text-green-700 dark:text-green-400 rounded-xl text-[11px] font-black uppercase">Hoạt động</span> : <span className="px-3 py-1.5 bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-[11px] font-black uppercase">Bị khóa</span>}
                                            {u.isPro && <span className="px-3 py-1.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-xl text-[11px] font-black uppercase flex items-center gap-1"><Crown className="w-3.5 h-3.5"/> VIP PRO</span>}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"><span className="text-yellow-600 dark:text-yellow-500">Xu:</span> {u.freeCoins}</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"><span className="text-purple-600 dark:text-purple-500">Bụi sao:</span> {u.stardust}</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200"><span className="text-blue-600 dark:text-blue-500">Năng lượng:</span> {u.aiTokens}</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => { setAccountData({ userId: u.id, userName: u.name, email: u.email, password: '' }); setShowEditAccountModal(true); }} className="p-3 rounded-2xl transition-all shadow-sm active:scale-95 bg-purple-500/20 text-purple-700 dark:text-purple-400 hover:bg-purple-500/30" title="Sửa Email & Mật khẩu"><Settings className="w-5 h-5"/></button>
                                            <button onClick={() => { setFundData({ userId: u.id, userName: u.name, assetType: 'FREE_COIN', amount: 100, reason: '' }); setShowFundModal(true); }} className="p-3 rounded-2xl transition-all shadow-sm active:scale-95 bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30" title="Cộng/Trừ Tài Sản"><Wallet className="w-5 h-5"/></button>
                                            <button onClick={() => togglePro(u)} className={cn("p-3 rounded-2xl transition-all shadow-sm active:scale-95", u.isPro ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30" : "bg-slate-500/10 text-slate-500 hover:text-yellow-500")} title="Đổi trạng thái VIP"><Crown className="w-5 h-5"/></button>
                                            {/* 🚨 ĐÃ FIX: NÚT BẤM THEO ROLE */}
                                            <button onClick={() => toggleLock(u)} className={cn("p-3 rounded-2xl transition-all shadow-sm active:scale-95", u.role !== 'BANNED' ? "bg-slate-500/10 text-slate-500 hover:text-red-500 hover:bg-red-500/20" : "bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/30")} title={u.role !== 'BANNED' ? "Khóa tài khoản" : "Mở khóa"}>{u.role !== 'BANNED' ? <Ban className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. GIAO DIỆN MOBILE (CARD) */}
            <div className="block md:hidden space-y-4">
                {filteredUsers.length === 0 ? (
                    <div className={`p-6 text-center text-slate-500 font-medium rounded-3xl ${glassClass}`}>Không tìm thấy người dùng nào phù hợp.</div>
                ) : filteredUsers.map(u => (
                    <div key={`mobile-${u.id}`} className={`p-5 rounded-3xl flex flex-col gap-4 ${glassClass}`}>
                        {/* Avatar & Info */}
                        <div className="flex items-start gap-4">
                            <img src={u.avatar || u.image || "https://i.pravatar.cc/150"} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[16px] text-slate-800 dark:text-white flex items-center gap-1.5 truncate">
                                    {u.name} {u.role === 'admin' && <span title="Admin"><Shield className="w-4 h-4 text-blue-500 shrink-0" /></span>}
                                </p>
                                <p className="text-[12px] text-slate-500 truncate">{u.email}</p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">ID: {u.id}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                {/* 🚨 ĐÃ FIX: TRẠNG THÁI THEO ROLE MOBILE */}
                                {u.role !== 'BANNED' ? <span className="px-2.5 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg text-[10px] font-black uppercase">Hoạt động</span> : <span className="px-2.5 py-1 bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[10px] font-black uppercase">Bị khóa</span>}
                                {u.isPro && <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"><Crown className="w-3 h-3"/> VIP</span>}
                            </div>
                        </div>

                        {/* Tài sản */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/20 dark:border-slate-700/50">
                            <div className="flex flex-col items-center justify-center p-2 bg-white/40 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Xu</span>
                                <span className="text-sm font-black text-yellow-600 dark:text-yellow-500">{u.freeCoins}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 bg-white/40 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bụi sao</span>
                                <span className="text-sm font-black text-purple-600 dark:text-purple-500">{u.stardust}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 bg-white/40 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Năng lượng</span>
                                <span className="text-sm font-black text-blue-600 dark:text-blue-500">{u.aiTokens}</span>
                            </div>
                        </div>

                        {/* Hành động */}
                        <div className="flex items-center justify-between gap-2">
                            <button onClick={() => { setAccountData({ userId: u.id, userName: u.name, email: u.email, password: '' }); setShowEditAccountModal(true); }} className="flex-1 p-2.5 rounded-xl transition-all shadow-sm active:scale-95 bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20 flex items-center justify-center" title="Sửa Tài Khoản"><Settings className="w-4 h-4"/></button>
                            <button onClick={() => { setFundData({ userId: u.id, userName: u.name, assetType: 'FREE_COIN', amount: 100, reason: '' }); setShowFundModal(true); }} className="flex-1 p-2.5 rounded-xl transition-all shadow-sm active:scale-95 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 flex items-center justify-center" title="Nạp Tài Sản"><Wallet className="w-4 h-4"/></button>
                            <button onClick={() => togglePro(u)} className={cn("flex-1 p-2.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center", u.isPro ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20" : "bg-slate-500/10 text-slate-500 hover:text-yellow-500")} title="Đổi VIP"><Crown className="w-4 h-4"/></button>
                            {/* 🚨 ĐÃ FIX: NÚT BẤM THEO ROLE MOBILE */}
                            <button onClick={() => toggleLock(u)} className={cn("flex-1 p-2.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center", u.role !== 'BANNED' ? "bg-slate-500/10 text-slate-500 hover:text-red-500 hover:bg-red-500/20" : "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20")} title={u.role !== 'BANNED' ? "Khóa tài khoản" : "Mở khóa"}>{u.role !== 'BANNED' ? <Ban className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL ĐIỀU CHỈNH SỐ DƯ */}
            {showFundModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                            <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-3"><Wallet className="w-7 h-7 text-blue-500"/> Điều chỉnh</h3>
                            <button onClick={() => setShowFundModal(false)} className="text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleFundSubmit} className="p-6 flex flex-col gap-5">
                            <p className="text-sm font-bold text-slate-500">Tài khoản: <span className="text-blue-600 dark:text-blue-400 text-lg">{fundData.userName}</span></p>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Loại tài sản</label>
                                <select value={fundData.assetType} onChange={e => setFundData({...fundData, assetType: e.target.value})} className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-blue-500 text-sm font-bold">
                                    <option value="FREE_COIN">Xu Gacha</option><option value="STARDUST">Bụi Sao</option><option value="ENERGY">Năng lượng AI</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Số lượng (+ để cộng, - để trừ)</label>
                                <input required type="number" value={fundData.amount} onChange={e => setFundData({...fundData, amount: parseInt(e.target.value)})} className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-blue-500 text-sm font-bold" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Lý do</label>
                                <input required type="text" value={fundData.reason} onChange={e => setFundData({...fundData, reason: e.target.value})} className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-blue-500 text-sm" />
                            </div>
                            <button type="submit" disabled={isFunding} className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95">
                                {isFunding ? <Loader2 className="w-6 h-6 animate-spin"/> : "Xác nhận"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CHỈNH SỬA TÀI KHOẢN */}
            {showEditAccountModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                            <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-3">
                                <Settings className="w-7 h-7 text-purple-500"/> Sửa thông tin
                            </h3>
                            <button onClick={() => setShowEditAccountModal(false)} className="text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleEditAccountSubmit} className="p-6 flex flex-col gap-5">
                            <p className="text-sm font-bold text-slate-500">Tài khoản: <span className="text-purple-600 dark:text-purple-400 text-lg">{accountData.userName}</span></p>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Địa chỉ Email mới</label>
                                <input 
                                    required 
                                    type="email" 
                                    value={accountData.email} 
                                    onChange={e => setAccountData({...accountData, email: e.target.value})} 
                                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-purple-500 text-sm font-bold text-slate-800 dark:text-white" 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mật khẩu mới</label>
                                <input 
                                    type="text" 
                                    value={accountData.password} 
                                    onChange={e => setAccountData({...accountData, password: e.target.value})} 
                                    placeholder="Bỏ trống nếu không muốn đổi mk..."
                                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-purple-500 text-sm font-medium text-slate-800 dark:text-white" 
                                />
                                <p className="text-xs text-slate-500 mt-2 font-medium">Lưu ý: Mật khẩu sẽ được mã hóa bảo mật (hash) trước khi lưu vào hệ thống.</p>
                            </div>
                            
                            <button type="submit" disabled={isSavingAccount} className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95">
                                {isSavingAccount ? <Loader2 className="w-6 h-6 animate-spin"/> : "Lưu thay đổi"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}