// Lucian UX/UI Prompt #012 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#012
"use client";

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  checkFavoriteAction,
  addFavoriteAction,
  removeFavoriteAction,
} from "@/actions/video/favorite";
import { updateTaskProgressAction } from "@/actions/quests/progress";
import "./lucian-012.css";

interface BookmarkRibbonButtonProps {
  video: any;
  showNotification: (
    msg: string,
    type?: "success" | "error",
    title?: string
  ) => void;
}

const CONFETTI_ANGLES = [
  { a: "0deg", c: "#FFC14D" },
  { a: "45deg", c: "#FF6B6B" },
  { a: "90deg", c: "#8B6CFF" },
  { a: "135deg", c: "#22C3A6" },
  { a: "180deg", c: "#FFC14D" },
  { a: "225deg", c: "#FF6B6B" },
  { a: "270deg", c: "#3D8BFF" },
  { a: "315deg", c: "#FF9F5A" },
];

export default function BookmarkRibbonButton({
  video,
  showNotification,
}: BookmarkRibbonButtonProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const gradId = useId();
  const rollRef = useRef<HTMLSpanElement>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBurst, setIsBurst] = useState(false);

  useEffect(() => {
    if (userId && video?.videoId) {
      checkFavoriteAction(userId, video.videoId).then((res) => {
        setIsLiked(res.success ? !!res.data : false);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [userId, video?.videoId]);

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const roll = rollRef.current;
    if (!roll) return;
    const activeChild = roll.children[isLiked ? 1 : 0] as HTMLElement | undefined;
    if (activeChild) {
      roll.style.width = `${activeChild.offsetWidth}px`;
    }
  }, [isLiked]);

  const handleToggleLike = async () => {
    if (!userId) {
      showNotification("Vui lòng đăng nhập để lưu video", "error");
      return;
    }
    const nextLiked = !isLiked;
    setLoading(true);
    try {
      if (isLiked) {
        await removeFavoriteAction(userId, video.videoId);
      } else {
        await addFavoriteAction({
          userId,
          videoId: video.videoId,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnailUrl: video.thumbnailUrl,
        });
        updateTaskProgressAction(userId, "COURSE_ADD", 1);
      }
      setIsLiked(nextLiked);

      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      setIsBurst(false);

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (nextLiked && !reduced) {
        requestAnimationFrame(() => {
          setIsBurst(true);
          burstTimerRef.current = setTimeout(() => {
            setIsBurst(false);
          }, 900);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`ux u012 ${isLiked ? "is-on" : ""} ${
        isBurst ? "is-burst" : ""
      }`}
    >
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={loading}
        aria-pressed={isLiked}
        aria-label={isLiked ? "Bỏ khỏi video yêu thích" : "Lưu video yêu thích"}
        title={isLiked ? "Bỏ yêu thích" : "Lưu yêu thích"}
        className="u012-btn"
      >
        <span className="u012-ring" aria-hidden="true" />
        <span className="u012-icon" aria-hidden="true">
          <svg viewBox="0 0 44 56">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFC14D" />
                <stop offset="1" stopColor="#FF6B6B" />
              </linearGradient>
            </defs>
            <path
              className="u012-in"
              style={{ fill: `url(#${gradId})` }}
              d="M6 4h32a2 2 0 0 1 2 2v46l-18-12L4 52V6a2 2 0 0 1 2-2z"
            />
            <path
              className="u012-out"
              d="M6 4h32a2 2 0 0 1 2 2v46l-18-12L4 52V6a2 2 0 0 1 2-2z"
            />
          </svg>
        </span>
        {CONFETTI_ANGLES.map((p, idx) => (
          <span
            key={idx}
            className="u012-p"
            style={{ "--a": p.a, "--c": p.c } as React.CSSProperties}
            aria-hidden="true"
          />
        ))}
      </button>

      <p className="u012-meta hidden sm:inline-flex" aria-live="polite">
        <span ref={rollRef} className="u012-roll u012-lab">
          <span>Lưu</span>
          <span>Đã lưu</span>
        </span>
      </p>
    </div>
  );
}
