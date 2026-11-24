"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeTogglePill() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Workaround bug: Next.js SSR không thể biết trước giao diện của máy người dùng đang là Sáng hay Tối lúc render trên server. 
  // Bắt buộc phải chờ component mount xong trên Client thì mới render UI chính thức để ngăn chặn lỗi Hydration Mismatch (Server trả về Light nhưng Client lại là Dark).
  useEffect(() => setMounted(true), []);
  
  // Tối ưu UI: Thêm `shrink-0` vào khung xương (skeleton) để tránh việc bị Flexbox bên ngoài bóp méo lúc đang tải.
  if (!mounted) return <div className="w-[60px] h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />;

  // Logic: Bắt chuẩn xác trạng thái giao diện hiện tại, quét luôn cả trường hợp user cấu hình tự động đổi theo giờ hệ thống (systemTheme).
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return (
    <button
      // Tối ưu UI/UX: Thêm thuộc tính aria-label để hỗ trợ các thiết bị đọc màn hình cho người khiếm thị (Accessibility).
      aria-label="Toggle Dark Mode"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative flex items-center h-8 w-[60px] rounded-full transition-all duration-300 focus:outline-none shrink-0 shadow-inner border",
        isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-200/80 border-slate-300'
      )}
      title="Chuyển đổi Sáng/Tối"
    >
      <div className="absolute w-full flex justify-between px-1.5 pointer-events-none">
        <Moon className={cn("w-4 h-4 transition-opacity", isDark ? 'opacity-0' : 'text-slate-400')} />
        <Sun className={cn("w-4 h-4 transition-opacity", isDark ? 'text-slate-500' : 'opacity-0')} />
      </div>
      <div
        className={cn(
          "absolute left-1 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 shadow-[0_2px_5px_rgba(0,0,0,0.15)] border",
          isDark ? 'translate-x-0 bg-slate-800 border-slate-600 text-blue-400' : 'translate-x-[28px] bg-white border-slate-100 text-orange-500'
        )}
      >
        {isDark ? <Moon className="w-3.5 h-3.5 fill-current" /> : <Sun className="w-3.5 h-3.5 fill-current" />}
      </div>
    </button>
  );
}