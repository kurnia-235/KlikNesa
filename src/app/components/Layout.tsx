import { useState } from 'react';
import { useAuth } from './AuthContext';
import Sidebar, { MobileMenuButton } from './Sidebar';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  fullHeight?: boolean;
}

export default function Layout({ children, showSidebar = true, fullHeight = false }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const shouldShowSidebar = showSidebar && user !== null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {shouldShowSidebar && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/*
        Konten utama.
        Desktop: flex-1 otomatis menyesuaikan sisa ruang saat sidebar hover-expand.
        Mobile:  sidebar adalah fixed overlay, flex-1 tetap mengisi penuh.
      */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top navbar — hanya tampil di mobile (sidebar desktop selalu visible) */}
        {shouldShowSidebar && (
          <header className="lg:hidden shrink-0 bg-card border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm z-10">
            <MobileMenuButton onClick={() => setSidebarOpen((prev) => !prev)} />
            <Link to="/dashboard" className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              <span className="text-base font-bold text-primary tracking-tight">KlikNesa</span>
            </Link>
          </header>
        )}

        <main className={`flex-1 ${fullHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
