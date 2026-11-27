// Lucian UX/UI Prompt #429 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#429
"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { History, Search } from "lucide-react";
import "./lucian-429.css";

interface SearchEntry {
  label: string;
  meta: string;
  kind: "history" | "suggestion";
}

interface LucianSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmitTerm: (term: string) => void;
  historyList: string[];
  suggestionList: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
}

export default function LucianSearchBar({
  value,
  onChange,
  onSubmitTerm,
  historyList,
  suggestionList,
  isOpen,
  onOpenChange,
  placeholder = "Tìm kiếm khóa học, video",
}: LucianSearchBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(
      navigator.platform || navigator.userAgent || ""
    );
    setShortcutLabel(isMac ? "⌘K" : "Ctrl K");
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        inputRef.current?.focus({ preventScroll: true });
        inputRef.current?.select();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  const items = useMemo<SearchEntry[]>(() => {
    const hist = historyList.map((label) => ({
      label,
      meta: "Gần đây",
      kind: "history" as const,
    }));
    const sug = suggestionList.map((label) => ({
      label,
      meta: "Gợi ý",
      kind: "suggestion" as const,
    }));
    return [...hist, ...sug].slice(0, 8);
  }, [historyList, suggestionList]);

  useEffect(() => {
    if (isOpen && items.length > 0) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [isOpen, items.length]);

  const showDropdown = isOpen && items.length > 0;

  const renderHighlighted = (text: string) => {
    const q = value.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length > 0) {
      e.preventDefault();
      if (!isOpen) {
        onOpenChange(true);
        return;
      }
      setActiveIndex((prev) =>
        e.key === "ArrowDown"
          ? (prev + 1) % items.length
          : (prev - 1 + items.length) % items.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown && activeIndex >= 0 && items[activeIndex]) {
        onSubmitTerm(items[activeIndex].label);
      } else if (value.trim()) {
        onSubmitTerm(value);
      }
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`ux u429 ${showDropdown ? "is-open" : ""}`}
      onBlur={(e) => {
        if (
          e.relatedTarget &&
          rootRef.current &&
          !rootRef.current.contains(e.relatedTarget as Node)
        ) {
          onOpenChange(false);
        }
      }}
    >
      <div className="u429-w">
        <label className="u429-f">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
          </svg>
          <input
            ref={inputRef}
            className="u429-in"
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={
              showDropdown && activeIndex >= 0
                ? `${listboxId}-opt-${activeIndex}`
                : undefined
            }
            aria-label="Tìm kiếm khóa học"
            placeholder={placeholder}
            value={value}
            autoComplete="off"
            spellCheck={false}
            onFocus={() => onOpenChange(true)}
            onClick={() => {
              if (!isOpen) onOpenChange(true);
            }}
            onChange={(e) => {
              onChange(e.target.value);
              onOpenChange(true);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="u429-kb" aria-hidden="true">
            {shortcutLabel}
          </kbd>
        </label>

        <div
          className="u429-dd"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="u429-lb" id={listboxId} role="listbox">
            <i
              className="u429-pill"
              aria-hidden="true"
              style={
                {
                  "--py": `${Math.max(0, activeIndex) * 40}px`,
                  "--po": activeIndex >= 0 ? 1 : 0,
                } as React.CSSProperties
              }
            />
            {items.map((item, idx) => (
              <div
                key={`${item.kind}-${idx}-${item.label}`}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                className="u429-o"
                style={{ "--i": idx } as React.CSSProperties}
                onPointerMove={() => {
                  if (activeIndex !== idx) setActiveIndex(idx);
                }}
                onClick={() => onSubmitTerm(item.label)}
              >
                <span className="u429-ic" aria-hidden="true">
                  {item.kind === "history" ? (
                    <History className="w-3.5 h-3.5" strokeWidth={1.9} />
                  ) : (
                    <Search className="w-3.5 h-3.5" strokeWidth={1.9} />
                  )}
                </span>
                <span className="u429-t">
                  {renderHighlighted(item.label)}
                </span>
                <span className="u429-m">{item.meta}</span>
                <span className="u429-en" aria-hidden="true">
                  ↵
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="u429-live" role="status">
        {showDropdown ? `${items.length} gợi ý` : ""}
      </p>
    </div>
  );
}
