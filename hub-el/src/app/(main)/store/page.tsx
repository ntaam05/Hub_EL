"use client";

import { useState, useEffect } from "react";
import { 
  Crown, Gem, Zap, Coins, Check, 
  RefreshCw, Star, ArrowRightLeft, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { exchangeResources } from "@/actions/store";

const CORE_VIP_FEATURES = [
  "Năng lượng tối đa +50", 
  "Giảm 30% phí tạo AI Quiz", 
  "Tốc độ nhận XP & Xu +20%",
  "Bụi sao nhận được +20%", 
  "1 Lượt quay Gacha Free/ngày", 
  "Khung Chat Vàng & Tag PRO"
];

interface NotificationState {
  msg: string;
  type: 'success' | 'error';
}

export default function StorePage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'VIP' | 'COIN' | 'EXCHANGE'>('VIP');

  const [notification, setNotification] = useState<NotificationState | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Lắng nghe callback từ cổng thanh toán Momo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const orderId = params.get("orderId");

    if (status === "success" && orderId) {
      setLoadingId("VERIFYING"); 

      fetch("/api/momo/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ orderId })
      }).then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setNotification({ msg: "Thanh toán thành công! Tài khoản đã được cập nhật.", type: 'success' });
            update(); 
            
            // 🚨 ĐÃ FIX: Không reload trang nữa. Xóa rác trên URL để user ấn F5 không bị check lại
            window.history.replaceState(null, '', '/store');

            // Bắn tín hiệu kích hoạt tag PRO ngay lập tức trên Header và Sidebar
            window.dispatchEvent(new CustomEvent('updateUserStats', {
               detail: { isPro: true } 
            }));
          }
        })
        .finally(() => setLoadingId(null));
    }
  }, [update]); 

  const handlePurchase = async (type: 'VIP' | 'COIN', amount: number, name: string) => {
    try {
      setLoadingId(`${type}-${amount}`);
      const res = await fetch("/api/momo/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount, name }),
      });

      const data = await res.json();
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        setNotification({ msg: data.error || "Lỗi tạo thanh toán", type: 'error' });
      }
    } catch (error) {
      setNotification({ msg: "Không thể kết nối máy chủ thanh toán", type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  // ================================================================
  // 🚨 HÀM ĐỔI TÀI NGUYÊN (REAL-TIME UPDATE)
  // ================================================================
  const handleExchange = async (type: string) => {
    setLoadingId(`EXCHANGE-${type}`);
    const res = await exchangeResources(type);
    
    if (res.success && res.data) {
      setNotification({ msg: res.message, type: 'success' });

      let detailPayload: any = {};

      // Phân tích Trừ tài nguyên
      if (res.data.costField === 'premiumCoins') detailPayload.premiumCoinsDelta = -res.data.cost;
      if (res.data.costField === 'freeCoins') detailPayload.coinsDelta = -res.data.cost;

      // Phân tích Cộng tài nguyên
      if (res.data.rewardField === 'freeCoins') detailPayload.coinsDelta = (detailPayload.coinsDelta || 0) + res.data.reward;
      if (res.data.rewardField === 'aiTokens') detailPayload.energyDelta = res.data.reward;

      // Bắn tín hiệu sang Header để nhảy số tức thì
      window.dispatchEvent(new CustomEvent('updateUserStats', { detail: detailPayload }));
      setLoadingId(null);
    } else {
      setNotification({ msg: res.message || "Giao dịch thất bại", type: 'error' });
      setLoadingId(null); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24 bg-sky-50/30 dark:bg-transparent min-h-screen relative">
      
      {notification && (
        <div className={cn(
          "fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-top-5 duration-300",
          notification.type === 'success' 
            ? "bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400" 
            : "bg-white dark:bg-slate-900 border-red-500 text-red-600 dark:text-red-400"
        )}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="font-black text-sm uppercase tracking-tight">{notification.msg}</span>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[2rem] bg-blue-600 p-8 shadow-md flex flex-col items-center md:items-start text-center md:text-left border border-blue-500">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <Crown className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-3 border border-white/20">
            <Star size={12} className="fill-yellow-400 text-yellow-400" /> Hệ thống giao dịch
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic">
            Cửa Hàng Hub-EL
          </h1>
          <p className="mt-2 text-blue-100 text-sm font-medium max-w-lg">
            Nâng cấp tài khoản, mua tài nguyên và trao đổi vật phẩm.
          </p>
        </div>
      </div>

      <div className="flex justify-center md:justify-start">
        <div className="inline-flex p-1.5 bg-sky-100/60 dark:bg-slate-800/80 rounded-2xl overflow-x-auto w-full md:w-auto border border-sky-200/50 dark:border-transparent">
          <TabButton active={activeTab === 'VIP'} onClick={() => setActiveTab('VIP')} icon={<Crown size={16} />} text="Premium" activeColor="text-blue-600 dark:text-blue-400" />
          <TabButton active={activeTab === 'COIN'} onClick={() => setActiveTab('COIN')} icon={<Gem size={16} />} text="Mua Ngọc" activeColor="text-purple-600 dark:text-purple-400" />
          <TabButton active={activeTab === 'EXCHANGE'} onClick={() => setActiveTab('EXCHANGE')} icon={<ArrowRightLeft size={16} />} text="Trạm Tiếp Tế" activeColor="text-slate-800 dark:text-white" />
        </div>
      </div>

      <div className="pt-2">
        {activeTab === 'VIP' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <VipSpecialCard 
                title="Khởi Đầu" duration="1 Tháng" price={49000} 
                description="Trải nghiệm đầy đủ các đặc quyền PRO."
                onAction={() => handlePurchase('VIP', 49000, "Premium 1 Tháng")} 
                isLoading={loadingId === 'VIP-49000'}
              />
              <VipSpecialCard 
                title="Chuyên Gia" duration="6 Tháng" price={249000} 
                description="Lựa chọn tối ưu, tiết kiệm 15%."
                badge="Khuyên Dùng" isPopular={true}
                onAction={() => handlePurchase('VIP', 249000, "Premium 6 Tháng")} 
                isLoading={loadingId === 'VIP-249000'}
              />
              <VipSpecialCard 
                title="Huyền Thoại" duration="1 Năm" price={399000} 
                description="Đầu tư dài hạn, tiết kiệm 30%."
                onAction={() => handlePurchase('VIP', 399000, "Premium 1 Năm")} 
                isLoading={loadingId === 'VIP-399000'}
              />
            </div>

            <div className="bg-sky-100/50 dark:bg-[#0f172a] p-6 rounded-[2rem] border border-sky-200/60 dark:border-slate-800 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-sky-900 dark:text-white">Toàn bộ gói bao gồm các đặc quyền</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CORE_VIP_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-[13px] font-bold text-sky-800 dark:text-slate-300 bg-white/60 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-full shrink-0">
                      <Check size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'COIN' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <UnifiedCard 
              icon={<Gem size={32} className="text-purple-500" />} iconBg="bg-white dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20"
              title="200" subtitle="Ngọc"
              actionText={`${(20000).toLocaleString('vi-VN')} đ`}
              onAction={() => handlePurchase('COIN', 20000, "200 Ngọc")} isLoading={loadingId === 'COIN-20000'}
            />
            <UnifiedCard 
              icon={<Gem size={32} className="text-purple-500" />} iconBg="bg-white dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20"
              title="525" subtitle="Ngọc" badge="+5%"
              actionText={`${(50000).toLocaleString('vi-VN')} đ`}
              onAction={() => handlePurchase('COIN', 50000, "525 Ngọc")} isLoading={loadingId === 'COIN-50000'}
            />
            <UnifiedCard 
              icon={<Gem size={32} className="text-purple-500" />} iconBg="bg-white dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20"
              title="1.100" subtitle="Ngọc" badge="+10%"
              actionText={`${(100000).toLocaleString('vi-VN')} đ`}
              onAction={() => handlePurchase('COIN', 100000, "1100 Ngọc")} isLoading={loadingId === 'COIN-100000'}
            />
            <UnifiedCard 
              icon={<Gem size={32} className="text-purple-500" />} iconBg="bg-white dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20"
              title="2.300" subtitle="Ngọc" badge="+15%"
              actionText={`${(200000).toLocaleString('vi-VN')} đ`}
              onAction={() => handlePurchase('COIN', 200000, "2300 Ngọc")} isLoading={loadingId === 'COIN-200000'}
            />
            <UnifiedCard 
              icon={<Gem size={32} className="text-purple-500" />} iconBg="bg-white dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20"
              title="6.000" subtitle="Ngọc" badge="+20%"
              actionText={`${(500000).toLocaleString('vi-VN')} đ`}
              onAction={() => handlePurchase('COIN', 500000, "6000 Ngọc")} isLoading={loadingId === 'COIN-500000'}
            />
          </div>
        )}

        {activeTab === 'EXCHANGE' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UnifiedCard 
              icon={<Zap size={32} className="text-blue-500" />} iconBg="bg-white dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20"
              title="50" subtitle="Năng Lượng"
              actionContent={<div className="flex items-center justify-center gap-1.5">Đổi 50 <Gem size={14} className="text-purple-500"/></div>}
              onAction={() => handleExchange('GEM_TO_ENERGY')} isLoading={loadingId === 'EXCHANGE-GEM_TO_ENERGY'}
            />
            <UnifiedCard 
              icon={<Coins size={32} className="text-yellow-500" />} iconBg="bg-white dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20"
              title="1.000" subtitle="Xu Gacha"
              actionContent={<div className="flex items-center justify-center gap-1.5">Đổi 100 <Gem size={14} className="text-purple-500"/></div>}
              onAction={() => handleExchange('GEM_TO_COIN')} isLoading={loadingId === 'EXCHANGE-GEM_TO_COIN'}
            />
            <UnifiedCard 
              icon={<Zap size={32} className="text-blue-500" />} iconBg="bg-white dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20"
              title="10" subtitle="Năng Lượng"
              actionContent={<div className="flex items-center justify-center gap-1.5">Đổi 200 <Coins size={14} className="text-yellow-500"/></div>}
              onAction={() => handleExchange('COIN_TO_ENERGY')} isLoading={loadingId === 'EXCHANGE-COIN_TO_ENERGY'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, text, activeColor }: { active: boolean; onClick: () => void; icon: React.ReactNode; text: string; activeColor: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap",
        active ? `bg-white dark:bg-slate-700 shadow-sm ${activeColor}` : "text-sky-700 dark:text-slate-400 hover:text-blue-700 dark:hover:text-slate-200"
      )}
    >
      {icon} {text}
    </button>
  );
}

function VipSpecialCard({ title, duration, price, description, badge, isPopular, onAction, isLoading }: any) {
  return (
    <div className={cn(
      "flex flex-col p-6 rounded-[2rem] border transition-all relative h-full",
      isPopular 
        ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20 md:-translate-y-2 z-10" 
        : "bg-sky-50 dark:bg-[#0f172a] border-sky-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col items-start gap-1.5">
          {badge && (
            <span className="bg-yellow-400 text-yellow-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
              {badge}
            </span>
          )}
          <h3 className={cn("text-xl sm:text-2xl font-black uppercase italic leading-none", isPopular ? "text-white" : "text-sky-900 dark:text-white")}>
            {title}
          </h3>
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shrink-0", isPopular ? "bg-white/20 text-white" : "bg-sky-200/50 dark:bg-slate-800 text-sky-700 dark:text-slate-400")}>
          {duration}
        </span>
      </div>
      
      <p className={cn("text-xs font-semibold mb-6 flex-1", isPopular ? "text-blue-100" : "text-sky-600/80 dark:text-slate-500")}>
        {description}
      </p>

      <div className="mb-6 pb-6 border-b border-dashed border-sky-200/50 dark:border-slate-700/50">
        <div className={cn("flex items-end gap-1", isPopular ? "text-white" : "text-sky-950 dark:text-white")}>
          <span className="text-4xl font-black leading-none">{price.toLocaleString('vi-VN')}</span>
          <span className="text-lg font-bold mb-0.5">đ</span>
        </div>
      </div>

      <button 
        onClick={onAction} 
        disabled={isLoading} 
        className={cn(
          "w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all outline-none flex justify-center items-center gap-2",
          isPopular 
            ? "bg-white text-blue-700 hover:bg-blue-50 shadow-lg" 
            : "bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 hover:border-blue-400 text-blue-600 dark:text-white shadow-sm"
        )}
      >
        {isLoading ? <RefreshCw className="animate-spin w-5 h-5" /> : "Kích Hoạt"}
      </button>
    </div>
  );
}

function UnifiedCard({ icon, iconBg, title, subtitle, badge, actionText, actionContent, onAction, isLoading }: any) {
  return (
    <div className="flex flex-col items-center p-5 rounded-3xl bg-sky-50 dark:bg-[#0f172a] border border-sky-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 transition-all relative shadow-sm h-full">
      
      {badge && <span className="absolute top-3 right-3 text-[10px] font-black bg-emerald-500 text-white px-2 py-1 rounded-md">{badge}</span>}
      
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110", iconBg)}>
        {icon}
      </div>
      
      <div className="text-center mb-5 flex-1">
        <span className="text-2xl font-black text-sky-950 dark:text-white leading-none block mb-1">{title}</span>
        <span className="text-[10px] font-bold text-sky-600/80 dark:text-slate-400 uppercase tracking-widest">{subtitle}</span>
      </div>

      <button 
        onClick={onAction} 
        disabled={isLoading} 
        className="mt-auto w-full py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 hover:border-blue-400 dark:hover:bg-slate-700/80 text-blue-700 dark:text-white font-black text-xs transition-all outline-none flex justify-center items-center gap-2 shadow-sm"
      >
        {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : (actionContent || actionText)}
      </button>

    </div>
  );
}