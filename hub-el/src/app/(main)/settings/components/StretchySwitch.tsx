// Lucian UX/UI Prompt #013 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#013
"use client";

import React, { useEffect, useRef, useState } from "react";
import "./lucian-013.css";

interface StretchySwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

export default function StretchySwitch({
  checked,
  onChange,
  ariaLabel,
}: StretchySwitchProps) {
  const [isStretch, setIsStretch] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleToggle = () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!reduced) {
      setIsStretch(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsStretch(false), 170);
    }
    onChange(!checked);
  };

  return (
    <div
      className={`ux u013 ${checked ? "is-on" : ""} ${
        isStretch ? "is-stretch" : ""
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={handleToggle}
        className="u013-sw"
      >
        <span className="u013-knob" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path className="u013-x" d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
            <path className="u013-v" d="M5.5 12.5l4.5 4.5 8.5-9" />
          </svg>
        </span>
      </button>
    </div>
  );
}
