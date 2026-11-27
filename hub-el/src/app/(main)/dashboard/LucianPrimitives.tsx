// Lucian UX/UI Prompt #009 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#009
// Lucian UX/UI Prompt #050 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#050
"use client";

import React, { useRef } from "react";
import { Play } from "lucide-react";

interface RollingActionButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export function RollingActionButton({ label, onClick, className = "" }: RollingActionButtonProps) {
  const chars = Array.from(label);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`ux u009-btn ${className}`}
      aria-label={label}
    >
      <span className="u009-word" aria-hidden="true">
        <span className="u009-face">
          {chars.map((ch, idx) => (
            <span
              key={idx}
              data-c={ch === " " ? "\u00A0" : ch}
              style={{ "--i": idx } as React.CSSProperties}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>
      </span>
      <span className="u009-orb" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
        <svg viewBox="0 0 24 24">
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
      </span>
    </button>
  );
}

interface SpotlightVideoCardProps {
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  onClick: () => void;
}

export function SpotlightVideoCard({
  title,
  channelTitle,
  thumbnailUrl,
  onClick,
}: SpotlightVideoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = cardRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    el.classList.add("is-live");
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * 6).toFixed(2)}deg`);
  };

  const handlePointerLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove("is-live");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="ux u050-card group flex flex-col gap-2.5 text-left"
    >
      <span className="u050-glare" aria-hidden="true" />
      <div className="w-full aspect-video rounded-[8px] overflow-hidden relative bg-[var(--ux-surface-3)] border border-[var(--ux-line)]">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="w-9 h-9 rounded-full bg-black/65 text-white flex items-center justify-center">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </span>
        </div>
      </div>
      <div className="min-w-0 px-0.5 pb-0.5">
        <h4
          className="font-medium text-[13.5px] text-[var(--ux-ink)] line-clamp-2 leading-snug group-hover:text-[var(--ux-accent)] transition-colors duration-200"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {channelTitle && (
          <p className="text-xs text-[var(--ux-ink-3)] mt-1 truncate">
            {channelTitle}
          </p>
        )}
      </div>
    </div>
  );
}
