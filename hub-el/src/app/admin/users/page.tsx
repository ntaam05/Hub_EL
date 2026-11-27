// Lucian UX/UI Prompt #003 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#003
"use client";
import React, { useEffect, useState } from "react";
import {
  getAdminUsers,
  updateAdminUser,
  adjustUserBalanceAction,
} from "@/actions/admin/admin";
import {
  Loader2,
  Ban,
  CheckCircle2,
  Shield,
  Crown,
  Wallet,
  X,
  Search,
  Settings,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmHoldDialog, {
  ConfirmDialogState,
} from "../../(main)/social/components/ConfirmHoldDialog";

type UserFilter = "all" | "active" | "pro" | "banned";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");

  const [showFundModal, setShowFundModal] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [fundData, setFundData] = useState({
    userId: "",
    userName: "",
    assetType: "FREE_COIN",
    amount: 0,
    reason: "",
  });

  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountData, setAccountData] = useState({
    userId: "",
    userName: "",
    email: "",
    password: "",
  });

  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmDialogState | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadData = () => {
    setLoading(true);
    getAdminUsers().then((res) => {
      if (res.success) setUsers(res.data || []);
      setLoading(false);
    });
  };
  useEffect(() => {
    loadData();
  }, []);

  const toggleLock = (user: any) => {
    if (user.role === "admin") {
      showToast("Không thể khóa tài khoản Admin", "error");
      return;
    }

    const isBanned = user.role === "BANNED";
    setConfirmDialog({
      title: isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản",
      description: isBanned
        ? `Tài khoản ${user.name} sẽ được khôi phục quyền truy cập`
        : `Tài khoản ${user.name} sẽ bị chặn đăng nhập vào hệ thống`,
      holdLabel: isBanned ? "Giữ để mở khóa" : "Giữ để khóa tài khoản",
      avatarUrl: user.avatar || user.image,
      targetName: user.name,
      onConfirm: async () => {
        await updateAdminUser(user.id, {
          role: isBanned ? "student" : "BANNED",
        });
        showToast(
          isBanned ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
          "success"
        );
        loadData();
      },
    });
  };

  const togglePro = (user: any) => {
    setConfirmDialog({
      title: user.isPro ? "Gỡ trạng thái PRO" : "Kích hoạt VIP PRO",
      description: user.isPro
        ? `Chuyển ${user.name} về tài khoản thường`
        : `Nâng cấp ${user.name} lên tài khoản PRO`,
      holdLabel: user.isPro ? "Giữ để gỡ PRO" : "Giữ để kích hoạt PRO",
      avatarUrl: user.avatar || user.image,
      targetName: user.name,
      onConfirm: async () => {
        await updateAdminUser(user.id, { isPro: !user.isPro });
        showToast("Đã cập nhật trạng thái VIP", "success");
        loadData();
      },
    });
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFunding(true);
    const res = await adjustUserBalanceAction(
      fundData.userId,
      fundData.assetType,
      fundData.amount,
      fundData.reason || "Admin điều chỉnh"
    );
    if (res.success) {
      setShowFundModal(false);
      loadData();
      showToast("Đã điều chỉnh tài sản thành công", "success");
    } else {
      showToast(res.error || "Có lỗi xảy ra", "error");
    }
    setIsFunding(false);
  };

  const handleEditAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAccount(true);
    const res = await updateAdminUser(accountData.userId, {
      email: accountData.email,
      password: accountData.password,
    });
    if (res.success) {
      setShowEditAccountModal(false);
      loadData();
      showToast("Đã cập nhật thông tin tài khoản", "success");
    } else {
      showToast(res.error || "Có lỗi xảy ra", "error");
    }
    setIsSavingAccount(false);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ux-accent)]" />
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchText =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id.includes(searchTerm);
    if (!matchText) return false;
    if (filter === "active") return u.role !== "BANNED";
    if (filter === "pro") return !!u.isPro;
    if (filter === "banned") return u.role === "BANNED";
    return true;
  });

  return (
    <div className="w-full space-y-5 dash-enter">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-[var(--ux-surface)] border-[var(--ux-line-2)] text-[var(--ux-ink)]">
          {toast.type === "success" ? (
            <CheckCircle2
              size={18}
              className="text-[var(--ux-mint)] shrink-0"
            />
          ) : (
            <AlertCircle
              size={18}
              className="text-[var(--ux-danger)] shrink-0"
            />
          )}
          <span className="text-xs sm:text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="dash-card rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all" as UserFilter, label: `Tất cả (${users.length})` },
            {
              id: "active" as UserFilter,
              label: `Hoạt động (${
                users.filter((u) => u.role !== "BANNED").length
              })`,
            },
            {
              id: "pro" as UserFilter,
              label: `VIP PRO (${users.filter((u) => u.isPro).length})`,
            },
            {
              id: "banned" as UserFilter,
              label: `Bị khóa (${
                users.filter((u) => u.role === "BANNED").length
              })`,
            },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tabular-nums border transition-colors ${
                  active
                    ? "bg-[var(--ux-accent)] text-white border-[var(--ux-accent)]"
                    : "bg-[var(--ux-surface-2)] text-[var(--ux-ink-2)] border-[var(--ux-line)] hover:text-[var(--ux-ink)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ux-ink-3)]"
            strokeWidth={1.75}
          />
          <input
            type="text"
            placeholder="Tìm tên, email hoặc ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--ux-surface-2)] border border-[var(--ux-line)] focus:border-[var(--ux-accent)] outline-none text-xs sm:text-sm text-[var(--ux-ink)] placeholder:text-[var(--ux-ink-3)] transition-colors"
          />
        </div>
      </div>

      {/* 1. GIAO DIỆN DESKTOP (TABLE) */}
      <div className="dash-card rounded-2xl overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--ux-surface-2)] border-b border-[var(--ux-line)] text-[var(--ux-ink-2)] font-medium text-xs">
              <tr>
                <th className="px-5 py-3.5">Người dùng</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Tài sản</th>
                <th className="px-5 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ux-line)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-sm text-[var(--ux-ink-3)]"
                  >
                    Không tìm thấy người dùng phù hợp
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={`desktop-${u.id}`}
                    className="hover:bg-[var(--ux-surface-2)]/60 transition-colors"
                  >
                    <td className="px-5 py-4 flex items-center gap-3.5">
                      <img
                        src={
                          u.avatar || u.image || "https://i.pravatar.cc/150"
                        }
                        alt={u.name}
                        className="w-11 h-11 rounded-full object-cover border border-[var(--ux-line-2)] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--ux-ink)] flex items-center gap-1.5">
                          {u.name}
                          {u.role === "admin" && (
                            <span title="Admin">
                              <Shield
                                className="w-4 h-4 text-[var(--ux-accent)]"
                                strokeWidth={1.75}
                              />
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[var(--ux-ink-3)] font-mono mt-0.5">
                          {u.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs sm:text-sm text-[var(--ux-ink-2)]">
                      {u.email}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {u.role !== "BANNED" ? (
                          <span className="px-2.5 py-1 bg-[var(--ux-mint)]/12 text-[var(--ux-mint)] rounded-md text-[11px] font-medium">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-[var(--ux-danger)]/12 text-[var(--ux-danger)] rounded-md text-[11px] font-medium">
                            Bị khóa
                          </span>
                        )}
                        {u.isPro && (
                          <span className="px-2.5 py-1 bg-[var(--ux-warn)]/12 text-[var(--ux-warn)] rounded-md text-[11px] font-medium inline-flex items-center gap-1">
                            <Crown className="w-3 h-3" /> PRO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs tabular-nums space-y-1">
                      <p className="text-[var(--ux-ink-2)]">
                        <span className="text-[var(--ux-warn)] font-medium">
                          Xu:
                        </span>{" "}
                        <span className="font-semibold text-[var(--ux-ink)]">
                          {(u.freeCoins || 0).toLocaleString("vi-VN")}
                        </span>
                      </p>
                      <p className="text-[var(--ux-ink-2)]">
                        <span className="text-[var(--ux-accent)] font-medium">
                          Bụi sao:
                        </span>{" "}
                        <span className="font-semibold text-[var(--ux-ink)]">
                          {(u.stardust || 0).toLocaleString("vi-VN")}
                        </span>
                      </p>
                      <p className="text-[var(--ux-ink-2)]">
                        <span className="text-[var(--ux-mint)] font-medium">
                          Năng lượng:
                        </span>{" "}
                        <span className="font-semibold text-[var(--ux-ink)]">
                          {u.aiTokens || 0}
                        </span>
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountData({
                              userId: u.id,
                              userName: u.name,
                              email: u.email,
                              password: "",
                            });
                            setShowEditAccountModal(true);
                          }}
                          className="w-9 h-9 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-2)] hover:text-[var(--ux-accent)] hover:border-[var(--ux-line-2)] flex items-center justify-center transition-colors"
                          title="Sửa Email & Mật khẩu"
                        >
                          <Settings className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFundData({
                              userId: u.id,
                              userName: u.name,
                              assetType: "FREE_COIN",
                              amount: 100,
                              reason: "",
                            });
                            setShowFundModal(true);
                          }}
                          className="w-9 h-9 rounded-lg bg-[var(--ux-accent-soft)] border border-[var(--ux-accent)]/25 text-[var(--ux-accent)] hover:bg-[var(--ux-accent)] hover:text-white flex items-center justify-center transition-colors"
                          title="Cộng/Trừ tài sản"
                        >
                          <Wallet className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePro(u)}
                          className={cn(
                            "w-9 h-9 rounded-lg border flex items-center justify-center transition-colors",
                            u.isPro
                              ? "bg-[var(--ux-warn)]/12 border-[var(--ux-warn)]/30 text-[var(--ux-warn)]"
                              : "bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-3)] hover:text-[var(--ux-warn)]"
                          )}
                          title="Đổi trạng thái VIP"
                        >
                          <Crown className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLock(u)}
                          className={cn(
                            "w-9 h-9 rounded-lg border flex items-center justify-center transition-colors",
                            u.role !== "BANNED"
                              ? "bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-3)] hover:text-[var(--ux-danger)] hover:border-[var(--ux-danger)]/35"
                              : "bg-[var(--ux-danger)]/12 border-[var(--ux-danger)]/35 text-[var(--ux-danger)]"
                          )}
                          title={
                            u.role !== "BANNED" ? "Khóa tài khoản" : "Mở khóa"
                          }
                        >
                          {u.role !== "BANNED" ? (
                            <Ban className="w-4 h-4" strokeWidth={1.75} />
                          ) : (
                            <CheckCircle2
                              className="w-4 h-4"
                              strokeWidth={1.75}
                            />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. GIAO DIỆN MOBILE (CARD) */}
      <div className="block md:hidden space-y-3.5">
        {filteredUsers.length === 0 ? (
          <div className="dash-card p-6 text-center text-sm text-[var(--ux-ink-3)] rounded-2xl">
            Không tìm thấy người dùng phù hợp
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={`mobile-${u.id}`}
              className="dash-card p-4 rounded-2xl flex flex-col gap-3.5"
            >
              <div className="flex items-start gap-3">
                <img
                  src={u.avatar || u.image || "https://i.pravatar.cc/150"}
                  alt={u.name}
                  className="w-11 h-11 rounded-full object-cover border border-[var(--ux-line-2)] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--ux-ink)] flex items-center gap-1.5 truncate">
                    {u.name}
                    {u.role === "admin" && (
                      <Shield className="w-3.5 h-3.5 text-[var(--ux-accent)] shrink-0" />
                    )}
                  </p>
                  <p className="text-xs text-[var(--ux-ink-2)] truncate">
                    {u.email}
                  </p>
                  <p className="text-[11px] text-[var(--ux-ink-3)] font-mono mt-0.5 truncate">
                    {u.id}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {u.role !== "BANNED" ? (
                    <span className="px-2 py-0.5 bg-[var(--ux-mint)]/12 text-[var(--ux-mint)] rounded-md text-[10.5px] font-medium">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[var(--ux-danger)]/12 text-[var(--ux-danger)] rounded-md text-[10.5px] font-medium">
                      Bị khóa
                    </span>
                  )}
                  {u.isPro && (
                    <span className="px-2 py-0.5 bg-[var(--ux-warn)]/12 text-[var(--ux-warn)] rounded-md text-[10.5px] font-medium inline-flex items-center gap-1">
                      <Crown className="w-3 h-3" /> PRO
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-[var(--ux-line)] tabular-nums">
                <div className="p-2 bg-[var(--ux-surface-2)] rounded-lg text-center">
                  <span className="text-[11px] text-[var(--ux-ink-3)] block">
                    Xu
                  </span>
                  <span className="text-sm font-semibold text-[var(--ux-warn)]">
                    {u.freeCoins}
                  </span>
                </div>
                <div className="p-2 bg-[var(--ux-surface-2)] rounded-lg text-center">
                  <span className="text-[11px] text-[var(--ux-ink-3)] block">
                    Bụi sao
                  </span>
                  <span className="text-sm font-semibold text-[var(--ux-accent)]">
                    {u.stardust}
                  </span>
                </div>
                <div className="p-2 bg-[var(--ux-surface-2)] rounded-lg text-center">
                  <span className="text-[11px] text-[var(--ux-ink-3)] block">
                    Năng lượng
                  </span>
                  <span className="text-sm font-semibold text-[var(--ux-mint)]">
                    {u.aiTokens}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccountData({
                      userId: u.id,
                      userName: u.name,
                      email: u.email,
                      password: "",
                    });
                    setShowEditAccountModal(true);
                  }}
                  className="h-9 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-2)] flex items-center justify-center"
                  title="Sửa tài khoản"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFundData({
                      userId: u.id,
                      userName: u.name,
                      assetType: "FREE_COIN",
                      amount: 100,
                      reason: "",
                    });
                    setShowFundModal(true);
                  }}
                  className="h-9 rounded-lg bg-[var(--ux-accent-soft)] border border-[var(--ux-accent)]/25 text-[var(--ux-accent)] flex items-center justify-center"
                  title="Cộng/Trừ tài sản"
                >
                  <Wallet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => togglePro(u)}
                  className={cn(
                    "h-9 rounded-lg border flex items-center justify-center",
                    u.isPro
                      ? "bg-[var(--ux-warn)]/12 border-[var(--ux-warn)]/30 text-[var(--ux-warn)]"
                      : "bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-3)]"
                  )}
                  title="Đổi VIP"
                >
                  <Crown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleLock(u)}
                  className={cn(
                    "h-9 rounded-lg border flex items-center justify-center",
                    u.role !== "BANNED"
                      ? "bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-3)]"
                      : "bg-[var(--ux-danger)]/12 border-[var(--ux-danger)]/35 text-[var(--ux-danger)]"
                  )}
                  title={u.role !== "BANNED" ? "Khóa tài khoản" : "Mở khóa"}
                >
                  {u.role !== "BANNED" ? (
                    <Ban className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL ĐIỀU CHỈNH SỐ DƯ */}
      {showFundModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-[var(--ux-surface)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[var(--ux-line-2)]">
            <div className="px-6 py-4 border-b border-[var(--ux-line)] flex justify-between items-center">
              <h3 className="font-semibold text-base text-[var(--ux-ink)] flex items-center gap-2">
                <Wallet
                  className="w-4 h-4 text-[var(--ux-accent)]"
                  strokeWidth={1.75}
                />
                Điều chỉnh tài sản
              </h3>
              <button
                type="button"
                onClick={() => setShowFundModal(false)}
                className="w-8 h-8 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-3)] hover:text-[var(--ux-ink)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleFundSubmit} className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[var(--ux-ink-2)]">
                Tài khoản:{" "}
                <span className="font-semibold text-[var(--ux-ink)]">
                  {fundData.userName}
                </span>
              </p>
              <div>
                <label className="block text-xs font-medium text-[var(--ux-ink-2)] mb-1.5">
                  Loại tài sản
                </label>
                <select
                  value={fundData.assetType}
                  onChange={(e) =>
                    setFundData({ ...fundData, assetType: e.target.value })
                  }
                  className="w-full bg-[var(--ux-surface-2)] px-3.5 py-2.5 rounded-xl outline-none border border-[var(--ux-line)] focus:border-[var(--ux-accent)] text-sm text-[var(--ux-ink)]"
                >
                  <option value="FREE_COIN">Xu Gacha</option>
                  <option value="STARDUST">Bụi Sao</option>
                  <option value="ENERGY">Năng lượng AI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ux-ink-2)] mb-1.5">
                  Số lượng (+ để cộng, - để trừ)
                </label>
                <input
                  required
                  type="number"
                  value={fundData.amount}
                  onChange={(e) =>
                    setFundData({
                      ...fundData,
                      amount: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full bg-[var(--ux-surface-2)] px-3.5 py-2.5 rounded-xl outline-none border border-[var(--ux-line)] focus:border-[var(--ux-accent)] text-sm tabular-nums text-[var(--ux-ink)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ux-ink-2)] mb-1.5">
                  Lý do
                </label>
                <input
                  required
                  type="text"
                  value={fundData.reason}
                  onChange={(e) =>
                    setFundData({ ...fundData, reason: e.target.value })
                  }
                  className="w-full bg-[var(--ux-surface-2)] px-3.5 py-2.5 rounded-xl outline-none border border-[var(--ux-line)] focus:border-[var(--ux-accent)] text-sm text-[var(--ux-ink)]"
                />
              </div>
              <button
                type="submit"
                disabled={isFunding}
                className="mt-2 w-full bg-[var(--ux-accent)] hover:bg-[var(--ux-accent-2)] text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isFunding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Xác nhận"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA TÀI KHOẢN */}
      {showEditAccountModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-[var(--ux-surface)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[var(--ux-line-2)]">
            <div className="px-6 py-4 border-b border-[var(--ux-line)] flex justify-between items-center">
              <h3 className="font-semibold text-base text-[var(--ux-ink)] flex items-center gap-2">
                <Settings
                  className="w-4 h-4 text-[var(--ux-accent)]"
                  strokeWidth={1.75}
                />
                Sửa thông tin tài khoản
              </h3>
              <button
                type="button"
                onClick={() => setShowEditAccountModal(false)}
                className="w-8 h-8 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-3)] hover:text-[var(--ux-ink)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={handleEditAccountSubmit}
              className="p-6 flex flex-col gap-4"
            >
              <p className="text-xs text-[var(--ux-ink-2)]">
                Tài khoản:{" "}
                <span className="font-semibold text-[var(--ux-ink)]">
                  {accountData.userName}
                </span>
              </p>

              <div>
                <label className="block text-xs font-medium text-[var(--ux-ink-2)] mb-1.5">
                  Địa chỉ Email mới
                </label>
                <input
                  required
                  type="email"
                  value={accountData.email}
                  onChange={(e) =>
                    setAccountData({ ...accountData, email: e.target.value })
                  }
                  className="w-full bg-[var(--ux-surface-2)] px-3.5 py-2.5 rounded-xl outline-none border border-[var(--ux-line)] focus:border-[var(--ux-accent)] text-sm text-[var(--ux-ink)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ux-ink-2)] mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type="text"
                  value={accountData.password}
                  onChange={(e) =>
                    setAccountData({ ...accountData, password: e.target.value })
                  }
                  placeholder="Bỏ trống nếu không muốn đổi mật khẩu"
                  className="w-full bg-[var(--ux-surface-2)] px-3.5 py-2.5 rounded-xl outline-none border border-[var(--ux-line)] focus:border-[var(--ux-accent)] text-sm text-[var(--ux-ink)] placeholder:text-[var(--ux-ink-3)]"
                />
                <p className="text-[11px] text-[var(--ux-ink-3)] mt-1.5">
                  Mật khẩu sẽ được mã hóa bảo mật trước khi lưu vào hệ thống
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingAccount}
                className="mt-2 w-full bg-[var(--ux-accent)] hover:bg-[var(--ux-accent-2)] text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSavingAccount ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmHoldDialog
        config={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
}
