"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { 
  sendResetPasswordCodeAction, 
  verifyResetCodeAction, 
  resetPasswordAction 
} from "@/actions/auth/reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email | 2: OTP | 3: Đổi MK
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [countdown, setCountdown] = useState(0); // Bộ đếm ngược 60s
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Logic đếm ngược 60s
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // BƯỚC 1: Gửi mã OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(""); setSuccess("");

    try {
      const res = await sendResetPasswordCodeAction(email);
      if (res.success) {
        setSuccess("Mã xác nhận OTP đã được gửi vào email của bạn!");
        setStep(2);
        setCountdown(60); // Bắt đầu đếm ngược 60s
      } else {
        setError(res.error || "Gửi mã thất bại. Vui lòng kiểm tra lại email!");
      }
    } catch (err) { setError("Có lỗi hệ thống xảy ra, vui lòng thử lại sau!"); } 
    finally { setIsLoading(false); }
  };

  // NÚT: Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setError(""); setSuccess("");
    try {
      const res = await sendResetPasswordCodeAction(email);
      if (res.success) {
        setSuccess("Mã xác nhận mới đã được gửi!");
        setCountdown(60);
      } else setError(res.error || "Gửi mã thất bại.");
    } catch (err) { setError("Có lỗi hệ thống xảy ra!"); } 
    finally { setIsLoading(false); }
  };

  // BƯỚC 2: Kiểm tra OTP có đúng không
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP.");
      return;
    }
    setIsLoading(true);
    setError(""); setSuccess("");

    try {
      const res = await verifyResetCodeAction(email, code);
      if (res.success) {
        setSuccess("Xác thực thành công! Vui lòng thiết lập mật khẩu mới.");
        setStep(3); // Đúng OTP thì mới cho sang bước đổi mật khẩu
      } else {
        setError(res.error || "Mã xác nhận không đúng hoặc đã hết hạn!");
      }
    } catch (err) { setError("Có lỗi hệ thống xảy ra!"); } 
    finally { setIsLoading(false); }
  };

  // BƯỚC 3: Đặt lại mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    setIsLoading(true);
    setError(""); setSuccess("");

    try {
      const res = await resetPasswordAction(email, code, password);
      if (res.success) {
        setSuccess("Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setError(res.error || "Có lỗi xảy ra khi đổi mật khẩu!");
      }
    } catch (err) { setError("Có lỗi xảy ra trong quá trình đặt lại mật khẩu!"); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 relative overflow-hidden">
      {/* NỀN GRID */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0d1117]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <Link href="/login" className="absolute -top-16 left-0 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
        </Link>

        <div className="glow-card-wrapper relative rounded-[2rem] p-[1px]">
          <div className="bg-[#161b22]/90 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 shadow-2xl">
            
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-white mb-2">Quên mật khẩu</h2>
              <p className="text-sm text-slate-400 font-medium">
                {step === 1 && "Nhập email tài khoản để nhận mã OTP khôi phục"}
                {step === 2 && "Nhập mã OTP 6 số đã được gửi vào email của bạn"}
                {step === 3 && "Thiết lập mật khẩu bảo mật mới cho tài khoản"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{success}</span>
              </div>
            )}

            {/* BƯỚC 1: NHẬP EMAIL */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  placeholder="Nhập Email tài khoản" 
                  className="w-full px-5 py-4 bg-[#0d1117] border border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all text-white font-medium placeholder:text-slate-500" 
                />
                <button disabled={isLoading} className="w-full py-4 bg-white hover:bg-slate-200 text-black font-black rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 mt-4">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "GỬI MÃ XÁC NHẬN"}
                </button>
              </form>
            )}

            {/* BƯỚC 2: NHẬP VÀ XÁC THỰC OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <input 
                  type="text" required maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} 
                  placeholder="Nhập mã OTP 6 số" 
                  className="w-full px-5 py-4 bg-[#0d1117] border border-slate-700 rounded-xl outline-none focus:border-blue-500 tracking-[0.2em] text-center font-black text-white placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-500" 
                />
                
                <div className="flex justify-between items-center px-1 text-xs font-semibold pt-2">
                  <button type="button" onClick={() => { setStep(1); setError(""); setSuccess(""); }} className="text-slate-400 hover:text-white transition-colors">
                    Thay đổi Email?
                  </button>
                  <button type="button" disabled={countdown > 0 || isLoading} onClick={handleResendOtp} className={countdown > 0 ? "text-slate-600 cursor-not-allowed" : "text-blue-400 hover:text-blue-300 transition-colors"}>
                    Gửi lại mã {countdown > 0 && `(${countdown}s)`}
                  </button>
                </div>

                <button disabled={isLoading || code.length < 6} className="w-full py-4 bg-white hover:bg-slate-200 text-black font-black rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 mt-2 disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "XÁC NHẬN OTP"}
                </button>
              </form>
            )}

            {/* BƯỚC 3: ĐẶT LẠI MẬT KHẨU MỚI */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <input 
                  type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                  placeholder="Mật khẩu mới" 
                  className="w-full px-5 py-4 bg-[#0d1117] border border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all text-white font-medium placeholder:text-slate-500" 
                />
                <input 
                  type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Xác nhận mật khẩu mới" 
                  className="w-full px-5 py-4 bg-[#0d1117] border border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all text-white font-medium placeholder:text-slate-500" 
                />

                <button disabled={isLoading} className="w-full py-4 bg-white hover:bg-slate-200 text-black font-black rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 mt-4">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LƯU MẬT KHẨU MỚI"}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>

      <style jsx global>{`
        .glow-card-wrapper::before {
          content: ""; position: absolute; inset: 0; border-radius: 2rem; padding: 2px;
          background: conic-gradient(from 0deg, transparent 0%, transparent 40%, #a855f7 50%, #3b82f6 60%, transparent 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude; animation: spin-glow 4s linear infinite;
        }
        @keyframes spin-glow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}