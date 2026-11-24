import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Cố định bên trái trên Desktop */}
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-w-0 h-full">
        {/* Header - Thanh trên cùng cố định */}
        <Header />

        {/* Vùng nội dung*/}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative">
          {children}
        </main>
      </div>

      {/* Mobile Nav - Thanh điều hướng dưới cùng cho điện thoại */}
      <MobileNav />
    </div>
  );
}