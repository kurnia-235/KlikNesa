import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { useUserMode } from './UserModeContext';
import { supabase } from '../../../utils/supabase/client';
import {
  Home,
  ShoppingBag,
  Heart,
  ClipboardList,
  Plus,
  Package,
  User,
  MessageCircle,
  Sun,
  Moon,
  Shield,
  X,
  Menu,
  Phone,
  Store,
  Clock,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Shared class helpers ──────────────────────────────────────────────────────

// Text/element that fades in when sidebar expands on desktop
const fadeOnExpand =
  'opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-200 lg:delay-75 lg:group-hover/sidebar:delay-0';

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { mode, setMode } = useUserMode();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Seller listing count ──────────────────────────────────────────────────
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    if (!user || mode !== 'seller') return;
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .then(({ count, error }) => {
        if (!error && count !== null) setListingCount(count);
      });
  }, [user?.id, mode]);

  const isActive = (path: string) => location.pathname === path;

  const buyerItems = user
    ? [
        { icon: Home,          label: language === 'en' ? 'Browse'           : 'Beranda',         path: '/home' },
        { icon: MessageCircle, label: language === 'en' ? 'Messages'         : 'Pesan',           path: '/conversations' },
        { icon: Heart,         label: language === 'en' ? 'Wishlist'          : 'Disimpan',         path: '/wishlist' },
        { icon: ClipboardList, label: language === 'en' ? 'Purchase History' : 'Riwayat Belanja',  path: '/orders' },
      ]
    : [
        { icon: Home,        label: language === 'en' ? 'Home'   : 'Beranda', path: '/' },
        { icon: User,        label: t('nav.login'),                             path: '/login' },
        { icon: ShoppingBag, label: t('nav.signup'),                            path: '/signup' },
      ];

  const sellerItems = [
    { icon: Package,       label: language === 'en' ? 'My Listings' : 'Listing Saya', path: '/my-listings' },
    { icon: MessageCircle, label: language === 'en' ? 'Messages'    : 'Pesan',         path: '/conversations' },
    { icon: Shield,        label: language === 'en' ? 'Admin'       : 'Admin',         path: '/admin' },
  ];

  const navItems = user && mode === 'seller' ? sellerItems : buyerItems;

  return (
    <>
      {/* ── Mobile backdrop — klik untuk tutup sidebar ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SIDEBAR
          Mobile  : fixed overlay, toggle dengan isOpen, w-64
          Desktop : static dalam flex, w-16 (collapsed) → hover → w-64
      ══════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          group/sidebar
          fixed lg:static
          inset-y-0 left-0
          h-screen
          z-50 lg:z-auto
          flex flex-col shrink-0
          bg-card border-r border-border
          overflow-hidden
          shadow-2xl lg:shadow-none
          transition-all duration-300 ease-in-out
          w-64 lg:w-16 lg:hover:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">

          {/* ── Header: logo + tombol tutup (mobile only) ── */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-border shrink-0 min-h-[52px]">
            <Link
              to={user ? '/home' : '/'}
              onClick={onClose}
              className="flex items-center gap-2 overflow-hidden"
            >
              <ShoppingBag className="size-5 text-primary shrink-0" />
              <span className={`text-base font-bold text-primary tracking-tight whitespace-nowrap ${fadeOnExpand}`}>
                KlikNesa
              </span>
            </Link>
            {/* Tombol X — hanya di mobile */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-accent transition-colors lg:hidden shrink-0"
              aria-label="Tutup menu"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* ── Profil / guest ── */}
          <div className="px-2 py-2 border-b border-border shrink-0">
            {user ? (
              <>
                {/* Card profil */}
                <button
                  onClick={() => { onClose(); navigate('/profile-settings'); }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent/60 transition-all text-left"
                  title={language === 'en' ? 'Profile Settings' : 'Pengaturan Profil'}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="size-8 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="size-8 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`flex-1 min-w-0 ${fadeOnExpand}`}>
                    <p className="text-sm font-semibold text-foreground truncate whitespace-nowrap leading-tight">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate whitespace-nowrap leading-tight">
                      {user.campus}
                    </p>
                  </div>
                  <span className={`text-xs text-muted-foreground shrink-0 ${fadeOnExpand}`}>⚙</span>
                </button>

                {/* Role switcher — hidden desktop collapsed, shown on hover */}
                <div className="mt-2 flex lg:hidden lg:group-hover/sidebar:flex">
                  {mode === 'seller' ? (
                    /* In seller mode → show "switch back to buyer" */
                    <button
                      onClick={() => { setMode('buyer'); navigate('/home'); }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Heart className="size-3 shrink-0" />
                      <span className="whitespace-nowrap">
                        {language === 'en' ? 'Switch to Buyer' : 'Mode Pembeli'}
                      </span>
                    </button>
                  ) : (user?.sellerStatus ?? 'unverified') === 'pending' ? (
                    /* Pending review → informational state */
                    <button
                      onClick={() => { onClose(); navigate('/seller-verification'); }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/40 hover:bg-amber-500/20 transition-colors"
                    >
                      <Clock className="size-3 shrink-0" />
                      <span className="whitespace-nowrap">
                        {language === 'en' ? 'Pending Review' : 'Sedang Ditinjau'}
                      </span>
                    </button>
                  ) : (user?.sellerStatus ?? 'unverified') === 'verified' ? (
                    /* Verified → activate seller mode directly */
                    <button
                      onClick={() => { setMode('seller'); navigate('/home'); }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Store className="size-3 shrink-0" />
                      <span className="whitespace-nowrap">
                        {language === 'en' ? 'Seller Mode' : 'Mode Penjual'}
                      </span>
                    </button>
                  ) : (
                    /* Unverified / rejected → go to verification page */
                    <button
                      onClick={() => { onClose(); navigate('/seller-verification'); }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Store className="size-3 shrink-0" />
                      <span className="whitespace-nowrap">
                        {language === 'en' ? 'Become a Seller' : 'Mode Penjual'}
                      </span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className={`flex gap-2 ${fadeOnExpand}`}>
                <Link to="/login" onClick={onClose} className="flex-1 py-1.5 text-center rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/10 transition-colors whitespace-nowrap">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" onClick={onClose} className="flex-1 py-1.5 text-center rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>

          {/* ── Navigasi ── */}
          <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 min-h-0 overflow-hidden">

            {/* Statistik penjual — hanya saat seller mode, disembunyikan collapsed */}
            {user && mode === 'seller' && (
              <>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-2 mb-2 text-center lg:hidden lg:group-hover/sidebar:grid">
                  <div>
                    <p className="text-sm font-bold text-foreground">{listingCount}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{language === 'en' ? 'Listings' : 'Listing'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{user.transactionCount}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{language === 'en' ? 'Trx' : 'Transaksi'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Rp–</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{language === 'en' ? 'Revenue' : 'Pendapatan'}</p>
                  </div>
                </div>

                {/* CTA Jual Barang — ikon saja saat collapsed, teks saat hover */}
                <Link
                  to="/create-listing"
                  onClick={onClose}
                  className="flex items-center h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors mb-2"
                  title={language === 'en' ? 'Sell Item' : 'Jual Barang'}
                >
                  <div className="w-10 h-9 flex items-center justify-center shrink-0 ml-1">
                    <Plus className="size-4" />
                  </div>
                  <span className={`whitespace-nowrap ml-1 pr-3 ${fadeOnExpand}`}>
                    {language === 'en' ? 'Sell Item' : 'Jual Barang'}
                  </span>
                </Link>
              </>
            )}

            {/* Label seksi — disembunyikan saat collapsed */}
            <p className={`px-1 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap ${fadeOnExpand}`}>
              {language === 'en' ? 'Navigation' : 'Navigasi'}
            </p>

            {/* Nav items */}
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={item.label}
                className={`flex items-center h-10 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0 ml-1">
                  <item.icon className="size-5" />
                </div>
                <span className={`text-sm font-medium whitespace-nowrap ml-2 ${fadeOnExpand}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* ── Settings bawah ── */}
          <div className="px-2 py-2 border-t border-border flex flex-col gap-1 shrink-0">

            {/* Hubungi Kami */}
            <Link
              to="/contact"
              onClick={onClose}
              title={language === 'en' ? 'Contact Us' : 'Hubungi Kami'}
              className="flex items-center h-10 rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0 ml-1">
                <Phone className="size-4 text-primary" />
              </div>
              <span className={`whitespace-nowrap ml-2 ${fadeOnExpand}`}>
                {language === 'en' ? 'Contact Us' : 'Hubungi Kami'}
              </span>
            </Link>

            {/* Baris: tema + bahasa */}
            <div className="flex items-center overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center shrink-0 ml-1">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  aria-label={theme === 'light' ? 'Mode gelap' : 'Mode terang'}
                  title={theme === 'light' ? 'Dark mode' : 'Light mode'}
                >
                  {theme === 'light'
                    ? <Moon className="size-4 text-foreground" />
                    : <Sun className="size-4 text-foreground" />}
                </button>
              </div>
              <div className={`flex-1 overflow-hidden ml-2 pr-2 ${fadeOnExpand}`}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                  className="w-full text-xs bg-muted/50 border border-border rounded-md px-2 py-1.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="id">🇮🇩 Indonesia</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
            </div>

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
      className="p-2 rounded-lg hover:bg-accent transition-colors"
      aria-label="Buka menu"
    >
      <Menu className="size-5" />
    </button>
  );
}
