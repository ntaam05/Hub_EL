import React from "react";
import {
  UserCircle,
  BellOff,
  Bell,
  Image as ImageIcon,
  Link as LinkIcon,
  UserMinus,
  Unlock,
  Ban,
  Users,
  Edit3,
  LogOut,
  Camera,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatRightSidebar({
  activeFriend,
  currentUserId,
  mediaFilesCount,
  linkFilesCount,
  onOpenMedia,
  onOpenLinks,
  onRemoveFriend,
  onBlockUser,
  onUnblockUser,
  router,
  isMuted,
  onToggleMute,
  onRenameGroup,
  onViewGroupMembers,
  onUpdateGroupAvatar,
  onDeleteGroup,
  onLeaveGroup,
}: any) {
  if (!activeFriend) return null;

  return (
    <aside className="ux w-[280px] xl:w-[300px] shrink-0 border-l border-[var(--ux-line)] hidden lg:flex flex-col bg-[var(--ux-surface)] overflow-y-auto">
      <div className="p-5 flex flex-col items-center border-b border-[var(--ux-line)]">
        <div
          className={cn(
            "relative group",
            activeFriend.isGroup && "cursor-pointer"
          )}
          onClick={activeFriend.isGroup ? onUpdateGroupAvatar : undefined}
        >
          <img
            src={activeFriend.avatar || "https://i.pravatar.cc/150"}
            alt={activeFriend.name}
            className="w-16 h-16 rounded-full mb-3 border border-[var(--ux-line-2)] object-cover group-hover:opacity-75 transition-opacity"
          />
          {activeFriend.isGroup && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pb-3">
              <div className="bg-black/65 p-1.5 rounded-full">
                <Camera className="w-4 h-4 text-white" strokeWidth={1.75} />
              </div>
            </div>
          )}
        </div>

        <h2 className="text-base font-semibold text-[var(--ux-ink)] text-center">
          {activeFriend.name}
        </h2>
        <p className="text-xs text-[var(--ux-ink-3)] mt-0.5 mb-4">
          {activeFriend.isGroup
            ? `${activeFriend.memberCount || "Nhiều"} thành viên`
            : activeFriend.isBlockedByMe || activeFriend.isBlockedByThem
            ? "Ngoại tuyến"
            : activeFriend.isOnline
            ? "Đang hoạt động"
            : "Ngoại tuyến"}
        </p>

        <div className="flex gap-3 text-xs font-medium">
          {activeFriend.isGroup ? (
            <button
              type="button"
              onClick={onViewGroupMembers}
              className="flex flex-col items-center gap-1.5 hover:bg-[var(--ux-surface-2)] px-3 py-2 rounded-xl transition-colors text-[var(--ux-ink-2)]"
            >
              <div className="w-9 h-9 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-full flex items-center justify-center text-[var(--ux-ink-2)]">
                <Users className="w-4 h-4" strokeWidth={1.75} />
              </div>
              Thành viên
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/profile/${activeFriend.id}`)}
              className="flex flex-col items-center gap-1.5 hover:bg-[var(--ux-surface-2)] px-3 py-2 rounded-xl transition-colors text-[var(--ux-ink-2)]"
            >
              <div className="w-9 h-9 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-full flex items-center justify-center text-[var(--ux-ink-2)]">
                <UserCircle className="w-4 h-4" strokeWidth={1.75} />
              </div>
              Hồ sơ
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            className={cn(
              "flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-colors",
              isMuted
                ? "hover:bg-[var(--ux-danger)]/10 text-[var(--ux-danger)]"
                : "hover:bg-[var(--ux-surface-2)] text-[var(--ux-ink-2)]"
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border transition-colors",
                isMuted
                  ? "bg-[var(--ux-danger)]/10 border-[var(--ux-danger)]/30 text-[var(--ux-danger)]"
                  : "bg-[var(--ux-surface-2)] border-[var(--ux-line)] text-[var(--ux-ink-2)]"
              )}
            >
              {isMuted ? (
                <BellOff className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <Bell className="w-4 h-4" strokeWidth={1.75} />
              )}
            </div>
            {isMuted ? "Bật âm" : "Tắt âm"}
          </button>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1">
        {activeFriend.isGroup && (
          <>
            <button
              type="button"
              onClick={onRenameGroup}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--ux-surface-2)] rounded-xl text-[13px] font-medium text-[var(--ux-ink)] transition-colors"
            >
              Đổi tên nhóm
              <Edit3
                className="w-4 h-4 text-[var(--ux-ink-3)]"
                strokeWidth={1.75}
              />
            </button>
            <div className="h-px bg-[var(--ux-line)] my-1.5" />
          </>
        )}

        <button
          type="button"
          onClick={onOpenMedia}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--ux-surface-2)] rounded-xl text-[13px] font-medium text-[var(--ux-ink)] transition-colors"
        >
          File phương tiện
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--ux-ink-3)] tabular-nums">
              {mediaFilesCount}
            </span>
            <ImageIcon
              className="w-4 h-4 text-[var(--ux-ink-3)]"
              strokeWidth={1.75}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenLinks}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--ux-surface-2)] rounded-xl text-[13px] font-medium text-[var(--ux-ink)] transition-colors"
        >
          File đính kèm
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--ux-ink-3)] tabular-nums">
              {linkFilesCount}
            </span>
            <LinkIcon
              className="w-4 h-4 text-[var(--ux-ink-3)]"
              strokeWidth={1.75}
            />
          </div>
        </button>

        {!activeFriend.isGroup ? (
          <div className="pt-3 mt-2 border-t border-[var(--ux-line)] space-y-1">
            {!activeFriend.isBlockedByMe && !activeFriend.isBlockedByThem && (
              <button
                type="button"
                onClick={onRemoveFriend}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--ux-danger)]/10 text-[var(--ux-danger)] rounded-xl text-[13px] font-medium transition-colors"
              >
                Xóa kết bạn
                <UserMinus className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
            {activeFriend.isBlockedByMe ? (
              <button
                type="button"
                onClick={onUnblockUser}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--ux-mint)]/10 text-[var(--ux-mint)] rounded-xl text-[13px] font-medium transition-colors"
              >
                Bỏ chặn
                <Unlock className="w-4 h-4" strokeWidth={1.75} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onBlockUser}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--ux-danger)]/10 text-[var(--ux-danger)] rounded-xl text-[13px] font-medium transition-colors"
              >
                Chặn người dùng
                <Ban className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        ) : (
          <div className="pt-3 mt-2 border-t border-[var(--ux-line)]">
            {activeFriend.leaderId === currentUserId ? (
              <button
                type="button"
                onClick={onDeleteGroup}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--ux-danger)]/10 text-[var(--ux-danger)] rounded-xl text-[13px] font-medium transition-colors"
              >
                Giải tán nhóm
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onLeaveGroup}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--ux-danger)]/10 text-[var(--ux-danger)] rounded-xl text-[13px] font-medium transition-colors"
              >
                Rời khỏi nhóm
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
