import { Link, useLocation } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import {
  Home,
  ShoppingBag,
  Plus,
  User,
  MessageCircle,
  LogOut,
  Settings,
  Sun,
  Moon,
  Languages,
  MessageSquare,
  Shield,
  X,
  Menu,
  Mail,
  Phone
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const whatsappNumber = '6281234567890';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    language === 'en' ? 'Hello, I need help with KlikNesa' : 'Halo, saya butuh bantuan dengan KlikNesa'
  )}`;

  const menuItems = user
    ? [
        { icon: Home, label: t('nav.home'), path: '/home' },
        { icon: Plus, label: t('nav.sellItem'), path: '/create-listing' },
        { icon: ShoppingBag, label: t('nav.myListings'), path: '/my-listings' },
        { icon: MessageCircle, label: t('nav.messages'), path: '/conversations' },
        { icon: Shield, label: t('nav.admin'), path: '/admin' },
      ]
    : [
        { icon: Home, label: language === 'en' ? 'Home' : 'Beranda', path: '/' },
        { icon: User, label: t('nav.login'), path: '/login' },
        { icon: ShoppingBag, label: t('nav.signup'), path: '/signup' },
      ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-card border-r-2 border-border z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72 sm:w-80 lg:translate-x-0 lg:static shadow-2xl lg:shadow-none overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b-2 border-border bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <Link to={user ? '/home' : '/'} className="flex items-center gap-2 group" onClick={onClose}>
                <ShoppingBag className="size-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                <h1 className="text-2xl font-bold text-primary">KlikNesa</h1>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-accent transition-all duration-300"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* User Profile Section */}
            {user ? (
              <div className="bg-card border-2 border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-md">
                    <User className="size-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{user.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    {user.campus}
                  </span>
                  {user.trustBadge && (
                    <span className="px-2 py-1 bg-secondary/20 text-secondary-foreground rounded-full font-medium">
                      {language === 'en' ? 'Trusted' : 'Terpercaya'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-border rounded-xl p-4 text-center">
                <User className="size-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  {language === 'en' ? 'Sign in to access all features' : 'Masuk untuk akses semua fitur'}
                </p>
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex-1 py-2 text-center rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-all duration-300 text-sm"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={onClose}
                    className="flex-1 py-2 text-center rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-300 text-sm"
                  >
                    {t('nav.signup')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              {language === 'en' ? 'Navigation' : 'Navigasi'}
            </h3>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <item.icon
                  className={`size-5 transition-transform duration-300 ${
                    isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'
                  }`}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Settings Section */}
          <div className="p-4 space-y-4 border-t-2 border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3">
              {language === 'en' ? 'Settings' : 'Pengaturan'}
            </h3>

            {/* Theme Toggle */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <Sun className="size-5 text-primary" />
                  ) : (
                    <Moon className="size-5 text-primary" />
                  )}
                  <span className="font-medium text-sm">
                    {language === 'en' ? 'Theme' : 'Tema'}
                  </span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="relative w-14 h-7 bg-border rounded-full transition-all duration-300 hover:scale-105"
                >
                  <div
                    className={`absolute top-1 left-1 size-5 bg-primary rounded-full transition-transform duration-300 ${
                      theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`flex-1 py-1.5 rounded-lg transition-all duration-300 ${
                    theme === 'light'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {language === 'en' ? 'Light' : 'Terang'}
                </button>
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`flex-1 py-1.5 rounded-lg transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {language === 'en' ? 'Dark' : 'Gelap'}
                </button>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="size-5 text-primary" />
                <span className="font-medium text-sm">
                  {language === 'en' ? 'Language' : 'Bahasa'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('id')}
                  className={`flex-1 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                    language === 'id'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card text-muted-foreground hover:bg-accent'
                  }`}
                >
                  🇮🇩 Indonesia
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                    language === 'en'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card text-muted-foreground hover:bg-accent'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            {/* Contact via WhatsApp */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#20BA5A] transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg group"
            >
              <MessageSquare className="size-5 group-hover:scale-110 transition-transform duration-300" />
              <span>{t('contact.chatOnWhatsApp')}</span>
            </a>

            {/* Contact Page Link */}
            <Link
              to="/contact"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-accent transition-all duration-300 group"
            >
              <Phone className="size-5 text-primary group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">{t('contact.title')}</span>
            </Link>

            {/* Sign Out */}
            {user && (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-destructive/20 text-destructive hover:bg-destructive/10 transition-all duration-300 group"
              >
                <LogOut className="size-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">{t('nav.signOut')}</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-border text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 KlikNesa
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'en' ? 'UNESA Student Marketplace' : 'Pasar Mahasiswa UNESA'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg hover:bg-accent transition-all duration-300 hover:scale-105"
      aria-label="Toggle menu"
    >
      <Menu className="size-6" />
    </button>
  );
}
