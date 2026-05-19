import { useState } from 'react';
import { useAuth } from './AuthContext';
import Sidebar, { MobileMenuButton } from './Sidebar';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Don't show sidebar on public pages unless user is logged in
  const shouldShowSidebar = showSidebar && (user !== null);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {shouldShowSidebar && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {shouldShowSidebar && (
          <header className="lg:hidden bg-card border-b-2 border-border p-4 flex items-center justify-between shadow-sm">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            <Link to="/home" className="flex items-center gap-2">
              <ShoppingBag className="size-6 text-primary" />
              <h1 className="text-xl font-bold text-primary">KlikNesa</h1>
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
