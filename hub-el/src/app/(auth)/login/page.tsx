"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Tự động load Email nếu trước đó đã chọn "Ghi nhớ tôi"
  useEffect(() => {
    const savedEmail = localStorage.getItem("hubel_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Xử lý lưu/xóa Email vào LocalStorage
    if (rememberMe) {
      localStorage.setItem("hubel_remembered_email", email);
    } else {
      localStorage.removeItem("hubel_remembered_email");
    }

    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      
      // 🚨 ĐÃ FIX: LẤY ĐÚNG THÔNG BÁO TỪ BACKEND
      if (res?.error) {
        // NextAuth thường trả về chuỗi này nếu sai mật khẩu/email chung chung
        if (res.error === "CredentialsSignin" || res.error === "Configuration") {
            setError("Email hoặc mật khẩu không chính xác!");
        } else {
            // In ra chính xác lỗi "Tài khoản của bạn đã bị khóa!" hoặc các lỗi custom khác
            setError("Tài khoản của bạn đã bị khóa hoặc có lỗi khác: " + res.error); 
        }
      } 
      else { 
        router.push("/dashboard"); 
        router.refresh(); 
      }
    } catch (err) { 
      setError("Lỗi hệ thống, vui lòng thử lại!"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* NỀN GRID KHÔNG GIAN HỢP THEME */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0d1117]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/20 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <Link href="/" className="absolute -top-16 left-0 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>

        {/* THẺ ĐĂNG NHẬP VIỀN SÁNG XOAY CHUYỂN */}
        <div className="glow-card-wrapper relative rounded-[2rem] p-[1px]">
          <div className="bg-[#161b22]/90 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 shadow-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-white mb-2">Đăng nhập</h2>
              <p className="text-sm text-slate-400 font-medium">Chào mừng bạn quay trở lại Hub-EL</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold text-center">
                {error}
              </div>
            )}

            {/* FORM ĐĂNG NHẬP */}
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                placeholder="Email" 
                className="w-full px-5 py-4 bg-[#0d1117] border border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all text-white font-medium placeholder:text-slate-500" 
              />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                placeholder="Mật khẩu" 
                className="w-full px-5 py-4 bg-[#0d1117] border border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all text-white font-medium placeholder:text-slate-500" 
              />

              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)} 
                      className="peer appearance-none w-4 h-4 border border-slate-600 rounded bg-[#0d1117] checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" 
                    />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors select-none">Ghi nhớ tôi</span>
                </label>
                
                <Link href="/forgot-password" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>

              <button disabled={isLoading} className="w-full py-4 bg-white hover:bg-slate-200 text-black font-black rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 mt-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ĐĂNG NHẬP"}
              </button>
            </form>

            {/* THANH PHÂN CÁCH ĐƯỜNG KẺ TỐI GIẢN */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
              <div className="relative flex justify-center text-xs font-bold uppercase"><span className="bg-[#161b22] px-4 text-slate-500">Hoặc tiếp tục với</span></div>
            </div>

            {/* CỤM NÚT OAUTH GOOGLE & GITHUB */}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="flex items-center justify-center gap-2 py-3 bg-[#0d1117] border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm text-slate-300 hover:text-white">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg> Google
              </button>

              <button onClick={() => signIn("github", { callbackUrl: "/dashboard" })} className="flex items-center justify-center gap-2 py-3 bg-[#0d1117] border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm text-slate-300 hover:text-white">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg> GitHub
              </button>
            </div>

            <p className="mt-8 text-center text-slate-400 text-sm font-medium">
              Chưa có tài khoản? <Link href="/register" className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
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