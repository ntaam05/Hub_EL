"use client";
import React, { useEffect, useState } from "react";
import { Users, Crown, Sparkles, Banknote, Loader2, Dices } from "lucide-react";
import {
  getAdminDashboardStats,
  getDashboardChartData,
} from "@/actions/admin/admin";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    getAdminDashboardStats().then((res) => {
      if (res.success) setStats(res.data);
    });
    getDashboardChartData().then((res) => {
      if (res.success) setChartData(res.data || []);
    });
  }, []);

  if (!stats) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ux-accent)]" />
      </div>
    );
  }

  const CARDS = [
    {
      title: "Tổng người dùng",
      value: (stats.totalUsers || 0).toLocaleString("vi-VN"),
      icon: Users,
      accentClass: "text-[var(--ux-accent)]",
    },
    {
      title: "Tài khoản PRO",
      value: (stats.proUsers || 0).toLocaleString("vi-VN"),
      icon: Crown,
      accentClass: "text-[var(--ux-warn)]",
    },
    {
      title: "Tổng thẻ Wiki",
      value: (stats.totalCards || 0).toLocaleString("vi-VN"),
      icon: Sparkles,
      accentClass: "text-[var(--ux-accent)]",
    },
    {
      title: "Tổng doanh thu",
      value: `${(stats.totalRevenue || 0).toLocaleString("vi-VN")} đ`,
      icon: Banknote,
      accentClass: "text-[var(--ux-mint)]",
    },
  ];

  const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--ux-surface)] border border-[var(--ux-line-2)] px-3 py-2 rounded-lg shadow-lg tabular-nums">
          <p className="text-xs font-medium text-[var(--ux-ink-2)] mb-0.5">
            {label}
          </p>
          <p className="text-sm font-semibold text-[var(--ux-ink)]">
            {payload[0].value.toLocaleString("vi-VN")} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-5 dash-enter">
      {/* 4 THẺ CHỈ SỐ TỔNG QUAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full tabular-nums">
        {CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="dash-card p-5 rounded-2xl flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--ux-ink-2)]">
                  {c.title}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] flex items-center justify-center shrink-0">
                  <Icon
                    className={`w-4 h-4 ${c.accentClass}`}
                    strokeWidth={1.75}
                  />
                </div>
              </div>
              <p className="text-2xl font-semibold text-[var(--ux-ink)] leading-none truncate">
                {c.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* BIỂU ĐỒ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
        {/* 1. Doanh thu */}
        <div className="dash-card p-5 rounded-2xl lg:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--ux-ink)] mb-5 flex items-center gap-2">
            <Banknote
              className="w-4 h-4 text-[var(--ux-mint)]"
              strokeWidth={1.75}
            />
            Doanh thu 7 ngày qua
          </h2>

          <div className="h-[280px] w-full min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--ux-line)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--ux-ink-3)" }}
                    dy={8}
                  />
                  <YAxis hide />
                  <RechartsTooltip
                    content={<CustomTooltip unit="VNĐ" />}
                    cursor={{ fill: "var(--ux-surface-2)", opacity: 0.6 }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--ux-mint)"
                    radius={[6, 6, 0, 0]}
                    barSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--ux-mint)]" />
              </div>
            )}
          </div>
        </div>

        {/* 2. Lượt Gacha */}
        <div className="dash-card p-5 rounded-2xl">
          <h2 className="text-sm font-semibold text-[var(--ux-ink)] mb-5 flex items-center gap-2">
            <Dices
              className="w-4 h-4 text-[var(--ux-warn)]"
              strokeWidth={1.75}
            />
            Lượt quay Gacha
          </h2>

          <div className="h-[280px] w-full min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--ux-line)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--ux-ink-3)" }}
                    dy={8}
                  />
                  <RechartsTooltip content={<CustomTooltip unit="lượt" />} />
                  <Line
                    type="monotone"
                    dataKey="gacha"
                    stroke="var(--ux-warn)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--ux-warn)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--ux-warn)]" />
              </div>
            )}
          </div>
        </div>

        {/* 3. Người dùng mới */}
        <div className="dash-card p-5 rounded-2xl lg:col-span-3">
          <h2 className="text-sm font-semibold text-[var(--ux-ink)] mb-5 flex items-center gap-2">
            <Users
              className="w-4 h-4 text-[var(--ux-accent)]"
              strokeWidth={1.75}
            />
            Người dùng mới 7 ngày qua
          </h2>

          <div className="h-[300px] w-full min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--ux-accent)"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--ux-accent)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--ux-line)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--ux-ink-3)" }}
                    dy={8}
                  />
                  <YAxis hide />
                  <RechartsTooltip
                    content={<CustomTooltip unit="người dùng" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="var(--ux-accent)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--ux-accent)]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
