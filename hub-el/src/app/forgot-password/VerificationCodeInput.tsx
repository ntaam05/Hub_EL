// Lucian UX/UI Prompt #406 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#406
"use client";

import React, { useEffect, useRef, useState } from "react";

interface VerificationCodeInputProps {
  onVerify: (code: string) => Promise<boolean>;
  disabled?: boolean;
}

export default function VerificationCodeInput({
  onVerify,
  disabled = false,
}: VerificationCodeInputProps) {
  const [vals, setVals] = useState<string[]>(["", "", "", "", "", ""]);
  const [focusedIdx, setFocusedIdx] = useState<number>(0);
  const [popping, setPopping] = useState<Record<number, boolean>>({});
  const [status, setStatus] = useState<"idle" | "busy" | "err" | "merge">(
    "idle"
  );
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus({ preventScroll: true });
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  const runCheck = async (codeStr: string) => {
    setStatus("busy");
    const ok = await onVerify(codeStr);
    if (ok) {
      setStatus("merge");
      return;
    }

    setStatus("err");
    setShake(false);
    requestAnimationFrame(() => setShake(true));

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    schedule(() => {
      setVals(["", "", "", "", "", ""]);
      setStatus("idle");
      setShake(false);
      setFocusedIdx(0);
      inputRefs.current[0]?.focus({ preventScroll: true });
    }, rm ? 300 : 700);
  };

  const fillDigits = (startIdx: number, raw: string) => {
    const digits = raw.replace(/\D/g, "").split("");
    if (!digits.length) return;

    let idx = startIdx;
    if (digits.length >= 6) idx = 0;

    const next = [...vals];
    const changed: Record<number, boolean> = {};
    digits.forEach((d, offset) => {
      if (idx + offset < 6) {
        next[idx + offset] = d;
        changed[idx + offset] = true;
      }
    });

    setStatus("idle");
    setVals(next);
    setPopping(changed);

    const firstEmpty = next.indexOf("");
    if (firstEmpty < 0) {
      setFocusedIdx(-1);
      inputRefs.current[5]?.blur();
      void runCheck(next.join(""));
    } else {
      const target = Math.max(firstEmpty, Math.min(5, idx + digits.length));
      setFocusedIdx(target);
      inputRefs.current[target]?.focus({ preventScroll: true });
    }
  };

  return (
    <div className="ux u406">
      <div className="u406-wrap">
        <div
          className={`u406-row ${shake ? "is-shake" : ""} ${
            status === "err" ? "is-err" : ""
          } ${status === "busy" ? "is-busy" : ""} ${
            status === "merge" ? "is-merge" : ""
          }`}
          role="group"
          aria-label="Mã xác thực 6 số"
        >
          {vals.map((val, k) => {
            const isBusyOrMerge =
              disabled || status === "busy" || status === "merge";
            return (
              <div
                key={k}
                className={`u406-b ${val ? "is-fill" : ""} ${
                  focusedIdx === k ? "is-cur" : ""
                }`}
                style={
                  {
                    "--i": k,
                    "--mx": `${(2.5 - k) * 50}px`,
                    "--d": Math.abs(2.5 - k) * 2,
                  } as React.CSSProperties
                }
                onPointerDown={() => {
                  if (!isBusyOrMerge) setFocusedIdx(k);
                }}
              >
                <input
                  ref={(el) => {
                    inputRefs.current[k] = el;
                  }}
                  className="u406-in"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={k === 0 ? "one-time-code" : "off"}
                  aria-label={`Chữ số thứ ${k + 1}`}
                  value={val}
                  disabled={isBusyOrMerge}
                  onFocus={() => setFocusedIdx(k)}
                  onBlur={() => {
                    if (focusedIdx === k) setFocusedIdx(-1);
                  }}
                  onChange={(e) => {
                    if (isBusyOrMerge) return;
                    const cleaned = e.target.value.replace(/\D/g, "");
                    if (!cleaned) {
                      const next = [...vals];
                      next[k] = "";
                      setVals(next);
                      return;
                    }
                    const old = vals[k];
                    let add = cleaned;
                    if (old && cleaned.length > 1) {
                      add =
                        cleaned.indexOf(old) === 0
                          ? cleaned.slice(old.length)
                          : cleaned.slice(0, cleaned.length - old.length) ||
                            cleaned;
                    }
                    fillDigits(k, add);
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData?.getData("text");
                    if (!text) return;
                    e.preventDefault();
                    if (!isBusyOrMerge) fillDigits(k, text);
                  }}
                  onKeyDown={(e) => {
                    if (isBusyOrMerge) return;
                    if (e.key === "Backspace") {
                      e.preventDefault();
                      const next = [...vals];
                      if (next[k]) {
                        next[k] = "";
                        setVals(next);
                        setFocusedIdx(k);
                        inputRefs.current[k]?.focus({ preventScroll: true });
                      } else if (k > 0) {
                        next[k - 1] = "";
                        setVals(next);
                        setFocusedIdx(k - 1);
                        inputRefs.current[k - 1]?.focus({
                          preventScroll: true,
                        });
                      }
                    } else if (e.key === "ArrowLeft" && k > 0) {
                      e.preventDefault();
                      setFocusedIdx(k - 1);
                      inputRefs.current[k - 1]?.focus({ preventScroll: true });
                    } else if (e.key === "ArrowRight" && k < 5) {
                      e.preventDefault();
                      setFocusedIdx(k + 1);
                      inputRefs.current[k + 1]?.focus({ preventScroll: true });
                    }
                  }}
                />
                <span
                  className={`u406-g ${popping[k] ? "is-pop" : ""}`}
                  aria-hidden="true"
                >
                  {val}
                </span>
              </div>
            );
          })}
        </div>
        <svg className="u406-ck" viewBox="0 0 60 60" aria-hidden="true">
          <circle cx="30" cy="30" r="30" />
          <path d="M18 30.5l8 8L42.5 22" />
        </svg>
      </div>
    </div>
  );
}
