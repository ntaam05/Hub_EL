"use client";
import React, { useEffect, useState } from 'react';
import { getAdminOrders, getAdminCoinTransactions } from '@/actions/admin/admin';
import { Loader2, CreditCard, Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Coins, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [coinTrans, setCoinTrans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState(""); 

    useEffect(() => {
        Promise.all([getAdminOrders(), getAdminCoinTransactions()]).then(([resOrders, resCoins]) => {
            if(resOrders.success) setOrders(resOrders.data || []);
            if(resCoins.success) setCoinTrans(resCoins.data || []);
            setLoading(false);
        });
    }, []);

    const formatTime = (dateString: string) => new Date(dateString).toLocaleString('vi-VN');
    if (loading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500"/></div>;

    const glassClass = "bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl";

    const filteredOrders = orders.filter(o => 
        o.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCoinTrans = coinTrans.filter(t => 
        t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full pb-10">
            <h1 className="text-3xl md:text-4xl font-black mb-8 text-slate-800 dark:text-white flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl"><CreditCard className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" /></div> Lịch sử Giao dịch
            </h1>
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
                    <button onClick={() => setActiveTab(0)} className={cn("flex-1 lg:flex-none px-4 md:px-6 py-3.5 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2 transition-all", activeTab === 0 ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30" : "bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-white/80")}>
                        <CreditCard className="w-5 h-5"/> Đơn MoMo
                    </button>
                    <button onClick={() => setActiveTab(1)} className={cn("flex-1 lg:flex-none px-4 md:px-6 py-3.5 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2 transition-all", activeTab === 1 ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30" : "bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-white/80")}>
                        <Coins className="w-5 h-5"/> Sổ cái biến động
                    </button>
                </div>

                {/* THANH TÌM KIẾM */}
                <div className="relative w-full lg:w-80 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={activeTab === 0 ? "Tìm mã đơn, tên, email..." : "Tìm tên, email, lý do..."}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-${activeTab === 0 ? 'emerald' : 'blue'}-500 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 transition-all ${glassClass}`}
                    />
                </div>
            </div>

            {/* 1. GIAO DIỆN DESKTOP (TABLE) */}
            <div className={`hidden md:block rounded-3xl overflow-hidden ${glassClass}`}>
                <div className="overflow-x-auto">
                    {activeTab === 0 && (
                        <table className="w-full text-left text-sm whitespace-nowrap animate-in fade-in">
                            <thead className="bg-white/40 dark:bg-slate-800/40 border-b border-white/20 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[12px]">
                                <tr>
                                    <th className="p-6">Mã đơn</th><th className="p-6">Khách hàng</th><th className="p-6">Giao dịch</th><th className="p-6 text-right">Số tiền (VNĐ)</th><th className="p-6">Trạng thái</th><th className="p-6">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20 dark:divide-slate-700/50">
                                {filteredOrders.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-slate-500 font-medium">Không tìm thấy đơn hàng nào.</td></tr> : filteredOrders.map(order => (
                                    <tr key={`desktop-order-${order.id}`} className="hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-6 font-mono text-[14px] font-bold text-slate-600 dark:text-slate-300">{order.orderCode}</td>
                                        <td className="p-6"><p className="font-bold text-[15px] text-slate-800 dark:text-white">{order.user?.name || 'User Ẩn'}</p><p className="text-[12px] text-slate-500">{order.user?.email}</p></td>
                                        <td className="p-6"><span className="px-4 py-1.5 bg-slate-500/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase">{order.planId || ['SUBSCRIPTION', 'VIP', 'PRO', 'PLAN'].includes(order.type?.toUpperCase()) ? 'Mua VIP PRO' : 'Nạp Xu'}</span></td>
                                        <td className="p-6 text-right font-black text-lg text-emerald-600 dark:text-emerald-400">{order.amount.toLocaleString()}đ</td>
                                        <td className="p-6">
                                            {order.status === 'SUCCESS' ? <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase"><CheckCircle2 className="w-5 h-5"/> Thành công</span> : order.status === 'FAILED' ? <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-black uppercase"><XCircle className="w-5 h-5"/> Thất bại</span> : <span className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400 text-xs font-black uppercase"><Clock className="w-5 h-5"/> Đang chờ</span>}
                                        </td>
                                        <td className="p-6 text-sm text-slate-600 dark:text-slate-400 font-medium">{formatTime(order.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 1 && (
                        <table className="w-full text-left text-sm whitespace-nowrap animate-in fade-in">
                            <thead className="bg-white/40 dark:bg-slate-800/40 border-b border-white/20 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[12px]">
                                <tr>
                                    <th className="p-6">Người dùng</th><th className="p-6">Loại tài sản</th><th className="p-6 text-right">Biến động</th><th className="p-6">Lý do (Nguồn)</th><th className="p-6">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20 dark:divide-slate-700/50">
                                {filteredCoinTrans.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-medium">Không tìm thấy biến động nào.</td></tr> : filteredCoinTrans.map(trans => (
                                    <tr key={`desktop-trans-${trans.id}`} className="hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-6"><p className="font-bold text-[15px] text-slate-800 dark:text-white">{trans.user?.name || 'User Ẩn'}</p><p className="text-[12px] text-slate-500">{trans.user?.email}</p></td>
                                        <td className="p-6 font-black text-[14px] text-slate-600 dark:text-slate-300">{trans.currencyType}</td>
                                        <td className="p-6 text-right font-black text-lg">
                                            {trans.amount > 0 
                                                ? <span className="text-emerald-500 flex items-center justify-end gap-1"><ArrowUpRight className="w-5 h-5"/> +{trans.amount}</span>
                                                : <span className="text-red-500 flex items-center justify-end gap-1"><ArrowDownRight className="w-5 h-5"/> {trans.amount}</span>
                                            }
                                        </td>
                                        <td className="p-6 text-slate-700 dark:text-slate-300 font-medium max-w-[250px] truncate" title={trans.reason}>{trans.reason}</td>
                                        <td className="p-6 text-sm text-slate-600 dark:text-slate-400 font-medium">{formatTime(trans.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* 2. GIAO DIỆN MOBILE (CARD) */}
            <div className="block md:hidden space-y-4">
                {activeTab === 0 && (
                    filteredOrders.length === 0 ? (
                        <div className={`p-6 text-center text-slate-500 font-medium rounded-3xl ${glassClass}`}>Không tìm thấy đơn hàng nào.</div>
                    ) : filteredOrders.map(order => (
                        <div key={`mobile-order-${order.id}`} className={`p-5 rounded-3xl flex flex-col gap-3 ${glassClass} animate-in fade-in`}>
                            <div className="flex justify-between items-start">
                                <div className="min-w-0 pr-2">
                                    <p className="font-bold text-[15px] text-slate-800 dark:text-white truncate">{order.user?.name || 'User Ẩn'}</p>
                                    <p className="text-[12px] text-slate-500 truncate">{order.user?.email}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-[16px] text-emerald-600 dark:text-emerald-400">{order.amount.toLocaleString()}đ</p>
                                    <p className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">#{order.orderCode}</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-white/20 dark:border-slate-700/50">
                                <span className="px-3 py-1.5 bg-slate-500/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    {order.planId || ['SUBSCRIPTION', 'VIP', 'PRO', 'PLAN'].includes(order.type?.toUpperCase()) ? 'Mua VIP PRO' : 'Nạp Xu'}
                                </span>
                                {order.status === 'SUCCESS' ? (
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase"><CheckCircle2 className="w-4 h-4"/> Thành công</span>
                                ) : order.status === 'FAILED' ? (
                                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-[11px] font-black uppercase"><XCircle className="w-4 h-4"/> Thất bại</span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400 text-[11px] font-black uppercase"><Clock className="w-4 h-4"/> Đang chờ</span>
                                )}
                            </div>
                            <div className="text-right text-[11px] text-slate-500 font-medium">
                                {formatTime(order.createdAt)}
                            </div>
                        </div>
                    ))
                )}

                {activeTab === 1 && (
                    filteredCoinTrans.length === 0 ? (
                        <div className={`p-6 text-center text-slate-500 font-medium rounded-3xl ${glassClass}`}>Không tìm thấy biến động nào.</div>
                    ) : filteredCoinTrans.map(trans => (
                        <div key={`mobile-trans-${trans.id}`} className={`p-5 rounded-3xl flex flex-col gap-3 ${glassClass} animate-in fade-in`}>
                            <div className="flex justify-between items-start">
                                <div className="min-w-0 pr-2">
                                    <p className="font-bold text-[15px] text-slate-800 dark:text-white truncate">{trans.user?.name || 'User Ẩn'}</p>
                                    <p className="text-[12px] text-slate-500 truncate">{trans.user?.email}</p>
                                </div>
                                <div className="text-right shrink-0 flex flex-col items-end">
                                    {trans.amount > 0 ? (
                                        <p className="font-black text-[18px] text-emerald-500 flex items-center justify-end gap-1"><ArrowUpRight className="w-4 h-4"/> +{trans.amount}</p>
                                    ) : (
                                        <p className="font-black text-[18px] text-red-500 flex items-center justify-end gap-1"><ArrowDownRight className="w-4 h-4"/> {trans.amount}</p>
                                    )}
                                    <span className="px-2 py-0.5 bg-slate-500/10 text-slate-600 dark:text-slate-300 rounded text-[10px] font-black uppercase mt-1">{trans.currencyType}</span>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-white/20 dark:border-slate-700/50 flex justify-between items-end gap-2">
                                <p className="text-[12px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2 flex-1"><span className="font-bold text-slate-500">Lý do:</span> {trans.reason}</p>
                                <p className="text-[10px] text-slate-500 font-medium shrink-0 mb-0.5">{formatTime(trans.createdAt)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    )
}