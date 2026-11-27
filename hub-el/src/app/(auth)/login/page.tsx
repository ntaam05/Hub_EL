"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import "./lucian-login.css";

type SocialProvider = "google" | "github";

export default function SignInPage() {
  const router = useRouter();
  const uid = useId();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [submitState, setSubmitState] = useState<"idle" | "busy" | "ok">("idle");
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");
  const [emailBad, setEmailBad] = useState(false);
  const [pwBad, setPwBad] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Tự động load Email nếu trước đó đã chọn "Ghi nhớ tôi"
  useEffect(() => {
    const savedEmail = localStorage.getItem("hubel_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const triggerShake = () => {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  };

  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState !== "idle" || socialLoading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailBad(true);
      setPwBad(false);
      setError("Vui lòng nhập email của bạn.");
      triggerShake();
      return;
    }

    if (!password) {
      setEmailBad(false);
      setPwBad(true);
      setError("Vui lòng nhập mật khẩu.");
      triggerShake();
      passwordInputRef.current?.focus();
      return;
    }

    setSubmitState("busy");
    setError("");
    setEmailBad(false);
    setPwBad(false);

    // Xử lý lưu/xóa Email vào LocalStorage
    if (rememberMe) {
      localStorage.setItem("hubel_remembered_email", trimmedEmail);
    } else {
      localStorage.removeItem("hubel_remembered_email");
    }

    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if (res?.error) {
        setSubmitState("idle");
        setPwBad(true);
        if (res.error === "CredentialsSignin" || res.error === "Configuration") {
          setError("Email hoặc mật khẩu không chính xác!");
        } else {
          setError("Tài khoản của bạn đã bị khóa hoặc có lỗi khác: " + res.error);
        }
        triggerShake();
        passwordInputRef.current?.select();
      } else {
        setSubmitState("ok");
        const reducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(
          () => {
            router.push("/dashboard");
            router.refresh();
          },
          reducedMotion ? 150 : 550
        );
      }
    } catch {
      setSubmitState("idle");
      setPwBad(true);
      setError("Lỗi hệ thống, vui lòng thử lại!");
      triggerShake();
    }
  };

  const handleSocialSignIn = async (provider: SocialProvider) => {
    if (submitState !== "idle" || socialLoading) return;
    setError("");
    setEmailBad(false);
    setPwBad(false);
    setSocialLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      setSocialLoading(null);
      setError("Không thể kết nối tới nhà cung cấp đăng nhập, vui lòng thử lại.");
      triggerShake();
    }
  };

  const emailId = `${uid}-email`;
  const passwordId = `${uid}-pw`;
  const errorId = `${uid}-err`;
  const isBusy = submitState !== "idle" || socialLoading !== null;

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 relative overflow-hidden">
      {/* NỀN GRID KHÔNG GIAN HỢP THEME */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0d1117]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/20 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <Link
          href="/"
          className="absolute -top-16 left-0 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>

        {/* THẺ ĐĂNG NHẬP VIỀN SÁNG XOAY CHUYỂN */}
        <div className="glow-card-wrapper relative rounded-[2rem] p-[1px]">
          <div
            className={`ux u062 bg-[#161b22]/90 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 shadow-2xl${
              shaking ? " shake" : ""
            }`}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setShaking(false);
            }}
          >
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-white mb-2">Đăng nhập</h2>
              <p className="text-sm text-slate-400 font-medium">
                Chào mừng bạn quay trở lại Hub-EL
              </p>
            </div>

            {/* FORM ĐĂNG NHẬP (#062) */}
            <form onSubmit={handleCredentialsLogin} noValidate>
              {/* Email */}
              <div className={`u062-f${emailBad ? " bad" : ""}`}>
                <label htmlFor={emailId}>Email</label>
                <div className="u062-box">
                  <input
                    id={emailId}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailBad) setEmailBad(false);
                      if (error) setError("");
                    }}
                    placeholder="Email"
                    autoComplete="username"
                    disabled={isBusy}
                    aria-invalid={emailBad || undefined}
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div className={`u062-f u062-pw${pwBad ? " bad" : ""}`}>
                <label htmlFor={passwordId}>Mật khẩu</label>
                <span className={`u062-caps${capsLockOn ? " on" : ""}`} aria-live="polite">
                  Caps Lock đang bật
                </span>
                <div className="u062-box">
                  <input
                    ref={passwordInputRef}
                    id={passwordId}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (pwBad) setPwBad(false);
                      if (error) setError("");
                    }}
                    onKeyUp={handleCapsLock}
                    onKeyDown={handleCapsLock}
                    placeholder="Mật khẩu"
                    autoComplete="current-password"
                    disabled={isBusy}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={pwBad || undefined}
                  />
                  <button
                    type="button"
                    className="u062-eye"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isBusy}
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
                  <span id={errorId} role="alert">
                    {error}
                  </span>
                </div>
              </div>

              {/* Ghi nhớ tôi & Quên mật khẩu */}
              <div className="u062-row">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isBusy}
                      className="peer appearance-none w-4 h-4 border border-slate-600 rounded bg-[#0d1117] checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                    />
                    <svg
                      className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                    Ghi nhớ tôi
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Nút đăng nhập (#062 morphing spinner -> checkmark) */}
              <div className="u062-go-wrap">
                <button
                  type="submit"
                  disabled={isBusy}
                  className={`u062-go${
                    submitState === "busy" ? " busy" : submitState === "ok" ? " ok" : ""
                  }`}
                  aria-label={
                    submitState === "busy"
                      ? "Đang kiểm tra"
                      : submitState === "ok"
                        ? "Đăng nhập thành công"
                        : undefined
                  }
                >
                  <span>ĐĂNG NHẬP</span>
                  <i aria-hidden="true" />
                  <svg viewBox="0 0 26 26" aria-hidden="true">
                    <path d="M6 13.5l4.5 4.5L20 8.5" />
                  </svg>
                </button>
              </div>
            </form>

            {/* #066 Social sign-in buttons */}
            <div className="u066-or">HOẶC TIẾP TỤC VỚI</div>

            <div className="u066-list">
              <div
                className={`u066-it${
                  socialLoading && socialLoading !== "google" ? " gone" : ""
                }`}
                style={{ "--i": 0 } as React.CSSProperties}
              >
                <div>
                  <button
                    type="button"
                    disabled={isBusy}
                    tabIndex={socialLoading && socialLoading !== "google" ? -1 : 0}
                    aria-busy={socialLoading === "google" || undefined}
                    onClick={() => handleSocialSignIn("google")}
                    className={`u066-b${socialLoading === "google" ? " busy" : ""}`}
                    style={
                      {
                        "--bg": "#0d1117",
                        "--fg": "#e2e8f0",
                        "--bd": "inset 0 0 0 1px rgb(51 65 85)",
                      } as React.CSSProperties
                    }
                  >
                    <span className="u066-ic" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
                          fill="#34A853"
                        />
                        <path
                          d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.6z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"
                          fill="#EA4335"
                        />
                      </svg>
                    </span>
                    <span className="u066-tx">Tiếp tục với Google</span>
                    <span className="u066-st" aria-hidden="true">
                      <i />
                    </span>
                  </button>
                </div>
              </div>

              <div
                className={`u066-it${
                  socialLoading && socialLoading !== "github" ? " gone" : ""
                }`}
                style={{ "--i": 1 } as React.CSSProperties}
              >
                <div>
                  <button
                    type="button"
                    disabled={isBusy}
                    tabIndex={socialLoading && socialLoading !== "github" ? -1 : 0}
                    aria-busy={socialLoading === "github" || undefined}
                    onClick={() => handleSocialSignIn("github")}
                    className={`u066-b${socialLoading === "github" ? " busy" : ""}`}
                    style={
                      {
                        "--bg": "#0d1117",
                        "--fg": "#e2e8f0",
                        "--bd": "inset 0 0 0 1px rgb(51 65 85)",
                      } as React.CSSProperties
                    }
                  >
                    <span className="u066-ic" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="u066-tx">Tiếp tục với GitHub</span>
                    <span className="u066-st" aria-hidden="true">
                      <i />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {socialLoading && (
              <p className="u066-msg" aria-live="polite">
                Đang chuyển hướng đến {socialLoading === "google" ? "Google" : "GitHub"}…
              </p>
            )}

            <p className="mt-8 text-center text-slate-400 text-sm font-medium">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4"
              >
                Đăng ký ngay
              </Link>
            </p>
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
