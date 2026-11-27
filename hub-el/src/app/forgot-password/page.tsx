// Lucian UX/UI Prompt #405 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#405
// Lucian UX/UI Prompt #406 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#406
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import {
  sendResetPasswordCodeAction,
  verifyResetCodeAction,
  resetPasswordAction,
} from "@/actions/auth/reset";
import VerificationCodeInput from "./VerificationCodeInput";
import "./lucian-reset.css";

const COOL_SECONDS = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // #405 Password reset states
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [emailShake, setEmailShake] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLSpanElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const resendBtnRef = useRef<HTMLButtonElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const launchPlane = (fromEl: HTMLElement | null) => {
    const plane = planeRef.current;
    const box = boxRef.current;
    if (!plane || !box || !fromEl) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !plane.animate
    )
      return;

    const r = fromEl.getBoundingClientRect();
    const bb = box.getBoundingClientRect();
    const k = box.offsetWidth / (bb.width || 1);
    const x = (r.left + r.width / 2 - bb.left - bb.width / 2) * k;
    const y = (r.top + r.height / 2 - bb.top - bb.height / 2) * k;

    plane.animate(
      [
        {
          opacity: 0,
          transform: `translate(${x}px,${y}px) rotate(10deg) scale(.6)`,
        },
        {
          opacity: 1,
          transform: `translate(${x + 10}px,${y - 18}px) rotate(-6deg) scale(1.1)`,
          offset: 0.2,
        },
        {
          opacity: 1,
          transform: `translate(${x + 70}px,${y - 70}px) rotate(-18deg) scale(1)`,
          offset: 0.6,
        },
        {
          opacity: 0,
          transform: `translate(${x + 150}px,${y - 150}px) rotate(-30deg) scale(.55)`,
        },
      ],
      { duration: 1000, easing: "cubic-bezier(.3,.1,.4,1)" }
    );
  };

  // BƯỚC 1: Gửi mã OTP (#405)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setEmailErr(true);
      setEmailShake(false);
      requestAnimationFrame(() => setEmailShake(true));
      setError("Vui lòng kiểm tra lại địa chỉ email");
      emailInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    launchPlane(sendBtnRef.current);

    try {
      const res = await sendResetPasswordCodeAction(trimmed);
      if (res.success) {
        setEmail(trimmed);
        setSuccess("Mã xác nhận 6 số đã được gửi vào email của bạn");
        setStep(2);
        setCountdown(COOL_SECONDS);
      } else {
        setError(res.error || "Gửi mã thất bại. Vui lòng kiểm tra lại email");
      }
    } catch {
      setError("Có lỗi hệ thống xảy ra, vui lòng thử lại sau");
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại mã OTP (#405 resend ring)
  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccess("");
    launchPlane(resendBtnRef.current);

    try {
      const res = await sendResetPasswordCodeAction(email);
      if (res.success) {
        setSuccess("Mã xác nhận mới đã được gửi");
        setCountdown(COOL_SECONDS);
      } else {
        setError(res.error || "Gửi mã thất bại");
      }
    } catch {
      setError("Có lỗi hệ thống xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  // BƯỚC 2: Xác thực OTP 6 số (#406)
  const handleVerifyCode = async (enteredCode: string): Promise<boolean> => {
    setError("");
    setSuccess("");
    try {
      const res = await verifyResetCodeAction(email, enteredCode);
      if (res.success) {
        setCode(enteredCode);
        setSuccess("Xác thực thành công. Vui lòng thiết lập mật khẩu mới");
        const rm = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        setTimeout(() => setStep(3), rm ? 250 : 950);
        return true;
      } else {
        setError(res.error || "Mã xác nhận không đúng hoặc đã hết hạn");
        return false;
      }
    } catch {
      setError("Có lỗi hệ thống xảy ra");
      return false;
    }
  };

  // BƯỚC 3: Đặt lại mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await resetPasswordAction(email, code, password);
      if (res.success) {
        setSuccess(
          "Đổi mật khẩu thành công. Đang chuyển hướng về trang đăng nhập..."
        );
        setTimeout(() => router.push("/login"), 2200);
      } else {
        setError(res.error || "Có lỗi xảy ra khi đổi mật khẩu");
      }
    } catch {
      setError("Có lỗi xảy ra trong quá trình đặt lại mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  const ringOffset =
    countdown > 0 ? (62.8 * (1 - countdown / COOL_SECONDS)).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 relative overflow-hidden">
      {/* NỀN GRID */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0d1117]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <Link
          href="/login"
          className="absolute -top-16 left-0 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
        </Link>

        <div className="glow-card-wrapper relative rounded-[2rem] p-[1px]">
          <div className="ux u405-dark bg-[#161b22]/90 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 shadow-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-white mb-2">
                Quên mật khẩu
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                {step === 1 &&
                  "Nhập email tài khoản để nhận mã OTP khôi phục"}
                {step === 2 &&
                  "Nhập mã OTP 6 số đã được gửi vào email của bạn"}
                {step === 3 && "Thiết lập mật khẩu bảo mật mới cho tài khoản"}
              </p>
            </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-[var(--ux-danger)]/10 border border-[var(--ux-danger)]/25 text-[var(--ux-danger)] text-xs sm:text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-[var(--ux-mint)]/12 border border-[var(--ux-mint)]/25 text-[var(--ux-mint)] text-xs sm:text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* BƯỚC 1 & 2: #405 PASSWORD RESET + #406 VERIFICATION CODE */}
          {(step === 1 || step === 2) && (
            <div className={`u405 ${step === 2 ? "is-sent" : ""}`}>
              <div ref={boxRef} className="u405-box">
                <span ref={planeRef} className="u405-plane" aria-hidden="true">
                  <svg viewBox="0 0 30 30">
                    <path className="p1" d="M3 14.2 27 4l-7.6 21.6-5.4-6.2z" />
                    <path
                      className="p2"
                      d="M14 19.4 27 4 11.2 17.6l1.6 6.4z"
                    />
                  </svg>
                </span>

                {step === 1 && (
                  <form onSubmit={handleRequestOtp} noValidate>
                    <div
                      className={`u405-f ${emailFocused ? "is-f" : ""} ${
                        emailFocused || email ? "is-up" : ""
                      } ${emailErr ? "is-err" : ""} ${
                        emailShake ? "is-shake" : ""
                      }`}
                    >
                      <input
                        ref={emailInputRef}
                        id="reset-email-inp"
                        className="u405-in"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        value={email}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailErr(false);
                          setEmailShake(false);
                        }}
                      />
                      <label htmlFor="reset-email-inp">Email tài khoản</label>
                    </div>

                    <button
                      ref={sendBtnRef}
                      type="submit"
                      disabled={isLoading}
                      className="u405-send flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        "Gửi mã xác nhận"
                      )}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="u405-env-wrap">
                      <svg
                        className="u405-env"
                        viewBox="0 0 72 60"
                        aria-hidden="true"
                      >
                        <rect
                          className="bk"
                          x="6"
                          y="16"
                          width="60"
                          height="40"
                          rx="6"
                        />
                        <g className="letter">
                          <rect
                            className="lt"
                            x="14"
                            y="6"
                            width="44"
                            height="34"
                            rx="4"
                          />
                          <path
                            className="ln"
                            d="M21 15h22M21 21h30M21 27h18"
                          />
                        </g>
                        <path
                          className="fr"
                          d="M6 22v28a6 6 0 0 0 6 6h48a6 6 0 0 0 6-6V22L38.6 40.6a4.5 4.5 0 0 1-5.2 0z"
                        />
                        <path
                          className="fl"
                          d="M8 17.5c-1.2-.9-.6-1.5.9-1.5h54.2c1.5 0 2.1.6.9 1.5L38.4 37a4 4 0 0 1-4.8 0z"
                        />
                      </svg>

                      <span className="u405-to mt-2">
                        <span className="font-medium text-[var(--ux-ink)]">
                          {email}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStep(1);
                            setError("");
                            setSuccess("");
                          }}
                          className="u405-chg"
                        >
                          Đổi email
                        </button>
                      </span>
                    </div>

                    {/* #406 Verification Code */}
                    <VerificationCodeInput
                      onVerify={handleVerifyCode}
                      disabled={isLoading}
                    />

                    <div className="flex justify-center">
                      <button
                        ref={resendBtnRef}
                        type="button"
                        disabled={countdown > 0 || isLoading}
                        onClick={handleResendOtp}
                        className={`u405-re ${
                          countdown <= 0 ? "is-ready" : ""
                        }`}
                      >
                        <span className="u405-ring" aria-hidden="true">
                          <svg viewBox="0 0 26 26">
                            <circle className="tr" cx="13" cy="13" r="10" />
                            <circle
                              className="pr"
                              cx="13"
                              cy="13"
                              r="10"
                              style={{ strokeDashoffset: ringOffset }}
                            />
                          </svg>
                          <em>{countdown > 0 ? countdown : ""}</em>
                          <i />
                        </span>
                        <span>
                          {countdown > 0
                            ? `Gửi lại sau ${countdown}s`
                            : "Gửi lại mã"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BƯỚC 3: ĐẶT LẠI MẬT KHẨU MỚI */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="u405 space-y-3">
              <div
                className={`u405-f ${passFocused ? "is-f" : ""} ${
                  passFocused || password ? "is-up" : ""
                }`}
              >
                <input
                  id="reset-new-pass"
                  className="u405-in"
                  type="password"
                  required
                  value={password}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="reset-new-pass">Mật khẩu mới</label>
              </div>

              <div
                className={`u405-f ${confirmFocused ? "is-f" : ""} ${
                  confirmFocused || confirmPassword ? "is-up" : ""
                }`}
              >
                <input
                  id="reset-confirm-pass"
                  className="u405-in"
                  type="password"
                  required
                  value={confirmPassword}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <label htmlFor="reset-confirm-pass">Xác nhận mật khẩu mới</label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="u405-send flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  "Lưu mật khẩu mới"
                )}
              </button>
            </form>
          )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .glow-card-wrapper::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 2rem;
          padding: 2px;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            transparent 40%,
            #3b82f6 50%,
            #a855f7 60%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          animation: spin-glow 4s linear infinite;
        }
        @keyframes spin-glow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
