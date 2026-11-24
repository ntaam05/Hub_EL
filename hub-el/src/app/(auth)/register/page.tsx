"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendRegisterOtpAction, verifyOtpAndRegisterAction, updateUserInterestsAction } from "@/actions/auth/register";
import { Loader2, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

// 🚨 IMPORT API LẤY DANH SÁCH SỞ THÍCH TỪ DATABASE
import { getInterestTagsAction } from "@/actions/admin/interests";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); 
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  // 🚨 State lưu danh sách sở thích động lấy từ DB
  const [interestTags, setInterestTags] = useState<string[]>([]);
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [errors, setErrors] = useState({ name: "", email: "", password: "", confirm: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [countdown, setCountdown] = useState(0); 

  // 🚨 Fetch dữ liệu sở thích khi trang load
  useEffect(() => {
    getInterestTagsAction().then(res => {
      if (res.success && res.data) {
        setInterestTags(res.data.map((t: any) => t.name));
      }
    });
  }, []);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "", email: "", password: "", confirm: "" };

    if (name.trim().length < 2) { newErrors.name = "Họ tên phải có ít nhất 2 ký tự!"; isValid = false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { newErrors.email = "Định dạng email không hợp lệ!"; isValid = false; }
    if (password.length < 6) { newErrors.password = "Mật khẩu phải từ 6 ký tự trở lên!"; isValid = false; }
    if (password !== confirmPassword) { newErrors.confirm = "Mật khẩu nhập lại không khớp!"; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return; 
    
    setIsLoading(true); setMessage(null);
    const res = await sendRegisterOtpAction(email);
    if (res.success) {
      setMessage({ type: "success", text: "Mã xác thực đã được gửi đến email của bạn!" });
      setStep(2); setCountdown(60); 
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi gửi mã" });
    }
    setIsLoading(false);
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setMessage(null);

    const res = await verifyOtpAndRegisterAction({ email, code: otp, name, password });
    if (res.success) {
      setMessage({ type: "success", text: "Tài khoản tạo thành công! Hãy chọn sở thích của bạn." });
      setStep(3);
    } else {
      setMessage({ type: "error", text: res.error || "Mã OTP sai hoặc lỗi hệ thống!" });
    }
    setIsLoading(false);
  };

  const handleSaveInterests = async () => {
    setIsLoading(true); setMessage(null);
    const res = await updateUserInterestsAction(email, selectedInterests);
    if (res.success) {
      setMessage({ type: "success", text: "Thiết lập thành công! Đang chuyển hướng..." });
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setMessage({ type: "error", text: "Có lỗi khi lưu sở thích, vui lòng thử lại!" });
      setIsLoading(false);
    }
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 relative overflow-x-hidden font-sans selection:bg-blue-500/30">
      
      {/* 🚨 NỀN GRID KHÔNG GIAN */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#0d1117]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 blur-[150px] rounded-full"></div>
      </div>

      <div className={`w-full relative z-10 animate-in fade-in zoom-in-95 duration-700 transition-all ${step === 3 ? 'max-w-3xl' : 'max-w-md'}`}>
        
        {/* Nút quay lại trang chủ */}
        {step === 1 && (
          <Link href="/" className="absolute -top-16 left-0 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
        )}

        {/* 🚨 THẺ ĐĂNG KÝ VIỀN SÁNG */}
        <div className="glow-card-wrapper relative rounded-[2rem] p-[1px]">
          <div className="bg-[#161b22]/90 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 shadow-2xl">
            
            <div className="mb-8 text-center">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">
                {step === 3 ? "Sở thích của bạn" : "Tạo tài khoản"}
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                {step === 3 ? "Chọn các chủ đề để AI đề xuất bài học phù hợp nhất." : "Gia nhập nền tảng học tập thông minh ngay hôm nay."}
              </p>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                {message.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {message.text}
              </div>
            )}

            {/* BƯỚC 1: ĐIỀN THÔNG TIN */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <div className="flex justify-between items-end mb-1.5 px-1">
                     <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Họ và tên</label>
                     {errors.name && <span className="text-red-400 text-[11px] font-bold animate-pulse">{errors.name}</span>}
                  </div>
                  <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors({...errors, name: ""}); }} className={`w-full px-5 py-3.5 bg-[#0d1117] border rounded-xl outline-none transition-all text-white font-medium placeholder:text-slate-600 ${errors.name ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} placeholder="Nhập họ tên của bạn..." />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1.5 px-1">
                     <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Email</label>
                     {errors.email && <span className="text-red-400 text-[11px] font-bold animate-pulse">{errors.email}</span>}
                  </div>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors({...errors, email: ""}); }} className={`w-full px-5 py-3.5 bg-[#0d1117] border rounded-xl outline-none transition-all text-white font-medium placeholder:text-slate-600 ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} placeholder="abc@gmail.com" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-end mb-1.5 px-1">
                       <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Mật khẩu</label>
                    </div>
                    <input type="password" value={password} onChange={e => { setPassword(e.target.value); setErrors({...errors, password: ""}); }} className={`w-full px-5 py-3.5 bg-[#0d1117] border rounded-xl outline-none transition-all text-white font-medium placeholder:text-slate-600 ${errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} placeholder="••••••••" />
                    {errors.password && <p className="text-red-400 text-[11px] font-bold mt-1 px-1">{errors.password}</p>}
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1.5 px-1">
                       <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Nhập lại</label>
                    </div>
                    <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors({...errors, confirm: ""}); }} className={`w-full px-5 py-3.5 bg-[#0d1117] border rounded-xl outline-none transition-all text-white font-medium placeholder:text-slate-600 ${errors.confirm ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} placeholder="••••••••" />
                    {errors.confirm && <p className="text-red-400 text-[11px] font-bold mt-1 px-1">{errors.confirm}</p>}
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full py-4 mt-6 bg-white hover:bg-slate-200 text-black font-black rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "NHẬN MÃ XÁC THỰC"}
                </button>
              </form>
            )}

            {/* BƯỚC 2: NHẬP MÃ OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-in slide-in-from-right duration-500">
                <div className="bg-[#0d1117] border border-slate-700 p-4 rounded-xl text-center">
                  <p className="text-sm text-slate-400 mb-1">Mã xác thực 6 số đã được gửi tới:</p>
                  <p className="font-bold text-blue-400">{email}</p>
                </div>

                <div>
                  <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="w-full px-4 py-4 bg-[#0d1117] border border-slate-700 rounded-xl text-white text-center text-2xl tracking-[0.7em] font-black outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600" placeholder="------" />
                </div>

                <button type="submit" disabled={isLoading || otp.length < 6} className="w-full py-4 bg-white hover:bg-slate-200 text-black font-black rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "HOÀN TẤT ĐĂNG KÝ"}
                </button>

                <div className="text-center">
                  <button type="button" onClick={handleSendOtp} disabled={countdown > 0 || isLoading} className="text-sm text-slate-400 hover:text-white font-medium disabled:text-slate-600 transition-colors">
                    {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : "Gửi lại mã xác thực"}
                  </button>
                </div>
              </form>
            )}

            {/* BƯỚC 3: CHỌN SỞ THÍCH */}
            {step === 3 && (
              <div className="animate-in slide-in-from-bottom-8 fade-in duration-700">
                <div className="flex flex-wrap gap-3 justify-center max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {/* 🚨 SỬ DỤNG MẢNG ĐỘNG interestTags TỪ DATABASE */}
                  {interestTags.map(tag => {
                    const isSelected = selectedInterests.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleInterest(tag)}
                        className={`px-5 py-2.5 rounded-full border text-sm font-bold transition-all duration-300 active:scale-95 ${
                          isSelected 
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                            : 'bg-[#0d1117] border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-500 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                  {interestTags.length === 0 && (
                      <p className="text-slate-500 italic text-sm">Đang tải danh sách sở thích...</p>
                  )}
                </div>
                
                <div className="mt-10 flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-slate-700">
                  <button 
                    onClick={() => router.push("/login")} 
                    className="flex-1 py-4 bg-[#0d1117] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-bold transition-all active:scale-95"
                  >
                    Bỏ qua
                  </button>
                  <button 
                    onClick={handleSaveInterests}
                    disabled={isLoading || selectedInterests.length === 0}
                    className="flex-1 py-4 bg-white hover:bg-slate-200 text-black font-black rounded-xl transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4"/> Bắt đầu ({selectedInterests.length})</>}
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="mt-8 text-center text-slate-400 text-sm font-medium">
                Đã có tài khoản? <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4">Đăng nhập</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS CHO THANH CUỘN & GLOWING BORDER */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

        .glow-card-wrapper::before {
          content: ""; position: absolute; inset: 0; border-radius: 2rem; padding: 2px;
          background: conic-gradient(from 0deg, transparent 0%, transparent 40%, #3b82f6 50%, #a855f7 60%, transparent 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude; animation: spin-glow 4s linear infinite;
        }
        @keyframes spin-glow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}