"use client";
import React, { useEffect, useState } from 'react';
import { Users, Crown, Sparkles, Banknote, Loader2, Dices } from 'lucide-react';
import { getAdminDashboardStats, getDashboardChartData } from '@/actions/admin/admin';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        getAdminDashboardStats().then(res => { if(res.success) setStats(res.data); });
        getDashboardChartData().then(res => { if(res.success) setChartData(res.data || []); });
    }, []);

    if (!stats) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>;

    const CARDS = [
        { title: "Tổng người dùng", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/20" },
        { title: "Tài khoản PRO", value: stats.proUsers, icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/10 dark:bg-yellow-500/20" },
        { title: "Tổng Thẻ Wiki", value: stats.totalCards, icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10 dark:bg-purple-500/20" },
        { title: "Tổng Doanh Thu", value: stats.totalRevenue.toLocaleString() + "đ", icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
    ];

    const CustomTooltip = ({ active, payload, label, unit }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/40 dark:border-slate-700 p-3 rounded-xl shadow-xl">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">{label}</p>
                    <p className="text-blue-500 font-black" style={{ color: payload[0].fill || payload[0].stroke }}>{payload[0].value.toLocaleString()} {unit}</p>
                </div>
            );
        }
        return null;
    };

    // CLASS DÙNG CHUNG CHO CÁC KHỐI KÍNH MỜ
    const glassClass = "bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-3xl shadow-lg";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full pb-10">
            <h1 className="text-4xl font-black mb-8 text-slate-800 dark:text-white">Tổng quan hệ thống</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {CARDS.map((c, i) => (
                    <div key={i} className={`p-6 ${glassClass} flex items-center gap-5 hover:scale-[1.02] transition-transform`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${c.bg} ${c.color}`}><c.icon className="w-8 h-8" /></div>
                        <div className="flex flex-col min-w-0">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{c.title}</p>
                            <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">{c.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 w-full">
                {/* 1. Doanh thu */}
                <div className={`p-6 lg:col-span-2 ${glassClass}`}>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Banknote className="w-6 h-6 text-emerald-500"/> Doanh thu 7 ngày qua</h2>
                    
                    {/* 🚨 ĐÃ FIX: Thêm min-w-0 và min-h-[300px] để sửa lỗi chart -1 */}
                    <div className="h-[300px] w-full min-w-0 min-h-[300px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                                    <YAxis hide />
                                    <RechartsTooltip content={<CustomTooltip unit="VNĐ" />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 8, 8]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500"/></div>}
                    </div>
                </div>

                {/* 2. Lượt Gacha */}
                <div className={`p-6 ${glassClass}`}>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Dices className="w-6 h-6 text-purple-500"/> Lượt quay Gacha</h2>
                    
                    {/* 🚨 ĐÃ FIX: Thêm min-w-0 và min-h-[300px] */}
                    <div className="h-[300px] w-full min-w-0 min-h-[300px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                                    <RechartsTooltip content={<CustomTooltip unit="Lượt quay" />} />
                                    <Line type="monotone" dataKey="gacha" stroke="#a855f7" strokeWidth={4} dot={{ fill: '#a855f7', strokeWidth: 3, r: 6 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-purple-500"/></div>}
                    </div>
                </div>

                <div className={`p-6 lg:col-span-3 ${glassClass}`}>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-blue-500"/> Người dùng mới 7 ngày qua</h2>
                    
                    <div className="h-[350px] w-full min-w-0 min-h-[350px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                                    <YAxis hide />
                                    <RechartsTooltip content={<CustomTooltip unit="Người dùng" />} />
                                    <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500"/></div>}
                    </div>
                </div>
            </div>
        </div>
    );
}