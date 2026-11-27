"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  sendRegisterOtpAction,
  verifyOtpAndRegisterAction,
  updateUserInterestsAction,
} from "@/actions/auth/register";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { getInterestTagsAction } from "@/actions/admin/interests";
import VerificationCodeInput from "@/app/forgot-password/VerificationCodeInput";
import "@/app/(auth)/login/lucian-login.css";
import "@/app/forgot-password/lucian-reset.css";

const COOL_SECONDS = 60;

export default function RegisterPage() {
  const router = useRouter();
  const uid = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [step1Btn, setStep1Btn] = useState<"idle" | "busy" | "ok">("idle");
  const [step3Btn, setStep3Btn] = useState<"idle" | "busy" | "ok">("idle");
  const [shaking, setShaking] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    getInterestTagsAction().then((res) => {
      if (res.success && res.data) {
        setInterestTags(res.data.map((t: { name: string }) => t.name));
      }
    });
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(
      () => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, [countdown]);

  const triggerShake = () => {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  };

  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "", email: "", password: "", confirm: "" };

    if (name.trim().length < 2) {
      newErrors.name = "Họ tên phải có ít nhất 2 ký tự!";
      isValid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      newErrors.email = "Định dạng email không hợp lệ!";
      isValid = false;
    }
    if (password.length < 6) {
      newErrors.password = "Mật khẩu phải từ 6 ký tự trở lên!";
      isValid = false;
    }
    if (password !== confirmPassword) {
      newErrors.confirm = "Mật khẩu nhập lại không khớp!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 1 && !validateForm()) {
      triggerShake();
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    if (step === 1) setStep1Btn("busy");
    setMessage(null);

    try {
      const res = await sendRegisterOtpAction(email.trim());
      if (res.success) {
        if (step === 1) {
          setStep1Btn("ok");
          const reducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.setTimeout(
            () => {
              setStep1Btn("idle");
              setMessage({
                type: "success",
                text: "Mã xác thực đã được gửi đến email của bạn!",
              });
              setStep(2);
              setCountdown(COOL_SECONDS);
            },
            reducedMotion ? 150 : 500
          );
        } else {
          setMessage({
            type: "success",
            text: "Mã xác thực mới đã được gửi đến email của bạn!",
          });
          setCountdown(COOL_SECONDS);
        }
      } else {
        setStep1Btn("idle");
        setMessage({ type: "error", text: res.error || "Lỗi gửi mã" });
        triggerShake();
      }
    } catch {
      setStep1Btn("idle");
      setMessage({
        type: "error",
        text: "Có lỗi hệ thống xảy ra, vui lòng thử lại!",
      });
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpCode = async (enteredCode: string): Promise<boolean> => {
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await verifyOtpAndRegisterAction({
        email: email.trim(),
        code: enteredCode,
        name: name.trim(),
        password,
      });

      if (res.success) {
        const reducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(
          () => {
            setMessage({
              type: "success",
              text: "Tài khoản tạo thành công! Hãy chọn sở thích của bạn.",
            });
            setStep(3);
          },
          reducedMotion ? 200 : 850
        );
        return true;
      }

      setMessage({
        type: "error",
        text: res.error || "Mã OTP sai hoặc lỗi hệ thống!",
      });
      triggerShake();
      return false;
    } catch {
      setMessage({
        type: "error",
        text: "Có lỗi hệ thống xảy ra!",
      });
      triggerShake();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInterests = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setStep3Btn("busy");
    setMessage(null);

    try {
      const res = await updateUserInterestsAction(
        email.trim(),
        selectedInterests
      );
      if (res.success) {
        setStep3Btn("ok");
        setMessage({
          type: "success",
          text: "Thiết lập thành công! Đang chuyển hướng...",
        });
        setTimeout(() => router.push("/login"), 1200);
      } else {
        setStep3Btn("idle");
        setMessage({
          type: "error",
          text: "Có lỗi khi lưu sở thích, vui lòng thử lại!",
        });
        setIsLoading(false);
      }
    } catch {
      setStep3Btn("idle");
      setMessage({
        type: "error",
        text: "Có lỗi khi lưu sở thích, vui lòng thử lại!",
      });
      setIsLoading(false);
    }
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const ringOffset =
    countdown > 0 ? (62.8 * (1 - countdown / COOL_SECONDS)).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 relative overflow-x-hidden font-sans selection:bg-blue-500/30">
      {/* NỀN GRID KHÔNG GIAN */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#0d1117]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 blur-[150px] rounded-full"></div>
      </div>

      <div
        className={`w-full relative z-10 animate-in fade-in zoom-in-95 duration-700 transition-all ${
          step === 3 ? "max-w-3xl" : "max-w-md"
        }`}
      >
        {step === 1 && (
          <Link
            href="/"
            className="absolute -top-16 left-0 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
        )}

        {/* THẺ ĐĂNG KÝ VIỀN SÁNG */}
        <div className="glow-card-wrapper relative rounded-[2rem] p-[1px]">
          <div
            ref={cardRef}
            className={`ux u062 u405-dark bg-[#161b22]/90 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 shadow-2xl${
              shaking ? " shake" : ""
            }`}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setShaking(false);
            }}
          >
            <div className="mb-8 text-center">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">
                {step === 3 ? "Sở thích của bạn" : "Tạo tài khoản"}
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                {step === 3
                  ? "Chọn các chủ đề để AI đề xuất bài học phù hợp nhất."
                  : "Gia nhập nền tảng học tập thông minh ngay hôm nay."}
              </p>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {message.type === "success" && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* BƯỚC 1: ĐIỀN THÔNG TIN (Animations #062) */}
            {step === 1 && (
              <form
                onSubmit={handleSendOtp}
                noValidate
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                {/* Họ và tên */}
                <div className={`u062-f${errors.name ? " bad" : ""}`}>
                  <label htmlFor={`${uid}-name`}>Họ và tên</label>
                  <div className="u062-box">
                    <input
                      id={`${uid}-name`}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      placeholder="Nhập họ tên của bạn..."
                      disabled={isLoading}
                      aria-invalid={Boolean(errors.name) || undefined}
                    />
                  </div>
                  <div className="u062-err">
                    <span role="alert">{errors.name}</span>
                  </div>
                </div>

                {/* Email */}
                <div className={`u062-f${errors.email ? " bad" : ""}`}>
                  <label htmlFor={`${uid}-email`}>Email</label>
                  <div className="u062-box">
                    <input
                      id={`${uid}-email`}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      placeholder="abc@gmail.com"
                      autoComplete="email"
                      disabled={isLoading}
                      aria-invalid={Boolean(errors.email) || undefined}
                    />
                  </div>
                  <div className="u062-err">
                    <span role="alert">{errors.email}</span>
                  </div>
                </div>

                {/* Mật khẩu & Nhập lại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`u062-f u062-pw${errors.password ? " bad" : ""}`}>
                    <label htmlFor={`${uid}-pw`}>Mật khẩu</label>
                    <span
                      className={`u062-caps${capsLockOn ? " on" : ""}`}
                      aria-live="polite"
                    >
                      Caps Lock
                    </span>
                    <div className="u062-box">
                      <input
                        id={`${uid}-pw`}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password)
                            setErrors({ ...errors, password: "" });
                        }}
                        onKeyUp={handleCapsLock}
                        onKeyDown={handleCapsLock}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        aria-invalid={Boolean(errors.password) || undefined}
                      />
                      <button
                        type="button"
                        className="u062-eye"
                        aria-pressed={showPassword}
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={isLoading}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <g className="u062-lid">
                            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </g>
                          <path className="u062-slash" d="M4 4l16 16" />
                        </svg>
                      </button>
                    </div>
                    <div className="u062-err">
                      <span role="alert">{errors.password}</span>
                    </div>
                  </div>

                  <div className={`u062-f u062-pw${errors.confirm ? " bad" : ""}`}>
                    <label htmlFor={`${uid}-confirm`}>Nhập lại</label>
                    <div className="u062-box">
                      <input
                        id={`${uid}-confirm`}
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirm)
                            setErrors({ ...errors, confirm: "" });
                        }}
                        onKeyUp={handleCapsLock}
                        onKeyDown={handleCapsLock}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        aria-invalid={Boolean(errors.confirm) || undefined}
                      />
                      <button
                        type="button"
                        className="u062-eye"
                        aria-pressed={showConfirm}
                        aria-label={
                          showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                        onClick={() => setShowConfirm((prev) => !prev)}
                        disabled={isLoading}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <g className="u062-lid">
                            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </g>
                          <path className="u062-slash" d="M4 4l16 16" />
                        </svg>
                      </button>
                    </div>
                    <div className="u062-err">
                      <span role="alert">{errors.confirm}</span>
                    </div>
                  </div>
                </div>

                <div className="u062-go-wrap mt-4">
                  <button
                    type="submit"
                    disabled={isLoading || step1Btn !== "idle"}
                    className={`u062-go${
                      step1Btn === "busy"
                        ? " busy"
                        : step1Btn === "ok"
                          ? " ok"
                          : ""
                    }`}
                  >
                    <span>NHẬN MÃ XÁC THỰC</span>
                    <i aria-hidden="true" />
                    <svg viewBox="0 0 26 26" aria-hidden="true">
                      <path d="M6 13.5l4.5 4.5L20 8.5" />
                    </svg>
                  </button>
                </div>
              </form>
            )}

            {/* BƯỚC 2: NHẬP MÃ OTP (#405 + #406) */}
            {step === 2 && (
              <div className="u405 is-sent space-y-6 animate-in slide-in-from-right duration-500">
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
                    <span className="font-medium text-blue-400">{email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setMessage(null);
                      }}
                      className="u405-chg"
                    >
                      Đổi email
                    </button>
                  </span>
                </div>

                <VerificationCodeInput
                  onVerify={handleVerifyOtpCode}
                  disabled={isLoading}
                />

                <div className="flex justify-center">
                  <button
                    type="button"
                    disabled={countdown > 0 || isLoading}
                    onClick={() => handleSendOtp()}
                    className={`u405-re ${countdown <= 0 ? "is-ready" : ""}`}
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
                        : "Gửi lại mã xác thực"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: CHỌN SỞ THÍCH */}
            {step === 3 && (
              <div className="animate-in slide-in-from-bottom-8 fade-in duration-700">
                <div className="flex flex-wrap gap-3 justify-center max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {interestTags.map((tag) => {
                    const isSelected = selectedInterests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`px-5 py-2.5 rounded-full border text-sm font-bold transition-all duration-300 active:scale-95 ${
                          isSelected
                            ? "scale-[1.03] bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            : "bg-[#0d1117] border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                  {interestTags.length === 0 && (
                    <p className="text-slate-500 italic text-sm">
                      Đang tải danh sách sở thích...
                    </p>
                  )}
                </div>

                <div className="mt-10 flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="flex-1 py-3.5 bg-[#0d1117] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl font-bold transition-all active:scale-95"
                  >
                    Bỏ qua
                  </button>
                  <div className="flex-1 u062-go-wrap">
                    <button
                      type="button"
                      onClick={handleSaveInterests}
                      disabled={isLoading || selectedInterests.length === 0}
                      className={`u062-go disabled:opacity-50${
                        step3Btn === "busy"
                          ? " busy"
                          : step3Btn === "ok"
                            ? " ok"
                            : ""
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Bắt đầu ({selectedInterests.length})
                      </span>
                      <i aria-hidden="true" />
                      <svg viewBox="0 0 26 26" aria-hidden="true">
                        <path d="M6 13.5l4.5 4.5L20 8.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="mt-8 text-center text-slate-400 text-sm font-medium">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS CHO THANH CUỘN & GLOWING BORDER */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }

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
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
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
