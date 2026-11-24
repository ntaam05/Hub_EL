"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Key, Trash2, Mail, Loader2, Check } from 'lucide-react';
import { getSecurityInfoAction, sendOtpAction, verifyOtpAction, changePasswordAction, resetPasswordAction, changeEmailAction } from '@/actions/user/security';

export default function SecurityTab({ showNotification }: { showNotification: (msg: string, type: 'success' | 'error') => void }) {
  const { data: session } = useSession();
  
  const [isSaving, setIsSending] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [securityInfo, setSecurityInfo] = useState({ isOAuth: false, email: "" });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  
  const [forgotPassMode, setForgotPassMode] = useState(false);
  const [changeEmailMode, setChangeEmailMode] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        const userId = session?.user?.id as string; 
        if (userId && !isDataLoaded) {
            const secRes = await getSecurityInfoAction(userId);
            if (secRes.success && secRes.data) {
                setSecurityInfo(secRes.data);
                setIsDataLoaded(true);
            }
        }
    };
    loadData();
  }, [session?.user?.id, isDataLoaded]);

  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) timer = setInterval(() => setOtpCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleSendOtp = async () => {
      setIsSending(true);
      const res = await sendOtpAction(securityInfo.email);
      if (res.success) { 
          showNotification(res.message || "Gửi mã thành công", "success"); 
          setOtpCountdown(60); 
      } else { 
          showNotification(res.error || "Lỗi gửi mã", "error"); 
      }
      setIsSending(false);
  };

  const handleVerifyOtp = async () => {
      if(!otpCode) return showNotification("Vui lòng nhập mã OTP!", "error");
      setIsSending(true);
      const res = await verifyOtpAction(securityInfo.email, otpCode);
      if (res.success) {
          setIsOtpVerified(true);
          showNotification("Mã hợp lệ! Hãy nhập thôngume tin mới.", "success");
      } else {
          showNotification(res.error || "Mã sai", "error");
      }
      setIsSending(false);
  };

  const handleUpdatePassword = async () => {
      const userId = session?.user?.id as string;
      if (!userId) return showNotification("Lỗi phiên đăng nhập", "error");
      if (newPassword !== confirmPassword) return showNotification("Mật khẩu mới không khớp!", "error");
      if (newPassword.length < 8) return showNotification("Mật khẩu phải dài ít nhất 8 ký tự.", "error");
      
      setIsSending(true);
      let res;
      if (forgotPassMode) {
          res = await resetPasswordAction(securityInfo.email, otpCode, newPassword);
      } else {
          res = await changePasswordAction(userId, oldPassword, newPassword);
      }

      if (res.success) {
          showNotification(res.message || "Cập nhật thành công. Vui lòng đăng nhập lại.", "success");
          setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setOtpCode(""); 
          setForgotPassMode(false); setIsOtpVerified(false);
          setTimeout(() => signOut({ callbackUrl: '/login' }), 2000); 
      } else {
          showNotification(res.error || "Lỗi", "error");
      }
      setIsSending(false);
  };

  const handleUpdateEmail = async () => {
      const userId = session?.user?.id as string;
      if (!userId) return showNotification("Lỗi phiên đăng nhập", "error");
      if (!newEmail || !otpCode) return showNotification("Vui lòng điền đủ Email mới.", "error");

      setIsSending(true);
      const res = await changeEmailAction(userId, securityInfo.email, newEmail, otpCode);
      if (res.success) {
          showNotification(res.message || "Thành công", "success");
          setTimeout(() => signOut({ callbackUrl: '/login' }), 2000); 
      } else {
          showNotification(res.error || "Lỗi", "error");
      }
      setIsSending(false);
  };

  if (!isDataLoaded) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-cyan-500 w-8 h-8"/></div>;

  return (
    <div className="animate-in fade-in flex flex-col gap-10 max-w-4xl">
        <div>
          <h2 className="text-xl font-black mb-1 flex items-center gap-2"><Key className="w-5 h-5 text-cyan-500"/> Đổi mật khẩu</h2>
          
          {securityInfo.isOAuth ? (
              <div className="p-4 mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl text-orange-700 dark:text-orange-400 text-sm font-medium">
                  Tài khoản của bạn được liên kết qua Google/Github. Bạn không thể đổi mật khẩu tại đây.
              </div>
          ) : (
              <>
                <p className="text-sm text-slate-500 mb-6">Đảm bảo mật khẩu của bạn dài ít nhất 8 ký tự.</p>
                <div className="flex flex-col gap-4 max-w-md">
                    {!forgotPassMode ? (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Mật khẩu hiện tại" className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors" />
                          <button onClick={() => { setForgotPassMode(true); setIsOtpVerified(false); }} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline text-right font-bold w-fit ml-auto mt-1">Quên mật khẩu?</button>
                        </div>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors" />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Xác nhận mật khẩu mới" className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors" />
                        <button disabled={isSaving} onClick={handleUpdatePassword} className="cursor-pointer px-6 py-3 bg-slate-800 dark:bg-slate-100 hover:bg-slate-900 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-md transition-colors mt-2 flex justify-center items-center gap-2">
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Check size={18} />}
                            Cập nhật mật khẩu
                        </button>
                      </>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-left-4 flex flex-col gap-4">
                          <div className="flex gap-2">
                              <input type="text" disabled value={securityInfo.email} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500" />
                              <button onClick={handleSendOtp} disabled={otpCountdown > 0 || isSaving} className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold text-sm shrink-0 disabled:opacity-50">
                                  {otpCountdown > 0 ? `Chờ ${otpCountdown}s` : 'Gửi mã'}
                              </button>
                          </div>
                          <div className="flex gap-2">
                              <input type="text" disabled={isOtpVerified} placeholder="Nhập mã xác thực (6 số)" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors disabled:opacity-60" />
                              {!isOtpVerified && (
                                  <button onClick={handleVerifyOtp} disabled={isSaving || !otpCode} className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-xl font-bold text-sm shrink-0 transition-colors">Xác nhận</button>
                              )}
                          </div>
                          {isOtpVerified && (
                              <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-4">
                                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors" />
                                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Xác nhận mật khẩu mới" className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors" />
                                  <button disabled={isSaving} onClick={handleUpdatePassword} className="cursor-pointer py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-md">
                                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Check size={18} />}
                                      Đặt lại mật khẩu
                                  </button>
                              </div>
                          )}
                          {!isOtpVerified && (
                              <button onClick={() => { setForgotPassMode(false); setIsOtpVerified(false); }} className="py-3 bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 mt-2">Hủy</button>
                          )}
                      </div>
                    )}
                </div>
              </>
          )}
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-black mb-1 flex items-center gap-2"><Mail className="w-5 h-5 text-cyan-500"/> Email đăng ký</h2>
          {!changeEmailMode ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                  <input type="email" disabled value={securityInfo.email} className="w-full max-w-md px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed" />
                  <button onClick={() => { setChangeEmailMode(true); setIsOtpVerified(false); }} className="px-6 py-3 bg-transparent border border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors shrink-0">Đổi Email</button>
              </div>
          ) : (
              <div className="animate-in fade-in flex flex-col gap-4 mt-4 max-w-md">
                  <div className="flex gap-2">
                      <input type="text" disabled={isOtpVerified} placeholder="Nhập mã xác thực gửi về Email cũ" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors disabled:opacity-60" />
                      {!isOtpVerified ? (
                          <div className="flex gap-1 shrink-0">
                              <button onClick={handleSendOtp} disabled={otpCountdown > 0 || isSaving} className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold text-sm disabled:opacity-50">
                                  {otpCountdown > 0 ? `Chờ ${otpCountdown}s` : 'Gửi mã'}
                              </button>
                              <button onClick={handleVerifyOtp} disabled={isSaving || !otpCode} className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-xl font-bold text-sm">Xác nhận</button>
                          </div>
                      ) : (
                          <div className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl font-bold text-sm flex items-center justify-center shrink-0"><Check className="w-5 h-5"/></div>
                      )}
                  </div>
                  {isOtpVerified && (
                      <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-4">
                          <input type="email" placeholder="Nhập Email mới" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="px-4 py-3 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-cyan-500 transition-colors" />
                          <button disabled={isSaving} onClick={handleUpdateEmail} className="cursor-pointer py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-md">
                              {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Check size={18} />}
                              Xác nhận đổi Email
                          </button>
                      </div>
                  )}
                  {!isOtpVerified && (
                      <button onClick={() => { setChangeEmailMode(false); setIsOtpVerified(false); }} className="py-3 bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 mt-2">Hủy</button>
                  )}
              </div>
          )}
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-red-800/80 dark:text-red-400/80 mb-1 flex items-center gap-2"><Trash2 className="w-5 h-5"/> Vùng nguy hiểm</h2>
          <p className="text-sm text-slate-500 mb-4">Sau khi xóa, mọi dữ liệu học tập, thẻ Wiki và bạn bè sẽ biến mất vĩnh viễn.</p>
          <button className="px-6 py-3 bg-transparent text-red-700/80 dark:text-red-400/80 font-semibold rounded-xl transition-colors border border-red-700/50 dark:border-red-400/50 hover:bg-red-50 dark:hover:bg-red-900/20">
              Xóa tài khoản vĩnh viễn
          </button>
        </div>
    </div>
  );
}