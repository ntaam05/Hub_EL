// Lucian UX/UI Prompt #003 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#003
"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmDialogState {
  title: string;
  description: string;
  holdLabel: string;
  avatarUrl?: string;
  targetName?: string;
  onConfirm: () => Promise<void> | void;
}

interface ConfirmHoldDialogProps {
  config: ConfirmDialogState | null;
  onClose: () => void;
}

export default function ConfirmHoldDialog({
  config,
  onClose,
}: ConfirmHoldDialogProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const pRef = useRef<number>(0);
  const holdingRef = useRef<boolean>(false);
  const finishedRef = useRef<boolean>(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const HOLD_MS = 1000;

  useEffect(() => {
    if (!config) return;
    pRef.current = 0;
    holdingRef.current = false;
    finishedRef.current = false;
    setIsHolding(false);
    setIsBusy(false);
    if (btnRef.current) {
      btnRef.current.style.setProperty("--p", "0");
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [config, onClose, isBusy]);

  if (!config) return null;

  const setProgress = (val: number) => {
    pRef.current = val;
    if (btnRef.current) {
      btnRef.current.style.setProperty("--p", val.toFixed(4));
    }
  };

  const complete = async () => {
    holdingRef.current = false;
    finishedRef.current = true;
    rafRef.current = 0;
    lastRef.current = 0;
    setIsHolding(false);
    setIsBusy(true);
    try {
      await config.onConfirm();
    } finally {
      setIsBusy(false);
      onClose();
    }
  };

  const tick = (now: number) => {
    const dt = now - (lastRef.current || now);
    lastRef.current = now;

    if (holdingRef.current) {
      setProgress(Math.min(1, pRef.current + dt / HOLD_MS));
    } else {
      setProgress(Math.max(0, pRef.current - dt / (HOLD_MS / 2.4)));
    }

    if (pRef.current >= 1 && holdingRef.current) {
      void complete();
      return;
    }

    if (holdingRef.current || pRef.current > 0) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = 0;
      lastRef.current = 0;
    }
  };

  const startHold = () => {
    if (finishedRef.current || isBusy) return;
    holdingRef.current = true;
    setIsHolding(true);
    if (!rafRef.current) {
      lastRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const stopHold = () => {
    holdingRef.current = false;
    setIsHolding(false);
    if (!rafRef.current && pRef.current > 0) {
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  return (
    <div
      className="ux fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-hold-title"
      onClick={() => {
        if (!isBusy) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--ux-surface)] border border-[var(--ux-line-2)] shadow-2xl p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--ux-danger)]/12 text-[var(--ux-danger)] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2
                id="confirm-hold-title"
                className="text-base font-semibold text-[var(--ux-ink)] truncate"
              >
                {config.title}
              </h2>
              <p className="text-xs text-[var(--ux-ink-3)] mt-0.5">
                Giữ nút bên dưới để xác nhận thao tác
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] text-[var(--ux-ink-3)] hover:text-[var(--ux-ink)] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {(config.targetName || config.avatarUrl) && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--ux-surface-2)] border border-[var(--ux-line)]">
            {config.avatarUrl && (
              <img
                src={config.avatarUrl}
                alt={config.targetName || "Avatar"}
                className="w-10 h-10 rounded-full object-cover border border-[var(--ux-line-2)] shrink-0"
              />
            )}
            <div className="min-w-0">
              {config.targetName && (
                <p className="text-sm font-medium text-[var(--ux-ink)] truncate">
                  {config.targetName}
                </p>
              )}
              <p className="text-xs text-[var(--ux-ink-2)] mt-0.5 leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>
        )}

        {!config.targetName && !config.avatarUrl && (
          <p className="text-sm text-[var(--ux-ink-2)] leading-relaxed">
            {config.description}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            ref={btnRef}
            type="button"
            disabled={isBusy}
            aria-label={config.holdLabel}
            onPointerDown={(e) => {
              if (e.button === 0) {
                e.currentTarget.setPointerCapture(e.pointerId);
                startHold();
              }
            }}
            onPointerUp={stopHold}
            onPointerCancel={stopHold}
            onLostPointerCapture={stopHold}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                if (!e.repeat) startHold();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") stopHold();
            }}
            onBlur={stopHold}
            onClick={(e) => e.preventDefault()}
            className={`u003-btn ${isHolding ? "is-holding" : ""}`}
          >
            <span className="u003-lab">
              {isBusy ? "Đang xử lý..." : config.holdLabel}
            </span>
            <span className="u003-lab u003-fill" aria-hidden="true">
              {isBusy ? "Đang xử lý..." : config.holdLabel}
            </span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="w-full h-10 rounded-[10px] bg-[var(--ux-surface-2)] hover:bg-[var(--ux-surface-3)] border border-[var(--ux-line)] text-xs font-medium text-[var(--ux-ink-2)] transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
